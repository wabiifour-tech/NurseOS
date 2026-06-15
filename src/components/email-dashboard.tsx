'use client'

/**
 * Super Admin Email Dashboard Component
 * Manages email sending, broadcasting, and history viewing.
 */

import * as React from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Radio,
} from 'lucide-react'

/* ─── Types ─── */
interface EmailRow {
  id: string
  toEmail: string
  fromEmail: string
  subject: string
  templateId: string | null
  status: string
  providerId: string | null
  error: string | null
  sentAt: string | null
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; email: string }
  recipient: { id: string; firstName: string; lastName: string; email: string }
}

interface EmailStats {
  total: number
  sent: number
  failed: number
  pending: number
  recentSent: number
}

/* ─── Helpers ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColorMap: Record<string, string> = {
  SENT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
  BOUNCED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

const statusIconMap: Record<string, React.ReactNode> = {
  SENT: <CheckCircle2 className="size-3.5" />,
  DELIVERED: <CheckCircle2 className="size-3.5" />,
  PENDING: <Clock className="size-3.5" />,
  FAILED: <XCircle className="size-3.5" />,
  BOUNCED: <AlertTriangle className="size-3.5" />,
}

const TEMPLATE_OPTIONS = [
  { value: 'custom', label: 'Custom Message' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'user-approved', label: 'User Approved' },
  { value: 'user-rejected', label: 'User Rejected' },
  { value: 'facility-approved', label: 'Facility Approved' },
  { value: 'facility-rejected', label: 'Facility Rejected' },
  { value: 'subscription-verified', label: 'Subscription Verified' },
  { value: 'announcement', label: 'Announcement' },
]

/* ─── Main Component ─── */
interface EmailDashboardProps {
  user: any
  token: string | null
}

