import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import crypto from 'crypto'

// Generate a base32-encoded random secret for TOTP
function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length)
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < bytes.length; i++) {
    secret += base32Chars[bytes[i] % 32]
  }
  return secret
}

// POST /api/auth/2fa/setup — Generate a new TOTP secret for the user
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, twoFactorEnabled: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: '2FA is already enabled. Disable it first to set up again.' }, { status: 400 })
    }

    // Generate a new TOTP secret
    const secret = generateBase32Secret()

    // Store the secret (but don't enable 2FA yet — user must verify first)
    await db.user.update({
      where: { id: authUser.id },
      data: { twoFactorSecret: secret },
    })

    // Build the otpauth URI for authenticator apps
    const issuer = 'NurseOS'
    const accountName = user.email
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

    return NextResponse.json({
      secret,
      otpauthUrl,
      manualEntryKey: secret,
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json({ error: 'Failed to set up 2FA' }, { status: 500 })
  }
}

// DELETE /api/auth/2fa/setup — Disable 2FA
export async function DELETE(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { password } = body
    if (!password) {
      return NextResponse.json({ error: 'Password is required to disable 2FA' }, { status: 400 })
    }

    // Verify password
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bcrypt = await import('bcryptjs')
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Disable 2FA and clear the secret
    await db.user.update({
      where: { id: authUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    // Create audit log
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
    console.error('Error disabling 2FA:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
