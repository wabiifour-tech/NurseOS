import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

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

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
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
      // User exists — check status
      if (existingUser.status === 'PENDING') {
        return NextResponse.json({
          status: 'PENDING',
          message: 'Your account is waiting for admin approval.',
        })
      }

      if (existingUser.status === 'ACTIVE') {
        // Create a session and return token
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

        // Normalize role
        let role = existingUser.role
        if (role === 'ADMIN' && existingUser.adminProfile && existingUser.adminProfile.accessLevel >= 10) {
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

      // User is DELETED or SUSPENDED
      return NextResponse.json({
        status: existingUser.status,
        error: `Account status: ${existingUser.status}. Please contact support.`,
      }, { status: 403 })
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
