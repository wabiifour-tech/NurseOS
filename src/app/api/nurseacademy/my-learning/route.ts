import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/my-learning - Get user's enrolled courses
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const enrollments = await db.enrollment.findMany({
      where: { nurseId: authUser.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            level: true,
            durationMinutes: true,
            cpdPoints: true,
            isFree: true,
            price: true,
            rating: true,
            enrollmentCount: true,
            _count: { select: { courseModules: true } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
    })

    const inProgress = enrollments.filter((e) => e.status === 'IN_PROGRESS')
    const completed = enrollments.filter((e) => e.status === 'COMPLETED')

    const totalCPD = completed.reduce((sum, e) => sum + (e.course.cpdPoints || 0), 0)

    return NextResponse.json({
      enrollments: enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        progressPercent: e.progressPercent,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        certificateNumber: e.certificateNumber,
        certificateIssued: e.certificateIssued,
        course: {
          title: e.course.title,
          description: e.course.description,
          category: e.course.category,
          durationMinutes: e.course.durationMinutes,
          level: e.course.level,
          cpdPoints: e.course.cpdPoints,
          rating: e.course.rating,
          enrollmentCount: e.course.enrollmentCount,
          moduleCount: e.course._count.courseModules,
        },
      })),
      inProgress: inProgress.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        progressPercent: e.progressPercent,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        course: {
          title: e.course.title,
          description: e.course.description,
          category: e.course.category,
          durationMinutes: e.course.durationMinutes,
          level: e.course.level,
          cpdPoints: e.course.cpdPoints,
          rating: e.course.rating,
          enrollmentCount: e.course.enrollmentCount,
          moduleCount: e.course._count.courseModules,
        },
      })),
      completed: completed.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        progressPercent: e.progressPercent,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        certificateNumber: e.certificateNumber,
        certificateIssued: e.certificateIssued,
        course: {
          title: e.course.title,
          description: e.course.description,
          category: e.course.category,
          durationMinutes: e.course.durationMinutes,
          level: e.course.level,
          cpdPoints: e.course.cpdPoints,
          rating: e.course.rating,
          enrollmentCount: e.course.enrollmentCount,
          moduleCount: e.course._count.courseModules,
        },
      })),
      totalEnrolled: enrollments.length,
      totalCompleted: completed.length,
      totalCPD,
    })
  } catch (error) {
    console.error('Error fetching my learning:', error)
    return NextResponse.json({ error: 'Failed to fetch learning data' }, { status: 500 })
  }
}
