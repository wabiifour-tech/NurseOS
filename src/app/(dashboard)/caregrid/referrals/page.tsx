"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowRightLeft,
  Search,
  Plus,
  Clock,
  CheckCircle2,

  AlertCircle,
  ChevronRight,
  User,
  Loader2,
  XCircle,
  Ban,
  FileX,
  Inbox,
} from "lucide-react"
import { toast } from "sonner"

// --- API Response Types ---
type ApiUrgency = "ROUTINE" | "URGENT" | "STAT"
type ApiStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED"

interface ApiReferral {
  id: string
  patientId: string
  fromFacilityId: string | null
  toFacilityId: string
  referringNurseId: string
  reason: string | null
  clinicalSummary: string | null
  urgency: ApiUrgency
  status: ApiStatus
  notes: string | null
  createdAt: string
  patient: {
    id: string
    patientId: string
    user: { firstName: string; lastName: string; displayName: string | null }
  }
  fromFacility: { id: string; name: string; city: string; state: string } | null
  toFacility: { id: string; name: string; city: string; state: string }
  referringNurse: { id: string; user: { firstName: string; lastName: string } }
}

interface ApiPatient {
  id: string
  patientId: string
  user: { firstName: string; lastName: string; displayName: string | null }
}

interface ApiFacility {
  id: string
  name: string
  city: string
  state: string
}

// --- Display Mappings ---
const urgencyDisplay: Record<ApiUrgency, string> = {
  ROUTINE: "Routine",
  URGENT: "Urgent",
  STAT: "STAT",
}

const statusDisplay: Record<ApiStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const statusConfig: Record<ApiStatus, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  ACCEPTED: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  REJECTED: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  COMPLETED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CANCELLED: { color: "bg-slate-50 text-slate-500 border-slate-200", icon: Ban },
}

