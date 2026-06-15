import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// POST /api/calls/initiate
// Create a new video/voice call consultation and set it to ACTIVE
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  let body: {
    consultingNurseId: string
    callType: 'VIDEO' | 'PHONE'
    subject?: string
    patientId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { consultingNurseId, callType, subject, patientId } = body

  if (!consultingNurseId) {
    return NextResponse.json({ error: 'Consulting nurse ID is required' }, { status: 400 })
  }

  if (!callType || !['VIDEO', 'PHONE'].includes(callType)) {
    return NextResponse.json({ error: 'Call type must be VIDEO or PHONE' }, { status: 400 })
  }

  const nurseId = await getNurseProfileId(authUser.id)
  if (!nurseId) {
    return NextResponse.json({ error: 'Only nurses can initiate calls' }, { status: 403 })
  }

  if (nurseId === consultingNurseId) {
    return NextResponse.json({ error: 'Cannot call yourself' }, { status: 400 })
  }

  // Verify the consulting nurse exists
  const consultingNurse = await db.nurseProfile.findUnique({
    where: { id: consultingNurseId },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  if (!consultingNurse) {
    return NextResponse.json({ error: 'Consulting nurse not found' }, { status: 404 })
  }

  // Create the consultation as ACTIVE (call is starting immediately)
  const consultation = await db.consultation.create({
    data: {
      requestingNurseId: nurseId,
      consultingNurseId,
      consultationType: callType,
      subject: subject || `${callType === 'VIDEO' ? 'Video' : 'Voice'} Call`,
      description: `${callType === 'VIDEO' ? 'Video' : 'Voice'} call initiated from NurseOS`,
      status: 'ACTIVE',
      startedAt: new Date(),
      patientId: patientId || null,
    },
    include: {
      requestingNurse: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          specialization: true,
        },
      },
      consultingNurse: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          specialization: true,
        },
      },
    },
  })

  return NextResponse.json({
    consultation: {
      id: consultation.id,
      consultationType: consultation.consultationType,
      subject: consultation.subject,
      status: consultation.status,
      startedAt: consultation.startedAt,
      requestingNurse: consultation.requestingNurse,
      consultingNurse: consultation.consultingNurse,
    },
  }, { status: 201 })
}
