import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, facilityWhereClause, checkResourceFacility } from '@/lib/middleware'
import { CLINICAL_PERMISSIONS, SYSTEM_PERMISSIONS } from '@/lib/permissions'
import { randomUUID } from 'crypto'

// GET /api/nurseai/patients - List patients scoped to facility
export const GET = withAuth({
  permissions: [CLINICAL_PERMISSIONS.PATIENT_READ],
  policies: ['facility_required'],
  auditAction: 'patient.list',
  auditResource: 'patient',
}, async (ctx) => {
  const { searchParams } = new URL(ctx.request.url)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
  const search = searchParams.get('search')
  const gender = searchParams.get('gender')
  const bloodType = searchParams.get('bloodType')

  const where: Record<string, unknown> = {
    ...facilityWhereClause(ctx),
  }

  if (search) {
    where.OR = [
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { user: { displayName: { contains: search } } },
      { patientId: { contains: search } },
    ]
  }
  if (gender && gender !== 'all') {
    where.gender = gender
  }
  if (bloodType && bloodType !== 'all') {
    where.bloodType = bloodType
  }

  const patients = await db.patientProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true,
          displayName: true, email: true, phone: true, avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const formatted = patients.map((p) => ({
    id: p.id,
    patientId: p.patientId,
    facilityId: p.facilityId,
    firstName: p.user?.firstName ?? '',
    lastName: p.user?.lastName ?? '',
    displayName: p.user?.displayName ?? null,
    fullName: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.patientId,
    gender: p.gender,
    bloodType: p.bloodType,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    allergies: p.allergies,
    nationality: p.nationality,
    createdAt: p.createdAt.toISOString(),
    user: p.user ? {
      id: p.user.id, firstName: p.user.firstName, lastName: p.user.lastName,
      displayName: p.user.displayName, email: p.user.email,
      phone: p.user.phone, avatarUrl: p.user.avatarUrl,
    } : null,
  }))

  return NextResponse.json({ patients: formatted })
})

// POST /api/nurseai/patients - Register a new patient
export const POST = withAuth({
  permissions: [CLINICAL_PERMISSIONS.PATIENT_WRITE],
  policies: ['facility_required'],
  auditAction: 'patient.create',
  auditResource: 'patient',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  let body
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    firstName, lastName, email, phone, dateOfBirth,
    gender, bloodType, genotype, allergies, facilityId: bodyFacilityId,
  } = body

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: 'First name and last name are required' },
      { status: 400 },
    )
  }

  // Determine target facility
  let targetFacilityId: string | null = ctx.facilityId

  // SUPER_ADMIN can specify a facility when registering patients
  if (ctx.isSuperAdmin && bodyFacilityId) {
    const facility = await db.facility.findUnique({
      where: { id: bodyFacilityId },
      select: { id: true },
    })
    if (facility) {
      targetFacilityId = facility.id
    }
  }

  if (!targetFacilityId) {
    return NextResponse.json(
      { error: 'A facility is required to register a patient.' },
      { status: 400 },
    )
  }

  const year = new Date().getFullYear()
  const randomSuffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
  const patientId = `PT/${year}/${randomSuffix}`

  let userId: string | null = null
  if (email) {
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!existingUser) {
      const user = await db.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: await import('bcryptjs').then(b => b.hash(randomUUID(), 10)),
          firstName, lastName,
          displayName: `${firstName} ${lastName}`,
          phone: phone || null,
          role: 'PATIENT', status: 'ACTIVE',
          facilityId: targetFacilityId,
        },
      })
      userId = user.id
    }
  }

  const patient = await db.patientProfile.create({
    data: {
      userId, patientId, facilityId: targetFacilityId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null, bloodType: bloodType || null,
      genotype: genotype || null,
      allergies: allergies
        ? JSON.stringify(Array.isArray(allergies) ? allergies : allergies.split(',').map((a: string) => a.trim()))
        : '[]',
    },
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true,
          displayName: true, email: true, phone: true, avatarUrl: true,
        },
      },
    },
  })

  const formatted = {
    id: patient.id, patientId: patient.patientId, facilityId: patient.facilityId,
    firstName: patient.user?.firstName ?? firstName,
    lastName: patient.user?.lastName ?? lastName,
    displayName: patient.user?.displayName ?? null,
    fullName: patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : `${firstName} ${lastName}`,
    gender: patient.gender, bloodType: patient.bloodType,
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
    allergies: patient.allergies, nationality: patient.nationality,
    createdAt: patient.createdAt.toISOString(),
    user: patient.user ? {
      id: patient.user.id, firstName: patient.user.firstName, lastName: patient.user.lastName,
      displayName: patient.user.displayName, email: patient.user.email,
      phone: patient.user.phone, avatarUrl: patient.user.avatarUrl,
    } : null,
  }

  return NextResponse.json(
    { message: 'Patient registered successfully', patient: formatted },
    { status: 201 },
  )
})
