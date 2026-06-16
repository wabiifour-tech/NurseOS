'use client'

/**
 * Student Materials Dashboard
 *
 * Students at UNIVERSITY or SCHOOL_OF_NURSING institutions can:
 *   - View materials uploaded by lecturers at their institution for their level
 *   - Search and filter by course code / title
 *   - Open external links or view/download files
 *   - See upload date, lecturer name, download count
 *
 * They CANNOT see materials for other levels (enforced server-side).
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Loader2,
  Download,
  Calendar,
  BookOpen,
  GraduationCap,
  ExternalLink,
  File,
  FileType,
  Presentation,
  Link as LinkIcon,
  FileText,
  Eye,
  Filter,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

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
  fileUrl: string | null
  downloadCount: number
  createdAt: string
  uploader: { id: string; firstName: string; lastName: string }
}

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

export default function StudentMaterialsPage() {
  const user = useAuthStore((state) => state.user)
  const [materials, setMaterials] = React.useState<Material[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<string>('all')
  const [viewingMaterial, setViewingMaterial] = React.useState<Material | null>(null)
  const [isViewOpen, setIsViewOpen] = React.useState(false)

  async function fetchMaterials() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/course-materials?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials || [])
      } else if (res.status === 403) {
        toast.error('Only students can access this page.')
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
  }, [])

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => fetchMaterials(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const filtered = React.useMemo(() => {
    if (typeFilter === 'all') return materials
    return materials.filter((m) => m.type === typeFilter)
  }, [materials, typeFilter])

  async function handleView(m: Material) {
    // Open view dialog and increment download counter server-side
    setViewingMaterial(m)
    setIsViewOpen(true)
    try {
      await fetch(`/api/course-materials/${m.id}`, { credentials: 'include' })
    } catch (e) {
      // silent — view still works
    }
  }

  function handleDownload(m: Material) {
    if (!m.fileUrl) {
      toast.error('File not available')
      return
    }
    // fileUrl is a data URL — open in new tab
    const win = window.open()
    if (win) {
      win.document.write(
        `<iframe src="${m.fileUrl}" style="width:100%;height:100vh;border:0;" allowfullscreen></iframe>`
      )
    } else {
      toast.error('Please allow pop-ups to view this material.')
    }
  }

  function handleOpenLink(m: Material) {
    if (!m.externalUrl) {
      toast.error('Link not available')
      return
    }
    window.open(m.externalUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <BookOpen className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Materials</h1>
          <p className="text-sm text-muted-foreground">
            {user?.facilityName || 'Your institution'}
            {' · '}
            <Badge variant="outline" className="ml-1 text-emerald-600 border-emerald-500/30">
              {user?.studentLevel || '—'} Level
            </Badge>
          </p>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                You&apos;re viewing materials for {user?.studentLevel || 'your'} level only
              </p>
              <p className="text-muted-foreground mt-1">
                Lecturers at your institution can upload slides, PDFs, documents, PowerPoints, and external links —
                tagged by level. You will only see materials uploaded for your level. Materials are sorted by newest first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, course code, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="size-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
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
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
              <File className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">PDFs</p>
                <p className="text-2xl font-bold">
                  {filtered.filter((m) => m.type === 'PDF').length}
                </p>
              </div>
              <FileType className="size-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Slides</p>
                <p className="text-2xl font-bold">
                  {filtered.filter((m) => m.type === 'SLIDE' || m.type === 'POWERPOINT').length}
                </p>
              </div>
              <Presentation className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Links</p>
                <p className="text-2xl font-bold">
                  {filtered.filter((m) => m.type === 'LINK').length}
                </p>
              </div>
              <LinkIcon className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="size-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {search || typeFilter !== 'all'
                ? 'No materials match your filters.'
                : 'No materials available for your level yet.'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {search || typeFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Your lecturers haven\'t uploaded any materials for your level. Check back soon.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const typeMeta = getTypeMeta(m.type)
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <typeMeta.icon className="size-5 text-emerald-600" />
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                      {m.level} Level
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{m.title}</h3>
                  {m.courseCode && (
                    <p className="text-xs text-muted-foreground">
                      {m.courseCode}{m.courseTitle ? ` — ${m.courseTitle}` : ''}
                    </p>
                  )}
                  {m.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 flex-1">
                      {m.description}
                    </p>
                  )}
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UserIcon className="size-3" />
                      <span className="truncate">
                        {m.uploader.firstName} {m.uploader.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(m.createdAt)}
                    </div>
                    {m.fileName && (
                      <div className="flex items-center gap-1">
                        <File className="size-3" />
                        <span className="truncate">
                          {m.fileName} ({formatSize(m.fileSize)})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Download className="size-3" />
                      {m.downloadCount} views
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    {m.type === 'LINK' ? (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenLink(m)}
                      >
                        <ExternalLink className="size-3.5 mr-1.5" />
                        Open Link
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleView(m)}
                      >
                        <Eye className="size-3.5 mr-1.5" />
                        View Material
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* View material dialog */}
      {isViewOpen && viewingMaterial && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setIsViewOpen(false)}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold">{viewingMaterial.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {viewingMaterial.courseCode || 'Course material'} · {viewingMaterial.level} Level
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsViewOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-muted/20">
              {viewingMaterial.fileUrl && viewingMaterial.fileUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingMaterial.fileUrl}
                  className="w-full h-[70vh] border-0"
                  title={viewingMaterial.title}
                />
              ) : viewingMaterial.fileUrl && viewingMaterial.fileUrl.startsWith('data:image/') ? (
                <img
                  src={viewingMaterial.fileUrl}
                  alt={viewingMaterial.title}
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : viewingMaterial.fileUrl ? (
                <div className="p-8 text-center">
                  <File className="size-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    This file type can&apos;t be previewed in the browser.
                  </p>
                  <Button onClick={() => handleDownload(viewingMaterial)}>
                    <Download className="size-4 mr-2" />
                    Open in new tab
                  </Button>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  File not available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
