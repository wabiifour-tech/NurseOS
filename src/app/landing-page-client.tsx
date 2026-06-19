"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-y-auto">
      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/nurseos-logo.png" alt="NurseOS" width={32} height={32} className="size-8 rounded-lg" priority />
            <span className="text-lg font-bold text-slate-900 dark:text-white">NurseOS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">About</Link>
            <Link href="/features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/login" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
            <Link href="/register">
              <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
            <Link href="/about" className="block text-sm text-slate-600 dark:text-slate-300 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/features" className="block text-sm text-slate-600 dark:text-slate-300 py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/login" className="block text-sm text-slate-600 dark:text-slate-300 py-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">Get Started</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <p className="text-sm font-medium text-emerald-600 mb-4 tracking-wide">
              Built by a Nurse. For the World.
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              The operating system
              <br />
              for nursing care.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-6 max-w-xl mx-auto leading-relaxed">
              NurseOS brings together clinical tools, academic management, and professional development
              into one platform — for hospitals, universities, and nursing schools.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/register">
                <Button size="lg" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 dark:border-slate-700">
                  Explore Features
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-400 mt-4">Free forever. No credit card required.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Who is NurseOS for? ─── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Who is it for?</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">One platform, built for every role in nursing.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hospitals & Clinics */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-full">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Hospitals & Clinics</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  AI-powered charting, patient management, vitals tracking, medication orders, lab results,
                  referrals, and analytics — everything your clinical team needs in one place.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Patient records & smart charting</li>
                  <li>Drug interaction checking</li>
                  <li>Referrals & inter-facility consultations</li>
                  <li>Real-time analytics & disease surveillance</li>
                </ul>
              </div>
            </motion.div>

            {/* Universities & Schools of Nursing */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-full">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Universities & Schools of Nursing</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Lecturers upload course materials, students access them by level, Q&amp;A threads on each
                  material, level-targeted announcements, and cross-institution material sharing.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Upload slides, PDFs, PowerPoints, links</li>
                  <li>Students see only materials for their level</li>
                  <li>Q&amp;A comments on every material</li>
                  <li>Schedule materials to auto-publish</li>
                  <li>Analytics: views, downloads, per-student tracking</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── What's inside ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">What&apos;s inside</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Five integrated modules, one seamless experience.</p>
          </motion.div>

          <div className="space-y-px">
            {[
              { name: "NurseAI", desc: "Clinical care — patient records, smart charting, vitals, medications, lab orders, appointments." },
              { name: "CareGrid", desc: "Network — facility directory, referrals, video consultations, knowledge bank." },
              { name: "NurseAnalytics", desc: "Intelligence — dashboards, disease surveillance, predictive staffing, reports." },
              { name: "NurseID", desc: "Identity — verified credentials, portfolio, CPD tracker, competencies." },
              { name: "NurseAcademy", desc: "Learning — courses, clinical simulations, certifications, competency paths." },
            ].map((mod, i) => (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-6 py-6 border-t border-slate-200 dark:border-slate-800 first:border-t-0"
              >
                <div className="text-sm font-mono text-slate-400 mt-0.5 w-6">0{i + 1}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{mod.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Academic Institutions ─── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Built for nursing education.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Institution admins manage lecturers and students. Lecturers upload materials by level.
              Students access only what&apos;s relevant to them. Everyone stays connected through
              announcements and Q&amp;A — all within their institution, fully isolated.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Institution Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Approve lecturers, view students by level, send announcements.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Lecturer</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload materials, schedule publishing, track analytics, answer Q&amp;A.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Student</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View materials for your level, download, ask questions, get announcements.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Start using NurseOS today.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4">
              Free forever. Sign up with Google and pick your role.
            </p>
            <Link href="/register" className="inline-block mt-8">
              <Button size="lg" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Get Started
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/nurseos-logo.png" alt="NurseOS" width={24} height={24} className="size-6 rounded" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">NurseOS</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link>
            <Link href="/features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} NurseOS</p>
        </div>
      </footer>
    </div>
  );
}
