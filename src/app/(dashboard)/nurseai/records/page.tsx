'use client'

import * as React from 'react'
import Link from 'next/link'
import { medicalRecords } from '@/lib/nurseai-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileText, Search, Plus, Activity, UserCheck, LogOut, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function RecordsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [encounterFilter, setEncounterFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const total = medicalRecords.length
  const active = medicalRecords.filter(r => r.status === 'Active').length
  const discharged = medicalRecords.filter(r => r.status === 'Discharged').length
  const emergency = medicalRecords.filter(r => r.status === 'Critical' || r.encounterType === 'Emergency').length

  const encounterTypes = [...new Set(medicalRecords.map(r => r.encounterType))]
  const statuses = [...new Set(medicalRecords.map(r => r.status))]

  const filteredRecords = medicalRecords.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nurse.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEncounter = encounterFilter === 'all' || r.encounterType === encounterFilter
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesEncounter && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Discharged': return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Closed': return 'bg-slate-50 text-slate-500 border-slate-200'
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getEncounterColor = (type: string) => {
    switch (type) {
      case 'Admission': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Emergency': return 'bg-red-50 text-red-700 border-red-200'
      case 'Follow-up': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Routine Check': return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'Discharge': return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'Consultation': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'Surgery': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const stats = [
    { label: 'Total Records', value: total, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active', value: active, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Discharged', value: discharged, icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Emergency', value: emergency, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-sm text-muted-foreground">View and manage all patient medical records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="size-4" />
              New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Medical Record</DialogTitle>
              <DialogDescription>Document a new patient encounter or follow-up.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" placeholder="Search patient..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="encounterType">Encounter Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {encounterTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Input id="complaint" placeholder="e.g. Fever and body weakness for 3 days" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input id="diagnosis" placeholder="e.g. Severe Malaria" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes</Label>
                <Textarea id="notes" placeholder="Document findings, assessment, and plan..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nurse">Attending Nurse</Label>
                  <Input id="nurse" placeholder="e.g. Nurse Adaora" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setDialogOpen(false); toast.info('Record saving is coming soon — this feature is being developed.'); }}>Save Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, complaint, diagnosis, nurse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={encounterFilter} onValueChange={setEncounterFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Encounter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {encounterTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Patient Name</TableHead>
                <TableHead>Encounter Type</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Nurse</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(record => (
                <TableRow key={record.id} className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <TableCell className="pl-4">
                    <Link href={`/nurseai/patients/${record.patientId}`} className="flex items-center gap-3">
                      <Avatar className="size-8 border border-emerald-200">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                          {record.patientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{record.patientName}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getEncounterColor(record.encounterType)}`}>
                      {record.encounterType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">{record.chiefComplaint}</TableCell>
                  <TableCell className="text-sm">{record.nurse}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No records found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredRecords.map(record => (
          <Link key={record.id} href={`/nurseai/patients/${record.patientId}`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{record.patientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{record.date}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                    {record.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${getEncounterColor(record.encounterType)}`}>
                    {record.encounterType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{record.nurse}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{record.chiefComplaint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No records found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredRecords.length} of {total} records
      </p>
    </div>
  )
}
