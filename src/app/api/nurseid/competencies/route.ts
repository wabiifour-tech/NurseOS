import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { getNurseProfileId } from '@/lib/auth'

// GET /api/nurseid/competencies - List competencies
export const GET = withAuth({}, async (ctx) => {
  try {
    const nurseId = await getNurseProfileId(ctx.user.id)
    if (!nurseId) {
      return NextResponse.json({ competencies: [], message: 'No nurse profile found' })
    }

    const targetNurseId = new URL(ctx.request.url).searchParams.get('nurseId') || nurseId

    const competencies = await db.competency.findMany({
      where: { nurseId: targetNurseId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ competencies })
  } catch (error) {
    console.error('Error fetching competencies:', error)
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }
})

// POST /api/nurseid/competencies - Add a competency assessment
export const POST = withAuth({}, async (ctx) => {
  try {
    const nurseId = await getNurseProfileId(ctx.user.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found for this user' }, { status: 404 })
    }

    let body;
    try {
      body = await ctx.request.json();
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
})
