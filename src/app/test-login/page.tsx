'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, ArrowRight, Loader2, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import Link from 'next/link'

const TEST_ACCOUNTS = [
  { label: 'Institution Admin', email: 'admin@nurseos.test', password: 'Admin123' },
  { label: 'Lecturer', email: 'lecturer@nurseos.test', password: 'Lecturer123' },
  { label: 'Student', email: 'student@nurseos.test', password: 'Student123' },
]

export default function TestLoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Login failed')
        setIsLoading(false)
        return
      }
      login({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        academicRole: result.user.academicRole || null,
        studentLevel: result.user.studentLevel ?? null,
        matricNumber: (result.user as any).matricNumber || null,
        facilityId: result.facilityId || null,
        facilityName: result.facilityName || null,
        facilityType: result.facilityType || null,
        nurseProfileId: result.nurseProfileId || null,
      }, result.token)
      toast.success('Logged in successfully')
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Unable to connect to the server')
      setIsLoading(false)
    }
  }

  function fillTestAccount(acc: typeof TEST_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
          <FlaskConical className="size-3" />
          Test Login (Dev Only)
        </div>
        <h1 className="text-2xl font-bold text-foreground">Test Account Login</h1>
        <p className="text-muted-foreground text-sm">
          Log in with test credentials to verify role-based dashboards. Real users sign in with Google.
        </p>
      </div>

      {/* Quick-fill test account buttons */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">Quick-fill test accounts:</p>
        <div className="grid grid-cols-3 gap-2">
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillTestAccount(acc)}
              className="p-2 rounded-lg border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 transition-all text-center"
            >
              <p className="text-xs font-medium">{acc.label}</p>
              <p className="text-[10px] text-muted-foreground">{acc.email}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@test.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Log In (Test)
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          To create these test accounts, run: <code className="bg-muted px-1 py-0.5 rounded">node scripts/create-test-accounts.mjs</code>
        </p>
        <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          ← Back to regular login
        </Link>
      </div>
    </div>
  )
}
