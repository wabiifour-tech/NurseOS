import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { SYSTEM_PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/stats — App-wide statistics (SUPER_ADMIN only)
export const GET = withAuth({
  permissions: [SYSTEM_PERMISSIONS.FACILITY_CROSS_ACCESS],
  auditAction: 'admin.stats.view',
  auditResource: 'platform',
}, async () => {
  const [
    totalUsers,
    totalNurses,
    totalPatients,
    totalFacilities,
    totalCourses,
    totalMedicalRecords,
  ] = await Promise.all([
    db.user.count(),
    db.nurseProfile.count(),
    db.patientProfile.count(),
    db.facility.count(),
    db.course.count(),
    db.medicalRecord.count(),
  ])

  return Response.json({
    totalUsers,
    totalNurses,
    totalPatients,
    totalFacilities,
    totalCourses,
    totalMedicalRecords,
  })
})
