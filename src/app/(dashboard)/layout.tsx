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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"

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
        <OnlineStatus />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                5
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                5 new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm font-medium">Early Warning Alert</span>
              <span className="text-xs text-muted-foreground">
                Patient Adebayo — vitals trending critical
              </span>
              <span className="text-[10px] text-muted-foreground">2 min ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm font-medium">New Referral</span>
              <span className="text-xs text-muted-foreground">
                Dr. Okafor referred a patient from Cardiology
              </span>
              <span className="text-[10px] text-muted-foreground">15 min ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm font-medium">Medication Reminder</span>
              <span className="text-xs text-muted-foreground">
                3 patients due for medication in 30 min
              </span>
              <span className="text-[10px] text-muted-foreground">28 min ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm font-medium">Shift Update</span>
              <span className="text-xs text-muted-foreground">
                Night shift handover notes available
              </span>
              <span className="text-[10px] text-muted-foreground">1 hr ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-2.5">
              <span className="text-sm font-medium">CPD Deadline</span>
              <span className="text-xs text-muted-foreground">
                2 CPD credits due by end of month
              </span>
              <span className="text-[10px] text-muted-foreground">3 hrs ago</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-emerald-600 font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-8">
              <Avatar className="size-7 border border-emerald-500/30">
                <AvatarImage src="" alt="Nurse Adaora" />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-[10px] font-semibold">
                  AN
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">Adaora</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">Nurse Adaora Nwosu</p>
                <p className="text-xs text-muted-foreground leading-none">
                  RN, BSN — Ward 3
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 size-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
