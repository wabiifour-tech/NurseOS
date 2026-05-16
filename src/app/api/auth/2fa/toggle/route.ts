import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import crypto from 'crypto'

// POST /api/auth/2fa/toggle — Toggle 2FA on/off
// When enabling: generates a simplified secret key using crypto.randomUUID()
// When disabling: clears the secret and sets twoFactorEnabled to false
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

    const { enabled, password } = body as { enabled: boolean; password?: string }

    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, twoFactorEnabled: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (enabled) {
      // Enable 2FA: generate a simplified secret key
      if (user.twoFactorEnabled) {
        return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 })
      }

      const secret = crypto.randomUUID()

      await db.user.update({
        where: { id: authUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          userId: authUser.id,
          action: '2FA_ENABLED',
          resource: 'User',
          resourceId: authUser.id,
          details: 'Two-factor authentication was enabled via toggle',
        },
      })

      return NextResponse.json({
        message: '2FA enabled successfully',
        secret,
      })
    } else {
      // Disable 2FA: require password confirmation
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
          details: 'Two-factor authentication was disabled via toggle',
        },
      })

      return NextResponse.json({ message: '2FA disabled successfully' })
    }
  } catch (error) {
    console.error('Error toggling 2FA:', error)
    return NextResponse.json({ error: 'Failed to toggle 2FA' }, { status: 500 })
  }
}
