import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/auth/logout - Invalidate session and clear cookie
// NOTE: This route intentionally does NOT use withAuth() because logout
// must succeed even if the session is already invalid. The withAuth
// middleware would return 401 and prevent cookie clearing.
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (authUser) {
      const token = request.cookies.get('nurseos-token')?.value
        || request.headers.get('Authorization')?.substring(7)

      if (token) {
        await db.session.deleteMany({
          where: { token },
        }).catch(() => {
          // Session might already be deleted, ignore
        })
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' })

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
    const response = NextResponse.json({ message: 'Logged out' })

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
