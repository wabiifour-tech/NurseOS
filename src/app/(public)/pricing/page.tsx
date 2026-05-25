"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HelpCircle,
  Sparkles,
  MessageCircle,
  Building2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const tiers = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    description: "For individual nurses getting started with digital tools.",
    who: "Individual nurses, nursing students",
    features: [
      "Basic NurseAI access (10 queries/day)",
      "Personal scheduling (CareGrid Lite)",
      "Up to 5 patient profiles",
      "Community support forum",
      "Basic analytics dashboard",
      "NurseAcademy free courses",
    ],
    notIncluded: [
      "NurseID verification",
      "Predictive analytics",
      "Custom integrations",
      "Priority support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Facility Starter",
    price: "₦50K",
    period: "/month",
    description: "For small clinics and health centers ready to digitize operations.",
    who: "Small clinics, health centers, private practices",
    features: [
      "Full NurseAI suite (unlimited queries)",
      "CareGrid scheduling for up to 20 staff",
      "Up to 50 nurse accounts",
      "NurseID verification included",
      "Standard analytics & reporting",
      "NurseAcademy basic courses",
      "Email support (24hr response)",
      "Data export (CSV)",
    ],
    notIncluded: [
      "Predictive analytics",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Start Facility Plan",
    popular: false,
  },
  {
    name: "Pro",
    price: "₦150K",
    period: "/month",
    description: "For hospitals and large facilities needing full platform power.",
    who: "Hospitals, specialist centers, large clinics",
    features: [
      "All Starter features, plus:",
      "NurseAnalytics full access",
      "NurseAcademy premium courses & CEUs",
      "Unlimited nurse accounts",
      "Predictive analytics engine",
      "Priority support (4hr response)",
      "Custom integrations (EMR, HR)",
      "Advanced data export (API)",
      "Multi-department management",
      "Custom reporting dashboards",
    ],
    notIncluded: [
      "Dedicated account manager",
      "White-label option",
    ],
    cta: "Start Pro Plan",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For health systems, governments, and multi-facility organizations.",
    who: "Health systems, government agencies, NGOs",
    features: [
      "All Pro features, plus:",
      "Dedicated account manager",
      "Custom AI model training",
      "Multi-facility management",
      "SLA guarantee (99.9%)",
      "On-premise deployment option",
      "Full API access",
      "White-label branding option",
      "Custom compliance workflows",
      "Volume discounts",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can explore the full feature set before committing.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bank transfers, card payments (Visa, Mastercard), and mobile money. For Enterprise customers, we also support purchase orders and invoicing.",
  },
  {
    q: "Is my data secure?",
    a: "Patient and nurse data is encrypted at rest and in transit using AES-256 encryption. We're HIPAA-aware, comply with Nigeria's NDPR, and undergo regular third-party security audits.",
  },
  {
    q: "Does NurseOS work offline?",
    a: "Yes. Core features of NurseAI, CareGrid, and NurseID work offline with automatic sync when connectivity is restored. This is critical for facilities with unreliable internet.",
  },
  {
    q: "Can NurseOS integrate with our existing EMR?",
    a: "Pro and Enterprise plans include integration capabilities. We support HL7 FHIR, REST APIs, and have pre-built connectors for popular EMR systems used across Africa.",
  },
  {
    q: "How does NurseID verification work?",
    a: "NurseID integrates directly with nursing councils and licensing boards for real-time verification. We also partner with background check providers for comprehensive screening.",
  },
  {
    q: "Is training included?",
    a: "All plans include access to NurseAcademy's onboarding courses. Pro and Enterprise plans include live onboarding sessions and dedicated training for your team.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              Simple Pricing
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Plans That Scale
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                With You
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100/70 max-w-2xl mx-auto">
              From individual nurses to government health systems — there&apos;s a NurseOS plan for every stage
              of your journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {tiers.map((tier, i) => (
              <FadeIn key={tier.name} delay={i * 0.1}>
                <Card
                  className={`h-full relative ${
                    tier.popular
                      ? "ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                      : ""
                  } transition-all hover:shadow-lg`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 px-3 py-0.5">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Best for</p>
                      <p className="text-sm text-foreground">{tier.who}</p>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2.5 mb-4">
                      {tier.features.map((f) => (
                        <div key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </div>
                      ))}
                      {tier.notIncluded.map((f) => (
                        <div key={f} className="flex items-start gap-2 text-sm opacity-40">
                          <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center text-xs">—</span>
                          <span className="text-muted-foreground line-through">{f}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href="/register" className="w-full">
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
                  </CardFooter>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Note */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Not sure which plan is right for you?</span>
            </div>
            <p className="text-muted-foreground mb-6">
              All paid plans include a 14-day free trial. No credit card required. Switch plans anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.open('https://wa.me/2347052356638', '_blank')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Talk to Sales
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about NurseOS pricing and plans.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/50 rounded-xl px-6 data-[state=open]:border-emerald-500/30 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <Image
              src="/nurseos-logo.png"
              alt="NurseOS"
              width={56}
              height={56}
              className="w-14 h-14 rounded-2xl mx-auto mb-6 shadow-xl shadow-emerald-500/20"
            />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Start Your{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Free Trial
              </span>{" "}
              Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the healthcare revolution. 14 days free, no credit card required. Cancel anytime.
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
