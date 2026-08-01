import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

/**
 * GET /api/auth/me - Get current authenticated user info.
 *
 * This endpoint is the **source of truth** for client-side auth recovery.
 * When Zustand persist fails to rehydrate from localStorage (e.g., after a
 * full-page navigation via window.location.assign), the dashboard layout calls
 * this endpoint using the HttpOnly `nurseos-token` cookie to verify the session
 * and repopulate the Zustand store.
 *
 * Returns: user object, token, facilityId, facilityName, nurseProfileId
 */
export async function GET(request: NextRequest) {
  const t0 = Date.now()
  const debugHeaderRaw = request.headers.get('X-Auth-Debug-Id')
  const debugHeaderPresent = !!debugHeaderRaw
  const reqId = debugHeaderRaw || 'missing'
  const cookieToken = request.cookies.get('nurseos-token')?.value || null
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  console.warn(`[AUTH-TIMELINE][req=${reqId}] ME_START debugHeaderPresent=${debugHeaderPresent} cookieTokenPresent=${!!cookieToken} cookieTokenLen=${cookieToken?.length || 0} bearerTokenPresent=${!!bearerToken}`)

  const authUser = await getAuthenticatedUser(request)
  const t1 = Date.now()
  if (!authUser) {
    console.warn(`[AUTH-TIMELINE][req=${reqId}] ME_AUTH_NULL t=${t1 - t0}ms cookieTokenPresent=${!!cookieToken} bearerTokenPresent=${!!bearerToken}`)
    return unauthorizedResponse()
  }
  console.warn(`[AUTH-TIMELINE][req=${reqId}] ME_AUTH_OK t=${t1 - t0}ms userId=${authUser.id} role=${authUser.role} facilityId=${authUser.facilityId || 'null'}`)

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        nurseProfile: {
          include: {
            facility: {
              select: { id: true, name: true },
            },
          },
        },
        adminProfile: {
          include: {
            facility: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      return unauthorizedResponse()
    }

    // Resolve facility info from nurse or admin profile
    const facilityId =
      user.nurseProfile?.currentFacilityId ||
      user.adminProfile?.facilityId ||
      null

    const facilityName =
      user.nurseProfile?.facility?.name ||
      user.adminProfile?.facility?.name ||
      null

    // Fetch facility type so the sidebar can differentiate hospital admin from institution admin
    let facilityType: string | null = null
    if (facilityId) {
      const f = await db.facility.findUnique({ where: { id: facilityId }, select: { type: true } })
      facilityType = f?.type || null
    }

    const nurseProfileId = user.nurseProfile?.id || null

    // Get the current active session token
    const t2 = Date.now()
    const existingSession = await db.session.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    const t3 = Date.now()

    const token = existingSession?.token || null
    const tokenMatchesCookie = token && cookieToken && token === cookieToken
    console.warn(`[AUTH-TIMELINE][req=${reqId}] ME_SESSION_LOOKUP t=${t3 - t2}ms sessionFound=${!!existingSession} returnedTokenPresent=${!!token} returnedTokenLen=${token?.length || 0} cookieTokenLen=${cookieToken?.length || 0} tokensMatch=${tokenMatchesCookie} totalElapsed=${t3 - t0}ms`)

    // Normalize role: If user has AdminProfile with accessLevel >= 10, treat as SUPER_ADMIN
    let normalizedRole = user.role
    if (user.role === 'ADMIN' && user.adminProfile && user.adminProfile.accessLevel >= 10) {
      normalizedRole = 'SUPER_ADMIN'
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: normalizedRole,
        academicRole: user.academicRole || null,
        studentLevel: user.studentLevel ?? null,
        matricNumber: (user as any).matricNumber || null,
        avatarUrl: user.avatarUrl || null,
        nurseProfile: user.nurseProfile ? {
          id: user.nurseProfile.id,
          currentFacilityId: user.nurseProfile.currentFacilityId,
          facility: user.nurseProfile.facility,
        } : null,
        adminProfile: user.adminProfile ? {
          id: user.adminProfile.id,
          facilityId: user.adminProfile.facilityId,
          facility: user.adminProfile.facility,
        } : null,
      },
      token,
      facilityId,
      facilityName,
      facilityType,
      nurseProfileId,
    })
  } catch (error) {
    console.error(`[AUTH-TIMELINE][req=${reqId}] ME_ERROR`, error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
