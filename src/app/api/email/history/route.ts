/**
 * GET /api/email/history
 * Get email sending history. SUPER_ADMIN sees all, ADMIN sees facility emails.
 *
 * Query params:
 *   page: number (default 1)
 *   limit: number (default 50)
 *   status?: 'SENT' | 'FAILED' | 'PENDING' | 'DELIVERED' | 'BOUNCED'
 *   templateId?: string
 *   search?: string (search by subject, recipient email)
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/compose'
import { db } from '@/lib/db'

export const GET = withAuth({}, async ({ user: ctx, request }) => {
  try {
    // Only admins can view email history
    if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const templateId = searchParams.get('templateId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    let where: any = {}

    // Non-SUPER_ADMIN admins can only see emails they sent
    if (ctx.role !== 'SUPER_ADMIN') {
      where.senderId = ctx.id
    }

    if (status) where.status = status
    if (templateId) where.templateId = templateId
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { toEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [emails, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          recipient: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.emailLog.count({ where }),
    ])

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Email history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email history' },
      { status: 500 }
    )
  }
})
