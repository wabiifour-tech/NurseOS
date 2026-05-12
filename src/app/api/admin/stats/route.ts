import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/admin/stats — App-wide statistics (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
    }

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

    return NextResponse.json({
      totalUsers,
      totalNurses,
      totalPatients,
      totalFacilities,
      totalCourses,
      totalMedicalRecords,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
