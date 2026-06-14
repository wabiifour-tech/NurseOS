import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { randomUUID, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getRateLimitIdentifier, AUTH_RATE_LIMIT } from '@/lib/rate-limit'
import { getAuthenticatedUser } from '@/lib/auth'

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { email, password, firstName, lastName, middleName, role, phone, countryCode, facilityId, newFacility } = body

    // Rate limiting
    const rateLimitResult = checkRateLimit(getRateLimitIdentifier(request), AUTH_RATE_LIMIT)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

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

    // Validate role - SUPER_ADMIN can only be created by existing SUPER_ADMIN users
    const validRoles = ['NURSE', 'ADMIN', 'PATIENT', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER']
    const normalizedRole = role.toUpperCase()
    
    // Check if trying to create a SUPER_ADMIN account
    if (normalizedRole === 'SUPER_ADMIN') {
      // Only existing SUPER_ADMIN users can create other SUPER_ADMIN accounts
      const authToken = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('nurseos-token')?.value
      if (!authToken) {
        return NextResponse.json(
          { error: 'Only authenticated Super Admins can create Super Admin accounts.' },
          { status: 403 }
        )
      }
      try {
        const authUser = await getAuthenticatedUser(request)
        if (!authUser || authUser.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { error: 'Only Super Admins can create Super Admin accounts.' },
            { status: 403 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Authentication required to create Super Admin accounts.' },
          { status: 403 }
        )
      }
    }
    
    if (!validRoles.includes(normalizedRole) && normalizedRole !== 'SUPER_ADMIN') {
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

      // Require registration number for new facilities (anti-fraud measure)
      if (!newFacility.registrationNumber || !String(newFacility.registrationNumber).trim()) {
        return NextResponse.json(
          { error: 'Facility registration/license number is required. This helps us verify legitimate healthcare facilities and prevent unauthorized access.' },
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

      // Check if registration number is already used
      const existingReg = await db.facility.findUnique({
        where: { registrationNumber: String(newFacility.registrationNumber).trim() },
      })
      if (existingReg) {
        return NextResponse.json(
          { error: 'This facility registration number is already registered. If you believe this is an error, please contact support.' },
          { status: 409 }
        )
      }

      // Create the new facility — starts as UNVERIFIED and PENDING accreditation
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
          registrationNumber: String(newFacility.registrationNumber).trim(),
          accreditingBody: newFacility.accreditingBody || null,
          isVerified: false,
          accreditationStatus: 'PENDING',
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

    // ── Determine user status ──
    // SECURITY: ALL new users start as PENDING (no auto-activation)
    // - Admins creating NEW facilities → PENDING (requires SUPER_ADMIN to verify facility + approve admin)
    // - Admins joining EXISTING facilities → PENDING (requires existing facility admin approval)
    // - Healthcare workers → PENDING (requires facility admin approval)
    // - SUPER_ADMIN → ACTIVE only if created by another SUPER_ADMIN
    const userStatus = normalizedRole === 'SUPER_ADMIN' ? 'ACTIVE' : 'PENDING'

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
        status: userStatus,
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
          // Store verification info if provided
          department: body.adminLicenseNumber ? `License: ${body.adminLicenseNumber}` : null,
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
    // Subscription starts as TRIALING (not ACTIVE) until SUPER_ADMIN verifies the facility
    if (normalizedRole === 'ADMIN' && newFacilityCreated && facilityIdToAssign) {
      await db.subscription.create({
        data: {
          userId: user.id,
          facilityId: facilityIdToAssign,
          plan: 'FREE',
          status: 'TRIALING', // Will be set to ACTIVE when facility is verified
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: normalizedRole === 'ADMIN' && newFacilityCreated ? 'FACILITY_APPLICATION_SUBMITTED' : 'USER_REGISTERED',
        resource: normalizedRole === 'ADMIN' && newFacilityCreated ? 'Facility' : 'User',
        resourceId: normalizedRole === 'ADMIN' && newFacilityCreated ? facilityIdToAssign! : user.id,
        details: normalizedRole === 'ADMIN' && newFacilityCreated
          ? `New facility application: ${newFacility.name} (Reg: ${newFacility.registrationNumber}) — admin ${firstName} ${lastName} (${email}). Requires SUPER_ADMIN verification.`
          : `New ${normalizedRole} registered${facilityIdToAssign ? ' at facility: ' + facilityIdToAssign : ''} — pending approval`,
      },
    })

    // ── Notify SUPER_ADMIN about new facility applications ──
    if (normalizedRole === 'ADMIN' && newFacilityCreated) {
      // Find all SUPER_ADMIN users to notify
      const superAdmins = await db.adminProfile.findMany({
        where: { accessLevel: { gte: 10 } },
        include: { user: { select: { id: true } } },
      })

      for (const sa of superAdmins) {
        if (sa.user?.id) {
          await db.notification.create({
            data: {
              userId: sa.user.id,
              type: 'FACILITY_VERIFICATION',
              title: 'New Facility Application Requires Verification',
              message: `${firstName} ${lastName} (${email}) has applied to register "${newFacility.name}" in ${newFacility.city || newFacility.state}. Registration #: ${newFacility.registrationNumber}. Please verify and approve or reject this facility.`,
              data: JSON.stringify({
                facilityId: facilityIdToAssign,
                facilityName: newFacility.name,
                adminUserId: user.id,
                adminEmail: email,
                registrationNumber: newFacility.registrationNumber,
              }),
            },
          })
        }
      }
    } else if (userStatus === 'PENDING' && facilityIdToAssign) {
      // Notify facility admin about new pending user
      const facilityAdmin = await db.adminProfile.findFirst({
        where: { facilityId: facilityIdToAssign, accessLevel: { lt: 10 } },
        include: { user: { select: { id: true } } },
      })

      if (facilityAdmin?.user?.id) {
        await db.notification.create({
          data: {
            userId: facilityAdmin.user.id,
            type: 'USER_APPROVAL',
            title: `New ${normalizedRole.toLowerCase()} requesting access`,
            message: `${firstName} ${lastName} (${email}) has signed up and is requesting access to your facility. Please review and approve or reject their account.`,
          },
        })
      }
    }

    // ── Return response based on status ──
    if (userStatus === 'ACTIVE') {
      // Only SUPER_ADMIN gets auto-login (created by another SUPER_ADMIN)
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

      // Fetch the user with relations
      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        include: {
          adminProfile: true,
          facility: !!facilityIdToAssign,
        },
      })

      const response = NextResponse.json(
        {
          message: 'Super Admin account created successfully',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: 'SUPER_ADMIN',
            facilityId: facilityIdToAssign,
            facilityName: fullUser?.facility?.name || null,
          },
          token,
          originalRole: normalizedRole,
          status: 'ACTIVE',
        },
        { status: 201 }
      )

      response.cookies.set('nurseos-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      })

      return response
    }

    // All other users: PENDING status — no auto-login
    const pendingMessage = normalizedRole === 'ADMIN' && newFacilityCreated
      ? 'Your facility application has been submitted! A NurseOS Super Admin will review and verify your facility. You will be notified once approved. This typically takes 1-2 business days.'
      : normalizedRole === 'ADMIN'
      ? 'Your account has been created. The existing facility admin needs to approve your access before you can sign in.'
      : 'Your account has been created and is pending approval from your facility admin. You will be notified once approved.'

    return NextResponse.json(
      {
        message: pendingMessage,
        status: 'PENDING',
        originalRole: normalizedRole,
        requiresApproval: true,
        ...(normalizedRole === 'ADMIN' && newFacilityCreated ? { facilityCreated: true, facilityName: newFacility.name } : {}),
      },
      { status: 201 }
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
