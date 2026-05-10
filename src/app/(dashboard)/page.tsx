"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  Activity,
  ArrowRightLeft,
  Brain,
  Calendar,
  AlertTriangle,
  UserPlus,
  PenTool,
  ArrowRight,
  Video,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Heart,
  Stethoscope,
  FlaskConical,
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

/* ───── Data ───── */
const statCards = [
  {
    title: "Total Patients",
    value: "1,247",
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    title: "Active Encounters",
    value: "89",
    change: "+5%",
    trend: "up" as const,
    icon: Activity,
    color: "text-teal-600",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    title: "Pending Referrals",
    value: "12",
    change: "-3%",
    trend: "down" as const,
    icon: ArrowRightLeft,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    title: "AI Interactions Today",
    value: "156",
    change: "+28%",
    trend: "up" as const,
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    title: "Upcoming Appointments",
    value: "8",
    change: "0%",
    trend: "up" as const,
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    title: "Early Warning Alerts",
    value: "3",
    change: "+1",
    trend: "up" as const,
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
]

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

const recentActivity = [
  {
    id: 1,
    type: "patient" as const,
    title: "Patient Admitted",
    description: "Adebayo Okonkwo — Ward 3, Bed 12",
    time: "2 min ago",
    icon: UserPlus,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  {
    id: 2,
    type: "alert" as const,
    title: "Early Warning Triggered",
    description: "Chidinma Eze — Vitals trending critical",
    time: "8 min ago",
    icon: AlertCircle,
    color: "text-red-600 bg-red-500/10",
  },
  {
    id: 3,
    type: "chart" as const,
    title: "Smart Chart Completed",
    description: "Emeka Obi — Post-operative assessment",
    time: "15 min ago",
    icon: FileText,
    color: "text-teal-600 bg-teal-500/10",
  },
  {
    id: 4,
    type: "task" as const,
    title: "Medication Administered",
    description: "Fatima Abubakar — Metformin 500mg",
    time: "22 min ago",
    icon: CheckCircle2,
    color: "text-cyan-600 bg-cyan-500/10",
  },
  {
    id: 5,
    type: "referral" as const,
    title: "Referral Received",
    description: "From Cardiology — Dr. Okafor",
    time: "35 min ago",
    icon: ArrowRightLeft,
    color: "text-violet-600 bg-violet-500/10",
  },
  {
    id: 6,
    type: "consultation" as const,
    title: "Consultation Ended",
    description: "With Dr. Adeyemi — 45 min session",
    time: "1 hr ago",
    icon: Video,
    color: "text-amber-600 bg-amber-500/10",
  },
  {
    id: 7,
    type: "task" as const,
    title: "Lab Results Available",
    description: "Ngozi Musa — CBC, BMP results",
    time: "1.5 hrs ago",
    icon: FlaskConical,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  {
    id: 8,
    type: "chart" as const,
    title: "Vitals Checked",
    description: "5 patients — Routine morning rounds",
    time: "2 hrs ago",
    icon: Activity,
    color: "text-teal-600 bg-teal-500/10",
  },
]

const weeklyPatientVolume = [
  { day: "Mon", admissions: 18, discharges: 12 },
  { day: "Tue", admissions: 22, discharges: 15 },
  { day: "Wed", admissions: 15, discharges: 20 },
  { day: "Thu", admissions: 28, discharges: 18 },
  { day: "Fri", admissions: 24, discharges: 22 },
  { day: "Sat", admissions: 12, discharges: 10 },
  { day: "Sun", admissions: 8, discharges: 14 },
]

/* ───── Custom Tooltip for Charts ───── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/* ───── Stat Card Component ───── */
function StatCard({ stat }: { stat: typeof statCards[number] }) {
  return (
    <Card className={`relative overflow-hidden border ${stat.border} hover:shadow-md transition-shadow`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <div className="flex items-center gap-1">
              {stat.trend === "up" ? (
                <TrendingUp className="size-3 text-emerald-500" />
              ) : (
                <TrendingDown className="size-3 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </div>
          <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
            <stat.icon className={`size-5 ${stat.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ───── Main Page ───── */
export default function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.firstName || "Nurse"

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening in your care environment today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
            <Clock className="size-3" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Badge>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Volume Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Patient Volume This Week</CardTitle>
                  <CardDescription>Admissions vs discharges across your facility</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Admissions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-400" />
                    <span className="text-muted-foreground">Discharges</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyPatientVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDischarges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="admissions"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAdmissions)"
                      name="Admissions"
                    />
                    <Area
                      type="monotone"
                      dataKey="discharges"
                      stroke="#2dd4bf"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorDischarges)"
                      name="Discharges"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                      {/* Icon */}
                      <div
                        className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className="size-5 text-white" />
                      </div>
                      {/* Text */}
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      </div>
                      {/* Arrow */}
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all absolute top-4 right-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recent Activity */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest updates in your workflow</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {recentActivity.length} events
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[520px] overflow-y-auto custom-scrollbar space-y-1">
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <div className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activity.color}`}>
                      <activity.icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {activity.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  {index < recentActivity.length - 1 && (
                    <Separator className="my-0.5" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Module Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "NurseAI",
            description: "AI-powered care assistant",
            icon: Brain,
            stat: "156 queries",
            statLabel: "today",
            color: "from-emerald-500 to-teal-600",
            href: "/nurseai/patients",
          },
          {
            title: "CareGrid",
            description: "Workforce & scheduling",
            icon: Stethoscope,
            stat: "12 referrals",
            statLabel: "pending",
            color: "from-teal-500 to-cyan-600",
            href: "/caregrid/facilities",
          },
          {
            title: "Analytics",
            description: "Insights & reporting",
            icon: TrendingUp,
            stat: "4 reports",
            statLabel: "due this week",
            color: "from-cyan-500 to-emerald-600",
            href: "/analytics",
          },
          {
            title: "NurseID",
            description: "Identity & credentials",
            icon: Heart,
            stat: "2 credits",
            statLabel: "CPD due",
            color: "from-emerald-600 to-green-600",
            href: "/nurseid/profile",
          },
          {
            title: "Academy",
            description: "Continuous learning",
            icon: FlaskConical,
            stat: "3 courses",
            statLabel: "in progress",
            color: "from-green-500 to-emerald-500",
            href: "/academy/courses",
          },
        ].map((module) => (
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
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">{module.stat}</span>
                  <span className="text-xs text-muted-foreground">{module.statLabel}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
