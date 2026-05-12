import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PLAN_LIMITS, isLimitExceeded, type PlanType } from '@/lib/plan-limits'

// GET /api/subscriptions — Get current user's subscription and plan limits
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    const subscription = await db.subscription.findUnique({
      where: { userId: authUser.id },
      include: { facility: true },
    })

    const plan = (subscription?.plan || 'FREE') as PlanType
    const limits = PLAN_LIMITS[plan]

    let currentPatientCount = 0
    let currentNurseCount = 0

    if (subscription?.facilityId) {
      currentPatientCount = await db.patientProfile.count({
        where: { facilityId: subscription.facilityId },
      })
      currentNurseCount = await db.nurseProfile.count({
        where: { currentFacilityId: subscription.facilityId },
      })
    }

    const isPatientLimitReached = isLimitExceeded(plan, 'patientLimit', currentPatientCount)
    const isNurseLimitReached = isLimitExceeded(plan, 'nurseAccounts', currentNurseCount)

    return NextResponse.json({
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paymentMethod: subscription.paymentMethod,
        facilityId: subscription.facilityId,
        facilityName: subscription.facility?.name,
      } : null,
      planLimits: limits,
      usage: {
        patients: currentPatientCount,
        nurses: currentNurseCount,
        aiQueriesToday: 0,
        patientLimit: limits.patientLimit,
        aiQueryLimit: limits.aiQueriesPerDay,
        nurseLimit: limits.nurseAccounts,
      },
      isPatientLimitReached,
      isNurseLimitReached,
      isAiQueryLimitReached: limits.aiQueriesPerDay !== -1 && 0 >= limits.aiQueriesPerDay,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
