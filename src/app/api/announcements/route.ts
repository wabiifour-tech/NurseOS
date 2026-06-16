import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { createNotification, notifyFacilityUsers } from '@/lib/notify'

// GET /api/announcements - List announcements for the current user
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const category = searchParams.get('category') || ''
    const priority = searchParams.get('priority') || ''
    const includeSystemWide = searchParams.get('system') !== 'false'
    const skip = (page - 1) * limit

    // Build where clause: show facility announcements + system-wide (facilityId = null)
    const whereConditions: Record<string, unknown>[] = []

    // Facility-scoped announcements
    if (authUser.facilityId) {
      whereConditions.push({ facilityId: authUser.facilityId })
    }

    // System-wide announcements (SUPER_ADMIN created, facilityId is null)
    if (includeSystemWide) {
      whereConditions.push({ facilityId: null })
    }

    // If admin, also show announcements they authored
    if (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') {
      whereConditions.push({ authorId: authUser.id })
    }

    const where: Record<string, unknown> = {
      isGlobal: true,
      OR: whereConditions.length > 0 ? whereConditions : [{ facilityId: null }],
    }

    if (category) where.category = category
    if (priority) where.priority = priority

    // Filter out expired announcements
    where.OR = (where.OR as Record<string, unknown>[]).map((condition) => ({
      ...condition,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    }))

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
          },
          facility: {
            select: { id: true, name: true },
          },
          reads: {
            where: { userId: authUser.id },
            select: { id: true, readAt: true },
          },
          _count: {
            select: { reads: true },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      db.announcement.count({ where }),
    ])

    // Transform to include isRead flag
    const transformed = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.message,
      priority: a.priority,
      category: a.category,
      isPinned: a.isPinned,
      expiresAt: a.expiresAt,
      isGlobal: a.isGlobal,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      author: a.author,
      facility: a.facility,
      isRead: a.reads.length > 0,
      readCount: a._count.reads,
    }))

    return NextResponse.json({
      announcements: transformed,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST /api/announcements - Create an announcement (admin only)
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // Only admins can create announcements
  if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only administrators can create announcements' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, content, priority, category, facilityId, isPinned, expiresAt, isGlobal } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Only SUPER_ADMIN can create system-wide announcements (facilityId = null)
    let targetFacilityId = facilityId || null
    if (!targetFacilityId && authUser.role === 'ADMIN') {
      // Regular admin must target their own facility
      targetFacilityId = authUser.facilityId
    }

    // ADMIN can only post to their own facility
    if (authUser.role === 'ADMIN' && targetFacilityId && targetFacilityId !== authUser.facilityId) {
      return NextResponse.json({ error: 'You can only create announcements for your own facility' }, { status: 403 })
    }

    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    const validCategories = ['GENERAL', 'POLICY', 'SAFETY', 'TRAINING', 'MAINTENANCE', 'EMERGENCY']

    const announcement = await db.announcement.create({
      data: {
        authorId: authUser.id,
        facilityId: targetFacilityId,
        title: title.trim(),
        message: content.trim(),
        priority: validPriorities.includes(priority) ? priority : 'NORMAL',
        category: validCategories.includes(category) ? category : 'GENERAL',
        isPinned: isPinned === true,
        isGlobal: !targetFacilityId || isGlobal === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
        },
        facility: {
          select: { id: true, name: true },
        },
      },
    })

    // Send notifications to affected users
    const priorityLabel = announcement.priority === 'URGENT' ? 'URGENT' : announcement.priority === 'HIGH' ? 'Important' : 'New'
    const scopeLabel = targetFacilityId ? '' : ' [System-Wide]'

    if (targetFacilityId) {
      await notifyFacilityUsers(targetFacilityId, {
        type: 'ANNOUNCEMENT',
        title: `${priorityLabel} Announcement${scopeLabel}`,
        message: `${announcement.title}`,
        data: JSON.stringify({
          announcementId: announcement.id,
          category: announcement.category,
          priority: announcement.priority,
          action: 'NEW_ANNOUNCEMENT',
        }),
        force: announcement.priority === 'URGENT' || announcement.priority === 'HIGH',
      })
    } else {
      // System-wide — notify all active users
      const allUsers = await db.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      })
      await Promise.all(
        allUsers.map((u) =>
          createNotification({
            userId: u.id,
            type: 'ANNOUNCEMENT',
            title: `${priorityLabel} System Announcement`,
            message: announcement.title,
            data: JSON.stringify({
              announcementId: announcement.id,
              category: announcement.category,
              priority: announcement.priority,
              action: 'NEW_ANNOUNCEMENT',
            }),
            force: announcement.priority === 'URGENT',
          })
        )
      )
    }

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
