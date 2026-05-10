import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists (but don't reveal this to the client to prevent email enumeration)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (user) {
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

      // TODO: Send actual password reset email when email service is configured
      // For now, just log the request
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, reset instructions will be sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    // Still return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, reset instructions will be sent.',
    })
  }
}
