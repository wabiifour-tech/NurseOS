import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, noFacilityResponse } from '@/lib/auth'

// GET /api/admin/facility — Get facility data for the logged-in admin
// Returns: facility info, workers list, patient count, subscription info, recent activity
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    if (!authUser.facilityId) return noFacilityResponse()

    // Get facility with related data
    const facility = await db.facility.findUnique({
      where: { id: authUser.facilityId },
      include: {
        subscription: true,
        departments: true,
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Get workers (users with this facilityId or nurseProfile.currentFacilityId or adminProfile.facilityId)
    const workers = await db.user.findMany({
      where: {
        OR: [
          { facilityId: authUser.facilityId },
          { nurseProfile: { currentFacilityId: authUser.facilityId } },
          { adminProfile: { facilityId: authUser.facilityId } },
        ],
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get patient count
    const patientCount = await db.patientProfile.count({
      where: { facilityId: authUser.facilityId },
    })

    // Get recent medical records count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentRecordsCount = await db.medicalRecord.count({
      where: {
        facilityId: authUser.facilityId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    // Get recent referrals
    const recentReferrals = await db.referral.count({
      where: {
        fromFacilityId: authUser.facilityId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    return NextResponse.json({
      facility,
      workers,
      patientCount,
      recentRecordsCount,
      recentReferrals,
      subscription: facility.subscription,
    })
  } catch (error) {
    console.error('Error fetching facility data:', error)
    return NextResponse.json({ error: 'Failed to fetch facility data' }, { status: 500 })
  }
}
