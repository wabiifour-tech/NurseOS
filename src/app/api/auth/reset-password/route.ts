import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      )
    }

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

    // Look up the reset token
    const resetRecord = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: 'This reset token has already been used. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    await db.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    })

    // Mark the reset token as used
    await db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: resetRecord.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'User',
        resourceId: resetRecord.userId,
        details: 'Password reset completed via reset token',
      },
    })

    // Invalidate all existing sessions for this user (force re-login)
    await db.session.deleteMany({
      where: { userId: resetRecord.userId },
    })

    return NextResponse.json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    )
  }
}
