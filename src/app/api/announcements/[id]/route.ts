import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// PATCH /api/announcements/[id] - Update an announcement (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only administrators can update announcements' }, { status: 403 })
  }

  try {
    const { id } = await params

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Only author or SUPER_ADMIN can update
    if (existing.authorId !== authUser.id && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized to update this announcement' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    const validCategories = ['GENERAL', 'POLICY', 'SAFETY', 'TRAINING', 'MAINTENANCE', 'EMERGENCY']

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.content !== undefined) updateData.message = body.content.trim()
    if (body.priority !== undefined && validPriorities.includes(body.priority)) updateData.priority = body.priority
    if (body.category !== undefined && validCategories.includes(body.category)) updateData.category = body.category
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned
    if (body.isGlobal !== undefined) updateData.isGlobal = body.isGlobal
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const updated = await db.announcement.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
        facility: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ announcement: updated })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE /api/announcements/[id] - Delete/deactivate an announcement (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only administrators can delete announcements' }, { status: 403 })
  }

  try {
    const { id } = await params

    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (existing.authorId !== authUser.id && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Not authorized to delete this announcement' }, { status: 403 })
    }

    // Hard-delete the announcement
    await db.announcement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
