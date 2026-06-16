import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, noFacilityResponse } from '@/lib/auth'

// GET /api/admin/facility — Get facility data for the logged-in admin
// Returns: facility info, workers list, patient count, subscription info, recent activity
// SECURITY: ALL queries are scoped to authUser.facilityId — admins can ONLY see their own facility.
//           There is no path through this route that returns data from another facility.
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    if (!authUser.facilityId) return noFacilityResponse()

    // ── Get the admin's facility (always scoped to authUser.facilityId) ──
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

    // ── Healthcare workers (non-academic) — for regular facility admin dashboard ──
    const workers = await db.user.findMany({
      where: {
        OR: [
          { facilityId: authUser.facilityId },
          { nurseProfile: { currentFacilityId: authUser.facilityId } },
          { adminProfile: { facilityId: authUser.facilityId } },
        ],
        status: 'ACTIVE',
        // Exclude lecturers and students from the generic "workers" list — they get their own dedicated sections
        academicRole: { notIn: ['LECTURER', 'STUDENT'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        phone: true,
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

    // Detailed lecturer + student lists (with names + emails + matric numbers + levels)
    // Scoped strictly to authUser.facilityId — no cross-facility leakage.
    let lecturers: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      status: string
      createdAt: string
    }> = []

    let students: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      studentLevel: number | null
      matricNumber: string | null
      status: string
      createdAt: string
    }> = []

    // Students grouped by level (for the "view all students in each level" UI)
    let studentsByLevel: Array<{
      level: number
      count: number
      students: Array<{
        id: string
        firstName: string
        lastName: string
        email: string
        matricNumber: string | null
        status: string
      }>
    }> = []

    if (['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
      // ── Detailed lecturer list (PENDING + ACTIVE) — scoped to this facility only ──
      const lecturerRows = await db.user.findMany({
        where: {
          facilityId: authUser.facilityId,  // STRICT facility isolation
          academicRole: 'LECTURER',
          status: { in: ['ACTIVE', 'PENDING'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
      })
      lecturers = lecturerRows.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))

      // ── Detailed student list (ACTIVE — students are auto-enrolled so they're never PENDING) ──
      const studentRows = await db.user.findMany({
        where: {
          facilityId: authUser.facilityId,  // STRICT facility isolation
          academicRole: 'STUDENT',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          studentLevel: true,
          matricNumber: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ studentLevel: 'asc' }, { firstName: 'asc' }],
      })
      students = studentRows.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      }))

      // Group students by level
      const levelMap = new Map<number, typeof students>()
      for (const s of students) {
        const lvl = s.studentLevel ?? 0
        if (!levelMap.has(lvl)) levelMap.set(lvl, [])
        levelMap.get(lvl)!.push(s)
      }
      studentsByLevel = Array.from(levelMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([level, list]) => ({
          level,
          count: list.length,
          students: list.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            matricNumber: s.matricNumber,
            status: s.status,
          })),
        }))

      // ── Aggregate academic stats ──
      const [activeLecturers, pendingLecturers, totalStudents, totalMaterials, materialsByLevel] = await Promise.all([
        db.user.count({
          where: { facilityId: authUser.facilityId, academicRole: 'LECTURER', status: 'ACTIVE' },
        }),
        db.user.count({
          where: { facilityId: authUser.facilityId, academicRole: 'LECTURER', status: 'PENDING' },
        }),
        db.user.count({
          where: { facilityId: authUser.facilityId, academicRole: 'STUDENT', status: 'ACTIVE' },
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
      // Detailed academic rosters (empty for non-academic facilities)
      lecturers,
      students,
      studentsByLevel,
    })
  } catch (error) {
    console.error('Error fetching facility data:', error)
    return NextResponse.json({ error: 'Failed to fetch facility data' }, { status: 500 })
  }
}
