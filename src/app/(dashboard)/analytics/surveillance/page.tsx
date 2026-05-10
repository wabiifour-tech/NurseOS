"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Eye,
  Plus,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Loader2,
  Database,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { toast } from "sonner"

interface DiseaseSurveillanceItem {
  disease: string
  region: string
  alertLevel: string
  cases: number
}

interface DashboardData {
  diseaseSurveillance?: DiseaseSurveillanceItem[]
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

const severityConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; borderColor: string }> = {
  Watch: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye, borderColor: "border-l-blue-500" },
  Warning: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle, borderColor: "border-l-amber-500" },
  Alert: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle, borderColor: "border-l-orange-500" },
  Emergency: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, borderColor: "border-l-red-500" },
  Low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Eye, borderColor: "border-l-emerald-500" },
  Medium: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle, borderColor: "border-l-amber-500" },
  High: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, borderColor: "border-l-red-500" },
}

const trendConfig = {
  increasing: { icon: TrendingUp, color: "text-red-500" },
  decreasing: { icon: TrendingDown, color: "text-emerald-500" },
  stable: { icon: Minus, color: "text-slate-400" },
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

export default function SurveillancePage() {
  const token = useAuthStore((s) => s.token)
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [selectedDisease, setSelectedDisease] = React.useState<string>("")

  React.useEffect(() => {
    async function fetchSurveillance() {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        const res = await fetch("/api/nurseanalytics/dashboard", { headers })
        if (!res.ok) throw new Error("Failed to fetch surveillance data")
        const d = await res.json()
        setData(d)
        // Set initial selected disease
        if (d.diseaseSurveillance && d.diseaseSurveillance.length > 0) {
          setSelectedDisease(d.diseaseSurveillance[0].disease)
        }
      } catch {
        setError(true)
        toast.error("Failed to load disease surveillance data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchSurveillance()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading disease surveillance...</span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="size-10 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground mb-4">There was a problem fetching surveillance data.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const diseaseAlerts = data?.diseaseSurveillance || []
  const hasDiseaseData = diseaseAlerts.length > 0 && diseaseAlerts.some(d => d.cases > 0)

  // Unique disease names for the trend selector
  const uniqueDiseases = [...new Set(diseaseAlerts.map(d => d.disease))]

  // Derive a trend from the alert level
  function getTrend(alertLevel: string): "increasing" | "decreasing" | "stable" {
    const level = (alertLevel || "").toLowerCase()
    if (level === "emergency" || level === "high" || level === "alert") return "increasing"
    if (level === "watch" || level === "low") return "decreasing"
    return "stable"
  }

  // Derive severity from alertLevel
  function getSeverity(alertLevel: string): string {
    const level = (alertLevel || "").toLowerCase()
    if (level === "emergency") return "Emergency"
    if (level === "high" || level === "alert") return "Alert"
    if (level === "medium" || level === "warning") return "Warning"
    return "Watch"
  }

  // Map disease to a color
  const diseaseColors: Record<string, string> = {
    Malaria: "#10b981",
    Cholera: "#f59e0b",
    "Lassa Fever": "#ef4444",
    "COVID-19": "#6366f1",
    Typhoid: "#0d9488",
    Tuberculosis: "#059669",
  }
  function getDiseaseColor(disease: string): string {
    return diseaseColors[disease] || "#14b8a6"
  }

  // Generate trend data from weekly trends if available
  const weeklyTrends = data?.weeklyTrends || []
  const selectedDiseaseAlerts = diseaseAlerts.filter(d => d.disease === selectedDisease)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="size-6 text-emerald-600" />
            Disease Surveillance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track outbreaks, monitor disease trends, and report cases
          </p>
          {data?.isMockData && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 mt-2">
              Showing sample data — surveillance data will populate as cases are reported
            </Badge>
          )}
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="size-4" />
          Report Case
        </Button>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="size-4 text-emerald-600" />
            Nigeria Disease Outbreak Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] rounded-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 flex flex-col items-center justify-center p-6">
            <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <MapPin className="size-10 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-2">Interactive Disease Map</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Real-time visualization of disease outbreaks across Nigerian states
            </p>
            {hasDiseaseData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                {diseaseAlerts.map((alert, idx) => {
                  const config = severityConfig[getSeverity(alert.alertLevel)] || severityConfig.Watch
                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 border shadow-sm text-center">
                      <p className="text-lg font-bold text-slate-900">{alert.cases.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{alert.disease}</p>
                      <Badge className={`text-[8px] mt-1 ${config.color}`}>{getSeverity(alert.alertLevel)}</Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border shadow-sm max-w-sm">
                <p className="text-sm text-muted-foreground">No disease outbreak data available yet. Case data will appear here as reports are submitted.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-500" />
            Active Disease Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDiseaseData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diseaseAlerts.map((alert, idx) => {
                const severity = getSeverity(alert.alertLevel)
                const config = severityConfig[severity] || severityConfig.Watch
                const trend = getTrend(alert.alertLevel)
                const TrendIcon = trendConfig[trend].icon
                const trendColor = trendConfig[trend].color
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border-l-4 ${config.borderColor} bg-white border border-slate-200 p-4 shadow-sm`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900">{alert.disease}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`text-[10px] gap-1 ${config.color}`}>
                            <config.icon className="size-3" />
                            {severity}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <TrendIcon className={`size-3 ${trendColor}`} />
                            {trend}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{alert.region}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Cases:</span>{" "}
                        <span className="font-bold text-slate-900">{alert.cases.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Shield}
              title="No Active Disease Alerts"
              description="Disease alerts will appear here as surveillance data is collected and cases are reported through the system."
            />
          )}
        </CardContent>
      </Card>

      {/* Disease Trend Charts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Disease Trend Charts</CardTitle>
            {uniqueDiseases.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {uniqueDiseases.map(disease => (
                  <Button
                    key={disease}
                    size="sm"
                    variant={selectedDisease === disease ? "default" : "outline"}
                    className={`text-xs h-7 ${
                      selectedDisease === disease
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                    onClick={() => setSelectedDisease(disease)}
                  >
                    {disease}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {weeklyTrends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrends.map(t => ({
                  period: t.day,
                  cases: t.admissions,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "Cases"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cases"
                    stroke={selectedDisease ? getDiseaseColor(selectedDisease) : "#10b981"}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name={selectedDisease ? `${selectedDisease} Cases` : "Cases"}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No Trend Data Available"
              description="Disease trend charts will populate as weekly surveillance data is collected. Trends require multiple weeks of case reporting data."
            />
          )}
        </CardContent>
      </Card>

      {/* All Diseases Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">All Diseases Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {hasDiseaseData && weeklyTrends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrends.map(t => ({
                  period: t.day,
                  Admissions: t.admissions,
                  Encounters: t.encounters,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString(), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="Admissions" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Encounters" stroke="#14b8a6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Database}
              title="Comparison Charts Unavailable"
              description="Disease comparison charts require ongoing surveillance data collection. Data will appear as case reports are submitted over time."
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Surveillance Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="size-4 text-emerald-600" />
            Recent Surveillance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="No Surveillance Reports Yet"
            description="Surveillance reports will appear here as they are generated from disease monitoring and case reporting activities."
          />
        </CardContent>
      </Card>
    </div>
  )
}
