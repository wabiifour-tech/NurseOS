'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  HelpCircle,
  MessageSquare,
  Send,
  Brain,
  Globe,
  BarChart3,
  Award,
  BookMarked,
  LayoutDashboard,
  Keyboard,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'

interface FAQItem {
  question: string
  answer: string
  category: string
}

interface QuickLink {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface KeyboardShortcut {
  category: string
  shortcuts: { keys: string; description: string }[]
}

export default function HelpSupportPage() {
  const { user } = useAuthStore()

  // Contact form state
  const [contactForm, setContactForm] = React.useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    subject: '',
    message: '',
  })
  const [isSending, setIsSending] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)

  // Expandable FAQ category filter
  const [activeCategory, setActiveCategory] = React.useState<string>('all')

  const faqItems: FAQItem[] = [
    {
      question: 'How do I add a new patient in NurseAI?',
      answer: 'Navigate to NurseAI > Patients from the sidebar, then click the "Add Patient" button in the top right. Fill in the required patient information including name, date of birth, and medical record number. The patient will appear in your active patient list immediately.',
      category: 'nurseai',
    },
    {
      question: 'How does Smart Charting work?',
      answer: 'Smart Charting uses AI to assist with clinical documentation. Navigate to NurseAI > Smart Charting, select a patient, and begin entering your notes. The AI will suggest completions, flag potential issues, and help format your notes according to standard nursing documentation practices. Always review AI suggestions before saving.',
      category: 'nurseai',
    },
    {
      question: 'How do I submit a referral through CareGrid?',
      answer: 'Go to CareGrid > Referrals and click "New Referral". Select the source and destination facilities, add patient details, include clinical notes, and set the urgency level. The referral will be sent to the receiving facility for review. You can track its status in the Referrals dashboard.',
      category: 'caregrid',
    },
    {
      question: 'Can I search for facilities in other states?',
      answer: 'Yes! CareGrid\'s Facility Directory allows you to search across all registered healthcare facilities by state, city, facility type, and available services. Use the filters on the Facilities page to narrow down your search.',
      category: 'caregrid',
    },
    {
      question: 'What analytics are available in NurseOS?',
      answer: 'NurseOS Analytics provides dashboards for patient analytics, staffing patterns, disease surveillance, and custom reports. You can view trends, generate reports, and set up automated alerts for key metrics. The Analytics module updates in near real-time from your clinical data.',
      category: 'analytics',
    },
    {
      question: 'How do I generate a custom report?',
      answer: 'Navigate to Analytics > Reports, then click "Generate Report". Select the report type, set your date range and filters, and choose your output format. Reports can be saved, downloaded as PDF, or shared with your team.',
      category: 'analytics',
    },
    {
      question: 'How do I track my CPD points?',
      answer: 'Go to NurseID > CPD Tracker to view and manage your Continuing Professional Development activities. You can log new activities, upload certificates, and track your progress toward annual CPD requirements. The tracker automatically calculates your total points.',
      category: 'nurseid',
    },
    {
      question: 'How do I verify a nurse\'s credentials?',
      answer: 'If you have verification privileges, navigate to NurseID > Credentials and search for the nurse by name or license number. You can view their verified credentials, certifications, and professional standing. Verification status is displayed with clear indicators.',
      category: 'nurseid',
    },
    {
      question: 'Are Academy courses accredited?',
      answer: 'Many Academy courses carry CPD accreditation. Each course listing clearly shows its accreditation status, approved CPD points, and the accrediting body. Upon successful completion of an accredited course, your CPD Tracker is automatically updated.',
      category: 'academy',
    },
    {
      question: 'How do I enroll in a simulation?',
      answer: 'Browse available simulations under Academy > Simulations. Each simulation lists its focus area, duration, and difficulty level. Click "Start Simulation" to begin. Simulations can be paused and resumed, and your performance is tracked for competency assessment.',
      category: 'academy',
    },
    {
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security and use the "Change Password" section. Enter your current password and your new password. Alternatively, you can use the "Forgot Password" link on the login page to reset via email.',
      category: 'account',
    },
    {
      question: 'Is my data secure in NurseOS?',
      answer: 'Absolutely. NurseOS employs industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We comply with healthcare data protection regulations including HIPAA and NDPR. Access controls ensure that only authorized personnel can view patient data. Visit Settings > Data & Privacy for more details on your data preferences.',
      category: 'account',
    },
  ]

  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'nurseai', label: 'NurseAI', icon: Brain },
    { id: 'caregrid', label: 'CareGrid', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'nurseid', label: 'NurseID', icon: Award },
    { id: 'academy', label: 'Academy', icon: BookMarked },
    { id: 'account', label: 'Account', icon: Users },
  ]

  const filteredFAQs = activeCategory === 'all'
    ? faqItems
    : faqItems.filter((faq) => faq.category === activeCategory)

  const quickLinks: QuickLink[] = [
    {
      title: 'NurseAI',
      description: 'Patient records, charting, vitals, medications & appointments',
      href: '/nurseai/patients',
      icon: Brain,
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'CareGrid',
      description: 'Facilities, referrals, consultations & knowledge bank',
      href: '/caregrid/facilities',
      icon: Globe,
      color: 'text-teal-600 bg-teal-500/10 border-teal-500/20',
    },
    {
      title: 'Analytics',
      description: 'Dashboards, reports, staffing & surveillance data',
      href: '/analytics',
      icon: BarChart3,
      color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'NurseID',
      description: 'Profile, credentials, portfolio & CPD tracking',
      href: '/nurseid/profile',
      icon: Award,
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Academy',
      description: 'Courses, simulations, learning paths & certificates',
      href: '/academy/courses',
      icon: BookMarked,
      color: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
    },
    {
      title: 'Dashboard',
      description: 'Overview of all NurseOS modules and recent activity',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
    },
  ]

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      category: 'Navigation',
      shortcuts: [
        { keys: 'Ctrl + K', description: 'Open quick search' },
        { keys: 'Ctrl + B', description: 'Toggle sidebar' },
        { keys: 'Ctrl + 1', description: 'Go to Dashboard' },
        { keys: 'Ctrl + 2', description: 'Go to NurseAI' },
        { keys: 'Ctrl + 3', description: 'Go to CareGrid' },
        { keys: 'Ctrl + 4', description: 'Go to Analytics' },
        { keys: 'Ctrl + 5', description: 'Go to NurseID' },
        { keys: 'Ctrl + 6', description: 'Go to Academy' },
      ],
    },
    {
      category: 'NurseAI',
      shortcuts: [
        { keys: 'Ctrl + N', description: 'New patient note' },
        { keys: 'Ctrl + Shift + V', description: 'Record vitals' },
        { keys: 'Ctrl + Shift + M', description: 'Add medication' },
        { keys: 'Ctrl + Shift + A', description: 'New appointment' },
      ],
    },
    {
      category: 'General',
      shortcuts: [
        { keys: 'Ctrl + S', description: 'Save current form' },
        { keys: 'Ctrl + /', description: 'Show keyboard shortcuts' },
        { keys: 'Ctrl + ,', description: 'Open Settings' },
        { keys: 'Ctrl + Shift + ?', description: 'Open Help & Support' },
        { keys: 'Esc', description: 'Close dialog or modal' },
      ],
    },
  ]

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactForm.name.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!contactForm.email.trim()) {
      toast.error('Please enter your email')
      return
    }
    if (!contactForm.subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!contactForm.message.trim()) {
      toast.error('Please enter your message')
      return
    }

    setIsSending(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSending(false)
    setIsSent(true)
    toast.success('Your message has been sent. We will respond within 24 hours.')

    // Reset after showing success
    setTimeout(() => {
      setIsSent(false)
      setContactForm({
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    }, 3000)
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <HelpCircle className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Get help with NurseOS</p>
        </div>
      </div>

      <Separator />

      {/* Quick Help Banner */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20">
              <Lightbulb className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Need quick help?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse our FAQ below, contact support, or use keyboard shortcut{' '}
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border rounded shadow-sm">Ctrl + /</kbd>{' '}
                to find what you need.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> support@nurseos.com
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> 24hr response
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-emerald-600" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>Find answers to common questions about NurseOS</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeCategory === cat.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-background text-muted-foreground border-border hover:border-emerald-500/30 hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3" />
                  {cat.label}
                  {activeCategory === cat.id && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 h-4 px-1.5 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    >
                      {filteredFAQs.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* FAQ Accordion */}
          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-sm text-left hover:no-underline hover:text-emerald-600">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-3.5 text-emerald-500 shrink-0" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-5.5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-8 text-center">
              <HelpCircle className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No FAQs found for this category.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Support Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600" />
            <CardTitle>Contact Support</CardTitle>
          </div>
          <CardDescription>Can&apos;t find what you&apos;re looking for? Send us a message</CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="size-12 text-emerald-500" />
              <h3 className="text-lg font-semibold">Message Sent!</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Thank you for reaching out. Our support team will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your full name"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="your@email.com"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-subject" className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  id="contact-subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-xs text-muted-foreground">Message</Label>
                <Textarea
                  id="contact-message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  We typically respond within 24 hours on business days.
                </p>
                <Button
                  type="submit"
                  disabled={isSending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSending ? (
                    <><Loader2 className="size-4 mr-1 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="size-4 mr-1" /> Send Message</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Quick Links Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ExternalLink className="size-5 text-emerald-600" />
            <CardTitle>Quick Links</CardTitle>
          </div>
          <CardDescription>Jump to key areas of NurseOS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon
              const colorClasses = link.color.split(' ')
              return (
                <Link key={link.href} href={link.href}>
                  <Card className="hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex size-9 items-center justify-center rounded-lg border ${colorClasses.join(' ')}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">{link.title}</h3>
                            <ChevronRight className="size-3.5 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{link.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="size-5 text-emerald-600" />
            <CardTitle>Keyboard Shortcuts</CardTitle>
          </div>
          <CardDescription>Speed up your workflow with keyboard shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {keyboardShortcuts.map((group, groupIndex) => (
              <div key={group.category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.category}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.split(' + ').map((key, i, arr) => (
                          <React.Fragment key={i}>
                            <kbd className="px-2 py-1 text-[11px] font-mono bg-muted border border-border rounded shadow-sm min-w-[24px] text-center">
                              {key}
                            </kbd>
                            {i < arr.length - 1 && (
                              <span className="text-[10px] text-muted-foreground">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {groupIndex < keyboardShortcuts.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="mt-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Pro Tip</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-background border rounded shadow-sm">Ctrl + /</kbd> anywhere in NurseOS to quickly access the keyboard shortcuts reference.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer spacer */}
      <div className="h-4" />
    </div>
  )
}
