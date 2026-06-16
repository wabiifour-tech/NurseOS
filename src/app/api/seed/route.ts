import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/seed — DEPRECATED. Previously seeded demo facilities into the database.
 *
 * This endpoint is now a NO-OP for facility seeding. The user explicitly requested that
 * NO seeded facilities / institutions be present in the production database — only
 * real user-created facilities should exist.
 *
 * The endpoint still accepts requests for backward compatibility but does NOT create
 * any facilities. If you need to create a facility, use the normal signup flow
 * (Facility Admin or Institution Admin role on the /register page).
 *
 * If you have existing seeded facilities in your database that you want to remove,
 * run this SQL against your Postgres database:
 *
 *   DELETE FROM "Facility" WHERE "isVerified" = true AND "registrationNumber" LIKE 'FAC/%';
 *
 * (This deletes only seeded demo facilities — real user-created facilities use
 * registrationNumber = NULL or have a real registration number that doesn't match the pattern.)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== process.env.NEXTAUTH_SECRET && secret !== 'nurseos-seed-2024') {
      return NextResponse.json({ error: 'Invalid seed secret' }, { status: 403 })
    }

    const existingCount = await db.facility.count()
    return NextResponse.json({
      message: 'Facility seeding is disabled. The database should only contain real user-created facilities. ' +
        `Current facility count: ${existingCount}. ` +
        'To remove leftover demo facilities, run: DELETE FROM "Facility" WHERE "registrationNumber" LIKE \'FAC/%\';',
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
