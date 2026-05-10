'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { patients, vitalsReadings, medicalRecords, medicationOrders, labResults, chartNotes, calculateNEWS2, getNEWS2Color, getNEWS2Label } from '@/lib/nurseai-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, Phone, MapPin, AlertTriangle, Activity, Heart, Thermometer,
  Droplets, Wind, Stethoscope, Pill, FileText, Clock, Calendar,
  TrendingUp, Shield, User, Beaker
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const patient = patients.find(p => p.id === patientId)

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">Patient not found</h1>
        <Link href="/nurseai/patients" className="text-emerald-600 hover:underline mt-2 inline-block">
          Back to Patients
        </Link>
      </div>
    )
  }

  const patientVitals = vitalsReadings.filter(v => v.patientId === patientId)
  const patientRecords = medicalRecords.filter(r => r.patientId === patientId)
  const patientMeds = medicationOrders.filter(m => m.patientId === patientId)
  const patientLabs = labResults.filter(l => l.patientId === patientId)
  const patientNotes = chartNotes.filter(n => n.patientId === patientId)

  const latestVitals = patientVitals.length > 0
    ? patientVitals.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]
    : null

  const news2Score = latestVitals ? calculateNEWS2(latestVitals) : 0

  // Prepare chart data sorted by date
  const vitalsChartData = [...patientVitals]
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inpatient': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Outpatient': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Emergency': return 'bg-red-50 text-red-700 border-red-200'
      case 'Discharged': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getMedStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Administered': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Held': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getRecordStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Discharged': return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Closed': return 'bg-slate-50 text-slate-500 border-slate-200'
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const isVitalAbnormal = (type: string, value: number) => {
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Link href="/nurseai/patients">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Patients
        </Button>
      </Link>

      {/* Patient Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <Avatar className="size-16 border-2 border-emerald-200">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg font-bold">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-bold">{patient.name}</h1>
                <Badge variant="outline" className={`w-fit text-xs ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </Badge>
                {patient.bedNumber && (
                  <Badge variant="outline" className="w-fit text-xs bg-teal-50 text-teal-700 border-teal-200">
                    Bed {patient.bedNumber}
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
                  <p className="font-medium">{patient.dob}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Type</p>
                  <Badge variant="outline" className="font-mono">{patient.bloodType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ward</p>
                  <p className="font-medium">{patient.ward}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{patient.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-red-500" />
                  <span className="text-sm">
                    {patient.allergies.length > 0 ? (
                      <span className="text-red-600 font-medium">Allergies: {patient.allergies.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-600">No known allergies</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Diagnosis: </span>
                  <span className="font-medium">{patient.primaryDiagnosis}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Doctor: </span>
                  <span className="font-medium">{patient.attendingDoctor}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Nurse: </span>
                  <span className="font-medium">{patient.nurse}</span>
                </div>
              </div>
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
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Activity className="size-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{patientVitals.length}</p>
                <p className="text-xs text-muted-foreground">Vital Readings</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Pill className="size-5 text-teal-600 mx-auto mb-1" />
                <p className="text-2xl font-bold">{patientMeds.filter(m => m.status === 'Verified' || m.status === 'Administered').length}</p>
                <p className="text-xs text-muted-foreground">Active Medications</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="size-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{patientMeds.filter(m => m.interactionAlert).length}</p>
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
                <CardDescription className="text-xs">{latestVitals.date} at {latestVitals.time}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { icon: Thermometer, label: 'Temp', value: `${latestVitals.temperature}°C`, abnormal: isVitalAbnormal('temp', latestVitals.temperature) },
                    { icon: Heart, label: 'Heart Rate', value: `${latestVitals.heartRate} bpm`, abnormal: isVitalAbnormal('hr', latestVitals.heartRate) },
                    { icon: Activity, label: 'BP', value: `${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`, abnormal: isVitalAbnormal('bpSys', latestVitals.bloodPressureSystolic) },
                    { icon: Wind, label: 'Resp Rate', value: `${latestVitals.respiratoryRate}/min`, abnormal: isVitalAbnormal('rr', latestVitals.respiratoryRate) },
                    { icon: Droplets, label: 'SpO2', value: `${latestVitals.oxygenSaturation}%`, abnormal: isVitalAbnormal('spo2', latestVitals.oxygenSaturation) },
                    { icon: Activity, label: 'Pain', value: `${latestVitals.painScore}/10`, abnormal: latestVitals.painScore >= 7 },
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
              {patientRecords.length === 0 && patientNotes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No encounters recorded</p>
              )}
              {patientRecords.sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                <div key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getRecordStatusColor(record.status)}`}>{record.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{record.encounterType}</Badge>
                      <span className="text-xs text-muted-foreground">{record.date}</span>
                    </div>
                    <p className="text-sm font-medium mt-0.5">{record.chiefComplaint}</p>
                    <p className="text-xs text-muted-foreground">{record.nurse}</p>
                  </div>
                </div>
              ))}
              {patientNotes.sort((a, b) => b.date.localeCompare(a.date)).map(note => (
                <div key={note.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-teal-500 mt-1.5" />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-700 border-teal-200">{note.noteType} Note</Badge>
                      <span className="text-xs text-muted-foreground">{note.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{note.content.slice(0, 100)}...</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VITALS TAB */}
        <TabsContent value="vitals" className="space-y-4">
          {vitalsChartData.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No vitals data available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Temperature Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Thermometer className="size-4 text-red-500" /> Temperature (°C)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
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

              {/* Blood Pressure Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="size-4 text-purple-500" /> Blood Pressure (mmHg)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
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

              {/* Heart Rate Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Heart className="size-4 text-pink-500" /> Heart Rate (bpm)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
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

              {/* SpO2 Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Droplets className="size-4 text-blue-500" /> Oxygen Saturation (%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
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

              {/* Respiratory Rate Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wind className="size-4 text-emerald-500" /> Respiratory Rate (/min)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
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
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Temp</TableHead>
                          <TableHead>HR</TableHead>
                          <TableHead>BP</TableHead>
                          <TableHead>RR</TableHead>
                          <TableHead>SpO2</TableHead>
                          <TableHead>Pain</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...patientVitals].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).map(v => (
                          <TableRow key={v.id}>
                            <TableCell className="text-xs">{v.date}</TableCell>
                            <TableCell className="text-xs">{v.time}</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('temp', v.temperature) ? 'text-red-600' : ''}`}>{v.temperature}°C</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('hr', v.heartRate) ? 'text-red-600' : ''}`}>{v.heartRate}</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('bpSys', v.bloodPressureSystolic) ? 'text-red-600' : ''}`}>{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('rr', v.respiratoryRate) ? 'text-red-600' : ''}`}>{v.respiratoryRate}</TableCell>
                            <TableCell className={`text-xs font-medium ${isVitalAbnormal('spo2', v.oxygenSaturation) ? 'text-red-600' : ''}`}>{v.oxygenSaturation}%</TableCell>
                            <TableCell className={`text-xs font-medium ${v.painScore >= 7 ? 'text-red-600' : ''}`}>{v.painScore}/10</TableCell>
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
          {patientRecords.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medical records</p>
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
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...patientRecords].sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{record.encounterType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{record.date}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{record.chiefComplaint}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{record.diagnosis}</TableCell>
                        <TableCell className="text-xs">{record.nurse}</TableCell>
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
        </TabsContent>

        {/* MEDICATIONS TAB */}
        <TabsContent value="medications" className="space-y-4">
          {patientMeds.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Pill className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medications on file</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {patientMeds.filter(m => m.interactionAlert).length > 0 && (
                <Card className="border border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                      <AlertTriangle className="size-4" />
                      Drug Interaction Alerts
                    </div>
                    {patientMeds.filter(m => m.interactionAlert).map(med => (
                      <div key={med.id} className="mt-2 text-xs text-red-600">
                        <span className="font-medium">{med.medicationName}</span>: {med.interactionDetail}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
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
                      {patientMeds.map(med => (
                        <TableRow key={med.id} className={med.interactionAlert ? 'bg-red-50/50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {med.interactionAlert && <AlertTriangle className="size-3.5 text-red-500" />}
                              <span className="text-sm font-medium">{med.medicationName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{med.dosage}</TableCell>
                          <TableCell className="text-xs">{med.route}</TableCell>
                          <TableCell className="text-xs">{med.frequency}</TableCell>
                          <TableCell className="text-xs">{med.startDate} — {med.endDate}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${getMedStatusColor(med.status)}`}>
                              {med.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* LAB RESULTS TAB */}
        <TabsContent value="labs" className="space-y-4">
          {patientLabs.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Beaker className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No lab results</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Flag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...patientLabs].sort((a, b) => b.date.localeCompare(a.date)).map(lab => (
                      <TableRow key={lab.id} className={lab.abnormal ? 'bg-red-50/50' : ''}>
                        <TableCell className="text-sm font-medium">{lab.testName}</TableCell>
                        <TableCell className={`text-sm font-semibold ${lab.abnormal ? 'text-red-600' : ''}`}>
                          {lab.result}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lab.referenceRange}</TableCell>
                        <TableCell className="text-xs">{lab.unit}</TableCell>
                        <TableCell className="text-xs">{lab.date}</TableCell>
                        <TableCell>
                          {lab.abnormal ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Abnormal</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
