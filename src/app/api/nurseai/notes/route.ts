import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/nurseai/notes - List nursing notes scoped to nurse's facility
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId') || ''
    const nurseId = searchParams.get('nurseId') || ''
    const patientId = searchParams.get('patientId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // 🔒 FACILITY ISOLATION: Require a facility assignment to view notes
    const facilityIdResult = requireFacility(authUser)
    const isSuperAdmin = authUser.role === 'SUPER_ADMIN'
    if (facilityIdResult instanceof Response && !isSuperAdmin) return facilityIdResult
    const facilityId = facilityIdResult instanceof Response ? null : facilityIdResult

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show notes for records in the nurse's facility (mandatory)
    // SUPER_ADMIN can see ALL data across all facilities
    if (!isSuperAdmin && facilityId) {
      where.medicalRecord = { facilityId }
    }

    if (recordId) {
      where.recordId = recordId
    }
    if (nurseId) {
      where.nurseId = nurseId
    }
    if (patientId) {
      // Add patientId filter within the facility-scoped medical record
      if (isSuperAdmin && !facilityId) {
        // SUPER_ADMIN without facility: just filter by patientId
        where.medicalRecord = { patientId }
      } else {
        where.medicalRecord = { facilityId: facilityId!, patientId }
      }
    }

    const [notes, total] = await Promise.all([
      db.nursingNote.findMany({
        where,
        include: {
          nurse: {
            select: {
              id: true,
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          medicalRecord: {
            select: {
              id: true,
              patientId: true,
              facilityId: true,
              patient: {
                select: {
                  id: true,
                  patientId: true,
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.nursingNote.count({ where }),
    ])

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching nursing notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nursing notes' },
      { status: 500 }
    )
  }
}

// POST /api/nurseai/notes - Create a nursing note
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment
  const facilityIdResult = requireFacility(authUser)
  const isSuperAdmin = authUser.role === 'SUPER_ADMIN'
  if (facilityIdResult instanceof Response && !isSuperAdmin) return facilityIdResult
  const facilityId = facilityIdResult instanceof Response ? null : facilityIdResult

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate required fields
    if (!body.recordId) {
      return NextResponse.json(
        { error: 'Medical record ID is required' },
        { status: 400 }
      )
    }
    if (!authUser.nurseProfileId && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only nurses can create notes' },
        { status: 403 }
      )
    }
    if (!body.noteType) {
      return NextResponse.json(
        { error: 'Note type is required' },
        { status: 400 }
      )
    }
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    // Validate note type
    const validNoteTypes = ['SOAP', 'SBAR', 'NARRATIVE', 'FLOW', 'Progress', 'Assessment', 'Handover', 'Nursing', 'Discharge']
    if (!validNoteTypes.includes(body.noteType)) {
      return NextResponse.json(
        { error: `Invalid note type. Must be one of: ${validNoteTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify medical record exists and belongs to nurse's facility
    const medicalRecord = await db.medicalRecord.findUnique({
      where: { id: body.recordId },
    })
    if (!medicalRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      )
    }

    // 🔒 Verify record belongs to the nurse's facility (SUPER_ADMIN can create for any facility)
    if (!isSuperAdmin && medicalRecord.facilityId !== facilityId) {
      return NextResponse.json(
        { error: 'You can only create notes for records in your facility.' },
        { status: 403 }
      )
    }

    // Resolve nurseId — SUPER_ADMIN may not have a NurseProfile, try to find one
    let resolvedNurseId = authUser.nurseProfileId
    if (!resolvedNurseId && isSuperAdmin) {
      resolvedNurseId = await getNurseProfileId(authUser.id)
    }
    if (!resolvedNurseId) {
      return NextResponse.json(
        { error: 'A nurse profile is required to create notes. Please contact an administrator.' },
        { status: 400 }
      )
    }

    const note = await db.nursingNote.create({
      data: {
        recordId: body.recordId,
        nurseId: resolvedNurseId,
        noteType: body.noteType,
        content: body.content.trim(),
        aiGenerated: body.aiGenerated || false,
        aiPrompt: body.aiPrompt || null,
        isSigned: body.isSigned || false,
        signedAt: body.isSigned ? new Date() : null,
      },
      include: {
        nurse: {
          select: {
            id: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        medicalRecord: {
          select: {
            id: true,
            patientId: true,
            facilityId: true,
            patient: {
              select: {
                id: true,
                patientId: true,
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Nursing note created successfully', note },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating nursing note:', error)
    return NextResponse.json(
      { error: 'Failed to create nursing note' },
      { status: 500 }
    )
  }
}
