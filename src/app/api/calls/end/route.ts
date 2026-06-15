import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// POST /api/calls/end
// End an active call (video or voice)
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  let body: { consultationId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { consultationId } = body
  if (!consultationId) {
    return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 })
  }

  const nurseId = await getNurseProfileId(authUser.id)
  if (!nurseId) {
    return NextResponse.json({ error: 'Only nurses can end calls' }, { status: 403 })
  }

  // Verify the consultation exists and user is part of it
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: {
      requestingNurseId: true,
      consultingNurseId: true,
      status: true,
    },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // End the call
  const updated = await db.consultation.update({
    where: { id: consultationId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
    },
  })

  // Clean up ICE candidates
  await db.callSignal.deleteMany({
    where: { consultationId },
  })

  return NextResponse.json({ success: true, consultation: updated })
}
