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
  Star,
  BarChart3,
} from 'lucide-react'
import { simulations, simulationTypes, simulationDifficulties } from '@/lib/academy-data'

export default function SimulationsPage() {
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [difficultyFilter, setDifficultyFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredSimulations = simulations.filter((sim) => {
    const matchesType = typeFilter === 'All' || sim.scenarioType === typeFilter
    const matchesDifficulty = difficultyFilter === 'All' || sim.difficulty === difficultyFilter
    const matchesSearch =
      searchQuery === '' ||
      sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesDifficulty && matchesSearch
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
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
            Easy
          </Badge>
        )
      case 'Medium':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
            Medium
          </Badge>
        )
      case 'Hard':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20">
            Hard
          </Badge>
        )
      case 'Expert':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
            Expert
          </Badge>
        )
      default:
        return <Badge variant="secondary">{difficulty}</Badge>
    }
  }

  const totalCompletions = simulations.reduce((sum, s) => sum + s.completions, 0)
  const avgScore = Math.round(
    simulations.reduce((sum, s) => sum + s.avgScore, 0) / simulations.length
  )

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
              <p className="text-xl font-bold">4</p>
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
                {simulationTypes.map((type) => (
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
                {simulationDifficulties.map((d) => (
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
        {filteredSimulations.map((sim) => (
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
                  <Trophy className="size-3" /> Avg: {sim.avgScore}%
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3" /> {sim.completions.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {sim.duration}
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {sim.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Start Button */}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-1" size="sm">
                <Play className="size-4 mr-2" /> Start Simulation
              </Button>
            </CardContent>
          </Card>
        ))}
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
    </div>
  )
}
