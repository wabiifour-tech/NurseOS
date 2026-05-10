import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/credentials - List credentials
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = new URL(request.url).searchParams.get('nurseId') || authUser.id
    const limit = parseInt(searchParams.get('limit') || '50')

    const credentials = await db.credential.findMany({
      where: { nurseId },
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
    const body = await request.json()

    if (!body.credentialName || !body.credentialType || !body.issuingBody) {
      return NextResponse.json(
        { error: 'Credential name, type, and issuing body are required' },
        { status: 400 }
      )
    }

    const credential = await db.credential.create({
      data: {
        nurseId: body.nurseId || authUser.id,
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
