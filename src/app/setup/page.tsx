'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Server,
  Table,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

type SetupStatus = 'loading' | 'needs_setup' | 'ready' | 'database_not_configured' | 'setup_complete' | 'partial_setup' | 'error'

interface StatusResponse {
  status: string
  database?: string
  tablesExist?: boolean
  message?: string
  tablesCreated?: number
  superAdminSeeded?: boolean
  errors?: string[]
  error?: string
  details?: string
}

export default function SetupPage() {
  const [status, setStatus] = React.useState<SetupStatus>('loading')
  const [statusData, setStatusData] = React.useState<StatusResponse | null>(null)
  const [setupResult, setSetupResult] = React.useState<StatusResponse | null>(null)
  const [isRunning, setIsRunning] = React.useState(false)

  // Fetch the current setup status on mount
  const fetchStatus = React.useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/setup', { method: 'GET' })
      const data: StatusResponse = await res.json()
      setStatusData(data)
      if (data.status === 'ready') {
        setStatus('ready')
      } else if (data.status === 'database_not_configured') {
        setStatus('database_not_configured')
      } else if (data.status === 'needs_setup') {
        setStatus('needs_setup')
      } else {
        setStatus('needs_setup')
      }
    } catch (err: any) {
      setStatus('error')
      setStatusData({ status: 'error', message: err?.message || 'Failed to check setup status' })
    }
  }, [])

  React.useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Run the setup — POST /api/setup
  async function runSetup() {
    setIsRunning(true)
    setSetupResult(null)
    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const data: StatusResponse = await res.json()
      setSetupResult(data)

      if (res.ok && (data.status === 'setup_complete' || data.status === 'partial_setup')) {
        if (data.status === 'setup_complete') {
          setStatus('setup_complete')
          toast.success(`Setup complete! ${data.tablesCreated || 0} tables created.`, {
            description: data.superAdminSeeded
              ? 'Super Admin account was also seeded.'
              : 'You can now register and log in.',
            duration: 8000,
          })
        } else {
          setStatus('partial_setup')
          toast.warning('Setup completed with some errors', {
            description: 'Check the error list below. Most tables were still created.',
            duration: 10000,
          })
        }
      } else {
        setStatus('error')
        toast.error(data.error || 'Setup failed', {
          description: data.details || data.message,
          duration: 10000,
        })
      }
    } catch (err: any) {
      setStatus('error')
      setSetupResult({ status: 'error', error: err?.message || 'Network error during setup' })
      toast.error('Network error during setup', { description: err?.message })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-emerald-950/10 dark:to-teal-950/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo + Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/nurseos-logo.png"
            alt="NurseOS"
            width={56}
            height={56}
            className="size-14 rounded-xl shadow-lg shadow-emerald-500/20"
            priority
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            NurseOS Database Setup
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            One-time setup to create all database tables. Safe to run multiple times —
            it only creates tables that don&apos;t already exist.
          </p>
        </div>

        {/* Status card */}
        <Card className="shadow-xl border-emerald-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-5 text-emerald-600" />
                  Database Status
                </CardTitle>
                <CardDescription>
                  Current state of your NurseOS database
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStatus}
                disabled={status === 'loading'}
                title="Refresh status"
              >
                <RefreshCw className={`size-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Loading state */}
            {status === 'loading' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-emerald-500 mr-2" />
                <span className="text-sm text-muted-foreground">Checking database status...</span>
              </div>
            )}

            {/* Needs setup */}
            {status === 'needs_setup' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">Setup Required</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {statusData?.message || 'Database is connected but tables do not exist yet. Click the button below to create them.'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Database:</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Table className="size-4 text-amber-600" />
                    <span className="text-muted-foreground">Tables:</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10">
                      Not Created
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Ready */}
            {status === 'ready' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-900 dark:text-emerald-200">Database Ready</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {statusData?.message || 'All tables exist. You can register and log in.'}
                  </p>
                </div>
              </div>
            )}

            {/* Setup complete */}
            {status === 'setup_complete' && setupResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-900 dark:text-emerald-200">Setup Complete!</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      {setupResult.message}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Table className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Tables created:</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                      {setupResult.tablesCreated || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Super Admin:</span>
                    <Badge variant="outline" className={setupResult.superAdminSeeded ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground'}>
                      {setupResult.superAdminSeeded ? 'Seeded' : 'Not Seeded'}
                    </Badge>
                  </div>
                </div>
                {setupResult.superAdminSeeded && (
                  <p className="text-xs text-muted-foreground">
                    💡 Super Admin was seeded using your <code className="bg-muted px-1 py-0.5 rounded text-[10px]">SUPER_ADMIN_EMAIL</code> and <code className="bg-muted px-1 py-0.5 rounded text-[10px]">SUPER_ADMIN_PASSWORD</code> environment variables.
                  </p>
                )}
              </div>
            )}

            {/* Partial setup (some errors) */}
            {status === 'partial_setup' && setupResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-200">Setup Completed with Errors</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {setupResult.message}
                    </p>
                  </div>
                </div>
                {setupResult.errors && setupResult.errors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Errors ({setupResult.errors.length}):</p>
                    <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-1">
                      {setupResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400 font-mono">
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Database not configured */}
            {status === 'database_not_configured' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">Database Not Configured</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {statusData?.message || 'DATABASE_URL is not set. Go to Vercel → Settings → Environment Variables and add a PostgreSQL database.'}
                  </p>
                </div>
              </div>
            )}

            {/* Generic error */}
            {status === 'error' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {statusData?.message || statusData?.error || 'An unknown error occurred.'}
                  </p>
                  {statusData?.details && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">
                      {statusData.details}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Progress while running */}
            {isRunning && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-emerald-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-foreground">Creating database tables...</p>
                  <p className="text-xs text-muted-foreground">This may take 10-30 seconds. Please don&apos;t close this page.</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Show the Create Tables button when setup is needed or after a partial setup */}
              {(status === 'needs_setup' || status === 'partial_setup' || status === 'error') && (
                <Button
                  onClick={runSetup}
                  disabled={isRunning}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating Tables...
                    </>
                  ) : (
                    <>
                      <Database className="size-4 mr-2" />
                      Create Database Tables
                    </>
                  )}
                </Button>
              )}

              {/* Show the "Run Again" button after a successful setup (for re-running migrations) */}
              {status === 'setup_complete' && (
                <Button
                  onClick={runSetup}
                  disabled={isRunning}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4 mr-2" />
                      Run Again (Apply Migrations)
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Show "Go to Login" / "Go to Dashboard" buttons when ready or setup complete */}
            {(status === 'ready' || status === 'setup_complete') && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Go to Login
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Go to Dashboard
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Info card — what setup does */}
        <Card className="mt-6 border-emerald-500/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              What does setup do?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              ✅ Creates all 35+ database tables (User, Facility, NurseProfile, CourseMaterial,
              MaterialComment, MaterialDownload, MaterialView, SharedMaterial, etc.)
            </p>
            <p>
              ✅ Adds new columns to existing tables (matricNumber, publishAt, viewCount,
              targetScope, targetLevel, freeTrialEndsAt)
            </p>
            <p>
              ✅ Creates all indexes for fast queries
            </p>
            <p>
              ✅ Seeds a Super Admin account if <code className="bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_EMAIL</code> and{' '}
              <code className="bg-muted px-1 py-0.5 rounded">SUPER_ADMIN_PASSWORD</code> env vars are set
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium pt-1">
              🔒 Safe to run multiple times — uses <code className="bg-muted px-1 py-0.5 rounded">CREATE TABLE IF NOT EXISTS</code> and{' '}
              <code className="bg-muted px-1 py-0.5 rounded">ALTER TABLE ADD COLUMN IF NOT EXISTS</code>.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} NurseOS — Built by a Nurse. For the World.
        </p>
      </div>
    </div>
  )
}
