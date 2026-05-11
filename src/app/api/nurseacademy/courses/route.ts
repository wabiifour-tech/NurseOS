import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/courses - List courses with enhanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const isFreeParam = searchParams.get('isFree')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const limit = parseInt(searchParams.get('limit') || '24')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const categoriesOnly = searchParams.get('categories') === 'true'

    const where: Record<string, unknown> = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = category
    if (level) where.level = level
    if (isFreeParam === 'true') where.isFree = true
    else if (isFreeParam === 'false') where.isFree = false

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (sortBy) {
      case 'popular':
        orderBy = { enrollmentCount: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'cpd':
        orderBy = { cpdPoints: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // If only categories are requested, return just category data
    if (categoriesOnly) {
      const categoryResults = await db.course.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      })

      const categories = categoryResults.map((r) => ({
        name: r.category,
        count: r._count.category,
      }))

      return NextResponse.json({ categories })
    }

    // Fetch courses, total count, and category metadata in parallel
    const [courses, total, categoryResults, statsResults] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          _count: { select: { courseModules: true, enrollments: true } },
        },
        skip,
        take: limit,
        orderBy,
      }),
      db.course.count({ where }),
      // Get all categories with counts (for filter chips)
      db.course.groupBy({
        by: ['category'],
        where: { isPublished: true },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      // Get aggregate stats for the banner
      Promise.all([
        db.course.count({ where: { isPublished: true } }),
        db.course.count({ where: { isPublished: true, isFree: true } }),
        db.course.aggregate({
          where: { isPublished: true },
          _sum: { cpdPoints: true },
        }),
      ]),
    ])

    const categories = categoryResults.map((r) => ({
      name: r.category,
      count: r._count.category,
    }))

    const [totalCourses, totalFreeCourses, cpdAggregate] = statsResults

    return NextResponse.json({
      courses,
      categories,
      stats: {
        totalCourses,
        totalFreeCourses,
        totalCpdPoints: cpdAggregate._sum.cpdPoints || 0,
        totalCategories: categoryResults.length,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
