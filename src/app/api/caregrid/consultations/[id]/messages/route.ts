import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/consultations/[id]/messages
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
    select: { requestingNurseId: true, consultingNurseId: true },
  })

  if (!consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.requestingNurseId !== nurseId && consultation.consultingNurseId !== nurseId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
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
}

// POST /api/caregrid/consultations/[id]/messages
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
    body = await request.json()
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
}
