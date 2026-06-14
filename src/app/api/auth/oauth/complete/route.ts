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
      // Facility verification fields
      newFacilityRegistrationNumber, newFacilityPhone, newFacilityEmail,
      adminLicenseNumber, adminPhone,
    } = body

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['NURSE', 'ADMIN', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER']
    const normalizedRole = role.toUpperCase()
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const isAdmin = normalizedRole === 'ADMIN'

    // ── Facility resolution ──
    let resolvedFacilityId = facilityId || null
    let createdFacilityId: string | null = null

    if (isAdmin && facilityMode === 'new') {
      // Admin creating a new facility
      if (!newFacilityName || !newFacilityCity || !newFacilityState) {
        return NextResponse.json({ error: 'Facility name, city, and state are required' }, { status: 400 })
      }

      // SECURITY: Require registration number to prevent fraudulent facility creation
      if (!newFacilityRegistrationNumber || !String(newFacilityRegistrationNumber).trim()) {
        return NextResponse.json({
          error: 'Facility registration/license number is required. This helps us verify legitimate healthcare facilities and prevent unauthorized access.'
        }, { status: 400 })
      }

      // Check if registration number is already used
      const existingReg = await db.facility.findUnique({
        where: { registrationNumber: String(newFacilityRegistrationNumber).trim() },
      })
      if (existingReg) {
        return NextResponse.json({
          error: 'This facility registration number is already registered. If you believe this is an error, please contact support.'
        }, { status: 409 })
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
          phone: newFacilityPhone ? String(newFacilityPhone).trim() : null,
          email: newFacilityEmail ? String(newFacilityEmail).trim() : null,
          registrationNumber: String(newFacilityRegistrationNumber).trim(),
          isVerified: false,
          accreditationStatus: 'PENDING',
        },
      })
      resolvedFacilityId = newFacility.id
      createdFacilityId = newFacility.id

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
    // SECURITY: ALL new users start as PENDING (no auto-activation)
    const userStatus = 'PENDING'

    // ── Create user, profile, and subscription inside a transaction ──
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
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

      // Create role-specific profiles
      if (['NURSE', 'MATRON', 'STUDENT', 'OTHER'].includes(normalizedRole)) {
        await tx.nurseProfile.create({
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

      if (isAdmin) {
        await tx.adminProfile.create({
          data: {
            userId: user.id,
            facilityId: resolvedFacilityId,
            accessLevel: 5,
            department: adminLicenseNumber ? `License: ${adminLicenseNumber}` : null,
          },
        })
      }

      // Create subscription ONLY after user exists (fixes FK violation with userId: '')
      if (isAdmin && createdFacilityId) {
        await tx.subscription.create({
          data: {
            id: randomUUID(),
            userId: user.id, // Use actual user.id — no more empty string FK violation
            facilityId: createdFacilityId,
            plan: 'FREE',
            status: 'TRIALING',
            isActive: true,
          },
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: isAdmin && createdFacilityId ? 'FACILITY_APPLICATION_SUBMITTED_OAUTH' : (isAdmin ? 'ADMIN_REGISTERED_OAUTH' : 'USER_REGISTERED_OAUTH'),
          resource: isAdmin && createdFacilityId ? 'Facility' : 'User',
          resourceId: isAdmin && createdFacilityId ? createdFacilityId : user.id,
          details: isAdmin && createdFacilityId
            ? `New facility application via ${provider || 'social'}: ${newFacilityName} (Reg: ${newFacilityRegistrationNumber}) — admin ${firstName} ${lastName} (${email}). Requires SUPER_ADMIN verification.`
            : isAdmin
            ? `New facility admin registered via ${provider || 'social'} — pending approval (joining existing facility)`
            : `New ${normalizedRole.toLowerCase()} registered via ${provider || 'social'} — pending approval`,
        },
      })

      return { user, facilityId: resolvedFacilityId }
    })

    // ── Notifications (outside transaction — non-critical, should not crash registration) ──
    try {
      if (isAdmin && createdFacilityId) {
        // Notify ALL SUPER_ADMIN users about the new facility application
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
                message: `${firstName} ${lastName} (${email}) has applied to register "${newFacilityName}" in ${newFacilityCity}, ${newFacilityState}. Registration #: ${newFacilityRegistrationNumber}. Please verify and approve or reject this facility.`,
                data: JSON.stringify({
                  facilityId: createdFacilityId,
                  facilityName: newFacilityName,
                  adminUserId: result.user.id,
                  adminEmail: email,
                  registrationNumber: newFacilityRegistrationNumber,
                }),
              },
            })
          }
        }
      } else if (resolvedFacilityId) {
        // Notify the facility admin about the pending user
        const facilityAdmin = await db.adminProfile.findFirst({
          where: { facilityId: resolvedFacilityId, accessLevel: { lt: 10 } },
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
                pendingUserId: result.user.id,
                pendingUserName: `${firstName} ${lastName}`,
                pendingUserEmail: email,
                pendingUserRole: normalizedRole,
                facilityId: resolvedFacilityId,
              }),
            },
          })
        }
      }
    } catch (notifError) {
      // Notification failure should NOT crash the registration
      console.error('Notification error (non-critical):', notifError)
    }

    // ── Return response ──
    const pendingMessage = isAdmin && createdFacilityId
      ? 'Your facility application has been submitted! A NurseOS Super Admin will review and verify your facility and account. You will be notified once approved. This typically takes 1-2 business days.'
      : isAdmin
      ? 'Your account has been created. The existing facility admin needs to approve your access before you can sign in.'
      : 'Your account has been created. Please wait for the facility admin to approve your access.'

    return NextResponse.json({
      status: 'PENDING',
      message: pendingMessage,
      requiresApproval: true,
      ...(isAdmin && createdFacilityId ? { facilityCreated: true, facilityName: newFacilityName } : {}),
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
