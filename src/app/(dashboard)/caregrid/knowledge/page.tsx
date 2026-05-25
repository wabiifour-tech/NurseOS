"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen,
  Search,
  Plus,
  Heart,
  Clock,
  Star,
  Award,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  X,
  MessageSquare,
  Send,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiArticle {
  id: string
  title: string
  slug: string
  content: string
  category: string
  authorId: string
  tags: string          // JSON array stored as string
  summary: string | null
  readingTime: number | null
  evidenceLevel: string | null
  references: string    // JSON array stored as string
  viewCount: number
  likeCount: number
  commentCount: number
  isPublished: boolean
  isFeatured: boolean
  language: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    user: { firstName: string; lastName: string; displayName?: string }
  } | null
  _count: { comments: number }
}

interface ArticleComment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

const categories = [
  "All Categories",
  "Emergency Care",
  "Maternal Health",
  "Infectious Disease",
  "Pharmacology",
  "Pediatrics",
  "Community Health",
]

const evidenceColors: Record<string, string> = {
  "Level I":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Level II":  "bg-teal-50 text-teal-700 border-teal-200",
  "Level III": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Level IV":  "bg-amber-50 text-amber-700 border-amber-200",
  "Level V":   "bg-slate-50 text-slate-600 border-slate-200",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseTags(raw: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function authorName(article: ApiArticle): string {
  if (!article.author) return "Unknown Author"
  const { firstName, lastName, displayName } = article.author.user
  return displayName || `${firstName} ${lastName}`.trim() || "Unknown Author"
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  } catch {
    return iso
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${hours}:${minutes}`
  } catch {
    return iso
  }
}

function readingTimeLabel(minutes: number | null): string {
  if (!minutes) return ""
  return `${minutes} min`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeBankPage() {
  const [articles, setArticles] = React.useState<ApiArticle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("All Categories")

  // Article editor state
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editorForm, setEditorForm] = React.useState({
    title: '',
    category: 'Emergency Care',
    content: '',
    summary: '',
    tags: '',
    evidenceLevel: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Article detail view state
  const [selectedArticle, setSelectedArticle] = React.useState<ApiArticle | null>(null)
  const [comments, setComments] = React.useState<ArticleComment[]>([])
  const [commentsLoading, setCommentsLoading] = React.useState(false)
  const [newComment, setNewComment] = React.useState('')
  const [submittingComment, setSubmittingComment] = React.useState(false)

  // ── Fetch articles ──────────────────────────────────────────────────────

  const fetchArticles = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (categoryFilter !== "All Categories") params.set("category", categoryFilter)
      params.set("limit", "50")

      const res = await fetch(`/api/caregrid/knowledge?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to view knowledge articles.")
        throw new Error("Failed to load articles. Please try again.")
      }

      const data = await res.json()
      setArticles(data.articles ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter])

  React.useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // ── Fetch comments ──────────────────────────────────────────────────────

  const fetchComments = React.useCallback(async (articleId: string) => {
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/caregrid/knowledge/${articleId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch {
      // Silently fail for comments
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  // When selecting an article, load its comments
  const handleSelectArticle = React.useCallback((article: ApiArticle) => {
    setSelectedArticle(article)
    setNewComment('')
    fetchComments(article.id)
  }, [fetchComments])

  const handleSubmitComment = React.useCallback(async () => {
    if (!selectedArticle || !newComment.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/caregrid/knowledge/${selectedArticle.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        toast.success('Comment added!')
        // Update article comment count
        setSelectedArticle(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to add comment')
      }
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }, [selectedArticle, newComment])

  // ── Derived data ────────────────────────────────────────────────────────

  const featuredArticles = articles.filter((a) => a.isFeatured)

  const searchLower = searchQuery.toLowerCase()
  const filtered = articles.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchLower) ||
      authorName(a).toLowerCase().includes(searchLower) ||
      (a.summary ?? "").toLowerCase().includes(searchLower) ||
      parseTags(a.tags).some((t) => t.toLowerCase().includes(searchLower))

    const matchesCategory =
      categoryFilter === "All Categories" || a.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // ── Article Detail View ─────────────────────────────────────────────────

  if (selectedArticle) {
    const tags = parseTags(selectedArticle.tags)
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setSelectedArticle(null)}
        >
          <ArrowLeft className="size-4" />
          Back to Knowledge Bank
        </Button>

        {/* Article Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">{selectedArticle.category}</Badge>
                  {selectedArticle.isFeatured && (
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                      <Star className="size-3 fill-amber-500" /> Featured
                    </Badge>
                  )}
                  {selectedArticle.evidenceLevel && (
                    <Badge className={`text-[10px] ${evidenceColors[selectedArticle.evidenceLevel] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      <Award className="size-3 mr-0.5" />
                      {selectedArticle.evidenceLevel}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedArticle.title}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                {authorName(selectedArticle)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatDate(selectedArticle.createdAt)}
              </span>
              {selectedArticle.readingTime && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {readingTimeLabel(selectedArticle.readingTime)} read
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {selectedArticle.viewCount} views
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="size-3.5 text-red-400" />
                {selectedArticle.likeCount} likes
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] bg-emerald-50/50 text-emerald-700 border-emerald-100">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {selectedArticle.summary && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/10 mb-4">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Summary</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedArticle.summary}</p>
              </div>
            )}

            {/* Article content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {selectedArticle.content.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h2 key={idx} className="text-xl font-bold mt-6 mb-3">{line.slice(2)}</h2>
                }
                if (line.startsWith('## ')) {
                  return <h3 key={idx} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h3>
                }
                if (line.startsWith('### ')) {
                  return <h4 key={idx} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h4>
                }
                if (line.startsWith('- ')) {
                  return <li key={idx} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={idx} className="text-sm font-semibold mt-2">{line.slice(2, -2)}</p>
                }
                if (line.trim() === '') {
                  return <div key={idx} className="h-3" />
                }
                return <p key={idx} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              })}
            </div>

            <Separator className="my-6" />

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your thoughts on this article..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-y"
                />
                <div className="flex justify-end">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                    size="sm"
                  >
                    {submittingComment ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="size-5 animate-spin text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Loading comments...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {comment.author.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-8">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Render (List View) ──────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="size-6 text-emerald-600" />
            Knowledge Bank
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evidence-based resources for Nigerian nursing practice
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setEditorOpen(true)}>
          <Plus className="size-4" />
          Write Article
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading articles…</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-10 text-red-400" />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchArticles}
              className="mt-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content — only when not loading and no error */}
      {!loading && !error && (
        <>
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="hover:shadow-md transition-shadow border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white cursor-pointer"
                    onClick={() => handleSelectArticle(article)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                        <Star className="size-3 fill-amber-500" />
                        Featured
                      </Badge>
                      <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {article.summary ?? article.content.slice(0, 120) + "…"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{authorName(article)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(article.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {article.evidenceLevel && (
                          <Badge
                            className={`text-[10px] ${evidenceColors[article.evidenceLevel] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
                          >
                            <Award className="size-3 mr-0.5" />
                            {article.evidenceLevel}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="size-3 text-red-400" />
                            {article.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {article.commentCount || article._count.comments}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles, authors, topics..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((article) => {
                const tags = parseTags(article.tags)
                return (
                  <Card
                    key={article.id}
                    className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer"
                    onClick={() => handleSelectArticle(article)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0 bg-slate-50">
                          {article.category}
                        </Badge>
                        {article.isFeatured && (
                          <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {article.summary ?? article.content.slice(0, 120) + "…"}
                      </p>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] bg-emerald-50/50 text-emerald-700 border-emerald-100"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {tags.length > 3 && (
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500">
                              +{tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <FileText className="size-3 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">{authorName(article)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(article.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        {article.evidenceLevel ? (
                          <Badge
                            className={`text-[10px] ${evidenceColors[article.evidenceLevel] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}
                          >
                            <Award className="size-3 mr-0.5" />
                            {article.evidenceLevel}
                          </Badge>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {article.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {readingTimeLabel(article.readingTime)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />
                            {article.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="size-3 text-red-400" />
                            {article.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {article.commentCount || article._count.comments}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <BookOpen className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {articles.length === 0
                  ? "No articles have been published yet."
                  : "No articles found matching your search."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Article Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Write Article</h2>
                <p className="text-sm text-muted-foreground">Share your knowledge with the NurseOS community</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditorOpen(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editorForm.title}
                  onChange={(e) => setEditorForm({ ...editorForm, title: e.target.value })}
                  placeholder="Enter article title..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={editorForm.category}
                    onValueChange={(val) => setEditorForm({ ...editorForm, category: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'All Categories').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Evidence Level</label>
                  <Select
                    value={editorForm.evidenceLevel || 'none'}
                    onValueChange={(val) => setEditorForm({ ...editorForm, evidenceLevel: val === 'none' ? '' : val })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Level I">Level I — Systematic Review</SelectItem>
                      <SelectItem value="Level II">Level II — RCT</SelectItem>
                      <SelectItem value="Level III">Level III — Controlled Trial</SelectItem>
                      <SelectItem value="Level IV">Level IV — Case Series</SelectItem>
                      <SelectItem value="Level V">Level V — Expert Opinion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Summary</label>
                <Input
                  value={editorForm.summary}
                  onChange={(e) => setEditorForm({ ...editorForm, summary: e.target.value })}
                  placeholder="Brief summary of the article..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={editorForm.tags}
                  onChange={(e) => setEditorForm({ ...editorForm, tags: e.target.value })}
                  placeholder="e.g., emergency, triage, pediatrics"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content (Markdown supported)</label>
                <textarea
                  value={editorForm.content}
                  onChange={(e) => setEditorForm({ ...editorForm, content: e.target.value })}
                  placeholder="Write your article content here...&#10;&#10;## Heading&#10;Use **bold** and *italic* for emphasis.&#10;- Bullet points supported&#10;&#10;```code blocks supported```"
                  className="w-full min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={async () => {
                    if (!editorForm.title.trim() || !editorForm.content.trim()) {
                      toast.error('Title and content are required')
                      return
                    }
                    setIsSubmitting(true)
                    try {
                      const tags = editorForm.tags
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                      const res = await fetch('/api/caregrid/knowledge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: editorForm.title,
                          category: editorForm.category,
                          content: editorForm.content,
                          summary: editorForm.summary || null,
                          tags,
                          evidenceLevel: editorForm.evidenceLevel || null,
                          isPublished: false,
                        }),
                      })
                      const data = await res.json()
                      if (!res.ok) {
                        toast.error(data.error || 'Failed to create article')
                        setIsSubmitting(false)
                        return
                      }
                      toast.success('Article created successfully! It will be reviewed before publishing.')
                      setEditorOpen(false)
                      setEditorForm({
                        title: '',
                        category: 'Emergency Care',
                        content: '',
                        summary: '',
                        tags: '',
                        evidenceLevel: '',
                      })
                      fetchArticles()
                    } catch {
                      toast.error('Failed to create article')
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
                  Submit Article
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditorOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
