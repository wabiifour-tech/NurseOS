import Link from 'next/link'
import Image from 'next/image'
import { Scale, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'NDPR Compliance — NurseOS',
  description: 'NurseOS compliance with the Nigeria Data Protection Regulation (NDPR).',
}

export default function NDPRCompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/nurseos-logo.png"
                alt="NurseOS"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                NurseOS
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <Scale className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">NDPR Compliance</h1>
            <p className="text-sm text-muted-foreground">Nigeria Data Protection Regulation — Last updated: March 2025</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Our Commitment to NDPR Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS is fully committed to complying with the Nigeria Data Protection Regulation (NDPR), which was issued in January 2019 pursuant to Section 6(a) of the National Information Technology Development Agency (NITDA) Act 2007. The NDPR establishes a comprehensive framework for the protection of personal data in Nigeria, and as a healthcare technology platform operating primarily in the Nigerian market, we recognize our heightened responsibility to safeguard personal and health data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This page explains how NurseOS aligns its data processing activities with the requirements of the NDPR and the Nigeria Data Protection Act 2023 (NDPA), which further strengthened data protection in Nigeria. We have appointed a Data Protection Officer (DPO) and established comprehensive data protection policies and procedures to ensure ongoing compliance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Lawful Basis for Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under the NDPR and NDPA, personal data must be processed on a lawful basis. NurseOS processes personal data under the following lawful bases: Consent — where the data subject has given clear and informed consent for specific processing activities; Contractual necessity — where processing is necessary for the performance of a contract to which the data subject is a party; Legal obligation — where processing is necessary for compliance with a legal obligation, including healthcare record-keeping requirements; and Legitimate interest — where processing is necessary for the legitimate interests of NurseOS, provided such interests are not overridden by the rights and freedoms of the data subject.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For clinical and health data specifically, processing is carried out under the lawful basis of providing healthcare services, which is recognized as a legitimate and necessary purpose under both the NDPR and the National Health Act 2014.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Subject Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with the NDPR and NDPA, NurseOS recognizes and respects the following rights of data subjects: the right to be informed about the collection and use of their personal data; the right of access to their personal data held by NurseOS; the right to rectification of inaccurate or incomplete personal data; the right to erasure (&quot;right to be forgotten&quot;) subject to legal retention requirements; the right to restrict processing in certain circumstances; the right to data portability, allowing data subjects to receive their data in a structured, commonly used, and machine-readable format; and the right to object to processing for direct marketing purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To exercise any of these rights, data subjects may contact our Data Protection Officer at privacy@nurseos.com. We will respond to all requests within 30 days as required by the NDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Processing Safeguards</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS implements appropriate technical and organizational measures to ensure the security of personal data, including: encryption of all personal data at rest using AES-256 encryption; encryption of all data in transit using TLS 1.3; role-based access controls that limit data access to authorized personnel with a legitimate need; multi-factor authentication for all user accounts; regular security audits and vulnerability assessments; employee training on data protection obligations; and data minimization principles ensuring we only collect and process data that is necessary for the stated purpose.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We also maintain a data processing register as required by the NDPR, documenting all categories of personal data processed, the purposes of processing, data retention periods, and the security measures applied to each category.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Cross-Border Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS may process personal data outside of Nigeria through our cloud infrastructure providers. In accordance with the NDPR, we ensure that any cross-border transfer of personal data is made only to jurisdictions that provide an adequate level of data protection, or with appropriate safeguards including standard contractual clauses approved by NITDA. We conduct due diligence on all data processors and sub-processors to ensure they meet the data protection standards required by the NDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Breach Notification</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a personal data breach, NurseOS will notify the National Information Technology Development Agency (NITDA) within 72 hours of becoming aware of the breach, as required by the NDPR. Where the breach is likely to result in a high risk to the rights and freedoms of data subjects, we will also communicate the breach to affected individuals without undue delay. Our incident response plan includes procedures for containment, assessment, notification, and remediation of data breaches.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Protection Impact Assessments</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS conducts Data Protection Impact Assessments (DPIAs) for any new processing activities that are likely to result in a high risk to the rights and freedoms of data subjects. Given the sensitive nature of health data processed on our platform, we conduct DPIAs as a standard practice for all major feature releases and system changes. DPIA results are documented and reviewed by our Data Protection Officer before any new processing activity commences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any questions about our NDPR compliance or to exercise your data subject rights, please contact our Data Protection Officer:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-3">
              <p className="text-muted-foreground"><strong className="text-foreground">NurseOS Data Protection Officer</strong></p>
              <p className="text-muted-foreground">Email: privacy@nurseos.com</p>
              <p className="text-muted-foreground">WhatsApp: +234 705 235 6638</p>
              <p className="text-muted-foreground mt-2">You may also lodge a complaint with NITDA through their official channels if you believe your data protection rights have been violated.</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} NurseOS — Developed by Wabi The Tech Nurse
          </p>
        </div>
      </footer>
    </div>
  )
}
