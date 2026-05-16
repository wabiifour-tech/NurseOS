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
import { Switch } from "@/components/ui/switch"
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
  Check,
  Download,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

interface SectionMetric {
  metric: string
  value: string
  status: string
  label: string
}

interface ReportData {
  overview: {
    totalPatients: number
    totalNurses: number
    activeEncounters: number
    totalFacilities: number
    avgWaitTimeMin: number | null
    bedOccupancyRate: number | null
  }
  sectionMetrics: Record<string, SectionMetric[]>
  period: { start: string; end: string }
  generatedAt: string
}

interface GeneratedReport {
  id: string
  templateId: string
  title: string
  reportType: string
  period: string
  fileSize: number | null
  generatedAt: string
  createdAt: string
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function formatPeriodLabel(period: string): string {
  const now = new Date()
  const map: Record<string, string> = {
    "this-month": `This Month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
    "last-month": `Last Month (${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
    "this-quarter": `This Quarter (Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()})`,
    "last-quarter": `Last Quarter (Q${Math.floor((now.getMonth() - 3 + 12) / 3) % 4 || 4} ${now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()})`,
    "this-year": `This Year (${now.getFullYear()})`,
    "custom": "Custom Range",
  }
  return map[period] || period
}

export default function ReportsPage() {
  const token = useAuthStore((s) => s.token)
  const [reportData, setReportData] = React.useState<ReportData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [generateTemplate, setGenerateTemplate] = React.useState("")
  const [generateFormat, setGenerateFormat] = React.useState("pdf")
  const [generatePeriod, setGeneratePeriod] = React.useState("this-month")
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [configureTemplate, setConfigureTemplate] = React.useState<string | null>(null)
  const [schedulerConfig, setSchedulerConfig] = React.useState<Record<string, { enabled: boolean; frequency: string; recipients: string }>>({
    "monthly-summary": { enabled: true, frequency: "Monthly", recipients: "" },
    "quarterly-performance": { enabled: true, frequency: "Quarterly", recipients: "" },
    "staffing-report": { enabled: true, frequency: "Weekly", recipients: "" },
    "disease-surveillance": { enabled: true, frequency: "Weekly", recipients: "" },
  })

  // Generated reports from database
  const [generatedReports, setGeneratedReports] = React.useState<GeneratedReport[]>([])
  const [lastGeneratedMap, setLastGeneratedMap] = React.useState<Record<string, string>>({})

  // Fetch report data
  React.useEffect(() => {
    async function fetchReportData() {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        const res = await fetch("/api/analytics/report-data", { headers })
        if (!res.ok) throw new Error("Failed to fetch report data")
        const d = await res.json()
        setReportData(d)
      } catch {
        setError(true)
        toast.error("Failed to load reports data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [token])

  // Load report schedules from server on mount
  React.useEffect(() => {
    async function loadSchedules() {
      try {
        const res = await fetch('/api/analytics/report-schedules')
        if (res.ok) {
          const data = await res.json()
          if (data.schedules && Array.isArray(data.schedules)) {
            const serverConfig: Record<string, { enabled: boolean; frequency: string; recipients: string }> = {}
            for (const schedule of data.schedules) {
              serverConfig[schedule.templateId] = {
                enabled: schedule.enabled,
                frequency: schedule.frequency,
                recipients: schedule.recipients || '',
              }
            }
            setSchedulerConfig(prev => ({ ...prev, ...serverConfig }))
          }
        }
      } catch {
        // Silently fail — schedules will use defaults
      }
    }
    loadSchedules()
  }, [])

  // Load generated reports and lastGenerated timestamps
  React.useEffect(() => {
    async function loadGeneratedReports() {
      try {
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch('/api/analytics/generated-reports', { headers })
        if (res.ok) {
          const data = await res.json()
          setGeneratedReports(data.reports || [])
          setLastGeneratedMap(data.lastGeneratedMap || {})
        }
      } catch {
        // Silently fail
      }
    }
    loadGeneratedReports()
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading reports...</span>
      </div>
    )
  }

  if (error && !reportData) {
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

  const overview = reportData?.overview || {
    totalPatients: 0,
    totalNurses: 0,
    activeEncounters: 0,
    totalFacilities: 0,
    avgWaitTimeMin: null,
    bedOccupancyRate: null,
  }

  const sectionMetrics = reportData?.sectionMetrics || {}

  const hasData = overview.totalPatients > 0 || overview.totalFacilities > 0

  // Report templates
  const reportTemplates = [
    {
      id: "monthly-summary",
      name: "Monthly Summary Report",
      description: "Comprehensive overview of facility operations, patient metrics, and staffing",
      frequency: "Monthly",
      sections: ["Patient Volume", "Staffing", "Quality Metrics"],
    },
    {
      id: "quarterly-performance",
      name: "Quarterly Performance Report",
      description: "Performance analysis across all departments with trend comparisons",
      frequency: "Quarterly",
      sections: ["Department Performance", "KPI Trends", "Budget Analysis"],
    },
    {
      id: "staffing-report",
      name: "Staffing & Scheduling Report",
      description: "Nurse staffing levels, shift coverage, and workforce analytics",
      frequency: "Weekly",
      sections: ["Shift Coverage", "Overtime Analysis", "Leave Tracking"],
    },
    {
      id: "disease-surveillance",
      name: "Disease Surveillance Report",
      description: "Outbreak monitoring, case tracking, and epidemiological analysis",
      frequency: "Weekly",
      sections: ["Active Alerts", "Case Trends", "Regional Data"],
    },
  ]

  // Generate PDF report (opens in new tab for print/save-as-PDF)
  async function generatePdfReport(templateId: string, period: string) {
    const template = reportTemplates.find(t => t.id === templateId)
    if (!template) return

    const periodLabel = formatPeriodLabel(period)
    const generatedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    const displayValue = (val: number | null | undefined, suffix: string = '') => {
      if (val === null || val === undefined) return 'Insufficient data'
      return `${val.toLocaleString()}${suffix}`
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${template.name} — NurseOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 48px;
      line-height: 1.6;
    }
    @media print {
      body { padding: 24px; }
      .no-print { display: none; }
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #059669;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .logo {
      width: 44px; height: 44px;
      background: #059669;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; font-size: 18px;
    }
    .header h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
    .header .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .header-right { text-align: right; font-size: 12px; color: #64748b; }
    .report-title {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .report-meta {
      display: flex; gap: 24px; flex-wrap: wrap;
      font-size: 13px; color: #475569;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .report-meta span { display: flex; align-items: center; gap: 6px; }
    .section-title {
      font-size: 16px; font-weight: 600; color: #059669;
      margin: 28px 0 14px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #d1fae5;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 20px;
    }
    .stat-card .label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .stat-card .unit { font-size: 13px; color: #64748b; font-weight: 400; }
    .stat-card .no-data { font-size: 16px; font-weight: 500; color: #94a3b8; margin-top: 4px; font-style: italic; }
    .section-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 24px;
    }
    .section-table th {
      background: #f1f5f9;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      color: #334155;
      border-bottom: 2px solid #e2e8f0;
    }
    .section-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    .section-table tr:nth-child(even) td { background: #fafbfc; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 2px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      background: #059669; color: #fff; border: none;
      padding: 12px 24px; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 12px rgba(5,150,105,0.3);
      display: flex; align-items: center; gap: 8px;
    }
    .print-btn:hover { background: #047857; }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-amber { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="logo">N</div>
      <div>
        <h1>NurseOS</h1>
        <div class="subtitle">Healthcare Analytics & Reporting</div>
      </div>
    </div>
    <div class="header-right">
      <div>Generated: ${generatedDate}</div>
      <div style="margin-top:4px;">Live Data</div>
    </div>
  </div>

  <div class="report-title">${template.name}</div>
  <div class="report-meta">
    <span>Period: ${periodLabel}</span>
    <span>Template: ${template.name}</span>
    <span>Frequency: ${template.frequency}</span>
    <span><span class="badge badge-green">Official Report</span></span>
  </div>

  <div class="section-title">Executive Overview</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">Total Patients</div>
      ${overview.totalPatients > 0
        ? `<div class="value">${overview.totalPatients.toLocaleString()}</div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
    <div class="stat-card">
      <div class="label">Active Encounters</div>
      ${overview.activeEncounters > 0
        ? `<div class="value">${overview.activeEncounters.toLocaleString()}</div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
    <div class="stat-card">
      <div class="label">Total Nurses</div>
      ${overview.totalNurses > 0
        ? `<div class="value">${overview.totalNurses.toLocaleString()}</div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
    <div class="stat-card">
      <div class="label">Facilities</div>
      ${overview.totalFacilities > 0
        ? `<div class="value">${overview.totalFacilities.toLocaleString()}</div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
    <div class="stat-card">
      <div class="label">Avg Wait Time</div>
      ${overview.avgWaitTimeMin !== null && overview.avgWaitTimeMin !== undefined
        ? `<div class="value">${overview.avgWaitTimeMin} <span class="unit">min</span></div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
    <div class="stat-card">
      <div class="label">Bed Occupancy</div>
      ${overview.bedOccupancyRate !== null && overview.bedOccupancyRate !== undefined
        ? `<div class="value">${overview.bedOccupancyRate}%</div>`
        : `<div class="no-data">Insufficient data</div>`
      }
    </div>
  </div>

  ${template.sections.map((section) => {
    const metrics = sectionMetrics[section] || []
    return `
  <div class="section-title">${section}</div>
  ${metrics.length > 0 ? `
  <table class="section-table">
    <thead>
      <tr>
        <th>Metric</th>
        <th>Current Value</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${metrics.map((m) => `<tr><td>${m.metric}</td><td>${m.value}</td><td><span class="badge badge-${m.status}">${m.label}</span></td></tr>`).join('')}
    </tbody>
  </table>
  ` : `
  <p style="color: #94a3b8; font-style: italic; margin-bottom: 24px;">No data available for this section.</p>
  `}
  `}).join('')}

  <div class="footer">
    <div>NurseOS Report — Confidential</div>
    <div>Page 1 of 1 — Generated on ${generatedDate}</div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) {
      toast.error('Pop-up blocked — please allow pop-ups for NurseOS to generate reports.')
    }

    // Save report metadata to database
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      await fetch('/api/analytics/generated-reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateId,
          title: `${template.name} — ${periodLabel}`,
          reportType: 'pdf',
          period,
          fileSize: html.length,
        }),
      })
      // Refresh generated reports list
      const res = await fetch('/api/analytics/generated-reports', { headers })
      if (res.ok) {
        const data = await res.json()
        setGeneratedReports(data.reports || [])
        setLastGeneratedMap(data.lastGeneratedMap || {})
      }
    } catch {
      // Don't fail if save fails
    }
  }

  // Generate CSV report
  async function generateCsvReport(templateId: string, period: string) {
    const template = reportTemplates.find(t => t.id === templateId)
    if (!template) return

    const periodLabel = formatPeriodLabel(period)
    const generatedDate = new Date().toISOString()

    const displayVal = (val: number | null | undefined) => {
      if (val === null || val === undefined) return 'Insufficient data'
      return String(val)
    }

    const rows: string[][] = [
      ['NurseOS Report'],
      ['Template', template.name],
      ['Period', periodLabel],
      ['Generated', generatedDate],
      ['Data Source', 'Live Data'],
      [],
      ['Executive Overview'],
      ['Metric', 'Value'],
      ['Total Patients', displayVal(overview.totalPatients)],
      ['Active Encounters', displayVal(overview.activeEncounters)],
      ['Total Nurses', displayVal(overview.totalNurses)],
      ['Total Facilities', displayVal(overview.totalFacilities)],
      ['Avg Wait Time (min)', displayVal(overview.avgWaitTimeMin)],
      ['Bed Occupancy Rate (%)', displayVal(overview.bedOccupancyRate)],
      [],
    ]

    template.sections.forEach((section) => {
      rows.push([section])
      rows.push(['Metric', 'Value', 'Status'])
      const metrics = sectionMetrics[section] || []
      if (metrics.length > 0) {
        metrics.forEach((m) => {
          rows.push([m.metric, m.value, m.label])
        })
      } else {
        rows.push(['No data', '—', 'Awaiting Data'])
      }
      rows.push([])
    })

    const csvContent = rows.map(r =>
      r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${template.id}-${period}-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Save report metadata to database
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      await fetch('/api/analytics/generated-reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateId,
          title: `${template.name} — ${periodLabel}`,
          reportType: 'csv',
          period,
          fileSize: csvContent.length,
        }),
      })
      const res = await fetch('/api/analytics/generated-reports', { headers })
      if (res.ok) {
        const data = await res.json()
        setGeneratedReports(data.reports || [])
        setLastGeneratedMap(data.lastGeneratedMap || {})
      }
    } catch {
      // Don't fail if save fails
    }
  }

  // Main generate handler
  async function handleGenerateReport() {
    if (!generateTemplate) {
      toast.error('Please select a report template.')
      return
    }
    setGenerating(true)
    try {
      if (generateFormat === 'csv') {
        await generateCsvReport(generateTemplate, generatePeriod)
      } else {
        await generatePdfReport(generateTemplate, generatePeriod)
      }

      toast.success(`Report generated successfully!${generateFormat === 'pdf' ? ' Use Print > Save as PDF in the new tab.' : ''}`)
      setGenerateDialogOpen(false)
      setGenerateTemplate("")
    } catch {
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Delete a generated report
  async function handleDeleteReport(reportId: string) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      await fetch('/api/analytics/generated-reports', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ reportId }),
      })
      setGeneratedReports(prev => prev.filter(r => r.id !== reportId))
      toast.success('Report deleted.')
    } catch {
      toast.error('Failed to delete report.')
    }
  }

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
                <Select value={generatePeriod} onValueChange={setGeneratePeriod}>
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
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={handleGenerateReport} disabled={generating}>
                {generating ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
                {generating ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map(template => {
            const lastGen = lastGeneratedMap[template.id]
            return (
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
                      Last: {lastGen ? formatDate(lastGen) : 'Not yet generated'}
                    </span>
                    <ChevronRight className="size-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Generated Reports */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Generated Reports</CardTitle>
            <Badge variant="secondary" className="text-xs">{generatedReports.length} report{generatedReports.length !== 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No Generated Reports Yet"
              description="Reports will appear here once they are generated. Use the templates above to create your first report — data will populate as the system collects clinical and operational information."
            />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedReports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white border shrink-0">
                      {report.reportType === 'pdf' ? (
                        <FileText className="size-4 text-red-500" />
                      ) : (
                        <FileSpreadsheet className="size-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="uppercase">{report.reportType}</span>
                        <span>•</span>
                        <span>{formatPeriodLabel(report.period)}</span>
                        <span>•</span>
                        <span>{formatDate(report.generatedAt)}</span>
                        {report.fileSize && (
                          <>
                            <span>•</span>
                            <span>{(report.fileSize / 1024).toFixed(1)} KB</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                      // Re-generate the report with same parameters for re-download
                      if (report.reportType === 'csv') {
                        generateCsvReport(report.templateId, report.period)
                      } else {
                        generatePdfReport(report.templateId, report.period)
                      }
                    }}>
                      <Download className="size-3 mr-1" />
                      Re-download
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-red-500 hover:text-red-700" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <Badge variant="outline" className="text-[10px]">{schedulerConfig[template.id]?.enabled !== false ? 'Active' : 'Paused'}</Badge>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setConfigureTemplate(template.id)}>
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configure Scheduler Dialog */}
      <Dialog open={!!configureTemplate} onOpenChange={(open) => { if (!open) setConfigureTemplate(null) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Configure Schedule</DialogTitle>
            <DialogDescription>
              {configureTemplate ? reportTemplates.find(t => t.id === configureTemplate)?.name : ''}
            </DialogDescription>
          </DialogHeader>
          {configureTemplate && (
            <div className="space-y-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Generate</Label>
                  <p className="text-xs text-muted-foreground">Enable or pause scheduled generation</p>
                </div>
                <Switch
                  checked={schedulerConfig[configureTemplate]?.enabled !== false}
                  onCheckedChange={(checked) =>
                    setSchedulerConfig(prev => ({
                      ...prev,
                      [configureTemplate]: { ...prev[configureTemplate], enabled: checked }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={schedulerConfig[configureTemplate]?.frequency || 'Monthly'}
                  onValueChange={(val) =>
                    setSchedulerConfig(prev => ({
                      ...prev,
                      [configureTemplate]: { ...prev[configureTemplate], frequency: val }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <input
                  type="text"
                  placeholder="email@example.com, another@example.com"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={schedulerConfig[configureTemplate]?.recipients || ''}
                  onChange={(e) =>
                    setSchedulerConfig(prev => ({
                      ...prev,
                      [configureTemplate]: { ...prev[configureTemplate], recipients: e.target.value }
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Comma-separated email addresses</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureTemplate(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={async () => {
                try {
                  if (configureTemplate) {
                    const config = schedulerConfig[configureTemplate]
                    await fetch('/api/analytics/report-schedules', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        templateId: configureTemplate,
                        enabled: config?.enabled !== false,
                        frequency: config?.frequency || 'Monthly',
                        recipients: config?.recipients || '',
                      }),
                    })
                  }
                  toast.success('Schedule configuration saved successfully.')
                  setConfigureTemplate(null)
                } catch {
                  toast.error('Failed to save schedule configuration.')
                }
              }}
            >
              <Check className="size-4" />
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
