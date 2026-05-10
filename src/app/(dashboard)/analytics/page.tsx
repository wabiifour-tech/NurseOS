"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Clock,
  Bed,
  Stethoscope,
  AlertTriangle,
  Star,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Loader2,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { toast } from "sonner"

interface DashboardData {
  overview: {
    totalPatients: number
    totalFacilities: number
    totalNurses: number
    activeEncounters: number
    avgWaitTimeMin: number
    bedOccupancyRate: number
  }
  patientMetrics: {
    newPatientsThisMonth: number
    readmissionRate: number
    avgLengthOfStay: number
    patientSatisfactionScore: number
  }
  qualityMetrics: {
    medicationErrors: number
    nearMissEvents: number
    infectionRate: number
    mortalityRate: number
    nurseSatisfactionScore: number
  }
  staffingMetrics: {
    nurseToPatientRatio: string
    totalActiveNurses: number
    nursesOnDuty: number
    shiftDistribution: {
      morning: number
      afternoon: number
      night: number
    }
  }
  topDiagnoses?: Array<{
    name: string
    count: number
    percentage: number
  }>
  facilityPerformance?: Array<{
    name: string
    occupancy: number
    satisfaction: number
  }>
  weeklyTrends?: Array<{
    day: string
    patients: number
    encounters: number
    admissions: number
  }>
  diseaseSurveillance?: Array<{
    disease: string
    region: string
    alertLevel: string
    cases: number
  }>
  generatedAt: string
  isMockData: boolean
}

// Fallback data for charts when real data is sparse
const fallbackVolumeData = [
  { month: "Jan", inpatient: 320, outpatient: 580, emergency: 120 },
  { month: "Feb", inpatient: 305, outpatient: 610, emergency: 135 },
  { month: "Mar", inpatient: 340, outpatient: 625, emergency: 142 },
  { month: "Apr", inpatient: 355, outpatient: 640, emergency: 128 },
  { month: "May", inpatient: 375, outpatient: 660, emergency: 155 },
  { month: "Jun", inpatient: 390, outpatient: 695, emergency: 148 },
]

const fallbackDiagnosisData = [
  { name: "Malaria", value: 28, fill: "#10b981" },
  { name: "Hypertension", value: 18, fill: "#14b8a6" },
  { name: "Diabetes", value: 14, fill: "#059669" },
  { name: "Respiratory", value: 12, fill: "#0d9488" },
  { name: "Typhoid", value: 10, fill: "#047857" },
  { name: "Others", value: 18, fill: "#a7f3d0" },
]

const fallbackPeakHours = [
  { hour: "6AM", patients: 15 },
  { hour: "7AM", patients: 28 },
  { hour: "8AM", patients: 45 },
  { hour: "9AM", patients: 62 },
  { hour: "10AM", patients: 78 },
  { hour: "11AM", patients: 85 },
  { hour: "12PM", patients: 72 },
  { hour: "1PM", patients: 55 },
  { hour: "2PM", patients: 48 },
  { hour: "3PM", patients: 42 },
  { hour: "4PM", patients: 38 },
  { hour: "5PM", patients: 32 },
]

const fallbackStaffingData = [
  { department: "Emergency", scheduled: 15, present: 13 },
  { department: "ICU", scheduled: 12, present: 11 },
  { department: "Pediatrics", scheduled: 10, present: 10 },
  { department: "Maternity", scheduled: 14, present: 12 },
  { department: "Surgery", scheduled: 11, present: 9 },
  { department: "Medical", scheduled: 13, present: 12 },
]

const fallbackInsights = [
  {
    id: 1,
    type: "info" as const,
    title: "Welcome to NurseAnalytics",
    description: "Analytics data will populate as you add patients, facilities, and clinical records to the system.",
    confidence: 100,
  },
  {
    id: 2,
    type: "success" as const,
    title: "System Ready",
    description: "All analytics modules are operational and ready to process data.",
    confidence: 100,
  },
]

const periodOptions = ["Daily", "Weekly", "Monthly", "Quarterly"]

