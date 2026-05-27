import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { createNotification, notifyFacilityUsers } from '@/lib/notify'

// GET /api/nurseanalytics/surveillance - List disease surveillance data
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId') || authUser.facilityId || ''
    const region = searchParams.get('region') || ''

    const where: Record<string, unknown> = {}
    if (facilityId) where.facilityId = facilityId
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
  } catch (error) {
    console.error('Error fetching surveillance data:', error)
    return NextResponse.json({ error: 'Failed to fetch surveillance data' }, { status: 500 })
  }
}

// POST /api/nurseanalytics/surveillance - Report a new disease case / outbreak
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

    const {
      facilityId,
      region,
      diseaseName,
      caseCount,
      expectedRange,
      isOutbreakAlert,
      alertLevel,
      affectedGroups,
      geographicCluster,
    } = body

    if (!diseaseName || !region) {
      return NextResponse.json({ error: 'Disease name and region are required' }, { status: 400 })
    }

    const targetFacilityId = facilityId || authUser.facilityId
    if (!targetFacilityId) {
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 })
    }

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

    // If this is an outbreak alert, notify facility users
    if (record.isOutbreakAlert) {
      const notifiedCount = await notifyFacilityUsers(targetFacilityId, {
        type: 'OUTBREAK',
        title: `Disease Outbreak Alert: ${record.diseaseName}`,
        message: `${record.caseCount} cases of ${record.diseaseName} reported in ${record.region}. Alert level: ${record.alertLevel}.`,
        data: JSON.stringify({
          surveillanceId: record.id,
          diseaseName: record.diseaseName,
          region: record.region,
          alertLevel: record.alertLevel,
          action: 'OUTBREAK_ALERT',
        }),
        force: true, // Outbreak alerts are critical — always deliver
      })

      console.log(`[Surveillance] Outbreak alert sent to ${notifiedCount} users for ${record.diseaseName}`)
    }

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Error creating surveillance record:', error)
    return NextResponse.json({ error: 'Failed to create surveillance record' }, { status: 500 })
  }
}
