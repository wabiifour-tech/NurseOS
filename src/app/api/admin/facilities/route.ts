import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/admin/facilities — List all facilities (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ]
    }

    // If filtering by plan, find facility IDs with that plan subscription
    let facilityIdsByPlan: string[] | null = null
    if (plan) {
      const subs = await db.subscription.findMany({
        where: { plan },
        select: { facilityId: true },
      })
      facilityIdsByPlan = subs.map(s => s.facilityId).filter(Boolean) as string[]
      where.id = { in: facilityIdsByPlan }
    }

    const facilities = await db.facility.findMany({
      where,
      include: {
        subscription: { select: { id: true, plan: true, status: true } },
        _count: {
          select: {
            staff: true,
            patientProfiles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const formatted = facilities.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      city: f.city,
      state: f.state,
      country: f.country,
      isVerified: f.isVerified,
      createdAt: f.createdAt.toISOString(),
      plan: f.subscription?.plan || 'FREE',
      planStatus: f.subscription?.status || 'ACTIVE',
      workerCount: f._count.staff,
      patientCount: f._count.patientProfiles,
    }))

    const total = await db.facility.count({ where })

    return NextResponse.json({ facilities: formatted, total })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}
