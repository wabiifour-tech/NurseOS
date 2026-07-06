"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Clock, AlertCircle, CheckCircle2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { isStandaloneMode } from "@/lib/pwa-detect"

export default function AuthCallbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPwaFlow = searchParams.get("pwa") === "1"
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [pwaComplete, setPwaComplete] = useState(false)

  // Handle unauthenticated status (Google sign-in failed or was cancelled)
  useEffect(() => {
    if (status === "unauthenticated") {
      setError("Google sign-in was cancelled or failed. Please try again.")
      setProcessing(false)
    }
  }, [status])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return

    async function processOAuth() {
      try {
        // Check if this Google user already has a NurseOS account
        const res = await fetch("/api/auth/oauth/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            provider: "google",
            providerAccountId: (session.user as Record<string, unknown>).id,
          }),
        })

        const data = await res.json()

        if (res.ok) {
          if (data.status === "ACTIVE" && data.token) {
            // User exists and is active — log them in

            // If this was initiated from the PWA (running in system browser now),
            // the nurseos-token cookie is already set by the oauth/link response.
            // The PWA is polling /api/auth/pwa-check and will detect the cookie.
            // Show a "return to app" message instead of redirecting to dashboard.
            if (isPwaFlow && !isStandaloneMode()) {
              setProcessing(false)
              setPwaComplete(true)
              // Try to close the popup/tab (works if opened via window.open)
              setTimeout(() => {
                try { window.close() } catch { /* ignore */ }
              }, 3000)
              return
            }

            // Normal (non-PWA) flow: redirect to dashboard
            // Store the session token in our custom auth system (matching auth-store shape)
            localStorage.setItem("nurseos-auth", JSON.stringify({
              state: {
                user: {
                  id: data.user.id,
                  email: data.user.email,
                  firstName: data.user.firstName,
                  lastName: data.user.lastName,
                  role: data.user.role,
                  academicRole: data.user.academicRole || null,
                  studentLevel: data.user.studentLevel ?? null,
                  matricNumber: (data.user as any).matricNumber || null,
                  avatarUrl: data.user.avatarUrl || null,
                  facilityId: data.user.facilityId || null,
                  facilityName: data.user.facilityName || null,
                  facilityType: data.user.facilityType || null,
                  nurseProfileId: data.user.nurseProfileId || null,
                },
                token: data.token,
                isAuthenticated: true,
                isSuperAdmin: data.user.role === "SUPER_ADMIN",
                isLoggingOut: false,
              },
              version: 0,
            }))
            // Set a small delay for cookie to be set
            setTimeout(() => {
              window.location.href = "/dashboard"
            }, 500)
            return
          } else if (data.status === "PENDING") {
            // User exists but waiting for admin approval
            // Sign out of next-auth to prevent redirect loop on next visit
            signOut({ redirect: false })
            setPendingApproval(true)
            setProcessing(false)
            return
          } else if (data.status === "NEW") {
            // New user — redirect to onboarding
            // Store temp OAuth data in sessionStorage for onboarding page
            sessionStorage.setItem("nurseos-oauth", JSON.stringify({
              email: session.user.email,
              firstName: session.user.name?.split(" ")[0] || "",
              lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
              avatarUrl: session.user.image || null,
              provider: "google",
            }))
            router.push("/onboarding")
            return
          } else {
            // Unexpected status — sign out and show error
            signOut({ redirect: false })
            setError(data.message || data.error || "Unexpected authentication status. Please try again.")
            setProcessing(false)
            return
          }
        }

        setError(data.error || "Failed to process authentication")
        // If the error is about database not being set up, show a more helpful message
        if (data.errorType === 'DB_NOT_CONFIGURED') {
          setError("Database tables are not set up yet. An administrator needs to visit /api/setup to create the database tables first.")
        }
        setProcessing(false)
      } catch (err) {
        console.error("OAuth callback error:", err)
        setError("Connection error. Please try again.")
        setProcessing(false)
      }
    }

    processOAuth()
  }, [status, session, router, isPwaFlow])

  if (processing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <Image src="/nurseos-logo.png" alt="NurseOS" width={40} height={40} className="w-10 h-10 rounded-lg animate-pulse" priority />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">Authenticating with Google...</span>
        </div>
      </div>
    )
  }

  // PWA flow: show "return to app" message (this page is in the system browser,
  // the PWA is polling and will auto-continue)
  if (pwaComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="rounded-full bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold">Signed in successfully</h2>
          <p className="text-muted-foreground">
            You can now return to the NurseOS app. It will automatically continue to your dashboard.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
            <Smartphone className="w-4 h-4" />
            <span>Switch back to the NurseOS app</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          try { window.close() } catch { /* ignore */ }
        }}>
          Close this tab
        </Button>
      </div>
    )
  }

  if (pendingApproval) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold">Waiting for Admin Approval</h2>
          <p className="text-muted-foreground">
            Your account is set up and linked to a facility, but the facility admin needs to approve your access before you can sign in. You&apos;ll receive an email once approved.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>
          Back to Sign In
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>
          Back to Sign In
        </Button>
      </div>
    )
  }

  return null
}