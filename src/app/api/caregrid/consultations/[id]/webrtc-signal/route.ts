import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getNurseProfileId } from '@/lib/auth'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/caregrid/consultations/[id]/webrtc-signal
// Poll for signaling data (offer, answer, ICE candidates)
export const GET = withAuth({}, async (ctx) => {
  const consultationId = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2, -1)[0]

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(ctx.id)
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: {
      requestingNurseId: true,
      consultingNurseId: true,
      webrtcOffer: true,
      webrtcAnswer: true,
      status: true,
      startedAt: true,
      endedAt: true,
    },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Fetch unconsumed ICE candidates from the database
  const signals = await db.callSignal.findMany({
    where: {
      consultationId,
      consumed: false,
    },
    orderBy: { createdAt: 'asc' },
  })

  const offerCandidates = signals
    .filter(s => s.signalType === 'offer-candidate')
    .map(s => s.candidate)

  const answerCandidates = signals
    .filter(s => s.signalType === 'answer-candidate')
    .map(s => s.candidate)

  return NextResponse.json({
    offer: consultation.webrtcOffer || null,
    answer: consultation.webrtcAnswer || null,
    offerCandidates,
    answerCandidates,
    status: consultation.status,
    endedAt: consultation.endedAt,
  })
})

// POST /api/caregrid/consultations/[id]/webrtc-signal
// Send signaling data (offer, answer, ICE candidate)
export const POST = withAuth({}, async (ctx) => {
  const consultationId = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2, -1)[0]

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(ctx.id)
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: {
      requestingNurseId: true,
      consultingNurseId: true,
      status: true,
      consultationType: true,
    },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let body: { type: string; sdp?: string; candidate?: string }
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const isRequester = consultation.requestingNurseId === nurseId

  switch (body.type) {
    case 'offer': {
      if (!isRequester) {
        return NextResponse.json({ error: 'Only requester can send offer' }, { status: 403 })
      }
      // Store offer in consultation record and set status to ACTIVE
      await db.consultation.update({
        where: { id: consultationId },
        data: {
          webrtcOffer: body.sdp,
          webrtcAnswer: null,
          status: 'ACTIVE',
          startedAt: new Date(),
        },
      })
      // Clear old ICE candidates for this consultation
      await db.callSignal.deleteMany({
        where: { consultationId },
      })
      break
    }

    case 'answer': {
      if (isRequester) {
        return NextResponse.json({ error: 'Only consultant can send answer' }, { status: 403 })
      }
      // Store answer in consultation record
      await db.consultation.update({
        where: { id: consultationId },
        data: { webrtcAnswer: body.sdp },
      })
      break
    }

    case 'offer-candidate': {
      if (!isRequester || !body.candidate) break
      await db.callSignal.create({
        data: {
          consultationId,
          senderId: nurseId,
          signalType: 'offer-candidate',
          candidate: body.candidate,
        },
      })
      break
    }

    case 'answer-candidate': {
      if (isRequester || !body.candidate) break
      await db.callSignal.create({
        data: {
          consultationId,
          senderId: nurseId,
          signalType: 'answer-candidate',
          candidate: body.candidate,
        },
      })
      break
    }

    case 'consume-candidates': {
      // Mark candidates as consumed after they've been processed
      const candidateTypes = body.candidate === 'all'
        ? ['offer-candidate', 'answer-candidate']
        : [body.candidate]
      await db.callSignal.updateMany({
        where: {
          consultationId,
          signalType: { in: candidateTypes },
          consumed: false,
        },
        data: { consumed: true },
      })
      break
    }

    default:
      return NextResponse.json({ error: 'Invalid signal type' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
