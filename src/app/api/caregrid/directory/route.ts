import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/directory - Nurse directory
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''
    const facilityId = searchParams.get('facilityId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
        { specialty: { contains: search } },
      ]
    }
    if (specialty) where.specialty = { contains: specialty }
    if (facilityId) where.facilityId = facilityId

    const [nurses, total] = await Promise.all([
      db.nurseProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.nurseProfile.count({ where }),
    ])

    return NextResponse.json({
      nurses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching nurse directory:', error)
    return NextResponse.json({ error: 'Failed to fetch nurse directory' }, { status: 500 })
  }
}
