"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  Activity,
  ArrowRightLeft,
  Brain,
  Calendar,
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useAuthStore } from "@/lib/auth-store"

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

/* ───── Main Page ───── */
export default function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.firstName || "Nurse"
  const role = user?.role || "Nurse"
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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
          {role}
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
                <Link href="/nurseai/patients">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Register First Patient
                  </Button>
                </Link>
                <Link href="/academy/courses">
                  <Button size="sm" variant="outline" className="border-emerald-500/30">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Browse Courses
                  </Button>
                </Link>
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
