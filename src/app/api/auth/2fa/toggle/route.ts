import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * DEPRECATED: POST /api/auth/2fa/toggle
 *
 * This endpoint previously allowed enabling 2FA without verifying the user
 * actually had the TOTP secret configured in their authenticator app.
 * That meant a user could enable 2FA and immediately lock themselves out.
 *
 * The correct 2FA flow is now:
 *   1. POST /api/auth/2fa/setup   — generates secret + QR code
 *   2. User scans QR code in their authenticator app
 *   3. POST /api/auth/2fa/verify  — user enters a valid TOTP code
 *   4. 2FA is enabled ONLY after successful verification
 *
 * This endpoint now ONLY supports disabling 2FA (requires password).
 * Enabling 2FA via this endpoint returns a 400 with guidance.
 */

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { enabled, password } = body as { enabled?: boolean; password?: string }

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, twoFactorEnabled: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ─── Enable path: REJECTED — use the setup+verify flow instead ───
    if (enabled) {
      return NextResponse.json({
        error: 'This endpoint no longer supports enabling 2FA. Please use POST /api/auth/2fa/setup to generate a QR code, then POST /api/auth/2fa/verify with a valid TOTP code to enable 2FA.',
        correctFlow: [
          'POST /api/auth/2fa/setup   → get secret + QR code',
          'Scan QR code in your authenticator app',
          'POST /api/auth/2fa/verify  → enter a valid 6-digit code to enable',
        ],
      }, { status: 400 })
    }

    // ─── Disable path: require password confirmation ───
    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required to disable 2FA' }, { status: 400 })
    }

    const bcrypt = await import('bcryptjs')
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await db.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: '2FA_DISABLED',
        resource: 'User',
        resourceId: authUser.id,
        details: 'Two-factor authentication was disabled',
      },
    })

    return NextResponse.json({ message: '2FA disabled successfully' })
  } catch (error) {
    console.error('Error toggling 2FA:', error)
    return NextResponse.json({ error: 'Failed to toggle 2FA' }, { status: 500 })
  }
}
