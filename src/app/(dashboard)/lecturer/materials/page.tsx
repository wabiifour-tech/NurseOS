'use client'

/**
 * Lecturer Materials Dashboard
 *
 * Lecturers at UNIVERSITY or SCHOOL_OF_NURSING institutions can:
 *   - Upload slides, documents, PowerPoints, PDFs, or links
 *   - Tag each upload with a level (100-500)
 *   - View, search, and delete their previously uploaded materials
 *   - See download counts per material
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
  createdAt: string
  uploader: { id: string; firstName: string; lastName: string }
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
  const [isUploading, setIsUploading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  // Upload form state
  const [form, setForm] = React.useState({
    title: '',
    description: '',
    type: 'PDF',
    level: '100',
    courseCode: '',
    courseTitle: '',
    externalUrl: '',
  })
  const [file, setFile] = React.useState<File | null>(null)

  async function fetchMaterials() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (levelFilter !== 'all') params.set('level', levelFilter)
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
      }

      if (form.type === 'LINK') {
        payload.externalUrl = form.externalUrl.trim()
      } else if (file) {
        // Convert file to base64 data URL
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

      toast.success('Material uploaded successfully')
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
              Upload slides, documents, PDFs, and links for your students
            </p>
          </div>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="size-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
              <DialogDescription>
                Upload slides, documents, PDFs, or links. Students will only see materials tagged with their level.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Title */}
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

              {/* Type + Level */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Material Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={form.level}
                    onValueChange={(v) => setForm({ ...form, level: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={String(l)}>
                          {l} Level
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Course Code + Title */}
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

              {/* Description */}
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

              {/* File or Link */}
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
                  <p className="text-xs text-muted-foreground">
                    Students will be redirected to this URL when they click the material.
                  </p>
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
                    Max size: 10 MB. File is stored securely and only visible to students at the {form.level} level.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <SelectItem key={l} value={String(l)}>
                    {l} Level
                  </SelectItem>
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
                <p className="text-xs text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {materials.reduce((sum, m) => sum + (m.downloadCount || 0), 0)}
                </p>
              </div>
              <Download className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Levels Covered</p>
                <p className="text-2xl font-bold">
                  {new Set(materials.map((m) => m.level)).size}
                </p>
              </div>
              <GraduationCap className="size-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Links Shared</p>
                <p className="text-2xl font-bold">
                  {materials.filter((m) => m.type === 'LINK').length}
                </p>
              </div>
              <LinkIcon className="size-5 text-amber-500" />
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
            <p className="text-muted-foreground">
              No materials uploaded yet.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click "Upload Material" to share your first document with students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {materials.map((m) => {
            const typeMeta = getTypeMeta(m.type)
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
                              {m.courseCode}
                              {m.courseTitle ? ` — ${m.courseTitle}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                            {m.level} Level
                          </Badge>
                          <Badge variant="secondary">{typeMeta.label}</Badge>
                        </div>
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {m.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(m.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="size-3" />
                          {m.downloadCount} downloads
                        </span>
                        {m.fileName && (
                          <span className="flex items-center gap-1 truncate">
                            <File className="size-3" />
                            {m.fileName} ({formatSize(m.fileSize)})
                          </span>
                        )}
                        {m.externalUrl && (
                          <a
                            href={m.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline truncate"
                          >
                            <ExternalLink className="size-3" />
                            Open link
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(m.id, m.title)}
                      disabled={deletingId === m.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
