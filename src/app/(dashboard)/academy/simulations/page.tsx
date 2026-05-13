'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  FlaskConical,
  AlertTriangle,
  Brain,
  MessageSquare,
  Scale,
  Play,
  Users,
  Trophy,
  Clock,
  Filter,
  Search,
  BarChart3,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

interface Simulation {
  id: string
  title: string
  description: string
  scenarioType: string
  difficulty: string
  durationMinutes: number | null
  timeLimitMinutes: number | null
  completionCount: number
  avgScore: number
  scenario: string | null
  learningObjectives: string
  isPublished: boolean
  createdAt: string
  _count?: { attempts: number }
}

type SimulationPhase = 'overview' | 'scenario' | 'feedback'

const DEFAULT_SCENARIOS: Record<string, string> = {
  Emergency: 'You are the charge nurse on a busy medical-surgical unit. A patient who is 2 days post-operative suddenly becomes unresponsive. Their blood pressure drops to 80/50, heart rate rises to 130 bpm, and SpO2 falls to 85%. The patient\'s skin is cool and diaphoretic. What are your immediate nursing actions, assessments, and priorities?',
  'Clinical Decision': 'You are caring for a 72-year-old patient with heart failure who has been receiving IV diuretics for 3 days. The morning lab results show: potassium 2.9 mEq/L, sodium 128 mEq/L, BUN 35 mg/dL, and creatinine 1.8 mg/dL. The patient reports muscle weakness and fatigue. Describe your clinical assessment and nursing interventions.',
  Communication: 'You are a nurse caring for a terminal patient whose family has just been informed of the prognosis. The patient\'s spouse is openly crying, the adult daughter is angry and demanding "everything possible be done," and the patient appears withdrawn. The attending physician has left the room after delivering the news. Describe how you would handle this situation.',
  'Ethical Dilemma': 'A competent 68-year-old patient with end-stage renal disease has decided to stop dialysis. The patient\'s family is strongly opposed and wants you to convince the patient to continue treatment. The patient has clearly stated their wishes but the family threatens legal action. Describe how you would navigate this ethical situation.',
  Default: 'You are assigned to care for a patient who has just been admitted with multiple comorbidities. The patient appears anxious and has several questions about their care plan. Describe your initial assessment and nursing approach.',
}

const FEEDBACK_TEMPLATES: Record<string, { strengths: string[]; improvements: string[]; notes: string }> = {
  Emergency: {
    strengths: ['Recognized the urgency of the situation', 'Prioritized patient assessment', 'Considered vital sign interpretation'],
    improvements: ['Include activation of rapid response team', 'Consider IV fluid resuscitation steps', 'Document timeline of interventions'],
    notes: 'Emergency scenarios require systematic ABC (Airway, Breathing, Circulation) approach with clear delegation and timely escalation.',
  },
  'Clinical Decision': {
    strengths: ['Identified critical lab abnormalities', 'Considered the patient\'s clinical context', 'Recognized potential complications'],
    improvements: ['Specify notification protocols for provider', 'Detail electrolyte replacement guidelines', 'Include ongoing monitoring parameters'],
    notes: 'Clinical decisions should integrate lab data with patient presentation and follow institutional protocols for critical values.',
  },
  Communication: {
    strengths: ['Demonstrated empathy for family members', 'Recognized different emotional responses', 'Showed awareness of patient needs'],
    improvements: ['Include therapeutic communication techniques', 'Consider cultural sensitivity', 'Plan for follow-up support resources'],
    notes: 'Effective communication in crisis involves active listening, acknowledging emotions, and providing clear, compassionate information.',
  },
  'Ethical Dilemma': {
    strengths: ['Respected patient autonomy', 'Acknowledged family concerns', 'Recognized the ethical complexity'],
    improvements: ['Involve ethics committee consultation', 'Document patient decision-making capacity', 'Coordinate with social work and chaplaincy'],
    notes: 'Ethical dilemmas require balancing autonomy, beneficence, and non-maleficence while following institutional policies and legal frameworks.',
  },
  Default: {
    strengths: ['Demonstrated patient-centered approach', 'Showed thoroughness in assessment', 'Considered holistic care needs'],
    improvements: ['Include specific assessment tools', 'Detail patient education components', 'Plan for care coordination'],
    notes: 'Comprehensive nursing care integrates assessment, intervention, patient education, and interdisciplinary collaboration.',
  },
}

function generateScore(response: string, difficulty: string): number {
  let score = 60
  score += Math.min(response.length / 10, 15)
  const medicalTerms = ['assessment', 'vital', 'monitor', 'intervene', 'notify', 'evaluate', 'document', 'communicate', 'priority', 'protocol']
  const usedTerms = medicalTerms.filter((term) => response.toLowerCase().includes(term))
  score += usedTerms.length * 2
  const difficultyModifier = { Easy: 5, Medium: 0, Hard: -5, Expert: -10 } as Record<string, number>
  score += difficultyModifier[difficulty] ?? 0
  return Math.min(Math.max(Math.round(score), 40), 98)
}

