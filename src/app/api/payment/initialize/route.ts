import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/compose'
import { PLAN_PRICES, type PlanType } from '@/lib/plan-limits'

// POST /api/payment/initialize — Initialize a Paystack transaction
export const POST = withAuth({}, async ({ user: ctx, request }) => {
  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is being configured. Please use bank transfer.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { plan } = body as { plan: PlanType }

    if (!plan || !['STARTER', 'PRO'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose STARTER or PRO.' },
        { status: 400 }
      )
    }

    const amount = PLAN_PRICES[plan]
    if (!amount) {
      return NextResponse.json(
        { error: 'Cannot pay for this plan online. Please contact sales.' },
        { status: 400 }
      )
    }

    // Paystack expects amount in kobo (smallest currency unit for NGN)
    const amountInKobo = amount * 100

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nurseos.digital'}/subscription`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ctx.email,
        amount: amountInKobo,
        currency: 'NGN',
        callback_url: `${callbackUrl}?reference={reference}`,
        metadata: {
          userId: ctx.id,
          facilityId: ctx.facilityId || '',
          plan,
          custom_fields: [
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: plan,
            },
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: ctx.id,
            },
          ],
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      console.error('Paystack initialization error:', data.message)
      return NextResponse.json(
        { error: 'Failed to initialize payment. Please try again or use bank transfer.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment. Please try again.' },
      { status: 500 }
    )
  }
})
