"use client"

import * as React from "react"
import {
  staffingLevels,
  shiftCoverage,
  staffingPredictions,
  leaveData,
  costData,
} from "@/lib/analytics-data"
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
  TrendingUp,
  AlertTriangle,
  Brain,
  Calendar,
  DollarSign,
  Users,
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

const riskColors = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
}

export default function StaffingAnalyticsPage() {
  const totalCurrent = staffingLevels.reduce((sum, d) => sum + d.current, 0)
  const totalRecommended = staffingLevels.reduce((sum, d) => sum + d.recommended, 0)
  const shortage = totalRecommended - totalCurrent

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
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalRecommended}</p>
            <p className="text-[10px] text-muted-foreground">Based on patient load</p>
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
              <span className="text-xs text-muted-foreground">On Leave</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{leaveData.length}</p>
            <p className="text-[10px] text-muted-foreground">Currently on leave</p>
          </CardContent>
        </Card>
      </div>

      {/* Staffing Levels vs Recommended */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Current Staffing vs Recommended by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffingLevels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} stroke="#94a3b8" />
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
                <Bar dataKey="recommended" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Recommended" />
                <Bar dataKey="current" fill="#10b981" radius={[4, 4, 0, 0]} name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Shift Coverage & Nurse-to-Patient Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Shift Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shiftCoverage.map(shift => (
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
            ))}
          </CardContent>
        </Card>

        {/* Nurse-to-Patient Ratios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Nurse-to-Patient Ratio by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staffingLevels.map(dept => {
                const ratioNum = parseInt(dept.ratio.split(":")[1])
                const isOverLimit = ratioNum > 5
                return (
                  <div key={dept.department} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                    <div>
                      <p className="text-sm font-medium">{dept.department}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {dept.current} nurses / {dept.current * ratioNum} patients
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs font-mono ${
                        isOverLimit
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {dept.ratio}
                      </Badge>
                      {isOverLimit && (
                        <AlertTriangle className="size-4 text-red-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={staffingPredictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[20, 45]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
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
            {staffingPredictions.map(day => (
              <div key={day.day} className={`rounded-lg border p-2 text-center ${riskColors[day.risk]}`}>
                <p className="text-[10px] font-medium">{day.day.slice(0, 3)}</p>
                <p className="text-lg font-bold">{day.predicted}</p>
                <p className="text-[10px]">{day.confidence}%</p>
              </div>
            ))}
          </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveData.map((leave, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{leave.name}</TableCell>
                    <TableCell className="text-xs">{leave.type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{leave.from} - {leave.to}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${
                        leave.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="level" tick={{ fontSize: 9 }} stroke="#94a3b8" width={120} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="dayShift" fill="#10b981" radius={[4, 4, 0, 0]} name="Day Shift" />
                  <Bar dataKey="nightShift" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Night Shift" />
                  <Bar dataKey="weekendShift" fill="#0d9488" radius={[4, 4, 0, 0]} name="Weekend Shift" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