export default function SimulationsPage() {
  const [simulations, setSimulations] = React.useState<Simulation[]>([])
  const [types, setTypes] = React.useState<string[]>([])
  const [difficulties, setDifficulties] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [difficultyFilter, setDifficultyFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Simulation runner state
  const [simDialogOpen, setSimDialogOpen] = React.useState(false)
  const [selectedSim, setSelectedSim] = React.useState<Simulation | null>(null)
  const [simPhase, setSimPhase] = React.useState<SimulationPhase>('overview')
  const [userResponse, setUserResponse] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [simScore, setSimScore] = React.useState(0)

  // Fetch simulations from API
  const fetchSimulations = React.useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'All') params.set('type', typeFilter)
      if (difficultyFilter !== 'All') params.set('difficulty', difficultyFilter)

      const res = await fetch(`/api/nurseacademy/simulations?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch simulations')
      const data = await res.json()
      setSimulations(data.simulations || [])
      if (data.types) setTypes(data.types)
      if (data.difficulties) setDifficulties(data.difficulties)
    } catch {
      toast.error('Failed to load simulations')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, difficultyFilter])

  React.useEffect(() => {
    fetchSimulations()
  }, [fetchSimulations])

  // Client-side search filtering (API handles type/difficulty)
  const filteredSimulations = simulations.filter((sim) => {
    const matchesSearch =
      searchQuery === '' ||
      sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const scenarioIcon = (type: string) => {
    switch (type) {
      case 'Emergency':
        return <AlertTriangle className="size-5 text-red-600" />
      case 'Clinical Decision':
        return <Brain className="size-5 text-purple-600" />
      case 'Communication':
        return <MessageSquare className="size-5 text-blue-600" />
      case 'Ethical Dilemma':
        return <Scale className="size-5 text-amber-600" />
      default:
        return <FlaskConical className="size-5 text-emerald-600" />
    }
  }

  const scenarioColor = (type: string) => {
    switch (type) {
      case 'Emergency':
        return 'from-red-500 to-orange-500'
      case 'Clinical Decision':
        return 'from-purple-500 to-indigo-500'
      case 'Communication':
        return 'from-blue-500 to-cyan-500'
      case 'Ethical Dilemma':
        return 'from-amber-500 to-yellow-500'
      default:
        return 'from-emerald-500 to-teal-500'
    }
  }

  const difficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
      case 'EASY':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
            Easy
          </Badge>
        )
      case 'Medium':
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
            Medium
          </Badge>
        )
      case 'Hard':
      case 'HARD':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20">
            Hard
          </Badge>
        )
      case 'Expert':
      case 'EXPERT':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
            Expert
          </Badge>
        )
      default:
        return <Badge variant="secondary">{difficulty}</Badge>
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Self-paced'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const totalCompletions = simulations.reduce((sum, s) => sum + s.completionCount, 0)
  const avgScore = simulations.length > 0
    ? Math.round(simulations.reduce((sum, s) => sum + s.avgScore, 0) / simulations.length)
    : 0

  const allTypes = ['All', ...types]
  const allDifficulties = ['All', ...difficulties]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading simulations...</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clinical Simulations</h1>
          <p className="text-muted-foreground text-sm">
            Practice real-world clinical scenarios in a safe environment
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <FlaskConical className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{simulations.length}</p>
              <p className="text-xs text-muted-foreground">Simulations</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Users className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalCompletions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Completions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Trophy className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{types.length}</p>
              <p className="text-xs text-muted-foreground">Scenario Types</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search simulations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {allDifficulties.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSimulations.map((sim) => {
          // Parse learning objectives from JSON string
          let objectives: string[] = []
          try {
            objectives = JSON.parse(sim.learningObjectives || '[]')
          } catch {
            objectives = []
          }

          return (
            <Card key={sim.id} className="hover:shadow-md transition-all group">
              <div className={`h-24 bg-gradient-to-br ${scenarioColor(sim.scenarioType)} rounded-t-lg relative flex items-center justify-center`}>
                <div className="text-white/80">
                  {scenarioIcon(sim.scenarioType)}
                </div>
                <div className="absolute top-3 right-3">
                  {difficultyBadge(sim.difficulty)}
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px]">
                    {sim.scenarioType}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base leading-tight group-hover:text-emerald-600 transition-colors">
                  {sim.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {sim.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="size-3" /> Avg: {Math.round(sim.avgScore)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" /> {sim.completionCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {formatDuration(sim.durationMinutes || sim.timeLimitMinutes)}
                  </span>
                </div>

                {/* Learning Objectives as skills */}
                {objectives.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {objectives.slice(0, 3).map((obj) => (
                      <Badge key={obj} variant="secondary" className="text-[10px]">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Start Button */}
                <Button variant="outline" className="w-full mt-1" size="sm" onClick={() => {
                  setSelectedSim(sim)
                  setSimPhase('overview')
                  setUserResponse('')
                  setSimScore(0)
                  setIsSubmitting(false)
                  setSimDialogOpen(true)
                }}>
                  <Play className="size-4 mr-2" /> Start Simulation
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSimulations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FlaskConical className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No simulations found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {/* Simulation Runner Dialog */}
      <Dialog open={simDialogOpen} onOpenChange={(open) => {
        setSimDialogOpen(open)
        if (!open) {
          setSimPhase('overview')
          setUserResponse('')
          setIsSubmitting(false)
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSim && (
            <>
              {/* Phase: Overview */}
              {simPhase === 'overview' && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {scenarioIcon(selectedSim.scenarioType)}
                      {selectedSim.title}
                    </DialogTitle>
                    <DialogDescription>{selectedSim.description}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white dark:bg-card border text-foreground">
                        {selectedSim.scenarioType}
                      </Badge>
                      {difficultyBadge(selectedSim.difficulty)}
                      <Badge variant="outline" className="gap-1">
                        <Clock className="size-3" />
                        {formatDuration(selectedSim.durationMinutes || selectedSim.timeLimitMinutes)}
                      </Badge>
                    </div>
                    {(() => {
                      let objectives: string[] = []
                      try {
                        objectives = JSON.parse(selectedSim.learningObjectives || '[]')
                      } catch {
                        objectives = []
                      }
                      return objectives.length > 0 ? (
                        <div>
                          <p className="text-sm font-medium mb-2">Learning Objectives</p>
                          <ul className="space-y-1">
                            {objectives.map((obj) => (
                              <li key={obj} className="text-sm text-muted-foreground flex items-start gap-2">
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    })()}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <Trophy className="size-4" /> Avg Score: {Math.round(selectedSim.avgScore)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-4" /> {selectedSim.completionCount.toLocaleString()} completions
                      </span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      className="gap-2"
                      onClick={() => setSimPhase('scenario')}
                    >
                      Begin Simulation <ArrowRight className="size-4" />
                    </Button>
                  </DialogFooter>
                </>
              )}

              {/* Phase: Scenario */}
              {simPhase === 'scenario' && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {scenarioIcon(selectedSim.scenarioType)}
                      {selectedSim.title}
                    </DialogTitle>
                    <DialogDescription>
                      Read the scenario and provide your clinical response below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className={`p-4 rounded-lg bg-gradient-to-br ${scenarioColor(selectedSim.scenarioType)} bg-opacity-10 relative overflow-hidden`}>
                      <div className="bg-white/95 dark:bg-card/95 rounded-md p-4">
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <AlertTriangle className="size-4 text-amber-500" />
                          Clinical Scenario
                        </p>
                        <p className="text-sm leading-relaxed">
                          {selectedSim.scenario || DEFAULT_SCENARIOS[selectedSim.scenarioType] || DEFAULT_SCENARIOS.Default}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Response</label>
                      <Textarea
                        placeholder="Describe your nursing assessment, actions, and rationale..."
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        className="min-h-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Provide a detailed clinical response including your assessment, priorities, and interventions.
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSimPhase('overview')}
                    >
                      Back
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={!userResponse.trim() || isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true)
                        // Simulate AI feedback generation delay
                        await new Promise((resolve) => setTimeout(resolve, 1500))
                        const score = generateScore(userResponse, selectedSim.difficulty)
                        setSimScore(score)
                        setIsSubmitting(false)
                        setSimPhase('feedback')
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        'Submit Response'
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}

              {/* Phase: Feedback */}
              {simPhase === 'feedback' && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trophy className="size-5 text-amber-500" />
                      Simulation Complete
                    </DialogTitle>
                    <DialogDescription>
                      Review your performance feedback below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    {/* Score Display */}
                    <div className="text-center p-6 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-200/50 dark:border-emerald-500/10">
                      <p className="text-4xl font-bold text-emerald-600">{simScore}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Your Score</p>
                      <Progress value={simScore} className="mt-3 h-2" />
                    </div>

                    {/* Feedback Sections */}
                    {(() => {
                      const template =
                        FEEDBACK_TEMPLATES[selectedSim.scenarioType] ||
                        FEEDBACK_TEMPLATES.Default
                      return (
                        <>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                              <CheckCircle2 className="size-4" /> Strengths
                            </p>
                            <ul className="space-y-1 ml-6">
                              {template.strengths.map((s) => (
                                <li key={s} className="text-sm text-muted-foreground list-disc">
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                              <AlertTriangle className="size-4" /> Areas for Improvement
                            </p>
                            <ul className="space-y-1 ml-6">
                              {template.improvements.map((s) => (
                                <li key={s} className="text-sm text-muted-foreground list-disc">
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <p className="text-sm font-medium mb-1">Clinical Note</p>
                            <p className="text-sm text-muted-foreground">{template.notes}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setSimPhase('scenario')
                        setUserResponse('')
                        setSimScore(0)
                      }}
                    >
                      <RotateCcw className="size-4" /> Retry
                    </Button>
                    <Button
                      onClick={() => {
                        setSimDialogOpen(false)
                        toast.success(`Simulation completed! Score: ${simScore}%`)
                      }}
                    >
                      Complete
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
