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
import { Label } from '@/components/ui/label'
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
  ArrowRightLeft,
  FileText,
  Stethoscope,
  MessageCircle,
  RefreshCw,
  UserX,
  Shield,
  Check,
  Zap,
  Phone,
  Mail,
  MapPin,
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

  /* ─── Role Check ─── */
  if (user?.role === 'SUPER_ADMIN') {
    // Redirect super admins to their dedicated dashboard
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

  /* ─── State ─── */
  const [data, setData] = React.useState<FacilityData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [workerSearch, setWorkerSearch] = React.useState('')

  // Remove worker dialog
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false)
  const [removingWorker, setRemovingWorker] = React.useState<WorkerRow | null>(null)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Upgrade dialog
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<PlanType | ''>('')
  const [paymentMethod, setPaymentMethod] = React.useState('')
  const [paymentReference, setPaymentReference] = React.useState('')
  const [isUpgrading, setIsUpgrading] = React.useState(false)

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

  /* ─── Upgrade plan ─── */
  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan')
      return
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setIsUpgrading(true)
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod,
          paymentReference: paymentReference || undefined,
        }),
      })

      const result = await res.json()
      if (res.ok) {
        toast.success(result.message || 'Upgrade request submitted!')
        setUpgradeDialogOpen(false)
        setSelectedPlan('')
        setPaymentMethod('')
        setPaymentReference('')
        fetchData()
      } else {
        toast.error(result.error || 'Failed to submit upgrade request')
      }
    } catch {
      toast.error('Failed to submit upgrade request')
    } finally {
      setIsUpgrading(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading facility data...</span>
      </div>
    )
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
                <p className="text-3xl font-bold text-foreground mt-1">{data?.workers.length || 0}</p>
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

      {/* ── Subscription & Plan Section ── */}
      <Card className="border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Subscription & Plan</CardTitle>
            </div>
            <Badge className={PLAN_COLORS[currentPlan]}>
              {currentLimits.name}
            </Badge>
          </div>
          <CardDescription>Your facility's subscription and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan status */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColorMap[planStatus] || ''}>
              {planStatus}
            </Badge>
            {data?.subscription?.currentPeriodEnd && (
              <span className="text-xs text-muted-foreground">
                {planStatus === 'ACTIVE'
                  ? `Renews ${formatDate(data.subscription.currentPeriodEnd)}`
                  : planStatus === 'TRIALING'
                  ? `Trial ends ${formatDate(data.subscription.trialEndsAt || data.subscription.currentPeriodEnd)}`
                  : ''}
              </span>
            )}
          </div>

          <Separator />

          {/* Usage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">Patients</p>
              <p className="text-lg font-bold">
                {data?.patientCount || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {currentLimits.patientLimit === -1 ? '∞' : currentLimits.patientLimit}
                </span>
              </p>
              {currentLimits.patientLimit !== -1 && (data?.patientCount || 0) >= currentLimits.patientLimit && (
                <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 bg-red-50 mt-1">Limit Reached</Badge>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">Workers</p>
              <p className="text-lg font-bold">
                {data?.workers.length || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {currentLimits.nurseAccounts === -1 ? '∞' : currentLimits.nurseAccounts}
                </span>
              </p>
              {currentLimits.nurseAccounts !== -1 && (data?.workers.length || 0) >= currentLimits.nurseAccounts && (
                <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 bg-red-50 mt-1">Limit Reached</Badge>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">AI Queries/Day</p>
              <p className="text-lg font-bold">
                0
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {currentLimits.aiQueriesPerDay === -1 ? '∞' : currentLimits.aiQueriesPerDay}
                </span>
              </p>
            </div>
          </div>

          {/* Feature checklist */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Included Features:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {currentLimits.nurseIdVerification && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> NurseID Verification
                </div>
              )}
              {currentLimits.predictiveAnalytics && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Predictive Analytics
                </div>
              )}
              {currentLimits.dataExport && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Data Export
                </div>
              )}
              {currentLimits.premiumCourses && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Premium Courses
                </div>
              )}
              {currentLimits.customReporting && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Custom Reporting
                </div>
              )}
              {currentLimits.prioritySupport && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Priority Support
                </div>
              )}
              {currentLimits.customIntegrations && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Custom Integrations
                </div>
              )}
              {currentLimits.multiDepartment && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Check className="size-3 text-emerald-500" /> Multi-Department
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {currentPlan === 'FREE' ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              setSelectedPlan('STARTER')
              setUpgradeDialogOpen(true)
            }}>
              <Zap className="size-4 mr-2" /> Upgrade Plan
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(true)}>
              Change Plan
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/subscription')}>
            <CreditCard className="size-4 mr-2" /> View Details
          </Button>
          <Button variant="outline" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
            <MessageCircle className="size-4 mr-2" /> Billing Support
          </Button>
        </CardFooter>
      </Card>

      {/* ── Workers Management ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Workers</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {data?.workers.length || 0} workers
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

      {/* ── Facility Info & Quick Actions ── */}
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
                <p className="text-sm font-medium">{data?.facility.name || 'Unnamed Facility'}</p>
                <p className="text-xs text-muted-foreground">{data?.facility.type || 'General'} Facility</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm">{data?.facility.address || 'No address'}</p>
                <p className="text-xs text-muted-foreground">{data?.facility.city}, {data?.facility.state}</p>
              </div>
            </div>
            {data?.facility.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <p className="text-sm">{data.facility.phone}</p>
              </div>
            )}
            {data?.facility.email && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <p className="text-sm">{data.facility.email}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`text-[10px] ${data?.facility.isVerified ? 'text-emerald-600 border-emerald-500/30' : 'text-amber-600 border-amber-500/30'}`}>
                {data?.facility.isVerified ? 'Verified' : 'Pending Verification'}
              </Badge>
              {data?.facility.bedCapacity && (
                <span className="text-xs text-muted-foreground">{data.facility.bedCapacity} beds</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </div>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/caregrid/facilities')}>
              <Building2 className="size-4 mr-2 text-emerald-600" /> View Facilities Directory
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/caregrid/referrals/new')}>
              <ArrowRightLeft className="size-4 mr-2 text-teal-600" /> New Referral
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/nurseai/patients')}>
              <Stethoscope className="size-4 mr-2 text-cyan-600" /> Manage Patients
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/analytics')}>
              <Activity className="size-4 mr-2 text-emerald-600" /> View Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
              <MessageCircle className="size-4 mr-2 text-green-600" /> Contact Support (WhatsApp)
            </Button>
            <Button variant="outline" className="w-full justify-start text-sm" onClick={() => fetchData()}>
              <RefreshCw className="size-4 mr-2 text-teal-600" /> Refresh Dashboard
            </Button>
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
                <strong>Warning:</strong> This will unassign {removingWorker.firstName} {removingWorker.lastName} ({removingWorker.email}) from {data?.facility.name || 'your facility'}. They can be re-assigned later.
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

      {/* ── Upgrade Dialog ── */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan ? PLAN_LIMITS[selectedPlan].name : ''}</DialogTitle>
            <DialogDescription>
              Complete your upgrade request. Your 14-day free trial starts immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedPlan && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {PLAN_LIMITS[selectedPlan].name} — {PLAN_LIMITS[selectedPlan].price}{PLAN_LIMITS[selectedPlan].period}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">14-day free trial included</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Facility Starter — ₦50K/mo</SelectItem>
                  <SelectItem value="PRO">Pro — ₦150K/mo</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise — Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="How will you pay?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MANUAL">Manual / Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Payment Reference (optional)</Label>
              <Input
                placeholder="e.g., Transfer receipt number"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpgrade} disabled={isUpgrading}>
              {isUpgrading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Submit Upgrade Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
