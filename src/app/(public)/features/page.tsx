"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  Bot,
  LayoutGrid,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Layers,
  Shield,
  RefreshCw,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const modules = [
  {
    id: "nurseai",
    icon: Bot,
    title: "NurseAI",
    subtitle: "AI-Powered Care Assistant",
    tagline: "Your intelligent clinical companion",
    description:
      "NurseAI is the brain of NurseOS — an AI-powered assistant that helps nurses make better clinical decisions, automate routine documentation, and monitor patients in real-time. Built specifically for nursing workflows, not generic healthcare AI.",
    features: [
      { title: "Clinical Decision Support", description: "Evidence-based recommendations at the point of care, tailored to local protocols and guidelines." },
      { title: "Automated Care Plans", description: "Generate, customize, and update patient care plans automatically based on assessments and outcomes." },
      { title: "Symptom Analysis", description: "AI-driven symptom checking that helps nurses prioritize and escalate patient concerns appropriately." },
      { title: "Real-time Alerts", description: "Proactive notifications for critical patient changes, medication reminders, and care milestones." },
      { title: "Natural Language Charting", description: "Speak or type naturally and NurseAI converts your notes into structured clinical documentation." },
    ],
    color: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/10",
  },
  {
    id: "caregrid",
    icon: LayoutGrid,
    title: "CareGrid",
    subtitle: "Workforce & Scheduling Platform",
    tagline: "Smart scheduling for complex teams",
    description:
      "CareGrid solves one of healthcare's biggest operational challenges: staffing. Intelligent scheduling algorithms optimize nurse-patient ratios, manage shift swaps, and ensure your facility is always properly staffed — even during emergencies.",
    features: [
      { title: "Smart Scheduling", description: "AI-optimized shift scheduling that balances workload, preferences, compliance, and skill mix requirements." },
      { title: "Staff Optimization", description: "Real-time staffing recommendations based on patient acuity, census, and historical patterns." },
      { title: "Ratio Management", description: "Automated nurse-patient ratio tracking with alerts when ratios fall below safe thresholds." },
      { title: "Team Coordination", description: "Built-in communication tools, shift handoff workflows, and role-based task assignment." },
      { title: "Emergency Staffing", description: "Rapid deployment protocols for surge capacity, with automated notification and response tracking." },
    ],
    color: "from-teal-500 to-cyan-600",
    bgGlow: "bg-teal-500/10",
  },
  {
    id: "nurseanalytics",
    icon: BarChart3,
    title: "NurseAnalytics",
    subtitle: "Insights & Reporting Engine",
    tagline: "Data-driven care improvement",
    description:
      "NurseAnalytics turns your facility's data into actionable insights. From patient outcomes to staff performance, compliance metrics to financial efficiency — every dimension of your operation, visualized and understood.",
    features: [
      { title: "Live Dashboards", description: "Real-time operational dashboards with customizable KPIs for every level of your organization." },
      { title: "Outcome Tracking", description: "Patient outcome monitoring with benchmarking against local, national, and international standards." },
      { title: "Predictive Analytics", description: "ML-powered forecasting for patient volumes, staffing needs, and resource utilization." },
      { title: "Compliance Reports", description: "One-click regulatory compliance reports for nursing councils, health ministries, and accreditation bodies." },
      { title: "Financial Insights", description: "Cost-per-patient, revenue optimization, and resource allocation analytics for facility administrators." },
    ],
    color: "from-cyan-500 to-emerald-600",
    bgGlow: "bg-cyan-500/10",
  },
  {
    id: "nurseid",
    icon: ShieldCheck,
    title: "NurseID",
    subtitle: "Identity & Credential Verification",
    tagline: "Trust, verified",
    description:
      "NurseID ensures that every nurse on the platform is who they say they are, with the credentials they claim. Secure identity verification, license management, and credential tracking protect patients and empower nurses.",
    features: [
      { title: "License Management", description: "Centralized nursing license tracking with automatic renewal reminders and expiration alerts." },
      { title: "Credential Tracking", description: "Comprehensive record of certifications, specializations, and continuing education achievements." },
      { title: "Background Checks", description: "Integrated verification with licensing boards and background check providers for complete trust." },
      { title: "Verification Badge", description: "Digital credential badge that nurses can share across platforms to prove their qualifications." },
      { title: "Facility Access Control", description: "Role-based access management tied to verified credentials for secure facility operations." },
    ],
    color: "from-emerald-600 to-green-600",
    bgGlow: "bg-green-500/10",
  },
  {
    id: "nurseacademy",
    icon: GraduationCap,
    title: "NurseAcademy",
    subtitle: "Continuous Learning Platform",
    tagline: "Never stop growing",
    description:
      "NurseAcademy is the education arm of NurseOS — delivering accredited courses, skill assessments, certification preparation, and continuing education units designed for busy nurses who want to advance their careers.",
    features: [
      { title: "Accredited Courses", description: "Nursing council-approved courses across specialties, available online and offline for maximum accessibility." },
      { title: "Skill Assessments", description: "Competency evaluations with practical scenarios, peer review, and supervisor verification workflows." },
      { title: "Certification Tracking", description: "Automated tracking of all certifications with renewal timelines and prerequisite management." },
      { title: "CEU Management", description: "Continuing Education Unit tracking and reporting for license renewal requirements across jurisdictions." },
      { title: "Mentorship Matching", description: "AI-powered matching of experienced nurses with students and early-career professionals for guided growth." },
    ],
    color: "from-green-500 to-emerald-500",
    bgGlow: "bg-emerald-400/10",
  },
];

