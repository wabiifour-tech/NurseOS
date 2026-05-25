import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/auth/logout - Invalidate session and clear cookie
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (authUser) {
      // Delete the session from the database
      const token = request.cookies.get('nurseos-token')?.value
        || request.headers.get('Authorization')?.substring(7)

      if (token) {
        await db.session.deleteMany({
          where: { token },
        }).catch(() => {
          // Session might already be deleted, ignore
        })
      }

      // Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'USER_LOGOUT',
          resource: 'Session',
          resourceId: token || 'unknown',
          details: 'User logged out',
        },
      }).catch(() => {
        // Don't fail logout if audit log fails
      })
    }

    const response = NextResponse.json(
      { message: 'Logged out successfully' }
    )

    // Clear the HttpOnly cookie - use same attributes as when it was set
    response.cookies.set('nurseos-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear the cookie even if DB operations fail
    const response = NextResponse.json(
      { message: 'Logged out' }
    )

    response.cookies.set('nurseos-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  }
}
