import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'

const VALID_ENCOUNTER_TYPES = [
  'ADMISSION',
  'EMERGENCY',
  'FOLLOW_UP',
  'ROUTINE_CHECK',
  'DISCHARGE',
  'CONSULTATION',
  'SURGERY',
  'INPATIENT',
  'OUTPATIENT',
]

const VALID_STATUSES = ['ACTIVE', 'DISCHARGED', 'PENDING', 'CLOSED', 'CRITICAL']

// GET /api/nurseai/records - List medical records scoped to nurse's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const status = searchParams.get('status')
    const encounterType = searchParams.get('encounterType')
    const search = searchParams.get('search')

    // 🔒 FACILITY ISOLATION: Require a facility assignment to view records
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show records from the nurse's facility (mandatory)
    where.facilityId = facilityId

    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      where.status = status.toUpperCase()
    }
    if (encounterType && VALID_ENCOUNTER_TYPES.includes(encounterType.toUpperCase())) {
      where.encounterType = encounterType.toUpperCase()
    }
    if (search) {
      where.OR = [
        { chiefComplaint: { contains: search } },
        { patient: { user: { firstName: { contains: search } } } },
        { patient: { user: { lastName: { contains: search } } } },
        { patient: { user: { displayName: { contains: search } } } },
        { attendingNurse: { user: { firstName: { contains: search } } } },
        { attendingNurse: { user: { lastName: { contains: search } } } },
      ]
    }

    const [records, total] = await Promise.all([
      db.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: {
                select: { firstName: true, lastName: true, displayName: true },
              },
            },
          },
          attendingNurse: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.medicalRecord.count({ where }),
    ])

    const formattedRecords = records.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      facilityId: r.facilityId,
      encounterType: r.encounterType,
      chiefComplaint: r.chiefComplaint,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      patient: {
        id: r.patient.id,
        patientId: r.patient.patientId,
        user: {
          firstName: r.patient.user.firstName,
          lastName: r.patient.user.lastName,
          displayName: r.patient.user.displayName,
        },
      },
      attendingNurse: r.attendingNurse
        ? {
            id: r.attendingNurse.id,
            user: {
              firstName: r.attendingNurse.user.firstName,
              lastName: r.attendingNurse.user.lastName,
            },
          }
        : null,
    }))

    return NextResponse.json({
      records: formattedRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching medical records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    )
  }
}

// POST /api/nurseai/records - Create medical record scoped to nurse's facility
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    const body = await request.json()
    const { patientId, chiefComplaint, encounterType, status } = body

    if (!patientId || !chiefComplaint) {
      return NextResponse.json(
        { error: 'patientId and chiefComplaint are required' },
        { status: 400 }
      )
    }

    // Verify patient exists AND belongs to the same facility
    const patient = await db.patientProfile.findUnique({
      where: { id: patientId },
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
        { error: 'You can only create records for patients in your facility.' },
        { status: 403 }
      )
    }

    const encType =
      encounterType && VALID_ENCOUNTER_TYPES.includes(encounterType.toUpperCase())
        ? encounterType.toUpperCase()
        : 'ADMISSION'

    const recStatus =
      status && VALID_STATUSES.includes(status.toUpperCase())
        ? status.toUpperCase()
        : 'ACTIVE'

    // Use the nurse's facility instead of the broken findFirst()
    const record = await db.medicalRecord.create({
      data: {
        patientId,
        facilityId, // 🔒 Auto-assign to nurse's facility
        encounterType: encType,
        chiefComplaint,
        status: recStatus,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: { firstName: true, lastName: true, displayName: true },
            },
          },
        },
        attendingNurse: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    return NextResponse.json(
      {
        record: {
          id: record.id,
          patientId: record.patientId,
          facilityId: record.facilityId,
          encounterType: record.encounterType,
          chiefComplaint: record.chiefComplaint,
          status: record.status,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
          patient: {
            id: record.patient.id,
            patientId: record.patient.patientId,
            user: {
              firstName: record.patient.user.firstName,
              lastName: record.patient.user.lastName,
              displayName: record.patient.user.displayName,
            },
          },
          attendingNurse: record.attendingNurse
            ? {
                id: record.attendingNurse.id,
                user: {
                  firstName: record.attendingNurse.user.firstName,
                  lastName: record.attendingNurse.user.lastName,
                },
              }
            : null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating medical record:', error)
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    )
  }
}
