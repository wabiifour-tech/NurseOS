import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

function generateLicenseSuffix(): string {
  const hex = randomUUID().replace(/-/g, '').slice(0, 8)
  const num = parseInt(hex, 16) % 100000
  return String(num).padStart(5, '0')
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      email, firstName, lastName, role, facilityId,
      avatarUrl, provider,
      // New facility fields
      facilityMode, newFacilityName, newFacilityType,
      newFacilityAddress, newFacilityCity, newFacilityState,
    } = body

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate role — now includes ADMIN
    const validRoles = ['NURSE', 'ADMIN', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER']
    const normalizedRole = role.toUpperCase()
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const isAdmin = normalizedRole === 'ADMIN'

    // ── Facility resolution ──
    let resolvedFacilityId = facilityId

    if (isAdmin && facilityMode === 'new') {
      // Admin creating a new facility
      if (!newFacilityName || !newFacilityCity || !newFacilityState) {
        return NextResponse.json({ error: 'Facility name, city, and state are required' }, { status: 400 })
      }

      const newFacility = await db.facility.create({
        data: {
          id: randomUUID(),
          name: String(newFacilityName).trim(),
          type: String(newFacilityType || 'HOSPITAL').trim(),
          address: String(newFacilityAddress || 'To be confirmed').trim(),
          city: String(newFacilityCity).trim(),
          state: String(newFacilityState).trim(),
          country: 'Nigeria',
        },
      })
      resolvedFacilityId = newFacility.id

      // Create a FREE subscription for the new facility
      await db.subscription.create({
        data: {
          id: randomUUID(),
          userId: '', // Will be updated after user creation
          facilityId: newFacility.id,
          plan: 'FREE',
          status: 'ACTIVE',
          isActive: true,
        },
      })
    } else {
      // Joining existing facility
      if (!resolvedFacilityId) {
        return NextResponse.json({ error: 'Please select a facility' }, { status: 400 })
      }
      const facility = await db.facility.findUnique({ where: { id: resolvedFacilityId } })
      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 400 })
      }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // ── Map role to DB role ──
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole) ? 'NURSE' :
                   normalizedRole === 'DOCTOR' ? 'DOCTOR' :
                   normalizedRole === 'ADMIN' ? 'ADMIN' : 'PATIENT'

    // ── Determine status ──
    // Admins creating their own facility are auto-approved (ACTIVE)
    // Admins joining existing facility need existing admin approval (PENDING)
    // All other roles need admin approval (PENDING)
    let userStatus = 'PENDING'
    if (isAdmin && facilityMode === 'new') {
      userStatus = 'ACTIVE'
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        // Generate a random password hash for OAuth users (they won't use it)
        passwordHash: await bcrypt.hash(randomBytes(32).toString('base64'), 10),
        firstName: String(firstName).trim().slice(0, 100),
        lastName: String(lastName).trim().slice(0, 100),
        displayName: `${String(firstName).trim()} ${String(lastName).trim()}`,
        role: dbRole,
        status: userStatus,
        facilityId: resolvedFacilityId,
        avatarUrl: avatarUrl || null,
      },
    })

    // ── Create role-specific profiles ──

    // NurseProfile for nursing roles
    if (['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole)) {
      await db.nurseProfile.create({
        data: {
          userId: user.id,
          licenseNumber: normalizedRole === 'STUDENT'
            ? `STU/${new Date().getFullYear()}/${generateLicenseSuffix()}`
            : `NR/${new Date().getFullYear()}/${generateLicenseSuffix()}`,
          licenseIssuingBody: 'Nursing Registration Board',
          licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          nursingCouncil: 'Nigeria',
          skills: '[]',
          languages: '["English"]',
          currentFacilityId: resolvedFacilityId,
        },
      })
    }

    // AdminProfile for admin role
    if (isAdmin) {
      await db.adminProfile.create({
        data: {
          userId: user.id,
          facilityId: resolvedFacilityId,
          accessLevel: 5, // Standard facility admin (not super admin which is 10)
        },
      })
    }

    // Update subscription userId if admin created a new facility
    if (isAdmin && facilityMode === 'new') {
      await db.subscription.updateMany({
        where: { facilityId: resolvedFacilityId, userId: '' },
        data: { userId: user.id },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: isAdmin ? 'ADMIN_REGISTERED_OAUTH' : 'USER_REGISTERED_OAUTH',
        resource: 'User',
        resourceId: user.id,
        details: isAdmin
          ? `New facility admin registered via ${provider || 'social'} — auto-approved (created facility: ${newFacilityName})`
          : `New ${normalizedRole.toLowerCase()} registered via ${provider || 'social'} — pending approval`,
      },
    })

    // ── Notifications ──
    if (userStatus === 'PENDING') {
      // Notify the facility admin about the pending user
      const facilityAdmin = await db.adminProfile.findFirst({
        where: { facilityId: resolvedFacilityId },
        include: { user: { select: { id: true } } },
      })

      if (facilityAdmin?.user?.id) {
        await db.notification.create({
          data: {
            userId: facilityAdmin.user.id,
            type: 'USER_APPROVAL',
            title: isAdmin
              ? `New admin requesting access to your facility`
              : `New ${normalizedRole.toLowerCase()} requesting access`,
            message: isAdmin
              ? `${firstName} ${lastName} (${email}) has signed up as a Facility Admin and is requesting access. Please review and approve.`
              : `${firstName} ${lastName} (${email}) has signed up and is requesting access to your facility. Please review and approve or reject their account.`,
            data: JSON.stringify({
              pendingUserId: user.id,
              pendingUserName: `${firstName} ${lastName}`,
              pendingUserEmail: email,
              pendingUserRole: normalizedRole,
              facilityId: resolvedFacilityId,
            }),
          },
        })
      }
    }

    // ── Return response ──
    if (userStatus === 'ACTIVE') {
      // Auto-login for admins who created their own facility
      const { sign } = await import('jsonwebtoken')
      const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-change-me'
      const token = sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Create session record
      await db.session.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      // Get facility name
      const facility = await db.facility.findUnique({
        where: { id: resolvedFacilityId },
        select: { name: true },
      })

      return NextResponse.json({
        status: 'ACTIVE',
        message: 'Welcome! Your facility admin account is ready.',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          facilityId: resolvedFacilityId,
          facilityName: facility?.name || '',
          nurseProfileId: null,
          avatarUrl: user.avatarUrl,
        },
      })
    }

    return NextResponse.json({
      status: 'PENDING',
      message: isAdmin
        ? 'Your account has been created. The existing facility admin needs to approve your access before you can sign in.'
        : 'Your account has been created. Please wait for the facility admin to approve your access.',
    })
  } catch (error: unknown) {
    console.error('OAuth complete error:', error)
    const errMsg = (error as Error)?.message || ''
    // Check if it's a database connection/table error
    if (errMsg.includes('connect') || errMsg.includes('ECONNREFUSED') || errMsg.includes('P1001') || errMsg.includes('server is not reachable') || errMsg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables are not set up yet. Please visit /api/setup to create the database schema, then try again.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to complete registration', details: errMsg.substring(0, 200) }, { status: 500 })
  }
}
