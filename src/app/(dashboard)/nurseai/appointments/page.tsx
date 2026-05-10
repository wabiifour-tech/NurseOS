'use client'

import * as React from 'react'
import { appointments } from '@/lib/nurseai-data'
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
  UserX, CalendarCheck, Stethoscope, MapPin
} from 'lucide-react'
import { toast } from 'sonner'

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [typeFilter, setTypeFilter] = React.useState('all')

  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(a => a.date === todayStr)
  const upcomingAppointments = appointments.filter(a => a.date > todayStr)

  const todaysTotal = todayAppointments.length
  const completed = todayAppointments.filter(a => a.status === 'Completed').length
  const inProgress = todayAppointments.filter(a => a.status === 'In Progress').length
  const noShows = todayAppointments.filter(a => a.status === 'No Show').length

  const filteredAppointments = typeFilter === 'all'
    ? appointments
    : appointments.filter(a => a.type === typeFilter)

  const appointmentTypes = [...new Set(appointments.map(a => a.type))]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'No Show': return 'bg-red-50 text-red-700 border-red-200'
      case 'Cancelled': return 'bg-slate-50 text-slate-500 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Follow-up': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Consultation': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Check-up': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'Emergency': return 'bg-red-50 text-red-700 border-red-200'
      case 'Procedure': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Lab Review': return 'bg-teal-50 text-teal-700 border-teal-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const stats = [
    { label: "Today's Appointments", value: todaysTotal, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'In Progress', value: inProgress, icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'No Shows', value: noShows, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  // Group appointments by date for calendar view
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = []
    acc[apt.date].push(apt)
    return acc
  }, {} as Record<string, typeof appointments>)

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Input placeholder="Search patient..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Okafor">Dr. Okafor</SelectItem>
                        <SelectItem value="Dr. Adeyemi">Dr. Adeyemi</SelectItem>
                        <SelectItem value="Dr. Bello">Dr. Bello</SelectItem>
                        <SelectItem value="Dr. Ogunleye">Dr. Ogunleye</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" defaultValue="2026-03-05" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Select defaultValue="30">
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
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input placeholder="Additional notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setDialogOpen(false); toast.info('Appointment scheduling is coming soon — this feature is being developed.'); }}>Schedule Appointment</Button>
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

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="size-4 text-emerald-500" />
                    Today&apos;s Appointments — March 4, 2026
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {todayAppointments.length} appointments
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt, idx) => (
                  <div key={apt.id} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`size-3 rounded-full mt-1.5 ${
                        apt.status === 'Completed' ? 'bg-emerald-500' :
                        apt.status === 'In Progress' ? 'bg-amber-500 animate-pulse' :
                        apt.status === 'No Show' ? 'bg-red-500' :
                        'bg-sky-500'
                      }`} />
                      {idx < todayAppointments.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{apt.time}</span>
                            <span className="text-xs text-muted-foreground">{apt.duration} min</span>
                          </div>
                          <p className="text-sm font-medium mt-0.5">{apt.patientName}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                          {apt.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Stethoscope className="size-3" />
                          {apt.doctor}
                        </span>
                      </div>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
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
                {upcomingAppointments.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(apt => (
                  <div key={apt.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{apt.patientName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">{apt.date}</span>
                          <span className="text-xs text-muted-foreground">at {apt.time}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                        {apt.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{apt.doctor}</span>
                    </div>
                  </div>
                ))}
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
                    {appointmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                            <p className="text-xs text-muted-foreground">{monthDay} • {filteredApts.length} appointments</p>
                          </div>
                          {isToday(date) && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs ml-2">Today</Badge>
                          )}
                        </div>
                        <div className="ml-4 space-y-2 pl-4 border-l-2 border-muted">
                          {filteredApts.sort((a, b) => a.time.localeCompare(b.time)).map(apt => (
                            <div key={apt.id} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-muted-foreground">{apt.time}</span>
                                  <p className="text-sm font-medium">{apt.patientName}</p>
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${getStatusColor(apt.status)}`}>
                                  {apt.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${getTypeColor(apt.type)}`}>
                                  {apt.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{apt.doctor} • {apt.duration}min</span>
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
