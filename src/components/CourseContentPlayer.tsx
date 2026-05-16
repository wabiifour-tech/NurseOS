'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Play,
  FileText,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Video,
  BookOpen,
  Trophy,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

interface ModuleContent {
  moduleId: string
  title: string
  description: string
  contentType: string
  durationMinutes: number | null
  order: number
  videoUrl?: string | null
  contentBody?: string | null
  readingContent?: string
  questions?: QuizQuestion[]
  passingScore?: number
}

interface CourseContentPlayerProps {
  moduleId: string
  moduleType: string
  moduleTitle: string
  courseId: string
  onClose: () => void
  onModuleCompleted: (progress: number) => void
}

export function CourseContentPlayer({
  moduleId,
  moduleType,
  moduleTitle,
  onClose,
  onModuleCompleted,
}: CourseContentPlayerProps) {
  const [content, setContent] = React.useState<ModuleContent | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = React.useState(false)
  const [quizScore, setQuizScore] = React.useState(0)
  const [showExplanation, setShowExplanation] = React.useState(false)

  // Completion state
  const [completing, setCompleting] = React.useState(false)
  const [completed, setCompleted] = React.useState(false)

  React.useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/nurseacademy/modules/${moduleId}/content`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load module content')
        }
        const data = await res.json()
        setContent(data.content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [moduleId])

  const handleCompleteModule = async (score?: number) => {
    setCompleting(true)
    try {
      const res = await fetch(`/api/nurseacademy/modules/${moduleId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizScore: score ?? null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to complete module')
      }
      const data = await res.json()
      setCompleted(true)
      onModuleCompleted(data.progress)
      if (data.courseCompleted) {
        toast.success('🎉 Congratulations! You have completed the course!')
      } else {
        toast.success('Module completed! Great work!')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark module as completed')
    } finally {
      setCompleting(false)
    }
  }

  const handleQuizSubmit = () => {
    if (!content?.questions) return
    const questions = content.questions
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++
      }
    })
    const score = Math.round((correct / questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)

    if (score >= (content.passingScore || 70)) {
      handleCompleteModule(score)
    }
  }

  const type = moduleType.toUpperCase()

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading module content...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <Button variant="outline" onClick={onClose}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  // Completed state
  if (completed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5">
        <CardContent className="p-8 text-center space-y-4">
          <Trophy className="size-16 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Module Completed!</h3>
          <p className="text-muted-foreground">
            You have successfully completed &quot;{moduleTitle}&quot;
          </p>
          {type === 'QUIZ' && quizSubmitted && (
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                Your Score: {quizScore}%
                {quizScore >= (content.passingScore || 70) ? (
                  <CheckCircle2 className="inline size-5 ml-2 text-emerald-600" />
                ) : null}
              </p>
              <p className="text-sm text-muted-foreground">
                Passing score: {content.passingScore || 70}%
              </p>
            </div>
          )}
          <Button variant="outline" onClick={onClose} className="mt-4">
            Continue to Course
          </Button>
        </CardContent>
      </Card>
    )
  }

  // VIDEO content
  if (type === 'VIDEO') {
    return (
      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">{content.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          {content.durationMinutes && (
            <p className="text-sm text-muted-foreground">{content.durationMinutes} min video</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {content.videoUrl ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                className="w-full h-full"
                src={content.videoUrl}
                onEnded={() => handleCompleteModule()}
              >
                Your browser does not support the video element.
              </video>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex flex-col items-center justify-center text-white">
              <Video className="size-16 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-300">Video content coming soon for this module</p>
              <p className="text-sm text-slate-500 mt-1">The video for &quot;{content.title}&quot; will be available shortly</p>
            </div>
          )}

          {content.description && (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}

          <div className="flex justify-end">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => handleCompleteModule()}
              disabled={completing}
            >
              {completing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Mark as Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // QUIZ content
  if (type === 'QUIZ') {
    const questions = content.questions || []
    const currentQuestion = questions[currentQuestionIndex]
    const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined)

    return (
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-amber-600" />
              <CardTitle className="text-lg">{content.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {questions.length} Questions
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Passing: {content.passingScore || 70}%
            </Badge>
          </div>
          {!quizSubmitted && (
            <div className="mt-3">
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!quizSubmitted ? (
            <>
              {currentQuestion && (
                <div className="space-y-4">
                  <h4 className="font-medium text-base">{currentQuestion.question}</h4>
                  <RadioGroup
                    value={selectedAnswers[currentQuestion.id]?.toString()}
                    onValueChange={(value) =>
                      setSelectedAnswers({
                        ...selectedAnswers,
                        [currentQuestion.id]: parseInt(value),
                      })
                    }
                  >
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          setSelectedAnswers({
                            ...selectedAnswers,
                            [currentQuestion.id]: idx,
                          })
                        }
                      >
                        <RadioGroupItem
                          value={idx.toString()}
                          id={`q-${currentQuestion.id}-${idx}`}
                        />
                        <Label
                          htmlFor={`q-${currentQuestion.id}-${idx}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="size-4 mr-1" /> Previous
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  >
                    Next <ArrowRight className="size-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleQuizSubmit}
                    disabled={!allAnswered}
                  >
                    <CheckCircle2 className="size-4 mr-1" />
                    Submit Quiz
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Quiz Results */}
              <div className={`p-6 rounded-lg text-center ${quizScore >= (content.passingScore || 70) ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'}`}>
                <h3 className="text-2xl font-bold mb-2">
                  {quizScore >= (content.passingScore || 70) ? '🎉 Passed!' : '❌ Not Passed'}
                </h3>
                <p className="text-lg font-semibold">
                  Score: {quizScore}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Passing score: {content.passingScore || 70}%
                </p>
              </div>

              {/* Review Answers */}
              <div className="space-y-3">
                <h4 className="font-medium">Review Your Answers:</h4>
                {questions.map((q, idx) => {
                  const userAnswer = selectedAnswers[q.id]
                  const isCorrect = userAnswer === q.correctIndex
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                          : 'bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <X className="size-4 text-red-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answer: {userAnswer !== undefined ? q.options[userAnswer] : 'Not answered'}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-emerald-600 mt-0.5">
                              Correct answer: {q.options[q.correctIndex]}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {quizScore < (content.passingScore || 70) && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuizSubmitted(false)
                      setSelectedAnswers({})
                      setCurrentQuestionIndex(0)
                      setQuizScore(0)
                    }}
                  >
                    Retry Quiz
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // TEXT / READING content
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-blue-600" />
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        {content.durationMinutes && (
          <p className="text-sm text-muted-foreground">{content.durationMinutes} min read</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {(content.readingContent || '').split('\n').map((line, idx) => {
            if (line.startsWith('# ')) {
              return <h2 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h2>
            }
            if (line.startsWith('## ')) {
              return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h3>
            }
            if (line.startsWith('### ')) {
              return <h4 key={idx} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h4>
            }
            if (line.startsWith('- ')) {
              return <li key={idx} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
            }
            if (line.trim() === '') {
              return <br key={idx} />
            }
            return <p key={idx} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={() => handleCompleteModule()}
            disabled={completing}
          >
            {completing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Mark as Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
