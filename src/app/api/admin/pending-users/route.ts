import { db } from '@/lib/db'
import { withAuth, denial } from '@/lib/middleware'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/pending-users — List pending users for the admin's facility
export const GET = withAuth({
  permissions: [ADMIN_PERMISSIONS.STAFF_READ],
  policies: ['facility_required'],
  auditAction: 'admin.pending-users.list',
  auditResource: 'user',
}, async (ctx) => {
  const { user: authUser } = ctx

  // SUPER_ADMIN sees all pending users; ADMIN sees only their facility's
  const where: Record<string, unknown> = { status: 'PENDING' }
  if (!ctx.isSuperAdmin && ctx.facilityId) {
    where.facilityId = ctx.facilityId
  }

  const pendingUsers = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      academicRole: true,
      studentLevel: true,
      avatarUrl: true,
      phone: true,
      createdAt: true,
      facility: { select: { id: true, name: true } },
      nurseProfile: { select: { licenseNumber: true, specialization: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ pendingUsers })
})

// PATCH /api/admin/pending-users — Approve or reject a pending user
export const PATCH = withAuth({
  permissions: [ADMIN_PERMISSIONS.STAFF_WRITE],
  policies: ['facility_required'],
  auditAction: 'admin.pending-users.manage',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { user: authUser } = ctx

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, action } = body as { userId: string; action: 'approve' | 'reject' }

  if (!userId || !action) {
    return Response.json({ error: 'userId and action (approve/reject) are required' }, { status: 400 })
  }

  // Find the pending user
  const pendingUser = await db.user.findUnique({ where: { id: userId } })
  if (!pendingUser) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (pendingUser.status !== 'PENDING') {
    return Response.json({ error: 'User is not in PENDING status' }, { status: 400 })
  }

  // Verify the admin has authority over this user's facility
  if (!ctx.isSuperAdmin && pendingUser.facilityId !== ctx.facilityId) {
    return denial('FACILITY_MISMATCH',
      'You can only manage users in your facility',
      403,
    )
  }

  if (action === 'approve') {
    await db.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    })

    // Notify the approved user
    await db.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_APPROVED',
        title: 'Your account has been approved!',
        message: `Welcome to NurseOS! The admin has approved your access. You can now sign in and start using the platform.`,
      },
    })

    return Response.json({ message: 'User approved successfully' })
  } else if (action === 'reject') {
    // Soft-delete the user by marking as rejected
    await db.user.update({
      where: { id: userId },
      data: { status: 'DELETED', deletedAt: new Date() },
    })

    return Response.json({ message: 'User rejected' })
  }

  return Response.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 })
})
