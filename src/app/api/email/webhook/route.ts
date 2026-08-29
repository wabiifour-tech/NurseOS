/**
 * POST /api/email/webhook
 * Webhook endpoint for Resend delivery status updates.
 *
 * Set up this webhook at https://resend.com/webhooks
 * URL: https://www.nurseos.digital/api/email/webhook
 *
 * Resend sends events: email.sent, email.delivered, email.bounced, email.complained
 *
 * SECURITY: Verifies the Resend webhook signature using RESEND_WEBHOOK_SECRET.
 * Without verification, anyone could send fake webhook requests to manipulate
 * email delivery status records.
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateEmailStatus } from '@/lib/email'
import crypto from 'crypto'

/**
 * Verify the Resend webhook signature.
 * Resend uses HMAC-SHA256 with the webhook secret.
 * The signature is sent in the `resend-signature` header.
 */
function verifyResendSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    )
  } catch {
    // Length mismatch — invalid signature
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('resend-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

    // SECURITY: Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret) {
        console.error('[email-webhook] RESEND_WEBHOOK_SECRET is not set in production. Rejecting webhook request.')
        return NextResponse.json(
          { error: 'Webhook secret not configured' },
          { status: 500 }
        )
      }

      if (!verifyResendSignature(rawBody, signature, webhookSecret)) {
        console.warn('[email-webhook] Invalid or missing webhook signature. Possible spoofing attempt.')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      // In development, warn if secret is missing but still accept
      if (!webhookSecret) {
        console.warn('[email-webhook] RESEND_WEBHOOK_SECRET not set — skipping signature verification (dev mode)')
      }
    }

    const body = JSON.parse(rawBody)
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
  } catch (error: unknown) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
