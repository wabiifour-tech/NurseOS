"use client"

import * as React from "react"
import { consultations, type Consultation } from "@/lib/caregrid-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import { toast } from "sonner"

const typeConfig: Record<Consultation["type"], { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  Video: { icon: Video, color: "bg-blue-50 text-blue-600 border-blue-200", label: "Video Call" },
  Chat: { icon: MessageCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Chat" },
  Phone: { icon: Phone, color: "bg-purple-50 text-purple-600 border-purple-200", label: "Phone Call" },
}

const statusConfig: Record<Consultation["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Active: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Clock },
  Scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Calendar },
  Completed: { color: "bg-slate-50 text-slate-600 border-slate-200", icon: CheckCircle2 },
  Cancelled: { color: "bg-red-50 text-red-600 border-red-200", icon: Clock },
}

export default function ConsultationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formType, setFormType] = React.useState("")
  const [formSpecialty, setFormSpecialty] = React.useState("")
  const [formSubject, setFormSubject] = React.useState("")
  const [formNotes, setFormNotes] = React.useState("")
  const [formDate, setFormDate] = React.useState("")
  const [formTime, setFormTime] = React.useState("")

  const handleCreateConsultation = async () => {
    if (!formType || !formSpecialty || !formSubject) {
      toast.error("Please fill in all required fields")
      return
    }
    setSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success("Consultation request submitted!")
      setDialogOpen(false)
      setFormType("")
      setFormSpecialty("")
      setFormSubject("")
      setFormNotes("")
      setFormDate("")
      setFormTime("")
    } catch {
      toast.error("Failed to submit consultation request")
    } finally {
      setSubmitting(false)
    }
  }

  const myRequests = consultations.filter(c => c.nurseFrom === "Nurse Adaora Nwosu")
  const incoming = consultations.filter(c => c.nurseTo === "Nurse Adaora Nwosu")

  const activeCount = consultations.filter(c => c.status === "Active").length
  const scheduledCount = consultations.filter(c => c.status === "Scheduled").length
  const completedCount = consultations.filter(c => c.status === "Completed").length

  const filterBySearch = (items: Consultation[]) =>
    items.filter(c =>
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nurseFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nurseTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                <Label>Consultation Type *</Label>
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
                <Label>Specialty *</Label>
                <Select value={formSpecialty} onValueChange={setFormSpecialty}>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neonatology">Neonatology</SelectItem>
                    <SelectItem value="emergency">Emergency Medicine</SelectItem>
                    <SelectItem value="obstetrics">Obstetrics</SelectItem>
                    <SelectItem value="infectious">Infectious Disease</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="critical-care">Critical Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Brief description of consultation topic" value={formSubject} onChange={e => setFormSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes</Label>
                <Textarea id="notes" placeholder="Describe the clinical question or concern" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
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

      {/* Tabs */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterBySearch(myRequests).map(consultation => (
              <ConsultationCard key={consultation.id} consultation={consultation} isIncoming={false} />
            ))}
            {filterBySearch(myRequests).length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Video className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No consultations found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="incoming" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterBySearch(incoming).map(consultation => (
              <ConsultationCard key={consultation.id} consultation={consultation} isIncoming={true} />
            ))}
            {filterBySearch(incoming).length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Video className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No incoming consultations</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConsultationCard({ consultation, isIncoming }: { consultation: Consultation; isIncoming: boolean }) {
  const TypeIcon = typeConfig[consultation.type].icon
  const StatusIcon = statusConfig[consultation.status].icon

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 truncate">{consultation.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] gap-1 ${typeConfig[consultation.type].color}`}>
                <TypeIcon className="size-3" />
                {typeConfig[consultation.type].label}
              </Badge>
              <Badge className={`text-[10px] gap-1 ${statusConfig[consultation.status].color}`}>
                <StatusIcon className="size-3" />
                {consultation.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Stethoscope className="size-3" />
          {consultation.specialty}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <User className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">{isIncoming ? "From:" : "To:"}</span>
            <span className="font-medium">{isIncoming ? consultation.nurseFrom : consultation.nurseTo}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {consultation.date} at {consultation.time}
          </div>
        </div>

        {consultation.notes && (
          <p className="text-xs text-muted-foreground bg-slate-50 rounded p-2 border">
            {consultation.notes}
          </p>
        )}

        {consultation.status === "Active" && (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
              {consultation.type === "Video" ? "Join Call" : consultation.type === "Chat" ? "Open Chat" : "Call Now"}
            </Button>
          </div>
        )}
        {consultation.status === "Scheduled" && isIncoming && (
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
