'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Star,
  Clock,
  Award,
  Users,
  Play,
  FileText,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
  Globe,
  BookOpen,
  User,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CourseModule {
  id: string
  title: string
  type: string
  durationMinutes: number | null
  order: number
}

interface CourseData {
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
  modules: CourseModule[]
  _count: {
    enrollments: number
    modules: number
  }
}

interface CourseDetail {
  course: CourseData
  isEnrolled: boolean
  enrollmentStatus: string | null
  enrollmentProgress: number
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  const [courseDetail, setCourseDetail] = React.useState<CourseDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeModule, setActiveModule] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/nurseacademy/courses/${courseId}`)
        if (res.status === 404) {
          setError('Course not found')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch course')
        const data = await res.json()
        setCourseDetail(data)
      } catch {
        toast.error('Failed to load course details')
        setError('Failed to load course')
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const moduleTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
      case 'VIDEO':
        return <Play className="size-4 text-emerald-600" />
      case 'Text':
      case 'TEXT':
        return <FileText className="size-4 text-blue-600" />
      case 'Quiz':
      case 'QUIZ':
        return <HelpCircle className="size-4 text-amber-600" />
      default:
        return <FileText className="size-4" />
    }
  }

  const levelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
      case 'BEGINNER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
      case 'Intermediate':
      case 'INTERMEDIATE':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
      case 'Advanced':
      case 'ADVANCED':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20'
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
        className={`size-4 ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ))
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading course details...</span>
      </div>
    )
  }

  if (error || !courseDetail) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="size-12 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold mb-2">
          {error === 'Course not found' ? 'Course Not Found' : 'Error Loading Course'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {error === 'Course not found'
            ? 'The course you are looking for does not exist.'
            : 'Something went wrong while loading the course. Please try again.'}
        </p>
        <Button asChild variant="outline">
          <Link href="/academy/courses">
            <ArrowLeft className="size-4 mr-2" /> Back to Catalog
          </Link>
        </Button>
      </div>
    )
  }

  const { course, isEnrolled, enrollmentStatus, enrollmentProgress } = courseDetail
  const moduleTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'Video'
      case 'TEXT': return 'Text'
      case 'QUIZ': return 'Quiz'
      default: return type
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/academy/courses" className="hover:text-emerald-600 transition-colors">
          Course Catalog
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 relative flex items-center justify-center">
              <BookOpen className="size-16 text-white/60" />
              {course.enrollmentCount > 500 && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 gap-1">
                  <Sparkles className="size-3" /> Featured
                </Badge>
              )}
              {isEnrolled && (
                <Badge className="absolute top-4 right-4 bg-emerald-600 text-white border-0 gap-1">
                  <CheckCircle2 className="size-3" /> Enrolled
                </Badge>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline" className={levelColor(course.level)}>
                  {levelLabel(course.level)}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(course.rating)}</div>
                  <span className="font-medium">{course.rating}</span>
                  <span className="text-sm text-muted-foreground">({course.totalRatings} reviews)</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {course.enrollmentCount.toLocaleString()} students
                </div>
              </div>

              {isEnrolled && enrollmentProgress > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm font-semibold text-emerald-600">{enrollmentProgress}%</span>
                  </div>
                  <Progress value={enrollmentProgress} className="h-2.5" />
                  <Button variant="outline" className="mt-3 w-full sm:w-auto opacity-50 cursor-not-allowed" size="sm" onClick={() => toast.info('Course content player is coming soon — this feature is being developed.')}>
                    <Play className="size-4 mr-2" /> Continue Learning (Coming Soon)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modules / Curriculum */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Curriculum</CardTitle>
              <CardDescription>
                {course.modules.length} modules • {formatDuration(course.durationMinutes)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.modules.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {course.modules.map((mod, index) => (
                    <AccordionItem key={mod.id} value={mod.id}>
                      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-3 rounded-lg">
                        <div className="flex items-center gap-3 text-left">
                          <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            {moduleTypeIcon(mod.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {index + 1}. {mod.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] py-0">
                                {moduleTypeLabel(mod.type)}
                              </Badge>
                              <span>{formatDuration(mod.durationMinutes)}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <p className="text-sm text-muted-foreground pl-11">
                          {mod.type === 'Video' || mod.type === 'VIDEO'
                            ? 'Watch the video lecture and take notes on key concepts.'
                            : mod.type === 'Quiz' || mod.type === 'QUIZ'
                            ? 'Test your understanding with assessment questions based on the module content.'
                            : 'Read through the course material and review the key points.'}
                        </p>
                        {isEnrolled && (
                          <Button variant="outline" size="sm" className="ml-11 mt-2 opacity-50 cursor-not-allowed" onClick={() => {
                            setActiveModule(mod.id)
                            toast.info(
                              mod.type === 'Quiz' || mod.type === 'QUIZ'
                                ? 'Quiz module is coming soon — this feature is being developed.'
                                : mod.type === 'Video' || mod.type === 'VIDEO'
                                ? 'Video player is coming soon — this feature is being developed.'
                                : 'Reading material viewer is coming soon — this feature is being developed.'
                            )
                          }}>
                            <Play className="size-3.5 mr-1.5" />
                            {mod.type === 'Quiz' || mod.type === 'QUIZ' ? 'Start Quiz (Coming Soon)' : mod.type === 'Video' || mod.type === 'VIDEO' ? 'Watch Video (Coming Soon)' : 'Read Material (Coming Soon)'}
                          </Button>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No modules available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="size-5 text-emerald-600" />
                Student Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No reviews yet. Be the first to review this course!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info Card */}
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {course.isFree || course.price === 0 || course.price === null ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    <span>₦{course.price.toLocaleString()}</span>
                  )}
                </p>
                {course.price && course.price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
                )}
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={async () => {
                  if (isEnrolled) {
                    toast.info('Continue learning from where you left off')
                    return
                  }
                  try {
                    const res = await fetch('/api/nurseacademy/enrollments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ courseId: course.id }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success('Enrolled successfully!')
                      // Refresh to show enrolled state
                      setTimeout(() => window.location.reload(), 1000)
                    } else {
                      toast.error(data.error || 'Failed to enroll')
                    }
                  } catch {
                    toast.error('Failed to enroll. Please try again.')
                  }
                }}
              >
                {isEnrolled ? (
                  <>
                    <Play className="size-4 mr-2" /> Continue Learning (Coming Soon)
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" /> Enroll Now
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4" /> Duration
                  </span>
                  <span className="font-medium">{formatDuration(course.durationMinutes)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Award className="size-4" /> CPD Points
                  </span>
                  <span className="font-medium">{course.cpdPoints || 0} points</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="size-4" /> Level
                  </span>
                  <Badge variant="outline" className={levelColor(course.level)}>
                    {levelLabel(course.level)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-4" /> Language
                  </span>
                  <span className="font-medium">{course.language === 'en' ? 'English' : course.language}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-4" /> Modules
                  </span>
                  <span className="font-medium">{course.modules.length} modules</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" /> Students
                  </span>
                  <span className="font-medium">{course.enrollmentCount.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              {/* Enrollment Status */}
              {isEnrolled && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    <span className="font-medium">You are enrolled</span>
                  </div>
                  {enrollmentStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {enrollmentStatus === 'IN_PROGRESS' ? 'In Progress' : enrollmentStatus === 'COMPLETED' ? 'Completed' : enrollmentStatus}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
