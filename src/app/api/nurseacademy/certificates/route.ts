import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/certificates - List certificates
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const certificates = await db.enrollment.findMany({
      where: {
        nurseId: authUser.id,
        certificateIssued: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
  }
}
