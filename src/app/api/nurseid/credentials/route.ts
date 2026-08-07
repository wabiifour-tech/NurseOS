import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, denial } from '@/lib/middleware'
import { ACADEMIC_PERMISSIONS } from '@/lib/permissions'
import { getNurseProfileId } from '@/lib/auth'

// GET /api/nurseid/credentials - List credentials
export const GET = withAuth({
  permissions: [ACADEMIC_PERMISSIONS.CREDENTIAL_READ],
  policies: ['nurse_profile_required'],
  auditAction: 'credential.list',
  auditResource: 'credential',
}, async (ctx) => {
  const nurseId = ctx.nurseProfileId
  if (!nurseId) {
    return NextResponse.json({ credentials: [], message: 'No nurse profile found' })
  }

  const { searchParams } = new URL(ctx.request.url)
  const targetNurseId = searchParams.get('nurseId') || nurseId
  const limit = parseInt(searchParams.get('limit') || '50')

  // Ownership: other nurses can only see public credentials
  const where: Record<string, unknown> = { nurseId: targetNurseId }
  if (targetNurseId !== nurseId) {
    where.isPublic = true
  }

  const credentials = await db.credential.findMany({
    where,
    orderBy: { issueDate: 'desc' },
    take: limit,
  })

  return NextResponse.json({ credentials })
})

// POST /api/nurseid/credentials - Add a credential
export const POST = withAuth({
  permissions: [ACADEMIC_PERMISSIONS.CREDENTIAL_WRITE],
  policies: ['nurse_profile_required'],
  auditAction: 'credential.create',
  auditResource: 'credential',
}, async (ctx) => {
  const nurseId = ctx.nurseProfileId
  if (!nurseId) {
    return denial('NURSE_PROFILE_REQUIRED', 'No nurse profile found for this user', 404)
  }

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.credentialName || !body.credentialType || !body.issuingBody) {
    return NextResponse.json(
      { error: 'Credential name, type, and issuing body are required' },
      { status: 400 },
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
    { status: 201 },
  )
})
