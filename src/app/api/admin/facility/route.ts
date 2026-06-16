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

    // Get recent activity (last 5 audit logs for this facility's users)
    const facilityUserIds = workers.map((w) => w.id)
    const recentActivity = await db.auditLog.findMany({
      where: {
        userId: { in: facilityUserIds },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get patient admission trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const admissionTrend = await db.medicalRecord.groupBy({
      by: ['encounterType'],
      where: {
        facilityId: authUser.facilityId,
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    })

    // ─── Academic institution stats (if facility is UNIVERSITY or SCHOOL_OF_NURSING) ───
    let academicStats: {
      isAcademicInstitution: boolean
      totalLecturers: number
      pendingLecturers: number
      activeLecturers: number
      totalStudents: number
      totalMaterials: number
      materialsByLevel: Array<{ level: number; count: number }>
      trialEndsAt: string | null
      trialDaysLeft: number | null
      trialEnded: boolean
    } | null = null

    if (['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
      const [activeLecturers, pendingLecturers, totalStudents, totalMaterials, materialsByLevel] = await Promise.all([
        db.user.count({
          where: {
            facilityId: authUser.facilityId,
            academicRole: 'LECTURER',
            status: 'ACTIVE',
          },
        }),
        db.user.count({
          where: {
            facilityId: authUser.facilityId,
            academicRole: 'LECTURER',
            status: 'PENDING',
          },
        }),
        db.user.count({
          where: {
            facilityId: authUser.facilityId,
            academicRole: 'STUDENT',
            status: 'ACTIVE',
          },
        }),
        db.courseMaterial.count({
          where: { facilityId: authUser.facilityId },
        }),
        db.courseMaterial.groupBy({
          by: ['level'],
          where: { facilityId: authUser.facilityId },
          _count: true,
        }),
      ])

      const trialEndsAt = facility.freeTrialEndsAt
      const trialEnded = trialEndsAt ? new Date() > trialEndsAt : false
      const trialDaysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : null

      academicStats = {
        isAcademicInstitution: true,
        totalLecturers: activeLecturers + pendingLecturers,
        pendingLecturers,
        activeLecturers,
        totalStudents,
        totalMaterials,
        materialsByLevel: materialsByLevel.map((m) => ({ level: m.level, count: m._count })),
        trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
        trialDaysLeft,
        trialEnded,
      }
    }

    return NextResponse.json({
      facility,
      workers,
      patientCount,
      recentRecordsCount,
      recentReferrals,
      subscription: facility.subscription,
      recentActivity,
      admissionTrend,
      academicStats,
    })
  } catch (error) {
    console.error('Error fetching facility data:', error)
    return NextResponse.json({ error: 'Failed to fetch facility data' }, { status: 500 })
  }
}
