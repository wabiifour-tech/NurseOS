'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Megaphone,
  Plus,
  Loader2,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  GraduationCap,
  Wrench,
  Zap,
  Pin,
  Clock,
  Eye,
  CheckCheck,
  Building2,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnnouncementItem {
  id: string
  title: string
  content: string
  priority: string
  category: string
  isPinned: boolean
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  targetScope?: string  // ALL | LEVEL | LECTURERS | STUDENTS
  targetLevel?: number | null
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    role: string
    academicRole?: string | null
  }
  facility: {
    id: string
    name: string
  } | null
  isRead: boolean
  readCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const priorityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  URGENT: { icon: Zap, color: 'text-red-600 bg-red-50 border-red-200', label: 'Urgent' },
  HIGH: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'High' },
  NORMAL: { icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Normal' },
  LOW: { icon: Bell, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Low' },
}

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  GENERAL: { icon: Bell, label: 'General' },
  POLICY: { icon: Shield, label: 'Policy' },
  SAFETY: { icon: AlertTriangle, label: 'Safety' },
  TRAINING: { icon: GraduationCap, label: 'Training' },
  MAINTENANCE: { icon: Wrench, label: 'Maintenance' },
  EMERGENCY: { icon: AlertCircle, label: 'Emergency' },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { token, user } = useAuthStore()
  const { fetchUnreadCount } = useNotifications(30000)

  const [announcements, setAnnouncements] = React.useState<AnnouncementItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [filterCategory, setFilterCategory] = React.useState('all')
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  // Create form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formContent, setFormContent] = React.useState('')
  const [formPriority, setFormPriority] = React.useState('NORMAL')
  const [formCategory, setFormCategory] = React.useState('GENERAL')
  const [formIsPinned, setFormIsPinned] = React.useState(false)
  const [formExpiresAt, setFormExpiresAt] = React.useState('')
  // Academic targeting — level / scope
  const [formTargetScope, setFormTargetScope] = React.useState('ALL')
  const [formTargetLevel, setFormTargetLevel] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isLecturer = user?.academicRole === 'LECTURER'
  const isStudent = user?.academicRole === 'STUDENT'
  const canCreate = isAdmin || isLecturer
  const isAcademicInstitution = isAdmin || isLecturer || isStudent

  const headers = React.useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }, [token])

  // Fetch announcements
  const fetchAnnouncements = React.useCallback(async () => {
    try {
      const res = await fetch('/api/announcements?limit=50', { headers })
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [headers])

  React.useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // Refresh periodically
  React.useEffect(() => {
    const interval = setInterval(fetchAnnouncements, 60000)
    return () => clearInterval(interval)
  }, [fetchAnnouncements])

  // Mark as read
  const markAsRead = React.useCallback(async (announcementId: string) => {
    try {
      await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers,
      })
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, isRead: true } : a))
      )
      fetchUnreadCount()
    } catch {
      // silent
    }
  }, [headers, fetchUnreadCount])

  // Create announcement
  const createAnnouncement = React.useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Title and content are required')
      return
    }
    // If scope is LEVEL, targetLevel must be set
    if (formTargetScope === 'LEVEL' && !formTargetLevel) {
      toast.error('Please select a target level for level-specific announcements')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          priority: formPriority,
          category: formCategory,
          isPinned: formIsPinned,
          expiresAt: formExpiresAt || null,
          targetScope: formTargetScope,
          targetLevel: formTargetScope === 'LEVEL' ? Number(formTargetLevel) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to create announcement')
        return
      }
      toast.success('Announcement created successfully')
      setShowCreateDialog(false)
      setFormTitle('')
      setFormContent('')
      setFormPriority('NORMAL')
      setFormCategory('GENERAL')
      setFormIsPinned(false)
      setFormExpiresAt('')
      setFormTargetScope('ALL')
      setFormTargetLevel('')
      await fetchAnnouncements()
      await fetchUnreadCount()
    } catch {
      toast.error('Failed to create announcement')
    } finally {
      setCreating(false)
    }
  }, [formTitle, formContent, formPriority, formCategory, formIsPinned, formExpiresAt, formTargetScope, formTargetLevel, headers, fetchAnnouncements, fetchUnreadCount])

  // Filter announcements
  const filtered = React.useMemo(() => {
    if (filterCategory === 'all') return announcements
    return announcements.filter((a) => a.category === filterCategory)
  }, [announcements, filterCategory])

  const unreadCount = announcements.filter((a) => !a.isRead).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="size-6 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">
              Stay updated with facility and system-wide announcements
              {unreadCount > 0 && (
                <span className="ml-2 text-emerald-600 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </div>

        {canCreate && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="size-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  {isLecturer
                    ? 'Create an announcement for students and lecturers at your institution. Target by level for level-specific news.'
                    : user?.role === 'SUPER_ADMIN'
                    ? 'Create a system-wide or facility-specific announcement. System-wide announcements are visible to all users.'
                    : 'Create an announcement for your facility. All staff at your facility will be notified.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input
                  placeholder="Announcement title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Write your announcement content here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={5}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Priority</label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="POLICY">Policy</SelectItem>
                        <SelectItem value="SAFETY">Safety</SelectItem>
                        <SelectItem value="TRAINING">Training</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Target audience — only show for academic institutions */}
                {isAcademicInstitution && (
                  <div className="space-y-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <label className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                      <GraduationCap className="size-3.5" />
                      Target Audience
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={formTargetScope} onValueChange={setFormTargetScope}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Everyone (all levels + lecturers)</SelectItem>
                          <SelectItem value="LEVEL">Specific Level</SelectItem>
                          <SelectItem value="LECTURERS">Lecturers only</SelectItem>
                          <SelectItem value="STUDENTS">Students only (all levels)</SelectItem>
                        </SelectContent>
                      </Select>
                      {formTargetScope === 'LEVEL' && (
                        <Select value={formTargetLevel} onValueChange={setFormTargetLevel}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">100 Level</SelectItem>
                            <SelectItem value="200">200 Level</SelectItem>
                            <SelectItem value="300">300 Level</SelectItem>
                            <SelectItem value="400">400 Level</SelectItem>
                            <SelectItem value="500">500 Level</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Only the selected audience will see this announcement in their feed and receive a notification.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <label htmlFor="isPinned" className="text-sm">Pin to top</label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Expires (optional)</label>
                    <Input
                      type="datetime-local"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={createAnnouncement}
                  disabled={creating || !formTitle.trim() || !formContent.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Publish Announcement'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          className={filterCategory === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          onClick={() => setFilterCategory('all')}
        >
          All
        </Button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={filterCategory === key ? 'default' : 'outline'}
            size="sm"
            className={filterCategory === key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            onClick={() => setFilterCategory(key)}
          >
            <config.icon className="size-3.5 mr-1" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 text-emerald-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="size-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No announcements</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {isAdmin ? 'Create your first announcement to notify your staff.' : 'Check back later for updates from your administrators.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((announcement) => {
            const pConfig = priorityConfig[announcement.priority] || priorityConfig.NORMAL
            const cConfig = categoryConfig[announcement.category] || categoryConfig.GENERAL
            const PriorityIcon = pConfig.icon
            const isExpanded = expandedId === announcement.id

            return (
              <div
                key={announcement.id}
                className={`rounded-lg border p-4 transition-all ${
                  !announcement.isRead
                    ? 'border-emerald-200 bg-emerald-50/30 shadow-sm'
                    : 'border-border bg-white'
                } ${announcement.isPinned ? 'ring-1 ring-amber-200' : ''}`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  {/* Priority badge */}
                  <div className={`shrink-0 p-1.5 rounded-lg border ${pConfig.color}`}>
                    <PriorityIcon className="size-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-semibold ${!announcement.isRead ? 'text-slate-900' : 'text-slate-700'}`}
                      >
                        {announcement.title}
                      </h3>
                      {announcement.isPinned && (
                        <Pin className="size-3 text-amber-500" />
                      )}
                      {!announcement.isRead && (
                        <span className="size-2 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                        <cConfig.icon className="size-2.5" />
                        {cConfig.label}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${pConfig.color}`}>
                        {pConfig.label}
                      </Badge>
                      {announcement.targetScope && announcement.targetScope !== 'ALL' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 text-emerald-700 border-emerald-500/30 bg-emerald-50/50">
                          <GraduationCap className="size-2.5" />
                          {announcement.targetScope === 'LEVEL' ? `${announcement.targetLevel} Level only`
                            : announcement.targetScope === 'LECTURERS' ? 'Lecturers only'
                            : announcement.targetScope === 'STUDENTS' ? 'Students only'
                            : announcement.targetScope}
                        </Badge>
                      )}
                      {announcement.facility ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Building2 className="size-3" />
                          {announcement.facility.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                          <Globe className="size-3" />
                          System-wide
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatRelativeTime(announcement.createdAt)}
                      </span>
                    </div>

                    {/* Content preview / full */}
                    <div className="mt-2">
                      <p className={`text-sm text-slate-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                        {announcement.content}
                      </p>
                      {announcement.content.length > 150 && (
                        <button
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1"
                          onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-5 border border-emerald-500/20">
                            <AvatarFallback className="bg-emerald-500/15 text-emerald-700 text-[8px] font-semibold">
                              {announcement.author.firstName.charAt(0)}{announcement.author.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {announcement.author.firstName} {announcement.author.lastName}
                          </span>
                        </div>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {announcement.readCount}
                        </span>
                      </div>
                      {!announcement.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-600 hover:text-emerald-700 h-6 px-2"
                          onClick={() => markAsRead(announcement.id)}
                        >
                          <CheckCheck className="size-3 mr-1" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
