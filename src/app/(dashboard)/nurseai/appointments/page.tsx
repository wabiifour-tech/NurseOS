'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import {
  CalendarDays, List, Plus, Clock, CheckCircle, Loader2,
  UserX, CalendarCheck, Stethoscope, MapPin, AlertCircle, CalendarX2
} from 'lucide-react'
import { toast } from 'sonner'

// ---- Types matching the API response ----
interface AppointmentPatient {
  id: string
  patientId: string
  user: {
    firstName: string
    lastName: string
    displayName: string | null
  } | null
}

interface AppointmentFacility {
  id: string
  name: string
}

interface Appointment {
  id: string
  patientId: string
  appointmentDate: string
  durationMinutes: number
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'CHECK_UP' | 'EMERGENCY' | 'PROCEDURE' | 'LAB_REVIEW'
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'
  reason: string | null
  notes: string | null
  patient: AppointmentPatient | null
  facility: AppointmentFacility | null
}

interface PatientOption {
  id: string
  patientId: string
  user: {
    firstName: string
    lastName: string
    displayName: string | null
  } | null
}

// ---- Helper mappers ----
const statusLabelMap: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
  CANCELLED: 'Cancelled',
}

const typeLabelMap: Record<string, string> = {
  CONSULTATION: 'Consultation',
  FOLLOW_UP: 'Follow-up',
  CHECK_UP: 'Check-up',
  EMERGENCY: 'Emergency',
  PROCEDURE: 'Procedure',
  LAB_REVIEW: 'Lab Review',
}

function getPatientName(apt: Appointment): string {
  if (apt.patient?.user) {
    return apt.patient.user.displayName || `${apt.patient.user.firstName} ${apt.patient.user.lastName}`
  }
  return 'Unknown Patient'
}

function getDateStr(isoDate: string): string {
  return new Date(isoDate).toISOString().split('T')[0]
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return DAYS_LONG[d.getDay()]
}

// ---- Color helpers ----
const getStatusColor = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'NO_SHOW': return 'bg-red-50 text-red-700 border-red-200'
    case 'CANCELLED': return 'bg-slate-50 text-slate-500 border-slate-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'FOLLOW_UP': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CONSULTATION': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'CHECK_UP': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'EMERGENCY': return 'bg-red-50 text-red-700 border-red-200'
    case 'PROCEDURE': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'LAB_REVIEW': return 'bg-teal-50 text-teal-700 border-teal-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

