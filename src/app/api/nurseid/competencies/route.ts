import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/competencies - List competencies
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = new URL(request.url).searchParams.get('nurseId') || authUser.id

    const competencies = await db.competency.findMany({
      where: { nurseId },
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
    const body = await request.json()

    if (!body.competencyArea || !body.level) {
      return NextResponse.json(
        { error: 'Competency area and level are required' },
        { status: 400 }
      )
    }

    const competency = await db.competency.create({
      data: {
        nurseId: body.nurseId || authUser.id,
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
