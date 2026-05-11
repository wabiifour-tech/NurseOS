import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/nurseai/vitals - List vitals scoped to nurse's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // 🔒 FACILITY ISOLATION: Require a facility assignment to view vitals
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show vitals for patients in the nurse's facility (mandatory)
    where.patient = { facilityId }

    if (patientId) {
      where.patientId = patientId
    }

    const [vitals, total] = await Promise.all([
      db.vitalSign.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              dateOfBirth: true,
              gender: true,
              facilityId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  displayName: true,
                },
              },
            },
          },
          recordedBy: {
            select: {
              id: true,
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      db.vitalSign.count({ where }),
    ])

    return NextResponse.json({
      vitals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching vitals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vitals' },
      { status: 500 }
    )
  }
}

// POST /api/nurseai/vitals - Record new vital signs
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    // Verify patient exists AND belongs to the same facility
    const patient = await db.patientProfile.findUnique({
      where: { id: body.patientId },
    })
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // 🔒 Verify patient belongs to the nurse's facility
    if (patient.facilityId && patient.facilityId !== facilityId) {
      return NextResponse.json(
        { error: 'You can only record vitals for patients in your facility.' },
        { status: 403 }
      )
    }

    // Calculate BMI if weight and height are provided
    let bmi: number | undefined
    if (body.weight && body.height && body.height > 0) {
      const heightM = body.height / 100
      bmi = Math.round((body.weight / (heightM * heightM)) * 10) / 10
    }

    // Determine if vitals are abnormal
    const isAbnormal =
      (body.temperature && (body.temperature >= 38.0 || body.temperature <= 35.0)) ||
      (body.heartRate && (body.heartRate >= 110 || body.heartRate <= 50)) ||
      (body.bloodPressureSystolic && (body.bloodPressureSystolic >= 140 || body.bloodPressureSystolic <= 90)) ||
      (body.oxygenSaturation && body.oxygenSaturation <= 94) ||
      (body.respiratoryRate && (body.respiratoryRate >= 22 || body.respiratoryRate <= 10))

    // Calculate a simplified early warning score
    let earlyWarningScore = 0
    if (body.respiratoryRate) {
      if (body.respiratoryRate <= 8 || body.respiratoryRate >= 25) earlyWarningScore += 3
      else if (body.respiratoryRate >= 21) earlyWarningScore += 2
      else if (body.respiratoryRate <= 11) earlyWarningScore += 1
    }
    if (body.oxygenSaturation) {
      if (body.oxygenSaturation <= 91) earlyWarningScore += 3
      else if (body.oxygenSaturation <= 93) earlyWarningScore += 2
      else if (body.oxygenSaturation <= 95) earlyWarningScore += 1
    }
    if (body.temperature) {
      if (body.temperature <= 35) earlyWarningScore += 3
      else if (body.temperature >= 39.1) earlyWarningScore += 2
      else if (body.temperature <= 36) earlyWarningScore += 1
    }
    if (body.bloodPressureSystolic) {
      if (body.bloodPressureSystolic <= 90 || body.bloodPressureSystolic >= 220) earlyWarningScore += 3
      else if (body.bloodPressureSystolic <= 100) earlyWarningScore += 2
      else if (body.bloodPressureSystolic <= 110) earlyWarningScore += 1
    }
    if (body.heartRate) {
      if (body.heartRate <= 40 || body.heartRate >= 131) earlyWarningScore += 3
      else if (body.heartRate >= 111) earlyWarningScore += 2
      else if (body.heartRate >= 91) earlyWarningScore += 1
    }

    const vital = await db.vitalSign.create({
      data: {
        patientId: body.patientId,
        recordId: body.recordId || null,
        recordedByNurseId: authUser.nurseProfileId || null,
        temperature: body.temperature || null,
        heartRate: body.heartRate || null,
        respiratoryRate: body.respiratoryRate || null,
        bloodPressureSystolic: body.bloodPressureSystolic || null,
        bloodPressureDiastolic: body.bloodPressureDiastolic || null,
        oxygenSaturation: body.oxygenSaturation || null,
        weight: body.weight || null,
        height: body.height || null,
        bmi,
        bloodGlucose: body.bloodGlucose || null,
        painScale: body.painScale || null,
        consciousnessLevel: body.consciousnessLevel || null,
        earlyWarningScore,
        isAbnormal: isAbnormal || false,
        notes: body.notes || null,
        source: body.source || 'MANUAL',
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Vitals recorded successfully', vital },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error recording vitals:', error)
    return NextResponse.json(
      { error: 'Failed to record vitals' },
      { status: 500 }
    )
  }
}
