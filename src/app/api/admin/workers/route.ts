import { db } from '@/lib/db'
import { withAuth, denial } from '@/lib/middleware'
import { ADMIN_PERMISSIONS } from '@/lib/permissions'

// GET /api/admin/workers — List workers in the admin's facility
export const GET = withAuth({
  permissions: [ADMIN_PERMISSIONS.STAFF_READ],
  policies: ['facility_strict'],
  auditAction: 'admin.workers.list',
  auditResource: 'user',
}, async (ctx) => {
  const facilityId = ctx.facilityId!

  const workers = await db.user.findMany({
    where: {
      OR: [
        { facilityId },
        { nurseProfile: { currentFacilityId: facilityId } },
        { adminProfile: { facilityId } },
      ],
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      nurseProfile: { select: { licenseNumber: true, specialization: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ workers })
})

// PATCH /api/admin/workers — Manage a worker in the admin's facility
// Actions: "remove" — removes the worker from the facility
export const PATCH = withAuth({
  permissions: [ADMIN_PERMISSIONS.STAFF_WRITE],
  policies: ['facility_strict'],
  auditAction: 'admin.workers.manage',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const facilityId = ctx.facilityId!

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { workerId, action } = body

  if (!workerId || !action) {
    return Response.json({ error: 'workerId and action required' }, { status: 400 })
  }

  // Verify worker belongs to this facility
  const worker = await db.user.findFirst({
    where: {
      id: workerId,
      OR: [
        { facilityId },
        { nurseProfile: { currentFacilityId: facilityId } },
        { adminProfile: { facilityId } },
      ],
    },
  })

  if (!worker) {
    return Response.json({ error: 'Worker not found in your facility' }, { status: 404 })
  }

  if (action === 'remove') {
    // Remove worker from facility
    await db.user.update({
      where: { id: workerId },
      data: { facilityId: null },
    })
    // Also update nurse profile if exists
    await db.nurseProfile.updateMany({
      where: { userId: workerId },
      data: { currentFacilityId: null },
    })
    await db.adminProfile.updateMany({
      where: { userId: workerId },
      data: { facilityId: null },
    })

    return Response.json({ message: 'Worker removed from facility' })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
})

// POST /api/admin/workers — Approve or reject a pending user (lecturer/nurse/etc.)
export const POST = withAuth({
  permissions: [ADMIN_PERMISSIONS.STAFF_WRITE],
  policies: ['facility_strict'],
  auditAction: 'admin.workers.approve',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { user: authUser } = ctx
  const facilityId = ctx.facilityId!

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, action } = body

  if (!userId || !action) {
    return Response.json({ error: 'userId and action required' }, { status: 400 })
  }

  if (!['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 })
  }

  // Verify user belongs to this facility and is PENDING
  const user = await db.user.findFirst({
    where: {
      id: userId,
      facilityId,
      status: 'PENDING',
    },
    select: { id: true, firstName: true, lastName: true, email: true, academicRole: true, role: true },
  })

  if (!user) {
    return Response.json({ error: 'Pending user not found in your facility' }, { status: 404 })
  }

  // Look up the facility name for notification messages
  const facilityName = (await db.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  }))?.name || 'your facility'

  // Find and dismiss the admin's USER_APPROVAL notification for this user
  const adminNotification = await db.notification.findFirst({
    where: {
      userId: authUser.id,
      type: 'USER_APPROVAL',
      isRead: false,
      message: { contains: user.email },
    },
    select: { id: true },
  })

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
        message: `Your ${user.academicRole === 'LECTURER' ? 'lecturer' : user.role.toLowerCase()} account at ${facilityName} has been approved. You can now sign in to NurseOS.`,
        data: JSON.stringify({ facilityId }),
      },
    })

    // Dismiss the admin's USER_APPROVAL notification for this user
    if (adminNotification) {
      await db.notification.delete({ where: { id: adminNotification.id } })
    }

    return Response.json({ message: 'User approved successfully' })
  } else {
    // action === 'reject'
    await db.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        facilityId: null,
      },
    })

    // Also remove from nurse profile
    await db.nurseProfile.updateMany({
      where: { userId },
      data: { currentFacilityId: null },
    })

    // Notify the rejected user
    await db.notification.create({
      data: {
        userId,
        type: 'ACCOUNT_REJECTED',
        title: 'Your account application was not approved',
        message: `Your application to join ${facilityName} was not approved. If you believe this is an error, please contact your institution admin or support.`,
        data: JSON.stringify({ facilityId }),
      },
    })

    // Dismiss the admin's USER_APPROVAL notification for this user
    if (adminNotification) {
      await db.notification.delete({ where: { id: adminNotification.id } })
    }

    return Response.json({ message: 'User rejected successfully' })
  }
})
