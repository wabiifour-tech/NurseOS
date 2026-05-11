import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/portfolio - List portfolio entries
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ entries: [], message: 'No nurse profile found' })
    }

    const targetNurseId = new URL(request.url).searchParams.get('nurseId') || nurseId

    const entries = await db.portfolioEntry.findMany({
      where: { nurseId: targetNurseId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

// POST /api/nurseid/portfolio - Add a portfolio entry
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found for this user' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.title || !body.entryType || !body.description) {
      return NextResponse.json(
        { error: 'Title, entry type, and description are required' },
        { status: 400 }
      )
    }

    const entry = await db.portfolioEntry.create({
      data: {
        nurseId,
        title: body.title,
        entryType: body.entryType,
        description: body.description,
        url: body.url || null,
        evidenceUrls: JSON.stringify(body.evidenceUrls || []),
        impactMetrics: body.impactMetrics || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isOngoing: body.isOngoing || false,
        isPublic: body.isPublic !== undefined ? body.isPublic : true,
        featured: body.featured || false,
      },
    })

    return NextResponse.json(
      { message: 'Portfolio entry added successfully', entry },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding portfolio entry:', error)
    return NextResponse.json({ error: 'Failed to add portfolio entry' }, { status: 500 })
  }
}
