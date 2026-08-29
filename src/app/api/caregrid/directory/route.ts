import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'
import { CLINICAL_PERMISSIONS } from '@/lib/permissions'

// GET /api/caregrid/directory - Nurse directory
// Authorization: any authenticated user
// Data minimization: no PII (email, phone, license number) in directory responses
// Facility isolation: non-SUPER_ADMIN users see only their own facility's nurses
export const GET = withAuth({
  policies: ['facility_required'],
  auditAction: 'caregrid.directory.list',
  auditResource: 'nurse',
}, async (ctx) => {
  try {
    const { searchParams } = new URL(ctx.request.url)
    const search = searchParams.get('search') || ''
    const specialty = searchParams.get('specialty') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build facility-scoped where clause
    // SUPER_ADMIN sees all facilities; other roles see only their own facility
    const facilityWhere: Record<string, unknown> = {}
    if (!ctx.isSuperAdmin && ctx.facilityId) {
      facilityWhere.currentFacilityId = ctx.facilityId
    }

    if (search) {
      facilityWhere.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { specialization: { contains: search } },
      ]
    }
    if (specialty) facilityWhere.specialization = { contains: specialty }

    const [nurses, total] = await Promise.all([
      db.nurseProfile.findMany({
        where: facilityWhere,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
              // NOTE: email, phone, and status are NOT returned to prevent PII exposure
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
      db.nurseProfile.count({ where: facilityWhere }),
    ])

    // Map to directory response — data-minimized, no PII
    const mapped = nurses.map((nurse) => ({
      id: nurse.id,
      firstName: nurse.user.firstName,
      lastName: nurse.user.lastName,
      displayName: nurse.user.displayName || `${nurse.user.firstName} ${nurse.user.lastName}`,
      avatarUrl: nurse.user.avatarUrl,
      specialty: nurse.specialization,
      yearsOfExperience: nurse.yearsOfExperience,
      availableForConsultation: nurse.availableForConsult,
      languages: nurse.languages,
      expertise: nurse.skills,
      rating: nurse.rating,
      totalRatings: nurse.totalRatings,
      facility: nurse.facility
        ? {
            id: nurse.facility.id,
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
})
