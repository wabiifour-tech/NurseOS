"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const plans = [
  {
    name: "Individual",
    target: "Nurses, Students & Lecturers",
    features: [
      "All 5 modules included",
      "Course materials upload & download",
      "Q&A on materials",
      "Announcements",
      "NurseID profile & credentials",
      "NurseAcademy courses",
    ],
  },
  {
    name: "Facility / Institution",
    target: "Hospitals, Clinics, Universities",
    features: [
      "Everything in Individual",
      "Facility-scoped data isolation",
      "Worker/student management",
      "Lecturer approval workflow",
      "Cross-facility referrals",
      "Analytics & disease surveillance",
      "Unlimited users",
    ],
  },
];

export default function PricingPageClient() {
  return (
    <div className="min-h-screen bg-white pt-20 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div {...fadeUp}>
          <p className="text-sm font-medium text-emerald-600 mb-3 tracking-wide">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Free forever.</h1>
          <p className="text-lg text-slate-600 mt-4 max-w-xl mx-auto">
            NurseOS is free for everyone — individual nurses, students, lecturers,
            hospitals, and institutions. No paid plans. No trials. No hidden fees.
          </p>
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
            <Heart className="size-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">Built by a nurse, free for all nurses.</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mt-12 text-left">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} {...fadeUp} transition={{ delay: 0.1 * (i + 1) }}>
              <Card className="h-full border-slate-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.target}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-4">₦0</p>
                  <p className="text-xs text-slate-400">forever</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/register">
            <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
              Get Started Free
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-slate-400 mt-4">Sign up with Google. Pick your role. Start in 2 minutes.</p>
        </div>
      </div>
    </div>
  );
}
