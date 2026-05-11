"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Brain, Globe, BarChart3, Award, BookMarked,
  ArrowRight, Check, Users, Activity,
  Shield, Zap, ChevronDown, Menu, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const modules = [
  {
    icon: Brain,
    title: "NurseAI",
    subtitle: "Intelligent Clinical Assistant",
    description: "AI-powered smart charting, clinical decision support, early warning scoring, and drug interaction checking. Transform how nurses document care with voice-to-note technology and real-time clinical intelligence.",
    features: ["Voice-to-Note Smart Charting", "NEWS2 Early Warning System", "Drug Interaction Checker", "AI Care Plan Suggestions", "Discharge Summary Generator"],
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Globe,
    title: "CareGrid",
    subtitle: "Global Nursing Network",
    description: "Connect nurses and facilities across borders with seamless referral management, nurse-to-nurse consultations, and a shared knowledge bank. Build the network that African healthcare deserves.",
    features: ["Facility Directory & Search", "Referral Management Pipeline", "Video & Chat Consultations", "Evidence-Based Knowledge Bank", "Nurse Directory & Profiles"],
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    icon: BarChart3,
    title: "NurseAnalytics",
    subtitle: "Healthcare Intelligence",
    description: "Turn data into decisions with real-time dashboards, disease surveillance, predictive staffing, and AI-generated insights. See the full picture of healthcare delivery across facilities and regions.",
    features: ["Real-Time Facility Dashboards", "Disease Surveillance & Alerts", "Predictive Staffing AI", "Clinical Outcomes Tracking", "Custom Report Builder"],
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: Award,
    title: "NurseID",
    subtitle: "Professional Identity",
    description: "Build and showcase your nursing career with verified credentials, competency mapping, portfolio building, and continuous professional development tracking. Your career, verified and portable.",
    features: ["Verified Credential System", "Competency Mapping & Radar", "Professional Portfolio", "CPD Points Tracker", "Blockchain Verification"],
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: BookMarked,
    title: "NurseAcademy",
    subtitle: "Learning & Simulation",
    description: "Learn, practice, and certify with AI-powered courses, clinical simulations, and competency-based certifications. From student to specialist — your learning journey, powered by intelligence.",
    features: ["Interactive Course Platform", "Clinical Scenario Simulations", "AI-Powered Feedback", "CPD-Certified Programs", "Competency Certifications"],
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
];

const stats = [
  { value: "5", label: "Integrated Modules", icon: Activity },
  { value: "7,000+", label: "Patients Served (RUHC HMS)", icon: Users },
  { value: "1", label: "Nurse-Led Founder", icon: Heart },
  { value: "24/7", label: "Designed for Round-the-Clock Care", icon: Shield },
  { value: "100%", label: "Nurse-First Design", icon: Zap },
  { value: "NG", label: "Starting Market", icon: Globe },
];

const pricingTiers = [
  {
    name: "Free",
    target: "Individual Nurses",
    price: "₦0",
    period: "forever",
    description: "Get started with essential nursing tools",
    features: [
      "NurseID Professional Profile",
      "Knowledge Bank Access",
      "3 Simulations per Month",
      "Basic Smart Charting",
      "Community Support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Facility Starter",
    target: "Small Facilities (1-25 beds)",
    price: "₦50,000",
    period: "/month",
    description: "Full clinical tools for your facility",
    features: [
      "Full NurseAI Module",
      "CareGrid Referrals",
      "Basic Analytics Dashboard",
      "10 Nurse Seats",
      "Email Support",
      "Offline Mode",
    ],
    cta: "Start Trial",
    popular: true,
  },
  {
    name: "Facility Pro",
    target: "Medium Facilities (25-100 beds)",
    price: "₦150,000",
    period: "/month",
    description: "Advanced intelligence for growing facilities",
    features: [
      "All Starter Features",
      "Advanced Analytics & AI Insights",
      "Disease Surveillance",
      "Predictive Staffing",
      "50 Nurse Seats",
      "Priority Support",
      "Custom Reports",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

// Pre-computed particle positions to avoid hydration mismatch with Math.random()
const HERO_PARTICLES = [
  { left: 12.5, top: 23.7, duration: 5.2, delay: 0.3 },
  { left: 45.8, top: 67.3, duration: 4.8, delay: 1.1 },
  { left: 78.2, top: 15.9, duration: 6.1, delay: 0.7 },
  { left: 33.6, top: 82.4, duration: 3.9, delay: 1.8 },
  { left: 91.4, top: 45.2, duration: 5.5, delay: 0.1 },
  { left: 7.3, top: 56.8, duration: 4.3, delay: 1.4 },
  { left: 62.1, top: 34.6, duration: 6.7, delay: 0.9 },
  { left: 28.9, top: 71.2, duration: 3.6, delay: 1.6 },
  { left: 85.7, top: 88.1, duration: 5.8, delay: 0.5 },
  { left: 51.3, top: 9.4, duration: 4.1, delay: 1.2 },
  { left: 19.7, top: 48.6, duration: 6.3, delay: 0.8 },
  { left: 73.5, top: 62.9, duration: 3.4, delay: 1.9 },
  { left: 40.2, top: 17.5, duration: 5.1, delay: 0.4 },
  { left: 95.8, top: 73.8, duration: 4.7, delay: 1.0 },
  { left: 14.1, top: 91.3, duration: 6.5, delay: 0.6 },
  { left: 58.6, top: 26.7, duration: 3.8, delay: 1.5 },
  { left: 82.4, top: 54.2, duration: 5.3, delay: 0.2 },
  { left: 36.9, top: 38.5, duration: 4.5, delay: 1.3 },
  { left: 69.7, top: 79.6, duration: 6.9, delay: 0.7 },
  { left: 23.8, top: 5.9, duration: 3.7, delay: 1.7 },
];

const CTA_PARTICLES = [
  { left: 15.3, top: 28.7, duration: 4.2, delay: 0.5 },
  { left: 72.8, top: 12.4, duration: 3.8, delay: 1.2 },
  { left: 43.1, top: 85.6, duration: 4.9, delay: 0.3 },
  { left: 88.6, top: 47.2, duration: 3.5, delay: 1.8 },
  { left: 6.4, top: 63.9, duration: 4.6, delay: 0.9 },
  { left: 56.2, top: 31.5, duration: 3.2, delay: 1.4 },
  { left: 34.7, top: 91.3, duration: 4.8, delay: 0.7 },
  { left: 81.9, top: 18.6, duration: 3.9, delay: 1.1 },
  { left: 21.5, top: 54.8, duration: 4.4, delay: 0.4 },
  { left: 67.3, top: 76.1, duration: 3.6, delay: 1.6 },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                NurseOS
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#features" className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#pricing" className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </a>
                <Link href="/about" className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <div className="pt-2 space-y-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      Get Started <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background - No nurse image, pure gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950" />
        {/* Decorative grid pattern instead of unknown person image */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-emerald-950/60" />

        {/* Floating particles - using pre-computed positions */}
        {mounted && (
          <div className="absolute inset-0 overflow-hidden">
            {HERO_PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Built by a Nurse. For the World.
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Operating System
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              for Global Nursing Care
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-emerald-100/80 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            NurseOS is an AI-powered, cloud-native, modular platform designed to digitize,
            connect, and elevate nursing practice globally — starting from Nigeria. Five
            integrated modules. One unified ecosystem.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-2xl shadow-emerald-500/30 text-base px-8 h-12"
              >
                Start Building <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-100 text-base px-8 h-12"
              >
                Explore Features
              </Button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-4 text-emerald-300/60 text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> HIPAA Aligned</span>
            <span className="text-emerald-600">&bull;</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Offline-First</span>
            <span className="text-emerald-600">&bull;</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Multilingual</span>
            <span className="text-emerald-600">&bull;</span>
            <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> AI-Powered</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-emerald-400/50" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-200 dark:border-emerald-800">
              Five Integrated Modules
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              One Platform. Complete Care.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each module works independently but integrates seamlessly through a unified platform —
              creating an ecosystem that transforms nursing practice at every level.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="space-y-8"
          >
            {modules.map((mod, index) => (
              <motion.div key={mod.title} variants={staggerItem}>
                <Card className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow ${mod.bgColor}`}>
                  <CardContent className="p-6 sm:p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className={index % 2 === 1 ? "md:order-2" : ""}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-4 shadow-lg`}>
                          <mod.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">{mod.title}</h3>
                        <p className="text-sm font-medium text-muted-foreground mb-3">{mod.subtitle}</p>
                        <p className="text-muted-foreground leading-relaxed mb-4">{mod.description}</p>
                        <Link href="/register">
                          <Button variant="outline" size="sm" className="group">
                            Learn more <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                      <div className={index % 2 === 1 ? "md:order-1" : ""}>
                        <div className="grid grid-cols-1 gap-2">
                          {mod.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2.5 text-sm">
                              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0`}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-200 dark:border-emerald-800">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Start Free. Scale When Ready.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From individual nurses to national health systems — NurseOS grows with you.
              All prices in Nigerian Naira.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {pricingTiers.map((tier) => (
              <motion.div key={tier.name} variants={staggerItem}>
                <Card className={`relative h-full ${tier.popular ? "border-emerald-500 border-2 shadow-xl shadow-emerald-500/10" : "border-border"}`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-3 py-0.5">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground">{tier.target}</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                      <span className="text-muted-foreground text-sm">{tier.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/register" className="block">
                      <Button
                        className={`w-full ${
                          tier.popular
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                            : ""
                        }`}
                        variant={tier.popular ? "default" : "outline"}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Need Enterprise or National deployment? <a href="https://wa.me/2347052356638" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium">Contact our team</a> for custom pricing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 relative overflow-hidden">
        {mounted && (
          <div className="absolute inset-0">
            {CTA_PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-emerald-400/20 rounded-full"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div {...fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Nursing Care?
            </h2>
            <p className="text-lg text-emerald-200/80 mb-8 max-w-2xl mx-auto">
              Be the first to shape the future of nursing care in Africa.
              Start free today — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 shadow-2xl text-base px-8 h-12"
                >
                  Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10 text-base px-8 h-12"
                >
                  View Full Features
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  NurseOS
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Operating System for Global Nursing Care. Built by a Nurse. For the World.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">NurseAI</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">CareGrid</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">NurseAnalytics</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">NurseID</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">NurseAcademy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast.info('Privacy Policy page coming soon') }} className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast.info('Terms of Service page coming soon') }} className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast.info('NDPR Compliance page coming soon') }} className="hover:text-foreground transition-colors">NDPR Compliance</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast.info('HIPAA Notice page coming soon') }} className="hover:text-foreground transition-colors">HIPAA Notice</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} NurseOS — Developed by Wabi The Tech Nurse
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 mr-1" /> HIPAA Aligned
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                <Heart className="w-3 h-3 mr-1" /> Nurse-Led
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
