import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility, crossFacilityDeniedResponse } from '@/lib/auth'

// GET /api/nurseai/patients/[id] - Get a single patient by ID
// 🔒 FACILITY ISOLATION: Nurses can only view patients in their own facility
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment to view patient data
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    const { id } = await params

    const patient = await db.patientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 50,
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        medications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        labOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // 🔒 FACILITY ISOLATION: Verify the patient belongs to the nurse's facility
    // If patient has no facilityId, allow access (legacy data); otherwise must match
    if (patient.facilityId && patient.facilityId !== facilityId) {
      return crossFacilityDeniedResponse()
    }

    // Fetch nursing notes through medical records (scoped to facility)
    const nursingNotes = await db.nursingNote.findMany({
      where: {
        medicalRecord: {
          patientId: id,
          facilityId, // 🔒 Only get notes from this facility's records
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      patient: {
        ...patient,
        nursingNotes,
      },
    })
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}
