'use client'

import * as React from 'react'
import { patients, vitalsReadings, calculateNEWS2, getNEWS2Color, getNEWS2Label } from '@/lib/nurseai-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Thermometer, Heart, Activity, Droplets, Wind, Shield, AlertTriangle,
  Plus, TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'

export default function VitalsPage() {
  const [selectedPatient, setSelectedPatient] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const filteredVitals = selectedPatient === 'all'
    ? vitalsReadings
    : vitalsReadings.filter(v => v.patientId === selectedPatient)

  // Get latest vitals per patient
  const latestVitalsPerPatient = patients
    .map(p => {
      const pVitals = vitalsReadings.filter(v => v.patientId === p.id)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      if (pVitals.length === 0) return null
      return { patient: p, vitals: pVitals[0], allVitals: pVitals }
    })
    .filter(Boolean) as { patient: typeof patients[0]; vitals: typeof vitalsReadings[0]; allVitals: typeof vitalsReadings[] }[]

  const displayedPatients = selectedPatient === 'all'
    ? latestVitalsPerPatient
    : latestVitalsPerPatient.filter(p => p.patient.id === selectedPatient)

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

  const getVitalTrend = (vitals: typeof vitalsReadings[], type: string): 'up' | 'down' | 'stable' => {
    if (vitals.length < 2) return 'stable'
    const sorted = [...vitals].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    let diff = 0
    switch (type) {
      case 'temp': diff = latest.temperature - prev.temperature; break
      case 'hr': diff = latest.heartRate - prev.heartRate; break
      case 'bpSys': diff = latest.bloodPressureSystolic - prev.bloodPressureSystolic; break
      case 'spo2': diff = latest.oxygenSaturation - prev.oxygenSaturation; break
      case 'rr': diff = latest.respiratoryRate - prev.respiratoryRate; break
    }
    if (diff > 0.5) return 'up'
    if (diff < -0.5) return 'down'
    return 'stable'
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="size-3 text-red-500" />
    if (trend === 'down') return <TrendingDown className="size-3 text-emerald-500" />
    return <Minus className="size-3 text-muted-foreground" />
  }

  // Aggregate chart data for selected patient
  const chartData = selectedPatient !== 'all'
    ? [...vitalsReadings.filter(v => v.patientId === selectedPatient)]
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .map(v => ({
          time: `${v.date.slice(5)} ${v.time}`,
          temperature: v.temperature,
          heartRate: v.heartRate,
          bpSystolic: v.bloodPressureSystolic,
          bpDiastolic: v.bloodPressureDiastolic,
          spO2: v.oxygenSaturation,
          respiratoryRate: v.respiratoryRate,
        }))
    : []

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
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input type="number" step="0.1" placeholder="37.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Heart Rate (bpm)</Label>
                    <Input type="number" placeholder="72" />
                  </div>
                  <div className="space-y-2">
                    <Label>Resp Rate (/min)</Label>
                    <Input type="number" placeholder="18" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>BP Systolic</Label>
                    <Input type="number" placeholder="120" />
                  </div>
                  <div className="space-y-2">
                    <Label>BP Diastolic</Label>
                    <Input type="number" placeholder="80" />
                  </div>
                  <div className="space-y-2">
                    <Label>SpO2 (%)</Label>
                    <Input type="number" placeholder="98" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="65" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pain Score (0-10)</Label>
                    <Input type="number" min="0" max="10" placeholder="0" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(false)}>Save Vitals</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Patient Vital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedPatients.map(({ patient, vitals, allVitals }) => {
          const news2 = calculateNEWS2(vitals)
          return (
            <Card key={patient.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-[10px] text-muted-foreground">{patient.ward} • {vitals.date} {vitals.time}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getNEWS2Color(news2)}`}>
                    NEWS2: {news2} — {getNEWS2Label(news2)}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {/* Temperature */}
                  <div className={`p-2 rounded-lg text-center ${isVitalAbnormal('temp', vitals.temperature) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                    <Thermometer className={`size-3.5 mx-auto mb-0.5 ${isVitalAbnormal('temp', vitals.temperature) ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-bold ${isVitalAbnormal('temp', vitals.temperature) ? 'text-red-600' : ''}`}>{vitals.temperature}°</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <TrendIcon trend={getVitalTrend(allVitals, 'temp')} />
                      <span className="text-[9px] text-muted-foreground">Temp</span>
                    </div>
                  </div>
                  {/* Heart Rate */}
                  <div className={`p-2 rounded-lg text-center ${isVitalAbnormal('hr', vitals.heartRate) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                    <Heart className={`size-3.5 mx-auto mb-0.5 ${isVitalAbnormal('hr', vitals.heartRate) ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-bold ${isVitalAbnormal('hr', vitals.heartRate) ? 'text-red-600' : ''}`}>{vitals.heartRate}</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <TrendIcon trend={getVitalTrend(allVitals, 'hr')} />
                      <span className="text-[9px] text-muted-foreground">HR</span>
                    </div>
                  </div>
                  {/* Blood Pressure */}
                  <div className={`p-2 rounded-lg text-center ${isVitalAbnormal('bpSys', vitals.bloodPressureSystolic) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                    <Activity className={`size-3.5 mx-auto mb-0.5 ${isVitalAbnormal('bpSys', vitals.bloodPressureSystolic) ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-bold ${isVitalAbnormal('bpSys', vitals.bloodPressureSystolic) ? 'text-red-600' : ''}`}>{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <TrendIcon trend={getVitalTrend(allVitals, 'bpSys')} />
                      <span className="text-[9px] text-muted-foreground">BP</span>
                    </div>
                  </div>
                  {/* SpO2 */}
                  <div className={`p-2 rounded-lg text-center ${isVitalAbnormal('spo2', vitals.oxygenSaturation) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                    <Droplets className={`size-3.5 mx-auto mb-0.5 ${isVitalAbnormal('spo2', vitals.oxygenSaturation) ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-bold ${isVitalAbnormal('spo2', vitals.oxygenSaturation) ? 'text-red-600' : ''}`}>{vitals.oxygenSaturation}%</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <TrendIcon trend={getVitalTrend(allVitals, 'spo2')} />
                      <span className="text-[9px] text-muted-foreground">SpO2</span>
                    </div>
                  </div>
                  {/* Respiratory Rate */}
                  <div className={`p-2 rounded-lg text-center ${isVitalAbnormal('rr', vitals.respiratoryRate) ? 'bg-red-50 border border-red-200' : 'bg-muted/30'}`}>
                    <Wind className={`size-3.5 mx-auto mb-0.5 ${isVitalAbnormal('rr', vitals.respiratoryRate) ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-bold ${isVitalAbnormal('rr', vitals.respiratoryRate) ? 'text-red-600' : ''}`}>{vitals.respiratoryRate}</p>
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

      {/* Charts Section (shown when a specific patient is selected) */}
      {selectedPatient !== 'all' && chartData.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Vital Trends — {patients.find(p => p.id === selectedPatient)?.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature Chart */}
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

            {/* Heart Rate Chart */}
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

            {/* Blood Pressure Chart */}
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

            {/* SpO2 Chart */}
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

            {/* Respiratory Rate Chart */}
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
              <p className="text-2xl font-bold text-emerald-700">{displayedPatients.filter(p => calculateNEWS2(p.vitals) <= 1).length}</p>
              <p className="text-xs text-emerald-600 font-medium">Low Risk (0-1)</p>
            </div>
            <div className="p-3 rounded-lg border-2 border-amber-200 bg-amber-50 text-center">
              <p className="text-2xl font-bold text-amber-700">{displayedPatients.filter(p => { const s = calculateNEWS2(p.vitals); return s >= 2 && s <= 4; }).length}</p>
              <p className="text-xs text-amber-600 font-medium">Low-Medium Risk (2-4)</p>
            </div>
            <div className="p-3 rounded-lg border-2 border-red-200 bg-red-50 text-center">
              <p className="text-2xl font-bold text-red-700">{displayedPatients.filter(p => calculateNEWS2(p.vitals) >= 5).length}</p>
              <p className="text-xs text-red-600 font-medium">Medium-High Risk (5+)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