const platformFeatures = [
  { icon: Zap, title: "Real-time Sync", description: "All modules sync instantly across devices and facilities." },
  { icon: Shield, title: "End-to-End Encryption", description: "Patient data is encrypted at rest and in transit." },
  { icon: Smartphone, title: "Mobile-First Design", description: "Built for the nurses on the floor, not at a desk." },
  { icon: Globe, title: "Multi-Language", description: "Support for English, Yoruba, Igbo, Hausa, and more." },
  { icon: RefreshCw, title: "Offline Mode", description: "Core functionality works without internet connection." },
  { icon: Layers, title: "API Integrations", description: "Connect with existing EMR, HR, and billing systems." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Five Powerful Modules
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Everything Your
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Facility Needs
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100/70 max-w-2xl mx-auto">
              One platform, five integrated modules — designed from the ground up for the realities of nursing care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Module Deep Dives */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="nurseai" className="space-y-10">
            <FadeIn>
              <TabsList className="flex flex-wrap justify-center gap-2 h-auto bg-muted/50 p-2 rounded-xl">
                {modules.map((mod) => (
                  <TabsTrigger
                    key={mod.id}
                    value={mod.id}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white px-4 py-2 rounded-lg"
                  >
                    <mod.icon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{mod.title}</span>
                    <span className="sm:hidden">{mod.title.replace("Nurse", "")}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </FadeIn>

            {modules.map((mod) => (
              <TabsContent key={mod.id} value={mod.id}>
                <div className="grid lg:grid-cols-2 gap-10 items-start">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-5 shadow-xl`}>
                      <mod.icon className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{mod.title}</h2>
                    <p className="text-emerald-600 font-medium mb-2">{mod.subtitle}</p>
                    <p className="text-sm text-muted-foreground mb-2 italic">{mod.tagline}</p>
                    <p className="text-muted-foreground leading-relaxed">{mod.description}</p>
                  </div>

                  <div className="space-y-4">
                    {mod.features.map((feat, i) => (
                      <Card key={feat.title} className="hover:shadow-md hover:border-emerald-500/20 transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground text-sm mb-1">{feat.title}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
              Platform
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built for Real-World Healthcare</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Under the hood, NurseOS is engineered for the unique challenges of healthcare in emerging markets.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feat, i) => (
              <FadeIn key={feat.title} delay={i * 0.08}>
                <Card className="h-full hover:shadow-lg hover:shadow-emerald-500/5 transition-all hover:border-emerald-500/20">
                  <CardContent className="p-6">
                    <feat.icon className="w-8 h-8 text-emerald-600 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Experience{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NurseOS
              </span>
              ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start free today and see how NurseOS transforms your facility&apos;s nursing care.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
