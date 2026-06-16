'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

/**
 * /subscription page — SUBSCRIPTION FEATURE REMOVED
 *
 * NurseOS is free forever. No payments, no subscriptions, no trials.
 * This page now shows a simple "Free Forever" message and redirects to the dashboard.
 */
export default function SubscriptionPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center border-emerald-500/20">
        <CardHeader>
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">NurseOS is Free Forever</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            NurseOS does not have a subscription feature. All features are available
            to all users at no cost — no payments, no trials, no billing.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Redirecting you to your dashboard...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
