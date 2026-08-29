/**
 * POST /api/setup/test-accounts
 *
 * Wipes ALL existing users + facilities and creates fresh test accounts for testing.
 * Blocked by middleware in ALL environments. Defense-in-depth: requires ADMIN auth.
 */

import { NextResponse } from 'next/server'
import { db, isDatabaseConnected } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export const POST = withAuth({}, async (ctx) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Defense-in-depth: require admin auth
  if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database not configured', errorType: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    const TEST_CREDENTIALS = {
      admin: { email: 'admin@nurseos.test', password: 'Admin123', firstName: 'Test', lastName: 'Admin' },
      lecturer: { email: 'lecturer@nurseos.test', password: 'Lecturer123', firstName: 'Test', lastName: 'Lecturer' },
      student: { email: 'student@nurseos.test', password: 'Student123', firstName: 'Test', lastName: 'Student' },
    }

    console.log('[Test Accounts] Wiping all existing users + facilities...')

    // Delete in dependency order to avoid FK violations
    await db.session.deleteMany()
    await db.auditLog.deleteMany()
    await db.notification.deleteMany()
    await db.passwordReset.deleteMany()

    // Material-related (if tables exist — wrap in try/catch for safety)
    try { await db.materialView.deleteMany() } catch {}
    try { await db.materialDownload.deleteMany() } catch {}
    try { await db.materialComment.deleteMany() } catch {}
    try { await db.sharedMaterial.deleteMany() } catch {}
    try { await db.courseMaterial.deleteMany() } catch {}

    await db.nurseProfile.deleteMany()
    await db.adminProfile.deleteMany()
    await db.user.deleteMany()
    await db.facility.deleteMany()

    console.log('[Test Accounts] Wipe complete. Creating test institution...')

    // Create the test institution
    const institution = await db.facility.create({
      data: {
        id: randomUUID(),
        name: 'Test University of Nursing Sciences',
        type: 'UNIVERSITY',
        address: 'Test Address 123',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        phone: '+234 801 234 5678',
        email: 'info@testuniversity.edu.ng',
        isVerified: true,
        accreditationStatus: 'ACCREDITED',
        freeTrialEndsAt: null,  // Free forever
      },
    })

    console.log('[Test Accounts] Creating test accounts...')

    // 1. Institution Admin
    const adminPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10)
    const adminUser = await db.user.create({
      data: {
        id: randomUUID(),
        email: TEST_CREDENTIALS.admin.email,
        passwordHash: adminPasswordHash,
        firstName: TEST_CREDENTIALS.admin.firstName,
        lastName: TEST_CREDENTIALS.admin.lastName,
        displayName: `${TEST_CREDENTIALS.admin.firstName} ${TEST_CREDENTIALS.admin.lastName}`,
        role: 'ADMIN',
        status: 'ACTIVE',
        facilityId: institution.id,
        countryCode: 'NG',
        emailVerified: true,
      },
    })
    await db.adminProfile.create({
      data: {
        id: randomUUID(),
        userId: adminUser.id,
        facilityId: institution.id,
        accessLevel: 5,
      },
    })

    // 2. Lecturer (ACTIVE for testing)
    const lecturerPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.lecturer.password, 10)
    const lecturerUser = await db.user.create({
      data: {
        id: randomUUID(),
        email: TEST_CREDENTIALS.lecturer.email,
        passwordHash: lecturerPasswordHash,
        firstName: TEST_CREDENTIALS.lecturer.firstName,
        lastName: TEST_CREDENTIALS.lecturer.lastName,
        displayName: `${TEST_CREDENTIALS.lecturer.firstName} ${TEST_CREDENTIALS.lecturer.lastName}`,
        role: 'NURSE',
        academicRole: 'LECTURER',
        status: 'ACTIVE',
        facilityId: institution.id,
        countryCode: 'NG',
        emailVerified: true,
      },
    })
    await db.nurseProfile.create({
      data: {
        id: randomUUID(),
        userId: lecturerUser.id,
        licenseNumber: `LEC/2025/00001`,
        licenseIssuingBody: 'Nursing Registration Board',
        licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
        nursingCouncil: 'Nigeria',
        currentFacilityId: institution.id,
        skills: '[]',
        languages: '["English"]',
      },
    })

    // 3. Student (200 level)
    const studentPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.student.password, 10)
    const studentUser = await db.user.create({
      data: {
        id: randomUUID(),
        email: TEST_CREDENTIALS.student.email,
        passwordHash: studentPasswordHash,
        firstName: TEST_CREDENTIALS.student.firstName,
        lastName: TEST_CREDENTIALS.student.lastName,
        displayName: `${TEST_CREDENTIALS.student.firstName} ${TEST_CREDENTIALS.student.lastName}`,
        role: 'NURSE',
        academicRole: 'STUDENT',
        studentLevel: 200,
        matricNumber: 'NUR/2023/00245',
        status: 'ACTIVE',
        facilityId: institution.id,
        countryCode: 'NG',
        emailVerified: true,
      },
    })
    await db.nurseProfile.create({
      data: {
        id: randomUUID(),
        userId: studentUser.id,
        licenseNumber: `STU/2025/00001`,
        licenseIssuingBody: 'Nursing Registration Board',
        licenseExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
        nursingCouncil: 'Nigeria',
        currentFacilityId: institution.id,
        skills: '[]',
        languages: '["English"]',
      },
    })

    console.log('[Test Accounts] Done!')

    return NextResponse.json({
      message: 'Test accounts created successfully. All previous users + facilities were wiped.',
      status: 'test_accounts_created',
      institution: {
        id: institution.id,
        name: institution.name,
        type: institution.type,
      },
      accounts: [
        { role: 'Institution Admin', email: TEST_CREDENTIALS.admin.email, password: TEST_CREDENTIALS.admin.password },
        { role: 'Lecturer', email: TEST_CREDENTIALS.lecturer.email, password: TEST_CREDENTIALS.lecturer.password },
        { role: 'Student (200 level)', email: TEST_CREDENTIALS.student.email, password: TEST_CREDENTIALS.student.password, matricNumber: 'NUR/2023/00245' },
      ],
      loginUrl: '/test-login',
    })
  } catch (error: any) {
    console.error('[Test Accounts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create test accounts' },
      { status: 500 }
    )
  }
})
