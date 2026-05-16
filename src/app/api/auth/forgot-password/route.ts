import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { email } = body

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
      // Generate a secure reset token
      const resetToken = randomUUID()
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

      // Create audit log for password reset request
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'User',
          resourceId: user.id,
          details: `Password reset requested for: ${email}`,
        },
      })

      // Since we can't send emails, return the token in the response
      // so the frontend can display it to the user
      return NextResponse.json({
        message: 'Password reset token generated successfully.',
        resetToken,
        email: user.email,
      })
    }

    // For security, still return a generic success message
    // but without a token (user doesn't exist)
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
