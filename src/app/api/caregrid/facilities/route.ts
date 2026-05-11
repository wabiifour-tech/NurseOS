import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/facilities - List facilities with search/filter
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const state = searchParams.get('state') || ''
    const city = searchParams.get('city') || ''
    const isVerified = searchParams.get('isVerified') || ''
    const isEmergencyCapable = searchParams.get('isEmergencyCapable') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
        { email: { contains: search } },
        { registrationNumber: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (state) {
      where.state = state
    }

    if (city) {
      where.city = city
    }

    if (isVerified === 'true') {
      where.isVerified = true
    } else if (isVerified === 'false') {
      where.isVerified = false
    }

    if (isEmergencyCapable === 'true') {
      where.isEmergencyCapable = true
    } else if (isEmergencyCapable === 'false') {
      where.isEmergencyCapable = false
    }

    const [facilities, total] = await Promise.all([
      db.facility.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              staff: true,
              departments: true,
              analytics: true,
            },
          },
        },
      }),
      db.facility.count({ where }),
    ])

    return NextResponse.json({
      facilities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}

// POST /api/caregrid/facilities - Add a new facility (admin only)
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 Only admins can create facilities
  if (authUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Only facility administrators can create new facilities.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type || !body.address || !body.city || !body.state) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, address, city, state' },
        { status: 400 }
      )
    }

    // Validate facility type
    const validTypes = ['HOSPITAL', 'CLINIC', 'PRIMARY_HEALTH_CENTER', 'SPECIALIST_CENTER', 'MATERNITY_HOME', 'REHABILITATION_CENTER', 'DIAGNOSTIC_CENTER', 'PHARMACY', 'COMMUNITY_HEALTH_CENTER']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid facility type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const facility = await db.facility.create({
      data: {
        name: body.name,
        type: body.type,
        level: body.level || null,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country || 'Nigeria',
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        bedCapacity: body.bedCapacity ? parseInt(body.bedCapacity) : null,
        staffCount: body.staffCount ? parseInt(body.staffCount) : null,
        registrationNumber: body.registrationNumber || null,
        accreditingBody: body.accreditingBody || null,
        accreditationStatus: body.accreditationStatus || 'PENDING',
        isVerified: Boolean(body.isVerified),
        isEmergencyCapable: Boolean(body.isEmergencyCapable),
        servicesOffered: JSON.stringify(body.servicesOffered || []),
        operatingHours: body.operatingHours || null,
      },
    })

    return NextResponse.json(
      { message: 'Facility created successfully', facility },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating facility:', error)

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A facility with this registration number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    )
  }
}
