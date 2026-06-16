/**
 * GET /api/course-materials/[id]/analytics
 *
 * Returns per-material analytics for the lecturer who uploaded the material
 * (or institution admin / super admin):
 *   - Total views, unique viewers, total downloads
 *   - Daily view trend (last 30 days)
 *   - Peak access hour
 *   - Per-student breakdown (first viewed, last viewed, view count, downloaded?)
 *
 * Auth: LECTURER (must be the uploader), ADMIN at same facility, SUPER_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    const { id } = await params

    const material = await db.courseMaterial.findUnique({
      where: { id },
      select: {
        id: true,
        facilityId: true,
        uploaderId: true,
        title: true,
        viewCount: true,
        downloadCount: true,
        level: true,
      },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Authorization — only the uploader lecturer, or institution admin at same facility, or super admin
    const isUploader = material.uploaderId === authUser.id
    const isSameFacilityAdmin =
      (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') &&
      material.facilityId === authUser.facilityId
    const isSuperAdmin = authUser.role === 'SUPER_ADMIN'

    if (!isUploader && !isSameFacilityAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only the uploader or institution admin can view analytics' },
        { status: 403 }
      )
    }

    // Fetch all view records for this material
    const views = await db.materialView.findMany({
      where: { materialId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentLevel: true,
          },
        },
      },
      orderBy: { lastViewedAt: 'desc' },
      take: 500,
    })

    // Fetch all download records
    const downloads = await db.materialDownload.findMany({
      where: { materialId: id, eventType: 'DOWNLOAD' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentLevel: true,
          },
        },
      },
    })

    // Build daily view trend (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentViews = views.filter((v) => v.lastViewedAt >= thirtyDaysAgo)
    const dailyMap = new Map<string, number>()
    for (const v of recentViews) {
      const dayKey = v.lastViewedAt.toISOString().slice(0, 10)  // YYYY-MM-DD
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + v.viewCount)
    }
    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Peak access hour — bucket all view events by hour-of-day
    const hourMap = new Array(24).fill(0)
    for (const v of views) {
      hourMap[v.lastViewedAt.getHours()] += v.viewCount
    }
    const peakHour = hourMap.indexOf(Math.max(...hourMap))

    // Per-student breakdown
    const downloaders = new Map(downloads.map((d) => [d.userId, d]))
    const studentBreakdown = views.map((v) => ({
      userId: v.userId,
      name: `${v.user.firstName} ${v.user.lastName}`,
      email: v.user.email,
      studentLevel: v.user.studentLevel,
      viewCount: v.viewCount,
      firstViewedAt: v.firstViewedAt,
      lastViewedAt: v.lastViewedAt,
      downloaded: downloaders.has(v.userId),
    }))

    // Also include students who downloaded but never explicitly viewed (rare but possible)
    for (const d of downloads) {
      if (!views.find((v) => v.userId === d.userId)) {
        studentBreakdown.push({
          userId: d.userId,
          name: `${d.user.firstName} ${d.user.lastName}`,
          email: d.user.email,
          studentLevel: d.user.studentLevel,
          viewCount: 0,
          firstViewedAt: d.createdAt,
          lastViewedAt: d.createdAt,
          downloaded: true,
        })
      }
    }

    // Drop-off metric: % of viewers who also downloaded
    const uniqueViewers = views.length
    const uniqueDownloaders = downloads.length
    const downloadRate = uniqueViewers > 0 ? (uniqueDownloaders / uniqueViewers) * 100 : 0

    return NextResponse.json({
      material: {
        id: material.id,
        title: material.title,
        level: material.level,
      },
      summary: {
        totalViews: material.viewCount,
        uniqueViewers,
        totalDownloads: material.downloadCount,
        uniqueDownloaders,
        downloadRate: Math.round(downloadRate * 10) / 10,  // 1 decimal place
      },
      dailyTrend,
      peakHour,  // 0-23
      studentBreakdown,
    })
  } catch (error: any) {
    console.error('Analytics GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}
