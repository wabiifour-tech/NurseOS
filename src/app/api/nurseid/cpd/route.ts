import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/cpd - List CPD records
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ records: [], totalPoints: 0, totalRecords: 0, message: 'No nurse profile found' })
    }

    const targetNurseId = new URL(request.url).searchParams.get('nurseId') || nurseId

    const records = await db.cPDRecord.findMany({
      where: { nurseId: targetNurseId },
      orderBy: { dateCompleted: 'desc' },
    })

    const totalPoints = records.reduce((sum, r) => sum + (r.cpdPoints || 0), 0)

    return NextResponse.json({ records, totalPoints, totalRecords: records.length })
  } catch (error) {
    console.error('Error fetching CPD records:', error)
    return NextResponse.json({ error: 'Failed to fetch CPD records' }, { status: 500 })
  }
}

// POST /api/nurseid/cpd - Log a CPD activity
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

    if (!body.title || !body.activityType || !body.cpdPoints) {
      return NextResponse.json(
        { error: 'Title, activity type, and CPD points are required' },
        { status: 400 }
      )
    }

    const record = await db.cPDRecord.create({
      data: {
        nurseId,
        title: body.title,
        activityType: body.activityType,
        description: body.description || null,
        cpdPoints: body.cpdPoints,
        dateCompleted: body.dateCompleted ? new Date(body.dateCompleted) : new Date(),
        provider: body.provider || null,
        certificateUrl: body.certificateUrl || null,
        isVerified: false,
      },
    })

    return NextResponse.json(
      { message: 'CPD activity logged successfully', record },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error logging CPD activity:', error)
    return NextResponse.json({ error: 'Failed to log CPD activity' }, { status: 500 })
  }
}
