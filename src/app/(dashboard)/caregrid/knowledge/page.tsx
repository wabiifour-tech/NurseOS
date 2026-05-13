"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    user: { firstName: string; lastName: string }
  } | null
  _count: { comments: number }
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
  const { firstName, lastName } = article.author.user
  return `${firstName} ${lastName}`.trim() || "Unknown Author"
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

  // ── Render ──────────────────────────────────────────────────────────────

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
        <Button variant="outline" className="gap-2" onClick={() => toast.info('Article editor coming soon — this feature is being developed.')}>
          <Plus className="size-4" />
          Write Article
          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 bg-amber-50 ml-1">Coming Soon</Badge>
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
                    className="hover:shadow-md transition-shadow border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white"
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
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="size-3 text-red-400" />
                          {article.likeCount}
                        </span>
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
                    className="hover:shadow-md transition-shadow border-slate-200"
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
    </div>
  )
}
