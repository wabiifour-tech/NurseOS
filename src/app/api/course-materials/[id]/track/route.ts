/**
 * POST /api/course-materials/[id]/track
 *
 * Records a view or download event for a material, attributed to the authenticated student.
 * Used by:
 *   - Student "View Material" button (eventType=VIEW)
 *   - Student "Download" button (eventType=DOWNLOAD)
 *
 * Body: { eventType: 'VIEW' | 'DOWNLOAD' }
 *
 * Auth: LECTURER, STUDENT, ADMIN, SUPER_ADMIN
 * Tracking is best-effort — only succeeds for users authorized to view the material.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

const VALID_EVENT_TYPES = ['VIEW', 'DOWNLOAD']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      select: { id: true, facilityId: true, level: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization — student must be at same facility + level
    if (authUser.academicRole === 'STUDENT') {
      if (material.facilityId !== authUser.facilityId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      if (material.level !== authUser.studentLevel) {
        return NextResponse.json({ error: 'You can only track materials for your level' }, { status: 403 })
      }
    } else if (
      authUser.academicRole !== 'LECTURER' &&
      authUser.role !== 'ADMIN' &&
      authUser.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const eventType = String(body.eventType || 'VIEW').toUpperCase()
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: 'eventType must be VIEW or DOWNLOAD' }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent')?.substring(0, 255) || null

    // Upsert the MaterialDownload record (one row per user/material/eventType — first-touch wins)
    // We use MaterialDownload for both VIEW and DOWNLOAD event types since the table schema is the same.
    try {
      await db.materialDownload.upsert({
        where: {
          materialId_userId_eventType: {
            materialId: id,
            userId: authUser.id,
            eventType,
          },
        },
        create: {
          materialId: id,
          userId: authUser.id,
          eventType,
          ipAddress,
          userAgent,
        },
        update: {},  // first-touch record is preserved
      })
    } catch {
      // best-effort — don't fail tracking on error
    }

    // For VIEW events, also update the MaterialView record (per-user view counter)
    if (eventType === 'VIEW') {
      try {
        await db.materialView.upsert({
          where: {
            materialId_userId: {
              materialId: id,
              userId: authUser.id,
            },
          },
          create: {
            materialId: id,
            userId: authUser.id,
            viewCount: 1,
            firstViewedAt: new Date(),
            lastViewedAt: new Date(),
          },
          update: {
            viewCount: { increment: 1 },
            lastViewedAt: new Date(),
          },
        })
        // Increment the material's denormalized viewCount
        await db.courseMaterial.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        })
      } catch {
        // best-effort
      }
    }

    // For DOWNLOAD events, also increment the material's denormalized downloadCount
    if (eventType === 'DOWNLOAD') {
      try {
        await db.courseMaterial.update({
          where: { id },
          data: { downloadCount: { increment: 1 } },
        })
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ ok: true, eventType, materialId: id })
  } catch (error: any) {
    console.error('Track POST error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
