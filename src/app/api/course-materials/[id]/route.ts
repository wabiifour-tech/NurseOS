/**
 * DELETE /api/course-materials/[id]
 * Delete a course material. Only the uploader lecturer or institution admin can delete.
 *
 * GET /api/course-materials/[id]
 * Increment download count + return the material (for student to view/download).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true },
        },
        facility: {
          select: { id: true, name: true, type: true },
        },
      },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization: students can only view materials at their own institution + their level
    if (authUser.academicRole === 'STUDENT') {
      if (material.facilityId !== authUser.facilityId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      if (material.level !== authUser.studentLevel) {
        return NextResponse.json(
          { error: 'You can only access materials for your level' },
          { status: 403 }
        )
      }
    } else if (
      authUser.academicRole !== 'LECTURER' &&
      authUser.role !== 'ADMIN' &&
      authUser.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // ─── NO tracking increments here ───
    // Tracking (viewCount, downloadCount, MaterialView, MaterialDownload) is handled
    // EXCLUSIVELY by the dedicated /api/course-materials/[id]/track endpoint.
    // Previously this route ALSO incremented counts, causing every view to be double-counted.
    // The student dashboard calls both this route (to fetch the material) AND the /track route
    // (to log the view), so incrementing here would double the count.
    // This route now ONLY returns the material data — no side effects.

    return NextResponse.json({ material })
  } catch (error: any) {
    console.error('Course material GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      select: { id: true, uploaderId: true, facilityId: true, title: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization: only the uploader lecturer, or institution admin of same facility, or super admin
    const isUploader = material.uploaderId === authUser.id
    const isSameFacilityAdmin =
      (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') &&
      material.facilityId === authUser.facilityId
    const isSuperAdmin = authUser.role === 'SUPER_ADMIN'

    if (!isUploader && !isSameFacilityAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You can only delete materials you uploaded' },
        { status: 403 }
      )
    }

    await db.courseMaterial.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'COURSE_MATERIAL_DELETED',
        resource: 'CourseMaterial',
        resourceId: id,
        details: `Deleted material "${material.title}"`,
      },
    })

    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error: any) {
    console.error('Course material DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
