"use client"

import * as React from "react"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Video,
  MessageCircle,
  Phone,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// ---------- Types ----------

interface ApiNurse {
  id: string
  user: { firstName: string; lastName: string }
}

interface ApiConsultation {
  id: string
  requestingNurseId: string
  consultingNurseId: string
  patientId: string | null
  consultationType: "CHAT" | "VIDEO" | "PHONE"
  subject: string
  description: string | null
  status: "REQUESTED" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  notes: string | null
  scheduledAt: string | null
  createdAt: string
  requestingNurse: ApiNurse
  consultingNurse: ApiNurse
}

interface DirectoryNurse {
  id: string
  specialty: string
  user: {
    id: string
    firstName: string
    lastName: string
    displayName: string | null
    email: string
  }
}

// ---------- Config maps ----------

type DisplayType = "Video" | "Chat" | "Phone"
type DisplayStatus = "Requested" | "Scheduled" | "Active" | "Completed" | "Cancelled"

const typeConfig: Record<DisplayType, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  Video: { icon: Video, color: "bg-blue-50 text-blue-600 border-blue-200", label: "Video Call" },
  Chat: { icon: MessageCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Chat" },
  Phone: { icon: Phone, color: "bg-purple-50 text-purple-600 border-purple-200", label: "Phone Call" },
}

const statusConfig: Record<DisplayStatus, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Requested: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  Scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Calendar },
  Active: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Clock },
  Completed: { color: "bg-slate-50 text-slate-600 border-slate-200", icon: CheckCircle2 },
  Cancelled: { color: "bg-red-50 text-red-600 border-red-200", icon: Clock },
}

// ---------- Helpers ----------

function toDisplayType(apiType: string): DisplayType {
  const map: Record<string, DisplayType> = { CHAT: "Chat", VIDEO: "Video", PHONE: "Phone" }
  return map[apiType] ?? "Chat"
}

function toDisplayStatus(apiStatus: string): DisplayStatus {
  const map: Record<string, DisplayStatus> = {
    REQUESTED: "Requested",
    SCHEDULED: "Scheduled",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  }
  return map[apiStatus] ?? "Requested"
}

function nurseName(nurse: ApiNurse): string {
  if (!nurse?.user) return "Unknown"
  return `${nurse.user.firstName} ${nurse.user.lastName}`
}

