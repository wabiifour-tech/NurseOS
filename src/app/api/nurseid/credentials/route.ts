import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/credentials - List credentials
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ credentials: [], message: 'No nurse profile found' })
    }

    const { searchParams } = new URL(request.url)
    const targetNurseId = searchParams.get('nurseId') || nurseId
    const limit = parseInt(searchParams.get('limit') || '50')

    const credentials = await db.credential.findMany({
      where: { nurseId: targetNurseId },
      orderBy: { issueDate: 'desc' },
      take: limit,
    })

    return NextResponse.json({ credentials })
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

// POST /api/nurseid/credentials - Add a credential
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found for this user' }, { status: 404 })
    }

    const body = await request.json()

    if (!body.credentialName || !body.credentialType || !body.issuingBody) {
      return NextResponse.json(
        { error: 'Credential name, type, and issuing body are required' },
        { status: 400 }
      )
    }

    const credential = await db.credential.create({
      data: {
        nurseId,
        credentialName: body.credentialName,
        credentialType: body.credentialType,
        issuingBody: body.issuingBody,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        credentialNumber: body.credentialNumber || null,
        isVerified: false,
        documentUrl: body.documentUrl || null,
        isPublic: body.isPublic || false,
      },
    })

    return NextResponse.json(
      { message: 'Credential added successfully', credential },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding credential:', error)
    return NextResponse.json({ error: 'Failed to add credential' }, { status: 500 })
  }
}
