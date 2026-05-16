import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// In-memory ICE candidate store (candidates are transient; in production use Redis)
const iceCandidateStore = new Map<string, {
  offerCandidates: string[]
  answerCandidates: string[]
  updatedAt: number
}>()

function getKey(consultationId: string) {
  return `ice:${consultationId}`
}

// GET /api/caregrid/consultations/[id]/webrtc-signal
// Poll for signaling data (offer, answer, ICE candidates)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const { id: consultationId } = await params

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(authUser.id)
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: {
      requestingNurseId: true,
      consultingNurseId: true,
      webrtcOffer: true,
      webrtcAnswer: true,
    },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const key = getKey(consultationId)
  const iceData = iceCandidateStore.get(key)

  return NextResponse.json({
    offer: consultation.webrtcOffer || null,
    answer: consultation.webrtcAnswer || null,
    offerCandidates: iceData?.offerCandidates || [],
    answerCandidates: iceData?.answerCandidates || [],
  })
}

// POST /api/caregrid/consultations/[id]/webrtc-signal
// Send signaling data (offer, answer, ICE candidate)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const { id: consultationId } = await params

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(authUser.id)
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: { requestingNurseId: true, consultingNurseId: true },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let body: { type: string; sdp?: string; candidate?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const isRequester = consultation.requestingNurseId === nurseId
  const key = getKey(consultationId)
  const iceData = iceCandidateStore.get(key) || {
    offerCandidates: [] as string[],
    answerCandidates: [] as string[],
    updatedAt: Date.now(),
  }

  switch (body.type) {
    case 'offer':
      if (!isRequester) {
        return NextResponse.json({ error: 'Only requester can send offer' }, { status: 403 })
      }
      // Store offer in consultation record
      await db.consultation.update({
        where: { id: consultationId },
        data: { webrtcOffer: body.sdp, webrtcAnswer: null },
      })
      // Reset ICE candidates for new offer
      iceData.offerCandidates = []
      iceData.answerCandidates = []
      break

    case 'answer':
      if (isRequester) {
        return NextResponse.json({ error: 'Only consultant can send answer' }, { status: 403 })
      }
      // Store answer in consultation record
      await db.consultation.update({
        where: { id: consultationId },
        data: { webrtcAnswer: body.sdp },
      })
      break

    case 'offer-candidate':
      if (isRequester && body.candidate) {
        iceData.offerCandidates = [...(iceData.offerCandidates || []), body.candidate]
      }
      break

    case 'answer-candidate':
      if (!isRequester && body.candidate) {
        iceData.answerCandidates = [...(iceData.answerCandidates || []), body.candidate]
      }
      break

    default:
      return NextResponse.json({ error: 'Invalid signal type' }, { status: 400 })
  }

  iceData.updatedAt = Date.now()
  iceCandidateStore.set(key, iceData)

  return NextResponse.json({ success: true })
}
