import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/notifications - List notifications for the current user
export const GET = withAuth({}, async (ctx) => {
  try {
    const { searchParams } = new URL(ctx.request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const unreadOnly = searchParams.get('unread') === 'true'
    const type = searchParams.get('type') || ''
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId: ctx.user.id }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
})

// PATCH /api/notifications - Mark notifications as read
export const PATCH = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Support marking a single notification or all as read
    if (body.markAllRead) {
      const result = await db.notification.updateMany({
        where: { userId: ctx.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ message: `${result.count} notifications marked as read`, count: result.count })
    }

    if (!body.notificationId) {
      return NextResponse.json({ error: 'notificationId is required (or use markAllRead: true)' }, { status: 400 })
    }

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id: body.notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== ctx.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updated = await db.notification.update({
      where: { id: body.notificationId },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
})

// DELETE /api/notifications - Dismiss/delete a notification
export const DELETE = withAuth({}, async (ctx) => {
  try {
    const { searchParams } = new URL(ctx.request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== ctx.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.notification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({ message: 'Notification dismissed' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
})
