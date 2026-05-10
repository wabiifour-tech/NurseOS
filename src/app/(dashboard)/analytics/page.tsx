"use client"

import * as React from "react"
import {
  facilitySelector,
  kpiData,
  patientVolumeData,
  diagnosisData,
  peakHoursData,
  staffingData,
  aiInsights,
} from "@/lib/analytics-data"
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

const periodOptions = ["Daily", "Weekly", "Monthly", "Quarterly"]

export default function AnalyticsDashboardPage() {
  const [selectedFacility, setSelectedFacility] = React.useState(facilitySelector[0].id)
  const [selectedPeriod, setSelectedPeriod] = React.useState("Monthly")

  const insightTypeConfig = {
    warning: { color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
    info: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: AlertCircle },
    success: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
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
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {facilitySelector.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <p className="text-2xl font-bold text-slate-900">{kpiData.totalPatients.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">+8.2%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Wait Time</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpiData.avgWaitTime}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="size-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">-5.1%</span>
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
            <p className="text-2xl font-bold text-slate-900">{kpiData.bedOccupancy}%</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-medium">+2.3%</span>
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
            <p className="text-2xl font-bold text-slate-900">{kpiData.nurseToPatientRatio}</p>
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="size-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 font-medium">Below target</span>
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
            <p className="text-2xl font-bold text-slate-900">{kpiData.medicationErrors}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="size-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">-33%</span>
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
            <p className="text-2xl font-bold text-slate-900">{kpiData.patientSatisfaction}/5</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">+12%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Volume Chart */}
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

        {/* Diagnosis Distribution */}
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
        {/* Peak Hours Chart */}
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

        {/* Staffing Overview */}
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
            {aiInsights.map(insight => {
              const config = insightTypeConfig[insight.type]
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
