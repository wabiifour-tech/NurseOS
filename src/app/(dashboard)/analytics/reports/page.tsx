"use client"

import * as React from "react"
import {
  reportTemplates,
  generatedReports,
} from "@/lib/analytics-data"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileBarChart,
  Plus,
  Download,
  FileText,
  Calendar,
  Clock,
  FileSpreadsheet,
  File,
  Settings,
  ChevronRight,
} from "lucide-react"

export default function ReportsPage() {
  const [generateTemplate, setGenerateTemplate] = React.useState("")
  const [generateFormat, setGenerateFormat] = React.useState("pdf")

  const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    PDF: FileText,
    CSV: FileSpreadsheet,
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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
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
              <Button variant="outline">Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
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
            <Badge variant="secondary" className="text-xs">{generatedReports.length} reports</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generatedReports.map(report => {
                const FormatIcon = formatIcons[report.format] || File
                return (
                  <TableRow key={report.id} className="hover:bg-emerald-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded bg-emerald-50 flex items-center justify-center shrink-0">
                          <FormatIcon className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className="text-[10px] text-muted-foreground">{report.size}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{report.template}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{report.period}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{report.generatedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{report.date}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${
                        report.format === "PDF"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {report.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700">
                        <Download className="size-3" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
                  <Button size="sm" variant="ghost" className="text-xs h-7">
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

function getNextDate(frequency: string): string {
  const now = new Date()
  if (frequency === "Monthly") {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
  }
  if (frequency === "Quarterly") {
    const quarter = Math.floor(now.getMonth() / 3) + 1
    const nextQuarterMonth = quarter * 3
    return new Date(now.getFullYear(), nextQuarterMonth, 1).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
  }
  return "N/A"
}
