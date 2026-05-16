import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Use the authenticated user's ID from the session, not from the request body
    const userId = authUser.id

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain at least one number' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update the password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        resource: 'User',
        resourceId: user.id,
        details: 'User changed their password',
      },
    })

    return NextResponse.json({
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while changing your password. Please try again.' },
      { status: 500 }
    )
  }
}