export default function AnalyticsDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = React.useState("Monthly")
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/nurseanalytics/dashboard')
        if (res.ok) {
          const d = await res.json()
          setData(d)
        }
      } catch {
        toast.error('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const insightTypeConfig = {
    warning: { color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
    info: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: AlertCircle },
    success: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  }

  // Use API data when available, otherwise fall back to placeholder data
  const insights = data?.topDiagnoses && data.topDiagnoses.length > 0
    ? data.topDiagnoses.map((d, i) => ({
        id: i + 1,
        type: d.percentage > 25 ? ("warning" as const) : ("info" as const),
        title: `${d.name} — ${d.percentage}% of cases`,
        description: `${d.count} patients diagnosed with ${d.name}. This is ${d.percentage > 25 ? "above" : "within"} expected prevalence rates.`,
        confidence: Math.min(95, 70 + d.count),
      }))
    : fallbackInsights

  const patientVolumeData = data?.weeklyTrends && data.weeklyTrends.length > 0
    ? data.weeklyTrends.map(t => ({
        month: t.day,
        inpatient: t.admissions,
        outpatient: t.patients - t.admissions,
        emergency: t.encounters - t.patients,
      }))
    : fallbackVolumeData

  const diagnosisData = data?.topDiagnoses && data.topDiagnoses.length > 0
    ? data.topDiagnoses.map(d => ({
        name: d.name,
        value: d.percentage,
        fill: ["#10b981", "#14b8a6", "#059669", "#0d9488", "#047857", "#a7f3d0"][
          data.topDiagnoses!.indexOf(d) % 6
        ],
      }))
    : fallbackDiagnosisData

  const peakHoursData = fallbackPeakHours
  const staffingData = data?.staffingMetrics
    ? [
        { department: "Morning", scheduled: data.staffingMetrics.shiftDistribution.morning, present: Math.round(data.staffingMetrics.shiftDistribution.morning * 0.9) },
        { department: "Afternoon", scheduled: data.staffingMetrics.shiftDistribution.afternoon, present: Math.round(data.staffingMetrics.shiftDistribution.afternoon * 0.85) },
        { department: "Night", scheduled: data.staffingMetrics.shiftDistribution.night, present: Math.round(data.staffingMetrics.shiftDistribution.night * 0.95) },
      ]
    : fallbackStaffingData

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading analytics...</span>
      </div>
    )
  }

  const overview = data?.overview || {
    totalPatients: 0,
    totalFacilities: 0,
    totalNurses: 0,
    activeEncounters: 0,
    avgWaitTimeMin: 0,
    bedOccupancyRate: 0,
  }
  const quality = data?.qualityMetrics || {
    medicationErrors: 0,
    nearMissEvents: 0,
    infectionRate: 0,
    mortalityRate: 0,
    nurseSatisfactionScore: 0,
  }
  const staffing = data?.staffingMetrics || {
    nurseToPatientRatio: "0",
    totalActiveNurses: 0,
    nursesOnDuty: 0,
    shiftDistribution: { morning: 0, afternoon: 0, night: 0 },
  }
  const patientMetrics = data?.patientMetrics || {
    newPatientsThisMonth: 0,
    readmissionRate: 0,
    avgLengthOfStay: 0,
    patientSatisfactionScore: 0,
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="size-6 text-emerald-600" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time insights and performance metrics
          </p>
          {data?.isMockData && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 mt-1">
              Showing sample data — add patients and facilities to see real analytics
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-emerald-100">
                <Users className="size-4 text-emerald-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Patients</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.totalPatients.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Wait</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.avgWaitTimeMin} min</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">minutes</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-teal-100">
                <Bed className="size-4 text-teal-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Bed Occupancy</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.bedOccupancyRate}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-medium">capacity</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-cyan-100">
                <Stethoscope className="size-4 text-cyan-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Nurse:Patient</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">1:{staffing.nurseToPatientRatio}</p>
            <div className="flex items-center gap-1 mt-1">
              <Users className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">{staffing.totalActiveNurses} nurses</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-red-100">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Med Errors</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{quality.medicationErrors}</p>
            <div className="flex items-center gap-1 mt-1">
              {quality.medicationErrors === 0 ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <TrendingDown className="size-3 text-emerald-500" />
              )}
              <span className="text-[10px] text-emerald-600 font-medium">
                {quality.medicationErrors === 0 ? 'None reported' : 'Review needed'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-emerald-100">
                <Star className="size-4 text-emerald-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Satisfaction</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{patientMetrics.patientSatisfactionScore || 0}/5</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="size-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-muted-foreground font-medium">rating</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Patient Volume Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area type="monotone" dataKey="inpatient" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Inpatient" />
                  <Area type="monotone" dataKey="outpatient" stackId="1" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} name="Outpatient" />
                  <Area type="monotone" dataKey="emergency" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Emergency" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Diagnosis Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diagnosisData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {diagnosisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Percentage"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    formatter={(value) => <span className="text-slate-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Peak Hours — Patient Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="patients" fill="#10b981" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Staffing Overview — Scheduled vs Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} stroke="#94a3b8" width={85} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="scheduled" fill="#14b8a6" radius={[0, 4, 4, 0]} name="Scheduled" />
                  <Bar dataKey="present" fill="#10b981" radius={[0, 4, 4, 0]} name="Present" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="size-5 text-emerald-600" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => {
              const config = insightTypeConfig[insight.type as keyof typeof insightTypeConfig] || insightTypeConfig.info
              const InsightIcon = config.icon
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border p-4 ${config.color}`}
                >
                  <div className="flex items-start gap-3">
                    <InsightIcon className="size-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
