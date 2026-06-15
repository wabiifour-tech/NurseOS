/**
 * POST /api/email/broadcast
 * Send an email to multiple users at once. Only SUPER_ADMIN can use this.
 *
 * Body: {
 *   recipientIds: string[]  // Array of User IDs to send to
 *   subject: string         // Email subject
 *   templateId: string      // Template to use
 *   message?: string        // Custom message
 *   ctaUrl?: string
 *   ctaLabel?: string
 *   roleFilter?: string     // Optional: send to all users with this role
 *   facilityId?: string     // Optional: send to all users in this facility
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendBulkEmails, EMAIL_CONFIG, type EmailTemplateId } from '@/lib/email'
import { CustomEmail } from '@/emails/custom'
import { AnnouncementEmail } from '@/emails/announcement'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can broadcast emails' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { recipientIds, subject, templateId, message, ctaUrl, ctaLabel, roleFilter, facilityId } = body

    if (!subject || !templateId) {
      return NextResponse.json(
        { error: 'subject and templateId are required' },
        { status: 400 }
      )
    }

    // Build recipient list
    let whereClause: any = { deletedAt: null, status: 'ACTIVE' }

    if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
      whereClause.id = { in: recipientIds }
    } else if (roleFilter) {
      whereClause.role = roleFilter
    } else if (facilityId) {
      whereClause.facilityId = facilityId
    } else {
      return NextResponse.json(
        { error: 'Provide recipientIds, roleFilter, or facilityId' },
        { status: 400 }
      )
    }

    // Cap at 100 recipients per broadcast to respect rate limits
    const users = await db.user.findMany({
      where: whereClause,
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
      take: 100,
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No active users found matching the criteria' },
        { status: 404 }
      )
    }

    const sender = await db.user.findUnique({
      where: { id: authUser.id },
      select: { firstName: true, lastName: true, role: true },
    })
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'NurseOS'
    const dashboardUrl = `${EMAIL_CONFIG.appUrl}/dashboard`

    // Build template factory
    const reactFactory = (recipient: { email: string; userId: string }) => {
      const user = users.find(u => u.id === recipient.userId)
      const recipientName = user ? `${user.firstName} ${user.lastName}` : 'User'

      switch (templateId as EmailTemplateId) {
        case 'announcement':
          return AnnouncementEmail({
            recipientName,
            announcementTitle: subject,
            announcementMessage: message || '',
            category: 'GENERAL',
            priority: 'NORMAL',
            senderName,
            dashboardUrl,
          })

        default:
          return CustomEmail({
            recipientName,
            message: message || subject,
            senderName,
            senderRole: sender?.role || 'SUPER_ADMIN',
            ctaUrl,
            ctaLabel,
          })
      }
    }

    const recipients = users.map(u => ({ email: u.email, userId: u.id }))

    const result = await sendBulkEmails({
      recipients,
      subject,
      templateId: templateId as EmailTemplateId,
      reactFactory,
      senderId: authUser.id,
      metadata: { message, ctaUrl, ctaLabel, isBroadcast: true },
    })

    return NextResponse.json({
      success: true,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      totalRecipients: users.length,
      message: `Broadcast sent: ${result.totalSent} delivered, ${result.totalFailed} failed`,
    })
  } catch (error: any) {
    console.error('Email broadcast error:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast email', details: error.message },
      { status: 500 }
    )
  }
}
