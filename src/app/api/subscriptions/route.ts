import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, noFacilityResponse } from '@/lib/auth'
import { PLAN_LIMITS, isLimitExceeded, type PlanType } from '@/lib/plan-limits'

// GET /api/subscriptions — Get current user's facility subscription and plan limits
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    // Resolve facilityId from the auth context (which already checks User.facilityId,
    // NurseProfile.currentFacilityId, and AdminProfile.facilityId)
    const facilityId = authUser.facilityId

    if (!facilityId) {
      // No facility assigned — return FREE plan with zero usage
      const limits = PLAN_LIMITS.FREE
      return NextResponse.json({
        subscription: null,
        planLimits: limits,
        usage: {
          patients: 0,
          nurses: 0,
          aiQueriesToday: 0,
          patientLimit: limits.patientLimit,
          aiQueryLimit: limits.aiQueriesPerDay,
          nurseLimit: limits.nurseAccounts,
        },
        isPatientLimitReached: false,
        isNurseLimitReached: false,
        isAiQueryLimitReached: false,
      })
    }

    // Look up subscription by facilityId (each facility has exactly one subscription)
    let subscription = await db.subscription.findUnique({
      where: { facilityId },
      include: { facility: true },
    })

    // Auto-create FREE subscription if facility exists but has no subscription yet
    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          userId: authUser.id,
          facilityId,
          plan: 'FREE',
          status: 'ACTIVE',
        },
        include: { facility: true },
      })
    }

    const plan = (subscription.plan || 'FREE') as PlanType
    const limits = PLAN_LIMITS[plan]

    // Get current usage counts for the facility
    const [currentPatientCount, currentNurseCount] = await Promise.all([
      db.patientProfile.count({ where: { facilityId } }),
      db.nurseProfile.count({ where: { currentFacilityId: facilityId } }),
    ])

    const isPatientLimitReached = isLimitExceeded(plan, 'patientLimit', currentPatientCount)
    const isNurseLimitReached = isLimitExceeded(plan, 'nurseAccounts', currentNurseCount)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paymentMethod: subscription.paymentMethod,
        facilityId: subscription.facilityId,
        facilityName: subscription.facility?.name,
      },
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
