import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getRateLimitIdentifier, AUTH_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (IP-based, token-based to prevent reset token brute-force)
    const rateLimitResult = await checkRateLimit(getRateLimitIdentifier(request), AUTH_RATE_LIMIT)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

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

    // Use a transaction to prevent TOCTOU race condition on the reset token
    const result = await db.$transaction(async (tx) => {
      // Look up the reset token within the transaction
      const resetRecord = await tx.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      })

      if (!resetRecord) {
        throw new Error('INVALID_TOKEN')
      }

      // Check if token has expired
      if (resetRecord.expiresAt < new Date()) {
        throw new Error('TOKEN_EXPIRED')
      }

      // Check if token has already been used
      if (resetRecord.usedAt) {
        throw new Error('TOKEN_USED')
      }

      // Hash the new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // Update the user's password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      })

      // Mark the reset token as used (atomic with the password update)
      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      })

      return resetRecord
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: result.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        resource: 'User',
        resourceId: result.userId,
        details: 'Password reset completed via reset token',
      },
    })

    // Invalidate all existing sessions for this user (force re-login)
    await db.session.deleteMany({
      where: { userId: result.userId },
    })

    return NextResponse.json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    })
  } catch (error: any) {
    // Handle known transaction errors
    if (error?.message === 'INVALID_TOKEN') {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new one.' },
        { status: 400 }
      )
    }
    if (error?.message === 'TOKEN_EXPIRED') {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }
    if (error?.message === 'TOKEN_USED') {
      return NextResponse.json(
        { error: 'This reset token has already been used. Please request a new one.' },
        { status: 400 }
      )
    }
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    )
  }
}
