import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// POST /api/auth/2fa/toggle — Disable 2FA only.
//
// NOTE: 2FA setup has been moved to the /api/auth/2fa/setup + /api/auth/2fa/verify flow.
// The previous toggle endpoint had a critical bug where it generated an incompatible
// base64url secret and enabled 2FA without requiring the user to verify a valid OTP.
//
// To enable 2FA:
//   1. POST /api/auth/2fa/setup — generates a proper base32 secret and returns the otpauth URI
//   2. POST /api/auth/2fa/verify — submits a valid OTP code; only then is 2FA enabled

export const POST = withAuth({
  auditAction: 'auth.2fa.toggle',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { user: authUser } = ctx

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { enabled, password } = body as { enabled: boolean; password?: string }

  // 2FA enablement is no longer supported through this endpoint.
  // Use /api/auth/2fa/setup + /api/auth/2fa/verify instead.
  if (enabled) {
    return Response.json({
      error: 'Please use the 2FA setup flow: POST /api/auth/2fa/setup, then POST /api/auth/2fa/verify.',
      code: 'USE_SETUP_FLOW',
    }, { status: 400 })
  }

  // Disable 2FA: require password confirmation
  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, twoFactorEnabled: true, passwordHash: true },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.twoFactorEnabled) {
    return Response.json({ error: '2FA is not enabled' }, { status: 400 })
  }

  if (!password) {
    return Response.json({ error: 'Password is required to disable 2FA' }, { status: 400 })
  }

  const bcrypt = await import('bcryptjs')
  const validPassword = await bcrypt.compare(password, user.passwordHash)
  if (!validPassword) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  await db.user.update({
    where: { id: authUser.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  })

  return Response.json({ message: '2FA disabled successfully' })
})
