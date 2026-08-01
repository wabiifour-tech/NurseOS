"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Clock, AlertCircle, CheckCircle2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { isStandaloneMode } from "@/lib/pwa-detect"

/**
 * Process an OAuth session — shared by both the useSession() path and the
 * direct-fetch fallback. Returns nothing; mutates component state directly.
 */
function processOAuthSession(sessionData: {
  email?: string | null
  name?: string | null
  image?: string | null
  id?: unknown
}, callbacks: {
  setError: (msg: string) => void
  setProcessing: (v: boolean) => void
  setPendingApproval: (v: boolean) => void
  setPwaComplete: (v: boolean) => void
  router: ReturnType<typeof useRouter>
  isPwaFlow: boolean
  debugId: string
}) {
  // Destructure callbacks for readability
  const { setError, setProcessing, setPendingApproval, setPwaComplete, router, isPwaFlow, debugId } = callbacks

  const cbT0 = performance.now()
  console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_OAUTH_LINK_START email=${sessionData.email || 'null'} name=${sessionData.name || 'null'} isPwaFlow=${isPwaFlow}`)

  fetch("/api/auth/oauth/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: sessionData.email,
      name: sessionData.name,
      image: sessionData.image,
      provider: "google",
      providerAccountId: sessionData.id,
    }),
  })
    .then((res) => {
      console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_OAUTH_LINK_RESPONSE T+${Math.round(performance.now() - cbT0)}ms status=${res.status} ok=${res.ok}`)
      return res.json()
    })
    .then((data) => {
      console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_OAUTH_LINK_PARSED T+${Math.round(performance.now() - cbT0)}ms status=${data.status || 'missing'} hasToken=${!!data.token} tokenLen=${data.token?.length || 0} hasUser=${!!data.user} userId=${data.user?.id || 'null'} error=${data.error || 'none'`)

      if (data.status === "ACTIVE" && data.token) {
        // PWA flow — show return-to-app message
        if (isPwaFlow && !isStandaloneMode()) {
          setProcessing(false)
          setPwaComplete(true)
          setTimeout(() => { try { window.close() } catch { /* ignore */ } }, 3000)
          return
        }

        // Normal flow: store session and redirect
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_WRITING_LOCALSTORAGE T+${Math.round(performance.now() - cbT0)}ms userId=${data.user.id} tokenLen=${data.token.length}`)
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
              matricNumber: (data.user as Record<string, unknown>).matricNumber || null,
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
        // [AUTH-TIMELINE] Check cookie before redirect
        const cookieAfterLink = document.cookie
        const hasNurseosCookieAfter = cookieAfterLink.includes('nurseos-token=')
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_PRE_REDIRECT T+${Math.round(performance.now() - cbT0)}ms cookieHasNurseosToken=${hasNurseosCookieAfter} redirecting_in_500ms`)
        setTimeout(() => {
          console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_REDIRECTING T+${Math.round(performance.now() - cbT0)}ms -> /dashboard`)
          window.location.href = "/dashboard"
        }, 500)
      } else if (data.status === "PENDING") {
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_STATUS_PENDING T+${Math.round(performance.now() - cbT0)}ms`)
        signOut({ redirect: false })
        setPendingApproval(true)
        setProcessing(false)
      } else if (data.status === "NEW") {
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_STATUS_NEW T+${Math.round(performance.now() - cbT0)}ms`)
        sessionStorage.setItem("nurseos-oauth", JSON.stringify({
          email: sessionData.email,
          firstName: sessionData.name?.split(" ")[0] || "",
          lastName: sessionData.name?.split(" ").slice(1).join(" ") || "",
          avatarUrl: sessionData.image || null,
          provider: "google",
        }))
        router.push("/onboarding")
      } else {
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_UNEXPECTED_STATUS T+${Math.round(performance.now() - cbT0)}ms status=${data.status} hasToken=${!!data.token} message=${data.message || data.error || 'none'}`)
        signOut({ redirect: false })
        setError(data.message || data.error || "Unexpected authentication status. Please try again.")
        setProcessing(false)
      }
    })
    .catch((err) => {
      console.error("OAuth callback error:", err)
      setError("Connection error. Please try again.")
      setProcessing(false)
    })
}

function AuthCallbackContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPwaFlow = searchParams.get("pwa") === "1"
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [pwaComplete, setPwaComplete] = useState(false)

  // Guard against double-processing (useSession + fallback could both fire)
  const hasProcessedRef = useRef(false)

  // [AUTH-TIMELINE] Generate correlation ID for this login attempt.
  // Stored in sessionStorage so the dashboard layout can pick it up after navigation.
  const [debugId] = useState(() => {
    const id = Math.random().toString(36).slice(2, 10)
    try { sessionStorage.setItem('nurseos-auth-debug-id', id) } catch {}
    return id
  })

  const handleOAuth = useCallback(() => {
    if (hasProcessedRef.current) {
      console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_DOUBLE_PROCESS_BLOCKED`)
      return
    }
    hasProcessedRef.current = true
    console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_HANDLE_OAUTH_CALLED useSessionStatus=${status} hasSessionUser=${!!session?.user} sessionEmail=${session?.user?.email || 'null'}`)

    processOAuthSession(
      { email: session?.user?.email, name: session?.user?.name, image: session?.user?.image, id: (session?.user as Record<string, unknown>)?.id },
      { setError, setProcessing, setPendingApproval, setPwaComplete, router, isPwaFlow, debugId }
    )
  }, [session, router, isPwaFlow, setError, setProcessing, setPendingApproval, setPwaComplete])

  // Handle unauthenticated status (Google sign-in failed or was cancelled)
  useEffect(() => {
    console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_SESSION_STATUS status=${status}`)
    if (status === "unauthenticated") {
      console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_GOOGLE_SIGNIN_FAILED status=unauthenticated`)
      setError("Google sign-in was cancelled or failed. Please try again.")
      setProcessing(false)
    }
  }, [status])

  // Primary path: useSession() resolves successfully
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_USESESSION_AUTHENTICATED email=${session.user.email} name=${session.user.name}`)
    handleOAuth()
  }, [status, session, handleOAuth])

  // Fallback path: if useSession() never resolves within 12 seconds,
  // fetch /api/auth/session directly to break out of infinite loading.
  // Root cause: missing NEXTAUTH_SECRET causes per-instance random secret
  // in serverless, leading to JWT decrypt failure and infinite retry.
  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => {
        if (hasProcessedRef.current) return
        console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_USESESSION_TIMEOUT_12s falling back to direct fetch`)
        fetch("/api/auth/session")
          .then((r) => {
            if (!r.ok) throw new Error(`Session fetch returned ${r.status}`)
            return r.json()
          })
          .then((sessionData) => {
            console.warn(`[AUTH-TIMELINE][req=${debugId}] CALLBACK_FALLBACK_SESSION_FETCHED hasUser=${!!sessionData?.user} email=${sessionData?.user?.email || 'null'}`)
            if (sessionData?.user) {
              handleOAuth()
            } else {
              setError("Session could not be established. Please try signing in again.")
              setProcessing(false)
            }
          })
          .catch(() => {
            setError("Authentication timed out. Please check your connection and try again.")
            setProcessing(false)
          })
      }, 12_000)
      return () => clearTimeout(timer)
    }
  }, [status, handleOAuth])

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

function AuthCallbackFallback() {
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
