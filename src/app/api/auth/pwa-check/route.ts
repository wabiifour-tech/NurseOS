import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * PWA OAuth Completion Check
 *
 * When the PWA opens Google OAuth in the system browser, the system browser
 * completes the flow and sets the `nurseos-token` httpOnly cookie.
 * Since the PWA and system browser share cookies on the same origin,
 * the PWA can poll this endpoint to detect when authentication is complete.
 *
 * Returns:
 * - { authenticated: false } if no valid session
 * - { authenticated: true, user: {...} } if a valid session exists
 *
 * This endpoint MUST be public (no auth required) since it's called
 * before the user is logged in.
 */
export async function GET(request: NextRequest) {
  try {
    // Check for the nurseos-token cookie (httpOnly, set by login/OAuth flows)
    const token = request.cookies.get('nurseos-token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    // Validate the session token against the database
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            academicRole: true,
            studentLevel: true,
            matricNumber: true,
            avatarUrl: true,
            status: true,
            nurseProfile: {
              select: {
                id: true,
                currentFacilityId: true,
              },
            },
            facility: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
      return NextResponse.json({ authenticated: false })
    }

    // Normalize role
    let normalizedRole = session.user.role
    if (session.user.role === 'ADMIN' && session.user.nurseProfile) {
      // Check if user has admin profile with high access level
      // (We don't include adminProfile here to keep the query light,
      //  but the auth helper on subsequent requests will handle this)
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: normalizedRole,
        academicRole: session.user.academicRole,
        studentLevel: session.user.studentLevel,
        matricNumber: session.user.matricNumber,
        avatarUrl: session.user.avatarUrl,
        facilityId: session.user.nurseProfile?.currentFacilityId || session.user.facility?.id || null,
        facilityName: session.user.facility?.name || null,
        facilityType: session.user.facility?.type || null,
        nurseProfileId: session.user.nurseProfile?.id || null,
      },
    })
  } catch (error) {
    // If DB is not configured, just return unauthenticated
    console.error('[pwa-check] Error:', error)
    return NextResponse.json({ authenticated: false })
  }
}