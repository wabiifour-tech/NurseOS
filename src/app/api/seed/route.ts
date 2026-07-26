import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

/**
 * POST /api/seed — DEPRECATED. Previously seeded demo facilities into the database.
 * Blocked by middleware in all environments. Requires ADMIN auth inside handler.
 */
export async function POST(request: NextRequest) {
  // Defense-in-depth: require admin auth
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()
  if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const existingCount = await db.facility.count()
    return NextResponse.json({
      message: 'Facility seeding is disabled. ' +
        `Current facility count: ${existingCount}.`,
      status: 'seeding_disabled',
      currentFacilityCount: existingCount,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error?.message?.substring(0, 200) },
      { status: 500 }
    )
  }
}
