import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/superadmin/facilities — List facilities with verification status
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only Super Admins can access this endpoint' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'verified', 'rejected', or 'all'
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status === 'pending') {
      where.isVerified = false
      where.accreditationStatus = 'PENDING'
    } else if (status === 'verified') {
      where.isVerified = true
      where.accreditationStatus = 'VERIFIED'
    } else if (status === 'rejected') {
      where.accreditationStatus = 'REJECTED'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ]
    }

    const facilities = await db.facility.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        state: true,
        country: true,
        phone: true,
        email: true,
        registrationNumber: true,
        accreditingBody: true,
        accreditationStatus: true,
        isVerified: true,
        isEmergencyCapable: true,
        bedCapacity: true,
        createdAt: true,
        // Get the admin who created this facility
        adminProfiles: {
          select: {
            id: true,
            accessLevel: true,
            department: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        // Get subscription status
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
          },
        },
        // Count users at this facility
        users: {
          select: { id: true },
        },
      },
      orderBy: [
        { isVerified: 'asc' }, // Unverified first
        { createdAt: 'desc' },
      ],
    })

    // Separate into categories for easy consumption
    const pendingFacilities = facilities.filter(f => !f.isVerified && f.accreditationStatus === 'PENDING')
    const verifiedFacilities = facilities.filter(f => f.isVerified && f.accreditationStatus === 'VERIFIED')
    const rejectedFacilities = facilities.filter(f => f.accreditationStatus === 'REJECTED')

    return NextResponse.json({
      facilities,
      pendingFacilities,
      verifiedFacilities,
      rejectedFacilities,
      stats: {
        total: facilities.length,
        pending: pendingFacilities.length,
        verified: verifiedFacilities.length,
        rejected: rejectedFacilities.length,
      },
    })
  } catch (error) {
    console.error('Error fetching facilities for super admin:', error)
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}

// PATCH /api/superadmin/facilities — Approve or reject a facility application
export async function PATCH(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only Super Admins can approve facilities' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { facilityId, action, rejectionReason } = body as {
      facilityId: string
      action: 'approve' | 'reject'
      rejectionReason?: string
    }

    if (!facilityId || !action) {
      return NextResponse.json({ error: 'facilityId and action (approve/reject) are required' }, { status: 400 })
    }

    // Find the facility
    const facility = await db.facility.findUnique({
      where: { id: facilityId },
      include: {
        adminProfiles: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
          },
        },
        subscription: { select: { id: true } },
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // ── APPROVE: Verify the facility AND activate the admin ──
      // 1. Mark facility as verified
      await db.facility.update({
        where: { id: facilityId },
        data: {
          isVerified: true,
          accreditationStatus: 'VERIFIED',
        },
      })

      // 2. Activate the facility admin(s)
      for (const adminProfile of facility.adminProfiles) {
        if (adminProfile.user.status === 'PENDING') {
          await db.user.update({
            where: { id: adminProfile.user.id },
            data: { status: 'ACTIVE' },
          })
        }
      }

      // 3. Activate the subscription
      if (facility.subscription) {
        await db.subscription.update({
          where: { id: facility.subscription.id },
          data: { status: 'ACTIVE' },
        })
      }

      // 4. Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'FACILITY_APPROVED',
          resource: 'Facility',
          resourceId: facilityId,
          details: `Approved facility "${facility.name}" (Reg: ${facility.registrationNumber}) in ${facility.city}, ${facility.state}. Admin(s) activated.`,
        },
      })

      // 5. Notify the admin(s) that their facility was approved
      for (const adminProfile of facility.adminProfiles) {
        await db.notification.create({
          data: {
            userId: adminProfile.user.id,
            type: 'FACILITY_APPROVED',
            title: 'Your facility has been approved!',
            message: `Great news! Your facility "${facility.name}" has been verified and approved by the NurseOS team. You can now sign in and start managing your facility.`,
          },
        })
      }

      return NextResponse.json({
        message: `Facility "${facility.name}" approved successfully. Admin account(s) activated.`,
        facility: { id: facility.id, name: facility.name, isVerified: true },
      })

    } else if (action === 'reject') {
      // ── REJECT: Mark facility as rejected AND reject the admin ──
      // 1. Mark facility as rejected
      await db.facility.update({
        where: { id: facilityId },
        data: {
          isVerified: false,
          accreditationStatus: 'REJECTED',
        },
      })

      // 2. Reject the facility admin(s)
      for (const adminProfile of facility.adminProfiles) {
        if (adminProfile.user.status === 'PENDING') {
          await db.user.update({
            where: { id: adminProfile.user.id },
            data: { status: 'DELETED', deletedAt: new Date() },
          })
        }
      }

      // 3. Deactivate the subscription
      if (facility.subscription) {
        await db.subscription.update({
          where: { id: facility.subscription.id },
          data: { status: 'CANCELLED' },
        })
      }

      // 4. Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'FACILITY_REJECTED',
          resource: 'Facility',
          resourceId: facilityId,
          details: `Rejected facility "${facility.name}" (Reg: ${facility.registrationNumber}) in ${facility.city}, ${facility.state}. Reason: ${rejectionReason || 'Not specified'}. Admin account(s) deactivated.`,
        },
      })

      // 5. Notify the admin(s) that their facility was rejected
      for (const adminProfile of facility.adminProfiles) {
        await db.notification.create({
          data: {
            userId: adminProfile.user.id,
            type: 'FACILITY_REJECTED',
            title: 'Facility application rejected',
            message: `Your facility application for "${facility.name}" was not approved. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support if you believe this is an error.'}`,
          },
        })
      }

      return NextResponse.json({
        message: `Facility "${facility.name}" rejected. Admin account(s) deactivated.`,
        facility: { id: facility.id, name: facility.name, accreditationStatus: 'REJECTED' },
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 })
  } catch (error) {
    console.error('Error managing facility:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
