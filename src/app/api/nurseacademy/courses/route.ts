import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/nurseacademy/courses - List courses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const isPublished = searchParams.get('isPublished') || ''
    const isFree = searchParams.get('isFree') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (level) {
      where.level = level
    }

    if (isPublished === 'true') {
      where.isPublished = true
    } else if (isPublished === 'false') {
      where.isPublished = false
    }

    if (isFree === 'true') {
      where.isFree = true
    } else if (isFree === 'false') {
      where.isFree = false
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              enrollments: true,
              simulations: true,
              courseModules: true,
            },
          },
        },
      }),
      db.course.count({ where }),
    ])

    // Get available categories for filtering
    const categories = await db.course.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })

    return NextResponse.json({
      courses,
      categories: categories.map((c) => c.category),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/nurseacademy/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.category || !body.level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, level' },
        { status: 400 }
      )
    }

    // Validate level
    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
    if (!validLevels.includes(body.level)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    // Check slug uniqueness
    const existingSlug = await db.course.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A course with a similar title already exists' },
        { status: 409 }
      )
    }

    const course = await db.course.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        category: body.category,
        level: body.level,
        instructorIds: JSON.stringify(body.instructorIds || []),
        modules: body.modules ? JSON.stringify(body.modules) : null,
        durationMinutes: body.durationMinutes || null,
        cpdPoints: body.cpdPoints || null,
        language: body.language || 'en',
        tags: JSON.stringify(body.tags || []),
        thumbnailUrl: body.thumbnailUrl || null,
        isPublished: body.isPublished || false,
        isFree: body.isFree !== undefined ? body.isFree : true,
        price: body.price || null,
      },
    })

    return NextResponse.json(
      { message: 'Course created successfully', course },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating course:', error)

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
