import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/announcements/[id]/read - Mark an announcement as read
export const POST = withAuth({
  auditAction: 'announcements.read',
  auditResource: 'announcement',
}, async (ctx) => {
  // Extract [id] from pathname (IF-007: MiddlewareContext has no params)
  // Path: /api/announcements/[id]/read → segments: [api, announcements, <id>, read]
  const segments = ctx.request.nextUrl.pathname.split('/').filter(Boolean)
  const announcementId = segments[segments.length - 2] // second-to-last = [id]

  try {
    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Upsert — create read record if not exists
    await db.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId: ctx.user.id,
        },
      },
      update: { readAt: new Date() },
      create: {
        announcementId,
        userId: ctx.user.id,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Marked as read' })
  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
})
