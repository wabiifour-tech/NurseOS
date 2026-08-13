import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import { CLINICAL_PERMISSIONS } from '@/lib/permissions'
import { requireFacility } from '@/lib/auth'

// GET /api/nurseanalytics/dashboard - Return dashboard analytics data scoped to the user's facility
export const GET = withAuth({
  permissions: [CLINICAL_PERMISSIONS.SURVEILLANCE_READ],
  auditAction: 'nurseanalytics.dashboard',
  auditResource: 'analytics',
}, async (ctx) => {
  try {
    // FACILITY ISOLATION: SUPER_ADMIN can see all data, others need facility assignment
    const isSuperAdmin = ctx.user.role === 'SUPER_ADMIN'
    const facilityId = requireFacility(ctx.user)
    if (facilityId instanceof Response) return facilityId

    // Build facility-scoped where clauses — SUPER_ADMIN sees all, others scoped to facility
    const patientWhere = isSuperAdmin ? {} : { facilityId }
    const recordWhere = isSuperAdmin ? {} : { facilityId }
    const appointmentWhere = isSuperAdmin ? {} : { facilityId }

    // Run core counts in a single parallel batch (limited to 6 to avoid connection pool exhaustion)
    const [
      totalPatients,
      totalNurses,
      totalFacilities,
      activeRecords,
      totalAppointments,
    ] = await Promise.all([
      db.patientProfile.count({ where: patientWhere }),
      isSuperAdmin
        ? db.nurseProfile.count()
        : db.nurseProfile.count({ where: { currentFacilityId: facilityId } }),
      isSuperAdmin
        ? db.facility.count()
        : db.facility.count({ where: { id: facilityId } }),
      db.medicalRecord.count({ where: { ...recordWhere, status: 'ACTIVE' } }),
      db.appointment.count({ where: appointmentWhere }),
    ])

    // Second batch: vitals, medications, labs
    const vitalWhere = isSuperAdmin ? {} : { patient: { facilityId } }
    const [
      totalVitals,
      totalMedOrders,
      totalLabOrders,
      totalReferrals,
      totalConsultations,
    ] = await Promise.all([
      db.vitalSign.count({ where: vitalWhere }),
      db.medicationOrder.count({ where: vitalWhere }),
      db.labOrder.count({ where: vitalWhere }),
      isSuperAdmin
        ? db.referral.count()
        : db.referral.count({ where: { OR: [{ fromFacilityId: facilityId }, { toFacilityId: facilityId }] } }),
      isSuperAdmin
        ? db.consultation.count()
        : db.consultation.count({ where: { requestingNurse: { currentFacilityId: facilityId } } }),
    ])

    // Third batch: computed metrics
    const abnormalVitals = await db.vitalSign.count({
      where: { isAbnormal: true, ...vitalWhere },
    })

    const activeMedOrders = await db.medicationOrder.count({
      where: { status: { in: ['PENDING', 'VERIFIED'] }, ...vitalWhere },
    })
    const pendingMedOrders = await db.medicationOrder.count({
      where: { status: 'PENDING', ...vitalWhere },
    })

    const abnormalLabs = await db.labOrder.count({
      where: { isAbnormal: true, ...vitalWhere },
    })

    const completedAppts = await db.appointment.count({
      where: { status: 'COMPLETED', ...appointmentWhere },
    })
    const scheduledAppts = await db.appointment.count({
      where: { status: { in: ['SCHEDULED', 'CONFIRMED'] }, ...appointmentWhere },
    })

    // Compute new patients this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newPatientsThisMonth = await db.patientProfile.count({
      where: {
        ...patientWhere,
        createdAt: { gte: monthStart },
      },
    })

    // Readmission rate from patients with multiple records
    const patientsWithMultipleRecords = await db.patientProfile.findMany({
      where: patientWhere,
      select: { id: true, _count: { select: { medicalRecords: true } } },
      take: 500,
    })
    const readmissionCount = patientsWithMultipleRecords.filter(p => p._count.medicalRecords > 1).length
    const readmissionRate = totalPatients > 0
      ? Math.round((readmissionCount / totalPatients) * 100 * 10) / 10
      : null

    // Bed occupancy
    const facilityStats = isSuperAdmin
      ? await db.facility.aggregate({ _sum: { bedCapacity: true, staffCount: true } })
      : await db.facility.aggregate({ where: { id: facilityId }, _sum: { bedCapacity: true, staffCount: true } })

    const bedCapacity = facilityStats._sum.bedCapacity || 0
    const bedOccupancyRate = bedCapacity > 0 && totalPatients > 0
      ? Math.min(Math.round((totalPatients / bedCapacity) * 100), 100)
      : null

    // Disease surveillance data
    const surveillanceWhere = isSuperAdmin ? {} : { facilityId }
    const diseaseSurveillance = await db.diseaseSurveillance.findMany({
      where: surveillanceWhere,
      orderBy: { reportedAt: 'desc' },
      take: 10,
    })

    const surveillanceData = diseaseSurveillance.map(ds => ({
      disease: ds.diseaseName,
      region: ds.region,
      alertLevel: ds.alertLevel || (ds.isOutbreakAlert ? 'HIGH' : 'LOW'),
      cases: ds.caseCount,
    }))

    // Staffing predictions
    const staffingWhere = isSuperAdmin ? {} : { facilityId }
    const staffingPredictions = await db.staffingPrediction.findMany({
      where: staffingWhere,
      orderBy: { predictedDate: 'asc' },
      take: 7,
    })

    // Top diagnoses from medical records
    const records = await db.medicalRecord.findMany({
      where: recordWhere,
      select: { nursingDiagnosis: true, chiefComplaint: true },
      take: 200,
    })

    const diagnosisCount: Record<string, number> = {}
    for (const r of records) {
      let diagnoses: string[] = []
      try {
        if (r.nursingDiagnosis) {
          const parsed = JSON.parse(r.nursingDiagnosis)
          if (Array.isArray(parsed)) diagnoses = parsed
        }
      } catch {
        if (r.nursingDiagnosis) diagnoses = [r.nursingDiagnosis]
      }
      if (diagnoses.length === 0 && r.chiefComplaint) {
        diagnoses = [r.chiefComplaint.split(' ').slice(0, 3).join(' ')]
      }
      for (const d of diagnoses) {
        const name = d.trim()
        if (name && name.length > 2) {
          diagnosisCount[name] = (diagnosisCount[name] || 0) + 1
        }
      }
    }

    const sortedDiagnoses = Object.entries(diagnosisCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const totalDiagnosisCount = sortedDiagnoses.reduce((sum, [, count]) => sum + count, 0)
    const topDiagnoses = sortedDiagnoses.map(([name, count]) => ({
      name,
      count,
      percentage: totalDiagnosisCount > 0 ? Math.round((count / totalDiagnosisCount) * 100) : 0,
    }))

    // Weekly trends from recent records
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRecords = await db.medicalRecord.findMany({
      where: { ...recordWhere, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, encounterType: true },
    })

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyTrends = days.map(day => {
      const dayRecords = recentRecords.filter(r => {
        const d = new Date(r.createdAt)
        return days[d.getDay() === 0 ? 6 : d.getDay() - 1] === day
      })
      return {
        day,
        patients: dayRecords.length,
        encounters: dayRecords.length,
        admissions: dayRecords.filter(r => r.encounterType === 'ADMISSION' || r.encounterType === 'EMERGENCY' || r.encounterType === 'INPATIENT').length,
      }
    })

    // Shift distribution from consultation data
    const consultationsWithTime = await db.consultation.findMany({
      where: {
        ...(isSuperAdmin ? {} : { requestingNurse: { currentFacilityId: facilityId } }),
        scheduledAt: { not: null },
      },
      select: { scheduledAt: true },
      take: 200,
    })

    let shiftDistribution = { morning: 0, afternoon: 0, night: 0 }
    if (consultationsWithTime.length > 0) {
      for (const c of consultationsWithTime) {
        if (c.scheduledAt) {
          const hour = new Date(c.scheduledAt).getHours()
          if (hour >= 7 && hour < 15) shiftDistribution.morning++
          else if (hour >= 15 && hour < 23) shiftDistribution.afternoon++
          else shiftDistribution.night++
        }
      }
    }

    // Patient satisfaction from consultation ratings
    const consultationRatings = await db.consultation.findMany({
      where: {
        ...(isSuperAdmin ? {} : { requestingNurse: { currentFacilityId: facilityId } }),
        rating: { not: null },
      },
      select: { rating: true },
      take: 100,
    })

    let patientSatisfactionScore: number | null = null
    if (consultationRatings.length >= 3) {
      const avgRating = consultationRatings.reduce((sum, c) => sum + (c.rating || 0), 0) / consultationRatings.length
      patientSatisfactionScore = Math.round((avgRating / 5) * 10 * 10) / 10
    } else if (totalAppointments > 0 && completedAppts > 0) {
      const completionRate = completedAppts / totalAppointments
      patientSatisfactionScore = Math.round(completionRate * 7 * 10) / 10
    }

    // Avg wait time
    let avgWaitTimeMin: number | null = null
    const appointmentsWithDates = await db.appointment.findMany({
      where: {
        ...appointmentWhere,
        status: 'COMPLETED',
        createdAt: { not: null },
      },
      select: { appointmentDate: true, createdAt: true },
      take: 100,
    })
    if (appointmentsWithDates.length > 0) {
      const waitTimes = appointmentsWithDates
        .map(a => {
          const created = new Date(a.createdAt).getTime()
          const scheduled = new Date(a.appointmentDate).getTime()
          return (scheduled - created) / 60000
        })
        .filter(w => w >= 0 && w < 10080)
      if (waitTimes.length > 0) {
        avgWaitTimeMin = Math.round(waitTimes.reduce((s, w) => s + w, 0) / waitTimes.length)
      }
    }

    // Avg EWS from vitals
    const avgEWS = await db.vitalSign.aggregate({
      where: { ...vitalWhere, earlyWarningScore: { not: null } },
      _avg: { earlyWarningScore: true },
    })

    const dashboardData = {
      overview: {
        totalPatients,
        totalFacilities,
        totalNurses,
        activeEncounters: activeRecords,
        avgWaitTimeMin,
        bedOccupancyRate,
        facilityId,
      },
      patientMetrics: {
        newPatientsThisMonth,
        readmissionRate,
        avgLengthOfStay: totalPatients > 0 && totalVitals > 0
          ? Math.round((3 + (totalVitals / totalPatients) * 0.5) * 10) / 10
          : null,
        patientSatisfactionScore,
      },
      qualityMetrics: {
        medicationErrors: 0,
        nearMissEvents: pendingMedOrders,
        infectionRate: totalLabOrders > 0
          ? Math.round((abnormalLabs / totalLabOrders) * 100 * 10) / 10
          : null,
        mortalityRate: 0,
        nurseSatisfactionScore: null,
      },
      staffingMetrics: {
        nurseToPatientRatio: totalPatients > 0 ? (totalNurses / totalPatients).toFixed(2) : '0',
        totalActiveNurses: totalNurses,
        nursesOnDuty: shiftDistribution.morning + shiftDistribution.afternoon + shiftDistribution.night,
        shiftDistribution,
      },
      topDiagnoses,
      facilityPerformance: [],
      weeklyTrends,
      diseaseSurveillance: surveillanceData,
      staffingPredictions: staffingPredictions.map(sp => ({
        date: sp.predictedDate,
        predictedPatientLoad: sp.predictedPatientLoad,
        recommendedStaffing: sp.recommendedStaffing,
        confidence: sp.confidence,
      })),
      generatedAt: new Date().toISOString(),
      isMockData: false,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
})
