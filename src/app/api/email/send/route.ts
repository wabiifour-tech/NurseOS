/**
 * POST /api/email/send
 * Send a single email to a user. Only SUPER_ADMIN can use this.
 *
 * Body: {
 *   recipientId: string     // User ID to send to
 *   subject: string         // Email subject
 *   templateId: string      // Template to use
 *   message?: string        // Custom message (for 'custom' template)
 *   ctaUrl?: string         // Call-to-action URL
 *   ctaLabel?: string       // CTA button label
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, EMAIL_CONFIG, type EmailTemplateId } from '@/lib/email'
import { CustomEmail } from '@/emails/custom'
import { WelcomeEmail } from '@/emails/welcome'
import { UserApprovalEmail } from '@/emails/user-approval'
import { FacilityApprovalEmail } from '@/emails/facility-approval'
import { SubscriptionEmail } from '@/emails/subscription'
import { AnnouncementEmail } from '@/emails/announcement'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    // Only SUPER_ADMIN can send emails
    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can send emails' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { recipientId, subject, templateId, message, ctaUrl, ctaLabel } = body

    if (!recipientId || !subject || !templateId) {
      return NextResponse.json(
        { error: 'recipientId, subject, and templateId are required' },
        { status: 400 }
      )
    }

    // Get recipient user
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        facilityId: true,
      },
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Get sender info
    const sender = await db.user.findUnique({
      where: { id: authUser.id },
      select: { firstName: true, lastName: true, role: true },
    })

    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'NurseOS'
    const recipientName = `${recipient.firstName} ${recipient.lastName}`
    const dashboardUrl = `${EMAIL_CONFIG.appUrl}/dashboard`

    // Build the email template based on templateId
    let react

    switch (templateId as EmailTemplateId) {
      case 'custom':
        react = CustomEmail({
          recipientName,
          message: message || subject,
          senderName,
          senderRole: sender?.role || 'SUPER_ADMIN',
          ctaUrl,
          ctaLabel,
        })
        break

      case 'welcome':
        react = WelcomeEmail({
          userName: recipientName,
          role: recipient.role,
          dashboardUrl,
        })
        break

      case 'user-approved':
        react = UserApprovalEmail({
          userName: recipientName,
          action: 'approved',
          facilityName: 'your facility',
          role: recipient.role,
          dashboardUrl,
        })
        break

      case 'user-rejected':
        react = UserApprovalEmail({
          userName: recipientName,
          action: 'rejected',
          facilityName: 'the facility',
          role: recipient.role,
          rejectionReason: message,
        })
        break

      case 'facility-approved':
        react = FacilityApprovalEmail({
          adminName: recipientName,
          facilityName: message || 'your facility',
          action: 'approved',
          dashboardUrl,
        })
        break

      case 'facility-rejected':
        react = FacilityApprovalEmail({
          adminName: recipientName,
          facilityName: message || 'the facility',
          action: 'rejected',
          rejectionReason: message,
        })
        break

      case 'subscription-verified':
        react = SubscriptionEmail({
          adminName: recipientName,
          facilityName: message || 'your facility',
          plan: 'PRO',
          action: 'verified',
          dashboardUrl,
        })
        break

      case 'announcement':
        react = AnnouncementEmail({
          recipientName,
          announcementTitle: subject,
          announcementMessage: message || '',
          category: 'GENERAL',
          priority: 'NORMAL',
          senderName,
          dashboardUrl,
        })
        break

      default:
        // Fallback to custom
        react = CustomEmail({
          recipientName,
          message: message || subject,
          senderName,
          senderRole: sender?.role || 'SUPER_ADMIN',
          ctaUrl,
          ctaLabel,
        })
    }

    const result = await sendEmail({
      to: recipient.email,
      subject,
      templateId: templateId as EmailTemplateId,
      react,
      senderId: authUser.id,
      recipientId: recipient.id,
      metadata: { message, ctaUrl, ctaLabel },
    })

    return NextResponse.json({
      success: result.success,
      emailLogId: result.emailLogId,
      message: result.success
        ? 'Email sent successfully'
        : `Email logged but not sent: ${result.error}`,
      error: result.success ? undefined : result.error,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}
