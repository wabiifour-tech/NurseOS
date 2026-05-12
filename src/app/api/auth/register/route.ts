import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

function generateLicenseSuffix(): string {
  const hex = randomUUID().replace(/-/g, '').slice(0, 8)
  const num = parseInt(hex, 16) % 100000
  return String(num).padStart(5, '0')
}

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database is not configured yet. Please set up a PostgreSQL database in your Vercel project (Dashboard → Storage → Create Postgres), then visit /api/setup to create tables, then redeploy.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, middleName, role, phone, countryCode, facilityId, newFacility } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName, role' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (matching client-side Zod schema)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Validate role - expanded to include SUPER_ADMIN for internal admin dashboard
    const validRoles = ['NURSE', 'ADMIN', 'PATIENT', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER', 'SUPER_ADMIN']
    const normalizedRole = role.toUpperCase()
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate facilityId if provided
    let verifiedFacilityId: string | null = null
    if (facilityId) {
      const facility = await db.facility.findUnique({
        where: { id: facilityId },
        select: { id: true, name: true },
      })
      if (!facility) {
        return NextResponse.json(
          { error: 'Selected facility not found. Please choose a valid facility.' },
          { status: 400 }
        )
      }
      verifiedFacilityId = facility.id
    }

    // For non-admin healthcare workers, facility is required
    if (['NURSE', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole) && !verifiedFacilityId) {
      return NextResponse.json(
        { error: 'Healthcare workers must be assigned to a facility. Please select a facility.' },
        { status: 400 }
      )
    }

    // Handle new facility creation for ADMIN role
    let facilityIdToAssign = verifiedFacilityId
    let newFacilityCreated = false

    if (normalizedRole === 'ADMIN' && newFacility) {
      // Validate new facility required fields
      if (!newFacility.name || !newFacility.type || !newFacility.state) {
        return NextResponse.json(
          { error: 'New facility requires: name, type, and state' },
          { status: 400 }
        )
      }

      // Validate facility type
      const validTypes = ['HOSPITAL', 'CLINIC', 'PRIMARY_HEALTH_CENTER', 'SPECIALIST_CENTER', 'MATERNITY_HOME', 'REHABILITATION_CENTER', 'DIAGNOSTIC_CENTER', 'PHARMACY', 'COMMUNITY_HEALTH_CENTER', 'GENERAL']
      if (newFacility.type && !validTypes.includes(newFacility.type)) {
        return NextResponse.json(
          { error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Create the new facility
      const newFac = await db.facility.create({
        data: {
          name: newFacility.name,
          type: newFacility.type || 'GENERAL',
          address: newFacility.address || '',
          city: newFacility.city || '',
          state: newFacility.state,
          country: 'Nigeria',
          phone: newFacility.phone || null,
          email: newFacility.email || null,
        },
      })
      facilityIdToAssign = newFac.id
      newFacilityCreated = true
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Hash the password using bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user - map STUDENT and OTHER to NURSE role for DB enum compatibility
    // SUPER_ADMIN maps to ADMIN in DB
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole) ? 'NURSE' :
                   normalizedRole === 'DOCTOR' ? 'DOCTOR' :
                   ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole) ? 'ADMIN' : 'PATIENT'

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        middleName: middleName || null,
        displayName: `${firstName} ${lastName}`,
        phone: phone || null,
        countryCode: countryCode || 'NG',
        role: dbRole,
        status: 'ACTIVE',
        facilityId: facilityIdToAssign,
      },
    })

    // If role is nursing-related, create NurseProfile with facility assignment
    if (['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole)) {
      await db.nurseProfile.create({
        data: {
          userId: user.id,
          licenseNumber: normalizedRole === 'STUDENT' ? `STU/${new Date().getFullYear()}/${generateLicenseSuffix()}` : `NR/${new Date().getFullYear()}/${generateLicenseSuffix()}`,
          licenseIssuingBody: 'Nursing Registration Board',
          licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          nursingCouncil: 'Nigeria',
          skills: '[]',
          languages: '["English"]',
          currentFacilityId: facilityIdToAssign,
        },
      })
    }

    // If role is ADMIN or SUPER_ADMIN, create AdminProfile with facility assignment
    if (['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole)) {
      await db.adminProfile.create({
        data: {
          userId: user.id,
          accessLevel: normalizedRole === 'SUPER_ADMIN' ? 10 : 1,
          facilityId: facilityIdToAssign,
        },
      })
    }

    // If role is PATIENT, create PatientProfile with auto-generated patient ID
    if (normalizedRole === 'PATIENT') {
      await db.patientProfile.create({
        data: {
          userId: user.id,
          patientId: `PT/${new Date().getFullYear()}/${generateLicenseSuffix()}`,
          facilityId: facilityIdToAssign,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender || null,
          allergies: '[]',
        },
      })
    }

    // If a new facility was created for admin, create FREE subscription for it
    if (normalizedRole === 'ADMIN' && newFacilityCreated && facilityIdToAssign) {
      await db.subscription.create({
        data: {
          userId: user.id,
          facilityId: facilityIdToAssign,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        details: `New ${normalizedRole} registered: ${email}${facilityIdToAssign ? ` at facility: ${facilityIdToAssign}` : ''}${newFacilityCreated ? ' (new facility created)' : ''}`,
      },
    })

    // Create session for auto-login
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Fetch the user with relations
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        nurseProfile: ['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole),
        adminProfile: ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole),
        patientProfile: normalizedRole === 'PATIENT',
        facility: !!facilityIdToAssign,
      },
    })

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = fullUser!

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: userWithoutPassword,
        token,
        originalRole: normalizedRole, // Return original role so frontend knows
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `nurseos-token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
        },
      }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    // Check if it's a database connection error
    const errorMsg = error?.message || ''
    if (errorMsg.includes('connect') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('P1001') || errorMsg.includes('server is not reachable') || errorMsg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables are not set up yet. Please visit /api/setup to create the database schema, then try again.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}
