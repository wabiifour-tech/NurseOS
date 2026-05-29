import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// POST /api/announcements/[id]/read - Mark an announcement as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { id: announcementId } = await params

    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement || !announcement.isActive) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Upsert — create read record if not exists
    await db.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId: authUser.id,
        },
      },
      update: { readAt: new Date() },
      create: {
        announcementId,
        userId: authUser.id,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Marked as read' })
  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
