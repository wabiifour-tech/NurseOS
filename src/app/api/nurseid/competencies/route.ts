import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/competencies - List competencies
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ competencies: [], message: 'No nurse profile found' })
    }

    const targetNurseId = new URL(request.url).searchParams.get('nurseId') || nurseId

    const competencies = await db.competency.findMany({
      where: { nurseId: targetNurseId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ competencies })
  } catch (error) {
    console.error('Error fetching competencies:', error)
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }
}

// POST /api/nurseid/competencies - Add a competency assessment
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found for this user' }, { status: 404 })
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.competencyArea || !body.level) {
      return NextResponse.json(
        { error: 'Competency area and level are required' },
        { status: 400 }
      )
    }

    const competency = await db.competency.create({
      data: {
        nurseId,
        competencyArea: body.competencyArea,
        level: body.level,
        assessedBy: body.assessedBy || null,
        assessedAt: body.assessedAt ? new Date(body.assessedAt) : new Date(),
        evidence: body.evidence || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    return NextResponse.json(
      { message: 'Competency assessment added successfully', competency },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding competency:', error)
    return NextResponse.json({ error: 'Failed to add competency' }, { status: 500 })
  }
}
