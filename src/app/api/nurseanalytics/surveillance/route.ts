import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, facilityWhereClause } from '@/lib/middleware'
import { CLINICAL_PERMISSIONS } from '@/lib/permissions'
import { createNotification, notifyFacilityUsers } from '@/lib/notify'

// GET /api/nurseanalytics/surveillance - List disease surveillance data
export const GET = withAuth({
  permissions: [CLINICAL_PERMISSIONS.SURVEILLANCE_READ],
  policies: ['facility_required'],
  auditAction: 'surveillance.list',
  auditResource: 'surveillance',
}, async (ctx) => {
  const { searchParams } = new URL(ctx.request.url)
  const region = searchParams.get('region') || ''

  const where: Record<string, unknown> = {
    ...facilityWhereClause(ctx),
  }
  if (region) where.region = region

  const surveillanceData = await db.diseaseSurveillance.findMany({
    where,
    include: {
      facility: {
        select: { id: true, name: true, city: true, state: true },
      },
    },
    orderBy: { reportedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ data: surveillanceData })
})

// POST /api/nurseanalytics/surveillance - Report a new disease case
// BUG FIX: No longer accepts client-supplied facilityId.
// Facility is always resolved from the authenticated user's context.
export const POST = withAuth({
  permissions: [CLINICAL_PERMISSIONS.SURVEILLANCE_WRITE],
  policies: ['facility_required'],
  auditAction: 'surveillance.create',
  auditResource: 'surveillance',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  // SUPER_ADMIN must have a facility to report surveillance
  if (!ctx.facilityId) {
    return NextResponse.json(
      { error: 'Facility assignment is required to report disease data.' },
      { status: 400 },
    )
  }

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    region, diseaseName, caseCount, expectedRange,
    isOutbreakAlert, alertLevel, affectedGroups, geographicCluster,
  } = body

  if (!diseaseName || !region) {
    return NextResponse.json(
      { error: 'Disease name and region are required' },
      { status: 400 },
    )
  }

  // FIXED: Always use the authenticated user's facility, NEVER from client body.
  // Previous code accepted body.facilityId which allowed cross-facility data injection.
  const targetFacilityId = ctx.facilityId

  const record = await db.diseaseSurveillance.create({
    data: {
      facilityId: targetFacilityId,
      region,
      diseaseName,
      caseCount: caseCount || 1,
      expectedRange: expectedRange || '0-5',
      isOutbreakAlert: isOutbreakAlert || false,
      alertLevel: alertLevel || (isOutbreakAlert ? 'Alert' : 'Watch'),
      affectedGroups: JSON.stringify(affectedGroups || []),
      geographicCluster: geographicCluster || null,
    },
  })

  if (record.isOutbreakAlert) {
    const notifiedCount = await notifyFacilityUsers(targetFacilityId, {
      type: 'OUTBREAK',
      title: `Disease Outbreak Alert: ${record.diseaseName}`,
      message: `${record.caseCount} cases of ${record.diseaseName} reported in ${record.region}. Alert level: ${record.alertLevel}.`,
      data: JSON.stringify({
        surveillanceId: record.id, diseaseName: record.diseaseName,
        region: record.region, alertLevel: record.alertLevel,
        action: 'OUTBREAK_ALERT',
      }),
      force: true,
    })
    console.log(`[Surveillance] Outbreak alert sent to ${notifiedCount} users for ${record.diseaseName}`)
  }

  return NextResponse.json({ data: record }, { status: 201 })
})