const APPOINTMENT_TYPES = ['CONSULTATION', 'FOLLOW_UP', 'CHECK_UP', 'EMERGENCY', 'PROCEDURE', 'LAB_REVIEW'] as const

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [typeFilter, setTypeFilter] = React.useState('all')

  // Data state
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [patients, setPatients] = React.useState<PatientOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formPatientId, setFormPatientId] = React.useState('')
  const [formDate, setFormDate] = React.useState('')
  const [formTime, setFormTime] = React.useState('09:00')
  const [formDuration, setFormDuration] = React.useState('30')
  const [formType, setFormType] = React.useState('')
  const [formReason, setFormReason] = React.useState('')
  const [formNotes, setFormNotes] = React.useState('')

  // Fetch appointments
  const fetchAppointments = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/nurseai/appointments?limit=100')
      if (!res.ok) throw new Error('Failed to fetch appointments')
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Failed to load appointments. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch patients for the form dropdown
  const fetchPatients = React.useCallback(async () => {
    try {
      const res = await fetch('/api/nurseai/patients?limit=100')
      if (!res.ok) return
      const data = await res.json()
      setPatients(data.patients || [])
    } catch (err) {
      console.error('Error fetching patients for form:', err)
    }
  }, [])

  React.useEffect(() => {
    fetchAppointments()
    setSelectedDate(new Date())
  }, [fetchAppointments])

  // Fetch patients when dialog opens
  React.useEffect(() => {
    if (dialogOpen) {
      fetchPatients()
    }
  }, [dialogOpen, fetchPatients])

  // Schedule appointment
  const handleSchedule = async () => {
    if (!formPatientId) {
      toast.error('Please select a patient')
      return
    }
    if (!formDate || !formTime) {
      toast.error('Please select a date and time')
      return
    }

    setSubmitting(true)
    try {
      const appointmentDate = new Date(`${formDate}T${formTime}:00`).toISOString()

      const res = await fetch('/api/nurseai/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          appointmentDate,
          durationMinutes: parseInt(formDuration) || 30,
          type: formType || 'CONSULTATION',
          reason: formReason || undefined,
          notes: formNotes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to schedule appointment')
        setSubmitting(false)
        return
      }

      toast.success('Appointment scheduled successfully!')
      setDialogOpen(false)
      // Reset form
      setFormPatientId('')
      setFormDate('')
      setFormTime('09:00')
      setFormDuration('30')
      setFormType('')
      setFormReason('')
      setFormNotes('')
      // Refresh list
      fetchAppointments()
    } catch {
      toast.error('Failed to schedule appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Computed values ----
  const [todayStr, setTodayStr] = React.useState('')
  React.useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0])
  }, [])
  const todayAppointments = appointments.filter(a => getDateStr(a.appointmentDate) === todayStr)
  const upcomingAppointments = appointments.filter(a => getDateStr(a.appointmentDate) > todayStr)

  const todaysTotal = todayAppointments.length
  const completed = todayAppointments.filter(a => a.status === 'COMPLETED').length
  const inProgress = todayAppointments.filter(a => a.status === 'IN_PROGRESS').length
  const noShows = todayAppointments.filter(a => a.status === 'NO_SHOW').length

  const filteredAppointments = typeFilter === 'all'
    ? appointments
    : appointments.filter(a => a.type === typeFilter)

  const stats = [
    { label: "Today's Appointments", value: todaysTotal, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'In Progress', value: inProgress, icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'No Shows', value: noShows, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  // Group appointments by date for calendar view
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const dateKey = getDateStr(apt.appointmentDate)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)

  const isToday = (dateStr: string) => dateStr === todayStr

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700 h-7 gap-1.5 text-xs' : 'h-7 text-xs gap-1.5'}
            >
              <List className="size-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-emerald-600 hover:bg-emerald-700 h-7 gap-1.5 text-xs' : 'h-7 text-xs gap-1.5'}
            >
              <CalendarDays className="size-3.5" />
              Calendar
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="size-4" />
                Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
                <DialogDescription>Book a new patient appointment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={formPatientId} onValueChange={setFormPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => {
                          const name = p.user
                            ? (p.user.displayName || `${p.user.firstName} ${p.user.lastName}`)
                            : p.patientId
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              {name} ({p.patientId})
                            </SelectItem>
                          )
                        })}
                        {patients.length === 0 && (
                          <SelectItem value="__none" disabled>No patients found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      min={todayStr}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Select value={formDuration} onValueChange={setFormDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Appointment Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{typeLabelMap[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    placeholder="Reason for appointment..."
                    value={formReason}
                    onChange={e => setFormReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Additional notes..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSchedule}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Schedule Appointment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto mb-3 text-red-400" />
            <p className="font-medium text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={fetchAppointments}
            >
              <Loader2 className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CalendarX2 className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No appointments found</p>
            <p className="text-sm text-muted-foreground mt-1">Schedule your first appointment to get started</p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" />
              Schedule Appointment
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="size-4 text-emerald-500" />
                    Today&apos;s Appointments — {formatDateDisplay(todayStr)}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No appointments scheduled for today</p>
                ) : (
                  [...todayAppointments]
                    .sort((a, b) => formatTime(a.appointmentDate).localeCompare(formatTime(b.appointmentDate)))
                    .map((apt, idx) => (
                    <div key={apt.id} className="flex gap-3">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`size-3 rounded-full mt-1.5 ${
                          apt.status === 'COMPLETED' ? 'bg-emerald-500' :
                          apt.status === 'IN_PROGRESS' ? 'bg-amber-500 animate-pulse' :
                          apt.status === 'NO_SHOW' ? 'bg-red-500' :
                          'bg-sky-500'
                        }`} />
                        {idx < todayAppointments.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{formatTime(apt.appointmentDate)}</span>
                              <span className="text-xs text-muted-foreground">{apt.durationMinutes} min</span>
                            </div>
                            <p className="text-sm font-medium mt-0.5">{getPatientName(apt)}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(apt.status)}`}>
                            {statusLabelMap[apt.status] || apt.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                            {typeLabelMap[apt.type] || apt.type}
                          </Badge>
                          {apt.facility && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3" />
                              {apt.facility.name}
                            </span>
                          )}
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="size-4 text-emerald-500" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments</p>
                ) : (
                  [...upcomingAppointments]
                    .sort((a, b) => {
                      const dateComp = getDateStr(a.appointmentDate).localeCompare(getDateStr(b.appointmentDate))
                      if (dateComp !== 0) return dateComp
                      return formatTime(a.appointmentDate).localeCompare(formatTime(b.appointmentDate))
                    })
                    .map(apt => (
                    <div key={apt.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{getPatientName(apt)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground font-medium">{getDateStr(apt.appointmentDate)}</span>
                            <span className="text-xs text-muted-foreground">at {formatTime(apt.appointmentDate)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(apt.status)}`}>
                          {statusLabelMap[apt.status] || apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                          {typeLabelMap[apt.type] || apt.type}
                        </Badge>
                        {apt.facility && (
                          <span className="text-xs text-muted-foreground">{apt.facility.name}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Mini Calendar */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  modifiers={{
                    hasAppointment: (date) => {
                      const dateStr = date.toISOString().split('T')[0]
                      return Object.keys(appointmentsByDate).some(d => d === dateStr)
                    }
                  }}
                  modifiersStyles={{
                    hasAppointment: {
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      textDecorationColor: '#10b981',
                      textUnderlineOffset: '4px'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-emerald-800 mb-3">Today&apos;s Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700">Completed</span>
                    <span className="font-semibold text-emerald-800">{completed}/{todaysTotal}</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${todaysTotal > 0 ? (completed / todaysTotal) * 100 : 0}%` }} />
                  </div>
                  <Separator className="my-2 bg-emerald-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-white/50">
                      <p className="text-lg font-bold text-amber-700">{inProgress}</p>
                      <p className="text-[10px] text-amber-600">In Progress</p>
                    </div>
                    <div className="text-center p-2 rounded bg-white/50">
                      <p className="text-lg font-bold text-red-700">{noShows}</p>
                      <p className="text-[10px] text-red-600">No Shows</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {APPOINTMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{typeLabelMap[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {Object.entries(appointmentsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .filter(([date]) => typeFilter === 'all' || appointmentsByDate[date]?.some(a => a.type === typeFilter))
                  .map(([date, apts]) => {
                    const filteredApts = typeFilter === 'all' ? apts : apts.filter(a => a.type === typeFilter)
                    if (filteredApts.length === 0) return null
                    const dateObj = new Date(date + 'T00:00:00')
                    const dayName = formatDayName(date)
                    const monthDay = formatDateShort(date)
                    return (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isToday(date)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {dateObj.getDate()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{dayName}</p>
                            <p className="text-xs text-muted-foreground">{monthDay} &bull; {filteredApts.length} appointment{filteredApts.length !== 1 ? 's' : ''}</p>
                          </div>
                          {isToday(date) && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs ml-2">Today</Badge>
                          )}
                        </div>
                        <div className="ml-4 space-y-2 pl-4 border-l-2 border-muted">
                          {[...filteredApts]
                            .sort((a, b) => formatTime(a.appointmentDate).localeCompare(formatTime(b.appointmentDate)))
                            .map(apt => (
                            <div key={apt.id} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-muted-foreground">{formatTime(apt.appointmentDate)}</span>
                                  <p className="text-sm font-medium">{getPatientName(apt)}</p>
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(apt.status)}`}>
                                  {statusLabelMap[apt.status] || apt.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                                  {typeLabelMap[apt.type] || apt.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {apt.facility ? `${apt.facility.name} • ` : ''}{apt.durationMinutes}min
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
