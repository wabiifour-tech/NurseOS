import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'HIPAA Notice — NurseOS',
  description: 'NurseOS alignment with HIPAA principles — encryption, access controls, and audit trails.',
}

export default function HIPAANoticePage() {
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
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">HIPAA Notice</h1>
            <p className="text-sm text-muted-foreground">Alignment with HIPAA Principles — Last updated: March 2025</p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Health Insurance Portability and Accountability Act (HIPAA) of 1996 is a United States federal law that establishes national standards for the protection of sensitive patient health information. While NurseOS is primarily designed for the Nigerian healthcare market and is governed by Nigerian law, we have voluntarily aligned our platform with the core principles and safeguards of HIPAA to ensure we provide the highest standard of health data protection to our users.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This alignment demonstrates our commitment to building a platform that meets or exceeds international best practices for health information security and privacy. By implementing HIPAA-aligned controls, NurseOS ensures that healthcare facilities using our platform can trust that their patient data is protected with the same rigor expected by the most stringent healthcare data protection frameworks globally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. HIPAA Privacy Rule Alignment</h2>
            <p className="text-muted-foreground leading-relaxed">
              The HIPAA Privacy Rule establishes national standards for the protection of individually identifiable health information, known as Protected Health Information (PHI). NurseOS aligns with the Privacy Rule through the following measures:
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Minimum Necessary Standard:</strong> Our role-based access control system ensures that healthcare professionals only access the minimum amount of patient information necessary to perform their job functions. Access permissions are configured based on clinical role, department, and care relationship.</li>
              <li><strong className="text-foreground">Notice of Privacy Practices:</strong> This page serves as our notice describing how we use and disclose health information. Users are informed of their privacy rights at the time of account creation and through our Privacy Policy.</li>
              <li><strong className="text-foreground">Patient Rights:</strong> We support patient rights consistent with the Privacy Rule, including the right to access their health records, request amendments, receive an accounting of disclosures, and request restrictions on uses and disclosures.</li>
              <li><strong className="text-foreground">Business Associate Agreements:</strong> We maintain data processing agreements with all third-party service providers that may handle PHI, ensuring they are contractually bound to protect health information with the same level of care.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Encryption Standards</h2>
            <p className="text-muted-foreground leading-relaxed">
              Consistent with HIPAA Security Rule requirements for technical safeguards, NurseOS implements comprehensive encryption to protect electronic Protected Health Information (ePHI):
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">3.1 Encryption at Rest</h3>
            <p className="text-muted-foreground leading-relaxed">
              All ePHI stored in our database and file storage systems is encrypted at rest using AES-256 encryption. This includes patient records, clinical notes, vital signs, medication orders, and all other health-related data. Database encryption is implemented at the storage layer, ensuring that even if physical storage media were compromised, the data would remain unreadable without proper decryption keys.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">3.2 Encryption in Transit</h3>
            <p className="text-muted-foreground leading-relaxed">
              All data transmitted between client applications and our servers is encrypted using TLS 1.3 with strong cipher suites. This ensures that ePHI cannot be intercepted or read during transmission over the network. We enforce HTTPS for all connections and reject any attempts to connect over unencrypted channels.
            </p>
            <h3 className="text-lg font-medium text-foreground mb-2">3.3 Key Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Encryption keys are managed through a dedicated key management service with automatic key rotation, separation of duties for key access, and comprehensive audit logging for all key operations. Keys are stored separately from the data they encrypt, adding an additional layer of security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Access Controls</h2>
            <p className="text-muted-foreground leading-relaxed">
              Consistent with HIPAA requirements for access management and the &quot;access control&quot; standard (§ 164.312(a)), NurseOS implements the following access control mechanisms:
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Unique User Identification:</strong> Each user is assigned a unique identifier, and all actions are attributed to individual users. There is no shared account access.</li>
              <li><strong className="text-foreground">Role-Based Access Control (RBAC):</strong> Access to ePHI is controlled through a comprehensive RBAC system. User roles include Nurse, Doctor, Facility Admin, and Super Admin, each with defined permissions that limit access to only the data necessary for their role.</li>
              <li><strong className="text-foreground">Multi-Factor Authentication (MFA):</strong> NurseOS supports optional two-factor authentication (2FA) using time-based one-time passwords (TOTP). Facility administrators can enforce MFA for all users in their facility.</li>
              <li><strong className="text-foreground">Automatic Session Timeout:</strong> User sessions are automatically terminated after a period of inactivity, requiring re-authentication to regain access. Session duration is configurable by facility administrators.</li>
              <li><strong className="text-foreground">Emergency Access Procedure:</strong> In emergency situations where normal access procedures cannot be followed, NurseOS provides a break-glass mechanism that allows authorized personnel to access patient data, with all such access logged and flagged for review.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Audit Trails</h2>
            <p className="text-muted-foreground leading-relaxed">
              Consistent with the HIPAA Security Rule&apos;s audit control requirement (§ 164.312(b)), NurseOS maintains comprehensive audit trails that record all access to and modifications of ePHI:
            </p>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Access Logging:</strong> Every instance of viewing, creating, modifying, or deleting patient records is logged with the user ID, timestamp, action type, and affected records.</li>
              <li><strong className="text-foreground">Authentication Logging:</strong> All login attempts (successful and failed) are logged, including the IP address, device information, and timestamp.</li>
              <li><strong className="text-foreground">Data Modification Tracking:</strong> Changes to clinical records include before-and-after values, enabling complete reconstruction of the record at any point in time.</li>
              <li><strong className="text-foreground">Export and Download Tracking:</strong> All data exports and downloads are logged, including the user, data scope, and timestamp.</li>
              <li><strong className="text-foreground">Retention:</strong> Audit logs are retained for a minimum of six (6) years, consistent with HIPAA requirements and Nigerian healthcare record retention standards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Integrity Controls</h2>
            <p className="text-muted-foreground leading-relaxed">
              NurseOS implements mechanisms consistent with the HIPAA integrity standard (§ 164.312(c)) to ensure that ePHI is not altered or destroyed in an unauthorized manner. These controls include: checksums and integrity verification for stored data, database constraints that prevent orphaned or inconsistent records, version history for all clinical documents, and automated monitoring for unauthorized data modifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Transmission Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Consistent with the HIPAA transmission security standard (§ 164.312(e)), NurseOS implements safeguards to guard against unauthorized access to ePHI being transmitted over electronic communications networks. All API communications use TLS 1.3 encryption. Data exchanged between NurseOS modules (referrals, consultations) is encrypted both in transit and at the destination. Our PWA offline-first architecture stores data locally using encrypted storage and synchronizes securely when connectivity is restored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              While NurseOS is designed to align with HIPAA principles and implements comparable safeguards, NurseOS has not undergone formal HIPAA certification or audit by a certified HIPAA assessor. Our alignment with HIPAA principles is a voluntary commitment to best practices in health data protection and does not constitute legal certification or compliance with HIPAA as a Covered Entity or Business Associate under U.S. law. Healthcare organizations that are subject to HIPAA should conduct their own compliance assessment before using NurseOS for processing PHI subject to HIPAA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about our HIPAA alignment or security practices, please contact our security team:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-3">
              <p className="text-muted-foreground"><strong className="text-foreground">NurseOS Security & Compliance</strong></p>
              <p className="text-muted-foreground">Email: security@nurseos.com</p>
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
