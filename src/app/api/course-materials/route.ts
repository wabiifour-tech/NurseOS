/**
 * Course Materials API
 *
 * POST   /api/course-materials         — Lecturer uploads a new material (file or link)
 * GET    /api/course-materials         — List materials (filtered by role)
 *   - LECTURER: returns materials they uploaded (optionally filtered by level)
 *   - STUDENT:  returns materials for their institution + their level only
 *   - ADMIN (institution): returns all materials for their institution
 *
 * Body for POST:
 *   {
 *     title: string,
 *     description?: string,
 *     type: 'SLIDE' | 'DOCUMENT' | 'POWERPOINT' | 'PDF' | 'LINK',
 *     level: 100 | 200 | 300 | 400 | 500,
 *     courseCode?: string,
 *     courseTitle?: string,
 *     // For LINK type:
 *     externalUrl?: string,
 *     // For file types — base64-encoded data URL (since Vercel serverless has no persistent FS)
 *     // We store as a data URL in `fileUrl`. For production scale, swap for S3/Vercel Blob.
 *     fileDataUrl?: string,   // e.g. "data:application/pdf;base64,..."
 *     fileName?: string,
 *     fileSize?: number,
 *     mimeType?: string,
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

const VALID_TYPES = ['SLIDE', 'DOCUMENT', 'POWERPOINT', 'PDF', 'LINK']
const VALID_LEVELS = [100, 200, 300, 400, 500]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB limit for base64-encoded uploads

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    // Only academic roles (lecturer, student) and institution admin can access
    const isLecturer = authUser.academicRole === 'LECTURER'
    const isStudent = authUser.academicRole === 'STUDENT'
    const isInstitutionAdmin = authUser.role === 'ADMIN'

    if (!isLecturer && !isStudent && !isInstitutionAdmin && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers, students, or institution admins can access course materials' },
        { status: 403 }
      )
    }

    if (!authUser.facilityId) {
      return NextResponse.json(
        { error: 'No institution associated with your account' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const levelFilter = url.searchParams.get('level')
    const search = url.searchParams.get('search')

    // Build where clause
    const where: any = {
      facilityId: authUser.facilityId,
      isPublished: true,
    }

    // Students only see materials for THEIR level
    if (isStudent) {
      if (!authUser.studentLevel) {
        return NextResponse.json(
          { error: 'Your student level is not set. Please contact your institution admin.' },
          { status: 400 }
        )
      }
      where.level = authUser.studentLevel
    } else if (levelFilter && VALID_LEVELS.includes(Number(levelFilter))) {
      // Lecturers / admins can filter by level
      where.level = Number(levelFilter)
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { courseTitle: { contains: search, mode: 'insensitive' } },
      ]
    }

    const materials = await db.courseMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 200,
    })

    return NextResponse.json({ materials })
  } catch (error: any) {
    console.error('Course materials GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database not configured', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    // Only LECTURER or institution ADMIN can upload
    if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can upload materials' },
        { status: 403 }
      )
    }

    if (!authUser.facilityId) {
      return NextResponse.json(
        { error: 'No institution associated with your account' },
        { status: 400 }
      )
    }

    // Verify facility is an academic institution (UNIVERSITY or SCHOOL_OF_NURSING)
    const facility = await db.facility.findUnique({
      where: { id: authUser.facilityId },
      select: { id: true, type: true, freeTrialEndsAt: true, isVerified: true },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    if (!['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
      return NextResponse.json(
        { error: 'Course materials can only be uploaded for universities or schools of nursing' },
        { status: 400 }
      )
    }

    // Subscription enforcement: if trial ended and no active subscription, block uploads
    const subscription = await db.subscription.findUnique({
      where: { facilityId: facility.id },
    })

    const trialEnded = facility.freeTrialEndsAt && new Date() > facility.freeTrialEndsAt
    const hasActiveSubscription = subscription && subscription.status === 'ACTIVE' && subscription.isActive

    if (trialEnded && !hasActiveSubscription) {
      return NextResponse.json(
        {
          error: 'Free trial has ended. Your institution must subscribe to continue uploading materials.',
          errorType: 'SUBSCRIPTION_REQUIRED',
          trialEnded: true,
        },
        { status: 402 }
      )
    }

    // Parse body — JSON with possible large base64 payload
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      title,
      description,
      type,
      level,
      courseCode,
      courseTitle,
      externalUrl,
      fileDataUrl,
      fileName,
      fileSize,
      mimeType,
    } = body

    // Validate required fields
    if (!title || !type || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, level' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_LEVELS.includes(Number(level))) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` },
        { status: 400 }
      )
    }

    // Type-specific validation
    let storedFileUrl: string | null = null
    let storedExternalUrl: string | null = null

    if (type === 'LINK') {
      if (!externalUrl) {
        return NextResponse.json(
          { error: 'externalUrl is required for LINK type materials' },
          { status: 400 }
        )
      }
      // Basic URL validation
      try {
        new URL(externalUrl)
      } catch {
        return NextResponse.json(
          { error: 'externalUrl must be a valid URL' },
          { status: 400 }
        )
      }
      storedExternalUrl = externalUrl
    } else {
      // File types require fileDataUrl
      if (!fileDataUrl) {
        return NextResponse.json(
          { error: `fileDataUrl is required for ${type} type materials` },
          { status: 400 }
        )
      }

      // Validate it's a data URL
      if (!fileDataUrl.startsWith('data:')) {
        return NextResponse.json(
          { error: 'fileDataUrl must be a base64 data URL (e.g. "data:application/pdf;base64,...")' },
          { status: 400 }
        )
      }

      // Validate size
      if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB` },
          { status: 400 }
        )
      }

      storedFileUrl = fileDataUrl
    }

    // Create the material
    const material = await db.courseMaterial.create({
      data: {
        facilityId: authUser.facilityId,
        uploaderId: authUser.id,
        title,
        description: description || null,
        type,
        fileUrl: storedFileUrl,
        externalUrl: storedExternalUrl,
        fileName: fileName || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        level: Number(level),
        courseCode: courseCode || null,
        courseTitle: courseTitle || null,
        isPublished: true,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'COURSE_MATERIAL_UPLOADED',
        resource: 'CourseMaterial',
        resourceId: material.id,
        details: `Lecturer uploaded "${title}" (${type}) for level ${level} at facility ${authUser.facilityId}`,
      },
    })

    return NextResponse.json(
      {
        message: 'Material uploaded successfully',
        material: {
          id: material.id,
          title: material.title,
          type: material.type,
          level: material.level,
          createdAt: material.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Course materials POST error:', error)
    return NextResponse.json(
      { error: 'Failed to upload material', details: error.message },
      { status: 500 }
    )
  }
}
