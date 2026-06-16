'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Building2,
  CreditCard,
  Crown,
  Loader2,
  Activity,
  FileText,
  Stethoscope,
  MessageCircle,
  UserX,
  Shield,
  Check,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  Eye,
  X,
  Search,
  GraduationCap,
  School,
  AlertTriangle,
  Upload,
  BookOpen,
} from 'lucide-react'
import { PLAN_LIMITS, PLAN_COLORS, type PlanType } from '@/lib/plan-limits'
import Link from 'next/link'

/* ─── Types ─── */
interface WorkerRow {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  phone: string | null
  avatarUrl: string | null
  createdAt: string
  nurseProfile: { licenseNumber: string; specialization: string | null } | null
}

interface FacilityData {
  facility: {
    id: string
    name: string
    type: string
    address: string
    city: string
    state: string
    phone: string | null
    email: string | null
    bedCapacity: number | null
    staffCount: number | null
    isVerified: boolean
  }
  workers: WorkerRow[]
  patientCount: number
  recentRecordsCount: number
  recentReferrals: number
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodEnd: string | null
    trialEndsAt: string | null
    paymentMethod: string | null
  } | null
  academicStats?: {
    isAcademicInstitution: boolean
    totalLecturers: number
    pendingLecturers: number
    activeLecturers: number
    totalStudents: number
    totalMaterials: number
    materialsByLevel: Array<{ level: number; count: number }>
    trialEndsAt: string | null
    trialDaysLeft: number | null
    trialEnded: boolean
  } | null
  // Detailed academic rosters — only populated for UNIVERSITY / SCHOOL_OF_NURSING facilities
  lecturers?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    status: string
    createdAt: string
  }>
  students?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    studentLevel: number | null
    matricNumber: string | null
    status: string
    createdAt: string
  }>
  studentsByLevel?: Array<{
    level: number
    count: number
    students: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      matricNumber: string | null
      status: string
    }>
  }>
  recentActivity: {
    id: string
    action: string
    resource: string
    details: string | null
    createdAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      role: string
    } | null
  }[]
  admissionTrend: {
    encounterType: string
    _count: number
  }[]
}

