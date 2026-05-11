import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/caregrid/referrals - List referrals
// Shows referrals FROM and TO the nurse's facility (cross-facility visibility for referrals is intentional)
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const direction = searchParams.get('direction') || '' // 'outgoing', 'incoming', or '' (both)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Require facility assignment to view referrals
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    // Show referrals where the nurse's facility is either the source or the destination
    if (direction === 'outgoing') {
      where.fromFacilityId = facilityId
    } else if (direction === 'incoming') {
      where.toFacilityId = facilityId
    } else {
      where.OR = [
        { fromFacilityId: facilityId },
        { toFacilityId: facilityId },
      ]
    }

    if (status) where.status = status

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
// Cross-facility: referral FROM nurse's facility TO another facility
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility to create referrals
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

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

    // 🔒 Verify the patient belongs to the nurse's facility before referring
    const patient = await db.patientProfile.findUnique({
      where: { id: body.patientId },
    })
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }
    if (patient.facilityId && patient.facilityId !== facilityId) {
      return NextResponse.json(
        { error: 'You can only refer patients from your own facility.' },
        { status: 403 }
      )
    }

    // 🔒 Ensure referral is to a DIFFERENT facility (cross-facility referral)
    if (body.toFacilityId === facilityId) {
      return NextResponse.json(
        { error: 'Cannot refer a patient to the same facility. Use consultations instead.' },
        { status: 400 }
      )
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']
    const status = body.status?.toUpperCase() || 'PENDING'

    const referral = await db.referral.create({
      data: {
        patientId: body.patientId,
        fromFacilityId: facilityId, // 🔒 Auto-assign to nurse's facility
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
