/**
 * GET /api/email/stats
 * Get email sending statistics. Only SUPER_ADMIN.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getEmailStats } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    if (authUser.role !== 'SUPER_ADMIN') {
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
}
