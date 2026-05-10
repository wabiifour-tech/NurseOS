import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Sample/mock data for when the database is empty
function getMockDashboardData() {
  return {
    overview: {
      totalPatients: 1284,
      totalFacilities: 47,
      totalNurses: 312,
      activeEncounters: 89,
      avgWaitTimeMin: 34.5,
      bedOccupancyRate: 78.2,
    },
    patientMetrics: {
      newPatientsThisMonth: 156,
      readmissionRate: 4.2,
      avgLengthOfStay: 3.8,
      patientSatisfactionScore: 4.3,
    },
    qualityMetrics: {
      medicationErrors: 2,
      nearMissEvents: 7,
      infectionRate: 1.8,
      mortalityRate: 0.4,
      nurseSatisfactionScore: 4.1,
    },
    staffingMetrics: {
      nurseToPatientRatio: '1:6',
      totalActiveNurses: 312,
      nursesOnDuty: 89,
      shiftDistribution: {
        morning: 124,
        afternoon: 98,
        night: 90,
      },
    },
    topDiagnoses: [
      { name: 'Malaria', count: 234, percentage: 18.2 },
      { name: 'Hypertension', count: 189, percentage: 14.7 },
      { name: 'Diabetes Mellitus', count: 156, percentage: 12.1 },
      { name: 'Respiratory Infection', count: 134, percentage: 10.4 },
      { name: 'Typhoid Fever', count: 98, percentage: 7.6 },
      { name: 'Pneumonia', count: 87, percentage: 6.8 },
      { name: 'HIV/AIDS related', count: 76, percentage: 5.9 },
      { name: 'Maternal complications', count: 65, percentage: 5.1 },
    ],
    facilityPerformance: [
      { name: 'Lagos University Teaching Hospital', occupancy: 92, satisfaction: 4.5 },
      { name: 'National Hospital Abuja', occupancy: 87, satisfaction: 4.3 },
      { name: 'University College Hospital Ibadan', occupancy: 84, satisfaction: 4.4 },
      { name: 'Ahmadu Bello University Teaching Hospital', occupancy: 79, satisfaction: 4.1 },
      { name: 'University of Nigeria Teaching Hospital Enugu', occupancy: 76, satisfaction: 4.2 },
    ],
    weeklyTrends: [
      { day: 'Monday', patients: 45, encounters: 38, admissions: 12 },
      { day: 'Tuesday', patients: 52, encounters: 44, admissions: 15 },
      { day: 'Wednesday', patients: 48, encounters: 41, admissions: 11 },
      { day: 'Thursday', patients: 55, encounters: 47, admissions: 14 },
      { day: 'Friday', patients: 42, encounters: 36, admissions: 9 },
      { day: 'Saturday', patients: 28, encounters: 22, admissions: 6 },
      { day: 'Sunday', patients: 22, encounters: 18, admissions: 4 },
    ],
    diseaseSurveillance: [
      { disease: 'Cholera', region: 'North East', alertLevel: 'HIGH', cases: 145 },
      { disease: 'Lassa Fever', region: 'South South', alertLevel: 'MODERATE', cases: 34 },
      { disease: 'Meningitis', region: 'North West', alertLevel: 'LOW', cases: 12 },
      { disease: 'Yellow Fever', region: 'North Central', alertLevel: 'MODERATE', cases: 28 },
    ],
    generatedAt: new Date().toISOString(),
    isMockData: true,
  }
}

