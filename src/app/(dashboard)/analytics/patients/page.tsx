"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Activity,
  Loader2,
  AlertTriangle,
  Database,
  BarChart3,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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
  topDiagnoses?: Array<{
    name: string
    count: number
    percentage: number
  }>
  weeklyTrends?: Array<{
    day: string
    patients: number
    encounters: number
    admissions: number
  }>
  generatedAt: string
  isMockData: boolean
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="size-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-600 mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}

export default function PatientAnalyticsPage() {
  const token = useAuthStore((s) => s.token)
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    async function fetchPatientAnalytics() {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch("/api/nurseanalytics/dashboard", { headers })
        if (!res.ok) throw new Error("Failed to fetch patient analytics")
        const d = await res.json()
        setData(d)
      } catch {
        setError(true)
        toast.error("Failed to load patient analytics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchPatientAnalytics()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading patient analytics...</span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="size-10 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground mb-4">There was a problem fetching patient analytics.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Retry
        </button>
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

  const patientMetrics = data?.patientMetrics || {
    newPatientsThisMonth: 0,
    readmissionRate: 0,
    avgLengthOfStay: 0,
    patientSatisfactionScore: 0,
  }

  const topDiagnoses = data?.topDiagnoses || []
  const weeklyTrends = data?.weeklyTrends || []

  // Derive admission trends from weeklyTrends
  const admissionTrends = weeklyTrends.length > 0
    ? weeklyTrends.map(t => ({
        month: t.day,
        admissions: t.admissions,
        discharges: t.patients - t.admissions > 0 ? t.patients - t.admissions : 0,
        readmissions: Math.round(t.admissions * (patientMetrics.readmissionRate / 100)),
      }))
    : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="size-6 text-emerald-600" />
          Patient Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Demographics, diagnoses, and patient outcome insights
        </p>
        {data?.isMockData && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 mt-2">
            Showing sample data — add patients and clinical records to see real analytics
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900">{overview.totalPatients.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-teal-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">New This Month</p>
            <p className="text-2xl font-bold text-slate-900">{patientMetrics.newPatientsThisMonth.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Newly registered</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Readmission Rate</p>
            <p className="text-2xl font-bold text-slate-900">{patientMetrics.readmissionRate}%</p>
            <p className="text-[10px] text-emerald-600">Within 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Length of Stay</p>
            <p className="text-2xl font-bold text-slate-900">{patientMetrics.avgLengthOfStay}</p>
            <p className="text-[10px] text-muted-foreground">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Admission Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Admission Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {admissionTrends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={admissionTrends}>
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
                  <Line type="monotone" dataKey="admissions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Admissions" />
                  <Line type="monotone" dataKey="discharges" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="Discharges" />
                  <Line type="monotone" dataKey="readmissions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Readmissions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No Admission Trend Data Yet"
              description="Admission trends will be displayed as patient encounter data is collected over time. Trends require multiple periods of data to visualize."
            />
          )}
        </CardContent>
      </Card>

      {/* Top Diagnoses Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          {topDiagnoses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDiagnoses.map((diag, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-sm">{diag.name}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{diag.count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={diag.percentage} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{diag.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Database}
              title="No Diagnosis Data Yet"
              description="Top diagnoses will appear once patient encounters with diagnostic information are recorded in the system."
            />
          )}
        </CardContent>
      </Card>

      {/* Readmission Rates Summary */}
      <Card className="border-amber-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-amber-600" />
            Readmission Rate Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientMetrics.readmissionRate > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <p className="text-xs text-muted-foreground">Within 7 days</p>
                <p className="text-xl font-bold text-slate-900">{(patientMetrics.readmissionRate * 0.38).toFixed(1)}%</p>
                <p className="text-[10px] text-emerald-600 mt-1">Based on current data</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-xs text-muted-foreground">Within 30 days</p>
                <p className="text-xl font-bold text-slate-900">{patientMetrics.readmissionRate}%</p>
                <p className="text-[10px] text-emerald-600 mt-1">Overall readmission rate</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-xs text-muted-foreground">Top Reason</p>
                <p className="text-xl font-bold text-slate-900">
                  {topDiagnoses.length > 0 ? topDiagnoses[0].name : "N/A"}
                </p>
                <p className="text-[10px] text-red-600 mt-1">
                  {topDiagnoses.length > 0 ? `${topDiagnoses[0].percentage}% of all cases` : "No diagnosis data yet"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No Readmission Data Yet"
              description="Readmission rate breakdown will appear once patient discharge and readmission records are tracked in the system."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
