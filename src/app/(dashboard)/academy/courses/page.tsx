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
import { Progress } from '@/components/ui/progress'
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
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { courses, courseCategories, courseLevels } from '@/lib/academy-data'

export default function CourseCatalogPage() {
  const [categoryFilter, setCategoryFilter] = React.useState('All')
  const [levelFilter, setLevelFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')

  const featuredCourses = courses.filter((c) => c.featured)

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = categoryFilter === 'All' || course.category === categoryFilter
    const matchesLevel = levelFilter === 'All' || course.level === levelFilter
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesLevel && matchesSearch
  })

  const levelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
      case 'Advanced':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
      default:
        return ''
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

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return `₦${price.toLocaleString()}`
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground text-sm">
          Advance your nursing career with expert-led courses
        </p>
      </div>

      {/* Featured Courses */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Featured Courses</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCourses.map((course) => (
            <Link key={course.id} href={`/academy/courses/${course.id}`}>
              <Card className="h-full hover:shadow-md transition-all border-emerald-500/20 cursor-pointer group">
                <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-t-lg relative flex items-center justify-center">
                  <BookOpen className="size-10 text-white/80" />
                  {course.price === 0 && (
                    <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0">
                      Free
                    </Badge>
                  )}
                  <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 gap-1">
                    <Sparkles className="size-3" /> Featured
                  </Badge>
                </div>
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${levelColor(course.level)}`}>
                      {course.level}
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
                        <Clock className="size-3" /> {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="size-3" /> {course.cpdPoints} CPD
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {courseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {courseLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <Link key={course.id} href={`/academy/courses/${course.id}`}>
            <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
              <div className="h-28 bg-gradient-to-br from-emerald-400/80 to-teal-500/80 rounded-t-lg relative flex items-center justify-center">
                <BookOpen className="size-8 text-white/80" />
                {course.price === 0 ? (
                  <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0">
                    Free
                  </Badge>
                ) : (
                  <Badge className="absolute top-2 right-2 bg-white/90 text-slate-700 border-0">
                    {formatPrice(course.price)}
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {course.category}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${levelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                  {course.enrolled && (
                    <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 gap-1">
                      <CheckCircle2 className="size-2.5" /> Enrolled
                    </Badge>
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
                {course.enrolled && course.progress > 0 && course.progress < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-emerald-600">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="size-3" /> {course.cpdPoints} CPD
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" /> {course.students.toLocaleString()}
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

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No courses found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
