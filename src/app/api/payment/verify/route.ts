import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PLAN_PRICES, type PlanType } from '@/lib/plan-limits'

// GET /api/payment/verify?reference=xxx — Verify a Paystack transaction
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required.' },
        { status: 400 }
      )
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing is being configured.' },
        { status: 503 }
      )
    }

    // Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!data.status) {
      console.error('Paystack verification error:', data.message)
      return NextResponse.json(
        { error: 'Payment verification failed. Please contact support.' },
        { status: 400 }
      )
    }

    const transaction = data.data

    // Check if the transaction was successful
    if (transaction.status !== 'success') {
      return NextResponse.json({
        verified: false,
        status: transaction.status,
        message: `Payment ${transaction.status}. Please try again or contact support.`,
      })
    }

    // Extract plan from metadata
    const metadata = transaction.metadata || {}
    const plan = (metadata.plan || 'STARTER') as PlanType

    // Validate plan
    if (!['STARTER', 'PRO'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan in payment metadata.' },
        { status: 400 }
      )
    }

    // Verify amount matches plan price (amount from Paystack is in kobo)
    const expectedAmountKobo = (PLAN_PRICES[plan] || 0) * 100
    if (expectedAmountKobo > 0 && transaction.amount < expectedAmountKobo) {
      return NextResponse.json(
        { error: 'Payment amount does not match the plan price.' },
        { status: 400 }
      )
    }

    const facilityId = authUser.facilityId
    if (!facilityId) {
      return NextResponse.json(
        { error: 'No facility associated with your account. Please join a facility first.' },
        { status: 400 }
      )
    }

    // Update or create the subscription
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    const subscription = await db.subscription.upsert({
      where: { facilityId },
      create: {
        userId: authUser.id,
        facilityId,
        plan,
        status: 'ACTIVE',
        isActive: true,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentMethod: 'PAYSTACK',
        paymentReference: reference,
        amountPaid: transaction.amount / 100, // Convert from kobo to naira
        currency: 'NGN',
        verifiedAt: now,
        notes: `Paystack payment verified automatically. Reference: ${reference}`,
      },
      update: {
        plan,
        status: 'ACTIVE',
        isActive: true,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentMethod: 'PAYSTACK',
        paymentReference: reference,
        amountPaid: transaction.amount / 100,
        currency: 'NGN',
        verifiedAt: now,
        notes: `Paystack payment verified automatically. Reference: ${reference}`,
      },
    })

    return NextResponse.json({
      verified: true,
      status: 'success',
      plan: subscription.plan,
      subscriptionStatus: subscription.status,
      message: `Payment verified successfully! Your ${plan} plan is now active.`,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment. Please contact support.' },
      { status: 500 }
    )
  }
}
