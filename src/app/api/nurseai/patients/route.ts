import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/nurseai/patients - List patients with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const gender = searchParams.get('gender') || ''
    const bloodType = searchParams.get('bloodType') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { patientId: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
        { emergencyContactName: { contains: search } },
      ]
    }

    if (gender) {
      where.gender = gender
    }

    if (bloodType) {
      where.bloodType = bloodType
    }

    const [patients, total] = await Promise.all([
      db.patientProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              displayName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.patientProfile.count({ where }),
    ])

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

// POST /api/nurseai/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const body = await request.json()

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Generate a unique patient ID
    const patientCount = await db.patientProfile.count()
    const patientId = `PT/${new Date().getFullYear()}/${String(patientCount + 1).padStart(5, '0')}`

    // Create user account for the patient (optional)
    let userId: string | undefined
    if (body.email) {
      const tempPassword = await bcrypt.hash(`patient-${Date.now()}`, 10)

      const user = await db.user.create({
        data: {
          email: body.email.toLowerCase(),
          passwordHash: tempPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName || null,
          displayName: `${body.firstName} ${body.lastName}`,
          phone: body.phone || null,
          countryCode: body.countryCode || 'NG',
          role: 'PATIENT',
          status: 'ACTIVE',
        },
      })
      userId = user.id
    }

    // Create patient profile
    const patient = await db.patientProfile.create({
      data: {
        userId: userId || null,
        patientId,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender || null,
        bloodType: body.bloodType || null,
        genotype: body.genotype || null,
        allergies: JSON.stringify(body.allergies || []),
        emergencyContactName: body.emergencyContactName || null,
        emergencyContactPhone: body.emergencyContactPhone || null,
        emergencyContactRelation: body.emergencyContactRelation || null,
        nationality: body.nationality || 'Nigerian',
        stateOfOrigin: body.stateOfOrigin || null,
        lga: body.lga || null,
        religion: body.religion || null,
        occupation: body.occupation || null,
        insuranceProvider: body.insuranceProvider || null,
        insuranceNumber: body.insuranceNumber || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Patient created successfully', patient },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating patient:', error)

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A patient with this information already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
