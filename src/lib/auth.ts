import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get authenticated user from either:
 * 1. Authorization: Bearer <token> header
 * 2. nurseos-token cookie
 * 
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // Fall back to cookie
  if (!token) {
    token = request.cookies.get('nurseos-token')?.value || null
  }

  if (!token) {
    return null
  }

  // Validate the session
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, role: true, status: true } } },
  })

  if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
    return null
  }

  return { id: session.user.id, role: session.user.role }
}

/**
 * Get the NurseProfile ID for an authenticated user.
 * Most Prisma models (Credential, Competency, PortfolioEntry, CPDRecord, Enrollment, etc.)
 * reference NurseProfile.id, NOT User.id. This helper resolves the correct ID.
 * 
 * Returns null if the user is not a nurse or has no NurseProfile.
 */
export async function getNurseProfileId(userId: string): Promise<string | null> {
  const nurseProfile = await db.nurseProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  return nurseProfile?.id || null
}

/**
 * Helper to return a 401 Unauthorized response
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized. Please log in.' },
    { status: 401 }
  )
}
