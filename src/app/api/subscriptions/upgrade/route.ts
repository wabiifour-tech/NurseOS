import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// POST /api/subscriptions/upgrade — Request a plan upgrade
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    const body = await req.json()
    const { plan, facilityId, paymentMethod, paymentReference, amountPaid } = body

    if (!plan || !['STARTER', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Choose STARTER, PRO, or ENTERPRISE.' }, { status: 400 })
    }

    const existing = await db.subscription.findUnique({ where: { userId: authUser.id } })

    if (existing && existing.status === 'ACTIVE' && existing.plan === plan) {
      return NextResponse.json({ error: 'You are already on this plan.' }, { status: 400 })
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    const subscription = await db.subscription.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        facilityId: facilityId || authUser.facilityId || null,
        plan,
        status: 'TRIALING',
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
        amountPaid: amountPaid || null,
        notes: 'Pending payment verification by admin',
      },
      update: {
        plan,
        status: 'TRIALING',
        trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
        amountPaid: amountPaid || null,
        verifiedBy: null,
        verifiedAt: null,
        notes: 'Pending payment verification by admin',
      },
    })

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      message: 'Upgrade request submitted! Your 14-day free trial has started. An admin will verify your payment shortly.',
    })
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json({ error: 'Failed to process upgrade request' }, { status: 500 })
  }
}
