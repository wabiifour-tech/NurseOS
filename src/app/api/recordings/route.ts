import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

/**
 * POST /api/recordings — Save recording metadata (no video file uploaded for privacy/HIPAA)
 * GET  /api/recordings — List user's past recording metadata
 */

// ─── POST ───

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if (!authResult) return unauthorizedResponse()

    const userId = authResult.id
    const body = await request.json()

    const { title, description, duration, fileSize, format } = body

    // Validate required fields
    if (!duration && duration !== 0) {
      return NextResponse.json(
        { error: 'Duration is required' },
        { status: 400 }
      )
    }

    // Create recording metadata record
    const recording = await db.recording.create({
      data: {
        userId,
        title: title || null,
        description: description || null,
        duration: duration ? Math.round(duration) : null,
        fileSize: fileSize ? Math.round(fileSize) : null,
        format: format || 'webm',
      },
    })

    return NextResponse.json({ recording }, { status: 201 })
  } catch (error) {
    console.error('[Recordings API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save recording metadata' },
      { status: 500 }
    )
  }
}

// ─── GET ───

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request)
    if (!authResult) return unauthorizedResponse()

    const userId = authResult.id
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const recordings = await db.recording.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        fileSize: true,
        format: true,
        createdAt: true,
      },
    })

    const total = await db.recording.count({
      where: { userId },
    })

    return NextResponse.json({
      recordings,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Recordings API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    )
  }
}
