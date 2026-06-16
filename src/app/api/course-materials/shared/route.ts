/**
 * GET /api/course-materials/shared
 *
 * List materials shared with the current lecturer (recipient) OR sent by the current lecturer.
 *
 * Query params:
 *   ?direction=sent     — materials I shared with others
 *   ?direction=received — materials others shared with me (default)
 *
 * Auth: LECTURER, ADMIN, SUPER_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can view shared materials' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const direction = url.searchParams.get('direction') || 'received'
    const statusFilter = url.searchParams.get('status')  // PENDING, ACCEPTED, REJECTED

    const where: any = {}
    if (direction === 'sent') {
      where.senderId = authUser.id
    } else {
      where.recipientId = authUser.id
    }
    if (statusFilter && ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(statusFilter)) {
      where.status = statusFilter
    }

    const shares = await db.sharedMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            level: true,
            courseCode: true,
            courseTitle: true,
            fileName: true,
            fileSize: true,
            externalUrl: true,
            fileUrl: true,  // included so accepted recipients can view the file
            facility: { select: { id: true, name: true, type: true } },
          },
        },
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facility: { select: { name: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facility: { select: { name: true } },
          },
        },
      },
      take: 100,
    })

    // For "received" shares, only show fileUrl if status is ACCEPTED (security: pending shares don't expose files)
    if (direction === 'received') {
      for (const s of shares) {
        if (s.status !== 'ACCEPTED' && s.material) {
          s.material.fileUrl = null
        }
      }
    }

    return NextResponse.json({ shares, direction })
  } catch (error: any) {
    console.error('Shared materials GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared materials', details: error.message },
      { status: 500 }
    )
  }
}
