'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  ShieldCheck,
  XCircle,
  RefreshCw,
  Pencil,
  UserPlus,
  MessageCircle,
  Activity,
  Stethoscope,
  BookOpen,
  FileText,
  Heart,
  Loader2,
  AlertTriangle,
  Search,
  CheckCircle2,
  Crown,
} from 'lucide-react'

/* ─── Types ─── */
interface SubscriptionRow {
  id: string
  userId: string
  facilityId: string | null
  plan: string
  status: string
  trialEndsAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  paymentMethod: string | null
  paymentReference: string | null
  amountPaid: number | null
  currency: string
  verifiedBy: string | null
  verifiedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  facility: {
    id: string
    name: string
    type: string
    city: string
    state: string
  } | null
}

interface AppStats {
  totalUsers: number
  totalNurses: number
  totalPatients: number
  totalFacilities: number
  totalCourses: number
  totalMedicalRecords: number
}

/* ─── Helpers ─── */
function formatNaira(amount: number | null): string {
  if (amount == null) return '₦0'
  return '₦' + amount.toLocaleString('en-NG')
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const statusColorMap: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  TRIALING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  EXPIRED: 'bg-red-500/10 text-red-600 border-red-500/20',
  CANCELLED: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

const planColorMap: Record<string, string> = {
  FREE: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  STARTER: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  PRO: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  ENTERPRISE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
}

/* ─── Main Page ─── */
export default function SuperAdminDashboard() {
  const { user, token } = useAuthStore()

  /* ─── State ─── */
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionRow[]>([])
  const [subStats, setSubStats] = React.useState({
    total: 0,
    active: 0,
    trialing: 0,
    expired: 0,
    totalRevenue: 0,
  })
  const [appStats, setAppStats] = React.useState<AppStats>({
    totalUsers: 0,
    totalNurses: 0,
    totalPatients: 0,
    totalFacilities: 0,
    totalCourses: 0,
    totalMedicalRecords: 0,
  })
  const [isLoadingSubs, setIsLoadingSubs] = React.useState(true)
  const [isLoadingStats, setIsLoadingStats] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [planFilter, setPlanFilter] = React.useState('ALL')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Action loading states
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({})

  // Edit Plan dialog
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editingSub, setEditingSub] = React.useState<SubscriptionRow | null>(null)
  const [editPlan, setEditPlan] = React.useState('')
  const [editAmount, setEditAmount] = React.useState('')
  const [editNotes, setEditNotes] = React.useState('')

  // Create Super Admin dialog
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = React.useState(false)
  const [isCreatingAdmin, setIsCreatingAdmin] = React.useState(false)

  /* ─── Auth headers helper ─── */
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.id || '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  /* ─── Fetch subscriptions ─── */
  const fetchSubscriptions = React.useCallback(async () => {
    setIsLoadingSubs(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
      if (planFilter && planFilter !== 'ALL') params.set('plan', planFilter)

      const res = await fetch(`/api/subscriptions/admin?${params.toString()}`, {
        headers: getHeaders(),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch subscriptions')
        return
      }

      setSubscriptions(data.subscriptions || [])
      setSubStats(data.stats || { total: 0, active: 0, trialing: 0, expired: 0, totalRevenue: 0 })
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      setIsLoadingSubs(false)
    }
  }, [statusFilter, planFilter, user?.id, token])

  /* ─── Fetch app stats ─── */
  const fetchAppStats = React.useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const res = await fetch('/api/admin/stats', {
        headers: getHeaders(),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch app stats')
        return
      }

      setAppStats(data)
    } catch (error) {
      console.error('Error fetching app stats:', error)
      toast.error('Failed to load app stats')
    } finally {
      setIsLoadingStats(false)
    }
  }, [user?.id, token])

  React.useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  React.useEffect(() => {
    fetchAppStats()
  }, [fetchAppStats])

  /* ─── Subscription actions ─── */
  const handleSubscriptionAction = async (
    subscriptionId: string,
    action: 'verify' | 'reject' | 'renew' | 'update',
    extra: Record<string, unknown> = {}
  ) => {
    setActionLoading((prev) => ({ ...prev, [subscriptionId + action]: true }))
    try {
      const res = await fetch('/api/subscriptions/admin', {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ subscriptionId, action, ...extra }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || `Failed to ${action} subscription`)
        return
      }

      toast.success(data.message || `Subscription ${action} successful`)
      fetchSubscriptions()
      fetchAppStats()
    } catch (error) {
      console.error(`Error ${action} subscription:`, error)
      toast.error(`Failed to ${action} subscription`)
    } finally {
      setActionLoading((prev) => ({ ...prev, [subscriptionId + action]: false }))
    }
  }

  const handleVerify = (subId: string) => {
    handleSubscriptionAction(subId, 'verify')
  }

  const handleReject = (subId: string) => {
    handleSubscriptionAction(subId, 'reject')
  }

  const handleRenew = (subId: string) => {
    handleSubscriptionAction(subId, 'renew')
  }

  const handleEditPlan = () => {
    if (!editingSub) return
    const extra: Record<string, unknown> = {}
    if (editPlan) extra.plan = editPlan
    if (editAmount) extra.amountPaid = parseFloat(editAmount)
    if (editNotes) extra.notes = editNotes
    handleSubscriptionAction(editingSub.id, 'update', extra)
    setEditDialogOpen(false)
    setEditingSub(null)
    setEditPlan('')
    setEditAmount('')
    setEditNotes('')
  }

  const openEditDialog = (sub: SubscriptionRow) => {
    setEditingSub(sub)
    setEditPlan(sub.plan)
    setEditAmount(sub.amountPaid?.toString() || '')
    setEditNotes('')
    setEditDialogOpen(true)
  }

  /* ─── Create Super Admin ─── */
  const handleCreateSuperAdmin = async () => {
    setIsCreatingAdmin(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Super',
          lastName: 'Admin',
          email: 'superadmin@nurseos.com',
          password: 'NurseOS@2024!Super',
          role: 'SUPER_ADMIN',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create Super Admin')
        return
      }

      toast.success('Super Admin user created successfully!')
      setCreateAdminDialogOpen(false)
      fetchAppStats()
    } catch (error) {
      console.error('Error creating Super Admin:', error)
      toast.error('Failed to create Super Admin')
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  /* ─── Derived data ─── */
  const pendingTrials = subscriptions.filter((s) => s.status === 'TRIALING')
  const filteredSubs = subscriptions.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const name = `${s.user.firstName} ${s.user.lastName}`.toLowerCase()
      const email = s.user.email.toLowerCase()
      const facility = s.facility?.name.toLowerCase() || ''
      if (!name.includes(q) && !email.includes(q) && !facility.includes(q)) return false
    }
    return true
  })

  /* ─── Render ─── */
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage NurseOS users, subscriptions, and platform health
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 w-fit text-xs px-3 py-1"
        >
          <ShieldCheck className="size-3.5" />
          SUPER_ADMIN
        </Badge>
      </div>

      {/* ── Overview Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoadingStats ? (
                    <Loader2 className="size-6 animate-spin text-emerald-500" />
                  ) : (
                    appStats.totalUsers.toLocaleString()
                  )}
                </p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Facilities
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoadingStats ? (
                    <Loader2 className="size-6 animate-spin text-teal-500" />
                  ) : (
                    appStats.totalFacilities.toLocaleString()
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
                <Building2 className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-50/80 to-emerald-50/80 dark:from-cyan-950/30 dark:to-emerald-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Subscriptions
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoadingSubs ? (
                    <Loader2 className="size-6 animate-spin text-cyan-500" />
                  ) : (
                    subStats.active.toLocaleString()
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 shadow-lg shadow-cyan-500/20">
                <CreditCard className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {isLoadingSubs ? (
                    <Loader2 className="size-6 animate-spin text-emerald-500" />
                  ) : (
                    formatNaira(subStats.totalRevenue)
                  )}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 shadow-lg shadow-emerald-600/20">
                <DollarSign className="size-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pending Verifications Section ── */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <CardTitle className="text-lg">Pending Verifications</CardTitle>
            </div>
            <Badge
              variant="outline"
              className="gap-1 text-xs border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              {pendingTrials.length} pending
            </Badge>
          </div>
          <CardDescription>
            Subscriptions with TRIALING status that need payment verification before activation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSubs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-amber-500" />
              <span className="ml-3 text-muted-foreground">Loading pending verifications...</span>
            </div>
          ) : pendingTrials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="size-10 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No subscriptions are pending verification right now.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Payment Ref</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTrials.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {sub.user.firstName} {sub.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${planColorMap[sub.plan] || ''}`}
                        >
                          {sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatNaira(sub.amountPaid)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.facility?.name || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {sub.paymentReference || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8"
                            onClick={() => handleVerify(sub.id)}
                            disabled={actionLoading[sub.id + 'verify']}
                          >
                            {actionLoading[sub.id + 'verify'] ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" />
                            ) : (
                              <ShieldCheck className="size-3.5 mr-1" />
                            )}
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-8"
                            onClick={() => handleReject(sub.id)}
                            disabled={actionLoading[sub.id + 'reject']}
                          >
                            {actionLoading[sub.id + 'reject'] ? (
                              <Loader2 className="size-3.5 animate-spin mr-1" />
                            ) : (
                              <XCircle className="size-3.5 mr-1" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── All Subscriptions Table ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-600" />
            <CardTitle className="text-lg">All Subscriptions</CardTitle>
          </div>
          <CardDescription>
            Manage all subscription records across the platform
          </CardDescription>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or facility..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIALING">Trialing</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Plans</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => {
                setStatusFilter('ALL')
                setPlanFilter('ALL')
                setSearchQuery('')
                fetchSubscriptions()
              }}
            >
              <RefreshCw className="size-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSubs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-emerald-500" />
              <span className="ml-3 text-muted-foreground">Loading subscriptions...</span>
            </div>
          ) : filteredSubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">No subscriptions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {sub.user.firstName} {sub.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${planColorMap[sub.plan] || ''}`}
                        >
                          {sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusColorMap[sub.status] || ''}`}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatNaira(sub.amountPaid)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {sub.facility?.name || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.currentPeriodEnd)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sub.status === 'TRIALING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => handleVerify(sub.id)}
                              disabled={actionLoading[sub.id + 'verify']}
                            >
                              {actionLoading[sub.id + 'verify'] ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="size-3" />
                              )}
                            </Button>
                          )}
                          {(sub.status === 'ACTIVE' || sub.status === 'EXPIRED') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
                              onClick={() => handleRenew(sub.id)}
                              disabled={actionLoading[sub.id + 'renew']}
                            >
                              {actionLoading[sub.id + 'renew'] ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RefreshCw className="size-3" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2 border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10"
                            onClick={() => openEditDialog(sub)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
            <span>
              Showing {filteredSubs.length} of {subStats.total} subscriptions
            </span>
            <span>
              Active: {subStats.active} · Trialing: {subStats.trialing} · Expired: {subStats.expired}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Row: Quick Actions + App-wide Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-emerald-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </div>
            <CardDescription>Common admin tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Super Admin */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                <UserPlus className="size-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">Create Super Admin User</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Creates a default SUPER_ADMIN account if none exists. Use this for initial setup.
                  The default credentials will be superadmin@nurseos.com.
                </p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs"
                  onClick={() => setCreateAdminDialogOpen(true)}
                >
                  <UserPlus className="size-3.5 mr-1.5" />
                  Create Super Admin
                </Button>
              </div>
            </div>

            {/* WhatsApp Support */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                <MessageCircle className="size-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">WhatsApp Support</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need help? Contact the NurseOS team directly on WhatsApp for urgent issues,
                  deployment support, or billing inquiries.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-green-500/30 text-green-600 hover:bg-green-500/10"
                  onClick={() => {
                    window.open('https://wa.me/2347052356638', '_blank')
                    toast.success('Opening WhatsApp...')
                  }}
                >
                  <MessageCircle className="size-3.5 mr-1.5" />
                  Chat on WhatsApp (07052356638)
                </Button>
              </div>
            </div>

            {/* Refresh Data */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md">
                <RefreshCw className="size-5 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-foreground">Refresh All Data</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manually refresh all dashboard data including subscriptions, stats, and verification
                  counts.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-teal-500/30 text-teal-600 hover:bg-teal-500/10"
                  onClick={() => {
                    fetchSubscriptions()
                    fetchAppStats()
                    toast.info('Refreshing dashboard data...')
                  }}
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Refresh Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App-wide Stats */}
        <Card className="border-emerald-500/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="size-5 text-emerald-600" />
              <CardTitle className="text-lg">App-wide Stats</CardTitle>
            </div>
            <CardDescription>Platform-wide metrics across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-emerald-500" />
                <span className="ml-3 text-muted-foreground">Loading app stats...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/10 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                    <Users className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-teal-500/10 bg-gradient-to-br from-teal-50/30 to-cyan-50/30 dark:from-teal-950/10 dark:to-cyan-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md">
                    <Stethoscope className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalNurses}</p>
                  <p className="text-xs text-muted-foreground">Total Nurses</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-cyan-500/10 bg-gradient-to-br from-cyan-50/30 to-emerald-50/30 dark:from-cyan-950/10 dark:to-emerald-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-600 shadow-md">
                    <Users className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalPatients}</p>
                  <p className="text-xs text-muted-foreground">Total Patients</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-600/10 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/10 dark:to-green-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 shadow-md">
                    <Building2 className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalFacilities}</p>
                  <p className="text-xs text-muted-foreground">Total Facilities</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-teal-600/10 bg-gradient-to-br from-teal-50/30 to-green-50/30 dark:from-teal-950/10 dark:to-green-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-green-600 shadow-md">
                    <BookOpen className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-cyan-600/10 bg-gradient-to-br from-cyan-50/30 to-teal-50/30 dark:from-cyan-950/10 dark:to-teal-950/10">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 shadow-md">
                    <FileText className="size-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{appStats.totalMedicalRecords}</p>
                  <p className="text-xs text-muted-foreground">Medical Records</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Plan Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-emerald-600" />
              Edit Subscription Plan
            </DialogTitle>
            <DialogDescription>
              {editingSub
                ? `Update plan for ${editingSub.user.firstName} ${editingSub.user.lastName}`
                : 'Update subscription details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger id="edit-plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount Paid (₦)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="e.g. 50000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Admin Notes</Label>
              <Input
                id="edit-notes"
                placeholder="Add a note about this change..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingSub(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={handleEditPlan}
              disabled={actionLoading[editingSub?.id + 'update']}
            >
              {actionLoading[editingSub?.id + 'update'] ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="size-4 mr-1" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Super Admin Dialog ── */}
      <Dialog open={createAdminDialogOpen} onOpenChange={setCreateAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="size-4 text-emerald-600" />
              Create Super Admin User
            </DialogTitle>
            <DialogDescription>
              This will create a new SUPER_ADMIN account with full platform access. Only use this
              during initial setup or if no SUPER_ADMIN exists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold">Important Note</p>
                  <p className="mt-1">
                    This creates a SUPER_ADMIN with default credentials. Please change the password
                    immediately after first login. The default email is{' '}
                    <span className="font-mono font-semibold">superadmin@nurseos.com</span>.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value="Super" disabled className="h-9 bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value="Admin" disabled className="h-9 bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value="superadmin@nurseos.com" disabled className="h-9 bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value="SUPER_ADMIN" disabled className="h-9 bg-muted" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              onClick={handleCreateSuperAdmin}
              disabled={isCreatingAdmin}
            >
              {isCreatingAdmin ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="size-4 mr-1" />
              )}
              Create Super Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
