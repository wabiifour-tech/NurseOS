import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/courses/[id] - Get course detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { id } = await params

    const course = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
        enrollments: {
          where: { nurseId: authUser.id },
          take: 1,
        },
        _count: { select: { enrollments: true, modules: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}
