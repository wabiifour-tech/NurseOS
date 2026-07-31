'use client'

/**
 * Lecturer Shared Materials Page
 *
 * Shows materials this lecturer has shared with others (sent) AND
 * materials other lecturers have shared with them (received).
 * Received materials can be accepted, rejected, or copied into the lecturer's own institution.
 */

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Share2,
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  Copy,
  Inbox,
  Send,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

interface Share {
  id: string
  status: string  // PENDING | ACCEPTED | REJECTED | EXPIRED
  message: string | null
  createdAt: string
  acceptedAt: string | null
  rejectedAt: string | null
  copiedToMaterialId: string | null
  recipientEmail: string
  material: {
    id: string
    title: string
    description: string | null
    type: string
    level: number
    courseCode: string | null
    courseTitle: string | null
    fileName: string | null
    fileSize: number | null
    externalUrl: string | null
    fileUrl: string | null
    facility: { id: string; name: string; type: string } | null
  }
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
    facility: { name: string } | null
  } | null
  recipient: {
    id: string
    firstName: string
    lastName: string
    email: string
    facility: { name: string } | null
  } | null
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 border-amber-500/30',
  ACCEPTED: 'text-emerald-600 border-emerald-500/30',
  REJECTED: 'text-destructive border-destructive/30',
  EXPIRED: 'text-muted-foreground border-muted-foreground/30',
}

export default function LecturerSharedPage() {
  const [direction, setDirection] = React.useState<'received' | 'sent'>('received')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [shares, setShares] = React.useState<Share[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actioningId, setActioningId] = React.useState<string | null>(null)

  async function fetchShares() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ direction })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/course-materials/shared?${params.toString()}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setShares(data.shares || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load shared materials')
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchShares()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, statusFilter])

  async function handleAction(shareId: string, action: 'ACCEPT' | 'REJECT' | 'COPY', newLevel?: number) {
    setActioningId(shareId)
    try {
      const res = await fetch(`/api/course-materials/shared/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, newLevel }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Action failed')
        return
      }
      if (action === 'ACCEPT') toast.success('Share accepted — you can now view the material')
      else if (action === 'REJECT') toast.success('Share rejected')
      else if (action === 'COPY') toast.success('Material copied to your institution successfully')
      fetchShares()
    } catch (e: any) {
      toast.error('Action failed: ' + (e.message || 'Unknown error'))
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Share2 className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Materials</h1>
          <p className="text-sm text-muted-foreground">
            Materials shared with you by other lecturers, and materials you&apos;ve shared with others.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Direction</label>
            <Select value={direction} onValueChange={(v) => setDirection(v as 'received' | 'sent')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="received">
                  <Inbox className="size-3.5 mr-1.5 inline" /> Received (shared with me)
                </SelectItem>
                <SelectItem value="sent">
                  <Send className="size-3.5 mr-1.5 inline" /> Sent (I shared with others)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : shares.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Share2 className="size-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {direction === 'received'
                ? 'No materials have been shared with you yet.'
                : 'You haven\'t shared any materials with other lecturers yet.'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {direction === 'received'
                ? 'When another lecturer shares a material with you, it will appear here.'
                : 'Go to "My Materials" and click the share icon next to any material to share it.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {shares.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{s.material.title}</h3>
                      <Badge variant="outline" className={STATUS_COLORS[s.status] || ''}>
                        {s.status}
                      </Badge>
                      {s.copiedToMaterialId && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                          <CheckCircle2 className="size-2.5 mr-1" />Copied to your institution
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1.5">
                        <Building2 className="size-3" />
                        {direction === 'received' ? (
                          <>From <strong>{s.sender?.firstName} {s.sender?.lastName}</strong> ({s.sender?.facility?.name || 'Unknown institution'})</>
                        ) : (
                          <>To <strong>{s.recipient?.firstName} {s.recipient?.lastName}</strong> ({s.recipient?.facility?.name || 'Unknown institution'})</>
                        )}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        Shared on {formatDate(s.createdAt)}
                        {s.acceptedAt && ` · Accepted ${formatDate(s.acceptedAt)}`}
                        {s.rejectedAt && ` · Rejected ${formatDate(s.rejectedAt)}`}
                      </p>
                      {s.material.courseCode && (
                        <p>{s.material.courseCode}{s.material.courseTitle ? ` — ${s.material.courseTitle}` : ''} · {s.material.level} Level · {s.material.type}</p>
                      )}
                    </div>
                  </div>
                </div>
                {s.message && (
                  <div className="text-sm bg-muted/30 p-2 rounded text-muted-foreground italic mb-2">
                    &quot;{s.message}&quot;
                  </div>
                )}
                {/* Actions */}
                {direction === 'received' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAction(s.id, 'ACCEPT')}
                          disabled={actioningId === s.id}
                        >
                          {actioningId === s.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(s.id, 'REJECT')}
                          disabled={actioningId === s.id}
                        >
                          <XCircle className="size-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {s.status === 'ACCEPTED' && !s.copiedToMaterialId && (
                      <>
                        {s.material.fileUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const win = window.open()
                              if (win) {
                                win.document.write(`<iframe src="${s.material.fileUrl}" style="width:100%;height:100vh;border:0;" allowfullscreen></iframe>`)
                              }
                            }}
                          >
                            <ExternalLink className="size-3.5 mr-1" /> View Original
                          </Button>
                        ) : s.material.externalUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(s.material.externalUrl!, '_blank', 'noopener,noreferrer')}
                          >
                            <ExternalLink className="size-3.5 mr-1" /> Open Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleAction(s.id, 'COPY')}
                          disabled={actioningId === s.id}
                        >
                          {actioningId === s.id ? <Loader2 className="size-3.5 mr-1 animate-spin" /> : <Copy className="size-3.5 mr-1" />}
                          Copy to My Institution
                        </Button>
                      </>
                    )}
                    {s.copiedToMaterialId && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                        Available in your &quot;My Materials&quot; dashboard
                      </Badge>
                    )}
                  </div>
                )}
                {direction === 'sent' && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {s.status === 'PENDING' && 'Waiting for recipient to accept.'}
                    {s.status === 'ACCEPTED' && !s.copiedToMaterialId && 'Recipient accepted — they can copy this material to their institution.'}
                    {s.status === 'ACCEPTED' && s.copiedToMaterialId && 'Recipient copied this material to their institution.'}
                    {s.status === 'REJECTED' && 'Recipient declined this share.'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
