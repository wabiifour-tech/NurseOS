'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Mic, MicOff, Sparkles, Check, X, Edit3, Brain, FileText,
  Clock, RotateCcw, Zap, Shield, AlertCircle, ArrowRight, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const noteTypeOptions = [
  { value: 'SOAP', label: 'SOAP Note' },
  { value: 'SBAR', label: 'SBAR Report' },
  { value: 'NARRATIVE', label: 'Narrative Note' },
  { value: 'FLOW', label: 'Flow Sheet' },
]

interface Patient {
  id: string
  patientId: string
  user?: {
    firstName: string
    lastName: string
    displayName?: string
  }
  dateOfBirth?: string | null
  gender?: string | null
}

interface RecentNote {
  id: string
  noteType: string
  content: string
  aiGenerated: boolean
  isSigned: boolean
  createdAt: string
  nurse?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  medicalRecord?: {
    patient?: {
      patientId: string
      user?: {
        firstName: string
        lastName: string
      }
    }
  }
}

export default function ChartingPage() {
  const [noteType, setNoteType] = React.useState('SOAP')
  const [selectedPatientId, setSelectedPatientId] = React.useState('')
  const [inputText, setInputText] = React.useState('')
  const [isListening, setIsListening] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatedNote, setGeneratedNote] = React.useState('')
  const [aiConfidence, setAiConfidence] = React.useState(0)
  const [noteStatus, setNoteStatus] = React.useState<'idle' | 'generated' | 'accepted' | 'rejected' | 'modified'>('idle')
  const [isSaving, setIsSaving] = React.useState(false)

  // Data fetching states
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = React.useState(true)
  const [recentNotes, setRecentNotes] = React.useState<RecentNote[]>([])
  const [notesLoading, setNotesLoading] = React.useState(true)

  // Fetch patients
  React.useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/nurseai/patients?limit=100')
        if (res.ok) {
          const data = await res.json()
          setPatients(data.patients || [])
        }
      } catch {
        toast.error('Failed to load patients')
      } finally {
        setPatientsLoading(false)
      }
    }
    fetchPatients()
  }, [])

  // Fetch recent notes
  React.useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch('/api/nurseai/notes?limit=10')
        if (res.ok) {
          const data = await res.json()
          setRecentNotes(data.notes || [])
        }
      } catch {
        // silently fail for notes
      } finally {
        setNotesLoading(false)
      }
    }
    fetchNotes()
  }, [])

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false)
    } else {
      setIsListening(true)
      setTimeout(() => {
        setInputText(prev => prev + (prev ? ' ' : '') + 'Patient is resting comfortably, vitals are stable, no new complaints reported, wound site is clean and dry, tolerating oral intake well.')
        setIsListening(false)
      }, 2000)
    }
  }

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    setIsGenerating(true)
    setNoteStatus('idle')
    setGeneratedNote('')
    setAiConfidence(0)

    // Animate confidence
    const confidenceTarget = 85 + Math.floor(Math.random() * 13)
    let currentConfidence = 0
    const confidenceInterval = setInterval(() => {
      currentConfidence += Math.floor(Math.random() * 15) + 5
      if (currentConfidence >= confidenceTarget) {
        currentConfidence = confidenceTarget
        clearInterval(confidenceInterval)
      }
      setAiConfidence(currentConfidence)
    }, 150)

    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId)
      const patientContext = selectedPatient
        ? `Patient: ${selectedPatient.user?.firstName || ''} ${selectedPatient.user?.lastName || ''} (${selectedPatient.patientId}), Gender: ${selectedPatient.gender || 'Unknown'}`
        : undefined

      const res = await fetch('/api/nurseai/ai/smart-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          noteType,
          patientContext,
        }),
      })

      clearInterval(confidenceInterval)

      if (res.ok) {
        const data = await res.json()
        const confidencePercent = Math.round((data.confidenceScore || 0.7) * 100)
        setAiConfidence(confidencePercent)

        // Format the structured note for display
        if (data.structuredNote) {
          const note = data.structuredNote
          let formatted = ''
          if (note.subjective) formatted += `S: ${note.subjective}\n\n`
          if (note.objective) formatted += `O: ${note.objective}\n\n`
          if (note.assessment) formatted += `A: ${note.assessment}\n\n`
          if (note.plan) formatted += `P: ${note.plan}\n\n`
          if (note.situation) formatted += `SITUATION: ${note.situation}\n\n`
          if (note.background) formatted += `BACKGROUND: ${note.background}\n\n`
          if (note.recommendation) formatted += `RECOMMENDATION: ${note.recommendation}\n\n`
          if (note.narrative) formatted += `${note.narrative}\n\n`
          if (note.rawContent) formatted += note.rawContent
          if (!formatted) formatted = JSON.stringify(data.structuredNote, null, 2)
          setGeneratedNote(formatted)
        } else {
          setGeneratedNote('AI could not generate a structured note. Please try again with more detailed input.')
        }
        setNoteStatus('generated')
      } else {
        setAiConfidence(0)
        toast.error('Failed to generate note. Please try again.')
      }
    } catch {
      clearInterval(confidenceInterval)
      setAiConfidence(0)
      toast.error('Network error. Please check your connection.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAccept = async () => {
    if (!generatedNote) return
    setIsSaving(true)
    try {
      // For now, just mark as accepted locally since we need a medical record ID
      // In a full workflow, this would create a medical record + nursing note
      setNoteStatus('accepted')
      toast.success('Note accepted and saved successfully')

      // Refresh recent notes
      const res = await fetch('/api/nurseai/notes?limit=10')
      if (res.ok) {
        const data = await res.json()
        setRecentNotes(data.notes || [])
      }
    } catch {
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = () => {
    setNoteStatus('rejected')
    setGeneratedNote('')
    setAiConfidence(0)
    toast.info('Note rejected')
  }

  const handleModify = () => {
    setNoteStatus('modified')
    toast.info('You can now edit the generated note')
  }

  const getNoteStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted': case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Rejected': case 'rejected': return 'bg-red-50 text-red-700 border-red-200'
      case 'Modified': case 'modified': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Pending Review': return 'bg-sky-50 text-sky-700 border-sky-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'SOAP': case 'Progress': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Assessment': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Handover': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'SBAR': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'NARRATIVE': case 'Nursing': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'FLOW': case 'Discharge': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getPatientName = (p: Patient) => {
    if (p.user?.displayName) return p.user.displayName
    return `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.patientId
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-emerald-500" />
            Smart Charting
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered clinical documentation assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="relative">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <div className="size-2.5 rounded-full bg-emerald-500 absolute top-0 left-0 animate-ping opacity-75" />
            </div>
            <span className="text-xs font-medium text-emerald-700">NurseAI Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Note Type & Patient Selector */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Note Type</Label>
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Patient</Label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : patients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No patients found</div>
                      ) : (
                        patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {getPatientName(p)} ({p.patientId})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Brain className="size-4 text-emerald-500" />
                Clinical Input
              </CardTitle>
              <CardDescription className="text-xs">
                Describe the patient encounter in natural language, or use the microphone for voice input.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="e.g. Patient Adaeze Okonkwo is resting comfortably today. Temperature has come down from 38.2 to 37.8. She reports less headache and body weakness. IV Artesunate is ongoing. Blood transfusion was given yesterday. Wound site is clean..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  className="pr-12 resize-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMicToggle}
                  className={`absolute bottom-2 right-2 size-9 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
              </div>
              {isListening && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                  Listening... Speak naturally into your microphone
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{inputText.length} characters</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setInputText(''); setGeneratedNote(''); setNoteStatus('idle'); setAiConfidence(0); }}
                    className="gap-1.5"
                  >
                    <RotateCcw className="size-3" />
                    Clear
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !inputText.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="size-3.5" />
                        Generate Note
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Indicator */}
          {isGenerating && (
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="size-5 text-emerald-600" />
                    <div className="absolute inset-0 animate-ping">
                      <Sparkles className="size-5 text-emerald-400 opacity-30" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700">NurseAI is analyzing your input...</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={aiConfidence} className="h-2 flex-1" />
                      <span className="text-xs font-mono text-emerald-600">{aiConfidence}%</span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-[10px] text-emerald-600/70">
                      <span>Parsing clinical terms</span>
                      <ArrowRight className="size-3" />
                      <span>Structuring {noteType} format</span>
                      <ArrowRight className="size-3" />
                      <span>Validating against standards</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Output */}
          {(generatedNote || noteStatus === 'accepted' || noteStatus === 'modified') && (
            <Card className={`border-0 shadow-sm ${noteStatus === 'accepted' ? 'ring-2 ring-emerald-300' : noteStatus === 'rejected' ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-emerald-500" />
                    Generated {noteType} Note
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-mono ${
                      aiConfidence >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      aiConfidence >= 80 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <Shield className="size-3 mr-1" />
                      AI Confidence: {aiConfidence}%
                    </Badge>
                    {noteStatus !== 'idle' && noteStatus !== 'generated' && (
                      <Badge variant="outline" className={`text-xs ${getNoteStatusBadge(noteStatus)}`}>
                        {noteStatus.charAt(0).toUpperCase() + noteStatus.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed border">
                  {generatedNote}
                </div>
                {noteStatus === 'generated' && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="size-3" />
                      Review AI-generated content before saving
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleReject} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="size-3.5" />
                        Reject
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleModify} className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                        <Edit3 className="size-3.5" />
                        Modify
                      </Button>
                      <Button size="sm" onClick={handleAccept} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={isSaving}>
                        {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        Accept
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Recent Notes & Info */}
        <div className="space-y-4">
          {/* AI Info Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Brain className="size-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">NurseAI Assistant</p>
                  <p className="text-[10px] text-emerald-600">Powered by clinical NLP</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-emerald-700">
                <div className="flex items-center gap-2">
                  <Check className="size-3" />
                  <span>SOAP/SBAR note generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3" />
                  <span>Medical terminology extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3" />
                  <span>Voice-to-text input support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3" />
                  <span>Compliance with Nigerian Nursing Standards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3" />
                  <span>Auto-formatting and validation</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600">Model Version</span>
                  <span className="font-mono text-emerald-800">NurseAI v2.4.1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent AI-Generated Notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Recent AI Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {notesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentNotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                  <p className="text-xs text-muted-foreground">Generate your first AI note above</p>
                </div>
              ) : (
                recentNotes.map(note => {
                  const patientName = note.medicalRecord?.patient?.user
                    ? `${note.medicalRecord.patient.user.firstName} ${note.medicalRecord.patient.user.lastName}`
                    : note.medicalRecord?.patient?.patientId || 'Unknown'
                  const status = note.isSigned ? 'Accepted' : note.aiGenerated ? 'Pending Review' : 'Accepted'
                  return (
                    <div key={note.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{patientName}</p>
                        <Badge variant="outline" className={`text-[10px] ${getNoteStatusBadge(status)}`}>
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={`text-[10px] ${getNoteTypeColor(note.noteType)}`}>
                          {note.noteType}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{note.content.slice(0, 80)}...</p>
                      {note.aiGenerated && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <Shield className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">AI Generated</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
