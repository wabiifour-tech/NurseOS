'use client'

/**
 * Lecturer Materials Dashboard
 *
 * Lecturers at UNIVERSITY or SCHOOL_OF_NURSING institutions can:
 *   - Upload slides, documents, PowerPoints, PDFs, or links (single or bulk ZIP)
 *   - Tag each upload with a level (100-500)
 *   - Schedule materials to auto-publish at a future date
 *   - View, search, and delete their previously uploaded materials
 *   - See download counts + view counts + comment counts per material
 *   - View per-material analytics (per-student view history, daily trend, peak hour)
 *   - Share materials with lecturers at other institutions
 *   - View and respond to student Q&A comments
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Trash2,
  Search,
  Loader2,
  Download,
  Calendar,
  BookOpen,
  GraduationCap,
  AlertCircle,
  ExternalLink,
  File,
  FileType,
  Presentation,
  Filter,
  BarChart3,
  Share2,
  MessageSquare,
  Clock,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Archive,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface Material {
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
  downloadCount: number
  viewCount: number
  publishAt: string | null
  createdAt: string
  uploader: { id: string; firstName: string; lastName: string }
  _count?: { comments: number; downloads: number; views: number }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  isLecturerResponse: boolean
  isResolved: boolean
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    academicRole: string | null
  }
  replies?: Comment[]
}

interface Analytics {
  material: { id: string; title: string; level: number }
  summary: {
    totalViews: number
    uniqueViewers: number
    totalDownloads: number
    uniqueDownloaders: number
    downloadRate: number
  }
  dailyTrend: Array<{ date: string; views: number }>
  peakHour: number
  studentBreakdown: Array<{
    userId: string
    name: string
    email: string
    studentLevel: number | null
    viewCount: number
    firstViewedAt: string
    lastViewedAt: string
    downloaded: boolean
  }>
}

const LEVELS = [100, 200, 300, 400, 500]
const TYPES = [
  { value: 'SLIDE', label: 'Slides', icon: Presentation },
  { value: 'DOCUMENT', label: 'Document', icon: FileText },
  { value: 'POWERPOINT', label: 'PowerPoint', icon: Presentation },
  { value: 'PDF', label: 'PDF', icon: FileType },
  { value: 'LINK', label: 'External Link', icon: LinkIcon },
]

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

function getTypeMeta(type: string) {
  return TYPES.find((t) => t.value === type) || TYPES[0]
}

export default function LecturerMaterialsPage() {
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [levelFilter, setLevelFilter] = React.useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [isBulkOpen, setIsBulkOpen] = React.useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false)
  const [isShareOpen, setIsShareOpen] = React.useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [activeMaterial, setActiveMaterial] = React.useState<Material | null>(null)
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false)
  const [comments, setComments] = React.useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = React.useState(false)
  const [newComment, setNewComment] = React.useState('')
  const [expandedComments, setExpandedComments] = React.useState<Set<string>>(new Set())
  const [replyText, setReplyText] = React.useState<Record<string, string>>({})

  // Upload form state
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    type: 'PDF',
    level: '100',
    courseCode: '',
    courseTitle: '',
    externalUrl: '',
    publishAt: '',  // ISO datetime-local string
  })
  const [file, setFile] = React.useState<File | null>(null)

  // Bulk upload state
  const [bulkForm, setBulkForm] = React.useState({
    level: '100',
    courseCode: '',
    courseTitle: '',
    publishAt: '',
  })
  const [bulkFiles, setBulkFiles] = React.useState<File[]>([])

  // Share form state
  const [shareForm, setShareForm] = React.useState({
    recipientEmail: '',
    message: '',
  })
  const [isSharing, setIsSharing] = React.useState(false)

  async function fetchMaterials() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (levelFilter !== 'all') params.set('level', levelFilter)
      // Lecturers see their own uploads + scheduled (future-dated) ones too
      params.set('includeScheduled', 'true')
      const res = await fetch(`/api/course-materials?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      } else if (res.status === 403) {
        toast.error('Only lecturers can access this page.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMaterials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter])

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => fetchMaterials(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function resetForm() {
    setForm({
      title: '',
      description: '',
      type: 'PDF',
      level: '100',
      courseCode: '',
      courseTitle: '',
      externalUrl: '',
      publishAt: '',
    })
    setFile(null)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.level) {
      toast.error('Title and level are required')
      return
    }

    if (form.type === 'LINK' && !form.externalUrl.trim()) {
      toast.error('External URL is required for link materials')
      return
    }

    if (form.type !== 'LINK' && !file) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        level: Number(form.level),
        courseCode: form.courseCode.trim() || null,
        courseTitle: form.courseTitle.trim() || null,
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null,
      }

      if (form.type === 'LINK') {
        payload.externalUrl = form.externalUrl.trim()
      } else if (file) {
        const SMALL_FILE_LIMIT = 4 * 1024 * 1024  // 4 MB
        if (file.size <= SMALL_FILE_LIMIT) {
          // Small file — upload as base64 data URL (fits within Vercel's 4.5 MB body limit)
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (err) => reject(err)
            reader.readAsDataURL(file)
          })
          payload.fileDataUrl = dataUrl
          payload.fileName = file.name
          payload.fileSize = file.size
          payload.mimeType = file.type
        } else {
          // Large file (>4 MB) — upload directly to Vercel Blob via client-side upload
          // This bypasses Vercel's 4.5 MB serverless body limit entirely
          toast.info(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB) to Vercel Blob...`)

          const { upload } = await import('@vercel/blob/client')

          let blobUrl: string
          try {
            const blob = await upload(file.name, file, {
              access: 'public',
              handleUploadUrl: '/api/course-materials/upload',
            })
            blobUrl = blob.url
          } catch (err: any) {
            // Check if it's a storage-not-configured error
            const errorMsg = err?.message || ''
            if (errorMsg.includes('BLOB_READ_WRITE_TOKEN') || errorMsg.includes('not configured') || errorMsg.includes('STORAGE_NOT_CONFIGURED')) {
              toast.error('Large file uploads not configured', {
                description: 'The administrator must enable Vercel Blob storage to upload files larger than 4 MB. Go to Vercel → Storage → Create Blob Store, then add BLOB_READ_WRITE_TOKEN to env vars.',
                duration: 12000,
              })
            } else {
              toast.error('Upload failed: ' + (errorMsg || 'Unknown error'))
            }
            setIsUploading(false)
            return
          }

          // Use the blob URL in the material creation payload
          payload.fileUrl = blobUrl
          payload.fileName = file.name
          payload.fileSize = file.size
          payload.mimeType = file.type
        }
      }

      const res = await fetch('/api/course-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errorType === 'SUBSCRIPTION_REQUIRED') {
          toast.error('Free trial ended', {
            description: 'Your institution must subscribe to continue uploading materials.',
            duration: 8000,
          })
        } else {
          toast.error(data.error || 'Failed to upload material')
        }
        return
      }

      toast.success(
        form.publishAt
          ? 'Material scheduled successfully — students will see it on the publish date'
          : 'Material uploaded successfully'
      )
      resetForm()
      setIsUploadOpen(false)
      fetchMaterials()
    } catch (e: any) {
      console.error(e)
      toast.error('Upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setIsUploading(false)
    }
  }

  // ─── Bulk upload via ZIP ───
  async function handleBulkUpload(e: React.FormEvent) {
    e.preventDefault()
    if (bulkFiles.length === 0) {
      toast.error('Please select files or a ZIP to extract')
      return
    }
    if (!bulkForm.level) {
      toast.error('Level is required')
      return
    }

    setIsUploading(true)
    try {
      // Convert each file to base64
      const materialsPayload = []
      for (const f of bulkFiles) {
        if (f.size > 4 * 1024 * 1024) {
          toast.error(`"${f.name}" is too large (max 4 MB) — skipping`)
          continue
        }
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (err) => reject(err)
          reader.readAsDataURL(f)
        })
        // Auto-generate title from filename (strip extension + replace dashes/underscores with spaces)
        const title = f.name
          .replace(/\.[^.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase())
        materialsPayload.push({
          title,
          type: '',  // let backend infer from mimeType
          fileDataUrl: dataUrl,
          fileName: f.name,
          fileSize: f.size,
          mimeType: f.type || 'application/octet-stream',
        })
      }

      if (materialsPayload.length === 0) {
        toast.error('No valid files to upload')
        return
      }

      const res = await fetch('/api/course-materials/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: Number(bulkForm.level),
          courseCode: bulkForm.courseCode.trim() || null,
          courseTitle: bulkForm.courseTitle.trim() || null,
          publishAt: bulkForm.publishAt ? new Date(bulkForm.publishAt).toISOString() : null,
          materials: materialsPayload,
        }),
        credentials: 'include',
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Bulk upload failed')
        return
      }

      toast.success(`Bulk upload complete: ${data.successCount} succeeded, ${data.failureCount} failed`, {
        description: data.failureCount > 0 ? 'Some files failed — check the details.' : undefined,
        duration: 8000,
      })

      // Reset
      setBulkFiles([])
      setBulkForm({ level: '100', courseCode: '', courseTitle: '', publishAt: '' })
      setIsBulkOpen(false)
      fetchMaterials()
    } catch (e: any) {
      console.error(e)
      toast.error('Bulk upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setIsUploading(false)
    }
  }

  // ─── ZIP file extraction (client-side, using browser's native DecompressionStream) ───
  async function handleZipFile(zipFile: File) {
    try {
      toast.info(`Extracting ${zipFile.name}...`)
      // We use a simple approach: read the ZIP via a streaming reader.
      // For broad browser support without external libs, we use a minimal ZIP parser.
      const extracted = await extractZipFiles(zipFile)
      setBulkFiles((prev) => [...prev, ...extracted])
      toast.success(`Extracted ${extracted.length} files from ${zipFile.name}`)
    } catch (e: any) {
      console.error(e)
      toast.error(`ZIP extraction failed: ${e.message}. You can still select individual files instead.`)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/course-materials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to delete')
        return
      }
      toast.success('Material deleted')
      fetchMaterials()
    } catch (e) {
      toast.error('Failed to delete material')
    } finally {
      setDeletingId(null)
    }
  }

  // ─── Analytics ───
  async function openAnalytics(material: Material) {
    setActiveMaterial(material)
    setIsAnalyticsOpen(true)
    setAnalytics(null)
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/course-materials/${material.id}/analytics`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to load analytics')
        setIsAnalyticsOpen(false)
      }
    } catch (e) {
      toast.error('Failed to load analytics')
      setIsAnalyticsOpen(false)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // ─── Comments ───
  async function openComments(material: Material) {
    setActiveMaterial(material)
    setIsCommentsOpen(true)
    setComments([])
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/course-materials/${material.id}/comments`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to load comments')
        setIsCommentsOpen(false)
      }
    } catch (e) {
      toast.error('Failed to load comments')
      setIsCommentsOpen(false)
    } finally {
      setCommentsLoading(false)
    }
  }

  async function submitComment(parentId?: string) {
    if (!activeMaterial) return
    const text = parentId ? replyText[parentId]?.trim() : newComment.trim()
    if (!text) return

    try {
      const res = await fetch(`/api/course-materials/${activeMaterial.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, parentId: parentId || null }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to post comment')
        return
      }

      if (parentId) {
        // Add as reply
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), data.comment] }
              : c
          )
        )
        setReplyText((prev) => ({ ...prev, [parentId]: '' }))
      } else {
        setComments((prev) => [...prev, { ...data.comment, replies: [] }])
        setNewComment('')
      }
      toast.success('Comment posted')
    } catch (e: any) {
      toast.error('Failed to post comment: ' + (e.message || 'Unknown error'))
    }
  }

  // ─── Share ───
  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    if (!activeMaterial) return
    if (!shareForm.recipientEmail.trim()) {
      toast.error('Recipient email is required')
      return
    }
    setIsSharing(true)
    try {
      const res = await fetch('/api/course-materials/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: activeMaterial.id,
          recipientEmail: shareForm.recipientEmail.trim(),
          message: shareForm.message.trim() || null,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to share material')
        return
      }
      toast.success(`Material shared with ${data.recipient?.name || shareForm.recipientEmail}`)
      setShareForm({ recipientEmail: '', message: '' })
      setIsShareOpen(false)
    } catch (e: any) {
      toast.error('Failed to share: ' + (e.message || 'Unknown error'))
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <GraduationCap className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Materials</h1>
            <p className="text-sm text-muted-foreground">
              Upload, schedule, share, and analyze your course materials
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Archive className="size-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="size-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => { setIsUploadOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Course Material</DialogTitle>
            <DialogDescription>
              Upload slides, documents, PDFs, or links. Optionally schedule to publish at a future date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., Anatomy of the Cardiovascular System"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Material Type <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <t.icon className="size-3.5 mr-1.5 inline" />
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level <span className="text-destructive">*</span></Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={String(l)}>{l} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="courseCode">Course Code</Label>
                <Input
                  id="courseCode"
                  placeholder="e.g., NUR 201"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="courseTitle">Course Title</Label>
                <Input
                  id="courseTitle"
                  placeholder="e.g., Medical-Surgical Nursing I"
                  value={form.courseTitle}
                  onChange={(e) => setForm({ ...form, courseTitle: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this material covers..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            {/* Schedule publish */}
            <div className="space-y-1.5 p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <Label htmlFor="publishAt" className="text-xs flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-600" />
                Schedule Publish (optional)
              </Label>
              <Input
                id="publishAt"
                type="datetime-local"
                value={form.publishAt}
                onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                If set, students won&apos;t see this material until the chosen date/time. Leave empty to publish immediately.
              </p>
            </div>
            {form.type === 'LINK' ? (
              <div className="space-y-1.5">
                <Label htmlFor="externalUrl">External URL <span className="text-destructive">*</span></Label>
                <Input
                  id="externalUrl"
                  type="url"
                  placeholder="https://example.com/article"
                  value={form.externalUrl}
                  onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="file">File <span className="text-destructive">*</span></Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept={
                    form.type === 'PDF' ? '.pdf' :
                    form.type === 'POWERPOINT' ? '.ppt,.pptx' :
                    form.type === 'SLIDE' ? '.pdf,.ppt,.pptx,.key' :
                    '.pdf,.doc,.docx,.ppt,.pptx,.txt'
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Max size: 4 MB (small files) or up to 500 MB with Vercel Blob configured.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button type="submit" disabled={isUploading} className="bg-emerald-600 hover:bg-emerald-700">
                {isUploading ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="size-4 mr-2" /> Upload</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload — ZIP or Multiple Files</DialogTitle>
            <DialogDescription>
              Select a ZIP file to auto-extract, or select multiple individual files. Each file becomes a separate material with the same level + course code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Level <span className="text-destructive">*</span></Label>
                <Select value={bulkForm.level} onValueChange={(v) => setBulkForm({ ...bulkForm, level: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={String(l)}>{l} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulkCourseCode">Course Code</Label>
                <Input
                  id="bulkCourseCode"
                  placeholder="e.g., NUR 201"
                  value={bulkForm.courseCode}
                  onChange={(e) => setBulkForm({ ...bulkForm, courseCode: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulkCourseTitle">Course Title (applied to all)</Label>
              <Input
                id="bulkCourseTitle"
                placeholder="e.g., Medical-Surgical Nursing I"
                value={bulkForm.courseTitle}
                onChange={(e) => setBulkForm({ ...bulkForm, courseTitle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <Label htmlFor="bulkPublishAt" className="text-xs flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-600" />
                Schedule Publish (optional — applies to all files)
              </Label>
              <Input
                id="bulkPublishAt"
                type="datetime-local"
                value={bulkForm.publishAt}
                onChange={(e) => setBulkForm({ ...bulkForm, publishAt: e.target.value })}
              />
            </div>
            {/* ZIP file input */}
            <div className="space-y-1.5 p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <Label className="text-xs flex items-center gap-1.5">
                <Archive className="size-3.5 text-emerald-600" />
                Extract from ZIP
              </Label>
              <Input
                type="file"
                accept=".zip"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f) await handleZipFile(f)
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Select a .zip file — all files inside will be auto-extracted and added to the list below.
              </p>
            </div>
            {/* Individual files */}
            <div className="space-y-1.5">
              <Label>Or select individual files</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setBulkFiles((prev) => [...prev, ...files])
                }}
                accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              {bulkFiles.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {bulkFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded">
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-muted-foreground ml-2">{formatSize(f.size)}</span>
                      <button
                        type="button"
                        className="ml-2 text-destructive hover:bg-destructive/10 rounded p-0.5"
                        onClick={() => setBulkFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <XCircle className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button type="submit" disabled={isUploading || bulkFiles.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                {isUploading ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Uploading {bulkFiles.length} files...</>
                ) : (
                  <><Upload className="size-4 mr-2" /> Upload {bulkFiles.length} file{bulkFiles.length === 1 ? '' : 's'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analytics — {activeMaterial?.title}</DialogTitle>
            <DialogDescription>
              Per-student view history, daily trend, and download conversion.
            </DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{analytics.summary.totalViews}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Unique Viewers</p>
                  <p className="text-2xl font-bold">{analytics.summary.uniqueViewers}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Downloads</p>
                  <p className="text-2xl font-bold">{analytics.summary.uniqueDownloaders}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Download Rate</p>
                  <p className="text-2xl font-bold">{analytics.summary.downloadRate}%</p>
                </CardContent></Card>
              </div>
              <Card><CardContent className="p-3 flex items-center gap-2">
                <Clock className="size-4 text-emerald-600" />
                <span className="text-sm">Peak access hour: <strong>{analytics.peakHour}:00 — {analytics.peakHour + 1}:00</strong></span>
              </CardContent></Card>

              {/* Daily trend (simple bar chart) */}
              {analytics.dailyTrend.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Daily Views (Last 30 Days)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {analytics.dailyTrend.map((d) => {
                        const max = Math.max(...analytics.dailyTrend.map((x) => x.views), 1)
                        const height = (d.views / max) * 100
                        return (
                          <div
                            key={d.date}
                            className="flex-1 bg-emerald-500/60 hover:bg-emerald-500 transition-colors rounded-t"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${d.date}: ${d.views} views`}
                          />
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {analytics.dailyTrend.length} active days
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Per-student breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Per-Student Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {analytics.studentBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No student activity yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {analytics.studentBreakdown.map((s) => (
                        <div key={s.userId} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email} · {s.studentLevel || '?'} Level</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{s.viewCount} views</span>
                            {s.downloaded && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">Downloaded</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No analytics available.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Q&amp;A — {activeMaterial?.title}</DialogTitle>
            <DialogDescription>
              Answer student questions and view discussion on this material.
            </DialogDescription>
          </DialogHeader>
          {commentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* New comment input */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/20">
                <Textarea
                  placeholder="Post a new announcement or answer to this material..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button size="sm" onClick={() => submitComment()} disabled={!newComment.trim()}>
                  <Send className="size-3.5 mr-1.5" /> Post
                </Button>
              </div>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Students can ask questions on this material from their dashboard.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => {
                    const isExpanded = expandedComments.has(c.id)
                    return (
                      <div key={c.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{c.author.firstName} {c.author.lastName}</span>
                              {c.isLecturerResponse && (
                                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">
                                  Lecturer
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                          </div>
                        </div>
                        {/* Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="ml-6 space-y-2 border-l-2 border-muted pl-3">
                            {c.replies.map((r) => (
                              <div key={r.id} className="text-sm">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium">{r.author.firstName} {r.author.lastName}</span>
                                  {r.isLecturerResponse && (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px]">Lecturer</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                                </div>
                                <p className="whitespace-pre-wrap">{r.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Reply toggle */}
                        <button
                          type="button"
                          className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                          onClick={() => {
                            const next = new Set(expandedComments)
                            if (next.has(c.id)) next.delete(c.id)
                            else next.add(c.id)
                            setExpandedComments(next)
                          }}
                        >
                          {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                          Reply
                        </button>
                        {isExpanded && (
                          <div className="ml-6 flex gap-2">
                            <Input
                              placeholder="Write a reply..."
                              value={replyText[c.id] || ''}
                              onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  submitComment(c.id)
                                }
                              }}
                            />
                            <Button size="sm" onClick={() => submitComment(c.id)} disabled={!replyText[c.id]?.trim()}>
                              <Send className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Material</DialogTitle>
            <DialogDescription>
              Share &quot;{activeMaterial?.title}&quot; with a lecturer at another institution. They&apos;ll be able to view it and optionally copy it to their own institution.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipientEmail">Recipient Email <span className="text-destructive">*</span></Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="lecturer@university.edu.ng"
                value={shareForm.recipientEmail}
                onChange={(e) => setShareForm({ ...shareForm, recipientEmail: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Must be an existing NurseOS lecturer account.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shareMessage">Message (optional)</Label>
              <Textarea
                id="shareMessage"
                placeholder="Hi, I think this material might be useful for your students too..."
                value={shareForm.message}
                onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShareOpen(false)} disabled={isSharing}>Cancel</Button>
              <Button type="submit" disabled={isSharing} className="bg-emerald-600 hover:bg-emerald-700">
                {isSharing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Share2 className="size-4 mr-2" />}
                Share
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search materials by title, course code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="size-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={String(l)}>{l} Level</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold">{materials.length}</p>
              </div>
              <File className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{materials.reduce((s, m) => s + (m.viewCount || 0), 0)}</p>
              </div>
              <BarChart3 className="size-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">{materials.reduce((s, m) => s + (m.downloadCount || 0), 0)}</p>
              </div>
              <Download className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open Questions</p>
                <p className="text-2xl font-bold">{materials.reduce((s, m) => s + (m._count?.comments || 0), 0)}</p>
              </div>
              <MessageSquare className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No materials uploaded yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click &quot;Upload Material&quot; to share your first document with students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materials.map((m) => {
            const typeMeta = getTypeMeta(m.type)
            const isScheduled = m.publishAt && new Date(m.publishAt) > new Date()
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <typeMeta.icon className="size-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                          {m.courseCode && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {m.courseCode}{m.courseTitle ? ` — ${m.courseTitle}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isScheduled && (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                              <Clock className="size-2.5 mr-1" />Scheduled
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                            {m.level} Level
                          </Badge>
                          <Badge variant="secondary">{typeMeta.label}</Badge>
                        </div>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{m.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />{formatDate(m.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="size-3" />{m.viewCount || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="size-3" />{m.downloadCount} downloads
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" />{m._count?.comments || 0} comments
                        </span>
                        {m.publishAt && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="size-3" />
                            {isScheduled ? `Publishes ${formatDate(m.publishAt)}` : `Published ${formatDate(m.publishAt)}`}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openComments(m)} title="View Q&A">
                        <MessageSquare className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openAnalytics(m)} title="Analytics">
                        <BarChart3 className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setActiveMaterial(m); setIsShareOpen(true) }}
                        title="Share with another lecturer"
                      >
                        <Share2 className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(m.id, m.title)}
                        disabled={deletingId === m.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        {deletingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Shared Materials link */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <Share2 className="size-4 text-emerald-600" />
              Materials Shared With You
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              View materials other lecturers have shared with you (cross-institution).
            </p>
          </div>
          <a href="/lecturer/shared">
            <Button variant="outline" size="sm">
              View Shared <ExternalLink className="size-3.5 ml-1.5" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Minimal ZIP extractor (no external deps) ───
// Uses the browser's native DecompressionStream API (supported in Chrome 80+, Firefox 113+, Safari 16.4+).
// Falls back to a basic manual ZIP parser for older browsers.
// Each entry's local header is parsed to extract the file name, size, and compressed data.
async function extractZipFiles(zipFile: File): Promise<File[]> {
  const arrayBuffer = await zipFile.arrayBuffer()
  const view = new DataView(arrayBuffer)
  const uint8 = new Uint8Array(arrayBuffer)
  const files: File[] = []

  // Walk through the ZIP file structure: each entry starts with signature 0x04034b50
  let offset = 0
  while (offset < arrayBuffer.byteLength - 4) {
    const signature = view.getUint32(offset, true)
    if (signature !== 0x04034b50) break  // not a local file header — stop

    const compressionMethod = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const uncompressedSize = view.getUint32(offset + 22, true)
    const fileNameLength = view.getUint16(offset + 26, true)
    const extraFieldLength = view.getUint16(offset + 28, true)

    const fileNameBytes = uint8.slice(offset + 30, offset + 30 + fileNameLength)
    const fileName = new TextDecoder().decode(fileNameBytes)

    const dataStart = offset + 30 + fileNameLength + extraFieldLength
    const compressedData = uint8.slice(dataStart, dataStart + compressedSize)

    // Skip directories (filename ends with "/")
    if (!fileName.endsWith('/') && compressedSize > 0) {
      try {
        let uncompressed: Uint8Array
        if (compressionMethod === 0) {
          // No compression (stored)
          uncompressed = compressedData
        } else if (compressionMethod === 8) {
          // Deflate — use DecompressionStream
          // @ts-ignore — DecompressionStream is supported in modern browsers
          const ds = new DecompressionStream('deflate-raw')
          const blob = new Blob([compressedData])
          const stream = blob.stream().pipeThrough(ds)
          const buf = await new Response(stream).arrayBuffer()
          uncompressed = new Uint8Array(buf)
        } else {
          // Unsupported compression — skip
          offset = dataStart + compressedSize
          continue
        }

        // Derive a MIME type from the extension
        const ext = fileName.split('.').pop()?.toLowerCase() || ''
        const mimeMap: Record<string, string> = {
          pdf: 'application/pdf',
          ppt: 'application/vnd.ms-powerpoint',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
        }
        const mimeType = mimeMap[ext] || 'application/octet-stream'

        // Just the basename — strip any folder prefixes
        const baseName = fileName.split('/').pop() || fileName
        const file = new File([uncompressed], baseName, { type: mimeType })
        // Override size property if needed (some browsers might compute differently)
        Object.defineProperty(file, 'size', { value: uncompressed.byteLength })
        files.push(file)
      } catch (e) {
        console.error(`Failed to extract ${fileName}:`, e)
      }
    }

    offset = dataStart + compressedSize
  }

  if (files.length === 0) {
    throw new Error('No files could be extracted from the ZIP. Make sure it contains supported file types (PDF, PPT, DOC, images).')
  }
  return files
}
