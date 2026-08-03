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
    const { email, password, firstName, lastName, middleName, role, phone, countryCode, facilityId, newFacility, studentLevel, adminType } = body

    // Rate limiting
    const rateLimitResult = await checkRateLimit(getRateLimitIdentifier(request), AUTH_RATE_LIMIT)
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

    // ─── Academic role handling (LECTURER + STUDENT) ───
    // Both LECTURER and STUDENT map to NURSE in DB enum, but academicRole stores the original.
    // LECTURER requires institution selection → status PENDING (institution admin approves)
    // STUDENT requires level (100-500) + institution selection → status ACTIVE (auto-enrolled)
    const validAcademicRoles = ['LECTURER', 'STUDENT']
    const isAcademicRole = validAcademicRoles.includes(role.toUpperCase())

    // Validate student level if STUDENT role
    if (role.toUpperCase() === 'STUDENT') {
      const validLevels = [100, 200, 300, 400, 500]
      if (!studentLevel || !validLevels.includes(Number(studentLevel))) {
        return NextResponse.json(
          { error: 'Student level is required and must be one of: 100, 200, 300, 400, 500' },
          { status: 400 }
        )
      }
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
    const validRoles = ['NURSE', 'ADMIN', 'PATIENT', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER']
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
        select: { id: true, name: true, type: true },
      })
      if (!facility) {
        return NextResponse.json(
          { error: 'Selected facility not found. Please choose a valid facility.' },
          { status: 400 }
        )
      }
      // Institution admins can only join UNIVERSITY / SCHOOL_OF_NURSING facilities
      if (adminType === 'INSTITUTION' && !['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
        return NextResponse.json(
          { error: 'Institution admins can only join universities or schools of nursing. Please select an academic institution.' },
          { status: 400 }
        )
      }
      verifiedFacilityId = facility.id
    }

    // For non-admin healthcare workers, facility is required
    if (['NURSE', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER'].includes(normalizedRole) && !verifiedFacilityId) {
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

      // Registration number is now OPTIONAL — no verification gate.
      // If provided, we'll store it; otherwise we leave it null.

      // Validate facility type
      const validTypes = ['HOSPITAL', 'CLINIC', 'PRIMARY_HEALTH_CENTER', 'SPECIALIST_CENTER', 'MATERNITY_HOME', 'REHABILITATION_CENTER', 'DIAGNOSTIC_CENTER', 'PHARMACY', 'COMMUNITY_HEALTH_CENTER', 'GENERAL', 'UNIVERSITY', 'SCHOOL_OF_NURSING']
      if (newFacility.type && !validTypes.includes(newFacility.type)) {
        return NextResponse.json(
          { error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // If adminType is INSTITUTION, the facility type MUST be UNIVERSITY or SCHOOL_OF_NURSING
      // (this is a safety check — the client UI already restricts this, but we enforce server-side too)
      if (adminType === 'INSTITUTION' && !['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(newFacility.type || '')) {
        return NextResponse.json(
          { error: 'Institution admins can only register universities or schools of nursing.' },
          { status: 400 }
        )
      }

      // ─── Verification rules ───
      //   - Regular Facility Admin (adminType !== 'INSTITUTION') → registrationNumber IS REQUIRED
      //     (verified by Super Admin before facility goes live)
      //   - Institution Admin (adminType === 'INSTITUTION') → registrationNumber NOT required
      //     (1-week free trial starts immediately; Super Admin can still verify later)
      const providedRegNumber = newFacility.registrationNumber && String(newFacility.registrationNumber).trim()
        ? String(newFacility.registrationNumber).trim()
        : null

      if (adminType !== 'INSTITUTION' && !providedRegNumber) {
        return NextResponse.json(
          { error: 'Facility registration/license number is required. This helps us verify legitimate healthcare facilities and prevent unauthorized access.' },
          { status: 400 }
        )
      }

      if (providedRegNumber) {
        const existingReg = await db.facility.findUnique({
          where: { registrationNumber: providedRegNumber },
        })
        if (existingReg) {
          return NextResponse.json(
            { error: 'This facility registration number is already registered. If you believe this is an error, please contact support.' },
            { status: 409 }
          )
        }
      }

      // Create the new facility — starts as UNVERIFIED and PENDING accreditation
      // For UNIVERSITY / SCHOOL_OF_NURSING: auto-grant 1-week free trial starting now
      const isAcademicInstitution = ['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(newFacility.type || '')
      const trialEndsAt = isAcademicInstitution
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        : null

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
          // Store registration number if provided (required for regular Facility Admin, optional for Institution Admin)
          registrationNumber: providedRegNumber,
          accreditingBody: newFacility.accreditingBody || null,
          isVerified: false,
          accreditationStatus: 'PENDING',
          freeTrialEndsAt: trialEndsAt,
        },
      })
      facilityIdToAssign = newFac.id
      newFacilityCreated = true
    }

    // ─── FACILITY ASSIGNMENT IS MANDATORY ───
    // Every user (except SUPER_ADMIN) MUST be assigned to a facility. No exceptions.
    // This is a hard requirement — users without a facility have no scope for their data.
    if (normalizedRole !== 'SUPER_ADMIN' && !facilityIdToAssign) {
      return NextResponse.json(
        { error: 'Facility assignment is required. Please select an existing facility or create a new one.' },
        { status: 400 }
      )
    }

    // Check if user already exists — STRONG duplicate check (case-insensitive)
    // The DB unique constraint is case-sensitive on PostgreSQL by default, so we normalize
    // to lowercase both at storage and lookup time. This prevents duplicates that would
    // otherwise slip through due to case differences (e.g., John@Example.com vs john@example.com).
    const normalizedEmail = String(email).toLowerCase().trim()
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Please sign in instead.',
          errorType: 'EMAIL_ALREADY_EXISTS',
        },
        { status: 409 }
      )
    }

    // Hash the password using bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user - map STUDENT, LECTURER and OTHER to NURSE role for DB enum compatibility
    // SUPER_ADMIN maps to ADMIN in DB
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER'].includes(normalizedRole) ? 'NURSE' :
                   normalizedRole === 'DOCTOR' ? 'DOCTOR' :
                   ['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole) ? 'ADMIN' : 'PATIENT'

    // ── Determine user status ──
    // The admin who CREATES a new facility/institution IS the admin — they should be ACTIVE immediately.
    // No one is "above" them to approve their access. (Super Admin may still verify the facility separately,
    // but that's a facility-level concern, not a user-account lock.)
    //
    //   - SUPER_ADMIN (created by another SUPER_ADMIN) → ACTIVE
    //   - ADMIN creating a NEW facility → ACTIVE (they are the admin of the new facility)
    //   - ADMIN joining an EXISTING facility → PENDING (existing admin must approve)
    //   - STUDENT → ACTIVE (auto-enrolled — picks level + institution, no approval needed)
    //   - LECTURER → PENDING (institution admin must approve)
    //   - NURSE / DOCTOR / MATRON / OTHER → PENDING (facility admin must approve)
    const createdNewFacility = !!newFacilityCreated && !!facilityIdToAssign
    const userStatus =
      normalizedRole === 'SUPER_ADMIN' ? 'ACTIVE' :
      (normalizedRole === 'ADMIN' && createdNewFacility) ? 'ACTIVE' :
      normalizedRole === 'STUDENT' ? 'ACTIVE' :
      'PENDING'

    // ── Academic role storage ──
    // LECTURER and STUDENT both map to NURSE in DB role enum, so we preserve the original
    // role in `academicRole` for downstream UI/logic differentiation.
    const academicRoleToStore = ['LECTURER', 'STUDENT'].includes(normalizedRole) ? normalizedRole : null
    const studentLevelToStore = normalizedRole === 'STUDENT' ? Number(studentLevel) : null

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
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
        academicRole: academicRoleToStore,
        studentLevel: studentLevelToStore,
      },
    })

    // If role is nursing-related, create NurseProfile with facility assignment
    if (['NURSE', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER'].includes(normalizedRole)) {
      await db.nurseProfile.create({
        data: {
          userId: user.id,
          licenseNumber: normalizedRole === 'STUDENT' ? `STU/${new Date().getFullYear()}/${generateLicenseSuffix()}` :
                         normalizedRole === 'LECTURER' ? `LEC/${new Date().getFullYear()}/${generateLicenseSuffix()}` :
                         `NR/${new Date().getFullYear()}/${generateLicenseSuffix()}`,
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
          ? `New ${adminType === 'INSTITUTION' ? 'institution' : 'facility'}: ${newFacility.name}${newFacility.registrationNumber ? ` (Reg: ${newFacility.registrationNumber})` : ''} — admin ${firstName} ${lastName} (${email}). Admin is ACTIVE.${adminType === 'INSTITUTION' ? ' 1-week free trial started.' : ' Super Admin may verify facility.'}`
          : `New ${normalizedRole} registered${facilityIdToAssign ? ' at facility: ' + facilityIdToAssign : ''} — pending approval`,
      },
    })

    // ── Notify SUPER_ADMIN about new facility creation (FYI — admin is already ACTIVE) ──
    if (normalizedRole === 'ADMIN' && newFacilityCreated) {
      // Find all SUPER_ADMIN users to notify
      const superAdmins = await db.adminProfile.findMany({
        where: { accessLevel: { gte: 10 } },
        include: { user: { select: { id: true } } },
      })

      const isInstAdmin = adminType === 'INSTITUTION'
      const regNumInfo = newFacility.registrationNumber
        ? ` Registration #: ${newFacility.registrationNumber}.`
        : ''

      for (const sa of superAdmins) {
        if (sa.user?.id) {
          await db.notification.create({
            data: {
              userId: sa.user.id,
              type: 'FACILITY_VERIFICATION',
              title: isInstAdmin
                ? 'New Institution Registered'
                : 'New Facility Application Requires Verification',
              message: `${firstName} ${lastName} (${email}) has registered "${newFacility.name}" in ${newFacility.city || newFacility.state}.${regNumInfo} ${isInstAdmin ? 'Institution admin is already active — 1-week free trial started.' : 'Please verify the facility when convenient.'}`,
              data: JSON.stringify({
                facilityId: facilityIdToAssign,
                facilityName: newFacility.name,
                adminUserId: user.id,
                adminEmail: email,
                registrationNumber: newFacility.registrationNumber || null,
                adminType: adminType || 'FACILITY',
              }),
            },
          })
        }
      }
    } else if (userStatus === 'PENDING' && facilityIdToAssign) {
      // Notify facility admin about new pending user (includes LECTURER signups)
      const facilityAdmin = await db.adminProfile.findFirst({
        where: { facilityId: facilityIdToAssign, accessLevel: { lt: 10 } },
        include: { user: { select: { id: true } } },
      })

      if (facilityAdmin?.user?.id) {
        const roleLabel = normalizedRole === 'LECTURER' ? 'lecturer' : normalizedRole.toLowerCase()
        await db.notification.create({
          data: {
            userId: facilityAdmin.user.id,
            type: 'USER_APPROVAL',
            title: `New ${roleLabel} requesting access`,
            message: `${firstName} ${lastName} (${email}) has signed up and is requesting access to your facility. Please review and approve or reject their account.`,
            data: JSON.stringify({
              pendingUserId: user.id,
              pendingUserName: `${firstName} ${lastName}`,
              pendingUserEmail: email,
              pendingUserRole: normalizedRole,
              facilityId: facilityIdToAssign,
            }),
          },
        })
      }
    } else if (normalizedRole === 'STUDENT' && facilityIdToAssign) {
      // Notify institution admin about new student enrollment (auto-approved, FYI only)
      const institutionAdmin = await db.adminProfile.findFirst({
        where: { facilityId: facilityIdToAssign, accessLevel: { lt: 10 } },
        include: { user: { select: { id: true } } },
      })

      if (institutionAdmin?.user?.id) {
        await db.notification.create({
          data: {
            userId: institutionAdmin.user.id,
            type: 'USER_APPROVAL',
            title: 'New student enrolled',
            message: `${firstName} ${lastName} (${email}) has enrolled as a ${studentLevel}-level student at your institution. No action required — students are auto-approved.`,
            data: JSON.stringify({
              newStudentUserId: user.id,
              newStudentName: `${firstName} ${lastName}`,
              newStudentEmail: email,
              studentLevel: Number(studentLevel),
              facilityId: facilityIdToAssign,
            }),
          },
        })
      }
    }

    // ── Return response based on status ──
    if (userStatus === 'ACTIVE') {
      // Auto-login for:
      //   - SUPER_ADMIN (created by another SUPER_ADMIN)
      //   - STUDENT (auto-enrolled)
      //   - ADMIN who just CREATED a new facility/institution (they ARE the admin — no one above them to approve)
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

      const responseMessage = normalizedRole === 'SUPER_ADMIN'
        ? 'Super Admin account created successfully'
        : normalizedRole === 'STUDENT'
        ? 'Student account created! Welcome to NurseOS.'
        : (normalizedRole === 'ADMIN' && createdNewFacility)
        ? 'Your facility has been created! Welcome to NurseOS.'
        : 'Account created successfully'

      const response = NextResponse.json(
        {
          message: responseMessage,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: normalizedRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (academicRoleToStore || dbRole),
            academicRole: academicRoleToStore,
            studentLevel: studentLevelToStore,
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
    // (Lecturer waiting for institution admin approval, or nurse/doctor/matron/other/admin-joining-existing waiting for facility admin approval)
    const pendingMessage = normalizedRole === 'LECTURER'
      ? 'Your lecturer account has been created and is pending approval from your institution admin. You will be notified once approved and can then sign in.'
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
    const errorMsg = error?.message || ''
    // Prisma unique constraint violation (P2002) — typically email collision from a race condition
    if (errorMsg.includes('P2002') || errorMsg.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.', errorType: 'EMAIL_ALREADY_EXISTS' },
        { status: 409 }
      )
    }
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
