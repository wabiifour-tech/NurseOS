"use client"

import * as React from "react"
import {
  diseaseAlerts,
  diseaseTrendData,
  surveillanceReports,
} from "@/lib/analytics-data"
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

const severityConfig = {
  Watch: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye, borderColor: "border-l-blue-500" },
  Warning: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle, borderColor: "border-l-amber-500" },
  Alert: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle, borderColor: "border-l-orange-500" },
  Emergency: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle, borderColor: "border-l-red-500" },
}

const trendConfig = {
  increasing: { icon: TrendingUp, color: "text-red-500" },
  decreasing: { icon: TrendingDown, color: "text-emerald-500" },
  stable: { icon: Minus, color: "text-slate-400" },
}

export default function SurveillancePage() {
  const [selectedDisease, setSelectedDisease] = React.useState<keyof typeof diseaseTrendData>("malaria")

  const diseaseNames: Record<keyof typeof diseaseTrendData, string> = {
    malaria: "Malaria",
    cholera: "Cholera",
    lassa: "Lassa Fever",
    covid: "COVID-19",
  }

  const diseaseColors: Record<keyof typeof diseaseTrendData, string> = {
    malaria: "#10b981",
    cholera: "#f59e0b",
    lassa: "#ef4444",
    covid: "#6366f1",
  }

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
            <div className="grid grid-cols-4 gap-3 w-full max-w-lg">
              {diseaseAlerts.map(alert => {
                const config = severityConfig[alert.severity]
                return (
                  <div key={alert.id} className="bg-white rounded-lg p-3 border shadow-sm text-center">
                    <p className="text-lg font-bold text-slate-900">{alert.cases.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{alert.disease}</p>
                    <Badge className={`text-[8px] mt-1 ${config.color}`}>{alert.severity}</Badge>
                  </div>
                )
              })}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diseaseAlerts.map(alert => {
              const config = severityConfig[alert.severity]
              const TrendIcon = trendConfig[alert.trend as keyof typeof trendConfig].icon
              const trendColor = trendConfig[alert.trend as keyof typeof trendConfig].color
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border-l-4 ${config.borderColor} bg-white border border-slate-200 p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{alert.disease}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={`text-[10px] gap-1 ${config.color}`}>
                          <config.icon className="size-3" />
                          {alert.severity}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <TrendIcon className={`size-3 ${trendColor}`} />
                          {alert.trend}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Updated: {alert.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Cases:</span>{" "}
                      <span className="font-bold text-slate-900">{alert.cases.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deaths:</span>{" "}
                      <span className="font-bold text-red-600">{alert.deaths}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CFR:</span>{" "}
                      <span className="font-medium">{((alert.deaths / alert.cases) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {alert.states.map(state => (
                      <span key={state} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disease Trend Charts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Disease Trend Charts</CardTitle>
            <div className="flex gap-2">
              {Object.keys(diseaseTrendData).map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedDisease === key ? "default" : "outline"}
                  className={`text-xs h-7 ${
                    selectedDisease === key
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }`}
                  onClick={() => setSelectedDisease(key as keyof typeof diseaseTrendData)}
                >
                  {diseaseNames[key as keyof typeof diseaseTrendData]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diseaseTrendData[selectedDisease]}>
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
                  formatter={(value: number) => [value.toLocaleString(), "Cases"]}
                />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke={diseaseColors[selectedDisease]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  name={`${diseaseNames[selectedDisease]} Cases`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* All Diseases Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">All Diseases Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diseaseTrendData.malaria.map((m, i) => ({
                month: m.month,
                Malaria: m.cases,
                Cholera: diseaseTrendData.cholera[i].cases,
                "Lassa Fever": diseaseTrendData.lassa[i].cases,
                "COVID-19": diseaseTrendData.covid[i].cases,
              }))}>
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
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="Malaria" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cholera" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Lassa Fever" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="COVID-19" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveillanceReports.map(report => (
                <TableRow key={report.id} className="cursor-pointer hover:bg-emerald-50/50">
                  <TableCell className="text-sm font-medium max-w-[300px]">{report.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{report.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.author}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.date}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${
                      report.status === "Published"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {report.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
