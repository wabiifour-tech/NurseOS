'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Phone, Mail, AlertTriangle, Activity, Heart, Thermometer,
  Droplets, Wind, Stethoscope, Pill, FileText, Calendar,
  Shield, Loader2, Beaker, ClipboardList, MapPin, Plus, Send
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'

// Types matching the API response
interface UserInfo {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  displayName: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  status: string
}

interface VitalSignData {
  id: string
  patientId: string
  recordId: string | null
  recordedByNurseId: string | null
  temperature: number | null
  heartRate: number | null
  respiratoryRate: number | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  oxygenSaturation: number | null
  weight: number | null
  height: number | null
  bmi: number | null
  bloodGlucose: number | null
  painScale: number | null
  consciousnessLevel: string | null
  recordedAt: string
  earlyWarningScore: number | null
  isAbnormal: boolean | null
  notes: string | null
  source: string
}

interface MedicalRecordData {
  id: string
  patientId: string
  facilityId: string
  departmentId: string | null
  encounterType: string
  encounterDate: string
  attendingNurseId: string | null
  attendingDoctorId: string | null
  chiefComplaint: string
  historyOfPresentIllness: string | null
  pastMedicalHistory: string | null
  familyHistory: string | null
  socialHistory: string | null
  nursingAssessment: string | null
  nursingDiagnosis: string
  nursingCarePlan: string | null
  interventions: string
  evaluationNotes: string | null
  dischargeSummary: string | null
  aiSuggestions: string | null
  aiConfidenceScore: number | null
  status: string
  createdAt: string
  updatedAt: string
}

