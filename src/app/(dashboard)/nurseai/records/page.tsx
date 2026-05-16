'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileText, Search, Plus, Activity, UserCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ---------- Types ----------

interface ApiPatient {
  id: string
  patientId: string
  user: {
    firstName: string
    lastName: string
    displayName: string | null
  }
}

interface ApiRecord {
  id: string
  patientId: string
  encounterType: string
  chiefComplaint: string
  status: string
  createdAt: string
  updatedAt: string
  patient: ApiPatient
  attendingNurse: {
    id: string
    user: { firstName: string; lastName: string }
  } | null
}

interface PatientOption {
  id: string
  patientId: string
  fullName: string
}

// ---------- Mappers ----------

const encounterTypeLabels: Record<string, string> = {
  ADMISSION: 'Admission',
  EMERGENCY: 'Emergency',
  FOLLOW_UP: 'Follow-up',
  ROUTINE_CHECK: 'Routine Check',
  DISCHARGE: 'Discharge',
  CONSULTATION: 'Consultation',
  SURGERY: 'Surgery',
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  DISCHARGED: 'Discharged',
  PENDING: 'Pending',
  CLOSED: 'Closed',
  CRITICAL: 'Critical',
}

function getPatientName(patient: ApiPatient): string {
  if (patient.user?.displayName) return patient.user.displayName
  if (patient.user?.firstName || patient.user?.lastName) {
    return `${patient.user.firstName} ${patient.user.lastName}`.trim()
  }
  return patient.patientId
}

