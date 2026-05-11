import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { randomUUID } from 'crypto'

// GET /api/nurseai/patients
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const search = searchParams.get('search')
    const gender = searchParams.get('gender')
    const bloodType = searchParams.get('bloodType')

    const where: Record<string, unknown> = {}
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

// POST /api/nurseai/patients - Register a new patient
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, dateOfBirth, gender, bloodType, genotype, allergies } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
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
          },
        })
        userId = user.id
      }
    }

    // Create patient profile
    const patient = await db.patientProfile.create({
      data: {
        userId,
        patientId,
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
