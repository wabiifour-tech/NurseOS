import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// POST /api/nurseacademy/modules/[moduleId]/complete - Mark a module as completed and update progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { moduleId } = await params
    const nurseId = authUser.nurseProfileId

    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))

    // Find the module and verify enrollment
    const module = await db.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            courseModules: { orderBy: { order: 'asc' } },
            enrollments: {
              where: { nurseId },
              take: 1,
            },
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const enrollment = module.course.enrollments[0]
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Calculate new progress
    const totalModules = module.course.courseModules.length
    if (totalModules === 0) {
      return NextResponse.json({ error: 'Course has no modules' }, { status: 400 })
    }

    // Find the index of the completed module
    const completedModuleIndex = module.course.courseModules.findIndex(
      (m) => m.id === moduleId
    )

    // Progress is based on how many modules have been completed up to and including this one
    // If the current module is beyond what was completed before, update progress
    const currentProgress = enrollment.progressPercent
    const newModuleProgress = Math.round(((completedModuleIndex + 1) / totalModules) * 100)
    const updatedProgress = Math.max(currentProgress, newModuleProgress)

    // Determine the next module
    const nextModuleIndex = completedModuleIndex + 1
    const nextModuleId = nextModuleIndex < totalModules
      ? module.course.courseModules[nextModuleIndex].id
      : null

    // Check if course is completed
    const isCourseCompleted = updatedProgress >= 100

    // Update enrollment
    const updateData: Record<string, unknown> = {
      progressPercent: updatedProgress,
      currentModuleId: nextModuleId,
      lastAccessedAt: new Date(),
    }

    if (isCourseCompleted && enrollment.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()
      updateData.certificateIssued = true
      updateData.certificateNumber = `CERT/NOS/${new Date().getFullYear()}/${Date.now().toString(36).toUpperCase()}`
    }

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      moduleId: moduleId,
      nextModuleId,
      courseCompleted: isCourseCompleted,
      ...(isCourseCompleted && {
        certificateNumber: updateData.certificateNumber,
      }),
      // Include quiz score if provided
      quizScore: body.quizScore ?? null,
    })
  } catch (error) {
    console.error('Error completing module:', error)
    return NextResponse.json({ error: 'Failed to complete module' }, { status: 500 })
  }
}
