import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

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
export const GET = withAuth({
  auditAction: 'auth.me',
  auditResource: 'session',
}, async (ctx) => {
  const { user: authUser, request } = ctx

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
    return Response.json({ error: 'User not found or inactive' }, { status: 404 })
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
  const existingSession = await db.session.findFirst({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  const token = existingSession?.token || null

  // Normalize role: If user has AdminProfile with accessLevel >= 10, treat as SUPER_ADMIN
  let normalizedRole = user.role
  if (user.role === 'ADMIN' && user.adminProfile && user.adminProfile.accessLevel >= 10) {
    normalizedRole = 'SUPER_ADMIN'
  }

  return Response.json({
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
})
