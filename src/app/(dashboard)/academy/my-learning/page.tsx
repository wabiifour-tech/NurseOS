'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Award,
  GraduationCap,
  Library,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface EnrollmentCourse {
  title: string
  description: string
  category: string
  durationMinutes: number | null
  level: string
  cpdPoints: number | null
  rating: number
  enrollmentCount: number
  moduleCount: number
}

interface Enrollment {
  id: string
  courseId: string
  status: string
  progressPercent: number
  enrolledAt: string
  completedAt: string | null
  certificateNumber: string | null
  certificateIssued: boolean
  course: EnrollmentCourse
}

interface LearningData {
  enrollments: Enrollment[]
  inProgress: Enrollment[]
  completed: Enrollment[]
  totalEnrolled: number
  totalCompleted: number
  totalCPD: number
}

export default function MyLearningPage() {
  const [data, setData] = React.useState<LearningData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchLearningData() {
      try {
        const res = await fetch('/api/nurseacademy/my-learning')
        if (!res.ok) throw new Error('Failed to fetch learning data')
        const result = await res.json()
        setData(result)
      } catch {
        toast.error('Failed to load your learning data')
      } finally {
        setLoading(false)
      }
    }
    fetchLearningData()
  }, [])

  const inProgress = data?.inProgress || []
  const completed = data?.completed || []
  const totalCPD = data?.totalCPD || 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading your learning...</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="text-muted-foreground text-sm">
          Track your enrolled courses and completed certifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Library className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{inProgress.length}</p>
              <p className="text-sm text-muted-foreground">Courses In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Award className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{totalCPD}</p>
              <p className="text-sm text-muted-foreground">CPD Points Earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="in-progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="in-progress" className="gap-1.5">
            <Play className="size-3.5" /> In Progress ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="size-3.5" /> Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          {inProgress.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-40 h-24 bg-gradient-to-br from-emerald-400/80 to-teal-500/80 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="size-8 text-white/80" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {enrollment.course.category}
                        </Badge>
                        <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                          {enrollment.course.cpdPoints || 0} CPD
                        </Badge>
                      </div>
                      <Link href={`/academy/courses/${enrollment.courseId}`}>
                        <h3 className="font-semibold text-base hover:text-emerald-600 transition-colors">
                          {enrollment.course.title}
                        </h3>
                      </Link>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-emerald-600">{enrollment.progressPercent}%</span>
                      </div>
                      <Progress value={enrollment.progressPercent} className="h-2.5" />
                    </div>

                    {/* Course info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> {formatDuration(enrollment.course.durationMinutes)}
                      </span>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span>{levelLabel(enrollment.course.level)}</span>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span>{enrollment.course.moduleCount} modules</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Enrolled: {formatDate(enrollment.enrolledAt)}
                      </span>
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Link href={`/academy/courses/${enrollment.courseId}`}>
                          <Play className="size-4 mr-1.5" /> Continue Learning
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {inProgress.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium text-muted-foreground">No courses in progress</p>
                <p className="text-sm text-muted-foreground mb-4">Start learning by enrolling in a course</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/academy/courses">
                    Browse Courses
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-4">
          {completed.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-md transition-all border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-40 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0 relative">
                    <CheckCircle2 className="size-10 text-white/80" />
                    <Badge className="absolute top-2 right-2 bg-white/20 text-white border-0 text-[10px]">
                      Completed
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {enrollment.course.category}
                        </Badge>
                        <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 gap-1">
                          <Award className="size-2.5" /> {enrollment.course.cpdPoints || 0} CPD Earned
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-base">{enrollment.course.title}</h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Completed: {formatDate(enrollment.completedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {enrollment.certificateIssued && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                          <Link href="/academy/certificates">
                            <FileText className="size-3.5" /> View Certificate
                          </Link>
                        </Button>
                      )}
                      {enrollment.certificateNumber && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {enrollment.certificateNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {completed.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <GraduationCap className="size-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium text-muted-foreground">No completed courses yet</p>
                <p className="text-sm text-muted-foreground">Keep learning to earn certificates</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
