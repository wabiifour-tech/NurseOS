import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/consultations - List consultations
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
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const body = await request.json()

    if (!body.consultingNurseId || !body.subject || !body.description) {
      return NextResponse.json(
        { error: 'Consulting nurse ID, subject, and description are required' },
        { status: 400 }
      )
    }

    const consultation = await db.consultation.create({
      data: {
        requestingNurseId: body.requestingNurseId || authUser.id,
        consultingNurseId: body.consultingNurseId,
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
