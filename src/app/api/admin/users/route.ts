import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, facilityWhereClause } from '@/lib/middleware'
import { SYSTEM_PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/users — List all users (SUPER_ADMIN only)
export const GET = withAuth({
  permissions: [SYSTEM_PERMISSIONS.USER_MANAGE],
  policies: [],
  auditAction: 'admin.users.list',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { searchParams } = new URL(ctx.request.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (role) {
    where.role = role.toUpperCase()
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        facilityId: true,
        createdAt: true,
        lastLoginAt: true,
        facility: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ])

  const formatted = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    facilityId: u.facilityId,
    facilityName: u.facility?.name || null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
  }))

  return NextResponse.json({
    users: formatted,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})
