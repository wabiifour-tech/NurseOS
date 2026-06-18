"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  Beaker,
  Mail,
  Newspaper,
  MessageCircle,
  Upload,
  School,
  Share2,
} from "lucide-react"
import Image from "next/image"

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

// Role-based visibility for nav sections
// Each role sees ONLY the sections relevant to them:
//   - SUPER_ADMIN: all 5 modules (manages everything)
//   - ADMIN at hospital: all 5 modules + admin dashboard (manages facility)
//   - ADMIN at UNIVERSITY/SCHOOL_OF_NURSING: ONLY Academic section (institution admin dashboard is their main page)
//   - NURSE/MATRON/DOCTOR/OTHER at hospital: all 5 modules (healthcare workers)
//   - STUDENT: ONLY Academic section (course materials + announcements — NO patient content, NO 5 modules)
//   - LECTURER: ONLY Academic section (course materials + shared + announcements — NO patient content, NO 5 modules)
//   - PATIENT: nothing
const roleNavVisibility: Record<string, string[]> = {
  SUPER_ADMIN: ['NurseAI', 'CareGrid', 'Analytics', 'NurseID', 'Academy'],
  ADMIN: ['NurseAI', 'CareGrid', 'Analytics', 'NurseID', 'Academy'],  // hospital admin — overridden below for institution admin
  NURSE: ['NurseAI', 'CareGrid', 'Analytics', 'NurseID', 'Academy'],
  MATRON: ['NurseAI', 'CareGrid', 'Analytics', 'NurseID', 'Academy'],
  DOCTOR: ['NurseAI', 'CareGrid', 'Analytics', 'NurseID', 'Academy'],
  STUDENT: ['Academic'],               // ONLY academic — no 5 modules, no patient content
  LECTURER: ['Academic'],              // ONLY academic — no 5 modules, no patient content
  OTHER: ['NurseAI', 'CareGrid', 'NurseID'],
  PATIENT: [],
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
      { title: "Lab Orders", href: "/nurseai/lab-orders", icon: Beaker },
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
  {
    title: "Academic",
    icon: School,
    items: [
      // For lecturers: "My Materials" → upload & manage. For students: same link shows their level-filtered view.
      // Default to /lecturer/materials here; the rendering code below swaps the href based on role.
      { title: "Course Materials", href: "/lecturer/materials", icon: Upload },
      { title: "Announcements", href: "/announcements", icon: Newspaper },
      { title: "Shared Materials", href: "/lecturer/shared", icon: Share2 },
    ],
  },
]

