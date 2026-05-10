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
          include: {
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const inProgress = enrollments.filter(e => e.status === 'IN_PROGRESS')
    const completed = enrollments.filter(e => e.status === 'COMPLETED')

    return NextResponse.json({
      enrollments,
      inProgress,
      completed,
      totalEnrolled: enrollments.length,
      totalCompleted: completed.length,
    })
  } catch (error) {
    console.error('Error fetching my learning:', error)
    return NextResponse.json({ error: 'Failed to fetch learning data' }, { status: 500 })
  }
}
