import Link from 'next/link'
import Image from 'next/image'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — NurseOS',
  description: 'NurseOS Privacy Policy — How we collect, use, and protect your healthcare data.',
}

export default function PrivacyPolicyPage() {
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
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: March 2025</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting the privacy and security of all individuals whose personal and health data we process. This Privacy Policy describes how NurseOS collects, uses, discloses, and safeguards your information when you use our platform, including our web application, mobile application, and related services (collectively, the &quot;Service&quot;). This policy applies to all users of the Service, including nurses, healthcare facility administrators, patients, and other healthcare professionals.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">2.1 Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect personal information that you voluntarily provide to us when you register on the platform, including your full name, email address, phone number, professional license number, country, state of origin, and other identifying information necessary for account creation and verification.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">2.2 Health and Clinical Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              As a healthcare platform, we process clinical and health-related data including patient demographics, vital signs, medical records, nursing assessments, care plans, medication orders, laboratory results, and clinical notes. This data is entered by authorized healthcare professionals as part of routine clinical documentation and care delivery.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">2.3 Professional Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect professional information including nursing credentials, certifications, competencies, continuing professional development (CPD) records, and employment history through our NurseID module. This information supports credential verification and professional portfolio management.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">2.4 Usage and Technical Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect certain information when you access the Service, including your IP address, browser type, operating system, device identifiers, pages visited, time spent on pages, and links clicked. We also collect data about your interactions with AI-powered features, including queries submitted and suggestions accepted or rejected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect for the following purposes: providing and maintaining the Service, including clinical documentation, referral management, analytics, and educational features; verifying professional credentials and identity; facilitating secure communication between healthcare professionals; generating AI-powered clinical decision support and smart charting; analyzing platform usage to improve our services and develop new features; complying with legal obligations and regulatory requirements; sending you important notifications about your account, subscription, and security updates; and providing customer support and responding to your inquiries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share your information in the following circumstances: with other authorized users within your healthcare facility who have appropriate access permissions; with receiving facilities when you initiate a patient referral through the CareGrid module; with professional verification bodies when you request credential verification; with service providers who perform services on our behalf, subject to strict data protection agreements; when required by law, regulation, or legal process; and in connection with a merger, acquisition, or sale of assets, with appropriate protections for your data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              All data sharing is governed by role-based access controls and the principle of minimum necessary access. Healthcare professionals only access patient data for patients under their direct care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. Clinical and health data is retained in accordance with applicable healthcare records retention laws and regulations, which may require retention for periods of up to 10 years or more depending on the jurisdiction. When you request account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law. De-identified and aggregated data may be retained indefinitely for research and analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Patient Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Patients (or their authorized representatives) have the right to: access their health records maintained on the platform; request corrections to inaccurate or incomplete health information; request restrictions on certain uses and disclosures of their health information; receive an accounting of disclosures of their health information; request that their data be deleted, subject to legal retention requirements; and be informed of any data breach that affects their personal health information. To exercise these rights, patients should contact their healthcare facility or reach out to us directly through the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption at rest and in transit (AES-256 and TLS 1.3), role-based access controls, multi-factor authentication, regular security audits and penetration testing, and continuous monitoring for unauthorized access. Despite our best efforts, no method of electronic transmission or storage is 100% secure. We strive to use commercially acceptable means to protect your data but cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-3">
              <p className="text-muted-foreground"><strong className="text-foreground">NurseOS Data Protection Officer</strong></p>
              <p className="text-muted-foreground">Email: privacy@nurseos.com</p>
              <p className="text-muted-foreground">WhatsApp: +234 705 235 6638</p>
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
