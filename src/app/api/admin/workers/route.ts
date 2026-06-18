import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, noFacilityResponse } from '@/lib/auth'

// GET /api/admin/workers — List workers in the admin's facility
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
    if (!authUser.facilityId) return noFacilityResponse()

    const workers = await db.user.findMany({
      where: {
        OR: [
          { facilityId: authUser.facilityId },
          { nurseProfile: { currentFacilityId: authUser.facilityId } },
          { adminProfile: { facilityId: authUser.facilityId } },
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

    return NextResponse.json({ workers })
  } catch (error) {
    console.error('Error fetching workers:', error)
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 })
  }
}

// PATCH /api/admin/workers — Manage a worker in the admin's facility
// Actions: "remove" — removes the worker from the facility (sets facilityId to null)
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
    if (!authUser.facilityId) return noFacilityResponse()

    const { workerId, action } = await req.json()

    if (!workerId || !action) {
      return NextResponse.json({ error: 'workerId and action required' }, { status: 400 })
    }

    // Verify worker belongs to this facility
    const worker = await db.user.findFirst({
      where: {
        id: workerId,
        OR: [
          { facilityId: authUser.facilityId },
          { nurseProfile: { currentFacilityId: authUser.facilityId } },
          { adminProfile: { facilityId: authUser.facilityId } },
        ],
      },
    })

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found in your facility' }, { status: 404 })
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

      return NextResponse.json({ message: 'Worker removed from facility' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing worker:', error)
    return NextResponse.json({ error: 'Failed to manage worker' }, { status: 500 })
  }
}

// POST /api/admin/workers — Approve or reject a pending user (lecturer/nurse/etc.)
// Body: { userId: string, action: 'approve' | 'reject' }
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
    if (!authUser.facilityId) return noFacilityResponse()

    const { userId, action } = await req.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 })
    }

    // Verify user belongs to this facility and is PENDING
    const user = await db.user.findFirst({
      where: {
        id: userId,
        facilityId: authUser.facilityId,
        status: 'PENDING',
      },
      select: { id: true, firstName: true, lastName: true, email: true, academicRole: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Pending user not found in your facility' }, { status: 404 })
    }

    if (action === 'approve') {
      // Set status to ACTIVE
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
          details: `Approved ${user.academicRole || user.role} ${user.firstName} ${user.lastName} (${user.email})`,
        },
      })

      // Notify the approved user
      await db.notification.create({
        data: {
          userId: userId,
          type: 'ACCOUNT_APPROVED',
          title: 'Your account has been approved!',
          message: `Your ${user.academicRole === 'LECTURER' ? 'lecturer' : user.role.toLowerCase()} account at has been approved. You can now sign in to NurseOS.`,
          data: JSON.stringify({ facilityId: authUser.facilityId }),
        },
      })

      return NextResponse.json({ message: 'User approved successfully' })
    } else {
      // action === 'reject'
      // Set status to REJECTED and remove from facility
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

      // Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'USER_REJECTED',
          resource: 'User',
          resourceId: userId,
          details: `Rejected ${user.academicRole || user.role} ${user.firstName} ${user.lastName} (${user.email})`,
        },
      })

      // Notify the rejected user
      await db.notification.create({
        data: {
          userId: userId,
          type: 'ACCOUNT_REJECTED',
          title: 'Your account application was not approved',
          message: `Your application to join was not approved. If you believe this is an error, please contact support.`,
          data: JSON.stringify({ facilityId: authUser.facilityId }),
        },
      })

      return NextResponse.json({ message: 'User rejected successfully' })
    }
  } catch (error) {
    console.error('Error approving/rejecting worker:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
