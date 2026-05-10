'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Thermometer, Heart, Activity, Droplets, Wind, Shield, AlertTriangle,
  Plus, TrendingUp, TrendingDown, Minus, Loader2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { toast } from 'sonner'

interface Patient {
  id: string
  patientId: string
  dateOfBirth?: string | null
  gender?: string | null
  user?: {
    firstName: string
    lastName: string
    displayName?: string
  }
}

interface VitalRecord {
  id: string
  patientId: string
  temperature: number | null
  heartRate: number | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  respiratoryRate: number | null
  oxygenSaturation: number | null
  weight: number | null
  painScale: number | null
  earlyWarningScore: number | null
  isAbnormal: boolean | null
  recordedAt: string
  source: string
  patient?: Patient
}

function calculateNEWS2(v: {
  temperature?: number | null
  heartRate?: number | null
  bloodPressureSystolic?: number | null
  oxygenSaturation?: number | null
  respiratoryRate?: number | null
}): number {
  let score = 0
  if (v.respiratoryRate) {
    if (v.respiratoryRate <= 8 || v.respiratoryRate >= 25) score += 3
    else if (v.respiratoryRate >= 21) score += 2
    else if (v.respiratoryRate >= 12) score += 0
    else score += 1
  }
  if (v.oxygenSaturation) {
    if (v.oxygenSaturation <= 91) score += 3
    else if (v.oxygenSaturation <= 93) score += 2
    else if (v.oxygenSaturation <= 95) score += 1
  }
  if (v.temperature) {
    if (v.temperature <= 35) score += 3
    else if (v.temperature >= 39.1) score += 2
    else if (v.temperature <= 36) score += 1
  }
  if (v.bloodPressureSystolic) {
    if (v.bloodPressureSystolic <= 90) score += 3
    else if (v.bloodPressureSystolic <= 100) score += 2
    else if (v.bloodPressureSystolic <= 110) score += 1
    else if (v.bloodPressureSystolic >= 220) score += 3
  }
  if (v.heartRate) {
    if (v.heartRate <= 40 || v.heartRate >= 131) score += 3
    else if (v.heartRate >= 111) score += 2
    else if (v.heartRate >= 91) score += 1
  }
  return score
}

function getNEWS2Color(score: number): string {
  if (score <= 1) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score <= 4) return 'text-amber-600 bg-amber-50 border-amber-200'
  if (score <= 6) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function getNEWS2Label(score: number): string {
  if (score <= 1) return 'Low'
  if (score <= 4) return 'Low-Medium'
  if (score <= 6) return 'Medium'
  return 'High'
}

const isVitalAbnormal = (type: string, value: number) => {
  switch (type) {
    case 'temp': return value >= 38.0 || value <= 35.0
    case 'hr': return value >= 110 || value <= 50
    case 'bpSys': return value >= 140 || value <= 90
    case 'spo2': return value <= 94
    case 'rr': return value >= 22 || value <= 10
    default: return false
  }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="size-3 text-red-500" />
  if (trend === 'down') return <TrendingDown className="size-3 text-emerald-500" />
  return <Minus className="size-3 text-muted-foreground" />
}

function getVitalTrend(vitals: VitalRecord[], type: string): 'up' | 'down' | 'stable' {
  if (vitals.length < 2) return 'stable'
  const sorted = [...vitals].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  const latest = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  let diff = 0
  switch (type) {
    case 'temp': diff = (latest.temperature || 0) - (prev.temperature || 0); break
    case 'hr': diff = (latest.heartRate || 0) - (prev.heartRate || 0); break
    case 'bpSys': diff = (latest.bloodPressureSystolic || 0) - (prev.bloodPressureSystolic || 0); break
    case 'spo2': diff = (latest.oxygenSaturation || 0) - (prev.oxygenSaturation || 0); break
    case 'rr': diff = (latest.respiratoryRate || 0) - (prev.respiratoryRate || 0); break
  }
  if (diff > 0.5) return 'up'
  if (diff < -0.5) return 'down'
  return 'stable'
}