/* ─── Helpers ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const roleLabels: Record<string, string> = {
  NURSE: 'Nurse',
  DOCTOR: 'Doctor',
  ADMIN: 'Admin',
  MATRON: 'Matron',
  STUDENT: 'Student',
  SUPER_ADMIN: 'Super Admin',
}

const statusColorMap: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  EXPIRED: 'bg-red-500/10 text-red-600 border-red-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

/* ─── Main Page ─── */
export default function FacilityAdminDashboard() {
  const { user, token } = useAuthStore()
  const router = useRouter()

  /* ─── State ─── */
  const [data, setData] = React.useState<FacilityData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [workerSearch, setWorkerSearch] = React.useState('')
  const [pendingUserSearch, setPendingUserSearch] = React.useState('')

  // Remove worker dialog
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [removingWorker, setRemovingWorker] = React.useState<WorkerRow | null>(null)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Pending user approvals
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([])
  const [approvingUserId, setApprovingUserId] = React.useState<string | null>(null)
  const [rejectingUserId, setRejectingUserId] = React.useState<string | null>(null)

  /* ─── Auth headers helper ─── */
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  /* ─── Fetch facility data ─── */
  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/facility', { headers: getHeaders() })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to load facility data')
        return
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching facility data:', error)
      toast.error('Failed to load facility data')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch pending users for approval
  React.useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch('/api/admin/pending-users', { headers: getHeaders() })
        if (res.ok) {
          const data = await res.json()
          setPendingUsers(data.pendingUsers || [])
        }
      } catch {
        // silently fail
      }
    }
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      fetchPending()
    }
  }, [user?.role, token])

  /* ─── Remove worker ─── */
  const handleRemoveWorker = async () => {
    if (!removingWorker) return
    setIsRemoving(true)
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ workerId: removingWorker.id, action: 'remove' }),
      })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to remove worker')
        return
      }

      toast.success(`${removingWorker.firstName} ${removingWorker.lastName} removed from facility`)
      setRemoveDialogOpen(false)
      setRemovingWorker(null)
      fetchData()
    } catch (error) {
      console.error('Error removing worker:', error)
      toast.error('Failed to remove worker')
    } finally {
      setIsRemoving(false)
    }
  }

  /* ─── Approve user ─── */
  const handleApproveUser = async (userId: string) => {
    setApprovingUserId(userId)
    try {
      const res = await fetch('/api/admin/pending-users', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ userId, action: 'approve' }),
      })
      if (res.ok) {
        toast.success('User approved successfully')
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to approve user')
      }
    } catch {
      toast.error('Failed to approve user')
    } finally {
      setApprovingUserId(null)
    }
  }

  /* ─── Reject user ─── */
  const handleRejectUser = async (userId: string) => {
    setRejectingUserId(userId)
    try {
      const res = await fetch('/api/admin/pending-users', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ userId, action: 'reject' }),
      })
      if (res.ok) {
        toast.success('User rejected')
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject user')
      }
    } catch {
      toast.error('Failed to reject user')
    } finally {
      setRejectingUserId(null)
    }
  }

  /* ─── Derived data ─── */
  const currentPlan = (data?.subscription?.plan || 'FREE') as PlanType
  const currentLimits = PLAN_LIMITS[currentPlan]
  const planStatus = data?.subscription?.status || 'ACTIVE'
  const filteredWorkers = (data?.workers || []).filter((w) => {
    if (!workerSearch) return true
    const q = workerSearch.toLowerCase()
    return (
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q)
    )
  })

  const filteredPendingUsers = pendingUsers.filter((pu: any) => {
    if (!pendingUserSearch) return true
    const q = pendingUserSearch.toLowerCase()
    return (
      `${pu.firstName} ${pu.lastName}`.toLowerCase().includes(q) ||
      pu.email?.toLowerCase().includes(q) ||
      pu.role?.toLowerCase().includes(q)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading facility data...</span>
      </div>
    )
  }

  // Role checks (after all hooks)
  if (user?.role === 'SUPER_ADMIN') {
    if (typeof window !== 'undefined') {
      window.location.href = '/superadmin'
    }
    return null
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">Only Facility Admins can access this dashboard.</p>
        </div>
      </div>
    )
  }

  /* ─── Route: ACADEMIC institution admin → dedicated dashboard ─── */
  // If the admin's facility is UNIVERSITY or SCHOOL_OF_NURSING, render ONLY the academic
  // admin dashboard (lecturers, students, subscription, announcements). Hide all the
  // hospital-style widgets (workers, patients, referrals, medical records).
  // This is a HARD route — institution admins never see the regular facility admin UI.
  const isAcademicInstitution =
    data?.facility?.type === 'UNIVERSITY' || data?.facility?.type === 'SCHOOL_OF_NURSING'

  if (isAcademicInstitution && data) {
    return <InstitutionAdminDashboard data={data} token={token} onRefresh={fetchData} onRefreshPending={fetchPendingUsers} />
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Facility Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your facility, workers, and subscription
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${PLAN_COLORS[currentPlan]}`}>
            <Crown className="size-3 mr-1" />
            {currentLimits.name}
          </Badge>
          <Badge variant="outline" className={`text-xs ${statusColorMap[planStatus] || ''}`}>
            {planStatus}
          </Badge>
        </div>
      </div>

      {/* ── Overview Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Workers</p>
                <p className="text-3xl font-bold text-foreground mt-1">{data?.workers?.length || 0}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Users className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-500/20 bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patients</p>
                <p className="text-3xl font-bold text-foreground mt-1">{data?.patientCount || 0}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
                <Stethoscope className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-50/80 to-emerald-50/80 dark:from-cyan-950/30 dark:to-emerald-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Encounters (30d)</p>
                <p className="text-3xl font-bold text-foreground mt-1">{data?.recentRecordsCount || 0}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 shadow-lg shadow-cyan-500/20">
                <FileText className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</p>
                <p className="text-2xl font-bold text-foreground mt-1">{currentLimits.price}{currentLimits.period}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg shadow-emerald-600/20">
                <Crown className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Plan Section — FREE FOREVER (subscription feature removed) ── */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-emerald-600" />
            <CardTitle className="text-lg">Your Plan</CardTitle>
          </div>
          <CardDescription>NurseOS is free forever — no subscription required</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <Check className="size-3 mr-1" />Active · Free Forever
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            All features are available to all users at no cost. No payments, no trials, no billing.
          </p>
        </CardContent>
      </Card>

      {/* ── Academic Institution Card (only for UNIVERSITY / SCHOOL_OF_NURSING) ── */}
      {/* Subscription/trial references removed — NurseOS is free forever */}
      {data?.academicStats?.isAcademicInstitution && (
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="size-5 text-emerald-600" />
                <CardTitle className="text-lg">Academic Institution</CardTitle>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-50">
                <Check className="size-3 mr-1" />
                Free Forever
              </Badge>
            </div>
            <CardDescription>
              {data.facility?.type === 'UNIVERSITY' ? 'University' : 'School of Nursing'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="size-3.5 text-emerald-600" />
                  <p className="text-xs text-muted-foreground">Lecturers</p>
                </div>
                <p className="text-lg font-bold">{data.academicStats.activeLecturers}</p>
                {data.academicStats.pendingLecturers > 0 && (
                  <p className="text-[10px] text-amber-600 mt-0.5">
                    {data.academicStats.pendingLecturers} pending
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="size-3.5 text-blue-600" />
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <p className="text-lg font-bold">{data.academicStats.totalStudents}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Upload className="size-3.5 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Materials</p>
                </div>
                <p className="text-lg font-bold">{data.academicStats.totalMaterials}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="size-3.5 text-amber-600" />
                  <p className="text-xs text-muted-foreground">Levels</p>
                </div>
                <p className="text-lg font-bold">{data.academicStats.materialsByLevel.length}</p>
              </div>
            </div>

            {/* Materials by level breakdown */}
            {data.academicStats.materialsByLevel.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Materials by Level:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.academicStats.materialsByLevel
                    .sort((a, b) => a.level - b.level)
                    .map((m) => (
                      <Badge key={m.level} variant="outline" className="text-xs">
                        {m.level} Level: {m.count}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Workers Management ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Workers</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {data?.workers?.length || 0} workers
            </Badge>
          </div>
          <CardDescription>Healthcare workers in your facility</CardDescription>
          <div className="pt-2">
            <Input
              placeholder="Search workers by name, email, or role..."
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredWorkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">No workers found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {workerSearch ? 'Try adjusting your search.' : 'Workers will appear here when they join your facility.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                            {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{worker.firstName} {worker.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{worker.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {roleLabels[worker.role] || worker.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {worker.nurseProfile?.licenseNumber || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(worker.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 border-red-500/30 text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            setRemovingWorker(worker)
                            setRemoveDialogOpen(true)
                          }}
                        >
                          <UserX className="size-3 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pending User Approvals ── */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-amber-600" />
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
              {pendingUsers.length} pending
            </Badge>
          </div>
          <CardDescription>Users waiting for access to your facility</CardDescription>
          <div className="pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search pending users by name, email, or role..."
                value={pendingUserSearch}
                onChange={(e) => setPendingUserSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check className="size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingUsers.map((pu: any) => (
                <div key={pu.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-sm font-semibold">
                      {pu.firstName?.charAt(0)}{pu.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pu.firstName} {pu.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {pu.email} · {pu.academicRole === 'LECTURER' ? 'Lecturer' : pu.academicRole === 'STUDENT' ? `Student (${pu.studentLevel || '—'} Level)` : (roleLabels[pu.role] || pu.role)}
                      </p>
                      <p className="text-xs text-muted-foreground">Applied {formatDate(pu.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApproveUser(pu.id)}
                      disabled={approvingUserId === pu.id}
                    >
                      {approvingUserId === pu.id ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Check className="size-3 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRejectUser(pu.id)}
                      disabled={rejectingUserId === pu.id}
                    >
                      {rejectingUserId === pu.id ? <Loader2 className="size-3 mr-1 animate-spin" /> : <X className="size-3 mr-1" />}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Facility Info, Analytics & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facility Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Facility Information</CardTitle>
            </div>
            <CardDescription>Your registered healthcare facility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{data?.facility?.name || 'Unnamed Facility'}</p>
                <p className="text-xs text-muted-foreground">{data?.facility?.type || 'General'} Facility</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm">{data?.facility?.address || 'No address'}</p>
                <p className="text-xs text-muted-foreground">{data?.facility?.city || '—'}, {data?.facility?.state || '—'}</p>
              </div>
            </div>
            {data?.facility?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <p className="text-sm">{data.facility?.phone}</p>
              </div>
            )}
            {data?.facility?.email && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <p className="text-sm">{data.facility?.email}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`text-[10px] ${data?.facility?.isVerified ? 'text-emerald-600 border-emerald-500/30' : 'text-amber-600 border-amber-500/30'}`}>
                {data?.facility?.isVerified ? 'Verified' : 'Pending Verification'}
              </Badge>
              {data?.facility?.bedCapacity && (
                <span className="text-xs text-muted-foreground">{data.facility?.bedCapacity} beds</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Admission Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Analytics Overview</CardTitle>
            </div>
            <CardDescription>Recent activity and admission trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Admission Trend */}
            {data?.admissionTrend && data.admissionTrend.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Admissions (7d)</p>
                <div className="space-y-1.5">
                  {data.admissionTrend.map((item) => (
                    <div key={item.encounterType} className="flex items-center gap-2">
                      <TrendingUp className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs text-muted-foreground flex-1">{item.encounterType.replace('_', ' ')}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        {item._count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Recent Activity Feed */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Activity</p>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-xs">
                      <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 shrink-0 mt-0.5">
                        <Eye className="size-2.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">{log.user?.firstName || 'Unknown'} {log.user?.lastName || ''}</span>
                          {' '}{log.action.replace(/_/g, ' ').toLowerCase()}
                          {log.details && <span className="text-muted-foreground"> — {log.details.length > 60 ? log.details.slice(0, 60) + '…' : log.details}</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {new Date(log.createdAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <Clock className="size-5 text-muted-foreground/30 mb-1.5" />
                  <p className="text-xs text-muted-foreground">No recent activity recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Remove Worker Dialog ── */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="size-4 text-red-500" />
              Remove Worker
            </DialogTitle>
            <DialogDescription>
              Remove {removingWorker?.firstName} {removingWorker?.lastName} from your facility. They will lose access to all facility data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {removingWorker && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-300">
                <strong>Warning:</strong> This will unassign {removingWorker.firstName} {removingWorker.lastName} ({removingWorker.email}) from {data?.facility?.name || 'your facility'}. They can be re-assigned later.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveWorker} disabled={isRemoving}>
              {isRemoving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Remove Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ─── InstitutionAdminDashboard — for UNIVERSITY / SCHOOL_OF_NURSING admins ── */
/* ────────────────────────────────────────────────────────────────────────── */
//
// SCOPE: This dashboard renders ONLY:
//   1. Lecturers under this institution (names + emails + approval status)
//   2. Students under this institution (names + levels + matric numbers, grouped by level)
//   3. Current subscription pricing / plan + free trial status
//   4. Pending lecturer approvals
//   5. A link to send announcements (which already supports level-targeting)
//
// It deliberately does NOT render:
//   - Other facilities (no cross-facility data ever — all queries are scoped to the admin's facility)
//   - Hospital widgets (patients, medical records, referrals, etc.) — irrelevant for an institution
//   - Analytics dashboards, disease surveillance, staffing, etc.
//
// SECURITY: All data passed in via `data` prop is already scoped server-side to the admin's facilityId.
//           No client-side filtering is needed for isolation — the server enforces it.
//
function InstitutionAdminDashboard({
  data,
  token,
  onRefresh,
  onRefreshPending,
}: {
  data: FacilityData
  token: string | null
  onRefresh: () => Promise<void>
  onRefreshPending: () => Promise<void>
}) {
  const [approvingId, setApprovingId] = React.useState<string | null>(null)
  const [rejectingId, setRejectingId] = React.useState<string | null>(null)
  const [studentSearch, setStudentSearch] = React.useState('')
  const [lecturerSearch, setLecturerSearch] = React.useState('')
  const [levelFilter, setLevelFilter] = React.useState<string>('all')

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  async function handleApproveLecturer(userId: string) {
    setApprovingId(userId)
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, action: 'approve' }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to approve lecturer')
        return
      }
      toast.success('Lecturer approved')
      await onRefresh()
      await onRefreshPending()
    } catch {
      toast.error('Failed to approve lecturer')
    } finally {
      setApprovingId(null)
    }
  }

  async function handleRejectLecturer(userId: string) {
    setRejectingId(userId)
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, action: 'reject' }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to reject lecturer')
        return
      }
      toast.success('Lecturer rejected')
      await onRefresh()
      await onRefreshPending()
    } catch {
      toast.error('Failed to reject lecturer')
    } finally {
      setRejectingId(null)
    }
  }

  // Filter students by search + level
  const filteredStudents = React.useMemo(() => {
    let list = data.students || []
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase()
      list = list.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.matricNumber || '').toLowerCase().includes(q)
      )
    }
    if (levelFilter !== 'all') {
      list = list.filter((s) => String(s.studentLevel) === levelFilter)
    }
    return list
  }, [data.students, studentSearch, levelFilter])

  // Filter lecturers by search
  const filteredLecturers = React.useMemo(() => {
    let list = data.lecturers || []
    if (lecturerSearch.trim()) {
      const q = lecturerSearch.toLowerCase()
      list = list.filter((l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [data.lecturers, lecturerSearch])

  const trialEnded = data.academicStats?.trialEnded
  const trialDaysLeft = data.academicStats?.trialDaysLeft
  const subscription = data.subscription
  const facility = data.facility
  const pendingLecturers = filteredLecturers.filter((l) => l.status === 'PENDING')

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {facility?.type === 'UNIVERSITY' ? 'University Admin' : 'School of Nursing Admin'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {facility?.name} · {facility?.city}, {facility?.state}
          </p>
        </div>
        <Link href="/announcements">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <MessageCircle className="size-4 mr-2" />
            Send Announcement
          </Button>
        </Link>
      </div>

      {/* ── Subscription card — FREE FOREVER ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-600" />
            Subscription
          </CardTitle>
          <CardDescription>
            Your institution&apos;s plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold">Free</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <Check className="size-3 mr-1" />Active
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing</p>
              <p className="text-lg font-semibold text-emerald-600">Free Forever</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              ✓ Your institution is free forever. Lecturers can upload unlimited materials — no payment required.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Lecturers</p>
                <p className="text-2xl font-bold">{data.academicStats?.activeLecturers ?? 0}</p>
              </div>
              <School className="size-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Lecturers</p>
                <p className="text-2xl font-bold">{data.academicStats?.pendingLecturers ?? 0}</p>
              </div>
              <Clock className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{data.academicStats?.totalStudents ?? 0}</p>
              </div>
              <GraduationCap className="size-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Course Materials</p>
                <p className="text-2xl font-bold">{data.academicStats?.totalMaterials ?? 0}</p>
              </div>
              <BookOpen className="size-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pending lecturer approvals ── */}
      {pendingLecturers.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-amber-500" />
              Pending Lecturer Approvals
            </CardTitle>
            <CardDescription>
              Lecturers who signed up and are waiting for your approval to access the institution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLecturers.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/40 dark:bg-amber-950/10">
                  <div>
                    <p className="font-medium">{l.firstName} {l.lastName}</p>
                    <p className="text-xs text-muted-foreground">{l.email}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Signed up {formatDate(l.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleApproveLecturer(l.id)}
                      disabled={approvingId === l.id}
                    >
                      {approvingId === l.id ? (
                        <Loader2 className="size-3.5 mr-1 animate-spin" />
                      ) : (
                        <Check className="size-3.5 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectLecturer(l.id)}
                      disabled={rejectingId === l.id}
                    >
                      {rejectingId === l.id ? (
                        <Loader2 className="size-3.5 mr-1 animate-spin" />
                      ) : (
                        <X className="size-3.5 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lecturers list ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="size-5 text-emerald-600" />
                Lecturers ({filteredLecturers.length})
              </CardTitle>
              <CardDescription>All lecturers at your institution</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={lecturerSearch}
                onChange={(e) => setLecturerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLecturers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No lecturers found. Lecturers who sign up and select your institution will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLecturers.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {l.firstName} {l.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{l.email}</TableCell>
                      <TableCell className="text-sm">{l.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColorMap[l.status] || ''}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Students list (with matric number + level grouping) ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-blue-600" />
                Students ({filteredStudents.length})
              </CardTitle>
              <CardDescription>
                All students enrolled at your institution with their matric numbers and levels
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, or matric..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                  <SelectItem value="500">500 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No students found. Students who sign up and select your institution will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell className="text-sm font-mono">{s.matricNumber || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                          {s.studentLevel || '—'} Level
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(s.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Students grouped by level (only when no search/filter is active) ── */}
      {(!studentSearch.trim() && levelFilter === 'all') && (data.studentsByLevel || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-purple-600" />
              Students by Level
            </CardTitle>
            <CardDescription>
              Breakdown of enrolled students by academic level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data.studentsByLevel || []).map((lvl) => (
                <div key={lvl.level} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{lvl.level} Level</h4>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                      {lvl.count} {lvl.count === 1 ? 'student' : 'students'}
                    </Badge>
                  </div>
                  {lvl.students.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {lvl.students.slice(0, 8).map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {s.matricNumber || '—'}
                          </span>
                        </li>
                      ))}
                      {lvl.students.length > 8 && (
                        <li className="text-xs text-muted-foreground italic">
                          + {lvl.students.length - 8} more
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">No students in this level.</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
