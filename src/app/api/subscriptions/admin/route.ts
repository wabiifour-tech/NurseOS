import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/subscriptions/admin — List all subscriptions (admin only)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')

    const where: any = {}
    if (status) where.status = status
    if (plan) where.plan = plan

    const subscriptions = await db.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        facility: { select: { id: true, name: true, type: true, city: true, state: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const totalSubscriptions = await db.subscription.count()
    const activeCount = await db.subscription.count({ where: { status: 'ACTIVE' } })
    const trialingCount = await db.subscription.count({ where: { status: 'TRIALING' } })
    const expiredCount = await db.subscription.count({ where: { status: 'EXPIRED' } })
    const totalRevenue = await db.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { amountPaid: true },
    })

    return NextResponse.json({
      subscriptions,
      stats: {
        total: totalSubscriptions,
        active: activeCount,
        trialing: trialingCount,
        expired: expiredCount,
        totalRevenue: totalRevenue._sum.amountPaid || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

// PATCH /api/subscriptions/admin — Verify/Update a subscription (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
    }

    const body = await req.json()
    const { subscriptionId, action, plan, status, notes, amountPaid } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
    }

    const existing = await db.subscription.findUnique({ where: { id: subscriptionId } })
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const updateData: any = { verifiedBy: authUser.id, verifiedAt: new Date() }

    if (action === 'verify') {
      updateData.status = 'ACTIVE'
      updateData.notes = notes || 'Payment verified by admin'
    } else if (action === 'reject') {
      updateData.status = 'EXPIRED'
      updateData.notes = notes || 'Payment verification rejected by admin'
    } else if (action === 'update') {
      if (plan) updateData.plan = plan
      if (status) updateData.status = status
      if (notes) updateData.notes = notes
      if (amountPaid !== undefined) updateData.amountPaid = amountPaid
    } else if (action === 'renew') {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)
      updateData.status = 'ACTIVE'
      updateData.currentPeriodStart = now
      updateData.currentPeriodEnd = periodEnd
      updateData.notes = notes || 'Subscription renewed by admin'
    } else {
      return NextResponse.json({ error: 'Invalid action. Use verify, reject, update, or renew.' }, { status: 400 })
    }

    const updated = await db.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        facility: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      subscription: updated,
      message: `Subscription ${action === 'verify' ? 'verified and activated' : action === 'reject' ? 'rejected' : action === 'renew' ? 'renewed' : 'updated'} successfully`,
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
