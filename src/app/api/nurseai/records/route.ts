import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseai/records - List medical records
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const encounterType = searchParams.get('encounterType') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (encounterType) where.encounterType = encounterType
    if (status) where.status = status

    const [records, total] = await Promise.all([
      db.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
          attendingNurse: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.medicalRecord.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching medical records:', error)
    return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 })
  }
}

// POST /api/nurseai/records - Create a medical record
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const body = await request.json()

    if (!body.patientId || !body.chiefComplaint) {
      return NextResponse.json(
        { error: 'Patient ID and chief complaint are required' },
        { status: 400 }
      )
    }

    const validEncounterTypes = ['ADMISSION', 'EMERGENCY', 'FOLLOW_UP', 'ROUTINE_CHECK', 'DISCHARGE', 'CONSULTATION', 'SURGERY']
    const encounterType = body.encounterType?.toUpperCase() || 'ADMISSION'
    if (!validEncounterTypes.includes(encounterType)) {
      return NextResponse.json(
        { error: `Invalid encounter type. Must be one of: ${validEncounterTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const record = await db.medicalRecord.create({
      data: {
        patientId: body.patientId,
        attendingNurseId: body.attendingNurseId || authUser.id,
        encounterType,
        chiefComplaint: body.chiefComplaint,
        diagnosis: body.diagnosis || null,
        treatmentPlan: body.treatmentPlan || null,
        clinicalNotes: body.clinicalNotes || null,
        status: body.status || 'ACTIVE',
        admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
        dischargeDate: body.dischargeDate ? new Date(body.dischargeDate) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Medical record created successfully', record },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating medical record:', error)
    return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 })
  }
}
