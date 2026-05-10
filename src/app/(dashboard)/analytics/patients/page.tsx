"use client"

import * as React from "react"
import {
  ageDemographics,
  topDiagnoses,
  admissionTrends,
  losDistribution,
  satisfactionTrends,
} from "@/lib/analytics-data"
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
  AreaChart,
  Area,
} from "recharts"

export default function PatientAnalyticsPage() {
  const totalPatients = ageDemographics.reduce((sum, d) => sum + d.male + d.female, 0)
  const maleCount = ageDemographics.reduce((sum, d) => sum + d.male, 0)
  const femaleCount = ageDemographics.reduce((sum, d) => sum + d.female, 0)
  const readmissionRate = 4.8

  const trendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="size-3.5 text-red-500" />
    if (trend === "down") return <TrendingDown className="size-3.5 text-emerald-500" />
    return <Minus className="size-3.5 text-slate-400" />
  }

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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900">{totalPatients.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Male Patients</p>
            <p className="text-2xl font-bold text-slate-900">{maleCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{Math.round((maleCount/totalPatients)*100)}% of total</p>
          </CardContent>
        </Card>
        <Card className="border-pink-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Female Patients</p>
            <p className="text-2xl font-bold text-slate-900">{femaleCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{Math.round((femaleCount/totalPatients)*100)}% of total</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Readmission Rate</p>
            <p className="text-2xl font-bold text-slate-900">{readmissionRate}%</p>
            <p className="text-[10px] text-emerald-600">↓ 0.8% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics & Gender Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Age Demographics by Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDemographics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="group" tick={{ fontSize: 11 }} stroke="#94a3b8" />
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
                  <Bar dataKey="male" fill="#0d9488" radius={[4, 4, 0, 0]} name="Male" />
                  <Bar dataKey="female" fill="#10b981" radius={[4, 4, 0, 0]} name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Length of Stay Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={losDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="patients" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admission Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Admission Trends (12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Top Diagnoses Table & Patient Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead className="text-right">Cases</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDiagnoses.map(diag => (
                  <TableRow key={diag.rank}>
                    <TableCell className="font-medium text-xs">{diag.rank}</TableCell>
                    <TableCell className="text-sm">{diag.diagnosis}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{diag.cases}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={diag.percentage} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{diag.percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {trendIcon(diag.trend)}
                        <span className={`text-xs ${
                          diag.trend === "up" ? "text-red-500" : diag.trend === "down" ? "text-emerald-500" : "text-slate-400"
                        }`}>
                          {diag.change}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="size-4 text-emerald-600" />
              Patient Satisfaction Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={satisfactionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis domain={[3, 5]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area type="monotone" dataKey="overall" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} name="Overall" />
                  <Area type="monotone" dataKey="nursing" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.1} strokeWidth={2} name="Nursing" />
                  <Area type="monotone" dataKey="doctor" stroke="#0d9488" fill="#0d9488" fillOpacity={0.1} strokeWidth={2} name="Doctor" />
                  <Area type="monotone" dataKey="facility" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={2} name="Facility" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readmission Rates Summary */}
      <Card className="border-amber-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-amber-600" />
            Readmission Rate Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-xs text-muted-foreground">Within 7 days</p>
              <p className="text-xl font-bold text-slate-900">1.8%</p>
              <p className="text-[10px] text-emerald-600 mt-1">↓ 0.3% from last quarter</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs text-muted-foreground">Within 30 days</p>
              <p className="text-xl font-bold text-slate-900">4.8%</p>
              <p className="text-[10px] text-emerald-600 mt-1">↓ 0.8% from last quarter</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-xs text-muted-foreground">Top Reason: Malaria</p>
              <p className="text-xl font-bold text-slate-900">38%</p>
              <p className="text-[10px] text-red-600 mt-1">Of all readmissions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
