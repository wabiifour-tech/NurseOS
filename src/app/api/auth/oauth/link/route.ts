import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { shouldAttemptBootstrap, bootstrapSuperAdmin } from '@/lib/super-admin-bootstrap'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { email, name, image, provider, providerAccountId } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // ─── Super Admin Bootstrap Check (before DB query for early exit) ───
    const isFounderEmail = shouldAttemptBootstrap(normalizedEmail)

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        academicRole: true,
        studentLevel: true,
        avatarUrl: true,
        nurseProfile: { select: { id: true, currentFacilityId: true } },
        adminProfile: { select: { id: true, facilityId: true, accessLevel: true } },
      },
    })

    if (existingUser) {
      // NON-ACTIVE statuses (PENDING, REJECTED, DELETED, SUSPENDED):
      // Return a unified response to prevent account enumeration.
      // Attackers should not be able to distinguish between 'email not registered',
      // 'email registered but pending', or 'email registered but deleted'.
      if (existingUser.status !== 'ACTIVE') {
        return NextResponse.json({
          status: 'PENDING',
          message: 'Please complete your registration to continue.',
        })
      }

      // ─── Super Admin Bootstrap (existing ACTIVE user) ───
      // If no Super Admin exists and this email matches FOUNDER_EMAIL,
      // upgrade the user to SUPER_ADMIN (accessLevel = 10).
      // This runs on every login but is a no-op once an SA already exists.
      let accessLevel = existingUser.adminProfile?.accessLevel ?? null
      if (isFounderEmail && (!accessLevel || accessLevel < 10)) {
        const result = await bootstrapSuperAdmin(existingUser.id)
        if (result.bootstrapped) {
          accessLevel = 10
          console.log('[oauth/link] Super Admin bootstrapped on login')
        }
      }

      // User is ACTIVE — create a session and return token
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await db.session.create({
        data: {
          userId: existingUser.id,
          token,
          expiresAt,
        },
      })

      // Update last login
      await db.user.update({
        where: { id: existingUser.id },
        data: { lastLoginAt: new Date() },
      })

      // Resolve facility
      const facilityId = existingUser.nurseProfile?.currentFacilityId || existingUser.adminProfile?.facilityId || null
      let facilityName: string | null = null
      let facilityType: string | null = null
      if (facilityId) {
        const facility = await db.facility.findUnique({ where: { id: facilityId }, select: { name: true, type: true } })
        facilityName = facility?.name || null
        facilityType = facility?.type || null
      }

      // Normalize role (use the potentially-updated accessLevel)
      let role = existingUser.role
      if (role === 'ADMIN' && accessLevel !== null && accessLevel >= 10) {
        role = 'SUPER_ADMIN'
      }

      const response = NextResponse.json({
        status: 'ACTIVE',
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role,
          academicRole: existingUser.academicRole || null,
          studentLevel: existingUser.studentLevel ?? null,
          matricNumber: (existingUser as any).matricNumber || null,
          facilityId,
          facilityName,
          facilityType,
          nurseProfileId: existingUser.nurseProfile?.id || null,
          avatarUrl: existingUser.avatarUrl,
        },
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
    }

    // New user — signal to redirect to onboarding
    return NextResponse.json({
      status: 'NEW',
      message: 'New user — please complete onboarding.',
    })
  } catch (error: unknown) {
    console.error('OAuth link error:', error)
    const errMsg = (error as Error)?.message || ''
    // Check if it's a database connection/table error
    if (errMsg.includes('connect') || errMsg.includes('ECONNREFUSED') || errMsg.includes('P1001') || errMsg.includes('server is not reachable') || errMsg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables are not set up yet. Please visit /api/setup to create the database schema, then try again.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to process authentication' }, { status: 500 })
  }
}
