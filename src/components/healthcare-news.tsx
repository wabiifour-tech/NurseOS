'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Newspaper,
  RefreshCw,
  ExternalLink,
  Search,
  Loader2,
  Globe,
  Clock,
} from 'lucide-react'

interface NewsItem {
  title: string
  summary: string
  source: string
  url: string
  date: string
  category: string
}

const CATEGORIES = [
  'All',
  'NMCN Updates',
  'WHO News',
  'NCLEX Updates',
  'Job Opportunities',
  'Conferences',
  'Healthcare Tech',
]

const CATEGORY_COLORS: Record<string, string> = {
  'NMCN Updates': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'WHO News': 'bg-teal-50 text-teal-700 border-teal-200',
  'NCLEX Updates': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Job Opportunities': 'bg-amber-50 text-amber-700 border-amber-200',
  'Conferences': 'bg-purple-50 text-purple-700 border-purple-200',
  'Healthcare Tech': 'bg-sky-50 text-sky-700 border-sky-200',
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function HealthcareNews() {
  const [news, setNews] = React.useState<NewsItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeCategory, setActiveCategory] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchNews = React.useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = forceRefresh ? '/api/news?refresh=true' : '/api/news'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch news')
      const data = await res.json()
      setNews(data.news || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const filteredNews = React.useMemo(() => {
    return news.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [news, activeCategory, searchQuery])

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Newspaper className="size-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Healthcare News</CardTitle>
              <p className="text-xs text-muted-foreground">Latest nursing & healthcare updates</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
            onClick={() => fetchNews(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            className="pl-8 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs text-muted-foreground">Fetching latest healthcare news...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-6">
            <Newspaper className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => fetchNews()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* News Feed */}
        {!loading && !error && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {filteredNews.length === 0 ? (
              <div className="text-center py-6">
                <Newspaper className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {news.length === 0 ? 'No news available yet' : 'No news match your filters'}
                </p>
              </div>
            ) : (
              filteredNews.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3 rounded-lg border border-border/50 hover:border-emerald-500/30 hover:shadow-sm transition-all bg-background/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      {item.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${CATEGORY_COLORS[item.category] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                        >
                          {item.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Globe className="size-2.5" />
                          {item.source}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="size-2.5" />
                          {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground/50 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-colors" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filteredNews.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Showing {filteredNews.length} of {news.length} articles • Updated hourly
          </p>
        )}
      </CardContent>
    </Card>
  )
}
