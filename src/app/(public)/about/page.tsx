"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  Heart,
  Users,
  Globe,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const values = [
  {
    icon: Heart,
    title: "Compassion First",
    description:
      "Every feature is designed with the nurse-patient relationship at its core. Technology should amplify care, not replace it.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    description:
      "Patient data security and nurse credential verification are non-negotiable. We build trust into every layer of the platform.",
  },
  {
    icon: Globe,
    title: "Global from Day One",
    description:
      "Starting in Nigeria, designed for the world. Multi-language support, local compliance, and culturally-aware AI from the start.",
  },
  {
    icon: Target,
    title: "Impact-Driven",
    description:
      "Every metric we track is tied to patient outcomes. We measure success not in clicks, but in lives improved and care quality enhanced.",
  },
  {
    icon: Users,
    title: "Community-Powered",
    description:
      "NurseOS is built with nurses, not just for them. Our advisory council includes frontline nurses from across Africa.",
  },
  {
    icon: Sparkles,
    title: "Innovation with Purpose",
    description:
      "We apply cutting-edge AI and technology not for novelty, but to solve the real, daily challenges nurses face in understaffed facilities.",
  },
];

const team = [
  {
    name: "Founding Team",
    role: "Nurse-Led Leadership",
    description: "Founded by a registered nurse who experienced the challenges of Nigeria's healthcare system firsthand.",
  },
  {
    name: "Engineering",
    role: "World-Class Builders",
    description: "Distributed team of engineers with experience at leading health-tech companies across Africa and globally.",
  },
  {
    name: "Advisors",
    role: "Industry Experts",
    description: "Advised by healthcare administrators, nursing educators, and public health officials from multiple countries.",
  },
];

const milestones = [
  { year: "2024", title: "Concept Born", description: "NurseOS was conceived from the real challenges faced in Nigerian healthcare facilities." },
  { year: "2025", title: "Beta Launch", description: "First module (NurseAI) enters closed beta with 5 pilot facilities in Lagos." },
  { year: "2025", title: "CareGrid Launch", description: "Workforce scheduling module launches, reaching 500+ nurses on the platform." },
  { year: "2026", title: "Full Platform", description: "All 5 modules live. Expansion to Ghana and Kenya begins." },
  { year: "2027", title: "10K Nurses", description: "Target: 10,000 active nurses, 50+ facilities, 3 African countries." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              Our Story
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Built by a Nurse.
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                For the World.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100/70 max-w-2xl mx-auto">
              NurseOS was born from the frontline — created by a nurse who saw the gaps in healthcare technology
              and decided to build the solution the world&apos;s nurses deserve.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                To empower every nurse with the technology they need to deliver world-class care — regardless of
                geography, facility size, or resource constraints.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <CardContent className="p-8 sm:p-10">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  {[
                    { icon: Stethoscope, value: "1 Nurse", label: "Can change 100+ lives daily" },
                    { icon: Building2, value: "1 Platform", label: "Unifying 5 critical workflows" },
                    { icon: Globe, value: "1 Vision", label: "Global nursing care transformation" },
                  ].map((item) => (
                    <div key={item.label}>
                      <item.icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-foreground mb-1">{item.value}</div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide every decision we make at NurseOS.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((val, i) => (
              <FadeIn key={val.title} delay={i * 0.08}>
                <Card className="h-full hover:shadow-lg hover:shadow-emerald-500/5 transition-all hover:border-emerald-500/20">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                      <val.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-lg">{val.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{val.description}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Journey</h2>
            <p className="text-lg text-muted-foreground">From a nurse&apos;s idea to a global platform.</p>
          </FadeIn>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/20 -translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <FadeIn key={milestone.year} delay={i * 0.1}>
                  <div className={`flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <Card className="inline-block">
                        <CardContent className="p-5">
                          <Badge variant="outline" className="mb-2 text-emerald-600 border-emerald-500/30">
                            {milestone.year}
                          </Badge>
                          <h3 className="font-semibold text-foreground mb-1">{milestone.title}</h3>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 hidden md:block" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">The Team</h2>
            <p className="text-lg text-muted-foreground">
              A nurse-led team building the future of healthcare technology.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <Card className="text-center h-full">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{t.name}</h3>
                    <p className="text-sm text-emerald-600 font-medium mb-2">{t.role}</p>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
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
              Join the{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NurseOS
              </span>{" "}
              Revolution
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of the platform that&apos;s transforming nursing care across Africa and beyond.
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
