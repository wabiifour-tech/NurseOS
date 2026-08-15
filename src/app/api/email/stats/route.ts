/**
 * GET /api/email/stats
 * Get email sending statistics. Only SUPER_ADMIN.
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/compose'
import { getEmailStats } from '@/lib/email'

export const GET = withAuth({}, async ({ user: ctx }) => {
  try {
    if (ctx.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const stats = await getEmailStats()

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Email stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email stats' },
      { status: 500 }
    )
  }
})
