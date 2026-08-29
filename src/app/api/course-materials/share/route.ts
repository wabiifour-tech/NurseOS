/**
 * POST /api/course-materials/share
 *
 * Share one of your materials with another lecturer (cross-institution).
 * The recipient gets read-only access to the material's file/url.
 *
 * Body:
 *   {
 *     materialId: string,
 *     recipientEmail: string,  // Email of the lecturer to share with (must already have an account)
 *     message?: string,
 *     expiresAt?: string (ISO date, optional)
 *   }
 *
 * Auth: LECTURER (must be the uploader of the material), or ADMIN/SUPER_ADMIN.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

export const POST = withAuth({}, async (ctx) => {
  try {
    if (ctx.academicRole !== 'LECTURER' && ctx.role !== 'ADMIN' && ctx.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can share materials' },
        { status: 403 }
      )
    }

    let body: any
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { materialId, recipientEmail, message, expiresAt } = body

    if (!materialId || !recipientEmail) {
      return NextResponse.json(
        { error: 'materialId and recipientEmail are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 })
    }

    const material = await db.courseMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, facilityId: true, uploaderId: true, title: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Only the uploader lecturer, institution admin at same facility, or super admin can share
    const isUploader = material.uploaderId === ctx.id
    const isSameFacilityAdmin =
      (ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN') &&
      material.facilityId === ctx.facilityId
    const isSuperAdmin = ctx.role === 'SUPER_ADMIN'

    if (!isUploader && !isSameFacilityAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You can only share materials you uploaded' },
        { status: 403 }
      )
    }

    // Look up the recipient by email
    const recipient = await db.user.findUnique({
      where: { email: String(recipientEmail).toLowerCase() },
      select: { id: true, email: true, firstName: true, lastName: true, academicRole: true, status: true },
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found. They must have a NurseOS account (ask them to sign up first).' },
        { status: 404 }
      )
    }

    // Recipient must be a lecturer (or admin) — can't share with a student
    if (recipient.academicRole !== 'LECTURER' && recipient.role !== 'ADMIN' && recipient.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Materials can only be shared with lecturers or institution admins.' },
        { status: 400 }
      )
    }

    if (recipient.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Recipient account is not active.' },
        { status: 400 }
      )
    }

    if (recipient.id === ctx.id) {
      return NextResponse.json({ error: 'You cannot share a material with yourself.' }, { status: 400 })
    }

    // Check for existing share (don't duplicate)
    const existing = await db.sharedMaterial.findFirst({
      where: {
        materialId,
        senderId: ctx.id,
        recipientId: recipient.id,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This material has already been shared with this recipient.' },
        { status: 409 }
      )
    }

    const share = await db.sharedMaterial.create({
      data: {
        materialId,
        senderId: ctx.id,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        message: message ? String(message).slice(0, 1000) : null,
        status: 'PENDING',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    // Notify the recipient
    try {
      const sender = await db.user.findUnique({
        where: { id: ctx.id },
        select: { firstName: true, lastName: true, facility: { select: { name: true } } },
      })
      await db.notification.create({
        data: {
          userId: recipient.id,
          type: 'MATERIAL_SHARED',
          title: 'New material shared with you',
          message: `${sender?.firstName || 'A lecturer'} ${sender?.lastName || ''} from ${sender?.facility?.name || 'another institution'} shared "${material.title}" with you.`,
          data: JSON.stringify({
            shareId: share.id,
            materialId,
            materialTitle: material.title,
            senderName: `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim(),
          }),
        },
      })
    } catch {
      // best-effort
    }

    return NextResponse.json({ share, recipient: { id: recipient.id, name: `${recipient.firstName} ${recipient.lastName}`, email: recipient.email } }, { status: 201 })
  } catch (error: any) {
    console.error('Share POST error:', error)
    return NextResponse.json(
      { error: 'Failed to share material' },
      { status: 500 }
    )
  }
})
