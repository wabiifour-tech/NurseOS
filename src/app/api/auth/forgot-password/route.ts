import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { checkRateLimit, getRateLimitIdentifier, AUTH_RATE_LIMIT } from '@/lib/rate-limit'

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

      // TODO: Send reset token via email in production
      // For now, return the token in response for development/testing
      // IMPORTANT: In production, remove resetToken from the response and send via email
      return NextResponse.json({
        message: 'If an account exists with this email, a reset token will be provided.',
        // Development only: include token for testing
        ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
      })
    }

    // Always return the same generic message regardless of whether user exists
    // This prevents email enumeration attacks
    return NextResponse.json({
      message: 'If an account exists with this email, a reset token will be provided.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    )
  }
}
