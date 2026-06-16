/**
 * POST /api/auth/dev-login
 *
 * DEVELOPMENT / TESTING ONLY — bypasses Google OAuth.
 *
 * Allows logging in with email + password for testing purposes. This is needed because
 * the production signup flow is Google-only (per product decision), but for testing
 * the full role-based dashboard flow (institution admin, lecturer, student), we need
 * a way to create test accounts with passwords and log in as them.
 *
 * To create test accounts, use the /scripts/create-test-accounts.mjs script.
 *
 * SECURITY: This route is intentionally permissive — it accepts any valid email + password
 * combo that matches a user in the database. It should NOT be used in production for real users.
 * In production, all real users authenticate via Google OAuth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database not configured', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email (case-insensitive)
    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        nurseProfile: { select: { id: true, currentFacilityId: true } },
        adminProfile: { select: { id: true, facilityId: true, accessLevel: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        error: `Account status is ${user.status}. Please contact your administrator.`,
        status: user.status,
      }, { status: 403 })
    }

    // Create session
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

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

    // Resolve facility
    const facilityId = user.nurseProfile?.currentFacilityId || user.adminProfile?.facilityId || user.facilityId || null
    let facilityName: string | null = null
    let facilityType: string | null = null
    if (facilityId) {
      const f = await db.facility.findUnique({ where: { id: facilityId }, select: { name: true, type: true } })
      facilityName = f?.name || null
      facilityType = f?.type || null
    }

    // Normalize role (recover SUPER_ADMIN from accessLevel)
    let role = user.role
    if (user.role === 'ADMIN' && user.adminProfile && user.adminProfile.accessLevel >= 10) {
      role = 'SUPER_ADMIN'
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DEV_LOGIN',
        resource: 'User',
        resourceId: user.id,
        details: 'User logged in via dev-login (password-based, bypassing Google OAuth)',
      },
    })

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
        academicRole: user.academicRole || null,
        studentLevel: user.studentLevel ?? null,
        avatarUrl: user.avatarUrl,
      },
      token,
      expiresAt,
      facilityId,
      facilityName,
      facilityType,
      nurseProfileId: user.nurseProfile?.id || null,
    })

    // Set HttpOnly cookie
    response.cookies.set('nurseos-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    })

    return response
  } catch (error: any) {
    console.error('Dev login error:', error)
    return NextResponse.json(
      { error: 'Failed to log in', details: error.message },
      { status: 500 }
    )
  }
}
