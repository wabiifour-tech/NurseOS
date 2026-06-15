/**
 * POST /api/email/webhook
 * Webhook endpoint for Resend delivery status updates.
 *
 * Set up this webhook at https://resend.com/webhooks
 * URL: https://www.nurseos.digital/api/email/webhook
 *
 * Resend sends events: email.sent, email.delivered, email.bounced, email.complained
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateEmailStatus } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // In production, verify the webhook signature using RESEND_WEBHOOK_SECRET
    // const signature = request.headers.get('resend-signature')
    // TODO: Verify signature when RESEND_WEBHOOK_SECRET is set

    const body = await request.json()
    const { type, data } = body

    if (!type || !data?.email_id) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Map Resend event types to our status
    const statusMap: Record<string, 'DELIVERED' | 'BOUNCED' | 'COMPLAINED'> = {
      'email.delivered': 'DELIVERED',
      'email.bounced': 'BOUNCED',
      'email.complained': 'COMPLAINED',
    }

    const status = statusMap[type]
    if (!status) {
      // Ignore events we don't track (e.g., email.sent, email.opened, email.clicked)
      return NextResponse.json({ received: true, ignored: true })
    }

    await updateEmailStatus(data.email_id, status, data.bounce?.message || data.complaint?.message)

    return NextResponse.json({ received: true, status })
  } catch (error: any) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
