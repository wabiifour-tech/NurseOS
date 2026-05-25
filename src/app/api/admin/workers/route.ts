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
