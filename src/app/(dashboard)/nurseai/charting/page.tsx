'use client'

import * as React from 'react'
import { chartNotes } from '@/lib/nurseai-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Mic, MicOff, Sparkles, Check, X, Edit3, Brain, FileText,
  Clock, RotateCcw, Zap, Shield, AlertCircle, ArrowRight
} from 'lucide-react'

const noteTypeOptions = [
  { value: 'Progress', label: 'Progress Note (SOAP)' },
  { value: 'Assessment', label: 'Assessment Note' },
  { value: 'Handover', label: 'Handover Note' },
  { value: 'SBAR', label: 'SBAR Report' },
  { value: 'Nursing', label: 'Nursing Note' },
  { value: 'Discharge', label: 'Discharge Summary' },
]

const sampleOutputs: Record<string, string> = {
  'Progress': `S: Patient reports decreased pain and improved comfort. No new complaints. Tolerating oral intake well.\nO: Temp 37.2°C, HR 82 bpm, BP 124/78 mmHg, RR 18/min, SpO2 97%. Wound site clean and dry. No signs of infection.\nA: Condition improving. Responding well to current treatment regimen.\nP: Continue current medications. Monitor vitals Q4H. Advance diet as tolerated. Plan for discharge review tomorrow.`,
  'Assessment': `CLINICAL ASSESSMENT\n\nPresenting Condition: Patient shows steady improvement with decreasing symptom burden.\n\nPhysical Findings:\n- Vital signs within acceptable ranges\n- No acute distress observed\n- Wound healing progressing as expected\n\nRisk Assessment: Low risk for complications at this time.\n\nRecommendations:\n1. Continue current treatment plan\n2. Increase activity as tolerated\n3. Follow-up labs in 48 hours`,
  'Handover': `HANDOVER NOTE — Shift Change\n\nPatient Summary: [Patient Name], [Age]yo [Gender], Ward [X] Bed [Y]\nDiagnosis: [Primary Diagnosis]\n\nCurrent Status: Stable, improving\n\nKey Information:\n1. IV access — Left forearm, 20G, patent\n2. Allergies — [List allergies]\n3. Pending — [List pending orders/tests]\n4. Alerts — [Any special monitoring needs]\n\nMedications Due Next Shift:\n- [Med] [Dose] [Route] at [Time]\n\nConcerns: None at this time.`,
  'SBAR': `SITUATION: I am Nurse [Name] calling about [Patient Name] in Ward [X], Bed [Y]. The patient is [current condition status].\n\nBACKGROUND: Patient was admitted on [date] with [diagnosis]. Current medications include [list]. Relevant history: [key history].\n\nASSESSMENT: Current vitals — Temp [X]°C, HR [X], BP [X]/[X], SpO2 [X]%. My assessment is [clinical judgment]. The patient is [improving/stable/declining].\n\nRECOMMENDATION: I recommend [specific actions]. Please [specific request]. Is there anything else you would like me to do?`,
  'Nursing': `NURSING NOTE\n\nDate/Time: [Current]\n\nPatient resting comfortably in bed. Alert and oriented x3. Skin warm and dry. IV site [location] — no signs of phlebitis or infiltration.\n\nIntake: [X] mL oral, [X] mL IV\nOutput: [X] mL urine, [X] mL other\n\nPain Assessment: [X]/10, location [X], character [X]\n\nNursing Interventions Performed:\n- Vitals monitored and documented\n- Medications administered as ordered\n- Wound assessed and dressed\n- Patient education provided on [topic]\n\nPlan: Continue monitoring. Next vitals due at [time].`,
  'Discharge': `DISCHARGE SUMMARY\n\nAdmission Date: [Date]\nDischarge Date: [Date]\nLength of Stay: [X] days\n\nAdmission Diagnosis: [Diagnosis]\nDischarge Diagnosis: [Diagnosis]\n\nCondition at Discharge: Stable, improved\n\nDischarge Medications:\n1. [Medication] [Dose] [Route] [Frequency]\n2. [Medication] [Dose] [Route] [Frequency]\n\nFollow-up:\n- Clinic appointment in [X] days\n- Wound care instructions provided\n- Return if symptoms worsen\n\nPatient Education:\n- Medication compliance emphasized\n- Diet and activity restrictions discussed\n- Emergency warning signs reviewed`,
}

export default function ChartingPage() {
  const [noteType, setNoteType] = React.useState('Progress')
  const [inputText, setInputText] = React.useState('')
  const [isListening, setIsListening] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generatedNote, setGeneratedNote] = React.useState('')
  const [aiConfidence, setAiConfidence] = React.useState(0)
  const [noteStatus, setNoteStatus] = React.useState<'idle' | 'generated' | 'accepted' | 'rejected' | 'modified'>('idle')
  const [recentNotes] = React.useState(chartNotes)

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false)
    } else {
      setIsListening(true)
      // Simulate voice input
      setTimeout(() => {
        setInputText(prev => prev + (prev ? ' ' : '') + 'Patient is resting comfortably, vitals are stable, no new complaints reported, wound site is clean and dry, tolerating oral intake well.')
        setIsListening(false)
      }, 2000)
    }
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setNoteStatus('idle')
    setGeneratedNote('')
    setAiConfidence(0)

    // Simulate AI processing
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

    setTimeout(() => {
      clearInterval(confidenceInterval)
      setAiConfidence(confidenceTarget)
      setGeneratedNote(sampleOutputs[noteType] || sampleOutputs['Progress'])
      setIsGenerating(false)
      setNoteStatus('generated')
    }, 2500)
  }

  const handleAccept = () => {
    setNoteStatus('accepted')
  }

  const handleReject = () => {
    setNoteStatus('rejected')
    setGeneratedNote('')
    setAiConfidence(0)
  }

  const handleModify = () => {
    setNoteStatus('modified')
  }

  const getNoteStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200'
      case 'Modified': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Pending Review': return 'bg-sky-50 text-sky-700 border-sky-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'Progress': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Assessment': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Handover': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'SBAR': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Nursing': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'Discharge': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
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
          {/* AI Status Indicator */}
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
                  <Label className="text-xs font-medium">Template Format</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Format</SelectItem>
                      <SelectItem value="compact">Compact Format</SelectItem>
                      <SelectItem value="detailed">Detailed Format</SelectItem>
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
                        <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    {/* AI Confidence Badge */}
                    <Badge variant="outline" className={`text-xs font-mono ${
                      aiConfidence >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      aiConfidence >= 80 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <Shield className="size-3 mr-1" />
                      AI Confidence: {aiConfidence}%
                    </Badge>
                    {noteStatus !== 'idle' && noteStatus !== 'generated' && (
                      <Badge variant="outline" className={`text-xs ${getNoteStatusBadge(noteStatus.charAt(0).toUpperCase() + noteStatus.slice(1))}`}>
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
                      <Button size="sm" onClick={handleAccept} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="size-3.5" />
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
              {recentNotes.map(note => (
                <div key={note.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{note.patientName}</p>
                    <Badge variant="outline" className={`text-[10px] ${getNoteStatusBadge(note.status)}`}>
                      {note.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className={`text-[10px] ${getNoteTypeColor(note.noteType)}`}>
                      {note.noteType}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{note.content.slice(0, 80)}...</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <Shield className="size-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Confidence: {note.aiConfidence}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
