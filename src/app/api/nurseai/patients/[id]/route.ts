import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/nurseai/patients/[id] - Get a single patient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch nursing notes through medical records
    const nursingNotes = await db.nursingNote.findMany({
      where: {
        medicalRecord: {
          patientId: id,
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
