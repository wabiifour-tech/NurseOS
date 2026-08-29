"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  Search,
  Wifi,
  WifiOff,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ChevronDown,
  Loader2,
  Building2,
  AlertTriangle,
  MessageCircle,
  ArrowRightLeft,
  CheckCheck,
  Trash2,
  Clock,
  AlertCircle,
  Video,
  Crown,
} from "lucide-react"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth-store"
import { useNotifications } from "@/hooks/use-notifications"
import Link from "next/link"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PWAInstallBanner } from "@/components/pwa-install-banner"
import { CallProvider } from "@/components/call-provider"
import { ScreenRecorder } from "@/components/screen-recorder"

// Icon map for notification types
const notificationTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CONSULTATION: Video,
  MESSAGE: MessageCircle,
  REFERRAL: ArrowRightLeft,
  USER_APPROVAL: User,
  ACCOUNT_APPROVED: CheckCheck,
  SUPPORT: AlertCircle,
  ALERT: AlertCircle,
  SYSTEM: AlertCircle,
  DM: MessageCircle,
  ANNOUNCEMENT: Bell,
  OUTBREAK: AlertTriangle,
  SHIFT: Clock,
  APPOINTMENT: Clock,
  COURSE: Clock,
}

const notificationTypeColors: Record<string, string> = {
  CONSULTATION: "text-blue-600 bg-blue-50",
  MESSAGE: "text-emerald-600 bg-emerald-50",
  REFERRAL: "text-purple-600 bg-purple-50",
  USER_APPROVAL: "text-amber-600 bg-amber-50",
  ACCOUNT_APPROVED: "text-emerald-600 bg-emerald-50",
  SUPPORT: "text-slate-600 bg-slate-50",
  ALERT: "text-red-600 bg-red-50",
  SYSTEM: "text-slate-600 bg-slate-50",
  DM: "text-emerald-600 bg-emerald-50",
  ANNOUNCEMENT: "text-blue-600 bg-blue-50",
  OUTBREAK: "text-red-600 bg-red-50",
  SHIFT: "text-amber-600 bg-amber-50",
  APPOINTMENT: "text-amber-600 bg-amber-50",
  COURSE: "text-purple-600 bg-purple-50",
}

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function OnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(false) // Start false to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!mounted) return null

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] px-1.5 py-0 font-medium h-5 ${
        isOnline
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
          : "border-red-500/20 bg-red-500/5 text-red-600"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="size-2.5" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="size-2.5" />
          Offline
        </>
      )}
    </Badge>
  )
}

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications(30000) // Poll every 30s

  const [open, setOpen] = React.useState(false)

  // Fetch notifications when dropdown opens
  React.useEffect(() => {
    if (open) {
      fetchNotifications(15)
    }
  }, [open, fetchNotifications])

  const handleClickNotification = async (notificationId: string, isRead: boolean, data: string | null, type: string) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
    // Navigate based on notification data
    try {
      const parsed = data ? JSON.parse(data) : null
      if (parsed?.consultationId) {
        window.location.href = `/caregrid/consultations`
      } else if (parsed?.referralId) {
        window.location.href = `/caregrid/referrals`
      } else if (parsed?.announcementId) {
        window.location.href = `/announcements`
      } else if (parsed?.threadKey || type === 'DM') {
        window.location.href = `/messages`
      }
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-7 hover:bg-muted/80">
          <Bell className="size-3.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none min-w-[14px] px-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-emerald-600 hover:text-emerald-700"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[360px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 text-emerald-500 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Consultations, referrals, and messages will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map(notification => {
                const TypeIcon = notificationTypeIcons[notification.type] || AlertCircle
                const typeColor = notificationTypeColors[notification.type] || "text-slate-600 bg-slate-50"

                return (
                  <div
                    key={notification.id}
                    className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? "bg-emerald-50/50 hover:bg-emerald-50/70" : ""
                    }`}
                    onClick={() => handleClickNotification(notification.id, notification.isRead, notification.data, notification.type)}
                  >
                    {/* Type Icon */}
                    <div className={`shrink-0 p-1.5 rounded-full ${typeColor}`}>
                      <TypeIcon className="size-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs leading-snug ${!notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="shrink-0 size-2 rounded-full bg-emerald-500 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                          onClick={async (e) => {
                            e.stopPropagation()
                            await dismissNotification(notification.id)
                          }}
                        >
                          <Trash2 className="size-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Link
              href="/settings"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1"
              onClick={() => setOpen(false)}
            >
              <Settings className="size-3" />
              Notification Settings
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DashboardHeader() {
  const { user, logout } = useAuthStore()
  const firstName = user?.firstName || "Nurse"
  const lastName = user?.lastName || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const facilityName = user?.facilityName
  const hasFacility = !!user?.facilityId
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin)

  const handleSignOut = async () => {
    await logout()
    // Use window.location.href for a full page reload to ensure
    // the HttpOnly cookie is cleared server-side and middleware works correctly
    window.location.href = "/login"
  }

  return (
    <header className="app-drag-region flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur-xl px-3">
      <div className="app-drag-region-no-drag">
        <SidebarTrigger className="-ml-1 size-7 hover:bg-muted/80" />
      </div>
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Search — app command palette style */}
      <div className="relative flex-1 max-w-sm app-drag-region-no-drag">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
        <Input
          type="search"
          placeholder="Search..."
          data-search-input
          role="searchbox"
          className="pl-8 h-7 w-full bg-muted/40 border-0 focus-visible:bg-muted/60 focus-visible:ring-1 focus-visible:ring-emerald-500/20 text-xs rounded-md"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground/60">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5 app-drag-region-no-drag">
        {/* Facility Badge — compact app style */}
        {hasFacility ? (
          <Badge
            variant="outline"
            className="gap-1 text-[10px] px-2 py-0 font-medium border-teal-500/20 bg-teal-500/5 text-teal-600 max-w-[160px] truncate h-5"
            title={facilityName || 'Unknown Facility'}
          >
            <Building2 className="size-2.5 shrink-0" />
            <span className="truncate">{facilityName || 'Facility'}</span>
          </Badge>
        ) : isSuperAdmin ? (
          <Badge
            variant="outline"
            className="gap-1 text-[10px] px-2 py-0 font-medium border-emerald-500/20 bg-emerald-500/5 text-emerald-600 h-5"
          >
            <Crown className="size-2.5 shrink-0" />
            <span>Founder</span>
          </Badge>
        ) : (
          <Link href="/settings">
            <Badge
              variant="outline"
              className="gap-1 text-[10px] px-2 py-0 font-medium border-amber-500/20 bg-amber-500/5 text-amber-600 cursor-pointer hover:bg-amber-500/10 transition-colors h-5"
            >
              <AlertTriangle className="size-2.5 shrink-0" />
              <span>No Facility</span>
            </Badge>
          </Link>
        )}
        <OnlineStatus />

        {/* Screen Recorder — only for hospital roles (not academic users) */}
        {!(user?.academicRole === 'STUDENT' || user?.academicRole === 'LECTURER' || (user?.role === 'ADMIN' && (user?.facilityType === 'UNIVERSITY' || user?.facilityType === 'SCHOOL_OF_NURSING'))) && (
          <ScreenRecorder showTrigger={true} />
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu — compact app style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 px-1.5 h-7 hover:bg-muted/80 rounded-md">
              <Avatar className="size-6 border border-emerald-500/20">
                <AvatarFallback className="bg-emerald-500/15 text-emerald-700 text-[9px] font-semibold">
                  {initials || "NU"}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-2.5 text-muted-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{firstName} {lastName}</p>
                <p className="text-xs text-muted-foreground leading-none">
                  {user?.academicRole === 'STUDENT' ? 'Nursing Student'
                    : user?.academicRole === 'LECTURER' ? 'Lecturer'
                    : user?.role === 'SUPER_ADMIN' ? 'Super Admin'
                    : user?.role === 'ADMIN' ? (user?.facilityType === 'UNIVERSITY' || user?.facilityType === 'SCHOOL_OF_NURSING' ? 'Institution Admin' : 'Facility Admin')
                    : user?.role === 'DOCTOR' ? 'Doctor'
                    : user?.role === 'MATRON' ? 'Matron'
                    : user?.role === 'OTHER' ? 'Healthcare Worker'
                    : user?.role || 'Nurse'} — NurseOS
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Academic users don't have NurseID profiles — link to Settings instead */}
            {!(user?.academicRole === 'STUDENT' || user?.academicRole === 'LECTURER' || (user?.role === 'ADMIN' && (user?.facilityType === 'UNIVERSITY' || user?.facilityType === 'SCHOOL_OF_NURSING'))) && (
              <DropdownMenuItem asChild>
                <Link href="/nurseid/profile">
                  <User className="mr-2 size-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help">
                <HelpCircle className="mr-2 size-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/**
 * Dashboard Layout with robust auth guard.
 *
 * AUTH FLOW (the fix for the "redirecting to login" bug):
 *
 * 1. Wait for Zustand persist to hydrate from localStorage
 * 2. If Zustand says authenticated → render normally
 * 3. If Zustand says NOT authenticated → call /api/auth/me (uses HttpOnly cookie)
 *    a. If /api/auth/me succeeds → re-populate Zustand from server and render
 *    b. If /api/auth/me fails → genuinely unauthenticated → redirect to /login
 *
 * This fixes the race condition where window.location.assign() after login causes
 * a full page reload, and Zustand fails to rehydrate from localStorage before the
 * dashboard layout's redirect logic fires.
 *
 * Previously, the layout would immediately redirect to /login when Zustand said
 * unauthenticated, even though the HttpOnly cookie was valid. The /api/auth/me
 * recovery mechanism gives the app a second chance to restore the session.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoggingOut } = useAuthStore()

  // [AUTH-TIMELINE] T0: Record mount time as the origin for all subsequent timestamps
  const mountTimeRef = React.useRef<number>(performance.now())

  // [AUTH-TIMELINE] Read correlation ID from sessionStorage (set by /auth/callback during OAuth).
  // Use 'missing' when absent so logs explicitly show correlation was lost
  // (e.g. new tab, page refresh, header stripped by proxy) rather than silently masking it.
  const debugId = React.useMemo(() => {
    try {
      const id = sessionStorage.getItem('nurseos-auth-debug-id')
      if (id) { sessionStorage.removeItem('nurseos-auth-debug-id'); return id }
    } catch {}
    return 'missing'
  }, [])

  // Prevent search engines from indexing any dashboard pages
  React.useEffect(() => {
    // Add noindex meta tag to prevent Google from indexing dashboard pages
    let meta = document.querySelector('meta[name="robots"][content*="noindex"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      meta.setAttribute('content', 'noindex, nofollow')
      document.head.appendChild(meta)
    }
    return () => {
      // Clean up on unmount (though dashboard layout rarely unmounts)
      meta?.remove()
    }
  }, [])
  const [hydrated, setHydrated] = React.useState(false)
  const [authChecked, setAuthChecked] = React.useState(false)
  const [defaultCollapsed, setDefaultCollapsed] = React.useState(false)

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Load sidebar collapsed preference on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsed') || localStorage.getItem('nurseos-sidebar-default-collapsed')
      if (saved === 'true') setDefaultCollapsed(true)
    } catch {}
  }, [])

  // Listen for sidebar-toggle custom event from settings page
  React.useEffect(() => {
    const handleSidebarToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ collapsed: boolean }>
      if (customEvent.detail?.collapsed !== undefined) {
        setDefaultCollapsed(customEvent.detail.collapsed)
      }
    }
    window.addEventListener('sidebar-toggle', handleSidebarToggle)
    return () => window.removeEventListener('sidebar-toggle', handleSidebarToggle)
  }, [])

  // Step 1: Wait for Zustand persist to hydrate from localStorage
  React.useEffect(() => {
    const t0 = mountTimeRef.current
    const zustandBefore = useAuthStore.getState()
    console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms HYDRATION_CHECK_START isAuthenticated=${zustandBefore.isAuthenticated} hasToken=${!!zustandBefore.token} userId=${zustandBefore.user?.id || 'null'}`)

    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        const zustandAfter = useAuthStore.getState()
        console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms HYDRATION_COMPLETE isAuthenticated=${zustandAfter.isAuthenticated} hasToken=${!!zustandAfter.token} userId=${zustandAfter.user?.id || 'null'}`)
        setHydrated(true)
      } else {
        // Poll until hydration completes (Zustand persist hydrates async)
        setTimeout(checkHydration, 50)
      }
    }
    checkHydration()
  }, [])

  // Step 2: After hydration, ALWAYS refresh auth data from server
  // This is critical because:
  //   - facilityType may have been added to the schema AFTER the user's persisted Zustand state was saved
  //   - role / academicRole / studentLevel may have changed server-side (e.g., admin approved a lecturer)
  //   - We can't trust the persisted state alone for routing decisions in the sidebar + dashboard
  React.useEffect(() => {
    if (!hydrated) return
    if (isLoggingOut) return

    let cancelled = false
    const t0 = mountTimeRef.current
    const capturedIsAuthenticated = isAuthenticated

    // [AUTH-TIMELINE] Snapshot cookies before fetch
    const cookieSnapshot = typeof document !== 'undefined' ? document.cookie : 'N/A'
    const hasNurseosCookie = cookieSnapshot.includes('nurseos-token=')
    console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms ME_FETCH_START hydrated=true isLoggingOut=${isLoggingOut} zustandIsAuth=${capturedIsAuthenticated} cookieHasNurseosToken=${hasNurseosCookie}`)

    const fetchStart = performance.now()

    // Always call /api/auth/me — even if Zustand says authenticated.
    // The server is the source of truth for the user's current role, facilityType, etc.
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Send HttpOnly cookie
      headers: { 'X-Auth-Debug-Id': debugId },
    })
      .then(res => {
        if (cancelled) return null
        const fetchDuration = Math.round(performance.now() - fetchStart)
        console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms ME_RESPONSE status=${res.status} ok=${res.ok} duration=${fetchDuration}ms`)
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then(data => {
        if (cancelled || !data) return

        console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms ME_BODY_PARSED hasUser=${!!data.user} hasToken=${!!data.token} tokenLength=${data.token ? data.token.length : 0} userId=${data.user?.id || 'null'} userType=${typeof data.user}`)

        if (data.user && data.token) {
          // Server confirms authenticated — re-populate Zustand from server data (always fresh)
          console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms AUTH_SUCCESS calling_login() userId=${data.user.id}`)
          const { login } = useAuthStore.getState()
          login({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            academicRole: data.user.academicRole || null,
            studentLevel: data.user.studentLevel ?? null,
            matricNumber: (data.user as any).matricNumber || null,
            avatarUrl: (data.user as any).avatarUrl || null,
            facilityId: data.facilityId || data.user.nurseProfile?.currentFacilityId || data.user.adminProfile?.facilityId || null,
            facilityName: data.facilityName || data.user.nurseProfile?.facility?.name || data.user.adminProfile?.facility?.name || null,
            facilityType: data.facilityType || null,
            nurseProfileId: data.nurseProfileId || data.user.nurseProfile?.id || null,
          }, data.token)
          setAuthChecked(true)
        } else {
          // [AUTH-TIMELINE] REDIRECT PATH A: Server returned data but missing user or token
          console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms REDIRECT_PATH_A server_returned_no_auth hasUser=${!!data.user} hasToken=${!!data.token} dataKeys=${Object.keys(data).join(',')}`)
          window.location.href = "/login"
        }
      })
      .catch((err) => {
        if (cancelled) return
        const fetchDuration = Math.round(performance.now() - fetchStart)
        if (!capturedIsAuthenticated) {
          // [AUTH-TIMELINE] REDIRECT PATH B: Fetch failed AND Zustand says not authenticated
          console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms REDIRECT_PATH_B fetch_error_no_zustand_auth duration=${fetchDuration}ms zustandWasAuth=${capturedIsAuthenticated} error=${err?.message || String(err)}`)
          window.location.href = "/login"
        } else {
          console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - t0)}ms FETCH_FAILED_USING_ZUSTAND duration=${fetchDuration}ms zustandWasAuth=${capturedIsAuthenticated} error=${err?.message || String(err)}`)
          setAuthChecked(true)
        }
      })

    return () => { cancelled = true }
  }, [hydrated, isLoggingOut])

  // Show logging out state
  if (hydrated && isLoggingOut) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/nurseos-logo.png"
            alt="NurseOS"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg animate-pulse"
            priority
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Signing out...</span>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything until hydration AND auth check are complete
  if (!hydrated || !authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/nurseos-logo.png"
            alt="NurseOS"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg animate-pulse"
            priority
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading NurseOS...</span>
          </div>
        </div>
      </div>
    )
  }

  // [AUTH-TIMELINE] Render-gate: if authChecked=true but isAuthenticated=false,
  // the useEffect redirect should have already fired. If we reach here, it means
  // login() was called but isAuthenticated is still false — investigate.
  if (!isAuthenticated) {
    if (hydrated && authChecked) {
      console.warn(`[AUTH-TIMELINE][req=${debugId}] T+${Math.round(performance.now() - mountTimeRef.current)}ms RENDER_GATE_REDIRECT hydrated=true authChecked=true isAuthenticated=false — no JS redirect executed`)
    }
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/nurseos-logo.png"
            alt="NurseOS"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg"
            priority
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Redirecting to login...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CallProvider>
      <div className="app-shell">
        <SidebarProvider defaultOpen={!defaultCollapsed}>
          <AppSidebar />
          <div className="app-shell-content">
            <DashboardHeader />
            <main className="app-shell-body app-page-animate">
              {children}
            </main>
          </div>
        </SidebarProvider>
        <PWAInstallBanner />
      </div>
    </CallProvider>
  )
}
