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
    const available = searchParams.get('available') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
        { specialization: { contains: search } },
      ]
    }
    if (specialty) where.specialization = { contains: specialty }
    if (facilityId) where.currentFacilityId = facilityId
    if (available === 'true') where.availableForConsult = true

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
          facility: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.nurseProfile.count({ where }),
    ])

    // Map to the expected API format
    const mapped = nurses.map((nurse) => ({
      id: nurse.id,
      userId: nurse.userId,
      specialty: nurse.specialization,
      licenseNumber: nurse.licenseNumber,
      yearsOfExperience: nurse.yearsOfExperience,
      facilityId: nurse.currentFacilityId,
      availableForConsultation: nurse.availableForConsult,
      consultationTypes: null as string | null,
      languages: nurse.languages,
      expertise: nurse.skills,
      rating: nurse.rating,
      totalRatings: nurse.totalRatings,
      createdAt: nurse.createdAt,
      user: nurse.user,
      facility: nurse.facility
        ? {
            name: nurse.facility.name,
            city: nurse.facility.city,
            state: nurse.facility.state,
          }
        : null,
    }))

    return NextResponse.json({
      nurses: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching nurse directory:', error)
    return NextResponse.json({ error: 'Failed to fetch nurse directory' }, { status: 500 })
  }
}
