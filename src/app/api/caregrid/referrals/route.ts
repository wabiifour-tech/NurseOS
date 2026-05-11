import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/referrals - List referrals
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const fromFacilityId = searchParams.get('fromFacilityId') || ''
    const toFacilityId = searchParams.get('toFacilityId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (fromFacilityId) where.fromFacilityId = fromFacilityId
    if (toFacilityId) where.toFacilityId = toFacilityId

    const [referrals, total] = await Promise.all([
      db.referral.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
          fromFacility: { select: { id: true, name: true, city: true, state: true } },
          toFacility: { select: { id: true, name: true, city: true, state: true } },
          referringNurse: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.referral.count({ where }),
    ])

    return NextResponse.json({
      referrals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
  }
}

// POST /api/caregrid/referrals - Create a referral
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found for this user' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.patientId || !body.toFacilityId) {
      return NextResponse.json(
        { error: 'Patient ID and destination facility are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']
    const status = body.status?.toUpperCase() || 'PENDING'

    const referral = await db.referral.create({
      data: {
        patientId: body.patientId,
        fromFacilityId: body.fromFacilityId || null,
        toFacilityId: body.toFacilityId,
        referringNurseId: body.referringNurseId || nurseId,
        reason: body.reason || null,
        clinicalSummary: body.clinicalSummary || null,
        urgency: body.urgency || 'ROUTINE',
        status,
        notes: body.notes || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        fromFacility: { select: { id: true, name: true } },
        toFacility: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      { message: 'Referral created successfully', referral },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating referral:', error)
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
  }
}
