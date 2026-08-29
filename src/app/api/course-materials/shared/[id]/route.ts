/**
 * PATCH /api/course-materials/shared/[id]
 *
 * Accept or reject a shared material. Once accepted, the recipient can:
 *   - View the original material (file URL becomes accessible)
 *   - "Copy to my institution" — creates a new CourseMaterial in the recipient's facility
 *
 * Body:
 *   { action: 'ACCEPT' | 'REJECT' | 'COPY', newLevel?: number }
 *
 * Auth: Must be the recipient of the share.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

const VALID_LEVELS = [100, 200, 300, 400, 500]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { action, newLevel } = body
    if (!['ACCEPT', 'REJECT', 'COPY'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be ACCEPT, REJECT, or COPY' },
        { status: 400 }
      )
    }

    const share = await db.sharedMaterial.findUnique({
      where: { id },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            fileUrl: true,
            externalUrl: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            courseCode: true,
            courseTitle: true,
            level: true,
          },
        },
      },
    })

    if (!share) {
      return NextResponse.json({ error: 'Share record not found' }, { status: 404 })
    }

    if (share.recipientId !== authUser.id) {
      return NextResponse.json(
        { error: 'Only the recipient of this share can accept or reject it' },
        { status: 403 }
      )
    }

    if (share.status === 'REJECTED') {
      return NextResponse.json({ error: 'This share has already been rejected.' }, { status: 400 })
    }

    if (action === 'ACCEPT') {
      if (share.status === 'ACCEPTED') {
        return NextResponse.json({ message: 'Share was already accepted', share })
      }
      const updated = await db.sharedMaterial.update({
        where: { id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      })
      return NextResponse.json({ share: updated })
    }

    if (action === 'REJECT') {
      const updated = await db.sharedMaterial.update({
        where: { id },
        data: { status: 'REJECTED', rejectedAt: new Date() },
      })
      return NextResponse.json({ share: updated })
    }

    // action === 'COPY' — only allowed if share was accepted
    if (share.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'You must accept the share before copying the material to your institution.' },
        { status: 400 }
      )
    }

    if (!authUser.facilityId) {
      return NextResponse.json(
        { error: 'You must be assigned to an institution to copy a material.' },
        { status: 400 }
      )
    }

    // Validate the level for the new material (defaults to original level if not provided)
    const targetLevel = newLevel ? Number(newLevel) : share.material.level
    if (!VALID_LEVELS.includes(targetLevel)) {
      return NextResponse.json(
        { error: `Invalid newLevel. Must be one of: ${VALID_LEVELS.join(', ')}` },
        { status: 400 }
      )
    }

    if (share.copiedToMaterialId) {
      // Already copied — return the existing copy
      const existingCopy = await db.courseMaterial.findUnique({
        where: { id: share.copiedToMaterialId },
      })
      return NextResponse.json({
        message: 'Material was already copied to your institution',
        material: existingCopy,
        share,
      })
    }

    // Create a new CourseMaterial in the recipient's facility, attributed to the recipient
    const newMaterial = await db.courseMaterial.create({
      data: {
        facilityId: authUser.facilityId,
        uploaderId: authUser.id,
        title: share.material.title,
        description: share.material.description,
        type: share.material.type,
        fileUrl: share.material.fileUrl,
        externalUrl: share.material.externalUrl,
        fileName: share.material.fileName,
        fileSize: share.material.fileSize,
        mimeType: share.material.mimeType,
        level: targetLevel,
        courseCode: share.material.courseCode,
        courseTitle: share.material.courseTitle,
        isPublished: true,
      },
    })

    // Link the share to the new material copy
    const updatedShare = await db.sharedMaterial.update({
      where: { id },
      data: { copiedToMaterialId: newMaterial.id },
    })

    return NextResponse.json(
      {
        message: 'Material copied to your institution successfully',
        material: newMaterial,
        share: updatedShare,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Shared PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update share' },
      { status: 500 }
    )
  }
}
