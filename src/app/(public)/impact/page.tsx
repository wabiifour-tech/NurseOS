export const metadata = {
  title: 'Impact — NurseOS',
  description: 'The vision, mission, and roadmap behind NurseOS — the operating system for nursing care.',
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const roadmap = [
  {
    phase: 'Phase 1 — Foundation (2025-2026)',
    status: 'Complete',
    items: [
      '5 integrated modules: NurseAI, CareGrid, NurseAnalytics, NurseID, NurseAcademy',
      'Academic module for universities and schools of nursing',
      'PWA — installable on Android, iOS, Windows, Mac, Linux',
      'Real-time notifications and device push',
      'Top 20 — Next Nurse Reality Docuseries',
    ],
  },
  {
    phase: 'Phase 2 — Scale (2026-2027)',
    status: 'In Progress',
    items: [
      'Onboard 100+ healthcare facilities across Nigeria',
      'Partner with 10+ universities and schools of nursing',
      'Launch in 5 additional African countries',
      'Offline-first mode for rural areas with unreliable internet',
      'Multi-language support (Hausa, Yoruba, Igbo, French)',
    ],
  },
  {
    phase: 'Phase 3 — Intelligence (2027-2028)',
    status: 'Planned',
    items: [
      'AI-powered clinical decision support trained on African health data',
      'Predictive disease outbreak detection across regions',
      'Automated nursing care plan generation',
      'Voice-to-note charting in local languages',
      'Integration with national health information systems',
    ],
  },
  {
    phase: 'Phase 4 — Global (2028+)',
    status: 'Vision',
    items: [
      'Expand to 20+ countries across Africa, Southeast Asia, and Latin America',
      'Open API for third-party healthcare integrations',
      'NurseOS certification program — verified digital nursing competencies',
      'Research partnerships with global nursing schools',
      'Nurse innovation fund — supporting nurse-led tech solutions',
    ],
  },
]

export default function ImpactPage() {
  return (
    <div className="min-h-screen bg-white pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-emerald-600 mb-3 tracking-wide">Impact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Nursing is Beyond the Bedside.
          </h1>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            NurseOS exists to prove that nurses are not just care providers — they are
            innovators, builders, and leaders who can transform healthcare through technology.
          </p>
        </div>

        {/* Vision */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Vision</h2>
          <p className="text-slate-600 leading-relaxed">
            A world where every nurse — regardless of location, facility, or resources — has access to
            world-class technology that amplifies their care, elevates their profession, and connects them
            to a global network of peers. A world where the technology serving nursing is built by nurses
            who understand the challenges firsthand.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            To build the operating system for nursing care — unifying clinical tools, academic management,
            professional development, and healthcare intelligence into a single, accessible platform.
            Starting in Nigeria, designed for the world. Free for every nurse, every facility, every institution.
          </p>
        </section>

        {/* Innovation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Innovation</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              NurseOS is not another healthcare app built by tech entrepreneurs who have never touched a patient.
              It is built by Wabi — a Registered Nurse, BLS Provider, Full Stack Web Developer, AI Engineer,
              Data Analyst, and presentation developer. This intersection of clinical practice and engineering
              is what makes NurseOS fundamentally different.
            </p>
            <p>
              Every feature exists because a nurse needed it. Every workflow was designed by someone who has
              stood at a bedside. Every module solves a real problem — not a hypothetical one imagined in a
              boardroom.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Nurse-Built</p>
                <p className="text-xs text-slate-500 mt-1">Designed by a nurse who codes, not an engineer who guesses.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Academic + Clinical</p>
                <p className="text-xs text-slate-500 mt-1">One platform for hospitals AND universities. No one else does both.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Free Forever</p>
                <p className="text-xs text-slate-500 mt-1">No paywalls. No trials. Healthcare access should not depend on budget.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Roadmap</h2>
          <div className="space-y-6">
            {roadmap.map((phase, i) => (
              <div key={i} className="border-l-2 border-slate-200 pl-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">{phase.phase}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    phase.status === 'Complete' ? 'bg-emerald-100 text-emerald-700' :
                    phase.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {phase.status}
                  </span>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-slate-300 mt-1">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Recognition */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Recognition</h2>
          <div className="p-6 rounded-2xl bg-slate-900 text-white">
            <p className="text-sm text-slate-400 mb-1">June 2026</p>
            <h3 className="text-xl font-semibold mb-2">Top 20 — Next Nurse Reality Docuseries</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              NurseOS was selected as a Top 20 finalist in the Next Nurse Reality Docuseries,
              recognizing nursing innovation that goes beyond the bedside. This recognition
              validates the vision that nurses can be builders, innovators, and technology leaders.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pt-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Be part of the journey.
          </h2>
          <p className="text-slate-500 mb-8">
            Free forever. Built by a nurse. For the world.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800">
              Get Started
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
