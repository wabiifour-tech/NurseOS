import { NextRequest, NextResponse } from 'next/server' 
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/admin/pending-users — List pending users for the admin's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // Only ADMIN and SUPER_ADMIN can view pending users
  if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const where: Record<string, unknown> = { status: 'PENDING' }

    // Facility admin sees only their facility's pending users
    if (authUser.role !== 'SUPER_ADMIN' && authUser.facilityId) {
      where.facilityId = authUser.facilityId
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

    return NextResponse.json({ pendingUsers })
  } catch (error) {
    console.error('Error fetching pending users:', error)
    return NextResponse.json({ error: 'Failed to fetch pending users' }, { status: 500 })
  }
}

// PATCH /api/admin/pending-users — Approve or reject a pending user
export async function PATCH(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { userId, action } = body as { userId: string; action: 'approve' | 'reject' }

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action (approve/reject) are required' }, { status: 400 })
    }

    // Find the pending user
    const pendingUser = await db.user.findUnique({ where: { id: userId } })
    if (!pendingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (pendingUser.status !== 'PENDING') {
      return NextResponse.json({ error: 'User is not in PENDING status' }, { status: 400 })
    }

    // Verify the admin has authority over this user's facility
    if (authUser.role !== 'SUPER_ADMIN' && pendingUser.facilityId !== authUser.facilityId) {
      return NextResponse.json({ error: 'You can only manage users in your facility' }, { status: 403 })
    }

    // Look up the facility name for notification messages
    const facilityName = pendingUser.facilityId
      ? (await db.facility.findUnique({ where: { id: pendingUser.facilityId }, select: { name: true } }))?.name || 'your facility'
      : 'your facility'

    // Find and dismiss the admin's USER_APPROVAL notification for this user
    // The notification data field contains the pending user's info
    const adminNotification = await db.notification.findFirst({
      where: {
        userId: authUser.id,
        type: 'USER_APPROVAL',
        isRead: false,
        message: { contains: pendingUser.email },
      },
      select: { id: true },
    })

    if (action === 'approve') {
      await db.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'USER_APPROVED',
          resource: 'User',
          resourceId: userId,
          details: `Approved user ${pendingUser.email}`,
        },
      })

      // Notify the approved user
      await db.notification.create({
        data: {
          userId,
          type: 'ACCOUNT_APPROVED',
          title: 'Your account has been approved!',
          message: `Welcome to NurseOS! Your access to ${facilityName} has been approved. You can now sign in and start using the platform.`,
          data: JSON.stringify({ facilityId: pendingUser.facilityId }),
        },
      })

      // Dismiss the admin's USER_APPROVAL notification for this user
      if (adminNotification) {
        await db.notification.delete({ where: { id: adminNotification.id } })
      }

      return NextResponse.json({ message: 'User approved successfully' })
    } else if (action === 'reject') {
      // Set status to REJECTED and clear facility assignment
      await db.user.update({
        where: { id: userId },
        data: {
          status: 'REJECTED',
          facilityId: null,
        },
      })

      // Also clear nurseProfile facility reference if it exists
      await db.nurseProfile.updateMany({
        where: { userId },
        data: { currentFacilityId: null },
      })

      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'USER_REJECTED',
          resource: 'User',
          resourceId: userId,
          details: `Rejected user ${pendingUser.email}`,
        },
      })

      // Notify the rejected user
      await db.notification.create({
        data: {
          userId,
          type: 'ACCOUNT_REJECTED',
          title: 'Your account application was not approved',
          message: `Your application to join ${facilityName} was not approved. If you believe this is an error, please contact your institution admin or support.`,
          data: JSON.stringify({ facilityId: pendingUser.facilityId }),
        },
      })

      // Dismiss the admin's USER_APPROVAL notification for this user
      if (adminNotification) {
        await db.notification.delete({ where: { id: adminNotification.id } })
      }

      return NextResponse.json({ message: 'User rejected' })
    }

    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 })
  } catch (error) {
    console.error('Error managing pending user:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
