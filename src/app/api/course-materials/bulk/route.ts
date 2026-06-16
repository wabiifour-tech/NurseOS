/**
 * POST /api/course-materials/bulk
 *
 * Bulk upload multiple materials from a ZIP file. Each file inside the ZIP becomes a separate
 * CourseMaterial entry. The ZIP is processed on the client side — the client extracts the entries
 * and sends them as an array of materials (already base64-encoded) to this endpoint.
 *
 * Body:
 *   {
 *     level: number (100-500),
 *     courseCode?: string,
 *     courseTitle?: string,
 *     publishAt?: string (ISO date),
 *     materials: Array<{
 *       title: string,
 *       description?: string,
 *       type: 'SLIDE' | 'DOCUMENT' | 'POWERPOINT' | 'PDF',
 *       fileDataUrl: string,  // base64 data URL
 *       fileName: string,
 *       fileSize: number,
 *       mimeType: string,
 *     }>
 *   }
 *
 * Auth: LECTURER or institution ADMIN at an academic facility with active subscription / trial.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

const VALID_LEVELS = [100, 200, 300, 400, 500]
const FILE_TYPE_MAP: Record<string, { type: string; valid: boolean }> = {
  'application/pdf': { type: 'PDF', valid: true },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { type: 'POWERPOINT', valid: true },
  'application/vnd.ms-powerpoint': { type: 'POWERPOINT', valid: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'DOCUMENT', valid: true },
  'application/msword': { type: 'DOCUMENT', valid: true },
  'text/plain': { type: 'DOCUMENT', valid: true },
  'application/vnd.ms-excel': { type: 'DOCUMENT', valid: true },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { type: 'DOCUMENT', valid: true },
  'image/png': { type: 'SLIDE', valid: true },
  'image/jpeg': { type: 'SLIDE', valid: true },
  'image/jpg': { type: 'SLIDE', valid: true },
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB per file
const MAX_FILES_PER_UPLOAD = 30  // hard cap to keep request size reasonable

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

    if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can bulk upload materials' },
        { status: 403 }
      )
    }

    if (!authUser.facilityId) {
      return NextResponse.json(
        { error: 'No institution associated with your account' },
        { status: 400 }
      )
    }

    // Verify facility is an academic institution
    const facility = await db.facility.findUnique({
      where: { id: authUser.facilityId },
      select: { id: true, type: true, freeTrialEndsAt: true, isVerified: true },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    if (!['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
      return NextResponse.json(
        { error: 'Bulk upload is only available for universities or schools of nursing' },
        { status: 400 }
      )
    }

    // Subscription enforcement
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

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { level, courseCode, courseTitle, publishAt, materials } = body

    // Validate level
    if (!VALID_LEVELS.includes(Number(level))) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate materials array
    if (!Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'materials must be a non-empty array' },
        { status: 400 }
      )
    }
    if (materials.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files per bulk upload.` },
        { status: 400 }
      )
    }

    const numericLevel = Number(level)
    const publishDate = publishAt ? new Date(publishAt) : null

    // Process each material — validate and create
    const results: Array<{ success: boolean; title?: string; error?: string; materialId?: string }> = []
    let successCount = 0
    let failureCount = 0

    for (const m of materials) {
      try {
        const { title, description, type, fileDataUrl, fileName, fileSize, mimeType } = m

        if (!title || !fileDataUrl || !fileName) {
          results.push({ success: false, title: title || fileName, error: 'Missing required fields (title, fileDataUrl, fileName)' })
          failureCount++
          continue
        }

        // Determine type from mimeType if not provided
        let resolvedType = type
        if (!resolvedType && mimeType && FILE_TYPE_MAP[mimeType]) {
          resolvedType = FILE_TYPE_MAP[mimeType].type
        }
        if (!resolvedType) {
          // Fallback by extension
          const ext = fileName.split('.').pop()?.toLowerCase()
          if (ext === 'pdf') resolvedType = 'PDF'
          else if (ext === 'ppt' || ext === 'pptx') resolvedType = 'POWERPOINT'
          else if (ext === 'doc' || ext === 'docx' || ext === 'txt') resolvedType = 'DOCUMENT'
          else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') resolvedType = 'SLIDE'
          else resolvedType = 'DOCUMENT'
        }

        // Validate file size
        if (fileSize && fileSize > MAX_FILE_SIZE_BYTES) {
          results.push({ success: false, title, error: `File too large (max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)` })
          failureCount++
          continue
        }

        // Validate data URL prefix
        if (!fileDataUrl.startsWith('data:')) {
          results.push({ success: false, title, error: 'fileDataUrl must be a base64 data URL' })
          failureCount++
          continue
        }

        const created = await db.courseMaterial.create({
          data: {
            facilityId: authUser.facilityId,
            uploaderId: authUser.id,
            title: String(title).slice(0, 200),
            description: description ? String(description).slice(0, 2000) : null,
            type: resolvedType,
            fileUrl: fileDataUrl,
            externalUrl: null,
            fileName: String(fileName).slice(0, 255),
            fileSize: fileSize ? Number(fileSize) : null,
            mimeType: mimeType || null,
            level: numericLevel,
            courseCode: courseCode || null,
            courseTitle: courseTitle || null,
            isPublished: true,
            publishAt: publishDate,
          },
        })

        results.push({ success: true, title, materialId: created.id })
        successCount++
      } catch (err: any) {
        results.push({ success: false, title: m.title || m.fileName, error: err.message || 'Unknown error' })
        failureCount++
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'COURSE_MATERIAL_BULK_UPLOADED',
        resource: 'CourseMaterial',
        resourceId: authUser.facilityId,
        details: `Lecturer bulk-uploaded ${successCount} materials (failed: ${failureCount}) for level ${numericLevel} at facility ${authUser.facilityId}`,
      },
    })

    return NextResponse.json(
      {
        message: `Bulk upload complete: ${successCount} succeeded, ${failureCount} failed`,
        successCount,
        failureCount,
        results,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Bulk upload POST error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk upload materials', details: error.message },
      { status: 500 }
    )
  }
}
