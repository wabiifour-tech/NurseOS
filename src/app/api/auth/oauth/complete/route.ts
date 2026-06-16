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
      avatarUrl, provider, phone,
      // New facility fields
      facilityMode, newFacilityName, newFacilityType,
      newFacilityAddress, newFacilityCity, newFacilityState,
      newFacilityPhone, newFacilityEmail,
      newFacilityRegistrationNumber,
      // Academic module
      studentLevel, adminType, matricNumber,
    } = body

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // ─── Role handling ───
    // Accept INSTITUTION_ADMIN as a separate role that maps to ADMIN on the backend.
    // Accept LECTURER + STUDENT — both map to NURSE in DB enum, but academicRole preserves the original.
    const normalizedRole = String(role).toUpperCase()
    const isInstitutionAdmin = normalizedRole === 'INSTITUTION_ADMIN'
    const isLecturer = normalizedRole === 'LECTURER'
    const isStudent = normalizedRole === 'STUDENT'

    // Map INSTITUTION_ADMIN → ADMIN for DB; keep adminType to disambiguate
    const effectiveRole = isInstitutionAdmin ? 'ADMIN' : normalizedRole

    const validRoles = ['NURSE', 'ADMIN', 'DOCTOR', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER']
    if (!validRoles.includes(effectiveRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate student level + matric number if STUDENT role
    if (isStudent) {
      const validLevels = [100, 200, 300, 400, 500]
      if (!studentLevel || !validLevels.includes(Number(studentLevel))) {
        return NextResponse.json(
          { error: 'Student level is required and must be one of: 100, 200, 300, 400, 500' },
          { status: 400 }
        )
      }
      if (!matricNumber || !String(matricNumber).trim()) {
        return NextResponse.json(
          { error: 'Matriculation number is required for students' },
          { status: 400 }
        )
      }
    }

    const isAdmin = effectiveRole === 'ADMIN'

    // ─── STRONG duplicate-email check (case-insensitive) ───
    // The DB unique constraint is case-sensitive on PostgreSQL by default — we normalize to lowercase
    // both at storage and at lookup time. This catches duplicates that would otherwise slip through
    // due to case differences (e.g., John@Example.com vs john@example.com).
    const normalizedEmail = String(email).toLowerCase().trim()
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json({
        error: 'An account with this email already exists. Please sign in instead.',
        errorType: 'EMAIL_ALREADY_EXISTS',
      }, { status: 409 })
    }

    // ── Facility resolution ──
    let resolvedFacilityId = facilityId || null
    let createdFacilityId: string | null = null

    if (isAdmin && facilityMode === 'new') {
      // Admin creating a new facility
      if (!newFacilityName || !newFacilityState) {
        return NextResponse.json({ error: 'Facility name and state are required' }, { status: 400 })
      }

      // Validate facility type — institution admins can only create UNIVERSITY / SCHOOL_OF_NURSING
      const validTypes = ['HOSPITAL', 'CLINIC', 'PRIMARY_HEALTH_CENTER', 'SPECIALIST_CENTER', 'MATERNITY_HOME', 'REHABILITATION_CENTER', 'DIAGNOSTIC_CENTER', 'PHARMACY', 'COMMUNITY_HEALTH_CENTER', 'GENERAL', 'UNIVERSITY', 'SCHOOL_OF_NURSING']
      const facilityType = String(newFacilityType || 'HOSPITAL')
      if (!validTypes.includes(facilityType)) {
        return NextResponse.json({ error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
      }
      if (adminType === 'INSTITUTION' && !['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facilityType)) {
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
      //   - Lecturer + Student → never reach this branch (they always join existing institutions)
      const providedRegNumber = newFacilityRegistrationNumber && String(newFacilityRegistrationNumber).trim()
        ? String(newFacilityRegistrationNumber).trim()
        : null

      if (adminType !== 'INSTITUTION' && !providedRegNumber) {
        return NextResponse.json({
          error: 'Facility registration/license number is required. This helps us verify legitimate healthcare facilities and prevent unauthorized access.',
        }, { status: 400 })
      }

      // If provided, check for duplicate registration number
      if (providedRegNumber) {
        const existingReg = await db.facility.findUnique({
          where: { registrationNumber: providedRegNumber },
        })
        if (existingReg) {
          return NextResponse.json({
            error: 'This facility registration number is already registered. If you believe this is an error, please contact support.',
          }, { status: 409 })
        }
      }

      // Auto-grant 1-week free trial for academic institutions (UNIVERSITY / SCHOOL_OF_NURSING)
      const isAcademicInstitution = ['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facilityType)
      const trialEndsAt = isAcademicInstitution
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days from now
        : null

      const newFacility = await db.facility.create({
        data: {
          id: randomUUID(),
          name: String(newFacilityName).trim(),
          type: facilityType,
          address: String(newFacilityAddress || 'To be confirmed').trim(),
          city: String(newFacilityCity || '').trim(),
          state: String(newFacilityState).trim(),
          country: 'Nigeria',
          phone: newFacilityPhone ? String(newFacilityPhone).trim() : null,
          email: newFacilityEmail ? String(newFacilityEmail).trim() : null,
          // Store registration number if provided (required for regular Facility Admin, optional for Institution Admin)
          registrationNumber: providedRegNumber,
          isVerified: false,
          accreditationStatus: 'PENDING',
          freeTrialEndsAt: trialEndsAt,
        },
      })
      resolvedFacilityId = newFacility.id
      createdFacilityId = newFacility.id

    } else {
      // Joining existing facility
      if (!resolvedFacilityId) {
        return NextResponse.json({ error: 'Please select a facility' }, { status: 400 })
      }
      const facility = await db.facility.findUnique({
        where: { id: resolvedFacilityId },
        select: { id: true, type: true },
      })
      if (!facility) {
        return NextResponse.json({ error: 'Facility not found' }, { status: 400 })
      }
      // Institution admins can only join UNIVERSITY / SCHOOL_OF_NURSING facilities
      if (adminType === 'INSTITUTION' && !['UNIVERSITY', 'SCHOOL_OF_NURSING'].includes(facility.type)) {
        return NextResponse.json(
          { error: 'Institution admins can only join universities or schools of nursing.' },
          { status: 400 }
        )
      }
    }

    // ── Map role to DB role ──
    // LECTURER + STUDENT + NURSE + MATRON + OTHER all map to NURSE in the DB role enum
    const dbRole = ['NURSE', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER'].includes(effectiveRole) ? 'NURSE' :
                   effectiveRole === 'DOCTOR' ? 'DOCTOR' :
                   effectiveRole === 'ADMIN' ? 'ADMIN' : 'PATIENT'

    // ── Academic role storage ──
    const academicRoleToStore = ['LECTURER', 'STUDENT'].includes(effectiveRole) ? effectiveRole : null
    const studentLevelToStore = isStudent ? Number(studentLevel) : null
    const matricNumberToStore = isStudent ? String(matricNumber).trim() : null

    // ── Determine status ──
    // The admin who CREATES a new facility/institution IS the admin — they should be ACTIVE immediately.
    // No one is "above" them to approve their access. (Super Admin may still verify the facility separately,
    // but that's a facility-level concern, not a user-account lock.)
    //
    //   - ADMIN / INSTITUTION_ADMIN creating a NEW facility → ACTIVE (they are the admin of the new facility)
    //   - ADMIN / INSTITUTION_ADMIN joining an EXISTING facility → PENDING (existing admin must approve)
    //   - STUDENT → ACTIVE (auto-enrolled — picks level + institution, no approval needed)
    //   - LECTURER → PENDING (institution admin must approve)
    //   - NURSE / DOCTOR / MATRON / OTHER → PENDING (facility admin must approve)
    const createdNewFacility = facilityMode === 'new' && !!createdFacilityId
    const userStatus =
      (isAdmin && createdNewFacility) ? 'ACTIVE' :
      isStudent ? 'ACTIVE' :
      'PENDING'

    // ── Create user, profile, and subscription inside a transaction ──
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(randomBytes(32).toString('base64'), 10),
          firstName: String(firstName).trim().slice(0, 100),
          lastName: String(lastName).trim().slice(0, 100),
          displayName: `${String(firstName).trim()} ${String(lastName).trim()}`,
          role: dbRole,
          status: userStatus,
          facilityId: resolvedFacilityId,
          avatarUrl: avatarUrl || null,
          phone: phone ? String(phone).trim() : null,
          academicRole: academicRoleToStore,
          studentLevel: studentLevelToStore,
          matricNumber: matricNumberToStore,
        },
      })

      // Create role-specific profiles
      if (['NURSE', 'MATRON', 'STUDENT', 'OTHER', 'LECTURER'].includes(effectiveRole)) {
        await tx.nurseProfile.create({
          data: {
            userId: user.id,
            licenseNumber: isStudent
              ? `STU/${new Date().getFullYear()}/${generateLicenseSuffix()}`
              : isLecturer
              ? `LEC/${new Date().getFullYear()}/${generateLicenseSuffix()}`
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
          },
        })
      }

      // Create subscription for new facility (admin only)
      if (isAdmin && createdFacilityId) {
        await tx.subscription.create({
          data: {
            id: randomUUID(),
            userId: user.id,
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
          action: isAdmin && createdFacilityId
            ? (adminType === 'INSTITUTION' ? 'INSTITUTION_APPLICATION_SUBMITTED_OAUTH' : 'FACILITY_APPLICATION_SUBMITTED_OAUTH')
            : 'USER_REGISTERED_OAUTH',
          resource: isAdmin && createdFacilityId ? 'Facility' : 'User',
          resourceId: isAdmin && createdFacilityId ? createdFacilityId : user.id,
          details: isAdmin && createdFacilityId
            ? `New ${adminType === 'INSTITUTION' ? 'institution' : 'facility'} via ${provider || 'social'}: ${newFacilityName} — admin ${firstName} ${lastName} (${email}).`
            : `New ${effectiveRole.toLowerCase()} registered via ${provider || 'social'} — ${userStatus === 'ACTIVE' ? 'auto-enrolled' : 'pending approval'}`,
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
                title: `New ${adminType === 'INSTITUTION' ? 'Institution' : 'Facility'} Application`,
                message: `${firstName} ${lastName} (${email}) has applied to register "${newFacilityName}" in ${newFacilityCity || newFacilityState}.`,
                data: JSON.stringify({
                  facilityId: createdFacilityId,
                  facilityName: newFacilityName,
                  adminUserId: result.user.id,
                  adminEmail: email,
                }),
              },
            })
          }
        }
      } else if (resolvedFacilityId) {
        if (isLecturer) {
          // Notify institution admin about new lecturer signup (pending approval)
          const institutionAdmin = await db.adminProfile.findFirst({
            where: { facilityId: resolvedFacilityId, accessLevel: { lt: 10 } },
            include: { user: { select: { id: true } } },
          })
          if (institutionAdmin?.user?.id) {
            await db.notification.create({
              data: {
                userId: institutionAdmin.user.id,
                type: 'USER_APPROVAL',
                title: 'New lecturer requesting access',
                message: `${firstName} ${lastName} (${email}) has signed up as a lecturer and is requesting access to your institution. Please review and approve.`,
                data: JSON.stringify({
                  pendingUserId: result.user.id,
                  pendingUserEmail: email,
                  pendingUserRole: 'LECTURER',
                  facilityId: resolvedFacilityId,
                }),
              },
            })
          }
        } else if (isStudent) {
          // Notify institution admin about new student enrollment (FYI only — students auto-enroll)
          const institutionAdmin = await db.adminProfile.findFirst({
            where: { facilityId: resolvedFacilityId, accessLevel: { lt: 10 } },
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
                  newStudentUserId: result.user.id,
                  newStudentEmail: email,
                  studentLevel: Number(studentLevel),
                  facilityId: resolvedFacilityId,
                }),
              },
            })
          }
        } else {
          // Notify facility admin about pending user
          const facilityAdmin = await db.adminProfile.findFirst({
            where: { facilityId: resolvedFacilityId, accessLevel: { lt: 10 } },
            include: { user: { select: { id: true } } },
          })
          if (facilityAdmin?.user?.id) {
            await db.notification.create({
              data: {
                userId: facilityAdmin.user.id,
                type: 'USER_APPROVAL',
                title: `New ${effectiveRole.toLowerCase()} requesting access`,
                message: `${firstName} ${lastName} (${email}) has signed up and is requesting access to your facility. Please review and approve.`,
                data: JSON.stringify({
                  pendingUserId: result.user.id,
                  pendingUserEmail: email,
                  pendingUserRole: effectiveRole,
                  facilityId: resolvedFacilityId,
                }),
              },
            })
          }
        }
      }
    } catch (notifError) {
      console.error('Notification error (non-critical):', notifError)
    }

    // ── If user is ACTIVE (student auto-enrolled, OR admin who created a new facility/institution) ──
    // Create a session and return a token so they can be auto-logged-in to the dashboard.
    if (userStatus === 'ACTIVE') {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await db.session.create({
        data: {
          userId: result.user.id,
          token,
          expiresAt,
        },
      })

      // Fetch facility name
      let facilityName: string | null = null
      if (resolvedFacilityId) {
        const f = await db.facility.findUnique({ where: { id: resolvedFacilityId }, select: { name: true } })
        facilityName = f?.name || null
      }

      // Normalize role for the client (SUPER_ADMIN recovery is done by the auth helper on subsequent requests;
      // here we just send back what the client needs to know).
      const clientRole = isAdmin ? 'ADMIN' : isStudent ? 'STUDENT' : effectiveRole

      const response = NextResponse.json({
        status: 'ACTIVE',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: clientRole,
          academicRole: academicRoleToStore,
          studentLevel: studentLevelToStore,
          matricNumber: matricNumberToStore,
          facilityId: resolvedFacilityId,
          facilityName,
        },
      })

      response.cookies.set('nurseos-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      })

      return response
    }

    // ── Return response (PENDING only — admin-creating-new-facility case is handled above as ACTIVE) ──
    const pendingMessage =
      isLecturer
      ? 'Your lecturer account has been created and is pending approval from your institution admin. You will be notified once approved.'
      : isAdmin
      ? (adminType === 'INSTITUTION'
        ? 'Your account has been created. The existing institution admin needs to approve your access before you can sign in.'
        : 'Your account has been created. The existing facility admin needs to approve your access before you can sign in.')
      : 'Your account has been created. Please wait for the facility admin to approve your access.'

    return NextResponse.json({
      status: 'PENDING',
      message: pendingMessage,
      requiresApproval: true,
    })
  } catch (error: unknown) {
    console.error('OAuth complete error:', error)
    const errMsg = (error as Error)?.message || ''
    // Prisma unique constraint violation (P2002) — typically email collision
    if (errMsg.includes('P2002') || errMsg.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.', errorType: 'EMAIL_ALREADY_EXISTS' },
        { status: 409 }
      )
    }
    if (errMsg.includes('connect') || errMsg.includes('ECONNREFUSED') || errMsg.includes('P1001') || errMsg.includes('server is not reachable') || errMsg.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database tables are not set up yet. Please visit /api/setup to create the database schema, then try again.', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Failed to complete registration', details: errMsg.substring(0, 200) }, { status: 500 })
  }
}
