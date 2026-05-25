import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/analytics/report-schedules — Load report schedules from server
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const schedules = await db.reportSchedule.findMany({
      where: { userId: authUser.id },
      select: {
        id: true,
        templateId: true,
        enabled: true,
        frequency: true,
        recipients: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Error fetching report schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch report schedules' }, { status: 500 })
  }
}

// POST /api/analytics/report-schedules — Create or update a report schedule
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { templateId, enabled, frequency, recipients } = body as {
      templateId: string
      enabled?: boolean
      frequency?: string
      recipients?: string
    }

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const schedule = await db.reportSchedule.upsert({
      where: {
        userId_templateId: { userId: authUser.id, templateId },
      },
      create: {
        userId: authUser.id,
        templateId,
        enabled: enabled ?? true,
        frequency: frequency ?? 'Monthly',
        recipients: recipients ?? null,
      },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(frequency !== undefined && { frequency }),
        ...(recipients !== undefined && { recipients }),
      },
    })

    return NextResponse.json({ message: 'Report schedule saved successfully', schedule })
  } catch (error) {
    console.error('Error saving report schedule:', error)
    return NextResponse.json({ error: 'Failed to save report schedule' }, { status: 500 })
  }
}

// DELETE /api/analytics/report-schedules — Delete a report schedule
export async function DELETE(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { templateId } = body as { templateId: string }
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    await db.reportSchedule.deleteMany({
      where: {
        userId: authUser.id,
        templateId,
      },
    })

    return NextResponse.json({ message: 'Report schedule deleted successfully' })
  } catch (error) {
    console.error('Error deleting report schedule:', error)
    return NextResponse.json({ error: 'Failed to delete report schedule' }, { status: 500 })
  }
}
