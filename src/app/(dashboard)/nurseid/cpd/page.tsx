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
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { cpdActivities, cpdTypes, cpdPointsByType } from '@/lib/nurseid-data'

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
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)

  const totalEarned = cpdActivities.reduce((sum, a) => sum + a.points, 0)
  const annualTarget = 60
  const progressPercent = Math.min((totalEarned / annualTarget) * 100, 100)

  const filteredActivities = cpdActivities.filter((a) => {
    const matchesType = typeFilter === 'All' || a.type === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.provider.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                <Input id="cpd-title" placeholder="e.g., Advanced Wound Care Workshop" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Activity Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cpdTypes.filter((t) => t !== 'All').map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpd-points">CPD Points</Label>
                  <Input id="cpd-points" type="number" placeholder="e.g., 5" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cpd-provider">Provider</Label>
                <Input id="cpd-provider" placeholder="e.g., NurseOS Academy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cpd-date">Date</Label>
                  <Input id="cpd-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpd-desc">Description</Label>
                  <Input id="cpd-desc" placeholder="Brief description" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddDialogOpen(false)}>
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
            <CircularProgress value={totalEarned} max={annualTarget} />
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-emerald-600">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {annualTarget - totalEarned > 0
                  ? `${annualTarget - totalEarned} points remaining to meet annual requirement`
                  : 'Annual requirement met! 🎉'}
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
              <p className="text-2xl font-bold text-emerald-600">{totalEarned}</p>
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
              <p className="text-2xl font-bold text-teal-600">{cpdActivities.length}</p>
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
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cpdPointsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cpdPointsByType.map((entry, index) => (
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
                {cpdPointsByType.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm flex-1">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value} pts</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((item.value / totalEarned) * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
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
                {cpdTypes.map((type) => (
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
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {typeIcon(activity.type)}
                      <span className="text-sm">{activity.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-emerald-600">{activity.points}</span>
                    <span className="text-xs text-muted-foreground ml-1">pts</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {activity.date}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {activity.provider}
                  </TableCell>
                  <TableCell>
                    {activity.status === 'Verified' ? (
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
          {filteredActivities.length === 0 && (
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
