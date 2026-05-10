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
        courseModules: {
          orderBy: { order: 'asc' },
        },
        enrollments: {
          where: { nurseId: authUser.id },
          take: 1,
        },
        _count: { select: { enrollments: true, courseModules: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const enrollment = course.enrollments[0] || null

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        durationMinutes: course.durationMinutes,
        cpdPoints: course.cpdPoints,
        language: course.language,
        tags: course.tags,
        isPublished: course.isPublished,
        isFree: course.isFree,
        price: course.price,
        enrollmentCount: course.enrollmentCount,
        rating: course.rating,
        totalRatings: course.totalRatings,
        modules: course.courseModules.map((m) => ({
          id: m.id,
          title: m.title,
          type: m.contentType,
          durationMinutes: m.durationMinutes,
          order: m.order,
        })),
        _count: {
          enrollments: course._count.enrollments,
          modules: course._count.courseModules,
        },
      },
      isEnrolled: !!enrollment,
      enrollmentStatus: enrollment?.status || null,
      enrollmentProgress: enrollment?.progressPercent || 0,
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}