function formatDate(iso: string | null): string {
  if (!iso) return "TBD"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// ---------- Component ----------

export default function ConsultationsPage() {
  const { user, token } = useAuthStore()
  const currentUserId = user?.id ?? ""

  // Data state
  const [consultations, setConsultations] = React.useState<ApiConsultation[]>([])
  const [nurses, setNurses] = React.useState<DirectoryNurse[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // UI state
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formNurseId, setFormNurseId] = React.useState("")
  const [formType, setFormType] = React.useState("")
  const [formSubject, setFormSubject] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")
  const [formDate, setFormDate] = React.useState("")
  const [formTime, setFormTime] = React.useState("")

  // ---------- Fetch data ----------

  const fetchConsultations = React.useCallback(async () => {
    try {
      setError(null)
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/caregrid/consultations?limit=100", { headers })
      if (!res.ok) throw new Error("Failed to fetch consultations")
      const data = await res.json()
      setConsultations(data.consultations ?? [])
    } catch (err) {
      console.error(err)
      setError("Unable to load consultations. Please try again.")
    }
  }, [token])

  const fetchNurses = React.useCallback(async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/caregrid/directory?limit=100", { headers })
      if (!res.ok) throw new Error("Failed to fetch nurses")
      const data = await res.json()
      setNurses(data.nurses ?? [])
    } catch (err) {
      console.error(err)
    }
  }, [token])

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchConsultations(), fetchNurses()])
      setLoading(false)
    }
    load()
  }, [fetchConsultations, fetchNurses])

  // ---------- Create consultation ----------

  const handleCreateConsultation = async () => {
    if (!formNurseId || !formSubject || !formDescription) {
      toast.error("Please fill in all required fields")
      return
    }
    setSubmitting(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const body: Record<string, unknown> = {
        consultingNurseId: formNurseId,
        subject: formSubject,
        description: formDescription,
      }
      if (formType) body.consultationType = formType.toUpperCase()
      if (formDate && formTime) {
        body.scheduledAt = new Date(`${formDate}T${formTime}`).toISOString()
      }

      const res = await fetch("/api/caregrid/consultations", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to create consultation")
      }

      toast.success("Consultation request submitted!")
      setDialogOpen(false)
      setFormNurseId("")
      setFormType("")
      setFormSubject("")
      setFormDescription("")
      setFormDate("")
      setFormTime("")

      // Refresh list
      await fetchConsultations()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit consultation request"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Derived data ----------

  const myRequests = consultations.filter(c => c.requestingNurseId === currentUserId)
  const incoming = consultations.filter(c => c.consultingNurseId === currentUserId)

  const activeCount = consultations.filter(c => c.status === "ACTIVE").length
  const scheduledCount = consultations.filter(c => c.status === "SCHEDULED" || c.status === "REQUESTED").length
  const completedCount = consultations.filter(c => c.status === "COMPLETED").length

  const filterBySearch = (items: ApiConsultation[]) =>
    items.filter(c => {
      const q = searchQuery.toLowerCase()
      return (
        c.subject.toLowerCase().includes(q) ||
        nurseName(c.requestingNurse).toLowerCase().includes(q) ||
        nurseName(c.consultingNurse).toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      )
    })

  // ---------- Render ----------

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="size-6 text-emerald-600" />
            Consultations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect with specialists for clinical consultations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Request Consultation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Consultation</DialogTitle>
              <DialogDescription>
                Schedule a consultation with a specialist nurse
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Consulting Nurse *</Label>
                <Select value={formNurseId} onValueChange={setFormNurseId}>
                  <SelectTrigger><SelectValue placeholder="Select a nurse" /></SelectTrigger>
                  <SelectContent>
                    {nurses
                      .filter(n => n.id !== currentUserId)
                      .map(n => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.user.firstName} {n.user.lastName}{n.specialty ? ` — ${n.specialty}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Consultation Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" placeholder="Brief description of consultation topic" value={formSubject} onChange={e => setFormSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" placeholder="Describe the clinical question or concern" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Date</Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateConsultation} disabled={submitting}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Clock className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-slate-900">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <CheckCircle2 className="size-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search consultations..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-10 text-emerald-600 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading consultations...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="size-12 text-red-400 mb-4" />
          <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => { fetchConsultations(); fetchNurses(); }}>
            Retry
          </Button>
        </div>
      )}

      {/* Tabs — only show when not loading and no error */}
      {!loading && !error && (
        <Tabs defaultValue="my-requests">
          <TabsList className="bg-emerald-50">
            <TabsTrigger value="my-requests" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              My Requests ({myRequests.length})
            </TabsTrigger>
            <TabsTrigger value="incoming" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Incoming ({incoming.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-requests" className="mt-4">
            {filterBySearch(myRequests).length === 0 ? (
              <EmptyState message="No consultation requests found" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterBySearch(myRequests).map(consultation => (
                  <ConsultationCard key={consultation.id} consultation={consultation} isIncoming={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-4">
            {filterBySearch(incoming).length === 0 ? (
              <EmptyState message="No incoming consultations" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterBySearch(incoming).map(consultation => (
                  <ConsultationCard key={consultation.id} consultation={consultation} isIncoming={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// ---------- Sub-components ----------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Video className="size-12 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

function ConsultationCard({ consultation, isIncoming }: { consultation: ApiConsultation; isIncoming: boolean }) {
  const displayType = toDisplayType(consultation.consultationType)
  const displayStatus = toDisplayStatus(consultation.status)
  const TypeIcon = typeConfig[displayType].icon
  const StatusIcon = statusConfig[displayStatus].icon

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 truncate">{consultation.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] gap-1 ${typeConfig[displayType].color}`}>
                <TypeIcon className="size-3" />
                {typeConfig[displayType].label}
              </Badge>
              <Badge className={`text-[10px] gap-1 ${statusConfig[displayStatus].color}`}>
                <StatusIcon className="size-3" />
                {displayStatus}
              </Badge>
            </div>
          </div>
        </div>

        {consultation.description && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Stethoscope className="size-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{consultation.description}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <User className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">{isIncoming ? "From:" : "To:"}</span>
            <span className="font-medium">
              {isIncoming ? nurseName(consultation.requestingNurse) : nurseName(consultation.consultingNurse)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {formatDate(consultation.scheduledAt ?? consultation.createdAt)}
            {consultation.scheduledAt && <span> at {formatTime(consultation.scheduledAt)}</span>}
          </div>
        </div>

        {consultation.notes && (
          <p className="text-xs text-muted-foreground bg-slate-50 rounded p-2 border">
            {consultation.notes}
          </p>
        )}

        {consultation.status === "ACTIVE" && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
              {consultation.consultationType === "VIDEO" ? "Join Call" : consultation.consultationType === "CHAT" ? "Open Chat" : "Call Now"}
            </Button>
          </div>
        )}
        {(consultation.status === "SCHEDULED" || consultation.status === "REQUESTED") && isIncoming && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
              Accept
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8">
              Reschedule
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
