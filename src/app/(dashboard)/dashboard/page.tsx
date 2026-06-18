"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Users,
  Activity,
  ArrowRightLeft,
  Brain,
  UserPlus,
  PenTool,
  ArrowRight,
  Video,
  Heart,
  Stethoscope,
  FlaskConical,
  Sparkles,
  TrendingUp,
  Rocket,
  BookOpen,
  Upload,
  GraduationCap,
  MessageSquare,
  Share2,
  School,
  FileText,
  Download,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/auth-store"
// HealthcareNews removed from all dashboards
import { Loader2 } from "lucide-react"

const quickActions = [
  {
    title: "New Patient",
    description: "Register a new patient",
    icon: UserPlus,
    href: "/nurseai/patients",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Smart Chart",
    description: "AI-assisted charting",
    icon: PenTool,
    href: "/nurseai/charting",
    color: "from-teal-500 to-cyan-600",
  },
  {
    title: "Refer Patient",
    description: "Create a referral",
    icon: ArrowRightLeft,
    href: "/caregrid/referrals",
    color: "from-cyan-500 to-emerald-600",
  },
  {
    title: "Start Consultation",
    description: "Video consultation",
    icon: Video,
    href: "/caregrid/consultations",
    color: "from-emerald-600 to-green-600",
  },
]

const modules = [
  {
    title: "NurseAI",
    description: "AI-powered care assistant",
    icon: Brain,
    color: "from-emerald-500 to-teal-600",
    href: "/nurseai/patients",
  },
  {
    title: "CareGrid",
    description: "Workforce & scheduling",
    icon: Stethoscope,
    color: "from-teal-500 to-cyan-600",
    href: "/caregrid/facilities",
  },
  {
    title: "Analytics",
    description: "Insights & reporting",
    icon: TrendingUp,
    color: "from-cyan-500 to-emerald-600",
    href: "/analytics",
  },
  {
    title: "NurseID",
    description: "Identity & credentials",
    icon: Heart,
    color: "from-emerald-600 to-green-600",
    href: "/nurseid/profile",
  },
  {
    title: "Academy",
    description: "Continuous learning",
    icon: FlaskConical,
    color: "from-green-500 to-emerald-500",
    href: "/academy/courses",
  },
]

/* ───── Hospital Dashboard (for NURSE / DOCTOR / MATRON / OTHER) ───── */
function HospitalDashboard({ firstName, role }: { firstName: string; role: string }) {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your NurseOS dashboard. Start exploring the platform modules below.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 w-fit">
          <Sparkles className="size-3" />
          {role === 'DOCTOR' ? 'Doctor' : role === 'MATRON' ? 'Matron' : role === 'OTHER' ? 'Healthcare Worker' : role === 'NURSE' ? 'Nurse' : role}
        </Badge>
      </div>

      {/* Getting Started Card */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-lg font-semibold text-foreground">Get Started with NurseOS</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Welcome to NurseOS! This is your central hub for all nursing care operations.
                As you begin using the platform — registering patients, creating charts, managing referrals —
                your dashboard will populate with real-time data, activity feeds, and AI-powered insights.
                Start by exploring the modules below.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <Link href="/nurseai/patients">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Register First Patient
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-emerald-500/30">
                  <Link href="/academy/courses">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Browse Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 p-5 hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="size-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all absolute top-4 right-4" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Healthcare News removed */}

      {/* Module Overview */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="group hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ${module.color} shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <module.icon className="size-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{module.title}</p>
                      <p className="text-[11px] text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to explore this module and start using its features.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───── Student Dashboard (ONLY academic features — no patients, no 5 modules) ───── */
function StudentDashboard({ firstName, facilityName, studentLevel }: { firstName: string; facilityName: string | null; studentLevel: number | null }) {
  const studentActions = [
    {
      title: "Course Materials",
      description: `View materials for your level${studentLevel ? ` (${studentLevel})` : ""}`,
      icon: BookOpen,
      href: "/student/materials",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Announcements",
      description: "Institution announcements",
      icon: MessageSquare,
      href: "/announcements",
      color: "from-teal-500 to-cyan-600",
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {facilityName || "Your institution"}
            {studentLevel && ` · ${studentLevel} Level`}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 w-fit">
          <GraduationCap className="size-3" />
          Nursing Student
        </Badge>
      </div>

      {/* Quick Actions — academic only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Access your course materials and announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 p-6 hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer">
                  <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="size-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all absolute top-4 right-4" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Healthcare News */}
      {/* Healthcare News removed */}
    </div>
  )
}

/* ───── Lecturer Dashboard (ONLY academic features — no patients, no 5 modules) ───── */
function LecturerDashboard({ firstName, facilityName }: { firstName: string; facilityName: string | null }) {
  const lecturerActions = [
    {
      title: "My Materials",
      description: "Upload and manage course materials",
      icon: Upload,
      href: "/lecturer/materials",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Shared Materials",
      description: "Materials shared with / by you",
      icon: Share2,
      href: "/lecturer/shared",
      color: "from-teal-500 to-cyan-600",
    },
    {
      title: "Announcements",
      description: "Send announcements to students",
      icon: MessageSquare,
      href: "/announcements",
      color: "from-cyan-500 to-emerald-600",
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {facilityName || "Your institution"}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 w-fit">
          <School className="size-3" />
          Lecturer
        </Badge>
      </div>

      {/* Quick Actions — academic only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription>Manage your course materials and announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lecturerActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 p-6 hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer">
                  <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="size-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all absolute top-4 right-4" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Healthcare News removed */}
    </div>
  )
}

/* ───── Main Page — routes each role to their specific dashboard ───── */
export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const firstName = user?.firstName || "Nurse"
  const role = user?.role || "Nurse"
  const academicRole = user?.academicRole
  const facilityType = user?.facilityType

  // ─── Single useEffect for ALL redirects (Rules of Hooks: hooks must not be conditional) ───
  // Admins (any kind) → /admin or /superadmin. Everyone else stays on /dashboard.
  React.useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      router.replace('/superadmin')
    } else if (role === 'ADMIN') {
      // Both institution admin and hospital admin go to /admin — the /admin page itself
      // routes to InstitutionAdminDashboard vs RegularFacilityAdminDashboard based on facilityType.
      router.replace('/admin')
    }
  }, [role, router])

  // ─── Admins: show loading spinner while redirect happens ───
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // ─── Student → Student Dashboard (academic only, NO patient content, NO 5 modules) ───
  if (academicRole === 'STUDENT') {
    return (
      <StudentDashboard
        firstName={firstName}
        facilityName={user?.facilityName || null}
        studentLevel={user?.studentLevel ?? null}
      />
    )
  }

  // ─── Lecturer → Lecturer Dashboard (academic only, NO patient content, NO 5 modules) ───
  if (academicRole === 'LECTURER') {
    return (
      <LecturerDashboard
        firstName={firstName}
        facilityName={user?.facilityName || null}
      />
    )
  }

  // ─── Hospital roles (NURSE / DOCTOR / MATRON / OTHER) → Hospital Dashboard with 5 modules ───
  return <HospitalDashboard firstName={firstName} role={role} />
}
