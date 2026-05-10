import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/nurseai/notes - List nursing notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId') || ''
    const nurseId = searchParams.get('nurseId') || ''
    const patientId = searchParams.get('patientId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (recordId) {
      where.recordId = recordId
    }
    if (nurseId) {
      where.nurseId = nurseId
    }
    if (patientId) {
      where.medicalRecord = { patientId }
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
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.recordId) {
      return NextResponse.json(
        { error: 'Medical record ID is required' },
        { status: 400 }
      )
    }
    if (!body.nurseId) {
      return NextResponse.json(
        { error: 'Nurse ID is required' },
        { status: 400 }
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

    // Verify medical record exists
    const medicalRecord = await db.medicalRecord.findUnique({
      where: { id: body.recordId },
    })
    if (!medicalRecord) {
      return NextResponse.json(
        { error: 'Medical record not found' },
        { status: 404 }
      )
    }

    const note = await db.nursingNote.create({
      data: {
        recordId: body.recordId,
        nurseId: body.nurseId,
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
