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

    // ─── Target-scope filtering (academic module) ───
    // Each user only sees announcements targeted at them:
    //   - ALL: everyone sees it
    //   - LEVEL: only students/lecturers whose studentLevel matches targetLevel (or lecturers, who see all level-specific)
    //   - LECTURERS: only users with academicRole='LECTURER' (or admins)
    //   - STUDENTS: only users with academicRole='STUDENT' (or admins)
    // Admins see everything in their facility.
    const isAdmin = authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      const scopeConditions: Record<string, unknown>[] = [{ targetScope: 'ALL' }]
      if (authUser.academicRole === 'LECTURER') {
        // Lecturers see LEVEL announcements (any level — they manage all levels), LECTURERS, and ALL
        scopeConditions.push({ targetScope: 'LECTURERS' })
        scopeConditions.push({ targetScope: 'LEVEL' })
      } else if (authUser.academicRole === 'STUDENT') {
        // Students see STUDENTS, ALL, and LEVEL where targetLevel === their level
        scopeConditions.push({ targetScope: 'STUDENTS' })
        if (authUser.studentLevel) {
          scopeConditions.push({
            AND: [
              { targetScope: 'LEVEL' },
              { targetLevel: authUser.studentLevel },
            ],
          })
        }
      }
      // Wrap the existing OR with the scope filter
      where.AND = where.AND || []
      where.AND.push({ OR: scopeConditions })
    }

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

// POST /api/announcements - Create an announcement (admin OR lecturer for academic institutions)
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // Admins (facility or institution) AND lecturers can create announcements.
  // Lecturers are restricted to their own institution + academic scopes (LEVEL/LECTURERS/STUDENTS).
  const isAdmin = authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN'
  const isLecturer = authUser.academicRole === 'LECTURER'
  if (!isAdmin && !isLecturer) {
    return NextResponse.json({ error: 'Only administrators or lecturers can create announcements' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, content, priority, category, facilityId, isPinned, expiresAt, isGlobal, targetScope, targetLevel } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Only SUPER_ADMIN can create system-wide announcements (facilityId = null)
    let targetFacilityId = facilityId || null
    if (!targetFacilityId && (authUser.role === 'ADMIN' || isLecturer)) {
      // Regular admin / lecturer must target their own facility
      targetFacilityId = authUser.facilityId
    }

    // ADMIN / LECTURER can only post to their own facility
    if ((authUser.role === 'ADMIN' || isLecturer) && targetFacilityId && targetFacilityId !== authUser.facilityId) {
      return NextResponse.json({ error: 'You can only create announcements for your own facility' }, { status: 403 })
    }

    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    const validCategories = ['GENERAL', 'POLICY', 'SAFETY', 'TRAINING', 'MAINTENANCE', 'EMERGENCY']
    const validScopes = ['ALL', 'LEVEL', 'LECTURERS', 'STUDENTS']
    const validLevels = [100, 200, 300, 400, 500]

    // Lecturers can only use academic scopes (LEVEL / LECTURERS / STUDENTS). Admins can use any.
    let finalScope = validScopes.includes(targetScope) ? targetScope : 'ALL'
    if (isLecturer && finalScope === 'ALL') {
      // Lecturers defaulting to ALL still allowed (treated as facility-wide for their institution)
    }
    if (isLecturer && !['LEVEL', 'LECTURERS', 'STUDENTS', 'ALL'].includes(finalScope)) {
      finalScope = 'ALL'
    }

    // If scope is LEVEL, targetLevel must be a valid level
    let finalLevel: number | null = null
    if (finalScope === 'LEVEL') {
      if (!validLevels.includes(Number(targetLevel))) {
        return NextResponse.json(
          { error: 'targetLevel must be one of 100, 200, 300, 400, 500 when targetScope is LEVEL' },
          { status: 400 }
        )
      }
      finalLevel = Number(targetLevel)
    }

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
        targetScope: finalScope,
        targetLevel: finalLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true, academicRole: true },
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
      // For level-targeted announcements, only notify users matching the scope
      if (finalScope === 'LEVEL' && finalLevel) {
        // Notify only students with the matching level + all lecturers + admins at the facility
        const targetUsers = await db.user.findMany({
          where: {
            facilityId: targetFacilityId,
            status: 'ACTIVE',
            OR: [
              { academicRole: 'LECTURER' },
              { academicRole: 'STUDENT', studentLevel: finalLevel },
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' },
            ],
          },
          select: { id: true },
        })
        await Promise.all(
          targetUsers.map((u) =>
            createNotification({
              userId: u.id,
              type: 'ANNOUNCEMENT',
              title: `${priorityLabel} Announcement (${finalLevel} Level)`,
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
      } else if (finalScope === 'LECTURERS') {
        const targetUsers = await db.user.findMany({
          where: {
            facilityId: targetFacilityId,
            status: 'ACTIVE',
            OR: [{ academicRole: 'LECTURER' }, { role: 'ADMIN' }, { role: 'SUPER_ADMIN' }],
          },
          select: { id: true },
        })
        await Promise.all(
          targetUsers.map((u) =>
            createNotification({
              userId: u.id,
              type: 'ANNOUNCEMENT',
              title: `${priorityLabel} Announcement (Lecturers)`,
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
      } else if (finalScope === 'STUDENTS') {
        const targetUsers = await db.user.findMany({
          where: {
            facilityId: targetFacilityId,
            status: 'ACTIVE',
            academicRole: 'STUDENT',
          },
          select: { id: true },
        })
        await Promise.all(
          targetUsers.map((u) =>
            createNotification({
              userId: u.id,
              type: 'ANNOUNCEMENT',
              title: `${priorityLabel} Announcement (Students)`,
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
      } else {
        // ALL scope — notify everyone in the facility
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
      }
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
