import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// POST /api/nurseacademy/enrollments - Enroll in a course
export const POST = withAuth({}, async (ctx) => {
  try {
    const nurseId = ctx.nurseProfileId
    if (!nurseId) {
      return NextResponse.json(
        { error: 'Only nurses can enroll in courses' },
        { status: 403 }
      )
    }

    let body;
    try {
      body = await ctx.request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Verify course exists and is published
    const course = await db.course.findUnique({
      where: { id: courseId },
    })
    if (!course || !course.isPublished) {
      return NextResponse.json(
        { error: 'Course not found or not available' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        courseId_nurseId: { courseId, nurseId },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course', enrollment: existing },
        { status: 409 }
      )
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        courseId,
        nurseId,
        status: 'IN_PROGRESS',
        progressPercent: 0,
      },
    })

    // Increment course enrollment count
    await db.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    })

    return NextResponse.json(
      { message: 'Enrolled successfully', enrollment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
})

// GET /api/nurseacademy/enrollments - List current user's enrollments
export const GET = withAuth({}, async (ctx) => {
  try {
    const nurseId = ctx.nurseProfileId
    if (!nurseId) {
      return NextResponse.json({ enrollments: [] })
    }

    const enrollments = await db.enrollment.findMany({
      where: { nurseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            level: true,
            durationMinutes: true,
            cpdPoints: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
})
