import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { checkRateLimit, getRateLimitIdentifier, AUTH_RATE_LIMIT } from '@/lib/rate-limit'
import { sendSystemEmail, EMAIL_CONFIG } from '@/lib/email'
import { PasswordResetEmail } from '@/emails/password-reset'

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { email } = body

    // Rate limiting
    const rateLimitResult = checkRateLimit(getRateLimitIdentifier(request), AUTH_RATE_LIMIT)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (user) {
      // Generate a secure reset token using cryptographically random bytes
      const resetToken = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

      // Store the reset token in the PasswordReset table
      await db.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      })

      // Create audit log for password reset request (use userId, not plaintext email)
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'User',
          resourceId: user.id,
          details: 'Password reset requested',
        },
      })

      // ── Send password reset email ──
      const resetUrl = `${EMAIL_CONFIG.appUrl}/reset-password?token=${resetToken}`

      try {
        await sendSystemEmail({
          to: user.email,
          subject: 'Reset Your NurseOS Password',
          templateId: 'password-reset',
          react: PasswordResetEmail({
            userName: `${user.firstName} ${user.lastName}`,
            resetUrl,
            resetToken,
            expiryMinutes: 60,
          }),
          recipientId: user.id,
        })
        console.log(`[Auth] Password reset email sent to ${user.email}`)
      } catch (emailError) {
        // Log the error but don't fail the request — the token is still stored
        console.error('[Auth] Failed to send password reset email:', emailError)
      }

      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        // Development only: include token for testing
        ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
      })
    }

    // Always return the same generic message regardless of whether user exists
    // This prevents email enumeration attacks
    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    )
  }
}
