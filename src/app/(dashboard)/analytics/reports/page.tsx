"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  FileBarChart,
  Plus,
  FileText,
  Calendar,
  Clock,
  FileSpreadsheet,
  File,
  Settings,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Database,
} from "lucide-react"
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

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getNextDate(frequency: string): string {
  const now = new Date()
  if (frequency === "Monthly") {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  if (frequency === "Quarterly") {
    const quarter = Math.floor(now.getMonth() / 3) + 1
    const nextQuarterMonth = quarter * 3
    const d = new Date(now.getFullYear(), nextQuarterMonth, 1)
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  return "N/A"
}

export default function ReportsPage() {
  const token = useAuthStore((s) => s.token)
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [generateTemplate, setGenerateTemplate] = React.useState("")
  const [generateFormat, setGenerateFormat] = React.useState("pdf")
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false)

  React.useEffect(() => {
    async function fetchReports() {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        const res = await fetch("/api/nurseanalytics/dashboard", { headers })
        if (!res.ok) throw new Error("Failed to fetch report data")
        const d = await res.json()
        setData(d)
      } catch {
        setError(true)
        toast.error("Failed to load reports data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading reports...</span>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="size-10 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Unable to Load Data</h2>
        <p className="text-sm text-muted-foreground mb-4">There was a problem fetching reports data.</p>
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

  const hasData = overview.totalPatients > 0 || overview.totalFacilities > 0

  // Default report templates that are always available
  const reportTemplates = [
    {
      id: "monthly-summary",
      name: "Monthly Summary Report",
      description: "Comprehensive overview of facility operations, patient metrics, and staffing",
      frequency: "Monthly",
      sections: ["Patient Volume", "Staffing", "Quality Metrics"],
      lastGenerated: "Not yet generated",
    },
    {
      id: "quarterly-performance",
      name: "Quarterly Performance Report",
      description: "Performance analysis across all departments with trend comparisons",
      frequency: "Quarterly",
      sections: ["Department Performance", "KPI Trends", "Budget Analysis"],
      lastGenerated: "Not yet generated",
    },
    {
      id: "staffing-report",
      name: "Staffing & Scheduling Report",
      description: "Nurse staffing levels, shift coverage, and workforce analytics",
      frequency: "Weekly",
      sections: ["Shift Coverage", "Overtime Analysis", "Leave Tracking"],
      lastGenerated: "Not yet generated",
    },
    {
      id: "disease-surveillance",
      name: "Disease Surveillance Report",
      description: "Outbreak monitoring, case tracking, and epidemiological analysis",
      frequency: "Weekly",
      sections: ["Active Alerts", "Case Trends", "Regional Data"],
      lastGenerated: "Not yet generated",
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart className="size-6 text-emerald-600" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, schedule, and export facility reports
          </p>
          {data?.isMockData && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 mt-2">
              Showing sample data — reports will populate as the system is used
            </Badge>
          )}
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setGenerateDialogOpen(true)}>
              <Plus className="size-4" />
              Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Select a template and format to generate a new report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Template</Label>
                <Select value={generateTemplate} onValueChange={setGenerateTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Report Period</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="last-quarter">Last Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-3">
                  {[
                    { value: "pdf", label: "PDF", icon: FileText },
                    { value: "csv", label: "CSV", icon: FileSpreadsheet },
                  ].map(format => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => setGenerateFormat(format.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        generateFormat === format.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <format.icon className="size-4" />
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => toast.info('Report generation is coming soon — this feature is being developed.')}>
                <FileBarChart className="size-4" />
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer group">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <FileBarChart className="size-5 text-emerald-600" />
                  </div>
                  <Badge variant="outline" className="text-[10px]">{template.frequency}</Badge>
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{template.name}</h3>
                <p className="text-xs text-muted-foreground">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.sections.slice(0, 2).map(section => (
                    <span key={section} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {section}
                    </span>
                  ))}
                  {template.sections.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{template.sections.length - 2} more
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Last: {template.lastGenerated}
                  </span>
                  <ChevronRight className="size-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Generated Reports</CardTitle>
            <Badge variant="secondary" className="text-xs">0 reports</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Database}
            title="No Generated Reports Yet"
            description="Reports will appear here once they are generated. Use the templates above to create your first report — data will populate as the system collects clinical and operational information."
          />
        </CardContent>
      </Card>

      {/* Report Scheduler */}
      <Card className="border-emerald-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="size-4 text-emerald-600" />
            Report Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTemplates.map(template => (
              <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border">
                    <Calendar className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Auto-generated {template.frequency.toLowerCase()} • Next: {getNextDate(template.frequency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => toast.info('Report scheduler configuration is coming soon — this feature is being developed.')}>
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
