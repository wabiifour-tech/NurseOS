import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseai/appointments - List appointments
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

    const where: Record<string, unknown> = {}
    if (patientId) where.patientId = patientId
    if (status) where.status = status
    if (date) where.appointmentDate = new Date(date)

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

  try {
    const body = await request.json()

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

    const appointment = await db.appointment.create({
      data: {
        patientId: body.patientId,
        facilityId: body.facilityId || null,
        departmentId: body.departmentId || null,
        appointmentDate: new Date(body.appointmentDate),
        durationMinutes: body.durationMinutes || 30,
        type: body.type || 'CONSULTATION',
        status,
        reason: body.reason || null,
        notes: body.notes || null,
        attendingNurseId: body.attendingNurseId || null,
        attendingDoctorId: body.attendingDoctorId || null,
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
