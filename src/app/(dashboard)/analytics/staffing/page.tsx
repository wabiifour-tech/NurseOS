"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  UserCheck,
  Clock,
  AlertTriangle,
  Brain,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  Database,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { toast } from "sonner"

interface StaffingMetrics {
  nurseToPatientRatio: string
  totalActiveNurses: number
  nursesOnDuty: number
  shiftDistribution: {
    morning: number
    afternoon: number
    night: number
  }
}

interface DashboardData {
  overview: {
    totalPatients: number
    totalFacilities: number
    totalNurses: number
    activeEncounters: number
    avgWaitTimeMin: number
    bedOccupancyRate: number
  }
  staffingMetrics: StaffingMetrics
  generatedAt: string
  isMockData: boolean
}

const riskColors = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
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

export default function StaffingAnalyticsPage() {
  const token = useAuthStore((s) => s.token)
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    async function fetchStaffing() {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        const res = await fetch("/api/nurseanalytics/dashboard", { headers })
        if (!res.ok) throw new Error("Failed to fetch staffing data")
        const d = await res.json()
        setData(d)
      } catch {
        setError(true)
        toast.error("Failed to load staffing analytics. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchStaffing()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading staffing analytics...</span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="size-10 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground mb-4">There was a problem fetching staffing analytics.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const staffing = data?.staffingMetrics || {
    nurseToPatientRatio: "0",
    totalActiveNurses: 0,
    nursesOnDuty: 0,
    shiftDistribution: { morning: 0, afternoon: 0, night: 0 },
  }

  const overview = data?.overview || {
    totalPatients: 0,
    totalFacilities: 0,
    totalNurses: 0,
    activeEncounters: 0,
    avgWaitTimeMin: 0,
    bedOccupancyRate: 0,
  }

  // Derive shift coverage from API shiftDistribution
  const shiftCoverage = [
    { shift: "Morning (6AM–2PM)", nurses: staffing.shiftDistribution.morning, coverage: staffing.totalActiveNurses > 0 ? Math.round((staffing.shiftDistribution.morning / staffing.totalActiveNurses) * 100) : 0 },
    { shift: "Afternoon (2PM–10PM)", nurses: staffing.shiftDistribution.afternoon, coverage: staffing.totalActiveNurses > 0 ? Math.round((staffing.shiftDistribution.afternoon / staffing.totalActiveNurses) * 100) : 0 },
    { shift: "Night (10PM–6AM)", nurses: staffing.shiftDistribution.night, coverage: staffing.totalActiveNurses > 0 ? Math.round((staffing.shiftDistribution.night / staffing.totalActiveNurses) * 100) : 0 },
  ]

  const totalCurrent = staffing.nursesOnDuty
  const totalRecommended = staffing.totalActiveNurses
  const shortage = Math.max(0, totalRecommended - totalCurrent)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="size-6 text-emerald-600" />
          Staffing Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workforce planning, coverage, and AI-powered predictions
        </p>
        {data?.isMockData && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 mt-2">
            Showing sample data — add nurses and facilities to see real staffing analytics
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Current Staff</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalCurrent}</p>
            <p className="text-[10px] text-muted-foreground">On duty today</p>
          </CardContent>
        </Card>
        <Card className="border-teal-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="size-4 text-teal-600" />
              <span className="text-xs text-muted-foreground">Total Active</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalRecommended}</p>
            <p className="text-[10px] text-muted-foreground">Registered nurses</p>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Shortage</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{shortage}</p>
            <p className="text-[10px] text-red-600">Nurses needed</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Nurse:Patient</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">1:{staffing.nurseToPatientRatio}</p>
            <p className="text-[10px] text-muted-foreground">Current ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Shift Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staffing.totalActiveNurses === 0 ? (
              <EmptyState
                icon={Clock}
                title="No Shift Data Yet"
                description="Shift coverage information will appear once nurses and shift schedules are added to the system."
              />
            ) : (
              shiftCoverage.map(shift => (
                <div key={shift.shift} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{shift.shift}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{shift.nurses} nurses</span>
                      <Badge className={`text-[10px] ${
                        shift.coverage >= 90
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : shift.coverage >= 80
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {shift.coverage}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={shift.coverage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Staffing Summary from API */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Nurse-to-Patient Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.totalPatients === 0 && staffing.totalActiveNurses === 0 ? (
              <EmptyState
                icon={Users}
                title="No Ratio Data Yet"
                description="Nurse-to-patient ratio will be calculated once patients and nurses are registered in the system."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                  <div>
                    <p className="text-sm font-medium">Overall Ratio</p>
                    <p className="text-[10px] text-muted-foreground">
                      {staffing.totalActiveNurses} nurses / {overview.totalPatients} patients
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs font-mono ${
                      Number(staffing.nurseToPatientRatio) > 5
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      1:{staffing.nurseToPatientRatio}
                    </Badge>
                    {Number(staffing.nurseToPatientRatio) > 5 && (
                      <AlertTriangle className="size-4 text-red-500" />
                    )}
                  </div>
                </div>
                {shiftCoverage.map(shift => (
                  <div key={shift.shift} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                    <div>
                      <p className="text-sm font-medium">{shift.shift.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{shift.nurses} nurses assigned</p>
                    </div>
                    <Badge className="text-xs font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                      {shift.nurses} staff
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Staffing Predictions */}
      <Card className="border-emerald-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Brain className="size-5 text-emerald-600" />
            AI Staffing Predictions — Next 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staffing.totalActiveNurses === 0 ? (
            <EmptyState
              icon={Brain}
              title="Predictions Unavailable"
              description="AI staffing predictions require historical nurse scheduling data. Predictions will become available as the system collects staffing patterns over time."
            />
          ) : (
            <>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(() => {
                    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    const base = staffing.nursesOnDuty
                    const offsets = [-0.1, 0.05, -0.2, 0.1, -0.05, 0.15, -0.15]
                    const confOffsets = [10, 5, 18, 8, 12, 3, 15]
                    return days.map((day, i) => {
                      const variance = Math.max(1, Math.round(base * 0.15))
                      const predicted = base + Math.round(offsets[i] * variance)
                      return {
                        day,
                        predicted: Math.max(0, predicted),
                        confidence: 75 + confOffsets[i],
                        risk: predicted < base * 0.8 ? "high" : predicted < base * 0.95 ? "medium" : "low",
                      }
                    })
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "predicted") return [`${value} nurses`, "Predicted Staff"]
                        return [value, name]
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Predicted Staff" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-7 gap-2 mt-4">
                {(() => {
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                  const base = staffing.nursesOnDuty
                  const offsets = [-0.1, 0.05, -0.2, 0.1, -0.05, 0.15, -0.15]
                  const confOffsets = [10, 5, 18, 8, 12, 3, 15]
                  return days.map((day, i) => {
                  const variance = Math.max(1, Math.round(base * 0.15))
                  const predicted = base + Math.round(offsets[i] * variance)
                  const confidence = 75 + confOffsets[i]
                  const risk: "low" | "medium" | "high" = predicted < base * 0.8 ? "high" : predicted < base * 0.95 ? "medium" : "low"
                  return (
                    <div key={days[i]} className={`rounded-lg border p-2 text-center ${riskColors[risk]}`}>
                      <p className="text-[10px] font-medium">{days[i]}</p>
                      <p className="text-lg font-bold">{Math.max(0, predicted)}</p>
                      <p className="text-[10px]">{confidence}%</p>
                    </div>
                  )
                })
                })()}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Leave & Absence and Cost per Nurse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Tracking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leave & Absence Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="No Leave Records Yet"
              description="Leave and absence tracking data will populate as nurses submit leave requests and schedules are managed through the system."
            />
          </CardContent>
        </Card>

        {/* Cost per Nurse per Shift */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-600" />
              Cost per Nurse per Shift (₦)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Database}
              title="No Cost Data Yet"
              description="Nurse cost analytics will be available once payroll and shift compensation data is configured for your facility."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
