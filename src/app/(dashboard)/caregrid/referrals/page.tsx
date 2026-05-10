"use client"

import * as React from "react"
import { referrals, type Referral } from "@/lib/caregrid-data"
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
  Truck,
  AlertCircle,
  ChevronRight,
  User,
} from "lucide-react"

const statusConfig: Record<Referral["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  Accepted: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  "In Transit": { color: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck },
  Completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
}

const urgencyConfig: Record<Referral["urgency"], { color: string; dot: string }> = {
  Routine: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Urgent: { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  STAT: { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
}

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const filtered = React.useMemo(() => {
    return referrals.filter(r => {
      const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fromFacility.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.toFacility.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const totalReferrals = referrals.length
  const pendingCount = referrals.filter(r => r.status === "Pending").length
  const inTransitCount = referrals.filter(r => r.status === "In Transit").length
  const completedCount = referrals.filter(r => r.status === "Completed").length

  const pipelineSteps = [
    { label: "Pending", count: pendingCount, color: "bg-amber-500" },
    { label: "Accepted", count: referrals.filter(r => r.status === "Accepted").length, color: "bg-blue-500" },
    { label: "In Transit", count: inTransitCount, color: "bg-purple-500" },
    { label: "Completed", count: completedCount, color: "bg-emerald-500" },
  ]

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
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="size-4" />
              New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Referral</DialogTitle>
              <DialogDescription>
                Submit a patient referral to another facility
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient Name</Label>
                <Input id="patient" placeholder="Enter patient name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Facility</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f001">Lagos University Teaching Hospital</SelectItem>
                      <SelectItem value="f002">Federal Medical Centre, Abuja</SelectItem>
                      <SelectItem value="f006">Lagos State General Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Facility</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f007">National Hospital, Abuja</SelectItem>
                      <SelectItem value="f003">University College Hospital, Ibadan</SelectItem>
                      <SelectItem value="f010">Reddington Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select urgency level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Referral</Label>
                <Textarea id="reason" placeholder="Describe the clinical reason for referral" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Submit Referral</Button>
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
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Truck className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold text-slate-900">{inTransitCount}</p>
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
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="In Transit">In Transit</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardContent className="p-0">
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
                  const StatusIcon = statusConfig[referral.status].icon
                  return (
                    <TableRow key={referral.id} className="cursor-pointer hover:bg-emerald-50/50">
                      <TableCell className="font-mono text-xs">{referral.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="size-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{referral.patientName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {referral.patientAge}y, {referral.patientGender}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs max-w-[150px] truncate">
                        {referral.fromFacility}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs max-w-[150px] truncate">
                        {referral.toFacility}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] gap-1 ${urgencyConfig[referral.urgency].color}`}>
                          <span className={`size-1.5 rounded-full ${urgencyConfig[referral.urgency].dot}`} />
                          {referral.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{referral.nurseAssigned}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] gap-1 ${statusConfig[referral.status].color}`}>
                          <StatusIcon className="size-3" />
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {referral.date}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
