'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Target,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { competencies, competencyLevels, competencyRadarData } from '@/lib/nurseid-data'

export default function CompetenciesPage() {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const levelColor = (level: number) => {
    const colors = [
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
      'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
    ]
    return colors[level - 1] || colors[0]
  }

  const gridCellColor = (level: number) => {
    const colors = [
      'bg-red-200/60 dark:bg-red-500/20',
      'bg-orange-200/60 dark:bg-orange-500/20',
      'bg-amber-200/60 dark:bg-amber-500/20',
      'bg-emerald-300/60 dark:bg-emerald-500/20',
      'bg-emerald-500/60 dark:bg-teal-500/30',
    ]
    return colors[level - 1] || colors[0]
  }

  const gridCellBorder = (level: number) => {
    const colors = [
      'border-red-300 dark:border-red-500/30',
      'border-orange-300 dark:border-orange-500/30',
      'border-amber-300 dark:border-amber-500/30',
      'border-emerald-400 dark:border-emerald-500/30',
      'border-emerald-500 dark:border-teal-500/30',
    ]
    return colors[level - 1] || colors[0]
  }

  const averageLevel =
    competencies.reduce((sum, c) => sum + c.level, 0) / competencies.length

  const expertCount = competencies.filter((c) => c.level === 5).length
  const proficientCount = competencies.filter((c) => c.level === 4).length

  const assessmentHistory: Record<string, { date: string; level: number; assessor: string }[]> = {
    'comp-1': [
      { date: '2024-11-01', level: 4, assessor: 'Dr. Adebayo Ogundimu' },
      { date: '2023-06-15', level: 3, assessor: 'Matron Folake Adeyemi' },
      { date: '2022-01-20', level: 2, assessor: 'Dr. Chinedu Eze' },
    ],
    'comp-2': [
      { date: '2024-10-15', level: 5, assessor: 'Matron Folake Adeyemi' },
      { date: '2023-05-10', level: 4, assessor: 'Dr. Adebayo Ogundimu' },
      { date: '2021-11-25', level: 3, assessor: 'Sr. Mary Okonkwo' },
    ],
    'comp-3': [
      { date: '2024-11-10', level: 5, assessor: 'Dr. Chinedu Eze' },
      { date: '2023-08-20', level: 4, assessor: 'Dr. Adebayo Ogundimu' },
      { date: '2022-04-05', level: 3, assessor: 'Matron Folake Adeyemi' },
    ],
    'comp-7': [
      { date: '2024-09-15', level: 5, assessor: 'Dr. Ngozi Okafor' },
      { date: '2023-03-22', level: 4, assessor: 'NCDC Assessment Panel' },
    ],
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Competencies</h1>
          <p className="text-muted-foreground text-sm">
            Track and develop your nursing competencies
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="size-4 mr-2" /> Add Competency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Competency Assessment</DialogTitle>
              <DialogDescription>
                Record a new competency assessment
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Competency Area</Label>
                <Input placeholder="e.g., Palliative Care" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {competencyLevels.map((level, i) => (
                        <SelectItem key={level} value={String(i + 1)}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Assessor</Label>
                <Input placeholder="e.g., Dr. Adebayo Ogundimu" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddDialogOpen(false)}>
                Add Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Target className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{competencies.length}</p>
              <p className="text-xs text-muted-foreground">Competencies</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <Award className="size-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{expertCount}</p>
              <p className="text-xs text-muted-foreground">Expert Level</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{proficientCount}</p>
              <p className="text-xs text-muted-foreground">Proficient</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{averageLevel.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Level</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competency Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Competency Map</CardTitle>
              <CardDescription>Color-coded competency levels at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Level Legend */}
              <div className="flex flex-wrap gap-2 mb-4">
                {competencyLevels.map((level, i) => (
                  <div key={level} className="flex items-center gap-1.5">
                    <div className={`size-3 rounded ${gridCellColor(i + 1)}`} />
                    <span className="text-xs text-muted-foreground">{level}</span>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {competencies.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-3 rounded-lg border ${gridCellColor(comp.level)} ${gridCellBorder(comp.level)} cursor-pointer transition-all hover:scale-[1.02]`}
                    onClick={() =>
                      setExpandedId(expandedId === comp.id ? null : comp.id)
                    }
                  >
                    <p className="text-sm font-medium leading-tight">{comp.area}</p>
                    <Badge className={`mt-2 text-[10px] ${levelColor(comp.level)}`}>
                      {comp.levelName}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed List with Assessment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Competency Details</CardTitle>
              <CardDescription>Click to view assessment history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {competencies.map((comp) => (
                <div key={comp.id} className="border rounded-lg">
                  <button
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedId(expandedId === comp.id ? null : comp.id)
                    }
                  >
                    <div className={`size-3 rounded-full shrink-0 ${gridCellColor(comp.level)}`} />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium">{comp.area}</p>
                      <p className="text-xs text-muted-foreground">
                        Assessed: {comp.lastAssessed}
                      </p>
                    </div>
                    <Badge className={`text-xs ${levelColor(comp.level)}`}>
                      Level {comp.level} — {comp.levelName}
                    </Badge>
                    {expandedId === comp.id ? (
                      <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedId === comp.id && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="size-3.5" />
                          Last Assessor: {comp.assessor}
                        </div>
                        {assessmentHistory[comp.id] ? (
                          <div className="space-y-2 mt-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Assessment History
                            </p>
                            {assessmentHistory[comp.id].map((assessment, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm p-2 bg-background rounded"
                              >
                                <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground">{assessment.date}</span>
                                <Badge className={`text-[10px] ${levelColor(assessment.level)}`}>
                                  Level {assessment.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {assessment.assessor}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            No detailed assessment history available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart Sidebar */}
        <div className="space-y-6">
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Competency Profile</CardTitle>
              <CardDescription>Radar visualization of your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={competencyRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="area"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                    />
                    <Radar
                      name="Competency Level"
                      dataKey="level"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {competencyLevels.map((level, i) => {
                const count = competencies.filter((c) => c.level === i + 1).length
                const percent = (count / competencies.length) * 100
                return (
                  <div key={level} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={`size-2.5 rounded ${gridCellColor(i + 1)}`} />
                        {level}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({Math.round(percent)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${gridCellColor(i + 1)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
