import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'

// GET /api/caregrid/knowledge/[articleId]/comments - List comments for an article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { articleId } = await params

    const comments = await db.articleComment.findMany({
      where: { articleId },
      include: {
        author: {
          select: {
            id: true,
            user: {
              select: { firstName: true, lastName: true, displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: {
        id: c.author.id,
        name: c.author.user.displayName || `${c.author.user.firstName} ${c.author.user.lastName}`.trim(),
      },
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/caregrid/knowledge/[articleId]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseId = await getNurseProfileId(authUser.id)
    if (!nurseId) {
      return NextResponse.json({ error: 'No nurse profile found' }, { status: 404 })
    }

    const { articleId } = await params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Verify article exists
    const article = await db.knowledgeArticle.findUnique({
      where: { id: articleId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const comment = await db.articleComment.create({
      data: {
        articleId,
        authorId: nurseId,
        content: body.content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            user: {
              select: { firstName: true, lastName: true, displayName: true },
            },
          },
        },
      },
    })

    // Update comment count on article
    await db.knowledgeArticle.update({
      where: { id: articleId },
      data: { commentCount: { increment: 1 } },
    })

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author.id,
          name: comment.author.user.displayName || `${comment.author.user.firstName} ${comment.author.user.lastName}`.trim(),
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
