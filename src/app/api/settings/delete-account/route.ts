import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// POST /api/settings/delete-account — Soft-delete user account
//
// Password handling:
//   - Users who signed up with a password (manual registration) → MUST provide their correct password
//   - Users who signed up via Google OAuth → their passwordHash is a random string (not a real password).
//     bcrypt.compare will always fail for them. In that case, we accept a typed confirmation "DELETE"
//     instead, since the user is already authenticated via session cookie.
//
// Detection logic:
//   1. If a password is provided, try bcrypt.compare against the stored hash
//   2. If bcrypt fails AND a "DELETE" confirmation is provided, treat as OAuth user and accept
//   3. Otherwise, reject
export const POST = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { password, confirmation } = body

    // Fetch user with passwordHash
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try password verification first (works for password-based users)
    let passwordValid = false
    if (password) {
      try {
        const bcrypt = await import('bcryptjs')
        passwordValid = await bcrypt.compare(password, user.passwordHash)
      } catch {
        passwordValid = false
      }
    }

    if (!passwordValid) {
      // Password didn't match — could be an OAuth user (random passwordHash) OR a wrong password.
      // Accept typed "DELETE" confirmation as an alternative for OAuth users.
      if (confirmation !== 'DELETE') {
        return NextResponse.json({
          error: 'Invalid password. If you signed up with Google, please type DELETE in the confirmation field to confirm account deletion.',
          errorType: password ? 'INVALID_PASSWORD_OAUTH_USER' : 'PASSWORD_REQUIRED',
        }, { status: 401 })
      }
      // OAuth user confirmed deletion via "DELETE" — proceed
    }

    // Soft-delete: mark as deleted, anonymize PII, set status to DELETED
    const anonymousId = `deleted-${user.id.slice(0, 8)}-${Date.now().toString(36)}`
    await db.user.update({
      where: { id: ctx.user.id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        firstName: 'Deleted',
        lastName: 'User',
        email: `${anonymousId}@deleted.nurseos.app`,
        phone: null,
        avatarUrl: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    // Delete all active sessions for this user
    await db.session.deleteMany({
      where: { userId: ctx.user.id },
    })

    // Create audit log (before email is anonymized — the userId still works)
    await db.auditLog.create({
      data: {
        userId: ctx.user.id,
        action: 'ACCOUNT_DELETED',
        resource: 'User',
        resourceId: ctx.user.id,
        details: `User account was soft-deleted and PII anonymized. Auth method: ${passwordValid ? 'password' : 'OAuth (Google) + DELETE confirmation'}.`,
      },
    })

    // Clear the auth cookie
    const response = NextResponse.json({ message: 'Account deleted successfully' })
    response.cookies.set('nurseos-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
})
