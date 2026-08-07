import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, denial } from '@/lib/middleware'
import { CLINICAL_PERMISSIONS } from '@/lib/permissions'
import { getNurseProfileId } from '@/lib/auth'

// GET /api/caregrid/consultations - List consultations
// Cross-facility: shows consultations where the nurse is a participant
export const GET = withAuth({
  permissions: [CLINICAL_PERMISSIONS.RECORD_READ],
  policies: ['nurse_profile_required'],
  auditAction: 'consultation.list',
  auditResource: 'consultation',
}, async (ctx) => {
  const nurseId = ctx.nurseProfileId
  if (!nurseId) {
    // Non-nurse users (e.g., admin) should not see consultations
    return NextResponse.json({ consultations: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } })
  }

  const { searchParams } = new URL(ctx.request.url)
  const status = searchParams.get('status') || ''
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '1')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    OR: [
      { requestingNurseId: nurseId },
      { consultingNurseId: nurseId },
    ],
  }

  if (status) where.status = status

  const [consultations, total] = await Promise.all([
    db.consultation.findMany({
      where,
      include: {
        patient: {
          select: { id: true, patientId: true, user: { select: { firstName: true, lastName: true, displayName: true } } },
        },
        requestingNurse: {
          select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } },
        },
        consultingNurse: {
          select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } },
        },
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.consultation.count({ where }),
  ])

  return NextResponse.json({
    consultations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// POST /api/caregrid/consultations - Create a consultation
// Cross-facility: allows consulting nurses from other facilities
export const POST = withAuth({
  permissions: [CLINICAL_PERMISSIONS.RECORD_WRITE],
  policies: ['nurse_profile_required'],
  auditAction: 'consultation.create',
  auditResource: 'consultation',
}, async (ctx) => {
  const nurseId = ctx.nurseProfileId
  if (!nurseId) {
    return denial('NURSE_PROFILE_REQUIRED', 'Only nurses can create consultations', 403)
  }

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const isSupportRequest = body.consultationType === 'SUPPORT'

  if (!isSupportRequest && !body.consultingNurseId) {
    return NextResponse.json(
      { error: 'Consulting nurse ID is required for consultations' },
      { status: 400 },
    )
  }

  if (!body.subject || !body.description) {
    return NextResponse.json(
      { error: 'Subject and description are required' },
      { status: 400 },
    )
  }

  let consultingNurseId = body.consultingNurseId
  if (!consultingNurseId) {
    const supportNurse = await db.nurseProfile.findFirst({
      where: { availableForConsult: true },
      select: { id: true },
    })
    if (!supportNurse) {
      return NextResponse.json(
        { error: 'No nurse is currently available for consultation.' },
        { status: 404 },
      )
    }
    consultingNurseId = supportNurse.id
  }

  const consultation = await db.consultation.create({
    data: {
      requestingNurseId: nurseId,
      consultingNurseId,
      patientId: body.patientId || null,
      recordId: body.recordId || null,
      consultationType: body.consultationType || body.type || 'CHAT',
      subject: body.subject,
      description: body.description,
      status: body.status || 'REQUESTED',
      notes: body.notes || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  })

  return NextResponse.json(
    { message: 'Consultation created successfully', consultation },
    { status: 201 },
  )
})

// PATCH /api/caregrid/consultations - Update consultation status
export const PATCH = withAuth({
  permissions: [CLINICAL_PERMISSIONS.RECORD_WRITE],
  policies: ['nurse_profile_required'],
  auditAction: 'consultation.update',
  auditResource: 'consultation',
}, async (ctx) => {
  let body
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { consultationId, status } = body
  if (!consultationId) {
    return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 })
  }

  const validStatuses = ['ACCEPTED', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Valid status is required (ACCEPTED, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)' },
      { status: 400 },
    )
  }

  const existing = await db.consultation.findUnique({ where: { id: consultationId } })
  if (!existing) {
    return denial('RESOURCE_NOT_FOUND', 'Consultation not found', 404)
  }

  // ABAC: participant check (ownership_required policy — enforced in handler)
  const nurseId = ctx.nurseProfileId
  const isConsultingNurse = existing.consultingNurseId === nurseId
  const isRequestingNurse = existing.requestingNurseId === nurseId

  if (!isConsultingNurse && !isRequestingNurse) {
    return denial('CONSULTATION_NOT_PARTICIPANT', 'You are not authorized to update this consultation', 403)
  }

  if (status === 'ACCEPTED' && !isConsultingNurse) {
    return denial('CONSULTATION_NOT_PARTICIPANT', 'Only the consulting nurse can accept a consultation', 403)
  }

  const updated = await db.consultation.update({
    where: { id: consultationId },
    data: { status },
    include: {
      patient: { select: { id: true, patientId: true, user: { select: { firstName: true, lastName: true, displayName: true } } } },
      requestingNurse: { select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } } },
      consultingNurse: { select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } } },
    },
  })

  return NextResponse.json({ consultation: updated })
})
