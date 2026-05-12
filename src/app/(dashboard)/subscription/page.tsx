'use client'

import * as React from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Crown,
  Check,
  Zap,
  Building2,
  Rocket,
  CreditCard,
  Loader2,
  ArrowRight,
  MessageCircle,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PLAN_LIMITS, PLAN_COLORS, type PlanType } from '@/lib/plan-limits'

interface SubscriptionData {
  subscription: {
    id: string
    plan: string
    status: string
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    facilityId: string | null
    facilityName: string | null
  } | null
  planLimits: typeof PLAN_LIMITS.FREE
  usage: {
    patients: number
    nurses: number
    aiQueriesToday: number
    patientLimit: number
    aiQueryLimit: number
    nurseLimit: number
  }
  isPatientLimitReached: boolean
  isNurseLimitReached: boolean
}

export default function SubscriptionPage() {
  const { user, token } = useAuthStore()
  const [data, setData] = React.useState<SubscriptionData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<PlanType | ''>('')
  const [paymentMethod, setPaymentMethod] = React.useState('')
  const [paymentReference, setPaymentReference] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const fetchSubscription = React.useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/subscriptions', { headers })
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch {
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }, [token, user?.id])

  React.useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan')
      return
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setSubmitting(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          plan: selectedPlan,
          facilityId: user?.facilityId || null,
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
        fetchSubscription()
      } else {
        toast.error(result.error || 'Failed to submit upgrade request')
      }
    } catch {
      toast.error('Failed to submit upgrade request')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPlan = (data?.subscription?.plan || 'FREE') as PlanType
  const currentLimits = PLAN_LIMITS[currentPlan]
  const currentColor = PLAN_COLORS[currentPlan]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading subscription...</span>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="size-6 text-emerald-600" />
            Subscription & Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your plan, view usage, and upgrade
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
          <MessageCircle className="size-4 mr-2" /> Contact Sales
        </Button>
      </div>

      {/* Current Plan Card */}
      <Card className="border-emerald-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription and usage</CardDescription>
            </div>
            <Badge className={currentColor}>
              {currentLimits.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-600">{currentLimits.price}</span>
            <span className="text-muted-foreground">{currentLimits.period}</span>
          </div>

          {data?.subscription?.status && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={data.subscription.status === 'ACTIVE' ? 'default' : data.subscription.status === 'TRIALING' ? 'secondary' : 'outline'}>
                {data.subscription.status}
              </Badge>
              {data.subscription.currentPeriodEnd && (
                <span className="text-xs text-muted-foreground">
                  {data.subscription.status === 'ACTIVE'
                    ? `Renews ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : data.subscription.status === 'TRIALING'
                    ? `Trial ends ${new Date(data.subscription.trialEndsAt || data.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : ''}
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Usage Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">Patients</p>
              <p className="text-lg font-bold">
                {data?.usage.patients || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  / {data?.usage.patientLimit === -1 ? '∞' : data?.usage.patientLimit}
                </span>
              </p>
              {data?.isPatientLimitReached && (
                <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 bg-red-50 mt-1">Limit Reached</Badge>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">Nurse Accounts</p>
              <p className="text-lg font-bold">
                {data?.usage.nurses || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  / {data?.usage.nurseLimit === -1 ? '∞' : data?.usage.nurseLimit}
                </span>
              </p>
              {data?.isNurseLimitReached && (
                <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 bg-red-50 mt-1">Limit Reached</Badge>
              )}
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-muted-foreground">AI Queries/Day</p>
              <p className="text-lg font-bold">
                {data?.usage.aiQueriesToday || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  / {data?.usage.aiQueryLimit === -1 ? '∞' : data?.usage.aiQueryLimit}
                </span>
              </p>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Included Features:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(currentLimits).map(([key, value]) => {
                if (['name', 'price', 'period'].includes(key)) return null
                const featureLabels: Record<string, string> = {
                  patientLimit: 'Patient Profiles',
                  aiQueriesPerDay: 'AI Queries',
                  nurseAccounts: 'Nurse Accounts',
                  nurseIdVerification: 'NurseID Verification',
                  predictiveAnalytics: 'Predictive Analytics',
                  customIntegrations: 'Custom Integrations',
                  prioritySupport: 'Priority Support',
                  dataExport: 'Data Export',
                  premiumCourses: 'Premium Courses',
                  customReporting: 'Custom Reporting',
                  multiDepartment: 'Multi-Department',
                  dedicatedAccountManager: 'Dedicated Manager',
                  whiteLabel: 'White-Label',
                  onPremise: 'On-Premise Deploy',
                  customAiTraining: 'Custom AI Training',
                }
                const label = featureLabels[key] || key
                const isIncluded = typeof value === 'boolean' ? value : (typeof value === 'number' ? value !== 0 : true)
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    {isIncluded ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <span className="size-3 text-center text-muted-foreground">—</span>
                    )}
                    <span className={isIncluded ? 'text-foreground' : 'text-muted-foreground line-through'}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {currentPlan === 'FREE' ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
              setSelectedPlan('STARTER')
              setUpgradeDialogOpen(true)
            }}>
              <Zap className="size-4 mr-2" /> Upgrade Plan
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(true)}>
                Change Plan
              </Button>
              <Button variant="outline" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
                <MessageCircle className="size-4 mr-2" /> Billing Support
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['STARTER', 'PRO', 'ENTERPRISE'] as PlanType[]).map((planKey) => {
            const plan = PLAN_LIMITS[planKey]
            const isCurrent = currentPlan === planKey
            return (
              <Card key={planKey} className={`relative ${isCurrent ? 'ring-2 ring-emerald-500' : ''}`}>
                {planKey === 'PRO' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription>{planKey === 'STARTER' ? 'For small clinics' : planKey === 'PRO' ? 'For hospitals' : 'For health systems'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 text-emerald-500" />
                      {plan.patientLimit === -1 ? 'Unlimited patients' : `Up to ${plan.patientLimit} patients`}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 text-emerald-500" />
                      {plan.nurseAccounts === -1 ? 'Unlimited nurses' : `Up to ${plan.nurseAccounts} nurses`}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 text-emerald-500" />
                      {plan.aiQueriesPerDay === -1 ? 'Unlimited AI queries' : `${plan.aiQueriesPerDay} AI queries/day`}
                    </div>
                    {plan.nurseIdVerification && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="size-3.5 text-emerald-500" />
                        NurseID Verification
                      </div>
                    )}
                    {plan.predictiveAnalytics && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="size-3.5 text-emerald-500" />
                        Predictive Analytics
                      </div>
                    )}
                    {plan.customIntegrations && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="size-3.5 text-emerald-500" />
                        Custom Integrations
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                  ) : (
                    <Button
                      className={`w-full ${planKey === 'PRO' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      variant={planKey === 'PRO' ? 'default' : 'outline'}
                      onClick={() => {
                        if (planKey === 'ENTERPRISE') {
                          window.open('https://wa.me/2347052356638', '_blank')
                        } else {
                          setSelectedPlan(planKey)
                          setUpgradeDialogOpen(true)
                        }
                      }}
                    >
                      {planKey === 'ENTERPRISE' ? 'Contact Sales' : 'Select Plan'}
                      {planKey !== 'ENTERPRISE' && <ArrowRight className="size-4 ml-2" />}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Payment Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-emerald-600" />
            Payment Information
          </CardTitle>
          <CardDescription>How to pay for your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <h4 className="font-medium flex items-center gap-2"><Building2 className="size-4 text-emerald-600" /> Bank Transfer</h4>
              <p className="text-sm text-muted-foreground">Transfer to our corporate account and send your receipt via WhatsApp for verification.</p>
              <Button variant="outline" size="sm" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
                <MessageCircle className="size-3.5 mr-1.5" /> Send Receipt
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <h4 className="font-medium flex items-center gap-2"><Shield className="size-4 text-emerald-600" /> Online Payment</h4>
              <p className="text-sm text-muted-foreground">Pay securely online with your card or bank. Payment is verified automatically.</p>
              <Button variant="outline" size="sm" onClick={() => toast.info('Online payment integration (Paystack/Flutterwave) is coming soon!')}>
                <CreditCard className="size-3.5 mr-1.5" /> Pay Online
              </Button>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> All paid plans include a 14-day free trial. No payment required upfront. After payment verification, your subscription will be activated immediately.
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan ? PLAN_LIMITS[selectedPlan].name : ''}</DialogTitle>
            <DialogDescription>
              Complete your upgrade request. Your 14-day free trial starts immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {selectedPlan ? PLAN_LIMITS[selectedPlan].name : ''} — {selectedPlan ? PLAN_LIMITS[selectedPlan].price : ''}{selectedPlan ? PLAN_LIMITS[selectedPlan].period : ''}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">14-day free trial included</p>
            </div>
            <div className="grid gap-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Facility Starter — ₦50K/mo</SelectItem>
                  <SelectItem value="PRO">Pro — ₦150K/mo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="How will you pay?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="PAYSTACK">Paystack (Online)</SelectItem>
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpgrade} disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Submit Upgrade Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