function getNurseName(nurse: ApiRecord['attendingNurse']): string {
  if (!nurse?.user) return 'Unassigned'
  return `${nurse.user.firstName} ${nurse.user.lastName}`.trim()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ---------- Color helpers ----------

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'DISCHARGED':
      return 'bg-slate-50 text-slate-600 border-slate-200'
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'CLOSED':
      return 'bg-slate-50 text-slate-500 border-slate-200'
    case 'CRITICAL':
      return 'bg-red-50 text-red-700 border-red-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

function getEncounterColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'ADMISSION':
    case 'INPATIENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'EMERGENCY':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'FOLLOW_UP':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'ROUTINE_CHECK':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'DISCHARGE':
    case 'OUTPATIENT':
      return 'bg-slate-50 text-slate-600 border-slate-200'
    case 'CONSULTATION':
      return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'SURGERY':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

// ---------- Component ----------

export default function RecordsPage() {
  const [records, setRecords] = React.useState<ApiRecord[]>([])
  const [patients, setPatients] = React.useState<PatientOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [encounterFilter, setEncounterFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formPatientId, setFormPatientId] = React.useState('')
  const [formEncounterType, setFormEncounterType] = React.useState('ADMISSION')
  const [formComplaint, setFormComplaint] = React.useState('')
  const [formStatus, setFormStatus] = React.useState('ACTIVE')

  // Fetch records
  const fetchRecords = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (encounterFilter !== 'all') params.set('encounterType', encounterFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/nurseai/records?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch records')
      const data = await res.json()
      setRecords(data.records ?? [])
    } catch (err) {
      console.error(err)
      setError('Failed to load medical records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [encounterFilter, statusFilter, searchQuery])

  // Fetch patients for the dialog
  const fetchPatients = React.useCallback(async () => {
    try {
      const res = await fetch('/api/nurseai/patients?limit=100')
      if (!res.ok) return
      const data = await res.json()
      setPatients(
        (data.patients ?? []).map((p: { id: string; patientId: string; fullName: string }) => ({
          id: p.id,
          patientId: p.patientId,
          fullName: p.fullName,
        }))
      )
    } catch (err) {
      /* non-critical */
      console.error('Failed to load patients for form:', err)
    }
  }, [])

  React.useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  React.useEffect(() => {
    if (dialogOpen) fetchPatients()
  }, [dialogOpen, fetchPatients])

  // Computed stats
  const total = records.length
  const active = records.filter((r) => r.status.toUpperCase() === 'ACTIVE').length
  const discharged = records.filter((r) => r.status.toUpperCase() === 'DISCHARGED').length
  const emergency = records.filter(
    (r) => r.status.toUpperCase() === 'CRITICAL' || r.encounterType.toUpperCase() === 'EMERGENCY'
  ).length

  // Unique filter options derived from fetched data
  const encounterTypes = React.useMemo(
    () => [...new Set(records.map((r) => r.encounterType.toUpperCase()))].sort(),
    [records]
  )
  const statuses = React.useMemo(
    () => [...new Set(records.map((r) => r.status.toUpperCase()))].sort(),
    [records]
  )

  // Client-side filter (supplements server-side search/filters)
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase()
      if (q) {
        const matchesSearch =
          getPatientName(r.patient).toLowerCase().includes(q) ||
          r.chiefComplaint.toLowerCase().includes(q) ||
          getNurseName(r.attendingNurse).toLowerCase().includes(q) ||
          (encounterTypeLabels[r.encounterType] ?? r.encounterType).toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (encounterFilter !== 'all' && r.encounterType.toUpperCase() !== encounterFilter.toUpperCase())
        return false
      if (statusFilter !== 'all' && r.status.toUpperCase() !== statusFilter.toUpperCase()) return false
      return true
    })
  }, [records, searchQuery, encounterFilter, statusFilter])

  // Submit new record
  const handleSubmit = async () => {
    if (!formPatientId) {
      toast.error('Please select a patient')
      return
    }
    if (!formComplaint.trim()) {
      toast.error('Please enter the chief complaint')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/nurseai/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formPatientId,
          chiefComplaint: formComplaint.trim(),
          encounterType: formEncounterType,
          status: formStatus,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? 'Failed to create record')
      }

      toast.success('Medical record created successfully')
      setDialogOpen(false)
      // Reset form
      setFormPatientId('')
      setFormEncounterType('ADMISSION')
      setFormComplaint('')
      setFormStatus('ACTIVE')
      // Refresh list
      fetchRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create record')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = [
    { label: 'Total Records', value: total, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active', value: active, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Discharged', value: discharged, icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Emergency', value: emergency, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  // ---------- Render ----------

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
                  <Label htmlFor="patientSelect">Patient</Label>
                  <Select value={formPatientId} onValueChange={setFormPatientId}>
                    <SelectTrigger id="patientSelect">
                      <SelectValue placeholder="Select patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="encounterType">Encounter Type</Label>
                  <Select value={formEncounterType} onValueChange={setFormEncounterType}>
                    <SelectTrigger id="encounterType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(encounterTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Input
                  id="complaint"
                  placeholder="e.g. Fever and body weakness for 3 days"
                  value={formComplaint}
                  onChange={(e) => setFormComplaint(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                Save Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
                placeholder="Search by patient, complaint, nurse..."
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
                {encounterTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {encounterTypeLabels[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-10 animate-spin text-emerald-500 mb-4" />
          <p className="font-medium">Loading medical records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <AlertTriangle className="size-12 mb-3 text-red-400" />
          <p className="font-medium text-red-600">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchRecords}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No records found</p>
          <p className="text-sm">Create a new record or adjust your filters</p>
        </div>
      )}

      {/* Data loaded */}
      {!loading && !error && records.length > 0 && (
        <>
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
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                      <TableCell className="pl-4">
                        <Link href={`/nurseai/patients/${record.patientId}`} className="flex items-center gap-3">
                          <Avatar className="size-8 border border-emerald-200">
                            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {getInitials(getPatientName(record.patient))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{getPatientName(record.patient)}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getEncounterColor(record.encounterType)}`}>
                          {encounterTypeLabels[record.encounterType] ?? record.encounterType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[250px] truncate">{record.chiefComplaint}</TableCell>
                      <TableCell className="text-sm">{getNurseName(record.attendingNurse)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(record.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                          {statusLabels[record.status] ?? record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="size-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No records match your filters</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRecords.map((record) => (
              <Link key={record.id} href={`/nurseai/patients/${record.patientId}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{getPatientName(record.patient)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(record.createdAt)}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(record.status)}`}>
                        {statusLabels[record.status] ?? record.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getEncounterColor(record.encounterType)}`}>
                        {encounterTypeLabels[record.encounterType] ?? record.encounterType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{getNurseName(record.attendingNurse)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{record.chiefComplaint}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No records match your filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredRecords.length} of {total} records
          </p>
        </>
      )}
    </div>
  )
}
