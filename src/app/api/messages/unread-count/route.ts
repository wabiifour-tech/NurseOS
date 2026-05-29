import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/messages/unread-count — Get total unread DM count
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const unreadCount = await db.directMessage.count({
      where: {
        recipientId: authUser.id,
        isRead: false,
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error counting unread messages:', error)
    return NextResponse.json({ error: 'Failed to count unread messages' }, { status: 500 })
  }
}
