"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X, Smartphone, Apple, Monitor, Download, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

type Platform = "android" | "ios" | "windows" | "mac" | "linux";

const platformInfo: Record<Platform, { name: string; icon: typeof Smartphone; steps: string[] }> = {
  android: {
    name: "Android",
    icon: Smartphone,
    steps: [
      "Open NurseOS in Chrome browser",
      "Tap the menu (three dots) in the top right",
      "Tap 'Add to Home screen'",
      "Tap 'Install' — NurseOS appears on your home screen",
      "Launch it like any other app",
    ],
  },
  ios: {
    name: "iPhone / iPad",
    icon: Apple,
    steps: [
      "Open NurseOS in Safari",
      "Tap the Share button (square with up arrow)",
      "Scroll down and tap 'Add to Home Screen'",
      "Tap 'Add' — NurseOS appears on your home screen",
      "Launch it like any other app",
    ],
  },
  windows: {
    name: "Windows",
    icon: Monitor,
    steps: [
      "Open NurseOS in Chrome or Edge",
      "Click the install icon (⊕) in the address bar",
      "Click 'Install' — NurseOS opens in its own window",
      "Find it in your Start menu or desktop shortcut",
      "Launch it like any other desktop app",
    ],
  },
  mac: {
    name: "Mac",
    icon: Apple,
    steps: [
      "Open NurseOS in Chrome or Edge",
      "Click the install icon (⊕) in the address bar",
      "Click 'Install' — NurseOS opens in its own window",
      "Find it in your Launchpad or Applications",
      "Launch it like any other Mac app",
    ],
  },
  linux: {
    name: "Linux",
    icon: Monitor,
    steps: [
      "Open NurseOS in Chrome or Edge",
      "Click the install icon (⊕) in the address bar",
      "Click 'Install' — NurseOS opens in its own window",
      "Find it in your app menu",
      "Launch it like any other Linux app",
    ],
  },
};

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<Platform | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canAutoInstall, setCanAutoInstall] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Capture the beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanAutoInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall(platform: Platform) {
    // If browser supports auto-install (Chrome/Edge on Android/Windows/Linux/Mac)
    if (canAutoInstall && deferredPrompt && platform !== "ios") {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPlatform(null);
      }
      setDeferredPrompt(null);
      setCanAutoInstall(false);
    } else {
      // Show manual instructions dialog
      setInstallPlatform(platform);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-y-auto">
      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/nurseos-logo.png" alt="NurseOS" width={32} height={32} className="size-8 rounded-lg" priority />
            <span className="text-lg font-bold text-slate-900">NurseOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">About</Link>
            <Link href="/features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <a href="#download" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Download</a>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
            <Link href="/register">
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                Get Started
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3">
            <Link href="/about" className="block text-sm text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/features" className="block text-sm text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <a href="#download" className="block text-sm text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Download</a>
            <Link href="/login" className="block text-sm text-slate-600 py-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full bg-slate-900 text-white">Get Started</Button>
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              The operating system
              <br />
              for nursing care.
            </h1>
            <p className="text-lg text-slate-600 mt-6 max-w-xl mx-auto leading-relaxed">
              NurseOS brings together clinical tools, academic management, and professional development
              into one platform — for hospitals, universities, and nursing schools.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <a href="#download">
                <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto">
                  <Download className="size-4 mr-2" />
                  Download App
                </Button>
              </a>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300">
                  Get Started Free
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-400 mt-4">Free forever. Available on all devices.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Who is NurseOS for? ─── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Who is it for?</h2>
            <p className="text-slate-500 mt-2">One platform, built for every role in nursing.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <div className="p-8 rounded-2xl bg-white border border-slate-200 h-full">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Hospitals & Clinics</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  AI-powered charting, patient management, vitals tracking, medication orders, lab results,
                  referrals, and analytics — everything your clinical team needs in one place.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Patient records & smart charting</li>
                  <li>Drug interaction checking</li>
                  <li>Referrals & inter-facility consultations</li>
                  <li>Real-time analytics & disease surveillance</li>
                </ul>
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <div className="p-8 rounded-2xl bg-white border border-slate-200 h-full">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Universities & Schools of Nursing</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Lecturers upload course materials, students access them by level, Q&amp;A threads on each
                  material, level-targeted announcements, and cross-institution material sharing.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
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
            <h2 className="text-3xl font-bold text-slate-900">What&apos;s inside</h2>
            <p className="text-slate-500 mt-2">Five integrated modules, one seamless experience.</p>
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
                className="flex items-start gap-6 py-6 border-t border-slate-200 first:border-t-0"
              >
                <div className="text-sm font-mono text-slate-400 mt-0.5 w-6">0{i + 1}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{mod.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{mod.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Academic Institutions ─── */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for nursing education.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8">
              Institution admins manage lecturers and students. Lecturers upload materials by level.
              Students access only what&apos;s relevant to them. Everyone stays connected through
              announcements and Q&amp;A — all within their institution, fully isolated.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-sm font-medium text-slate-900">Institution Admin</p>
                <p className="text-xs text-slate-500 mt-1">Approve lecturers, view students by level, send announcements.</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-sm font-medium text-slate-900">Lecturer</p>
                <p className="text-xs text-slate-500 mt-1">Upload materials, schedule publishing, track analytics, answer Q&amp;A.</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <p className="text-sm font-medium text-slate-900">Student</p>
                <p className="text-xs text-slate-500 mt-1">View materials for your level, download, ask questions, get announcements.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Security & Trust ─── */}
      <section className="py-16 px-4 sm:px-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-sm font-medium text-slate-900">Data Isolated</p>
              <p className="text-xs text-slate-500 mt-1">Each facility and institution sees only their own data.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">NDPR & HIPAA Aligned</p>
              <p className="text-xs text-slate-500 mt-1">Built with privacy and compliance at the core.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Works Offline</p>
              <p className="text-xs text-slate-500 mt-1">Install on any device. Access without internet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD SECTION ─── */}
      <section id="download" className="py-24 px-4 sm:px-6 bg-slate-900 text-white scroll-mt-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Download NurseOS
            </h2>
            <p className="text-slate-400 mb-2">
              Install on your device for the best experience.
            </p>
            <p className="text-xs text-slate-500 mb-10">
              NurseOS is a Progressive Web App — install it like a native app on any platform. No app store needed.
            </p>

            {/* Platform download buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {(Object.keys(platformInfo) as Platform[]).map((platform) => {
                const info = platformInfo[platform];
                const Icon = info.icon;
                return (
                  <button
                    key={platform}
                    onClick={() => handleInstall(platform)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <Icon className="size-6 text-white group-hover:text-emerald-400 transition-colors" />
                    <span className="text-xs font-medium text-white">{info.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Download className="size-2.5" /> Install
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 mt-8">
              Works on Android, iPhone, iPad, Windows, Mac, and Linux.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Or use it in your browser.
            </h2>
            <p className="text-slate-500 mt-4">
              No download required. Sign up and start using NurseOS right away.
            </p>
            <Link href="/register" className="inline-block mt-8">
              <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
                Get Started Free
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-6">
              For hospitals, clinics, universities, and schools of nursing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/nurseos-logo.png" alt="NurseOS" width={24} height={24} className="size-6 rounded" />
            <span className="text-sm font-medium text-slate-600">NurseOS</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
            <Link href="/features" className="hover:text-slate-900 transition-colors">Features</Link>
            <a href="#download" className="hover:text-slate-900 transition-colors">Download</a>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} NurseOS — Developed by Wabi The Tech Nurse</p>
        </div>
      </footer>

      {/* ─── Install Instructions Dialog ─── */}
      <Dialog open={installPlatform !== null} onOpenChange={() => setInstallPlatform(null)}>
        {installPlatform && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = platformInfo[installPlatform].icon;
                  return <Icon className="size-5" />;
                })()}
                Install on {platformInfo[installPlatform].name}
              </DialogTitle>
              <DialogDescription>
                Follow these steps to install NurseOS on your {platformInfo[installPlatform].name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {platformInfo[installPlatform].steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <a href={typeof window !== "undefined" ? window.location.origin : "/"} target="_blank" rel="noopener noreferrer">
                <Button className="bg-slate-900 text-white hover:bg-slate-800 flex-1">
                  Open NurseOS
                </Button>
              </a>
              <Button variant="outline" onClick={() => setInstallPlatform(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
