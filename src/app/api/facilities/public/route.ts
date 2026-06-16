import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/facilities/public
 * Public endpoint — no auth required.
 * Used by registration and onboarding pages to list facilities.
 *
 * Visibility rules:
 *   - Regular healthcare facilities (HOSPITAL, CLINIC, PHC, etc.) → must be VERIFIED
 *     (isVerified=true + accreditationStatus in ['VERIFIED', 'ACCREDITED'])
 *   - Academic institutions (UNIVERSITY, SCHOOL_OF_NURSING) → visible immediately, even when PENDING,
 *     because the institution admin who created them is ACTIVE and the 1-week free trial starts at creation.
 *     Lecturers and students need to be able to find their institution in the dropdown right away.
 *
 * Returns only safe fields (id, name, type, city, state, isVerified).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const state = searchParams.get('state') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)

    // Build a single OR clause: either it's a verified healthcare facility,
    // OR it's an academic institution (which is always visible regardless of verification).
    const orConditions: Record<string, unknown>[] = [
      {
        AND: [
          { isVerified: true },
          { accreditationStatus: { in: ['VERIFIED', 'ACCREDITED'] } },
        ],
      },
      {
        type: { in: ['UNIVERSITY', 'SCHOOL_OF_NURSING'] },
      },
    ]

    const where: Record<string, unknown> = {
      OR: orConditions,
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { state: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (state) {
      where.AND = where.AND || []
      ;(where.AND as Record<string, unknown>[]).push({ state })
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
