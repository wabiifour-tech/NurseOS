import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/calls/incoming
// Poll for incoming video/voice calls where the current user is the consulting nurse
// and there's a pending WebRTC offer (call is ringing)
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const nurseId = await getNurseProfileId(authUser.id)
  if (!nurseId) {
    return NextResponse.json({ incomingCalls: [] })
  }

  try {
    // Find consultations where:
    // - The user is the consulting nurse (callee)
    // - Status is ACTIVE (caller initiated)
    // - There's a WebRTC offer but no answer yet (call is ringing)
    // - Call hasn't ended
    const incomingCalls = await db.consultation.findMany({
      where: {
        consultingNurseId: nurseId,
        status: 'ACTIVE',
        webrtcOffer: { not: null },
        webrtcAnswer: null,
        endedAt: null,
        consultationType: { in: ['VIDEO', 'PHONE'] },
      },
      include: {
        requestingNurse: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = incomingCalls.map(call => ({
      id: call.id,
      subject: call.subject,
      consultationType: call.consultationType,
      startedAt: call.startedAt,
      caller: {
        id: call.requestingNurse.id,
        firstName: call.requestingNurse.user.firstName,
        lastName: call.requestingNurse.user.lastName,
        avatarUrl: call.requestingNurse.user.avatarUrl,
        specialization: call.requestingNurse.specialization,
      },
    }))

    return NextResponse.json({ incomingCalls: formatted })
  } catch (error) {
    console.error('Error fetching incoming calls:', error)
    return NextResponse.json({ error: 'Failed to fetch incoming calls' }, { status: 500 })
  }
}
