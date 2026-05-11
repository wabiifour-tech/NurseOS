'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Star,
  Clock,
  Award,
  Users,
  Search,
  Filter,
  BookOpen,
  Sparkles,
  Loader2,
  TrendingUp,
  Globe,
  Zap,
  ArrowRight,
  LayoutGrid,
  GraduationCap,
  Layers,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  category: string
  level: string
  durationMinutes: number | null
  cpdPoints: number | null
  language: string
  tags: string
  isPublished: boolean
  isFree: boolean
  price: number | null
  enrollmentCount: number
  rating: number
  totalRatings: number
  createdAt: string
  _count?: {
    enrollments: number
    simulations: number
    courseModules: number
  }
}

interface CategoryInfo {
  name: string
  count: number
}

interface CourseStats {
  totalCourses: number
  totalFreeCourses: number
  totalCpdPoints: number
  totalCategories: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// Category gradient mapping - each category gets a distinct gradient
const categoryGradients: Record<string, string> = {
  'Clinical Nursing': 'from-rose-500 to-pink-600',
  'Critical Care': 'from-red-500 to-orange-600',
  'Emergency Nursing': 'from-orange-500 to-red-600',
  'Pediatric Nursing': 'from-sky-400 to-blue-500',
  'Maternal Health': 'from-fuchsia-500 to-pink-500',
  'Mental Health': 'from-violet-500 to-purple-600',
  'Community Health': 'from-emerald-500 to-teal-600',
  'Surgical Nursing': 'from-slate-500 to-gray-600',
  'Pharmacology': 'from-teal-500 to-cyan-600',
  'Infection Control': 'from-lime-500 to-green-600',
  'Leadership & Management': 'from-amber-500 to-yellow-600',
  'Research & Evidence': 'from-indigo-400 to-blue-500',
  'Oncology Nursing': 'from-purple-500 to-violet-600',
  'Geriatric Nursing': 'from-cyan-500 to-teal-500',
  'Neonatal Care': 'from-pink-400 to-rose-500',
  'Wound Care': 'from-green-500 to-emerald-600',
  'Diet & Nutrition': 'from-yellow-500 to-amber-500',
  'Nursing Ethics': 'from-slate-600 to-zinc-700',
  'Hematology': 'from-rose-400 to-red-500',
  'Digital Health': 'from-blue-400 to-indigo-500',
  'Emergency Care': 'from-orange-600 to-red-700',
  'Nursing Education': 'from-sky-500 to-blue-600',
  'Nursing Informatics': 'from-cyan-400 to-blue-500',
  'Rehabilitation': 'from-green-400 to-emerald-500',
  'Palliative Care': 'from-violet-400 to-indigo-500',
  'Forensic Nursing': 'from-slate-500 to-gray-700',
  'Occupational Health': 'from-amber-400 to-orange-500',
  'Nephrology Nursing': 'from-teal-400 to-cyan-500',
  'Cardiac Nursing': 'from-red-400 to-rose-500',
  'Neuroscience Nursing': 'from-indigo-500 to-purple-600',
  'Orthopedic Nursing': 'from-emerald-400 to-green-500',
  'Respiratory Nursing': 'from-sky-400 to-cyan-500',
  'Midwifery': 'from-pink-400 to-fuchsia-500',
  'Public Health': 'from-teal-500 to-emerald-600',
  'Nursing Leadership': 'from-amber-500 to-orange-600',
}

const defaultGradient = 'from-emerald-400 to-teal-500'

function getCategoryGradient(category: string): string {
  return categoryGradients[category] || defaultGradient
}

export default function CourseCatalogPage() {
  // Filter states
  const [categoryFilter, setCategoryFilter] = React.useState('All')
  const [levelFilter, setLevelFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [freeOnly, setFreeOnly] = React.useState(false)
  const [sortBy, setSortBy] = React.useState('newest')

  // Data states
  const [courses, setCourses] = React.useState<Course[]>([])
  const [categories, setCategories] = React.useState<CategoryInfo[]>([])
  const [stats, setStats] = React.useState<CourseStats | null>(null)
  const [pagination, setPagination] = React.useState<PaginationInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }, [])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [categoryFilter, levelFilter, freeOnly, sortBy])

  // Fetch courses
  React.useEffect(() => {
    async function fetchCourses() {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (categoryFilter !== 'All') params.set('category', categoryFilter)
        if (levelFilter !== 'All') params.set('level', levelFilter)
        if (freeOnly) params.set('isFree', 'true')
        params.set('sortBy', sortBy)
        params.set('limit', '24')
        params.set('page', String(page))

        const res = await fetch(`/api/nurseacademy/courses?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (page === 1) {
            setCourses(data.courses || [])
          } else {
            setCourses((prev) => [...prev, ...(data.courses || [])])
          }
          setCategories(data.categories || [])
          setStats(data.stats || null)
          setPagination(data.pagination || null)
        }
      } catch {
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }
    fetchCourses()
  }, [debouncedSearch, categoryFilter, levelFilter, freeOnly, sortBy, page])

  const featuredCourses = courses.filter((c) => c.enrollmentCount > 500)

  const levelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
      case 'INTERMEDIATE':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
      case 'ADVANCED':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
      case 'EXPERT':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20'
      default:
        return ''
    }
  }

  const levelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Beginner'
      case 'INTERMEDIATE': return 'Intermediate'
      case 'ADVANCED': return 'Advanced'
      case 'EXPERT': return 'Expert'
      default: return level
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-3.5 ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ))
  }

  const formatPrice = (price: number | null, isFree: boolean) => {
    if (isFree || price === 0 || price === null) return 'Free'
    return `₦${price.toLocaleString()}`
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const isNew = (createdAt: string) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(createdAt) > thirtyDaysAgo
  }

  const isBestseller = (enrollmentCount: number) => enrollmentCount > 1000

  const isNonEnglish = (language: string) => language && language !== 'en' && language !== 'English'

  const languageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      fr: 'Français',
      es: 'Español',
      pt: 'Português',
      ar: 'العربية',
      hi: 'हिन्दी',
      yo: 'Yorùbá',
      ig: 'Igbo',
      ha: 'Hausa',
    }
    return labels[lang] || lang
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const allLevels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

  const activeFilterCount = [
    categoryFilter !== 'All',
    levelFilter !== 'All',
    freeOnly,
    sortBy !== 'newest',
  ].filter(Boolean).length

  const clearFilters = () => {
    setCategoryFilter('All')
    setLevelFilter('All')
    setFreeOnly(false)
    setSortBy('newest')
    setSearchQuery('')
    setDebouncedSearch('')
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Course Catalog</h1>
          <p className="text-muted-foreground text-sm">
            Advance your nursing career with expert-led courses
          </p>
        </div>
        {pagination && (
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {courses.length} of {pagination.total} course{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Course Stats Banner */}
      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatNumber(stats.totalCourses)}
                </p>
                <p className="text-xs text-muted-foreground">Total Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-sky-500/20 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-sky-500/10 p-2">
                <Zap className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                  {formatNumber(stats.totalFreeCourses)}
                </p>
                <p className="text-xs text-muted-foreground">Free Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Award className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {formatNumber(Math.round(stats.totalCpdPoints))}
                </p>
                <p className="text-xs text-muted-foreground">CPD Points</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Layers className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                  {stats.totalCategories}
                </p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Quick Access Pills */}
      {categories.length > 0 && !loading && (
        <div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => setCategoryFilter('All')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === 'All'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <LayoutGrid className="size-3" />
                All
                <span className="ml-0.5 opacity-70">({stats?.totalCourses || 0})</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategoryFilter(categoryFilter === cat.name ? 'All' : cat.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    categoryFilter === cat.name
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {cat.name}
                  <span className="ml-0.5 opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="size-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'All' ? 'All Levels' : levelLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={freeOnly}
                    onCheckedChange={setFreeOnly}
                    id="free-only"
                  />
                  <label htmlFor="free-only" className="text-sm font-medium cursor-pointer">
                    Free Only
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="cpd">Most CPD Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-7"
                >
                  <X className="size-3 mr-1" />
                  Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-muted-foreground">Loading courses...</span>
        </div>
      ) : (
        <>
          {/* Featured Courses */}
          {featuredCourses.length > 0 && categoryFilter === 'All' && !debouncedSearch && !freeOnly && sortBy === 'newest' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Featured Courses</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredCourses.slice(0, 4).map((course) => (
                  <Link key={course.id} href={`/academy/courses/${course.id}`}>
                    <Card className="h-full hover:shadow-md transition-all border-emerald-500/20 cursor-pointer group">
                      <div className={`h-32 bg-gradient-to-br ${getCategoryGradient(course.category)} rounded-t-lg relative flex items-center justify-center`}>
                        <BookOpen className="size-10 text-white/80" />
                        {course.isFree && (
                          <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0">
                            Free
                          </Badge>
                        )}
                        <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 gap-1">
                          <Sparkles className="size-3" /> Featured
                        </Badge>
                        {isBestseller(course.enrollmentCount) && (
                          <Badge className="absolute bottom-2 left-2 bg-orange-500 text-white border-0 gap-1">
                            <TrendingUp className="size-3" /> Bestseller
                          </Badge>
                        )}
                        {isNonEnglish(course.language) && (
                          <Badge className="absolute bottom-2 right-2 bg-white/80 text-slate-700 border-0 gap-1">
                            <Globe className="size-3" /> {languageLabel(course.language)}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {course.category}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${levelColor(course.level)}`}>
                            {levelLabel(course.level)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3">
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" /> {formatDuration(course.durationMinutes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="size-3" /> {course.cpdPoints || 0} CPD
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(course.rating)}
                            <span className="ml-0.5">{course.rating}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Course Grid */}
          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Link key={course.id} href={`/academy/courses/${course.id}`}>
                    <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
                      <div className={`h-28 bg-gradient-to-br ${getCategoryGradient(course.category)} rounded-t-lg relative flex items-center justify-center`}>
                        <BookOpen className="size-8 text-white/80" />
                        {/* Price / Free badge */}
                        {course.isFree ? (
                          <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="absolute top-2 right-2 bg-white/90 text-slate-700 border-0">
                            {formatPrice(course.price, course.isFree)}
                          </Badge>
                        )}
                        {/* New badge */}
                        {isNew(course.createdAt) && (
                          <Badge className="absolute top-2 left-2 bg-sky-500 text-white border-0 gap-1">
                            <Zap className="size-3" /> New
                          </Badge>
                        )}
                        {/* Bestseller badge */}
                        {isBestseller(course.enrollmentCount) && !isNew(course.createdAt) && (
                          <Badge className="absolute top-2 left-2 bg-orange-500 text-white border-0 gap-1">
                            <TrendingUp className="size-3" /> Bestseller
                          </Badge>
                        )}
                        {/* Language badge for non-English */}
                        {isNonEnglish(course.language) && (
                          <Badge className="absolute bottom-2 right-2 bg-white/80 text-slate-700 border-0 gap-1 text-[10px]">
                            <Globe className="size-3" /> {languageLabel(course.language)}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            {course.category}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${levelColor(course.level)}`}>
                            {levelLabel(course.level)}
                          </Badge>
                          {course._count?.courseModules !== undefined && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <GraduationCap className="size-3" /> {course._count.courseModules} module{course._count.courseModules !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm leading-tight group-hover:text-emerald-600 transition-colors">
                          {course.title}
                        </h3>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 pb-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" /> {formatDuration(course.durationMinutes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="size-3" /> {course.cpdPoints || 0} CPD
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-3" /> {formatNumber(course.enrollmentCount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{course.rating}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {pagination && pagination.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    className="gap-2 min-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Courses
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Pagination info */}
              {pagination && pagination.totalPages > 1 && (
                <p className="text-center text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total courses
                </p>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium text-muted-foreground">No courses found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || categoryFilter !== 'All' || levelFilter !== 'All' || freeOnly
                    ? 'Try adjusting your search or filters'
                    : 'No courses have been published yet. Check back soon!'}
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-3"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
