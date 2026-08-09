import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/notifications/count - Get unread notification count
export const GET = withAuth({}, async (ctx) => {
  try {
    const unreadCount = await db.notification.count({
      where: { userId: ctx.user.id, isRead: false },
    })

    // Also count by type for badge breakdowns
    const unreadByType = await db.notification.groupBy({
      by: ['type'],
      where: { userId: ctx.user.id, isRead: false },
      _count: { type: true },
    })

    const typeBreakdown: Record<string, number> = {}
    for (const item of unreadByType) {
      typeBreakdown[item.type] = item._count.type
    }

    return NextResponse.json({
      unreadCount,
      typeBreakdown,
    })
  } catch (error) {
    console.error('Error counting notifications:', error)
    return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 })
  }
})
