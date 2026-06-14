import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/facilities/public
 * Public endpoint — no auth required.
 * Used by registration and onboarding pages to list facilities.
 * SECURITY: Only returns VERIFIED facilities to prevent users from
 * joining unverified/fraudulent facilities.
 * Returns only safe fields (id, name, type, city, state, isVerified).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const state = searchParams.get('state') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

    const where: Record<string, unknown> = {}

    // SECURITY: Only show verified facilities in public listings
    // This prevents users from joining unverified/fraudulent facilities
    where.isVerified = true
    where.accreditationStatus = 'VERIFIED'

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (state) {
      where.state = state
    }

    const facilities = await db.facility.findMany({
      where,
      take: limit,
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        state: true,
        isVerified: true,
      },
    })

    return NextResponse.json({ facilities })
  } catch (error) {
    console.error('Error fetching public facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}
