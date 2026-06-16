/**
 * Comments / Q&A Thread for Course Materials
 *
 * GET  /api/course-materials/[id]/comments   — List all comments + threaded replies
 * POST /api/course-materials/[id]/comments   — Add a new comment or reply
 *
 * Auth: LECTURER, STUDENT, ADMIN, SUPER_ADMIN (all academic users at the material's facility)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      select: { id: true, facilityId: true, level: true, title: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization — student must be at the same facility + level
    if (authUser.academicRole === 'STUDENT') {
      if (material.facilityId !== authUser.facilityId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      if (material.level !== authUser.studentLevel) {
        return NextResponse.json({ error: 'You can only access materials for your level' }, { status: 403 })
      }
    } else if (
      authUser.academicRole !== 'LECTURER' &&
      authUser.role !== 'ADMIN' &&
      authUser.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Fetch top-level comments with replies (1-level deep — sufficient for Q&A threads)
    const comments = await db.materialComment.findMany({
      where: {
        materialId: id,
        parentId: null,  // top-level only — replies are fetched via include
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            academicRole: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                academicRole: true,
              },
            },
          },
        },
      },
      take: 200,
    })

    return NextResponse.json({ comments })
  } catch (error: any) {
    console.error('Comments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      select: { id: true, facilityId: true, level: true, title: true, uploaderId: true },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization — students at same facility+level, lecturers at same facility, admins at same facility
    if (authUser.academicRole === 'STUDENT') {
      if (material.facilityId !== authUser.facilityId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      if (material.level !== authUser.studentLevel) {
        return NextResponse.json({ error: 'You can only comment on materials for your level' }, { status: 403 })
      }
    } else if (authUser.academicRole === 'LECTURER') {
      if (material.facilityId !== authUser.facilityId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    } else if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { content, parentId } = body
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Comment is too long (max 5000 characters)' }, { status: 400 })
    }

    // If parentId is provided, validate that the parent comment exists + is on the same material
    if (parentId) {
      const parent = await db.materialComment.findUnique({
        where: { id: parentId },
        select: { id: true, materialId: true, parentId: true },
      })
      if (!parent || parent.materialId !== id) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
      }
      // Disallow nested replies (only 1 level of nesting for Q&A clarity)
      if (parent.parentId !== null) {
        return NextResponse.json({ error: 'Nested replies are not supported. Reply to the top-level comment instead.' }, { status: 400 })
      }
    }

    const isLecturerResponse = authUser.academicRole === 'LECTURER'

    const comment = await db.materialComment.create({
      data: {
        materialId: id,
        authorId: authUser.id,
        parentId: parentId || null,
        content: content.trim(),
        isLecturerResponse,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            academicRole: true,
          },
        },
      },
    })

    // Notify the material uploader (lecturer) when a student asks a question (top-level only)
    if (!parentId && material.uploaderId !== authUser.id) {
      try {
        const author = await db.user.findUnique({
          where: { id: authUser.id },
          select: { firstName: true, lastName: true, academicRole: true },
        })
        await db.notification.create({
          data: {
            userId: material.uploaderId,
            type: 'MATERIAL_COMMENT',
            title: 'New question on your material',
            message: `${author?.firstName || 'A student'} ${author?.lastName || ''} asked a question on "${material.title}"`,
            data: JSON.stringify({
              materialId: id,
              commentId: comment.id,
              materialTitle: material.title,
            }),
          },
        })
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('Comments POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    )
  }
}
