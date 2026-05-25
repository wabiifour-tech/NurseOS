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
  Loader2,
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

// API response type
interface ApiCompetency {
  id: string
  nurseId: string
  competencyArea: string
  level: string
  assessedBy: string | null
  assessedAt: string | null
  evidence: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

const COMPETENCY_LEVELS = [
  'Novice',
  'Advanced Beginner',
  'Competent',
  'Proficient',
  'Expert',
]

// Map level name to numeric value
function levelToNumber(level: string): number {
  const idx = COMPETENCY_LEVELS.indexOf(level)
  if (idx >= 0) return idx + 1
  // Try parsing as number string
  const num = parseInt(level, 10)
  if (!isNaN(num) && num >= 1 && num <= 5) return num
  return 1
}

// Map numeric level to name
function levelToName(level: number): string {
  return COMPETENCY_LEVELS[level - 1] || 'Novice'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function CompetenciesPage() {
  const { token } = useAuthStore()
  const [competencies, setCompetencies] = React.useState<ApiCompetency[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formArea, setFormArea] = React.useState('')
  const [formLevel, setFormLevel] = React.useState('')
  const [formDate, setFormDate] = React.useState('')
  const [formAssessor, setFormAssessor] = React.useState('')

  // Fetch competencies
  const fetchCompetencies = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/competencies', { headers })
      if (!res.ok) throw new Error(`Failed to fetch competencies (${res.status})`)
      const data = await res.json()
      setCompetencies(data.competencies || [])
    } catch (err) {
      console.error('Error fetching competencies:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load competencies'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchCompetencies()
  }, [fetchCompetencies])

  // Submit new competency
  const handleSubmit = async () => {
    if (!formArea || !formLevel) {
      toast.error('Competency area and level are required')
      return
    }
    setSubmitting(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/competencies', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          competencyArea: formArea,
          level: formLevel,
          assessedBy: formAssessor || undefined,
          assessedAt: formDate || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add competency')
      }

      toast.success('Competency assessment added successfully')
      setAddDialogOpen(false)
      resetForm()
      fetchCompetencies()
    } catch (err) {
      console.error('Error adding competency:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add competency')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormArea('')
    setFormLevel('')
    setFormDate('')
    setFormAssessor('')
  }

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

  // Compute stats from real data
  const competencyData = competencies.map((c) => ({
    ...c,
    numericLevel: levelToNumber(c.level),
    levelName: typeof c.level === 'string' && COMPETENCY_LEVELS.includes(c.level)
      ? c.level
      : levelToName(levelToNumber(c.level)),
  }))

  const averageLevel = competencyData.length > 0
    ? competencyData.reduce((sum, c) => sum + c.numericLevel, 0) / competencyData.length
    : 0

  const expertCount = competencyData.filter((c) => c.numericLevel === 5).length
  const proficientCount = competencyData.filter((c) => c.numericLevel === 4).length

  // Radar chart data
  const radarData = competencyData.map((c) => ({
    area: c.competencyArea.length > 15 ? c.competencyArea.substring(0, 15) + '…' : c.competencyArea,
    level: c.numericLevel,
    fullMark: 5,
  }))

  // Level distribution
  const levelDistribution = COMPETENCY_LEVELS.map((name, i) => {
    const count = competencyData.filter((c) => c.numericLevel === i + 1).length
    return { name, level: i + 1, count }
  })

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Competencies</h1>
            <p className="text-muted-foreground text-sm">
              Track and develop your nursing competencies
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading competencies...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Competencies</h1>
            <p className="text-muted-foreground text-sm">
              Track and develop your nursing competencies
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Failed to load competencies
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto shrink-0"
                onClick={() => fetchCompetencies()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm() }}>
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
                <Input
                  placeholder="e.g., Palliative Care"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Level</Label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPETENCY_LEVELS.map((level, i) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Assessor</Label>
                <Input
                  placeholder="e.g., Dr. Adebayo Ogundimu"
                  value={formAssessor}
                  onChange={(e) => setFormAssessor(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
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
              <p className="text-xl font-bold">{competencyData.length}</p>
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
                {COMPETENCY_LEVELS.map((level, i) => (
                  <div key={level} className="flex items-center gap-1.5">
                    <div className={`size-3 rounded ${gridCellColor(i + 1)}`} />
                    <span className="text-xs text-muted-foreground">{level}</span>
                  </div>
                ))}
              </div>

              {competencyData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Target className="size-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium">No competencies yet</p>
                  <p className="text-sm">Add your first competency assessment to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {competencyData.map((comp) => (
                    <div
                      key={comp.id}
                      className={`p-3 rounded-lg border ${gridCellColor(comp.numericLevel)} ${gridCellBorder(comp.numericLevel)} cursor-pointer transition-all hover:scale-[1.02]`}
                      onClick={() =>
                        setExpandedId(expandedId === comp.id ? null : comp.id)
                      }
                    >
                      <p className="text-sm font-medium leading-tight">{comp.competencyArea}</p>
                      <Badge className={`mt-2 text-[10px] ${levelColor(comp.numericLevel)}`}>
                        {comp.levelName}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed List with Assessment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Competency Details</CardTitle>
              <CardDescription>Click to view details and evidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {competencyData.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">No competencies to display</p>
                </div>
              ) : (
                competencyData.map((comp) => (
                  <div key={comp.id} className="border rounded-lg">
                    <button
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedId(expandedId === comp.id ? null : comp.id)
                      }
                    >
                      <div className={`size-3 rounded-full shrink-0 ${gridCellColor(comp.numericLevel)}`} />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium">{comp.competencyArea}</p>
                        <p className="text-xs text-muted-foreground">
                          Assessed: {formatDate(comp.assessedAt)}
                        </p>
                      </div>
                      <Badge className={`text-xs ${levelColor(comp.numericLevel)}`}>
                        Level {comp.numericLevel} — {comp.levelName}
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
                          {comp.assessedBy && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="size-3.5" />
                              Assessor: {comp.assessedBy}
                            </div>
                          )}
                          {comp.evidence && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Evidence:</span> {comp.evidence}
                            </div>
                          )}
                          {comp.expiresAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="size-3.5" />
                              Expires: {formatDate(comp.expiresAt)}
                            </div>
                          )}
                          {!comp.assessedBy && !comp.evidence && !comp.expiresAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              No additional details available for this assessment
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
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
              {radarData.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                  <Target className="size-8 mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
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
              )}
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Level Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {levelDistribution.map((item) => {
                const percent = competencyData.length > 0
                  ? (item.count / competencyData.length) * 100
                  : 0
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={`size-2.5 rounded ${gridCellColor(item.level)}`} />
                        {item.name}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} ({Math.round(percent)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${gridCellColor(item.level)}`}
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
