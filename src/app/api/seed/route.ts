import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

/**
 * POST /api/seed — DEPRECATED. Previously seeded demo facilities into the database.
 * Blocked by middleware in all environments. Requires ADMIN auth inside handler.
 */
export const POST = withAuth({}, async (ctx) => {
  // Defense-in-depth: require admin auth
  if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
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
})
