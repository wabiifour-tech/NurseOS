import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/certificates - List certificates
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const enrollments = await db.enrollment.findMany({
      where: {
        nurseId: authUser.id,
        certificateIssued: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            cpdPoints: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    const certificates = enrollments.map((e) => ({
      id: e.id,
      enrollmentId: e.id,
      certificateNumber: e.certificateNumber || `CERT/NOS/${new Date(e.completedAt || e.enrolledAt).getFullYear()}/${e.id.slice(-6).toUpperCase()}`,
      issuedDate: e.completedAt?.toISOString().split('T')[0] || null,
      expiryDate: null,
      isVerified: true,
      course: {
        title: e.course.title,
        category: e.course.category,
        level: e.course.level,
        cpdPoints: e.course.cpdPoints,
      },
    }))

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
  }
}
