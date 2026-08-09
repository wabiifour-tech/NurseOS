import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'
import { generateThreadKey, createNotification } from '@/lib/notify'

// GET /api/messages - List conversations (threads) for the current user
export const GET = withAuth({}, async (ctx) => {
  try {
    const { searchParams } = new URL(ctx.request.url)
    const view = searchParams.get('view') || 'conversations' // 'conversations' or 'thread'
    const threadKey = searchParams.get('threadKey') || ''
    const afterId = searchParams.get('afterId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    if (view === 'thread' && threadKey) {
      // Fetch messages in a specific thread
      const where: { threadKey: string; id?: { gt: string } } = { threadKey }
      if (afterId) where.id = { gt: afterId }

      const messages = await db.directMessage.findMany({
        where,
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
          recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      })

      return NextResponse.json({ messages })
    }

    // List conversations — get the latest message from each unique thread
    // Using a raw query approach for efficiency
    const latestMessages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: ctx.user.id },
          { recipientId: ctx.user.id },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true, facilityId: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true, facilityId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Fetch recent messages, then dedupe by thread
    })

    // Deduplicate by threadKey — keep only the latest message per thread
    const seenThreads = new Set<string>()
    const conversations = []

    for (const msg of latestMessages) {
      if (!seenThreads.has(msg.threadKey)) {
        seenThreads.add(msg.threadKey)
        const otherUser = msg.senderId === ctx.user.id ? msg.recipient : msg.sender
        conversations.push({
          threadKey: msg.threadKey,
          otherUser,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          // Count unread in this thread
          unreadCount: 0, // Will be computed separately
        })
      }
    }

    // Get unread counts per thread
    const unreadByThread = await db.directMessage.groupBy({
      by: ['threadKey'],
      where: {
        recipientId: ctx.user.id,
        isRead: false,
      },
      _count: { id: true },
    })

    const unreadMap = new Map(unreadByThread.map((item) => [item.threadKey, item._count.id]))

    for (const conv of conversations) {
      conv.unreadCount = unreadMap.get(conv.threadKey) || 0
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
})

// POST /api/messages - Send a direct message
export const POST = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { recipientId, content } = body

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Prevent sending message to self
    if (recipientId === ctx.user.id) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 })
    }

    // Verify recipient exists and is active
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, status: true, firstName: true, lastName: true },
    })

    if (!recipient || recipient.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Recipient not found or inactive' }, { status: 404 })
    }

    const threadKey = generateThreadKey(ctx.user.id, recipientId)

    const message = await db.directMessage.create({
      data: {
        threadKey,
        senderId: ctx.user.id,
        recipientId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    // Create notification for the recipient
    const senderName = `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || 'A user'
    await createNotification({
      userId: recipientId,
      type: 'DM',
      title: 'New Direct Message',
      message: `${senderName}: ${content.trim().substring(0, 100)}${content.trim().length > 100 ? '...' : ''}`,
      data: JSON.stringify({
        threadKey,
        messageId: message.id,
        senderId: ctx.user.id,
        action: 'NEW_DM',
      }),
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
})

// PATCH /api/messages - Mark messages as read in a thread
export const PATCH = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { threadKey, markAllRead } = body

    if (!threadKey) {
      return NextResponse.json({ error: 'Thread key is required' }, { status: 400 })
    }

    if (markAllRead) {
      // Mark all unread messages in this thread as read
      const result = await db.directMessage.updateMany({
        where: {
          threadKey,
          recipientId: ctx.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ message: `${result.count} messages marked as read`, count: result.count })
    }

    return NextResponse.json({ error: 'Specify markAllRead: true for the given threadKey' }, { status: 400 })
  } catch (error) {
    console.error('Error updating messages:', error)
    return NextResponse.json({ error: 'Failed to update messages' }, { status: 500 })
  }
})
