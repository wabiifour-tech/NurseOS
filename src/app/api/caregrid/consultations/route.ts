import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/consultations - List consultations
// Cross-facility: shows consultations involving the nurse (as requester or consultant)
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Show consultations where the nurse is either
    // the requester or the consultant (cross-facility consultations are intentional)
    if (authUser.nurseProfileId) {
      where.OR = [
        { requestingNurseId: authUser.nurseProfileId },
        { consultingNurseId: authUser.nurseProfileId },
      ]
    } else {
      // Non-nurse users (e.g., admin) should not see all consultations
      return NextResponse.json({ consultations: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }

    if (status) where.status = status

    const [consultations, total] = await Promise.all([
      db.consultation.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
          requestingNurse: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
          consultingNurse: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.consultation.count({ where }),
    ])

    return NextResponse.json({
      consultations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 })
  }
}

// POST /api/caregrid/consultations - Create a consultation
// Cross-facility: allows consulting nurses from other facilities
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)

    const body = await request.json()

    // Support type allows missing consultingNurseId (for support requests)
    const isSupportRequest = body.consultationType === 'SUPPORT'

    if (!isSupportRequest && !body.consultingNurseId) {
      return NextResponse.json(
        { error: 'Consulting nurse ID is required for consultations' },
        { status: 400 }
      )
    }

    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    // For support requests without a consulting nurse, find an available admin/support nurse
    let consultingNurseId = body.consultingNurseId
    if (!consultingNurseId) {
      const supportNurse = await db.nurseProfile.findFirst({
        where: { availableForConsult: true },
        select: { id: true },
      })
      consultingNurseId = supportNurse?.id || 'system-support'
    }

    if (!nurseId) {
      return NextResponse.json({ error: 'Only nurses can create consultations' }, { status: 403 })
    }

    const consultation = await db.consultation.create({
      data: {
        requestingNurseId: nurseId,
        consultingNurseId,
        patientId: body.patientId || null,
        recordId: body.recordId || null,
        consultationType: body.consultationType || body.type || 'CHAT',
        subject: body.subject,
        description: body.description,
        status: body.status || 'REQUESTED',
        notes: body.notes || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    })

    return NextResponse.json(
      { message: 'Consultation created successfully', consultation },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating consultation:', error)
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 })
  }
}
