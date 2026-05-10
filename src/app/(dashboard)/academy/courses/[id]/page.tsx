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
} from 'lucide-react'
import { courses } from '@/lib/academy-data'

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  const course = courses.find((c) => c.id === courseId)

  if (!course) {
    return (
      <div className="p-6 text-center">
        <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-4">The course you are looking for does not exist.</p>
        <Link href="/academy/courses">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Back to Catalog
          </Button>
        </Link>
      </div>
    )
  }

  const moduleTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return <Play className="size-4 text-emerald-600" />
      case 'Text':
        return <FileText className="size-4 text-blue-600" />
      case 'Quiz':
        return <HelpCircle className="size-4 text-amber-600" />
      default:
        return <FileText className="size-4" />
    }
  }

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

  const relatedCourses = courses
    .filter((c) => c.id !== course.id && c.category === course.category)
    .slice(0, 3)

  const reviews = [
    { name: 'Nurse Chidinma O.', rating: 5, date: '2 weeks ago', comment: 'Excellent course! The emergency protocols are very practical and applicable to our setting in Nigeria.' },
    { name: 'Nurse Ibrahim M.', rating: 4, date: '1 month ago', comment: 'Very informative. The case studies from Lagos were particularly helpful. Would recommend to all ER nurses.' },
    { name: 'Nurse Funke A.', rating: 5, date: '2 months ago', comment: 'Best emergency nursing course I have taken. The instructor explains complex concepts clearly.' },
    { name: 'Nurse Emeka N.', rating: 4, date: '3 months ago', comment: 'Great content and well-structured modules. The quizzes really test your understanding.' },
  ]

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
              {course.featured && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 gap-1">
                  <Sparkles className="size-3" /> Featured
                </Badge>
              )}
              {course.enrolled && (
                <Badge className="absolute top-4 right-4 bg-emerald-600 text-white border-0 gap-1">
                  <CheckCircle2 className="size-3" /> Enrolled
                </Badge>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline" className={levelColor(course.level)}>
                  {course.level}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(course.rating)}</div>
                  <span className="font-medium">{course.rating}</span>
                  <span className="text-sm text-muted-foreground">({course.reviewCount} reviews)</span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {course.students.toLocaleString()} students
                </div>
              </div>

              {course.enrolled && course.progress > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Your Progress</span>
                    <span className="text-sm font-semibold text-emerald-600">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2.5" />
                  <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" size="sm">
                    <Play className="size-4 mr-2" /> Continue Learning
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
                {course.modules.length} modules • {course.duration}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                              {mod.type}
                            </Badge>
                            <span>{mod.duration}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <p className="text-sm text-muted-foreground pl-11">
                        {mod.type === 'Video'
                          ? 'Watch the video lecture and take notes on key concepts.'
                          : mod.type === 'Quiz'
                          ? 'Test your understanding with assessment questions based on the module content.'
                          : 'Read through the course material and review the key points.'}
                      </p>
                      {course.enrolled && (
                        <Button variant="outline" size="sm" className="ml-11 mt-2">
                          <Play className="size-3.5 mr-1.5" />
                          {mod.type === 'Quiz' ? 'Start Quiz' : mod.type === 'Video' ? 'Watch Video' : 'Read Material'}
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
            <CardContent className="space-y-4">
              {reviews.map((review, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <User className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star
                          key={j}
                          className={`size-3.5 ${
                            j < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
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
                  {course.price === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    <span>₦{course.price.toLocaleString()}</span>
                  )}
                </p>
                {course.price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
                )}
              </div>

              <Button
                className={`w-full ${
                  course.enrolled
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {course.enrolled ? (
                  <>
                    <Play className="size-4 mr-2" /> Continue Learning
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
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Award className="size-4" /> CPD Points
                  </span>
                  <span className="font-medium">{course.cpdPoints} points</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="size-4" /> Level
                  </span>
                  <Badge variant="outline" className={levelColor(course.level)}>
                    {course.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-4" /> Language
                  </span>
                  <span className="font-medium">{course.language}</span>
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
                  <span className="font-medium">{course.students.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              {/* Instructor */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Instructor</p>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <User className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{course.instructor}</p>
                    <p className="text-xs text-muted-foreground">{course.instructorTitle}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Courses */}
          {relatedCourses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Related Courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedCourses.map((rc) => (
                  <Link key={rc.id} href={`/academy/courses/${rc.id}`}>
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="size-12 rounded-lg bg-gradient-to-br from-emerald-400/80 to-teal-500/80 flex items-center justify-center shrink-0">
                        <BookOpen className="size-5 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {rc.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {rc.rating} • {rc.duration}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
