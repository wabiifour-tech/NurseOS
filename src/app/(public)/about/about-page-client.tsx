"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const founderPhotos = [
  "/founder/wabi-1.jpg",
  "/founder/wabi-2.jpg",
  "/founder/wabi-3.jpg",
];

function FounderPhotoCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % founderPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={founderPhotos[index]}
            alt={`Wabi — The Tech Nurse (photo ${index + 1})`}
            fill
            sizes="(max-width: 768px) 192px, 224px"
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {founderPhotos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => { e.stopPropagation(); setIndex(i); }}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            aria-label={`View photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const milestones = [
  { year: "2025", title: "MedAI Built", description: "AI-powered medical intelligence tool combining healthcare knowledge with artificial intelligence for clinical decision support." },
  { year: "2025", title: "Hospital Management System Deployed", description: "Full hospital management system deployed at a university health centre — patient registration, appointments, medical records, pharmacy, and laboratory workflows." },
  { year: "Dec 2025", title: "NurseOS Concept Born", description: "From the experience of building healthcare systems and MedAI, the vision for a unified nursing operating system emerged." },
  { year: "Feb 2026", title: "Development Begins", description: "Full development of the platform starts, built by a nurse who codes — every feature informed by real clinical experience." },
  { year: "May 2026", title: "Platform Launches", description: "NurseOS launches with all 5 modules plus the academic module for universities and schools of nursing." },
  { year: "Jun 2026", title: "Top 20 — Next Nurse Reality Docuseries", description: "NurseOS selected as a Top 20 finalist in the Next Nurse Reality Docuseries, recognizing nursing innovation beyond the bedside." },
];

export default function AboutPageClient() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-sm font-medium text-emerald-600 mb-3">Our Story</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Nursing is Beyond the Bedside.
            </h1>
            <p className="text-lg text-slate-600 mt-6 leading-relaxed">
              NurseOS was born from a simple realization: the nurses who understand healthcare
              challenges best are rarely the ones building the technology to solve them.
              That changes now.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="grid md:grid-cols-5 gap-8 items-center">
              <div className="md:col-span-2 flex justify-center">
                <FounderPhotoCarousel />
              </div>
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-emerald-600 mb-2">Founder & Builder</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Wabi — The Tech Nurse</h2>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Wabi is a Registered Nurse from Redeemer&apos;s University, a certified BLS (Basic Life Support)
                  Provider, a certified Full Stack Web Developer and AI Engineer/Developer, a Data Analyst, and a
                  premium PowerPoint slides and presentations developer.
                </p>
                <p className="text-slate-600 leading-relaxed mb-3">
                  This rare intersection of clinical expertise, engineering depth, and design craft is exactly
                  what allows NurseOS to feel like it was built by someone who has stood at the bedside — because
                  it was. Every feature is informed by real clinical experience, every module solves a problem
                  that exists because the person building it has lived it.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Wabi represents a new kind of nurse: one who refuses to choose between caring for patients
                  and building the tools that transform care. Nursing is beyond the bedside — and NurseOS is proof.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">The Problem</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                In Nigeria and across Africa, nurses make up the largest portion of the healthcare workforce,
                yet they work with the least technological support. Paper records. Manual vital sign tracking.
                No drug interaction checking. No clinical decision support. No unified platform for patient care,
                professional development, and education.
              </p>
              <p>
                Healthcare technology worldwide is built by engineers who have never stood at a bedside.
                The result is software that looks good to administrators but creates more work for nurses.
                The gap between those who understand healthcare challenges and those who build solutions
                has never been wider.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">The Solution</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                NurseOS is the answer. Five integrated modules — NurseAI, CareGrid, NurseAnalytics, NurseID,
                and NurseAcademy — plus a dedicated academic module for universities and schools of nursing.
                Designed by a nurse who codes, to solve problems that exist because the person building the
                solution has lived them.
              </p>
              <p>
                For hospitals: AI-powered charting, patient management, vitals, medications, referrals, and analytics.
                For institutions: lecturers upload materials, students access them by level, Q&amp;A threads,
                level-targeted announcements, and cross-institution sharing.
              </p>
              <p>
                Starting from Nigeria. Built for the world.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why It Matters</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                When nurses have the right tools, patient outcomes improve. When students have access to
                quality materials, the next generation of nurses is better prepared. When institutions can
                manage their academic programs digitally, education becomes more efficient and accessible.
              </p>
              <p>
                NurseOS matters because it proves that nurses are not just care providers — they are
                innovators, builders, and leaders. Nursing is beyond the bedside, and the technology
                that serves nursing should be built by people who understand it.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Journey</h2>
            <p className="text-slate-500 mt-2">From a nurse&apos;s vision to a Top 20 innovation.</p>
          </FadeIn>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <FadeIn key={m.title} delay={i * 0.08}>
                  <div className={`flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <div className="inline-block p-5 rounded-xl bg-white border border-slate-200">
                        <p className="text-xs font-medium text-emerald-600 mb-1">{m.year}</p>
                        <h3 className="font-semibold text-slate-900 text-sm">{m.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                      </div>
                    </div>
                    <div className="relative z-10 w-3 h-3 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
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
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Join the revolution.
            </h2>
            <p className="text-slate-500 mb-8">
              Built by a nurse who codes, for every nurse who cares.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                Get Started Free
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
