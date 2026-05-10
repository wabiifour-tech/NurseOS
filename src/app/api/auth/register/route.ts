import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash, randomUUID } from 'crypto'

function generateLicenseSuffix(): string {
  // Use crypto-safe randomUUID instead of Math.random() to avoid collisions
  // Take first 8 hex chars of a UUID and convert to a 5-digit number
  const hex = randomUUID().replace(/-/g, '').slice(0, 8)
  const num = parseInt(hex, 16) % 100000
  return String(num).padStart(5, '0')
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'nurseos-salt-2024').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, middleName, role, phone, countryCode } = body

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

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate role - expanded to include all form roles
    const validRoles = ['NURSE', 'ADMIN', 'PATIENT', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER']
    const normalizedRole = role.toUpperCase()
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
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

    // Hash the password
    const passwordHash = hashPassword(password)

    // Create user - map STUDENT and OTHER to NURSE role for DB enum compatibility
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole) ? 'NURSE' :
                   normalizedRole === 'DOCTOR' ? 'DOCTOR' :
                   normalizedRole === 'ADMIN' ? 'ADMIN' : 'PATIENT'

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
      },
    })

    // If role is nursing-related, create NurseProfile
    if (['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole)) {
      await db.nurseProfile.create({
        data: {
          userId: user.id,
          licenseNumber: normalizedRole === 'STUDENT' ? `STU/${new Date().getFullYear()}/${generateLicenseSuffix()}` : `NMCN/${new Date().getFullYear()}/${generateLicenseSuffix()}`,
          licenseIssuingBody: 'NMCN',
          licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
          nursingCouncil: 'Nigeria',
          skills: '[]',
          languages: '["English"]',
        },
      })
    }

    // If role is ADMIN, create AdminProfile
    if (normalizedRole === 'ADMIN') {
      await db.adminProfile.create({
        data: {
          userId: user.id,
          accessLevel: 1,
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
        details: `New ${normalizedRole} registered: ${email}`,
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
        adminProfile: normalizedRole === 'ADMIN',
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
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}
