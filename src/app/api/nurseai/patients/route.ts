import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET /api/nurseai/patients - List patients scoped to the nurse's facility
// SUPER_ADMIN can view all patients across facilities
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment to view patients
  // Exception: SUPER_ADMIN can view patients across all facilities
  const facilityId = requireFacility(authUser)
  const isSuperAdmin = authUser.role === 'SUPER_ADMIN'

  // Block non-super-admin users without a facility
  if (facilityId instanceof Response && !isSuperAdmin) return facilityId

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const search = searchParams.get('search')
    const gender = searchParams.get('gender')
    const bloodType = searchParams.get('bloodType')

    const where: Record<string, unknown> = {}

    // 🔒 FACILITY ISOLATION: Only show patients from the user's facility
    // SUPER_ADMIN sees all patients (no facility filter)
    if (!isSuperAdmin && typeof facilityId === 'string') {
      where.facilityId = facilityId
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
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
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
      fullName: p.user
        ? `${p.user.firstName} ${p.user.lastName}`
        : p.patientId,
      gender: p.gender,
      bloodType: p.bloodType,
      dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
      allergies: p.allergies,
      nationality: p.nationality,
      createdAt: p.createdAt.toISOString(),
      user: p.user
        ? {
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            displayName: p.user.displayName,
            email: p.user.email,
            phone: p.user.phone,
            avatarUrl: p.user.avatarUrl,
          }
        : null,
    }))

    return NextResponse.json({ patients: formatted })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

// POST /api/nurseai/patients - Register a new patient (scoped to nurse's facility)
// SUPER_ADMIN can register patients and assign them to a facility
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const isSuperAdmin = authUser.role === 'SUPER_ADMIN'
  const facilityId = requireFacility(authUser)

  // Block non-super-admin users without a facility
  if (facilityId instanceof Response && !isSuperAdmin) return facilityId

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, genotype, allergies, facilityId: bodyFacilityId } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Determine which facility to assign the patient to
    // SUPER_ADMIN can specify a facility via bodyFacilityId, or we use their assigned facility
    // Regular users are scoped to their own facility
    let targetFacilityId: string | null = null
    if (typeof facilityId === 'string') {
      targetFacilityId = facilityId
    } else if (isSuperAdmin && bodyFacilityId) {
      // SUPER_ADMIN can specify a facility when registering patients
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
        { error: 'A facility is required to register a patient. Please select a facility.' },
        { status: 400 }
      )
    }

    // Generate a unique patient ID
    const year = new Date().getFullYear()
    const randomSuffix = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    const patientId = `PT/${year}/${randomSuffix}`

    // Create user account for the patient (optional email)
    let userId: string | null = null
    if (email) {
      const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } })
      if (!existingUser) {
        const user = await db.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: await import('bcryptjs').then(b => b.hash(randomUUID(), 10)),
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            phone: phone || null,
            role: 'PATIENT',
            status: 'ACTIVE',
            facilityId: targetFacilityId,
          },
        })
        userId = user.id
      }
    }

    // Create patient profile scoped to the target facility
    const patient = await db.patientProfile.create({
      data: {
        userId,
        patientId,
        facilityId: targetFacilityId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        bloodType: bloodType || null,
        genotype: genotype || null,
        allergies: allergies ? JSON.stringify(Array.isArray(allergies) ? allergies : allergies.split(',').map((a: string) => a.trim())) : '[]',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Format the response
    const formatted = {
      id: patient.id,
      patientId: patient.patientId,
      facilityId: patient.facilityId,
      firstName: patient.user?.firstName ?? firstName,
      lastName: patient.user?.lastName ?? lastName,
      displayName: patient.user?.displayName ?? null,
      fullName: patient.user
        ? `${patient.user.firstName} ${patient.user.lastName}`
        : `${firstName} ${lastName}`,
      gender: patient.gender,
      bloodType: patient.bloodType,
      dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
      allergies: patient.allergies,
      nationality: patient.nationality,
      createdAt: patient.createdAt.toISOString(),
      user: patient.user
        ? {
            id: patient.user.id,
            firstName: patient.user.firstName,
            lastName: patient.user.lastName,
            displayName: patient.user.displayName,
            email: patient.user.email,
            phone: patient.user.phone,
            avatarUrl: patient.user.avatarUrl,
          }
        : null,
    }

    return NextResponse.json(
      { message: 'Patient registered successfully', patient: formatted },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Failed to register patient. Please try again.' },
      { status: 500 }
    )
  }
}
