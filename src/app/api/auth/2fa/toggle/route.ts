import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import crypto from 'crypto'

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

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, twoFactorEnabled: true, passwordHash: true },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (enabled) {
    // Enable 2FA: generate a proper base32 TOTP secret
    if (user.twoFactorEnabled) {
      return Response.json({ error: '2FA is already enabled. Use the 2FA setup flow to reconfigure.' }, { status: 400 })
    }

    const secret = crypto.randomBytes(20).toString('base64url').toUpperCase().slice(0, 32)

    await db.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    })

    return Response.json({
      message: '2FA enabled successfully. Add this secret to your authenticator app.',
      secret,
    })
  } else {
    // Disable 2FA: require password confirmation
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
  }
})
