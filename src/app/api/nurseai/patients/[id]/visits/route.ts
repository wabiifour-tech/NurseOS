import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'
import { requireFacility, crossFacilityDeniedResponse } from '@/lib/auth'

// GET /api/nurseai/patients/[id]/visits - List visit records for a patient
export const GET = withAuth({}, async (ctx) => {
  const facilityId = requireFacility(ctx)
  if (facilityId instanceof Response) return facilityId

  try {
    const id = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2,-1)[0]!

    // Verify patient exists and belongs to facility
    const patient = await db.patientProfile.findUnique({
      where: { id },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.facilityId && patient.facilityId !== facilityId) {
      return crossFacilityDeniedResponse()
    }

    const visits = await db.visitRecord.findMany({
      where: { patientId: id },
      orderBy: { visitDate: 'desc' },
    })

    const formattedVisits = visits.map((v) => ({
      id: v.id,
      patientId: v.patientId,
      facilityId: v.facilityId,
      visitDate: v.visitDate.toISOString(),
      visitType: v.visitType,
      outcome: v.outcome,
      createdAt: v.createdAt.toISOString(),
    }))

    return NextResponse.json({ visits: formattedVisits })
  } catch (error) {
    console.error('Error fetching visit records:', error)
    return NextResponse.json({ error: 'Failed to fetch visit records' }, { status: 500 })
  }
})

// POST /api/nurseai/patients/[id]/visits - Create a new visit record
export const POST = withAuth({}, async (ctx) => {
  const facilityId = requireFacility(ctx)
  if (facilityId instanceof Response) return facilityId

  try {
    const id = ctx.request.nextUrl.pathname.split('/').filter(Boolean).slice(-2,-1)[0]!

    // Verify patient exists and belongs to facility
    const patient = await db.patientProfile.findUnique({
      where: { id },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.facilityId && patient.facilityId !== facilityId) {
      return crossFacilityDeniedResponse()
    }

    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.visitType) {
      return NextResponse.json({ error: 'Visit type is required' }, { status: 400 })
    }

    const visit = await db.visitRecord.create({
      data: {
        patientId: id,
        facilityId,
        visitDate: body.visitDate ? new Date(body.visitDate) : new Date(),
        visitType: body.visitType,
        outcome: body.outcome || null,
      },
    })

    return NextResponse.json({
      visit: {
        id: visit.id,
        patientId: visit.patientId,
        facilityId: visit.facilityId,
        visitDate: visit.visitDate.toISOString(),
        visitType: visit.visitType,
        outcome: visit.outcome,
        createdAt: visit.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating visit record:', error)
    return NextResponse.json({ error: 'Failed to create visit record' }, { status: 500 })
  }
})