interface MedicationOrderData {
  id: string
  patientId: string
  recordId: string
  prescribedByDoctorId: string | null
  verifiedByNurseId: string | null
  medicationName: string
  dosage: string
  route: string
  frequency: string
  duration: string | null
  startDate: string
  endDate: string | null
  indications: string | null
  contraindications: string
  drugInteractions: string | null
  interactionAlerts: string | null
  status: string
  administeredAt: string | null
  administeredByNurseId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface LabOrderData {
  id: string
  patientId: string
  recordId: string
  orderedBy: string
  testName: string
  testCategory: string
  specimenType: string | null
  urgency: string
  status: string
  resultValue: string | null
  resultUnit: string | null
  referenceRange: string | null
  isAbnormal: boolean | null
  resultDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface NursingNoteData {
  id: string
  recordId: string
  nurseId: string
  noteType: string
  content: string
  aiGenerated: boolean
  aiPrompt: string | null
  isSigned: boolean
  signedAt: string | null
  createdAt: string
  updatedAt: string
}

interface VisitRecordData {
  id: string
  patientId: string
  facilityId: string | null
  visitDate: string
  visitType: string
  outcome: string | null
  createdAt: string
}

interface PatientData {
  id: string
  userId: string | null
  patientId: string
  dateOfBirth: string | null
  gender: string | null
  bloodType: string | null
  genotype: string | null
  allergies: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelation: string | null
  nationality: string | null
  stateOfOrigin: string | null
  lga: string | null
  religion: string | null
  occupation: string | null
  insuranceProvider: string | null
  insuranceNumber: string | null
  createdAt: string
  updatedAt: string
  user: UserInfo | null
  vitals: VitalSignData[]
  medicalRecords: MedicalRecordData[]
  medications: MedicationOrderData[]
  labOrders: LabOrderData[]
  nursingNotes: NursingNoteData[]
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = React.useState<PatientData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [error, setError] = React.useState(false)

  // Visit records state
  const [visitRecords, setVisitRecords] = React.useState<VisitRecordData[]>([])
  const [visitsLoading, setVisitsLoading] = React.useState(false)
  const [newVisitType, setNewVisitType] = React.useState('')
  const [newVisitOutcome, setNewVisitOutcome] = React.useState('')
  const [submittingVisit, setSubmittingVisit] = React.useState(false)

  React.useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true)
        setNotFound(false)
        setError(false)

        const res = await fetch(`/api/nurseai/patients/${patientId}`)

        if (res.status === 404) {
          setNotFound(true)
          return
        }

        if (!res.ok) {
          setError(true)
          return
        }

        const data = await res.json()
        setPatient(data.patient)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  // Fetch visit records
  const fetchVisits = React.useCallback(async () => {
    if (!patientId) return
    setVisitsLoading(true)
    try {
      const res = await fetch(`/api/nurseai/patients/${patientId}/visits`)
      if (res.ok) {
        const data = await res.json()
        setVisitRecords(data.visits || [])
      }
    } catch {
      // silently fail
    } finally {
      setVisitsLoading(false)
    }
  }, [patientId])

  React.useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  const handleAddVisit = async () => {
    if (!newVisitType.trim()) {
      return
    }
    setSubmittingVisit(true)
    try {
      const res = await fetch(`/api/nurseai/patients/${patientId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitType: newVisitType.trim(),
          outcome: newVisitOutcome.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setVisitRecords(prev => [data.visit, ...prev])
        setNewVisitType('')
        setNewVisitOutcome('')
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingVisit(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="size-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (notFound) {
    return (
      <div className="p-4 md:p-6 text-center min-h-[60vh] flex items-center justify-center">
        <div className="space-y-4">
          <Activity className="size-12 mx-auto text-muted-foreground/30" />
          <h1 className="text-xl font-bold">Patient not found</h1>
          <p className="text-sm text-muted-foreground">The patient you are looking for does not exist or has been removed.</p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/nurseai/patients">
              <ArrowLeft className="size-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="p-4 md:p-6 text-center min-h-[60vh] flex items-center justify-center">
        <div className="space-y-4">
          <AlertTriangle className="size-12 mx-auto text-red-400" />
          <h1 className="text-xl font-bold">Failed to load patient</h1>
          <p className="text-sm text-muted-foreground">Something went wrong. Please try again later.</p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/nurseai/patients">
              <ArrowLeft className="size-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Derived data
  const patientName = patient.user
    ? `${patient.user.firstName ?? ''} ${patient.user.lastName ?? ''}`.trim() || 'Unknown Patient'
    : 'Unknown Patient'

  const patientInitials = patient.user
    ? `${patient.user.firstName?.charAt(0) ?? ''}${patient.user.lastName?.charAt(0) ?? ''}` || 'PT'
    : 'PT'

  const parsedAllergies: string[] = (() => {
    try {
      return JSON.parse(patient.allergies || '[]')
    } catch {
      return []
    }
  })()

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minutes}`
  }

  const getAge = (dob: string | null) => {
    if (!dob) return '—'
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return `${age} years`
  }

  // Vitals data
  const latestVitals = patient.vitals.length > 0 ? patient.vitals[0] : null

  // Calculate a simple NEWS2-like score
  const calculateNEWS2 = (v: VitalSignData): number => {
    let score = 0
    // Respiration rate
    if (v.respiratoryRate !== null) {
      if (v.respiratoryRate <= 8) score += 3
      else if (v.respiratoryRate >= 25) score += 3
      else if (v.respiratoryRate >= 21) score += 2
      else if (v.respiratoryRate >= 12) score += 0
      else score += 1
    }
    // Oxygen saturation
    if (v.oxygenSaturation !== null) {
      if (v.oxygenSaturation <= 91) score += 3
      else if (v.oxygenSaturation >= 92 && v.oxygenSaturation <= 93) score += 2
      else if (v.oxygenSaturation >= 94 && v.oxygenSaturation <= 95) score += 1
    }
    // Temperature
    if (v.temperature !== null) {
      if (v.temperature <= 35.0) score += 3
      else if (v.temperature >= 39.1) score += 2
      else if (v.temperature >= 38.1) score += 1
    }
    // Systolic BP
    if (v.bloodPressureSystolic !== null) {
      if (v.bloodPressureSystolic <= 90) score += 3
      else if (v.bloodPressureSystolic >= 220) score += 3
      else if (v.bloodPressureSystolic >= 111 && v.bloodPressureSystolic <= 219) score += 0
      else score += 2
    }
    // Heart rate
    if (v.heartRate !== null) {
      if (v.heartRate <= 40) score += 3
      else if (v.heartRate >= 131) score += 3
      else if (v.heartRate >= 111) score += 2
      else if (v.heartRate >= 91) score += 1
    }
    // Pain
    if (v.painScale !== null && v.painScale >= 7) score += 1
    return score
  }

  const news2Score = latestVitals ? calculateNEWS2(latestVitals) : 0

  const getNEWS2Color = (score: number) => {
    if (score <= 2) return 'border-emerald-300 bg-emerald-50'
    if (score <= 4) return 'border-amber-300 bg-amber-50'
    return 'border-red-300 bg-red-50'
  }

  const getNEWS2Label = (score: number) => {
    if (score <= 2) return 'Low'
    if (score <= 4) return 'Medium'
    return 'High'
  }

  // Chart data
  const vitalsChartData = [...patient.vitals]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(v => {
      const d = new Date(v.recordedAt)
      const hours = d.getHours().toString().padStart(2, '0')
      const minutes = d.getMinutes().toString().padStart(2, '0')
      return {
        time: `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${hours}:${minutes}`,
        temperature: v.temperature,
        heartRate: v.heartRate,
        bpSystolic: v.bloodPressureSystolic,
        bpDiastolic: v.bloodPressureDiastolic,
        spO2: v.oxygenSaturation,
        respiratoryRate: v.respiratoryRate,
      }
    })

  // Helpers
  const getMedStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'VERIFIED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'ADMINISTERED': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'HELD': return 'bg-red-50 text-red-700 border-red-200'
      case 'COMPLETED': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getRecordStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'DISCHARGED': return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CLOSED': return 'bg-slate-50 text-slate-500 border-slate-200'
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getLabStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ORDERED': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'IN_PROGRESS': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'CANCELLED': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const isVitalAbnormal = (type: string, value: number | null) => {
    if (value === null) return false
    switch (type) {
      case 'temp': return value >= 38.0 || value <= 35.0
      case 'hr': return value >= 110 || value <= 50
      case 'bpSys': return value >= 140 || value <= 90
      case 'bpDia': return value >= 90 || value <= 60
      case 'spo2': return value <= 94
      case 'rr': return value >= 22 || value <= 10
      default: return false
    }
  }

  // Check for drug interaction alerts
  const medsAlerts = patient.medications.filter(m => m.interactionAlerts)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
        <Link href="/nurseai/patients">
          <ArrowLeft className="size-4" />
          Back to Patients
        </Link>
      </Button>

      {/* Patient Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <Avatar className="size-16 border-2 border-emerald-200">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg font-bold">
                {patientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-bold">{patientName}</h1>
                {patient.user?.status && (
                  <Badge variant="outline" className="w-fit text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {patient.user.status}
                  </Badge>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Patient ID</p>
                  <p className="font-mono font-medium">{patient.patientId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Type</p>
                  <Badge variant="outline" className="font-mono">{patient.bloodType || '—'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium">{patient.gender || '—'}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {patient.user?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" />
                    <span>{patient.user.phone}</span>
                  </div>
                )}
                {patient.user?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5" />
                    <span className="truncate">{patient.user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-red-500" />
                  <span className="text-sm">
                    {parsedAllergies.length > 0 ? (
                      <span className="text-red-600 font-medium">Allergies: {parsedAllergies.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-600">No known allergies</span>
                    )}
                  </span>
                </div>
              </div>
              {patient.emergencyContactName && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="text-xs">Emergency Contact: </span>
                  <span className="font-medium">{patient.emergencyContactName}</span>
                  {patient.emergencyContactPhone && (
                    <span> — {patient.emergencyContactPhone}</span>
                  )}
                  {patient.emergencyContactRelation && (
                    <span> ({patient.emergencyContactRelation})</span>
                  )}
                </div>
              )}
              {patient.insuranceProvider && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <span className="text-xs">Insurance: </span>
                  <span className="font-medium">{patient.insuranceProvider}</span>
                  {patient.insuranceNumber && (
                    <span> ({patient.insuranceNumber})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="vitals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Vitals</TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Records</TabsTrigger>
          <TabsTrigger value="medications" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Medications</TabsTrigger>
          <TabsTrigger value="labs" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Lab Results</TabsTrigger>
          <TabsTrigger value="visits" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Visit Records</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Activity className="size-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{patient.vitals.length}</p>
                <p className="text-xs text-muted-foreground">Vital Readings</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Pill className="size-5 text-teal-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{patient.medications.filter(m => m.status.toUpperCase() === 'VERIFIED' || m.status.toUpperCase() === 'ADMINISTERED').length}</p>
                <p className="text-xs text-muted-foreground">Active Medications</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{medsAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Interaction Alerts</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className={`p-4 text-center border-2 rounded-lg ${getNEWS2Color(news2Score)}`}>
                <Shield className="size-5 mx-auto mb-1" />
                <p className="text-2xl font-bold">{news2Score}</p>
                <p className="text-xs">NEWS2 Score — {getNEWS2Label(news2Score)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Vitals Summary */}
          {latestVitals && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Latest Vitals</CardTitle>
                <CardDescription className="text-xs">{formatDateTime(latestVitals.recordedAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { icon: Thermometer, label: 'Temp', value: latestVitals.temperature !== null ? `${latestVitals.temperature}°C` : '—', abnormal: isVitalAbnormal('temp', latestVitals.temperature) },
                    { icon: Heart, label: 'Heart Rate', value: latestVitals.heartRate !== null ? `${latestVitals.heartRate} bpm` : '—', abnormal: isVitalAbnormal('hr', latestVitals.heartRate) },
                    { icon: Activity, label: 'BP', value: latestVitals.bloodPressureSystolic !== null && latestVitals.bloodPressureDiastolic !== null ? `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}` : '—', abnormal: isVitalAbnormal('bpSys', latestVitals.bloodPressureSystolic) },
                    { icon: Wind, label: 'Resp Rate', value: latestVitals.respiratoryRate !== null ? `${latestVitals.respiratoryRate}/min` : '—', abnormal: isVitalAbnormal('rr', latestVitals.respiratoryRate) },
                    { icon: Droplets, label: 'SpO2', value: latestVitals.oxygenSaturation !== null ? `${latestVitals.oxygenSaturation}%` : '—', abnormal: isVitalAbnormal('spo2', latestVitals.oxygenSaturation) },
                    { icon: Activity, label: 'Pain', value: latestVitals.painScale !== null ? `${latestVitals.painScale}/10` : '—', abnormal: latestVitals.painScale !== null ? latestVitals.painScale >= 7 : false },
                  ].map(v => (
                    <div key={v.label} className={`p-2.5 rounded-lg text-center ${v.abnormal ? 'bg-red-50 border border-red-200' : 'bg-muted/50'}`}>
                      <v.icon className={`size-4 mx-auto mb-1 ${v.abnormal ? 'text-red-500' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-semibold ${v.abnormal ? 'text-red-600' : ''}`}>{v.value}</p>
                      <p className="text-[10px] text-muted-foreground">{v.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Encounter Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Encounters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {patient.medicalRecords.length === 0 && patient.nursingNotes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No encounters recorded yet</p>
              )}
              {patient.medicalRecords.map(record => (
                <div key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${getRecordStatusColor(record.status)}`}>{record.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{record.encounterType}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(record.encounterDate)}</span>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{record.chiefComplaint}</p>
                  </div>
                </div>
              ))}
              {patient.nursingNotes.map(note => (
                <div key={note.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-teal-500 mt-1.5" />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">{note.noteType} Note</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                      {note.aiGenerated && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">AI</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VITALS TAB */}
        <TabsContent value="vitals" className="space-y-4">
          {patient.vitals.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No vitals data yet</p>
                <p className="text-sm mt-1">Vital signs recordings will appear here once recorded.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Temperature Chart */}
              {vitalsChartData.some(d => d.temperature !== null) && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Thermometer className="size-4 text-red-500" /> Temperature (°C)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsChartData.filter(d => d.temperature !== null)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={[35, 41]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Fever', fontSize: 10 }} />
                          <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blood Pressure Chart */}
              {vitalsChartData.some(d => d.bpSystolic !== null) && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="size-4 text-purple-500" /> Blood Pressure (mmHg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsChartData.filter(d => d.bpSystolic !== null)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={[50, 200]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'High', fontSize: 10 }} />
                          <Line type="monotone" dataKey="bpSystolic" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                          <Line type="monotone" dataKey="bpDiastolic" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Heart Rate Chart */}
              {vitalsChartData.some(d => d.heartRate !== null) && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Heart className="size-4 text-pink-500" /> Heart Rate (bpm)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsChartData.filter(d => d.heartRate !== null)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={[40, 130]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="heartRate" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SpO2 Chart */}
              {vitalsChartData.some(d => d.spO2 !== null) && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Droplets className="size-4 text-blue-500" /> Oxygen Saturation (%)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsChartData.filter(d => d.spO2 !== null)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <ReferenceLine y={94} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Low', fontSize: 10 }} />
                          <Line type="monotone" dataKey="spO2" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Respiratory Rate Chart */}
              {vitalsChartData.some(d => d.respiratoryRate !== null) && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Wind className="size-4 text-emerald-500" /> Respiratory Rate (/min)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalsChartData.filter(d => d.respiratoryRate !== null)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis domain={[10, 30]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="respiratoryRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vitals History Table */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Vitals History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Temp</TableHead>
                          <TableHead>HR</TableHead>
                          <TableHead>BP</TableHead>
                          <TableHead>RR</TableHead>
                          <TableHead>SpO2</TableHead>
                          <TableHead>Pain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patient.vitals.map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="text-xs whitespace-nowrap">{formatDateTime(v.recordedAt)}</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('temp', v.temperature) ? 'text-red-600' : ''}`}>
                              {v.temperature !== null ? `${v.temperature}°C` : '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('hr', v.heartRate) ? 'text-red-600' : ''}`}>
                              {v.heartRate ?? '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('bpSys', v.bloodPressureSystolic) ? 'text-red-600' : ''}`}>
                              {v.bloodPressureSystolic !== null && v.bloodPressureDiastolic !== null ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('rr', v.respiratoryRate) ? 'text-red-600' : ''}`}>
                              {v.respiratoryRate ?? '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('spo2', v.oxygenSaturation) ? 'text-red-600' : ''}`}>
                              {v.oxygenSaturation !== null ? `${v.oxygenSaturation}%` : '—'}
                            </TableCell>
                            <TableCell className={`text-xs font-medium ${v.painScale !== null && v.painScale >= 7 ? 'text-red-600' : ''}`}>
                              {v.painScale !== null ? `${v.painScale}/10` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* RECORDS TAB */}
        <TabsContent value="records" className="space-y-4">
          {patient.medicalRecords.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medical records yet</p>
                <p className="text-sm mt-1">Medical encounter records will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Encounter Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Chief Complaint</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.medicalRecords.map(record => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{record.encounterType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(record.encounterDate)}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{record.chiefComplaint}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getRecordStatusColor(record.status)}`}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Nursing Notes */}
          {patient.nursingNotes.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardList className="size-4 text-teal-600" />
                  Nursing Notes ({patient.nursingNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {patient.nursingNotes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">{note.noteType}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                      {note.aiGenerated && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">AI Generated</Badge>
                      )}
                      {note.isSigned && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Signed</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MEDICATIONS TAB */}
        <TabsContent value="medications" className="space-y-4">
          {patient.medications.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Pill className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medications on file</p>
                <p className="text-sm mt-1">Medication orders will appear here once prescribed.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {medsAlerts.length > 0 && (
                <Card className="border border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                      <AlertTriangle className="size-4" />
                      Drug Interaction Alerts
                    </div>
                    {medsAlerts.map(med => (
                      <div key={med.id} className="mt-2 text-xs text-red-600">
                        <span className="font-medium">{med.medicationName}</span>: {med.interactionAlerts}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patient.medications.map(med => (
                          <TableRow key={med.id} className={med.interactionAlerts ? 'bg-red-50/50' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {med.interactionAlerts && <AlertTriangle className="size-3.5 text-red-500" />}
                                <span className="text-sm font-medium">{med.medicationName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{med.dosage}</TableCell>
                            <TableCell className="text-xs">{med.route}</TableCell>
                            <TableCell className="text-xs">{med.frequency}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {formatDate(med.startDate)} — {med.endDate ? formatDate(med.endDate) : 'Ongoing'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${getMedStatusColor(med.status)}`}>
                                {med.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* LAB RESULTS TAB */}
        <TabsContent value="labs" className="space-y-4">
          {patient.labOrders.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Beaker className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No lab results yet</p>
                <p className="text-sm mt-1">Lab orders will appear here once ordered.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Reference Range</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patient.labOrders.map(lab => (
                        <TableRow key={lab.id} className={lab.isAbnormal ? 'bg-red-50/50' : ''}>
                          <TableCell className="text-sm font-medium">{lab.testName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{lab.testCategory}</TableCell>
                          <TableCell className={`text-sm font-semibold ${lab.isAbnormal ? 'text-red-600' : ''}`}>
                            {lab.resultValue ?? 'Pending'}
                            {lab.resultUnit ? ` ${lab.resultUnit}` : ''}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{lab.referenceRange || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${
                              lab.urgency === 'STAT' ? 'bg-red-50 text-red-700 border-red-200' :
                              lab.urgency === 'URGENT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {lab.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${getLabStatusColor(lab.status)}`}>
                              {lab.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(lab.createdAt)}</TableCell>
                          <TableCell>
                            {lab.isAbnormal === true ? (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Abnormal</Badge>
                            ) : lab.isAbnormal === false ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Normal</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* VISIT RECORDS TAB */}
        <TabsContent value="visits" className="space-y-4">
          {/* Add New Visit */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="size-4 text-emerald-600" />
                Add Visit Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Visit type (e.g., Outpatient, Emergency, Follow-up)"
                  value={newVisitType}
                  onChange={(e) => setNewVisitType(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Outcome (optional)"
                  value={newVisitOutcome}
                  onChange={(e) => setNewVisitOutcome(e.target.value)}
                  className="flex-1"
                />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 shrink-0"
                  onClick={handleAddVisit}
                  disabled={!newVisitType.trim() || submittingVisit}
                >
                  {submittingVisit ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Visit History */}
          {visitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-emerald-600" />
            </div>
          ) : visitRecords.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No visit records yet</p>
                <p className="text-sm mt-1">Add the first visit record for this patient above.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Visit Type</TableHead>
                        <TableHead>Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitRecords.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {formatDate(visit.visitDate)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{visit.visitType}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {visit.outcome || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
