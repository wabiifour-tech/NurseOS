"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Brain,
  Users,
  FileText,
  PenTool,
  Activity,
  Pill,
  Calendar,
  Globe,
  Building2,
  ArrowRightLeft,
  Video,
  BookOpen,
  Search,
  BarChart3,
  PieChart,
  UserCheck,
  Shield,
  FileBarChart,
  Award,
  User,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Target,
  BookMarked,
  FlaskConical,
  Library,
  Settings,
  HelpCircle,
  LogOut,
  Heart,
  ChevronDown,
  Crown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/auth-store"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface NavSection {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "NurseAI",
    icon: Brain,
    items: [
      { title: "Patients", href: "/nurseai/patients", icon: Users },
      { title: "Medical Records", href: "/nurseai/records", icon: FileText },
      { title: "Smart Charting", href: "/nurseai/charting", icon: PenTool },
      { title: "Vitals Dashboard", href: "/nurseai/vitals", icon: Activity },
      { title: "Medications", href: "/nurseai/medications", icon: Pill },
      { title: "Appointments", href: "/nurseai/appointments", icon: Calendar },
    ],
  },
  {
    title: "CareGrid",
    icon: Globe,
    items: [
      { title: "Facilities", href: "/caregrid/facilities", icon: Building2 },
      { title: "Referrals", href: "/caregrid/referrals", icon: ArrowRightLeft },
      { title: "Consultations", href: "/caregrid/consultations", icon: Video },
      { title: "Knowledge Bank", href: "/caregrid/knowledge", icon: BookOpen },
      { title: "Nurse Directory", href: "/caregrid/directory", icon: Search },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Dashboard", href: "/analytics", icon: PieChart },
      { title: "Patient Analytics", href: "/analytics/patients", icon: Users },
      { title: "Staffing", href: "/analytics/staffing", icon: UserCheck },
      { title: "Surveillance", href: "/analytics/surveillance", icon: Shield },
      { title: "Reports", href: "/analytics/reports", icon: FileBarChart },
    ],
  },
  {
    title: "NurseID",
    icon: Award,
    items: [
      { title: "My Profile", href: "/nurseid/profile", icon: User },
      { title: "Credentials", href: "/nurseid/credentials", icon: BadgeCheck },
      { title: "Portfolio", href: "/nurseid/portfolio", icon: Briefcase },
      { title: "CPD Tracker", href: "/nurseid/cpd", icon: GraduationCap },
      { title: "Competencies", href: "/nurseid/competencies", icon: Target },
    ],
  },
  {
    title: "Academy",
    icon: BookMarked,
    items: [
      { title: "Courses", href: "/academy/courses", icon: BookOpen },
      { title: "Simulations", href: "/academy/simulations", icon: FlaskConical },
      { title: "My Learning", href: "/academy/my-learning", icon: Library },
      { title: "Certificates", href: "/academy/certificates", icon: Award },
    ],
  },
]

function NavSectionGroup({ section, pathname }: { section: NavSection; pathname: string }) {
  const isActive = section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel asChild>
            <button className="flex w-full items-center gap-2 hover:text-sidebar-accent-foreground transition-colors">
              <section.icon className="size-3.5 text-emerald-400" />
              <span>{section.title}</span>
              <ChevronDown className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/collapsible:[rotate:-180deg]" />
            </button>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const isItemActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive}
                      tooltip={item.title}
                      className={
                        isItemActive
                          ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const firstName = user?.firstName || "Nurse"
  const lastName = user?.lastName || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  const handleSignOut = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <Sidebar
      className="border-r-0 bg-slate-900 text-slate-100"
      style={
        {
          "--sidebar": "#0f172a",
          "--sidebar-foreground": "#f1f5f9",
          "--sidebar-accent": "#1e293b",
          "--sidebar-accent-foreground": "#f1f5f9",
          "--sidebar-border": "#334155",
          "--sidebar-primary": "#10b981",
          "--sidebar-primary-foreground": "#f1f5f9",
          "--sidebar-ring": "#10b981",
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Header / Logo */}
      <SidebarHeader className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="NurseOS"
              className="h-12 mb-1"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                  <Heart className="size-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white leading-tight">NurseOS</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Operating System for Care</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Dashboard Home link */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Dashboard"
              className={
                pathname === "/dashboard"
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }
            >
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span>Dashboard Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="bg-slate-700/50" />
      </SidebarHeader>

      {/* Navigation Sections */}
      <SidebarContent className="px-1 custom-scrollbar">
        {user?.role === 'SUPER_ADMIN' && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <span className="flex items-center gap-2">
                <Crown className="size-3.5 text-emerald-400" />
                Super Admin
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin'}
                    tooltip="Admin Dashboard"
                    className={
                      pathname === '/admin'
                        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    }
                  >
                    <Link href="/admin">
                      <Crown className="size-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {navSections.map((section) => (
          <NavSectionGroup key={section.title} section={section} pathname={pathname} />
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-4">
        <SidebarSeparator className="bg-slate-700/50 mb-2" />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Subscription"
              className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <Link href="/subscription">
                <Crown className="size-4" />
                <span>Subscription</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Help & Support"
              className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              <Link href="/help">
                <HelpCircle className="size-4" />
                <span>Help & Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Profile Mini */}
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-800/50 p-2.5 border border-slate-700/50">
          <Avatar className="size-8 border border-emerald-500/30">
            <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              {initials || "NU"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{firstName} {lastName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.role || "Nurse"} — NurseOS</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail className="bg-slate-700/30" />
    </Sidebar>
  )
}
