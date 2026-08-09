import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/messages/unread-count — Get total unread DM count
export const GET = withAuth({}, async (ctx) => {
  try {
    const unreadCount = await db.directMessage.count({
      where: {
        recipientId: ctx.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error counting unread messages:', error)
    return NextResponse.json({ error: 'Failed to count unread messages' }, { status: 500 })
  }
})
