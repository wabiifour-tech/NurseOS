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
import { Textarea } from '@/components/ui/textarea'
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
  Star,
  GripVertical,
  Trophy,
  BookOpen,
  Briefcase,
  Award,
  Users,
  Heart,
  Calendar,
  ExternalLink,
  Sparkles,
  Filter,
} from 'lucide-react'
import { portfolioEntries, portfolioTypes } from '@/lib/nurseid-data'

export default function PortfolioPage() {
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [entries, setEntries] = React.useState(portfolioEntries)

  const filteredEntries =
    typeFilter === 'All'
      ? entries
      : entries.filter((e) => e.type === typeFilter)

  const typeIcon = (type: string) => {
    switch (type) {
      case 'Project':
        return <Briefcase className="size-4 text-emerald-600" />
      case 'Publication':
        return <BookOpen className="size-4 text-teal-600" />
      case 'Award':
        return <Trophy className="size-4 text-amber-600" />
      case 'Certification':
        return <Award className="size-4 text-purple-600" />
      case 'Leadership Role':
        return <Users className="size-4 text-blue-600" />
      default:
        return <Briefcase className="size-4" />
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'Project':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
      case 'Publication':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20'
      case 'Award':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
      case 'Certification':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20'
      case 'Leadership Role':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
      default:
        return ''
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground text-sm">
            Showcase your professional achievements and impact
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="size-4 mr-2" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Portfolio Entry</DialogTitle>
              <DialogDescription>
                Add a new achievement to your professional portfolio
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entry-title">Title</Label>
                <Input id="entry-title" placeholder="e.g., Hospital Management System Implementation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Entry Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolioTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="impact">Impact Metrics</Label>
                  <Input id="impact" placeholder="e.g., 5,000+ patients impacted" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your achievement..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddDialogOpen(false)}>
                Add Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {['All', ...portfolioTypes].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              className={
                typeFilter === type
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : ''
              }
              onClick={() => setTypeFilter(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntries.map((entry, index) => (
          <Card
            key={entry.id}
            className={`group transition-all hover:shadow-md ${
              entry.featured ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-muted-foreground/50 cursor-grab">
                  <GripVertical className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.featured && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 gap-1">
                        <Sparkles className="size-3" /> Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className={typeColor(entry.type)}>
                      {typeIcon(entry.type)}
                      <span className="ml-1">{entry.type}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{entry.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
              
              {/* Impact Metrics */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <Heart className="size-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {entry.impactMetrics}
                </span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                {entry.startDate} — {entry.endDate || 'Present'}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {entry.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Briefcase className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No portfolio entries found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
