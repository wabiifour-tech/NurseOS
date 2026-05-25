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
import { Progress } from '@/components/ui/progress'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  CheckCircle2,
  Clock,
  GraduationCap,
  BookOpen,
  Users,
  Presentation,
  Target,
  TrendingUp,
  Filter,
  Search,
  Loader2,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

// API response type
interface ApiCPDRecord {
  id: string
  nurseId: string
  activityType: string
  title: string
  description: string
  cpdPoints: number
  dateCompleted: string
  provider: string | null
  certificateUrl: string | null
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

const CPD_TYPES = ['Course', 'Workshop', 'Conference', 'Seminar']

const TYPE_COLORS: Record<string, string> = {
  Course: '#10b981',
  Workshop: '#14b8a6',
  Conference: '#0d9488',
  Seminar: '#059669',
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

// Circular progress component
function CircularProgress({ value, max, size = 160 }: { value: number; max: number; size?: number }) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-emerald-600">{value}</span>
        <span className="text-xs text-muted-foreground">of {max} points</span>
      </div>
    </div>
  )
}

export default function CPDTrackerPage() {
  const { token } = useAuthStore()
  const [cpdRecords, setCpdRecords] = React.useState<ApiCPDRecord[]>([])
  const [totalPoints, setTotalPoints] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formType, setFormType] = React.useState('')
  const [formPoints, setFormPoints] = React.useState('')
  const [formProvider, setFormProvider] = React.useState('')
  const [formDate, setFormDate] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')

  // Fetch CPD records
  const fetchCPD = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/cpd', { headers })
      if (!res.ok) throw new Error(`Failed to fetch CPD records (${res.status})`)
      const data = await res.json()
      setCpdRecords(data.records || [])
      setTotalPoints(data.totalPoints || 0)
    } catch (err) {
      console.error('Error fetching CPD records:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load CPD records'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchCPD()
  }, [fetchCPD])

  // Submit new CPD activity
  const handleSubmit = async () => {
    if (!formTitle || !formType || !formPoints) {
      toast.error('Activity title, type, and CPD points are required')
      return
    }
    setSubmitting(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/cpd', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formTitle,
          activityType: formType,
          cpdPoints: parseFloat(formPoints),
          dateCompleted: formDate || undefined,
          provider: formProvider || undefined,
          description: formDescription || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to log CPD activity')
      }

      toast.success('CPD activity logged successfully')
      setAddDialogOpen(false)
      resetForm()
      fetchCPD()
    } catch (err) {
      console.error('Error logging CPD activity:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to log CPD activity')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormType('')
    setFormPoints('')
    setFormProvider('')
    setFormDate('')
    setFormDescription('')
  }

  const filteredActivities = cpdRecords.filter((a) => {
    const matchesType = typeFilter === 'All' || a.activityType === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.provider || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  // Compute points by type for pie chart
  const pointsByType = React.useMemo(() => {
    const map: Record<string, number> = {}
    cpdRecords.forEach((r) => {
      map[r.activityType] = (map[r.activityType] || 0) + r.cpdPoints
    })
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: TYPE_COLORS[name] || '#6b7280',
    }))
  }, [cpdRecords])

  const annualTarget = 60
  const progressPercent = Math.min((totalPoints / annualTarget) * 100, 100)

  const typeIcon = (type: string) => {
    switch (type) {
      case 'Course':
        return <GraduationCap className="size-4 text-emerald-600" />
      case 'Workshop':
        return <Users className="size-4 text-teal-600" />
      case 'Conference':
        return <Presentation className="size-4 text-purple-600" />
      case 'Seminar':
        return <BookOpen className="size-4 text-blue-600" />
      default:
        return <GraduationCap className="size-4" />
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">CPD Tracker</h1>
            <p className="text-muted-foreground text-sm">
              Track your Continuing Professional Development activities
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:row-span-2"><CardContent className="p-12 flex flex-col items-center justify-center"><Loader2 className="size-8 text-emerald-600 animate-spin mb-3" /><p className="text-sm text-muted-foreground">Loading...</p></CardContent></Card>
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><div className="flex items-center gap-4"><div className="size-12 rounded-lg bg-muted animate-pulse" /><div className="space-y-2 flex-1"><div className="h-6 w-12 bg-muted rounded animate-pulse" /><div className="h-3 w-24 bg-muted rounded animate-pulse" /></div></div></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">CPD Tracker</h1>
            <p className="text-muted-foreground text-sm">
              Track your Continuing Professional Development activities
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="size-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Failed to load CPD records
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto shrink-0"
                onClick={() => fetchCPD()}
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
          <h1 className="text-2xl font-bold">CPD Tracker</h1>
          <p className="text-muted-foreground text-sm">
            Track your Continuing Professional Development activities
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="size-4 mr-2" /> Log CPD Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Log CPD Activity</DialogTitle>
              <DialogDescription>
                Record a continuing professional development activity
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cpd-title">Activity Title</Label>
                <Input
                  id="cpd-title"
                  placeholder="e.g., Advanced Wound Care Workshop"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Activity Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CPD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpd-points">CPD Points</Label>
                  <Input
                    id="cpd-points"
                    type="number"
                    placeholder="e.g., 5"
                    value={formPoints}
                    onChange={(e) => setFormPoints(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cpd-provider">Provider</Label>
                <Input
                  id="cpd-provider"
                  placeholder="e.g., NurseOS Academy"
                  value={formProvider}
                  onChange={(e) => setFormProvider(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cpd-date">Date</Label>
                  <Input
                    id="cpd-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpd-desc">Description</Label>
                  <Input
                    id="cpd-desc"
                    placeholder="Brief description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
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
                Log Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Circular Progress Card */}
        <Card className="border-emerald-500/20 md:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Annual CPD Progress</CardTitle>
            <CardDescription>2024/2025 CPD Cycle</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <CircularProgress value={Math.round(totalPoints)} max={annualTarget} />
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-emerald-600">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {annualTarget - totalPoints > 0
                  ? `${Math.round(annualTarget - totalPoints)} points remaining to meet annual requirement`
                  : 'Annual requirement met!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Target className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(totalPoints)}</p>
              <p className="text-sm text-muted-foreground">Total Points Earned</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <TrendingUp className="size-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{cpdRecords.length}</p>
              <p className="text-sm text-muted-foreground">Activities Logged</p>
            </div>
          </CardContent>
        </Card>

        {/* Points Breakdown Pie Chart */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Points Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pointsByType.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <GraduationCap className="size-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No CPD activities yet</p>
                <p className="text-sm">Log your first activity to see the breakdown</p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pointsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pointsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} points`, '']}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {pointsByType.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm flex-1">{item.name}</span>
                      <span className="text-sm font-semibold">{item.value} pts</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalPoints > 0 ? Math.round((item.value / totalPoints) * 100) : 0}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...CPD_TYPES].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          {cpdRecords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <GraduationCap className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No CPD activities yet</p>
              <p className="text-sm">Log your first activity to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Provider</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {typeIcon(activity.activityType)}
                        <span className="text-sm">{activity.activityType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">{activity.cpdPoints}</span>
                      <span className="text-xs text-muted-foreground ml-1">pts</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(activity.dateCompleted)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {activity.provider || '—'}
                    </TableCell>
                    <TableCell>
                      {activity.isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 gap-1">
                          <CheckCircle2 className="size-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 gap-1">
                          <Clock className="size-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {cpdRecords.length > 0 && filteredActivities.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <GraduationCap className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No CPD activities found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
