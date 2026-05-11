import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, userId } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create a support notification for admins
    // Find admin users to notify
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      take: 5,
    })

    const notificationPromises = adminUsers.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SUPPORT',
          title: `Support: ${subject.trim().slice(0, 100)}`,
          message: `From: ${name.trim()} (${email.trim()})\n\n${message.trim().slice(0, 500)}`,
          data: JSON.stringify({
            supportType: 'CONTACT_FORM',
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            submittedAt: new Date().toISOString(),
            userId: userId || null,
          }),
        },
      })
    )

    await Promise.all(notificationPromises)

    // Also create an audit log entry
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SUPPORT_REQUEST',
          resource: 'support',
          details: JSON.stringify({
            subject: subject.trim(),
            email: email.trim(),
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
    })
  } catch (error) {
    console.error('Support request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    )
  }
}

// GET: Retrieve support requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const supportNotifications = await prisma.notification.findMany({
      where: { type: 'SUPPORT' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const tickets = supportNotifications.map(n => {
      let data: Record<string, unknown> = {}
      try { data = JSON.parse(n.data || '{}') } catch {}
      return {
        id: n.id,
        name: (data as Record<string, string>).name || 'Unknown',
        email: (data as Record<string, string>).email || '',
        subject: n.title.replace('Support: ', ''),
        message: (data as Record<string, string>).message || n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching support requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support requests' },
      { status: 500 }
    )
  }
}
