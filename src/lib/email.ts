/**
 * NurseOS Email Service — Powered by Resend
 *
 * This is the centralized email service for sending real emails to users.
 * Uses Resend (https://resend.com) — 100 free emails/day, perfect for Next.js/Vercel.
 *
 * SETUP:
 * 1. Create a free account at https://resend.com
 * 2. Add your domain and verify DNS records (or use onboarding@nurseos.digital for testing)
 * 3. Generate an API key at https://resend.com/api-keys
 * 4. Add to .env.local: RESEND_API_KEY=re_xxxxxxxxxxxx
 * 5. Add to .env.local: EMAIL_FROM=nurseos@yourdomain.com (or onboarding@nurseos.digital)
 *
 * After setting up, call POST /api/setup to create the EmailLog table.
 */

import { Resend } from 'resend'
import { db } from '@/lib/db'
import { render } from '@react-email/render'
import React from 'react'

// ─── Resend Client (singleton) ───

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — emails will be logged but not sent')
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

// ─── Configuration ───

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'NurseOS <onboarding@nurseos.digital>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@nurseos.digital',
  appName: 'NurseOS',
  appUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nurseos.digital',
} as const

// ─── Email Types ───

export type EmailTemplateId =
  | 'password-reset'
  | 'email-verification'
  | 'user-approved'
  | 'user-rejected'
  | 'facility-approved'
  | 'facility-rejected'
  | 'subscription-verified'
  | 'subscription-expiring'
  | 'welcome'
  | 'announcement'
  | 'custom'

export interface SendEmailParams {
  to: string
  subject: string
  templateId: EmailTemplateId
  react: React.ReactElement  // React Email template component
  senderId: string           // User ID of the admin/system sending
  recipientId: string        // User ID of the recipient
  metadata?: Record<string, unknown>
}

export interface SendBulkEmailParams {
  recipients: Array<{
    email: string
    userId: string
  }>
  subject: string
  templateId: EmailTemplateId
  reactFactory: (recipient: { email: string; userId: string }) => React.ReactElement
  senderId: string
  metadata?: Record<string, unknown>
}

// ─── Core Send Function ───

/**
 * Send a single email via Resend and log it to the database.
 * If RESEND_API_KEY is not configured, the email is still logged with status "PENDING".
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean
  emailLogId: string
  providerId?: string
  error?: string
}> {
  const { to, subject, templateId, react, senderId, recipientId, metadata } = params

  // Create email log entry (PENDING status)
  const emailLog = await db.emailLog.create({
    data: {
      senderId,
      recipientId,
      toEmail: to,
      fromEmail: EMAIL_CONFIG.from,
      subject,
      templateId,
      status: 'PENDING',
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })

  try {
    const client = getResendClient()

    if (!client) {
      // No API key — mark as pending (will be sent when key is configured)
      console.log(`[Email] PENDING (no API key): ${subject} → ${to}`)
      return { success: false, emailLogId: emailLog.id, error: 'RESEND_API_KEY not configured' }
    }

    // Render the React email template to HTML
    const html = await render(react)

    // Send via Resend
    const { data, error } = await client.emails.send({
      from: EMAIL_CONFIG.from,
      to: [to],
      subject,
      html,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    if (error) {
      // Update log as FAILED
      await db.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      })
      console.error(`[Email] FAILED: ${subject} → ${to}`, error.message)
      return { success: false, emailLogId: emailLog.id, error: error.message }
    }

    // Update log as SENT
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'SENT',
        providerId: data?.id,
        sentAt: new Date(),
      },
    })

    console.log(`[Email] SENT: ${subject} → ${to} (ID: ${data?.id})`)
    return { success: true, emailLogId: emailLog.id, providerId: data?.id }
  } catch (err: any) {
    // Update log as FAILED
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        error: err.message || 'Unknown error',
      },
    }).catch(() => {}) // Don't fail if the update itself fails

    console.error(`[Email] ERROR: ${subject} → ${to}`, err)
    return { success: false, emailLogId: emailLog.id, error: err.message || 'Unknown error' }
  }
}

// ─── Bulk Send Function ───

/**
 * Send the same email to multiple recipients (one at a time to avoid rate limits).
 * Each email is individually logged.
 */
export async function sendBulkEmails(params: SendBulkEmailParams): Promise<{
  totalSent: number
  totalFailed: number
  results: Array<{ email: string; success: boolean; error?: string }>
}> {
  const { recipients, subject, templateId, reactFactory, senderId, metadata } = params

  const results: Array<{ email: string; success: boolean; error?: string }> = []
  let totalSent = 0
  let totalFailed = 0

  // Send sequentially to respect Resend rate limits (2 req/sec on free tier)
  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        templateId,
        react: reactFactory(recipient),
        senderId,
        recipientId: recipient.userId,
        metadata,
      })

      if (result.success) {
        totalSent++
        results.push({ email: recipient.email, success: true })
      } else {
        totalFailed++
        results.push({ email: recipient.email, success: false, error: result.error })
      }

      // Small delay to avoid rate limiting (500ms between emails = 2/sec)
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (err: any) {
      totalFailed++
      results.push({ email: recipient.email, success: false, error: err.message })
    }
  }

  return { totalSent, totalFailed, results }
}

// ─── System Email Senders (no human senderId) ───

/**
 * Get or create a system user ID for automated emails (password reset, etc.)
 */
async function getSystemUserId(): Promise<string> {
  // Find any SUPER_ADMIN to use as the sender for system emails
  const adminProfile = await db.adminProfile.findFirst({
    where: { accessLevel: { gte: 10 } },
    include: { user: { select: { id: true } } },
  })

  if (adminProfile?.user?.id) {
    return adminProfile.user.id
  }

  // Fallback: find any admin
  const admin = await db.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  if (admin?.id) {
    return admin.id
  }

  // Last resort: find any user
  const anyUser = await db.user.findFirst({ select: { id: true } })
  return anyUser?.id || 'system'
}

/**
 * Send a system-generated email (e.g., password reset, welcome email).
 * Uses the system user as the sender.
 */
export async function sendSystemEmail(params: Omit<SendEmailParams, 'senderId'>): Promise<{
  success: boolean
  emailLogId: string
  providerId?: string
  error?: string
}> {
  const systemSenderId = await getSystemUserId()
  return sendEmail({ ...params, senderId: systemSenderId })
}

// ─── Email Stats ───

export async function getEmailStats() {
  const [total, sent, failed, pending] = await Promise.all([
    db.emailLog.count(),
    db.emailLog.count({ where: { status: 'SENT' } }),
    db.emailLog.count({ where: { status: 'FAILED' } }),
    db.emailLog.count({ where: { status: 'PENDING' } }),
  ])

  const recentSent = await db.emailLog.count({
    where: {
      status: 'SENT',
      sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })

  return { total, sent, failed, pending, recentSent }
}

// ─── Resend Webhook Handler ───

/**
 * Update email status from Resend webhook events.
 * Set up webhook at https://resend.com/webhooks pointing to /api/email/webhook
 */
export async function updateEmailStatus(providerId: string, status: 'DELIVERED' | 'BOUNCED' | 'COMPLAINED', error?: string) {
  const emailLog = await db.emailLog.findFirst({
    where: { providerId },
  })

  if (!emailLog) {
    console.warn(`[Email] Webhook: No log found for provider ID ${providerId}`)
    return
  }

  await db.emailLog.update({
    where: { id: emailLog.id },
    data: {
      status,
      error: error || (status === 'BOUNCED' ? 'Email bounced' : null),
    },
  })

  console.log(`[Email] Webhook: ${providerId} → ${status}`)
}
