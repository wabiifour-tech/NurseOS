import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

/**
 * Authenticated user context with facility scope.
 * Every API route should use this to enforce multi-tenant isolation.
 */
export interface AuthUser {
  id: string
  role: string
  facilityId: string | null
  nurseProfileId: string | null
}

/**
 * Get authenticated user from either:
 * 1. Authorization: Bearer <token> header
 * 2. nurseos-token cookie
 *
 * Returns the user's ID, role, facilityId, and nurseProfileId for multi-tenant isolation.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
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
    include: {
      user: {
        select: {
          id: true,
          role: true,
          status: true,
          nurseProfile: {
            select: {
              id: true,
              currentFacilityId: true,
            },
          },
          adminProfile: {
            select: {
              id: true,
              facilityId: true,
              accessLevel: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
    return null
  }

  // Resolve facilityId from nurse profile or admin profile
  const facilityId =
    session.user.nurseProfile?.currentFacilityId ||
    session.user.adminProfile?.facilityId ||
    null

  const nurseProfileId = session.user.nurseProfile?.id || null

  // Normalize role: If user has AdminProfile with accessLevel >= 10, treat as SUPER_ADMIN
  // The register route maps SUPER_ADMIN → ADMIN in DB, so we need to recover the true role
  let normalizedRole = session.user.role
  if (session.user.role === 'ADMIN' && session.user.adminProfile && (session.user.adminProfile as any).accessLevel >= 10) {
    normalizedRole = 'SUPER_ADMIN'
  }

  return {
    id: session.user.id,
    role: normalizedRole,
    facilityId,
    nurseProfileId,
  }
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

/**
 * Helper to return a 403 Forbidden response when user has no facility
 */
export function noFacilityResponse() {
  return Response.json(
    { error: 'You are not assigned to a facility. Please contact your administrator or select a facility during registration.' },
    { status: 403 }
  )
}

/**
 * Helper to return a 403 Forbidden response when accessing cross-facility data
 */
export function crossFacilityDeniedResponse() {
  return Response.json(
    { error: 'You do not have access to this resource. It belongs to a different facility.' },
    { status: 403 }
  )
}

/**
 * Require that the authenticated user has a facility assignment.
 * Returns the facilityId if assigned, or a 403 response if not.
 *
 * Usage in API routes:
 *   const facilityId = requireFacility(authUser)
 *   if (facilityId instanceof Response) return facilityId
 */
export function requireFacility(authUser: AuthUser): string | Response {
  if (!authUser.facilityId) {
    return noFacilityResponse()
  }
  return authUser.facilityId
}
