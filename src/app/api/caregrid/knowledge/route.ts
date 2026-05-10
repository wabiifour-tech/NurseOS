import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/knowledge - List knowledge articles
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isPublished: true }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ]
    }
    if (category) where.category = category

    const [articles, total] = await Promise.all([
      db.knowledgeArticle.findMany({
        where,
        include: {
          author: {
            select: { id: true, user: { select: { firstName: true, lastName: true } } },
          },
          _count: { select: { comments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.knowledgeArticle.count({ where }),
    ])

    return NextResponse.json({
      articles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching knowledge articles:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge articles' }, { status: 500 })
  }
}

// POST /api/caregrid/knowledge - Create a knowledge article
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const body = await request.json()

    if (!body.title || !body.category || !body.content) {
      return NextResponse.json(
        { error: 'Title, category, and content are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const article = await db.knowledgeArticle.create({
      data: {
        authorId: authUser.id,
        title: body.title,
        slug,
        category: body.category,
        content: body.content,
        summary: body.summary || null,
        tags: JSON.stringify(body.tags || []),
        references: JSON.stringify(body.references || []),
        readingTime: body.readingTime || null,
        evidenceLevel: body.evidenceLevel || null,
        isPublished: body.isPublished || false,
        isFeatured: body.isFeatured || false,
        language: body.language || 'en',
      },
    })

    return NextResponse.json(
      { message: 'Article created successfully', article },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating knowledge article:', error)
    return NextResponse.json({ error: 'Failed to create knowledge article' }, { status: 500 })
  }
}