const urgencyConfig: Record<ApiUrgency, { color: string; dot: string }> = {
  ROUTINE: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  URGENT: { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  STAT: { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
}

// --- Helper ---
function getPatientName(referral: ApiReferral): string {
  if (referral.patient.user.displayName) return referral.patient.user.displayName
  return `${referral.patient.user.firstName} ${referral.patient.user.lastName}`
}

function getNurseName(referral: ApiReferral): string {
  return `${referral.referringNurse.user.firstName} ${referral.referringNurse.user.lastName}`
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return isoDate
  }
}

export default function ReferralsPage() {
  // Data state
  const [referrals, setReferrals] = React.useState<ApiReferral[]>([])
  const [patients, setPatients] = React.useState<ApiPatient[]>([])
  const [facilities, setFacilities] = React.useState<ApiFacility[]>([])

  // UI state
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formPatient, setFormPatient] = React.useState("")
  const [formFromFacility, setFormFromFacility] = React.useState("")
  const [formToFacility, setFormToFacility] = React.useState("")
  const [formUrgency, setFormUrgency] = React.useState<ApiUrgency | "">("")
  const [formReason, setFormReason] = React.useState("")
  const [formClinicalSummary, setFormClinicalSummary] = React.useState("")
  const [formNotes, setFormNotes] = React.useState("")

  // Fetch referrals
  const fetchReferrals = React.useCallback(async () => {
    try {
      setError(null)
      const res = await fetch("/api/caregrid/referrals")
      if (!res.ok) throw new Error(`Failed to load referrals (${res.status})`)
      const data = await res.json()
      setReferrals(data.referrals ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch patients and facilities for form dropdowns
  const fetchFormData = React.useCallback(async () => {
    try {
      const [patientsRes, facilitiesRes] = await Promise.all([
        fetch("/api/nurseai/patients?limit=100"),
        fetch("/api/caregrid/facilities?limit=100"),
      ])
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        setPatients(patientsData.patients ?? patientsData ?? [])
      }
      if (facilitiesRes.ok) {
        const facilitiesData = await facilitiesRes.json()
        setFacilities(facilitiesData.facilities ?? facilitiesData ?? [])
      }
    } catch {
      // Non-critical — form dropdowns will just be empty
    }
  }, [])

  React.useEffect(() => {
    fetchReferrals()
    fetchFormData()
  }, [fetchReferrals, fetchFormData])

  // Create referral
  const handleCreateReferral = async () => {
    if (!formPatient || !formToFacility || !formUrgency) {
      toast.error("Please fill in all required fields (Patient, To Facility, Urgency)")
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, string> = {
        patientId: formPatient,
        toFacilityId: formToFacility,
        urgency: formUrgency,
      }
      if (formFromFacility) payload.fromFacilityId = formFromFacility
      if (formReason) payload.reason = formReason
      if (formClinicalSummary) payload.clinicalSummary = formClinicalSummary
      if (formNotes) payload.notes = formNotes

      const res = await fetch("/api/caregrid/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? `Failed to create referral (${res.status})`)
      }
      toast.success("Referral submitted successfully!")
      setDialogOpen(false)
      // Reset form
      setFormPatient("")
      setFormFromFacility("")
      setFormToFacility("")
      setFormUrgency("")
      setFormReason("")
      setFormClinicalSummary("")
      setFormNotes("")
      // Refresh list
      setLoading(true)
      fetchReferrals()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit referral")
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered referrals
  const filtered = React.useMemo(() => {
    return referrals.filter(r => {
      const patientName = getPatientName(r).toLowerCase()
      const fromName = r.fromFacility?.name?.toLowerCase() ?? ""
      const toName = r.toFacility?.name?.toLowerCase() ?? ""
      const matchesSearch =
        patientName.includes(searchQuery.toLowerCase()) ||
        fromName.includes(searchQuery.toLowerCase()) ||
        toName.includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [referrals, searchQuery, statusFilter])

  // Stats
  const totalReferrals = referrals.length
  const pendingCount = referrals.filter(r => r.status === "PENDING").length
  const acceptedCount = referrals.filter(r => r.status === "ACCEPTED").length
  const completedCount = referrals.filter(r => r.status === "COMPLETED").length

  const pipelineSteps = [
    { label: "Pending", count: pendingCount, color: "bg-amber-500" },
    { label: "Accepted", count: acceptedCount, color: "bg-blue-500" },
    { label: "Completed", count: completedCount, color: "bg-emerald-500" },
  ]

  // --- Render: Loading ---
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading referrals…</p>
          </div>
        </div>
      </div>
    )
  }

  // --- Render: Error ---
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-8 text-red-500" />
            <p className="text-sm font-medium text-red-700">Failed to load referrals</p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setLoading(true)
                fetchReferrals()
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // --- Render: Main ---
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="size-6 text-emerald-600" />
            Referrals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage patient referrals across facilities
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create New Referral</DialogTitle>
              <DialogDescription>
                Submit a patient referral to another facility
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={formPatient} onValueChange={setFormPatient}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {patients.length === 0 ? (
                      <SelectItem value="__none" disabled>No patients available</SelectItem>
                    ) : (
                      patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user.displayName ?? `${p.user.firstName} ${p.user.lastName}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Facility</Label>
                  <Select value={formFromFacility} onValueChange={setFormFromFacility}>
                    <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="__none">None</SelectItem>
                      {facilities.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Facility *</Label>
                  <Select value={formToFacility} onValueChange={setFormToFacility}>
                    <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {facilities.length === 0 ? (
                        <SelectItem value="__none" disabled>No facilities available</SelectItem>
                      ) : (
                        facilities.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Urgency *</Label>
                <Select value={formUrgency} onValueChange={(v) => setFormUrgency(v as ApiUrgency)}>
                  <SelectTrigger><SelectValue placeholder="Select urgency level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="STAT">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Referral</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe the clinical reason for referral"
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicalSummary">Clinical Summary</Label>
                <Textarea
                  id="clinicalSummary"
                  placeholder="Brief clinical summary of the patient"
                  value={formClinicalSummary}
                  onChange={e => setFormClinicalSummary(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateReferral} disabled={submitting}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Submit Referral
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <ArrowRightLeft className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-900">{totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <AlertCircle className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-slate-900">{acceptedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <CheckCircle2 className="size-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Referral Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pipelineSteps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 min-w-fit">
                  <div className={`size-3 rounded-full ${step.color}`} />
                  <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
                  <Badge variant="secondary" className="text-xs">{step.count}</Badge>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient or facility..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="p-3 rounded-full bg-slate-100 mb-3">
                <Inbox className="size-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No referrals found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {referrals.length === 0
                  ? "Create your first referral to get started."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">From</TableHead>
                    <TableHead className="hidden md:table-cell">To</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead className="hidden lg:table-cell">Nurse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(referral => {
                    const StatusIcon = statusConfig[referral.status]?.icon ?? FileX
                    const statusColor = statusConfig[referral.status]?.color ?? "bg-slate-50 text-slate-500 border-slate-200"
                    const urgencyColor = urgencyConfig[referral.urgency]?.color ?? "bg-slate-50 text-slate-500 border-slate-200"
                    const urgencyDot = urgencyConfig[referral.urgency]?.dot ?? "bg-slate-400"
                    return (
                      <TableRow key={referral.id} className="cursor-pointer hover:bg-emerald-50/50">
                        <TableCell className="font-mono text-xs">{referral.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <User className="size-3.5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{getPatientName(referral)}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {referral.patient.patientId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs max-w-[150px] truncate">
                          {referral.fromFacility?.name ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs max-w-[150px] truncate">
                          {referral.toFacility.name}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] gap-1 ${urgencyColor}`}>
                            <span className={`size-1.5 rounded-full ${urgencyDot}`} />
                            {urgencyDisplay[referral.urgency]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{getNurseName(referral)}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] gap-1 ${statusColor}`}>
                            <StatusIcon className="size-3" />
                            {statusDisplay[referral.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {formatDate(referral.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
