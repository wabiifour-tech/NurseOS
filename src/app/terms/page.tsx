import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — NurseOS',
  description: 'NurseOS Terms of Service — Your responsibilities and our commitments.',
}

export default function TermsOfServicePage() {
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
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: March 2025</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of NurseOS, including our web application, mobile application, APIs, and related services (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and NurseOS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. User Responsibilities</h2>
            <h3 className="text-lg font-medium text-foreground mb-2">2.1 Account Registration</h3>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate, current, and complete information during registration and keep your account information updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must immediately notify NurseOS of any unauthorized use of your account. You must not share your account credentials with any third party.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">2.2 Professional Conduct</h3>
            <p className="text-muted-foreground leading-relaxed">
              As a healthcare platform, users are expected to adhere to the highest standards of professional conduct. You agree to use the Service only for lawful healthcare-related purposes and in compliance with all applicable laws, regulations, and professional standards. You must not enter false, misleading, or fabricated clinical data. You must maintain the confidentiality of patient information and only access records of patients under your direct care or with proper authorization.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">2.3 Acceptable Use</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to: use the Service for any purpose that is unlawful or prohibited by these Terms; attempt to gain unauthorized access to any part of the Service or any systems connected to the Service; interfere with or disrupt the integrity or performance of the Service; attempt to reverse engineer, decompile, or disassemble any component of the Service; use automated tools or bots to access the Service without prior written consent; or use the Service to transmit any malware, viruses, or harmful code.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Medical Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS provides clinical decision support tools, AI-powered suggestions, and smart charting features to assist healthcare professionals in their workflow. However, NurseOS is not a medical device and does not provide medical advice, diagnosis, or treatment recommendations. All AI-generated suggestions and clinical insights are provided as decision support only and must be independently verified by a qualified healthcare professional before any clinical action is taken.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The clinical information, early warning scores, drug interaction alerts, and other AI-powered features are intended to supplement — not replace — professional clinical judgment. NurseOS does not assume any responsibility for clinical decisions made based on information provided by the platform. The ultimate responsibility for patient care decisions rests solely with the attending healthcare professional.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              IN NO EVENT SHALL NURSEOS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM THE USE OF OR RELIANCE ON CLINICAL INFORMATION OR AI-GENERATED SUGGESTIONS PROVIDED BY THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription and Payment</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS offers both free and paid subscription plans. Paid plans are billed on a monthly basis. All paid plans include a 14-day free trial period. By subscribing to a paid plan, you agree to pay the applicable fees as described on our pricing page. Payments may be made via bank transfer, Paystack online payment, or other methods as made available. Subscription fees are non-refundable except as required by applicable law. We reserve the right to modify our pricing with 30 days&apos; advance notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NURSEOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; ANY CONTENT OBTAINED FROM THE SERVICE; OR UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              IN NO EVENT SHALL NURSEOS&apos;S TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE SERVICE EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO NURSEOS IN THE TWELVE MONTHS PRIOR TO THE EVENT GIVING RISE TO THE LIABILITY, OR (B) ONE HUNDRED THOUSAND NIGERIAN NAIRA (₦100,000).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are and will remain the exclusive property of NurseOS and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent. You retain ownership of any content you submit, post, or display on or through the Service, including clinical notes and care plans. By submitting content, you grant NurseOS a limited, non-exclusive license to process, store, and display such content for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be resolved exclusively in the courts of Lagos State, Nigeria. You consent to the personal jurisdiction and venue of such courts and waive any objection as to inconvenient forum. These Terms shall not be governed by the United Nations Convention on Contracts for the International Sale of Goods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-3">
              <p className="text-muted-foreground"><strong className="text-foreground">NurseOS Legal</strong></p>
              <p className="text-muted-foreground">Email: legal@nurseos.com</p>
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
