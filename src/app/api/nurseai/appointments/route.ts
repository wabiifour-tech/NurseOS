import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/nurseai/appointments - List appointments scoped to nurse's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId') || ''
    const status = searchParams.get('status') || ''
    const date = searchParams.get('date') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // 🔒 FACILITY ISOLATION: Require a facility assignment to view appointments
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show appointments in the nurse's facility (mandatory)
    where.facilityId = facilityId

    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (date) {
      where.appointmentDate = {
        gte: new Date(date + 'T00:00:00.000Z'),
        lt: new Date(date + 'T23:59:59.999Z'),
      }
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              user: { select: { firstName: true, lastName: true, displayName: true } },
            },
          },
          facility: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy: { appointmentDate: 'asc' },
      }),
      db.appointment.count({ where }),
    ])

    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

// POST /api/nurseai/appointments - Schedule an appointment
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.patientId || !body.appointmentDate) {
      return NextResponse.json(
        { error: 'Patient ID and appointment date are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED']
    const status = body.status?.toUpperCase() || 'SCHEDULED'
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // 🔒 Always assign to the nurse's facility
    const appointment = await db.appointment.create({
      data: {
        patientId: body.patientId,
        facilityId,
        appointmentDate: new Date(body.appointmentDate),
        durationMinutes: body.durationMinutes || 30,
        type: body.type || 'CONSULTATION',
        status,
        reason: body.reason || null,
        notes: body.notes || null,
        nurseId: body.nurseId || authUser.nurseProfileId || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Appointment scheduled successfully', appointment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error scheduling appointment:', error)
    return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 })
  }
}
