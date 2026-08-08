import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/facility — Get facility data for the logged-in admin
// Returns: facility info, workers list, patient count, subscription info, recent activity
// SECURITY: ALL queries are scoped to ctx.facilityId — admins can ONLY see their own facility.
export const GET = withAuth({
  permissions: [ADMIN_PERMISSIONS.FACILITY_READ],
  policies: ['facility_strict'],
  auditAction: 'admin.facility.view',
  auditResource: 'facility',
}, async (ctx) => {
  const facilityId = ctx.facilityId!

  // ── Get the admin's facility (always scoped to facilityId) ──
  const facility = await db.facility.findUnique({
    where: { id: facilityId },
    include: {
      subscription: true,
      departments: true,
    },
  })

  if (!facility) {
    return Response.json({ error: 'Facility not found' }, { status: 404 })
  }

  // ── Healthcare workers (non-academic) — for regular facility admin dashboard ──
  const workers = await db.user.findMany({
    where: {
      OR: [
        { facilityId },
        { nurseProfile: { currentFacilityId: facilityId } },
        { adminProfile: { facilityId } },
      ],
      status: 'ACTIVE',
      // Exclude lecturers and students from the generic "workers" list
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
    where: { facilityId },
  })

  // Get recent medical records count (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentRecordsCount = await db.medicalRecord.count({
    where: {
      facilityId,
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Get recent referrals
  const recentReferrals = await db.referral.count({
    where: {
      fromFacilityId: facilityId,
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
      facilityId,
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
        facilityId,
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

    // ── Detailed student list (ACTIVE) ──
    const studentRows = await db.user.findMany({
      where: {
        facilityId,
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
        where: { facilityId, academicRole: 'LECTURER', status: 'ACTIVE' },
      }),
      db.user.count({
        where: { facilityId, academicRole: 'LECTURER', status: 'PENDING' },
      }),
      db.user.count({
        where: { facilityId, academicRole: 'STUDENT', status: 'ACTIVE' },
      }),
      db.courseMaterial.count({
        where: { facilityId },
      }),
      db.courseMaterial.groupBy({
        by: ['level'],
        where: { facilityId },
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

  return Response.json({
    facility,
    workers,
    patientCount,
    recentRecordsCount,
    recentReferrals,
    subscription: facility.subscription,
    recentActivity,
    admissionTrend,
    academicStats,
    lecturers,
    students,
    studentsByLevel,
  })
})
