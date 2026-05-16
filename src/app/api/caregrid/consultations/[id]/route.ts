import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// PATCH /api/caregrid/consultations/[id] - Update a consultation (notes, status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const { id: consultationId } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify the consultation exists and the user is authorized
  const nurseId = await getNurseProfileId(authUser.id)
  const existing = await db.consultation.findUnique({
    where: { id: consultationId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  const isConsultingNurse = existing.consultingNurseId === nurseId
  const isRequestingNurse = existing.requestingNurseId === nurseId

  if (!isConsultingNurse && !isRequestingNurse) {
    return NextResponse.json({ error: 'You are not authorized to update this consultation' }, { status: 403 })
  }

  // Build update data from allowed fields
  const updateData: Record<string, unknown> = {}

  // Status transitions
  if (body.status) {
    const validStatuses = ['ACCEPTED', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
    const status = body.status as string
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Valid status is required (${validStatuses.join(', ')})` },
        { status: 400 }
      )
    }
    // Accept can only be done by consulting nurse
    if (status === 'ACCEPTED' && !isConsultingNurse) {
      return NextResponse.json({ error: 'Only the consulting nurse can accept a consultation' }, { status: 403 })
    }
    updateData.status = status
  }

  // Notes
  if (typeof body.notes === 'string') {
    updateData.notes = body.notes
  }

  // Recommendations
  if (typeof body.recommendations === 'string') {
    updateData.recommendations = body.recommendations
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await db.consultation.update({
    where: { id: consultationId },
    data: updateData,
    include: {
      patient: {
        select: {
          id: true,
          patientId: true,
          user: { select: { firstName: true, lastName: true, displayName: true } },
        },
      },
      requestingNurse: {
        select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } },
      },
      consultingNurse: {
        select: { id: true, user: { select: { firstName: true, lastName: true, phone: true } } },
      },
    },
  })

  return NextResponse.json({ consultation: updated })
}
