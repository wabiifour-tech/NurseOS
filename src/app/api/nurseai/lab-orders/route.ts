import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse, requireFacility, crossFacilityDeniedResponse } from '@/lib/auth'

// GET /api/nurseai/lab-orders - List lab orders
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (status) where.status = status.toUpperCase()

    // Get patients in this facility
    const patientIds = await db.patientProfile.findMany({
      where: { facilityId },
      select: { id: true },
    })
    const pIds = patientIds.map(p => p.id)

    where.patientId = { in: pIds }

    const labOrders = await db.labOrder.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        medicalRecord: {
          select: { id: true, encounterType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const formatted = labOrders.map((order) => ({
      id: order.id,
      patientId: order.patientId,
      patientName: order.patient.user
        ? `${order.patient.user.firstName} ${order.patient.user.lastName}`.trim()
        : order.patient.patientId,
      recordId: order.recordId,
      orderedBy: order.orderedBy,
      testName: order.testName,
      testCategory: order.testCategory,
      specimenType: order.specimenType,
      urgency: order.urgency,
      status: order.status,
      resultValue: order.resultValue,
      resultUnit: order.resultUnit,
      referenceRange: order.referenceRange,
      isAbnormal: order.isAbnormal,
      resultDate: order.resultDate?.toISOString() || null,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
    }))

    return NextResponse.json({ labOrders: formatted })
  } catch (error) {
    console.error('Error fetching lab orders:', error)
    return NextResponse.json({ error: 'Failed to fetch lab orders' }, { status: 500 })
  }
}

// POST /api/nurseai/lab-orders - Create a new lab order
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found' }, { status: 404 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.patientId || !body.testName || !body.testCategory) {
      return NextResponse.json(
        { error: 'Patient ID, test name, and test category are required' },
        { status: 400 }
      )
    }

    // Verify patient belongs to this facility
    const patient = await db.patientProfile.findUnique({
      where: { id: body.patientId },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (patient.facilityId && patient.facilityId !== facilityId) {
      return crossFacilityDeniedResponse()
    }

    // Find or create a medical record for this patient
    let recordId = body.recordId
    if (!recordId) {
      const record = await db.medicalRecord.create({
        data: {
          patientId: body.patientId,
          facilityId,
          encounterType: 'LAB_ORDER',
          chiefComplaint: `Lab order: ${body.testName}`,
          attendingNurseId: nurseId,
        },
      })
      recordId = record.id
    }

    const labOrder = await db.labOrder.create({
      data: {
        patientId: body.patientId,
        recordId,
        orderedBy: body.orderedBy || `${authUser.id}`,
        testName: body.testName,
        testCategory: body.testCategory,
        specimenType: body.specimenType || null,
        urgency: body.urgency || 'ROUTINE',
        status: 'ORDERED',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ labOrder }, { status: 201 })
  } catch (error) {
    console.error('Error creating lab order:', error)
    return NextResponse.json({ error: 'Failed to create lab order' }, { status: 500 })
  }
}
