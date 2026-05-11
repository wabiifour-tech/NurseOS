"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
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
} from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallBanner } from "@/components/pwa-install-banner"

function OnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 text-[11px] px-2.5 py-0.5 font-medium ${
        isOnline
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : "border-red-500/30 bg-red-500/10 text-red-600"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="size-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="size-3" />
          Offline
        </>
      )}
    </Badge>
  )
}

function DashboardHeader() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const firstName = user?.firstName || "Nurse"
  const lastName = user?.lastName || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const facilityName = user?.facilityName
  const hasFacility = !!user?.facilityId

  const handleSignOut = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1 size-8" />
      <Separator orientation="vertical" className="mr-2 h-5" />

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search patients, records, facilities..."
          className="pl-9 h-8 w-full bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-emerald-500/30 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Facility Badge */}
        {hasFacility ? (
          <Badge
            variant="outline"
            className="gap-1.5 text-[11px] px-2.5 py-0.5 font-medium border-teal-500/30 bg-teal-500/10 text-teal-600 max-w-[200px] truncate"
            title={facilityName || 'Unknown Facility'}
          >
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{facilityName || 'Facility'}</span>
          </Badge>
        ) : (
          <Link href="/settings">
            <Badge
              variant="outline"
              className="gap-1.5 text-[11px] px-2.5 py-0.5 font-medium border-amber-500/30 bg-amber-500/10 text-amber-600 cursor-pointer hover:bg-amber-500/20 transition-colors"
            >
              <AlertTriangle className="size-3 shrink-0" />
              <span>No Facility</span>
            </Badge>
          </Link>
        )}
        <OnlineStatus />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8">
              <Bell className="size-4 text-muted-foreground" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm text-muted-foreground">
                No notifications yet. Start using NurseOS to see updates here.
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-8">
              <Avatar className="size-7 border border-emerald-500/30">
                <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-[10px] font-semibold">
                  {initials || "NU"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{firstName}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{firstName} {lastName}</p>
                <p className="text-xs text-muted-foreground leading-none">
                  {user?.role || "Nurse"} — NurseOS
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/nurseid/profile">
                <User className="mr-2 size-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [hydrated, setHydrated] = React.useState(false)

  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  React.useEffect(() => {
    // Wait for Zustand persist to hydrate from localStorage
    // useAuthStore.persist.hasHydrated() returns true once rehydration is complete
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true)
      } else {
        // Poll until hydration completes (Zustand persist hydrates async)
        setTimeout(checkHydration, 50)
      }
    }
    checkHydration()
  }, [])

  React.useEffect(() => {
    // Only redirect after Zustand has fully hydrated from localStorage
    if (hydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [hydrated, isAuthenticated, router])

  // Don't render anything until hydration is complete
  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Loading NurseOS...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <PWAInstallBanner />
    </ThemeProvider>
  )
}
