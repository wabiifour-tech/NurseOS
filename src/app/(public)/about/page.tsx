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
  Code2,
  GraduationCap,
  Monitor,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    title: "Nurse-First Design",
    description:
      "Every feature is designed by someone who has stood at a bedside. Technology should amplify care, not complicate it. NurseOS is built from lived clinical experience, not assumptions.",
  },
  {
    icon: ShieldCheck,
    title: "Clinical Integrity",
    description:
      "Patient data security and nurse credential verification are non-negotiable. We build trust into every layer of the platform, ensuring compliance with NDPR and alignment with HIPAA standards.",
  },
  {
    icon: Globe,
    title: "Global from Day One",
    description:
      "Starting in Nigeria, designed for the world. Multi-language support including Yoruba, Igbo, Hausa, and Pidgin English. Local compliance and culturally-aware AI from the start.",
  },
  {
    icon: Target,
    title: "Impact-Driven",
    description:
      "Every metric we track is tied to patient outcomes. We measure success not in clicks, but in lives improved and care quality enhanced across Nigerian healthcare facilities.",
  },
  {
    icon: Users,
    title: "Community-Powered",
    description:
      "NurseOS is built with nurses, not just for them. Real feedback from real healthcare workers drives every feature decision and product roadmap item.",
  },
  {
    icon: Sparkles,
    title: "Innovation with Purpose",
    description:
      "We apply cutting-edge AI and technology not for novelty, but to solve the real, daily challenges nurses face in understaffed and under-resourced facilities across Africa.",
  },
];

const previousProjects = [
  {
    icon: Building2,
    title: "RUHC HMS",
    subtitle: "Redeemer's University Health Centre — Hospital Management System",
    description:
      "A full Hospital Management System deployed at Redeemer's University Health Centre, serving over 7,000 patients. The system handles patient registration, appointments, medical records, pharmacy management, and laboratory workflows — proving that world-class healthcare software can be built right here in Nigeria.",
    impact: "7,000+ patients served",
    tech: ["Full Stack", "Web Development", "Healthcare IT"],
  },
  {
    icon: Brain,
    title: "MedAI",
    subtitle: "AI-Powered Medical Intelligence",
    description:
      "An AI-powered medical intelligence tool that leverages large language models to assist healthcare providers with clinical decision support, diagnostic suggestions, and medical knowledge retrieval. MedAI demonstrated the potential of combining nursing expertise with artificial intelligence — a core principle that now powers NurseOS's NurseAI module.",
    impact: "AI + Healthcare Integration",
    tech: ["AI Development", "Clinical Decision Support", "LLM Integration"],
  },
];

const milestones = [
  {
    year: "2026",
    title: "RUHC HMS Deployed",
    description:
      "Hospital Management System deployed at Redeemer's University Health Centre, serving 7,000+ patients and proving that world-class healthcare software can be built in Nigeria.",
  },
  {
    year: "2025",
    title: "MedAI Built",
    description:
      "AI-powered medical intelligence tool created, combining healthcare knowledge with artificial intelligence to assist clinical decision-making.",
  },
  {
    year: "Dec 2025",
    title: "NurseOS Concept Born",
    description:
      "From the experience of building RUHC HMS and MedAI, the vision for a unified nursing operating system emerged — a platform built by a nurse, for every nurse.",
  },
  {
    year: "Feb 2026",
    title: "Development Begins",
    description:
      "Full development of the 5-module platform starts, built by a nurse who codes — every feature informed by real clinical experience.",
  },
  {
    year: "May 2026",
    title: "Platform Launch",
    description:
      "NurseOS launches with all 5 modules, starting from Nigeria with plans to expand across Africa and globally.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
            >
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
              NurseOS was born from the frontline — created by Wabi, a 500-level nursing student
              and Registered Nurse from Redeemer&apos;s University, who saw the gaps in healthcare
              technology and decided to build the solution the world&apos;s nurses deserve.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-2 flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                    <div className="text-center text-white">
                      <Stethoscope className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-lg font-bold">Wabi</p>
                      <p className="text-xs opacity-80">The Tech Nurse</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Code2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                  Founder & Builder
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Wabi — The Tech Nurse
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Wabi is a 500-level nursing student (Registered Nurse) at Redeemer&apos;s University, Ede,
                  Osun State, Nigeria. As both a clinically-trained nurse and a full-stack developer,
                  Wabi occupies a rare intersection — someone who has lived the challenges of Nigerian
                  healthcare delivery and has the technical skills to build solutions.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Healthcare technology worldwide is built by engineers who have never stood at a bedside.
                  NurseOS is different — every feature is informed by real clinical experience, every module
                  solves a problem that exists because the person building it has lived it. That is not a
                  marketing line; it is the fundamental reason NurseOS exists.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                    <GraduationCap className="w-3 h-3 mr-1" /> 500-Level Nursing Student
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                    <Stethoscope className="w-3 h-3 mr-1" /> Registered Nurse
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                    <Code2 className="w-3 h-3 mr-1" /> Full Stack Developer
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                    <Monitor className="w-3 h-3 mr-1" /> AI Developer
                  </Badge>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Previous Projects */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Proven Track Record
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              NurseOS is not built from theory. It is the evolution of real, deployed healthcare
              systems that are already serving patients in Nigeria.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            {previousProjects.map((project, i) => (
              <FadeIn key={project.title} delay={i * 0.1}>
                <Card className="h-full hover:shadow-xl hover:shadow-emerald-500/5 transition-all border-emerald-500/10">
                  <CardContent className="p-6 sm:p-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                      <project.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{project.title}</h3>
                    <p className="text-sm font-medium text-emerald-600 mb-3">{project.subtitle}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                        {project.impact}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why NurseOS */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why NurseOS?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The problem is personal. The solution is too.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <CardContent className="p-8 sm:p-10">
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    In Nigeria and across Africa, nurses make up the largest portion of the healthcare workforce,
                    yet they work with the least technological support. Paper records, manual vital sign tracking,
                    no drug interaction checking, no clinical decision support — nurses are expected to deliver
                    world-class care with tools from the last century.
                  </p>
                  <p>
                    Having built RUHC HMS for Redeemer&apos;s University Health Centre and watched it serve 7,000+
                    patients, and having created MedAI to explore AI in clinical decision support, the pattern
                    became clear: healthcare technology is built by people who have never been at the bedside.
                    The result is software that looks good to administrators but creates more work for nurses.
                  </p>
                  <p>
                    NurseOS is the answer. Five integrated modules — NurseAI, CareGrid, NurseAnalytics,
                    NurseID, and NurseAcademy — designed by a nurse who codes, to solve problems that exist
                    because the person building the solution has lived them. Starting from Nigeria, built
                    for the world.
                  </p>
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {val.description}
                    </p>
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
            <p className="text-lg text-muted-foreground">
              From a nurse&apos;s vision to a global platform.
            </p>
          </FadeIn>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/20 -translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <FadeIn key={milestone.year} delay={i * 0.1}>
                  <div
                    className={`flex items-start gap-6 ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <Card className="inline-block">
                        <CardContent className="p-5">
                          <Badge
                            variant="outline"
                            className="mb-2 text-emerald-600 border-emerald-500/30"
                          >
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
              Be part of the platform that&apos;s transforming nursing care, starting from Nigeria.
              Built by a nurse who codes, for every nurse who cares.
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
