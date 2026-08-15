import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getNurseProfileId } from '@/lib/auth'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/caregrid/consultations/[id]/messages
export const GET = withAuth({}, async (ctx) => {
  const consultationId = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2, -1)[0]

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(ctx.id)
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

  const { searchParams } = new URL(ctx.request.url)
  const afterId = searchParams.get('afterId') || ''

  // Build where clause — cursor-based pagination by ID
  const where: { consultationId: string; id?: { gt: string } } = { consultationId }
  if (afterId) {
    where.id = { gt: afterId }
  }

  const messages = await db.consultationMessage.findMany({
    where,
    include: {
      sender: {
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  return NextResponse.json({ messages })
})

// POST /api/caregrid/consultations/[id]/messages
export const POST = withAuth({}, async (ctx) => {
  const consultationId = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2, -1)[0]

  // Verify the user is part of this consultation
  const nurseId = await getNurseProfileId(ctx.id)
  const consultation = await db.consultation.findUnique({
    where: { id: consultationId },
    select: { requestingNurseId: true, consultingNurseId: true, status: true },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  let body: { content: string }
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
  }

  const message = await db.consultationMessage.create({
    data: {
      consultationId,
      senderId: nurseId!,
      content: body.content.trim(),
    },
    include: {
      sender: {
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  return NextResponse.json({ message }, { status: 201 })
})