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
          message: `Welcome to NurseOS! The admin has approved your access. You can now sign in and start using the platform.`,
        },
      })

      return NextResponse.json({ message: 'User approved successfully' })
    } else if (action === 'reject') {
      // Soft-delete the user by marking as rejected
      await db.user.update({
        where: { id: userId },
        data: { status: 'DELETED', deletedAt: new Date() },
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

      return NextResponse.json({ message: 'User rejected' })
    }

    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 })
  } catch (error) {
    console.error('Error managing pending user:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
