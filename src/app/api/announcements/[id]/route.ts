import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'

// PATCH /api/announcements/[id] - Update an announcement (admin only)
export const PATCH = withAuth({
  permissions: [ADMIN_PERMISSIONS.FACILITY_READ],
  auditAction: 'announcements.update',
  auditResource: 'announcement',
}, async (ctx) => {
  // Extract [id] from pathname (IF-007: MiddlewareContext has no params)
  const id = ctx.request.nextUrl.pathname.split('/').filter(Boolean).pop()

  const existing = await db.announcement.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  // Only author or SUPER_ADMIN can update
  if (existing.authorId !== ctx.user.id && ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Not authorized to update this announcement' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await ctx.request.json()
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
})

// DELETE /api/announcements/[id] - Delete/deactivate an announcement (admin only)
export const DELETE = withAuth({
  permissions: [ADMIN_PERMISSIONS.FACILITY_READ],
  auditAction: 'announcements.delete',
  auditResource: 'announcement',
}, async (ctx) => {
  // Extract [id] from pathname (IF-007: MiddlewareContext has no params)
  const id = ctx.request.nextUrl.pathname.split('/').filter(Boolean).pop()

  const existing = await db.announcement.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  if (existing.authorId !== ctx.user.id && ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Not authorized to delete this announcement' }, { status: 403 })
  }

  try {
    // Hard-delete the announcement
    await db.announcement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
})
