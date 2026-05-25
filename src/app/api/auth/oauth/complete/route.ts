import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, randomUUID } from 'crypto'

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

    const { email, firstName, lastName, role, facilityId, avatarUrl, provider } = body

    if (!email || !firstName || !lastName || !role || !facilityId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['NURSE', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER']
    const normalizedRole = role.toUpperCase()
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate facility exists
    const facility = await db.facility.findUnique({ where: { id: facilityId } })
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Create user with PENDING status — requires admin approval
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole) ? 'NURSE' :
                   normalizedRole === 'DOCTOR' ? 'DOCTOR' : 'PATIENT'

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        // Generate a random password hash for OAuth users (they won't use it)
        passwordHash: '$2a$10$' + randomBytes(30).toString('base64url') + '.OAuthOnly',
        firstName: String(firstName).trim().slice(0, 100),
        lastName: String(lastName).trim().slice(0, 100),
        displayName: `${String(firstName).trim()} ${String(lastName).trim()}`,
        role: dbRole,
        status: 'PENDING', // KEY: User must be approved by facility admin
        facilityId,
        avatarUrl: avatarUrl || null,
      },
    })

    // Create NurseProfile for nursing roles
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
          currentFacilityId: facilityId,
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED_OAUTH',
        resource: 'User',
        resourceId: user.id,
        details: `New ${normalizedRole} registered via ${provider || 'social'} — pending approval`,
      },
    })

    // Notify the facility admin about the pending user
    const facilityAdmin = await db.adminProfile.findFirst({
      where: { facilityId },
      include: { user: { select: { id: true } } },
    })

    if (facilityAdmin?.user?.id) {
      await db.notification.create({
        data: {
          userId: facilityAdmin.user.id,
          type: 'USER_APPROVAL',
          title: `New ${normalizedRole.toLowerCase()} requesting access`,
          message: `${firstName} ${lastName} (${email}) has signed up and is requesting access to your facility. Please review and approve or reject their account.`,
          data: JSON.stringify({
            pendingUserId: user.id,
            pendingUserName: `${firstName} ${lastName}`,
            pendingUserEmail: email,
            pendingUserRole: normalizedRole,
            facilityId,
          }),
        },
      })
    }

    return NextResponse.json({
      status: 'PENDING',
      message: 'Your account has been created. Please wait for the facility admin to approve your access.',
    })
  } catch (error) {
    console.error('OAuth complete error:', error)
    return NextResponse.json({ error: 'Failed to complete registration' }, { status: 500 })
  }
}
