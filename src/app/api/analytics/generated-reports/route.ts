import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility } from '@/lib/auth'

// GET /api/analytics/generated-reports — List generated reports for the current user
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId') || ''

    const where: Record<string, unknown> = { userId: authUser.id }
    if (templateId) where.templateId = templateId

    const reports = await db.generatedReport.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        templateId: true,
        title: true,
        reportType: true,
        period: true,
        fileSize: true,
        generatedAt: true,
        createdAt: true,
      },
    })

    // Also get the lastGenerated timestamp per template
    const lastGeneratedPerTemplate = await db.generatedReport.groupBy({
      by: ['templateId'],
      where: { userId: authUser.id },
      _max: { generatedAt: true },
    })

    const lastGeneratedMap: Record<string, string> = {}
    for (const item of lastGeneratedPerTemplate) {
      if (item.templateId && item._max.generatedAt) {
        lastGeneratedMap[item.templateId] = item._max.generatedAt.toISOString()
      }
    }

    return NextResponse.json({ reports, lastGeneratedMap })
  } catch (error) {
    console.error('Error fetching generated reports:', error)
    return NextResponse.json({ error: 'Failed to fetch generated reports' }, { status: 500 })
  }
}

// POST /api/analytics/generated-reports — Save a generated report
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const facilityId = requireFacility(authUser)
    if (facilityId instanceof Response) return facilityId

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { templateId, title, reportType, period, contentBlob, fileSize } = body as {
      templateId: string
      title: string
      reportType: string
      period: string
      contentBlob?: string
      fileSize?: number
    }

    if (!templateId || !title || !reportType) {
      return NextResponse.json(
        { error: 'templateId, title, and reportType are required' },
        { status: 400 }
      )
    }

    const report = await db.generatedReport.create({
      data: {
        userId: authUser.id,
        facilityId,
        templateId,
        title,
        reportType,
        period: period || 'this-month',
        contentBlob: contentBlob || null,
        fileSize: fileSize || null,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error('Error saving generated report:', error)
    return NextResponse.json({ error: 'Failed to save generated report' }, { status: 500 })
  }
}

// DELETE /api/analytics/generated-reports — Delete a generated report
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

    const { reportId } = body as { reportId: string }
    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    await db.generatedReport.deleteMany({
      where: { id: reportId, userId: authUser.id },
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting generated report:', error)
    return NextResponse.json({ error: 'Failed to delete generated report' }, { status: 500 })
  }
}