function getPatientName(p: Patient) {
  if (p.user?.displayName) return p.user.displayName
  return `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || p.patientId
}

function getPatientInitials(p: Patient) {
  if (p.user?.firstName && p.user?.lastName) {
    return `${p.user.firstName[0]}${p.user.lastName[0]}`
  }
  return p.patientId.slice(0, 2).toUpperCase()
}

export default function VitalsPage() {
  const { user } = useAuthStore()
  const [selectedPatient, setSelectedPatient] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // Data states
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = React.useState(true)
  const [vitals, setVitals] = React.useState<VitalRecord[]>([])
  const [vitalsLoading, setVitalsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  // Form state
  const [formPatientId, setFormPatientId] = React.useState('')
  const [formTemp, setFormTemp] = React.useState('')
  const [formHR, setFormHR] = React.useState('')
  const [formRR, setFormRR] = React.useState('')
  const [formBPSys, setFormBPSys] = React.useState('')
  const [formBPDia, setFormBPDia] = React.useState('')
  const [formSpO2, setFormSpO2] = React.useState('')
  const [formWeight, setFormWeight] = React.useState('')
  const [formPain, setFormPain] = React.useState('')

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

  // Fetch vitals
  const fetchVitals = React.useCallback(async () => {
    try {
      const url = selectedPatient !== 'all'
        ? `/api/nurseai/vitals?patientId=${selectedPatient}&limit=100`
        : '/api/nurseai/vitals?limit=100'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setVitals(data.vitals || [])
      }
    } catch {
      toast.error('Failed to load vitals')
    } finally {
      setVitalsLoading(false)
    }
  }, [selectedPatient])

  React.useEffect(() => {
    fetchVitals()
  }, [fetchVitals])

  // Group vitals by patient and get latest per patient
  const vitalsByPatient = React.useMemo(() => {
    const map = new Map<string, VitalRecord[]>()
    vitals.forEach(v => {
      const existing = map.get(v.patientId) || []
      existing.push(v)
      map.set(v.patientId, existing)
    })
    return map
  }, [vitals])

  const latestVitalsPerPatient = React.useMemo(() => {
    const result: { patient: Patient; vitals: VitalRecord; allVitals: VitalRecord[] }[] = []
    vitalsByPatient.forEach((patientVitals, patientId) => {
      const sorted = [...patientVitals].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      const patient = patients.find(p => p.id === patientId) || sorted[0]?.patient || { id: patientId, patientId: patientId }
      if (sorted.length > 0) {
        result.push({ patient, vitals: sorted[0], allVitals: sorted })
      }
    })

    if (selectedPatient !== 'all') {
      return result.filter(p => p.patient.id === selectedPatient)
    }
    return result
  }, [vitalsByPatient, patients, selectedPatient])

  // Chart data for selected patient
  const chartData = React.useMemo(() => {
    if (selectedPatient === 'all') return []
    const patientVitals = vitalsByPatient.get(selectedPatient) || []
    return [...patientVitals]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map(v => ({
        time: new Date(v.recordedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        temperature: v.temperature,
        heartRate: v.heartRate,
        bpSystolic: v.bloodPressureSystolic,
        bpDiastolic: v.bloodPressureDiastolic,
        spO2: v.oxygenSaturation,
        respiratoryRate: v.respiratoryRate,
      }))
  }, [selectedPatient, vitalsByPatient])

  const handleSaveVitals = async () => {
    if (!formPatientId) {
      toast.error('Please select a patient')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/nurseai/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          nurseId: user?.id,
          temperature: formTemp ? parseFloat(formTemp) : null,
          heartRate: formHR ? parseInt(formHR) : null,
          respiratoryRate: formRR ? parseInt(formRR) : null,
          bloodPressureSystolic: formBPSys ? parseInt(formBPSys) : null,
          bloodPressureDiastolic: formBPDia ? parseInt(formBPDia) : null,
          oxygenSaturation: formSpO2 ? parseFloat(formSpO2) : null,
          weight: formWeight ? parseFloat(formWeight) : null,
          painScale: formPain ? parseInt(formPain) : null,
        }),
      })

      if (res.ok) {
        toast.success('Vitals recorded successfully')
        setDialogOpen(false)
        // Reset form
        setFormPatientId('')
        setFormTemp('')
        setFormHR('')
        setFormRR('')
        setFormBPSys('')
        setFormBPDia('')
        setFormSpO2('')
        setFormWeight('')
        setFormPain('')
        // Refresh vitals
        setVitalsLoading(true)
        fetchVitals()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to record vitals')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedPatientData = patients.find(p => p.id === selectedPatient)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vitals Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time patient vital signs monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>{getPatientName(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="size-4" />
                Record Vitals
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record Vital Signs</DialogTitle>
                <DialogDescription>Enter new vital sign readings for a patient.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={formPatientId} onValueChange={setFormPatientId}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patientsLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : patients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No patients found</div>
                      ) : (
                        patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>{getPatientName(p)} ({p.patientId})</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input type="number" step="0.1" placeholder="37.0" value={formTemp} onChange={e => setFormTemp(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Heart Rate (bpm)</Label>
                    <Input type="number" placeholder="72" value={formHR} onChange={e => setFormHR(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Resp Rate (/min)</Label>
                    <Input type="number" placeholder="18" value={formRR} onChange={e => setFormRR(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>BP Systolic</Label>
                    <Input type="number" placeholder="120" value={formBPSys} onChange={e => setFormBPSys(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>BP Diastolic</Label>
                    <Input type="number" placeholder="80" value={formBPDia} onChange={e => setFormBPDia(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SpO2 (%)</Label>
                    <Input type="number" placeholder="98" value={formSpO2} onChange={e => setFormSpO2(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="65" value={formWeight} onChange={e => setFormWeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pain Score (0-10)</Label>
                    <Input type="number" min="0" max="10" placeholder="0" value={formPain} onChange={e => setFormPain(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveVitals} disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Save Vitals
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {vitalsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-muted-foreground">Loading vitals data...</span>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {latestVitalsPerPatient.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Thermometer className="size-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Vitals Recorded</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {patients.length === 0
                    ? 'Add patients first, then record their vital signs.'
                    : 'Click "Record Vitals" to add the first vital sign reading.'}
                </p>
                {patients.length > 0 && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setDialogOpen(true)}>
                    <Plus className="size-4" />
                    Record Vitals
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Patient Vital Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestVitalsPerPatient.map(({ patient, vitals: latestVital, allVitals }) => {
                  const news2 = calculateNEWS2(latestVital)
                  return (
                    <Card key={patient.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                              {getPatientInitials(patient)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{getPatientName(patient)}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(latestVital.recordedAt).toLocaleDateString()} {new Date(latestVital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getNEWS2Color(news2)}`}>
                            NEWS2: {news2} — {getNEWS2Label(news2)}
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {/* Temperature */}
                          <div className={`p-2 rounded-lg text-center ${latestVital.temperature && isVitalAbnormal('temp', latestVital.temperature) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                            <Thermometer className={`size-3.5 mx-auto mb-0.5 ${latestVital.temperature && isVitalAbnormal('temp', latestVital.temperature) ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-bold ${latestVital.temperature && isVitalAbnormal('temp', latestVital.temperature) ? 'text-red-600' : ''}`}>
                              {latestVital.temperature ? `${latestVital.temperature}°` : '—'}
                            </p>
                            <div className="flex items-center justify-center gap-0.5">
                              <TrendIcon trend={getVitalTrend(allVitals, 'temp')} />
                              <span className="text-[9px] text-muted-foreground">Temp</span>
                            </div>
                          </div>
                          {/* Heart Rate */}
                          <div className={`p-2 rounded-lg text-center ${latestVital.heartRate && isVitalAbnormal('hr', latestVital.heartRate) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                            <Heart className={`size-3.5 mx-auto mb-0.5 ${latestVital.heartRate && isVitalAbnormal('hr', latestVital.heartRate) ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-bold ${latestVital.heartRate && isVitalAbnormal('hr', latestVital.heartRate) ? 'text-red-600' : ''}`}>
                              {latestVital.heartRate || '—'}
                            </p>
                            <div className="flex items-center justify-center gap-0.5">
                              <TrendIcon trend={getVitalTrend(allVitals, 'hr')} />
                              <span className="text-[9px] text-muted-foreground">HR</span>
                            </div>
                          </div>
                          {/* Blood Pressure */}
                          <div className={`p-2 rounded-lg text-center ${latestVital.bloodPressureSystolic && isVitalAbnormal('bpSys', latestVital.bloodPressureSystolic) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                            <Activity className={`size-3.5 mx-auto mb-0.5 ${latestVital.bloodPressureSystolic && isVitalAbnormal('bpSys', latestVital.bloodPressureSystolic) ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-bold ${latestVital.bloodPressureSystolic && isVitalAbnormal('bpSys', latestVital.bloodPressureSystolic) ? 'text-red-600' : ''}`}>
                              {latestVital.bloodPressureSystolic && latestVital.bloodPressureDiastolic
                                ? `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}`
                                : '—'}
                            </p>
                            <div className="flex items-center justify-center gap-0.5">
                              <TrendIcon trend={getVitalTrend(allVitals, 'bpSys')} />
                              <span className="text-[9px] text-muted-foreground">BP</span>
                            </div>
                          </div>
                          {/* SpO2 */}
                          <div className={`p-2 rounded-lg text-center ${latestVital.oxygenSaturation && isVitalAbnormal('spo2', latestVital.oxygenSaturation) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                            <Droplets className={`size-3.5 mx-auto mb-0.5 ${latestVital.oxygenSaturation && isVitalAbnormal('spo2', latestVital.oxygenSaturation) ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-bold ${latestVital.oxygenSaturation && isVitalAbnormal('spo2', latestVital.oxygenSaturation) ? 'text-red-600' : ''}`}>
                              {latestVital.oxygenSaturation ? `${latestVital.oxygenSaturation}%` : '—'}
                            </p>
                            <div className="flex items-center justify-center gap-0.5">
                              <TrendIcon trend={getVitalTrend(allVitals, 'spo2')} />
                              <span className="text-[9px] text-muted-foreground">SpO2</span>
                            </div>
                          </div>
                          {/* Respiratory Rate */}
                          <div className={`p-2 rounded-lg text-center ${latestVital.respiratoryRate && isVitalAbnormal('rr', latestVital.respiratoryRate) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                            <Wind className={`size-3.5 mx-auto mb-0.5 ${latestVital.respiratoryRate && isVitalAbnormal('rr', latestVital.respiratoryRate) ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <p className={`text-sm font-bold ${latestVital.respiratoryRate && isVitalAbnormal('rr', latestVital.respiratoryRate) ? 'text-red-600' : ''}`}>
                              {latestVital.respiratoryRate || '—'}
                            </p>
                            <div className="flex items-center justify-center gap-0.5">
                              <TrendIcon trend={getVitalTrend(allVitals, 'rr')} />
                              <span className="text-[9px] text-muted-foreground">RR</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Charts Section */}
              {selectedPatient !== 'all' && chartData.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Vital Trends — {selectedPatientData ? getPatientName(selectedPatientData) : 'Patient'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Thermometer className="size-4 text-red-500" /> Temperature (°C)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                              <YAxis domain={[35, 41]} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <ReferenceLine y={38} stroke="#ef4444" strokeDasharray="3 3" />
                              <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Heart className="size-4 text-pink-500" /> Heart Rate (bpm)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                              <YAxis domain={[40, 130]} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <Line type="monotone" dataKey="heartRate" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Activity className="size-4 text-purple-500" /> Blood Pressure (mmHg)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                              <YAxis domain={[50, 200]} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" />
                              <Line type="monotone" dataKey="bpSystolic" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                              <Line type="monotone" dataKey="bpDiastolic" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Droplets className="size-4 text-blue-500" /> Oxygen Saturation (%)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                              <YAxis domain={[85, 100]} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <ReferenceLine y={94} stroke="#ef4444" strokeDasharray="3 3" />
                              <Line type="monotone" dataKey="spO2" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Wind className="size-4 text-emerald-500" /> Respiratory Rate (/min)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                              <YAxis domain={[10, 30]} tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <Line type="monotone" dataKey="respiratoryRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* NEWS2 Overview */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="size-4 text-emerald-500" />
                    Early Warning Score (NEWS2) Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{latestVitalsPerPatient.filter(p => calculateNEWS2(p.vitals) <= 1).length}</p>
                      <p className="text-xs text-emerald-600 font-medium">Low Risk (0-1)</p>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-amber-200 bg-amber-50 text-center">
                      <p className="text-2xl font-bold text-amber-700">{latestVitalsPerPatient.filter(p => { const s = calculateNEWS2(p.vitals); return s >= 2 && s <= 4; }).length}</p>
                      <p className="text-xs text-amber-600 font-medium">Low-Medium Risk (2-4)</p>
                    </div>
                    <div className="p-3 rounded-lg border-2 border-red-200 bg-red-50 text-center">
                      <p className="text-2xl font-bold text-red-700">{latestVitalsPerPatient.filter(p => calculateNEWS2(p.vitals) >= 5).length}</p>
                      <p className="text-xs text-red-600 font-medium">Medium-High Risk (5+)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
