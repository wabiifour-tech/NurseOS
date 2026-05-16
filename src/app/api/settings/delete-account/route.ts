import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// POST /api/settings/delete-account — Soft-delete user account
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

    const { password } = body
    if (!password) {
      return NextResponse.json({ error: 'Password confirmation is required' }, { status: 400 })
    }

    // Verify password
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bcrypt = await import('bcryptjs')
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Soft-delete: mark as deleted, anonymize PII, set status to DELETED
    const anonymousId = `deleted-${user.id.slice(0, 8)}-${Date.now().toString(36)}`
    await db.user.update({
      where: { id: authUser.id },
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
      where: { userId: authUser.id },
    })

    // Create audit log (before email is anonymized — the userId still works)
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'ACCOUNT_DELETED',
        resource: 'User',
        resourceId: authUser.id,
        details: 'User account was soft-deleted and PII anonymized',
      },
    })

    // Clear the auth cookie
    const response = NextResponse.json({ message: 'Account deleted successfully' })
    response.cookies.set('nurseos-token', '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
