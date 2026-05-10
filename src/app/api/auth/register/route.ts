import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash, randomUUID } from 'crypto'

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

    // Validate role
    const validRoles = ['NURSE', 'ADMIN', 'PATIENT', 'DOCTOR']
    if (!validRoles.includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const normalizedRole = role.toUpperCase()

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

    // Create user
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
        role: normalizedRole,
        status: 'ACTIVE',
      },
    })

    // If role is NURSE, create NurseProfile
    if (normalizedRole === 'NURSE') {
      const licenseNumber = `NMCN/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`

      await db.nurseProfile.create({
        data: {
          userId: user.id,
          licenseNumber,
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

    // Fetch the user with relations
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        nurseProfile: normalizedRole === 'NURSE',
        adminProfile: normalizedRole === 'ADMIN',
      },
    })

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = fullUser!

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: userWithoutPassword,
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