export function EmailDashboard({ user, token }: EmailDashboardProps) {
  /* ─── State ─── */
  const [subTab, setSubTab] = React.useState<'compose' | 'broadcast' | 'history'>('compose')
  const [stats, setStats] = React.useState<EmailStats>({ total: 0, sent: 0, failed: 0, pending: 0, recentSent: 0 })
  const [isLoadingStats, setIsLoadingStats] = React.useState(true)

  // History
  const [emails, setEmails] = React.useState<EmailRow[]>([])
  const [isLoadingEmails, setIsLoadingEmails] = React.useState(false)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [historyTotal, setHistoryTotal] = React.useState(0)
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Compose email
  const [isSending, setIsSending] = React.useState(false)
  const [recipientSearch, setRecipientSearch] = React.useState('')
  const [recipientResults, setRecipientResults] = React.useState<any[]>([])
  const [selectedRecipient, setSelectedRecipient] = React.useState<any>(null)
  const [composeSubject, setComposeSubject] = React.useState('')
  const [composeTemplate, setComposeTemplate] = React.useState('custom')
  const [composeMessage, setComposeMessage] = React.useState('')
  const [composeCtaUrl, setComposeCtaUrl] = React.useState('')
  const [composeCtaLabel, setComposeCtaLabel] = React.useState('')

  // Broadcast
  const [isBroadcasting, setIsBroadcasting] = React.useState(false)
  const [broadcastRole, setBroadcastRole] = React.useState('ALL')
  const [broadcastSubject, setBroadcastSubject] = React.useState('')
  const [broadcastTemplate, setBroadcastTemplate] = React.useState('announcement')
  const [broadcastMessage, setBroadcastMessage] = React.useState('')

  /* ─── Auth headers helper ─── */
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  /* ─── Fetch Stats ─── */
  const fetchStats = React.useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const res = await fetch('/api/email/stats', { headers: getHeaders() })
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch (error) {
      console.error('Error fetching email stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [token])

  /* ─── Fetch History ─── */
  const fetchHistory = React.useCallback(async () => {
    setIsLoadingEmails(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(historyPage))
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/email/history?${params.toString()}`, { headers: getHeaders() })
      const data = await res.json()
      if (res.ok) {
        setEmails(data.emails || [])
        setHistoryTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching email history:', error)
    } finally {
      setIsLoadingEmails(false)
    }
  }, [historyPage, statusFilter, searchQuery, token])

  /* ─── Search Recipients ─── */
  const searchRecipients = React.useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setRecipientResults([])
      return
    }
    try {
      const params = new URLSearchParams()
      params.set('search', query)
      params.set('limit', '10')
      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: getHeaders() })
      const data = await res.json()
      if (res.ok) setRecipientResults(data.users || [])
    } catch (error) {
      console.error('Error searching recipients:', error)
    }
  }, [token])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  React.useEffect(() => {
    if (subTab === 'history') fetchHistory()
  }, [subTab, fetchHistory])

  React.useEffect(() => {
    const timer = setTimeout(() => searchRecipients(recipientSearch), 300)
    return () => clearTimeout(timer)
  }, [recipientSearch, searchRecipients])

  /* ─── Send Single Email ─── */
  const handleSendEmail = async () => {
    if (!selectedRecipient || !composeSubject) {
      toast.error('Please select a recipient and enter a subject')
      return
    }
    setIsSending(true)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          recipientId: selectedRecipient.id,
          subject: composeSubject,
          templateId: composeTemplate,
          message: composeMessage,
          ctaUrl: composeCtaUrl || undefined,
          ctaLabel: composeCtaLabel || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send email')
        return
      }

      toast.success(data.message || 'Email sent successfully')
      // Reset form
      setSelectedRecipient(null)
      setRecipientSearch('')
      setComposeSubject('')
      setComposeMessage('')
      setComposeCtaUrl('')
      setComposeCtaLabel('')
      fetchStats()
    } catch (error) {
      console.error('Send email error:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  /* ─── Broadcast Email ─── */
  const handleBroadcast = async () => {
    if (!broadcastSubject) {
      toast.error('Please enter a subject')
      return
    }
    setIsBroadcasting(true)
    try {
      const body: any = {
        subject: broadcastSubject,
        templateId: broadcastTemplate,
        message: broadcastMessage,
      }

      if (broadcastRole && broadcastRole !== 'ALL') {
        body.roleFilter = broadcastRole
      }

      const res = await fetch('/api/email/broadcast', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to broadcast')
        return
      }

      toast.success(data.message || `Broadcast sent to ${data.totalSent} users`)
      setBroadcastSubject('')
      setBroadcastMessage('')
      fetchStats()
    } catch (error) {
      console.error('Broadcast error:', error)
      toast.error('Failed to broadcast email')
    } finally {
      setIsBroadcasting(false)
    }
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Mail className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sent</p>
                <p className="text-xl font-bold">{isLoadingStats ? '...' : stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-xl font-bold">{isLoadingStats ? '...' : stats.recentSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{isLoadingStats ? '...' : stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold">{isLoadingStats ? '...' : stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-1.5 border-b border-border pb-0">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'broadcast', label: 'Broadcast', icon: Radio },
          { id: 'history', label: 'History', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* COMPOSE TAB */}
      {subTab === 'compose' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Compose Email</CardTitle>
            </div>
            <CardDescription>
              Send an email to a specific user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Recipient Search */}
            <div className="space-y-2">
              <Label>Recipient</Label>
              {selectedRecipient ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 text-sm font-bold">
                    {selectedRecipient.firstName?.[0]}{selectedRecipient.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedRecipient.firstName} {selectedRecipient.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedRecipient.email} · {selectedRecipient.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:text-red-700"
                    onClick={() => { setSelectedRecipient(null); setRecipientSearch('') }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-9"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                  />
                  {recipientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {recipientResults.map((u: any) => (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center gap-3"
                          onClick={() => {
                            setSelectedRecipient(u)
                            setRecipientResults([])
                            setRecipientSearch('')
                          }}
                        >
                          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 text-xs font-bold">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject line"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select value={composeTemplate} onValueChange={setComposeTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[150px]"
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
              />
            </div>

            {/* CTA (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">CTA URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={composeCtaUrl}
                  onChange={(e) => setComposeCtaUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">CTA Label (optional)</Label>
                <Input
                  placeholder="Go to Dashboard"
                  value={composeCtaLabel}
                  onChange={(e) => setComposeCtaLabel(e.target.value)}
                />
              </div>
            </div>

            {/* Send Button */}
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={handleSendEmail}
              disabled={isSending || !selectedRecipient || !composeSubject}
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* BROADCAST TAB */}
      {subTab === 'broadcast' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Radio className="size-5 text-teal-600" />
              <CardTitle className="text-lg">Broadcast Email</CardTitle>
            </div>
            <CardDescription>
              Send the same email to all users, or filter by role. Max 100 recipients per broadcast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Role Filter */}
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select value={broadcastRole} onValueChange={setBroadcastRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Active Users</SelectItem>
                  <SelectItem value="NURSE">All Nurses</SelectItem>
                  <SelectItem value="ADMIN">All Facility Admins</SelectItem>
                  <SelectItem value="SUPER_ADMIN">All Super Admins</SelectItem>
                  <SelectItem value="PATIENT">All Patients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Broadcast subject line"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
              />
            </div>

            {/* Template */}
            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select value={broadcastTemplate} onValueChange={setBroadcastTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your broadcast message here..."
                className="min-h-[200px]"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>

            {/* Warning */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>⚠ Note:</strong> Broadcasts are sent one at a time (500ms delay between each)
                to respect email provider rate limits. This may take a few minutes for large lists.
                Each email is individually logged in the History tab.
              </p>
            </div>

            {/* Send Button */}
            <Button
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastSubject}
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Radio className="size-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* HISTORY TAB */}
      {subTab === 'history' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-emerald-600" />
                <CardTitle className="text-lg">Email History</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                onClick={fetchHistory}
              >
                <RefreshCw className="size-3.5 mr-1" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              View all emails sent from the platform
            </CardDescription>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject or email..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="BOUNCED">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEmails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-emerald-500" />
                <span className="ml-3 text-muted-foreground">Loading emails...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No emails found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send your first email from the Compose tab.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {email.recipient.firstName} {email.recipient.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{email.toEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {email.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {email.templateId || 'custom'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] gap-1 ${statusColorMap[email.status] || ''}`}
                            >
                              {statusIconMap[email.status]}
                              {email.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(email.sentAt || email.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                  <span>
                    Page {historyPage} · {historyTotal} total emails
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={emails.length < 50}
                      onClick={() => setHistoryPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {stats.total === 0 && (
        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="size-4 text-blue-600" />
              Email Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>To start sending real emails, you need to configure Resend:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Create a free account</strong> at{' '}
                <a href="https://resend.com" target="_blank" className="text-emerald-600 underline">
                  resend.com
                </a>{' '}
                (100 free emails/day)
              </li>
              <li>
                <strong>Add & verify your domain</strong> in the Resend dashboard, or use their
                built-in <code className="bg-muted px-1 rounded">onboarding@resend.dev</code> for testing
              </li>
              <li>
                <strong>Generate an API key</strong> at{' '}
                <a href="https://resend.com/api-keys" target="_blank" className="text-emerald-600 underline">
                  resend.com/api-keys
                </a>
              </li>
              <li>
                <strong>Add environment variables</strong> to your Vercel project:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><code className="bg-muted px-1 rounded">RESEND_API_KEY</code> = your API key</li>
                  <li><code className="bg-muted px-1 rounded">EMAIL_FROM</code> = NurseOS &lt;your@email.com&gt;</li>
                  <li><code className="bg-muted px-1 rounded">EMAIL_REPLY_TO</code> = support@yourdomain.com</li>
                </ul>
              </li>
              <li>
                <strong>Set up webhooks</strong> (optional) at{' '}
                <a href="https://resend.com/webhooks" target="_blank" className="text-emerald-600 underline">
                  resend.com/webhooks
                </a>{' '}
                pointing to <code className="bg-muted px-1 rounded">/api/email/webhook</code>
              </li>
            </ol>
            <p className="text-xs">
              Until the API key is configured, all emails will be logged with PENDING status but not actually sent.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