function NavSectionGroup({
  section,
  pathname,
  academicRole,
}: {
  section: NavSection
  pathname: string
  academicRole?: string | null
}) {
  // For students in the Academic section:
  //   - "Course Materials" → /student/materials
  //   - "Announcements" → keep /announcements (students can view)
  //   - "Shared Materials" → HIDE (only lecturers share materials)
  let items = section.items
  if (section.title === 'Academic') {
    items = section.items
      .filter((item) => {
        // Hide "Shared Materials" from students — only lecturers share/receive materials
        if (academicRole === 'STUDENT' && item.href === '/lecturer/shared') return false
        return true
      })
      .map((item) => {
        if (academicRole === 'STUDENT' && item.href === '/lecturer/materials') {
          return { ...item, href: '/student/materials' }
        }
        return item
      })
  }

  const isActive = items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))

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
              {items.map((item) => {
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
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  const firstName = user?.firstName || "Nurse"
  const lastName = user?.lastName || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const userRole = user?.role || "Nurse"
  const academicRole = user?.academicRole
  const facilityType = user?.facilityType

  const handleSignOut = async () => {
    // Call the server-side logout API to clear the HttpOnly cookie
    await logout()
    // Full page reload ensures cookie state is synced with server
    window.location.href = "/login"
  }

  // Determine if this is an institution admin (ADMIN at UNIVERSITY / SCHOOL_OF_NURSING)
  const isInstitutionAdmin = userRole === 'ADMIN' && (facilityType === 'UNIVERSITY' || facilityType === 'SCHOOL_OF_NURSING')

  // Determine the admin dashboard path based on role
  const adminDashboardPath = userRole === 'SUPER_ADMIN' ? '/superadmin' : '/admin'
  const adminDashboardLabel = userRole === 'SUPER_ADMIN'
    ? 'Super Admin Dashboard'
    : isInstitutionAdmin
    ? 'Institution Admin Dashboard'
    : 'Facility Admin Dashboard'
  const showAdminSection = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'

  // Override nav visibility for institution admin — they get ONLY the Academic section (no 5 modules)
  // Hospital admins keep the 5 modules (they manage a healthcare facility)
  //
  // CRITICAL: Students and lecturers have DB role 'NURSE' (they're mapped from STUDENT/LECTURER to NURSE
  // in the database). So we MUST check academicRole FIRST, before falling back to userRole.
  // Without this check, students/lecturers would get roleNavVisibility['NURSE'] = all 5 modules.
  const effectiveNavVisibility = isInstitutionAdmin
    ? ['Academic']  // institution admin: ONLY academic section
    : academicRole === 'STUDENT'
    ? roleNavVisibility['STUDENT']  // ['Academic']
    : academicRole === 'LECTURER'
    ? roleNavVisibility['LECTURER']  // ['Academic']
    : roleNavVisibility[userRole] || roleNavVisibility['NURSE']

  // For institution roles (student, lecturer, institution admin), the "Dashboard Home" link
  // should be labeled "My Dashboard" and link to /dashboard (which renders their role-specific page).
  // For hospital admins and super admin, "Dashboard Home" is hidden — they use their admin dashboard link instead.
  // For hospital healthcare workers (nurse, doctor, matron, other), "Dashboard Home" shows the general hospital dashboard.
  const isAcademicRole = academicRole === 'STUDENT' || academicRole === 'LECTURER' || isInstitutionAdmin
  const showDashboardHome = !showAdminSection  // hospital workers + academic roles see "Dashboard Home"; admins use their admin dashboard link
  const dashboardHomeLabel = isAcademicRole ? 'My Dashboard' : 'Dashboard Home'

  return (
    <Sidebar
      className="border-r-0 bg-slate-900 text-slate-100"
      // Sidebar uses dark theme intentionally (common healthcare UI pattern)
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
                <Image
                  src="/nurseos-logo.png"
                  alt="NurseOS"
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-lg"
                  priority
                />
                <div className="flex flex-col">
                  <span className="text-base font-bold text-white leading-tight">NurseOS</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Operating System for Care</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Dashboard Home link — role-aware */}
        {/* For admin roles (SUPER_ADMIN, ADMIN): HIDDEN — they use their admin dashboard link below */}
        {/* For hospital workers (NURSE, DOCTOR, MATRON, OTHER): shows "Dashboard Home" → /dashboard (general hospital dashboard) */}
        {/* For academic roles (STUDENT, LECTURER, INSTITUTION_ADMIN): shows "My Dashboard" → /dashboard (role-specific academic dashboard) */}
        <SidebarMenu>
          {showDashboardHome && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip={dashboardHomeLabel}
                className={
                  pathname === "/dashboard"
                    ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>{dashboardHomeLabel}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {/* News link — only for hospital roles (not academic roles) */}
          {!isAcademicRole && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={false}
                tooltip="Healthcare News"
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                <Link href="/dashboard#news">
                  <Newspaper className="size-4" />
                  <span>News</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        <SidebarSeparator className="bg-slate-700/50" />
      </SidebarHeader>

      {/* Navigation Sections — filtered by role */}
      <SidebarContent className="px-1 custom-scrollbar">
        {/* Admin Section — only visible to SUPER_ADMIN and ADMIN */}
        {showAdminSection && (
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <span className="flex items-center gap-2">
                <Crown className="size-3.5 text-emerald-400" />
                {userRole === 'SUPER_ADMIN' ? 'Super Admin' : isInstitutionAdmin ? 'Institution Admin' : 'Facility Admin'}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === adminDashboardPath && !(userRole === 'SUPER_ADMIN' && searchParams.get('tab') === 'email')}
                    tooltip={adminDashboardLabel}
                    className={
                      pathname === adminDashboardPath
                        ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    }
                  >
                    <Link href={adminDashboardPath}>
                      <Crown className="size-4" />
                      <span>{adminDashboardLabel}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userRole === 'SUPER_ADMIN' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/superadmin' && searchParams.get('tab') === 'email'}
                        tooltip="Email Center"
                        className="text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                      >
                        <Link href="/superadmin?tab=email">
                          <Mail className="size-4" />
                          <span>Email Center</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/messages'}
                        tooltip="Messages"
                        className={
                          pathname === '/messages'
                            ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-medium"
                            : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                        }
                      >
                        <Link href="/messages">
                          <MessageCircle className="size-4" />
                          <span>Messages</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {navSections
          .filter((section) => {
            // Filter sections based on the user's role
            const allowedSections = effectiveNavVisibility
            return allowedSections.includes(section.title)
          })
          .map((section) => (
            <NavSectionGroup
              key={section.title}
              section={section}
              pathname={pathname}
              academicRole={user?.academicRole}
            />
          ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-3 pb-4">
        <SidebarSeparator className="bg-slate-700/50 mb-2" />

        <SidebarMenu>
          {/* Subscription feature REMOVED — NurseOS is free forever, no payments */}
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
            <AvatarImage src={user?.avatarUrl} alt={`${firstName} ${lastName}`} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              {initials || "NU"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{firstName} {lastName}</p>
            <p className="text-[10px] text-slate-400 truncate">{
              userRole === 'SUPER_ADMIN' ? 'Super Admin'
              : isInstitutionAdmin ? 'Institution Admin'
              : userRole === 'ADMIN' ? 'Facility Admin'
              : academicRole === 'STUDENT' ? 'Nursing Student'
              : academicRole === 'LECTURER' ? 'Lecturer'
              : userRole === 'DOCTOR' ? 'Doctor'
              : userRole === 'MATRON' ? 'Matron'
              : userRole === 'OTHER' ? 'Healthcare Worker'
              : userRole === 'NURSE' ? 'Nurse'
              : userRole
            } — NurseOS</p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail className="bg-slate-700/30" />
    </Sidebar>
  )
}