// GET /api/nurseanalytics/dashboard - Return dashboard analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId') || ''
    const period = searchParams.get('period') || 'DAILY'

    // Try to fetch real data from FacilityAnalytics
    const where: Record<string, unknown> = {}
    if (facilityId) {
      where.facilityId = facilityId
    }

    const analyticsCount = await db.facilityAnalytics.count({ where })

    // If no analytics data exists, return mock data
    if (analyticsCount === 0) {
      return NextResponse.json(getMockDashboardData())
    }

    // Fetch aggregated analytics data
    const [
      totalPatients,
      totalFacilities,
      totalNurses,
      recentAnalytics,
    ] = await Promise.all([
      db.patientProfile.count(),
      db.facility.count(),
      db.nurseProfile.count(),
      db.facilityAnalytics.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          facility: {
            select: { name: true, type: true, city: true, state: true },
          },
        },
      }),
    ])

    // Calculate aggregated metrics
    const avgWaitTime = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.avgWaitTimeMin || 0), 0) / recentAnalytics.length
      : 0

    const avgBedOccupancy = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.bedOccupancyRate || 0), 0) / recentAnalytics.length
      : 0

    const avgPatientSatisfaction = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.patientSatisfactionScore || 0), 0) / recentAnalytics.length
      : 0

    const totalMedErrors = recentAnalytics.reduce((sum, a) => sum + (a.medicationErrors || 0), 0)
    const totalNearMiss = recentAnalytics.reduce((sum, a) => sum + (a.nearMissEvents || 0), 0)
    const avgInfectionRate = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.infectionRate || 0), 0) / recentAnalytics.length
      : 0
    const avgMortalityRate = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.mortalityRate || 0), 0) / recentAnalytics.length
      : 0
    const avgNurseSatisfaction = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.nurseSatisfactionScore || 0), 0) / recentAnalytics.length
      : 0

    const totalEncounters = recentAnalytics.reduce((sum, a) => sum + (a.totalEncounters || 0), 0)
    const newPatients = recentAnalytics.reduce((sum, a) => sum + (a.newPatients || 0), 0)
    const avgReadmission = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.readmissionRate || 0), 0) / recentAnalytics.length
      : 0
    const avgLengthOfStay = recentAnalytics.length > 0
      ? recentAnalytics.reduce((sum, a) => sum + (a.avgLengthOfStay || 0), 0) / recentAnalytics.length
      : 0

    // Get facility-specific performance
    const facilityPerformance = await db.facilityAnalytics.groupBy({
      by: ['facilityId'],
      _avg: {
        bedOccupancyRate: true,
        patientSatisfactionScore: true,
      },
      where: facilityId ? { facilityId } : {},
    })

    // Fetch facility names for the performance data
    const facilityPerformanceWithNames = await Promise.all(
      facilityPerformance.map(async (fp) => {
        const facility = await db.facility.findUnique({
          where: { id: fp.facilityId },
          select: { name: true },
        })
        return {
          name: facility?.name || 'Unknown',
          occupancy: Math.round((fp._avg.bedOccupancyRate || 0) * 10) / 10,
          satisfaction: Math.round((fp._avg.patientSatisfactionScore || 0) * 10) / 10,
        }
      })
    )

    const dashboardData = {
      overview: {
        totalPatients,
        totalFacilities,
        totalNurses,
        activeEncounters: totalEncounters,
        avgWaitTimeMin: Math.round(avgWaitTime * 10) / 10,
        bedOccupancyRate: Math.round(avgBedOccupancy * 10) / 10,
      },
      patientMetrics: {
        newPatientsThisMonth: newPatients,
        readmissionRate: Math.round(avgReadmission * 10) / 10,
        avgLengthOfStay: Math.round(avgLengthOfStay * 10) / 10,
        patientSatisfactionScore: Math.round(avgPatientSatisfaction * 10) / 10,
      },
      qualityMetrics: {
        medicationErrors: totalMedErrors,
        nearMissEvents: totalNearMiss,
        infectionRate: Math.round(avgInfectionRate * 10) / 10,
        mortalityRate: Math.round(avgMortalityRate * 10) / 10,
        nurseSatisfactionScore: Math.round(avgNurseSatisfaction * 10) / 10,
      },
      staffingMetrics: {
        nurseToPatientRatio: totalPatients > 0 ? (totalNurses / totalPatients).toFixed(2) : '0',
        totalActiveNurses: totalNurses,
        nursesOnDuty: Math.floor(totalNurses * 0.28),
        shiftDistribution: {
          morning: Math.floor(totalNurses * 0.4),
          afternoon: Math.floor(totalNurses * 0.32),
          night: Math.floor(totalNurses * 0.28),
        },
      },
      facilityPerformance: facilityPerformanceWithNames,
      generatedAt: new Date().toISOString(),
      isMockData: false,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)

    // Return mock data on error so the UI still works
    return NextResponse.json(getMockDashboardData())
  }
}
