import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/nurseai/medications - List medication orders scoped to nurse's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // 🔒 FACILITY ISOLATION: Require a facility assignment to view medications
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show medications for patients in the nurse's facility (mandatory)
    where.patient = { facilityId }

    if (patientId) where.patientId = patientId
    if (status) where.status = status

    const [medications, total] = await Promise.all([
      db.medicationOrder.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
          verifiedBy: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.medicationOrder.count({ where }),
    ])

    return NextResponse.json({
      medications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json({ error: 'Failed to fetch medications' }, { status: 500 })
  }
}

// POST /api/nurseai/medications - Create a medication order
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.patientId || !body.recordId || !body.medicationName || !body.dosage) {
      return NextResponse.json(
        { error: 'Patient ID, medical record ID, medication name, and dosage are required' },
        { status: 400 }
      )
    }

    // Verify the medical record exists and belongs to the nurse's facility
    const medicalRecord = await db.medicalRecord.findUnique({
      where: { id: body.recordId },
    })
    if (!medicalRecord) {
      return NextResponse.json(
        { error: 'Medical record not found. A valid record ID is required to create medication orders.' },
        { status: 404 }
      )
    }

    // 🔒 Verify record belongs to the nurse's facility
    if (medicalRecord.facilityId !== facilityId) {
      return NextResponse.json(
        { error: 'You can only create medication orders for records in your facility.' },
        { status: 403 }
      )
    }

    const validStatuses = ['PENDING', 'VERIFIED', 'ADMINISTERED', 'HELD', 'DISCONTINUED']
    const status = body.status ? body.status.toUpperCase() : 'PENDING'
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const medication = await db.medicationOrder.create({
      data: {
        patientId: body.patientId,
        recordId: body.recordId,
        prescribedByDoctorId: body.prescribedByDoctorId || null,
        medicationName: body.medicationName,
        dosage: body.dosage,
        route: body.route || 'Oral',
        frequency: body.frequency || 'Once daily',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
        duration: body.duration || null,
        status,
        interactionAlerts: body.interactionAlerts || null,
        notes: body.notes || null,
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
      { message: 'Medication order created successfully', medication },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating medication order:', error)
    return NextResponse.json({ error: 'Failed to create medication order' }, { status: 500 })
  }
}
