/**
 * create-test-accounts.mjs
 *
 * Wipes ALL existing users and creates fresh test accounts for testing:
 *   1. Institution Admin  — admin@nurseos.test / Admin123
 *   2. Lecturer           — lecturer@nurseos.test / Lecturer123
 *   3. Student            — student@nurseos.test / Student123
 *
 * Also creates a test institution ("Test University of Nursing Sciences").
 *
 * USAGE:
 *   node scripts/create-test-accounts.mjs
 *
 * Or with a custom DATABASE_URL:
 *   DATABASE_URL="postgresql://..." node scripts/create-test-accounts.mjs
 *
 * After running this script, you can log in via the /api/auth/dev-login endpoint
 * (or use the test login page at /test-login) with the credentials above.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const TEST_CREDENTIALS = {
  admin: { email: 'admin@nurseos.test', password: 'Admin123', firstName: 'Test', lastName: 'Admin' },
  lecturer: { email: 'lecturer@nurseos.test', password: 'Lecturer123', firstName: 'Test', lastName: 'Lecturer' },
  student: { email: 'student@nurseos.test', password: 'Student123', firstName: 'Test', lastName: 'Student' },
}

async function main() {
  console.log('🧹 Wiping all existing users (fresh start)...\n')

  // Delete in dependency order to avoid FK violations
  // Sessions, audit logs, notifications, password resets, material views/downloads/comments, shared materials
  await prisma.session.deleteMany()
  console.log('  ✓ Deleted all sessions')
  await prisma.auditLog.deleteMany()
  console.log('  ✓ Deleted all audit logs')
  await prisma.notification.deleteMany()
  console.log('  ✓ Deleted all notifications')
  await prisma.passwordReset.deleteMany()
  console.log('  ✓ Deleted all password resets')
  await prisma.materialView.deleteMany()
  console.log('  ✓ Deleted all material views')
  await prisma.materialDownload.deleteMany()
  console.log('  ✓ Deleted all material downloads')
  await prisma.materialComment.deleteMany()
  console.log('  ✓ Deleted all material comments')
  await prisma.sharedMaterial.deleteMany()
  console.log('  ✓ Deleted all shared materials')
  await prisma.courseMaterial.deleteMany()
  console.log('  ✓ Deleted all course materials')

  // Delete nurse profiles, admin profiles, then users
  await prisma.nurseProfile.deleteMany()
  console.log('  ✓ Deleted all nurse profiles')
  await prisma.adminProfile.deleteMany()
  console.log('  ✓ Deleted all admin profiles')

  await prisma.user.deleteMany()
  console.log('  ✓ Deleted all users\n')

  // Also wipe existing facilities (fresh start)
  await prisma.facility.deleteMany()
  console.log('  ✓ Deleted all facilities\n')

  console.log('🏫 Creating test institution...\n')

  // Create the test institution
  const institution = await prisma.facility.create({
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
      freeTrialEndsAt: null,  // No trial — free forever
    },
  })
  console.log(`  ✓ Created institution: ${institution.name} (${institution.id})\n`)

  console.log('👥 Creating test accounts...\n')

  // 1. Create Institution Admin
  const adminPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10)
  const adminUser = await prisma.user.create({
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
  await prisma.adminProfile.create({
    data: {
      id: randomUUID(),
      userId: adminUser.id,
      facilityId: institution.id,
      accessLevel: 5,
    },
  })
  console.log(`  ✓ Institution Admin: ${adminUser.email} / ${TEST_CREDENTIALS.admin.password}`)

  // 2. Create Lecturer (PENDING — needs admin approval)
  const lecturerPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.lecturer.password, 10)
  const lecturerUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: TEST_CREDENTIALS.lecturer.email,
      passwordHash: lecturerPasswordHash,
      firstName: TEST_CREDENTIALS.lecturer.firstName,
      lastName: TEST_CREDENTIALS.lecturer.lastName,
      displayName: `${TEST_CREDENTIALS.lecturer.firstName} ${TEST_CREDENTIALS.lecturer.lastName}`,
      role: 'NURSE',
      academicRole: 'LECTURER',
      status: 'ACTIVE',  // Make active so they can log in immediately for testing
      facilityId: institution.id,
      countryCode: 'NG',
      emailVerified: true,
    },
  })
  await prisma.nurseProfile.create({
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
  console.log(`  ✓ Lecturer: ${lecturerUser.email} / ${TEST_CREDENTIALS.lecturer.password}`)

  // 3. Create Student (200 level)
  const studentPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.student.password, 10)
  const studentUser = await prisma.user.create({
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
  await prisma.nurseProfile.create({
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
  console.log(`  ✓ Student: ${studentUser.email} / ${TEST_CREDENTIALS.student.password}`)

  console.log('\n✅ Done! Test accounts created.\n')
  console.log('📋 TEST CREDENTIALS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Institution Admin:  ${TEST_CREDENTIALS.admin.email}  /  ${TEST_CREDENTIALS.admin.password}`)
  console.log(`Lecturer:           ${TEST_CREDENTIALS.lecturer.email}  /  ${TEST_CREDENTIALS.lecturer.password}`)
  console.log(`Student:            ${TEST_CREDENTIALS.student.email}  /  ${TEST_CREDENTIALS.student.password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🔑 Log in at: /test-login (or POST /api/auth/dev-login with email + password)')
  console.log(`🏫 Institution: ${institution.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
