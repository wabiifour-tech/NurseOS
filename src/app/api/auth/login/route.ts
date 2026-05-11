import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database is not configured yet. Please set up a PostgreSQL database in your Vercel project (Dashboard → Storage → Create Postgres). Then redeploy the app.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        nurseProfile: true,
        adminProfile: true,
        patientProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 403 }
      )
    }

    // Create session token
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'Session',
        resourceId: token,
        details: `User logged in: ${email}`,
      },
    })

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      expiresAt,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    // Check if it's a database connection error
    const errorMsg = error?.message || ''
    if (errorMsg.includes('connect') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('P1001') || errorMsg.includes('server is not reachable')) {
      return NextResponse.json(
        { error: 'Database is not configured yet. Please set up a PostgreSQL database in your Vercel project (Dashboard → Storage → Create Postgres). Then redeploy the app.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}
