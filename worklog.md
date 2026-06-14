---
Task ID: 1
Agent: Main Agent
Task: Implement multi-layer facility verification and anti-fraud security system

Work Log:
- Analyzed all auth flows (register, OAuth onboarding, login) to identify security gaps
- Found critical vulnerability: ALL users auto-activated in email/password registration (no approval needed)
- Found critical vulnerability: Admin creating new facility was auto-approved (no verification)
- Found critical vulnerability: No facility registration number required (anyone could create a facility)
- Found critical vulnerability: Public facilities API showed unverified facilities

- Fixed /api/auth/register/route.ts:
  * Changed ALL users to start as PENDING (only SUPER_ADMIN auto-activated)
  * Added mandatory registrationNumber for new facilities
  * Added registrationNumber uniqueness check
  * New facilities start as isVerified=false, accreditationStatus=PENDING
  * Subscriptions start as TRIALING (not ACTIVE) until SUPER_ADMIN verifies
  * Added SUPER_ADMIN notification for new facility applications
  * Removed auto-login for non-SUPER_ADMIN users
  * Returns PENDING status with contextual messages

- Fixed /api/auth/oauth/complete/route.ts:
  * Changed ALL users to PENDING (was: admin creating facility = AUTO-ACTIVE)
  * Added mandatory registrationNumber requirement
  * Added registrationNumber uniqueness check
  * New facilities start unverified with PENDING accreditation
  * Subscriptions start as TRIALING
  * Added SUPER_ADMIN notification for new facility applications
  * Removed auto-login response (no more JWT token + session for new admins)

- Updated /app/onboarding/page.tsx:
  * Added registration number, phone, email fields for new facilities
  * Added admin license number field
  * Added ShieldCheck icon import
  * Changed admin info banner to amber "Facility Verification Required" style
  * Updated pending approval message to be contextual (admin vs worker)
  * Updated submit button text to "Submit Facility Application"
  * Added verification section with security explanation

- Updated /app/(auth)/register/page.tsx:
  * Added registrationNumber and accreditingBody to Zod schema
  * Added registrationNumber to defaultValues
  * Updated validation refine to require registrationNumber
  * Added verification fields to payload
  * Removed auto-login after registration
  * Added PENDING status handling with contextual messages
  * Added redirect to login with pending_approval message
  * Added ShieldCheck import
  * Added verification section with registration number field
  * Added amber "Facility application will be reviewed" warning banner

- Created /api/superadmin/facilities/route.ts:
  * GET: List facilities by verification status (pending/verified/rejected)
  * Includes admin profile, user info, subscription status
  * Search functionality by name, registration number, city, state
  * PATCH: Approve or reject facility applications
  * Approve: Verifies facility, activates admin, activates subscription, notifies admin
  * Reject: Marks facility as rejected, deactivates admin, cancels subscription, notifies admin
  * Audit logging for all actions

- Updated /app/(dashboard)/superadmin/page.tsx:
  * Added "Facility Approvals" tab with ShieldCheck icon
  * Added pending count badge on tab
  * Added fetchFacilityApprovals function
  * Added handleFacilityAction (approve/reject) function
  * Added comprehensive facility approval UI with:
    - Stats bar (pending count, security notice, verification check)
    - Detailed facility application cards showing all verification info
    - Admin info section with contact details and license
    - Approve/Reject buttons with loading states
  * Added Phone import

- Updated /api/facilities/public/route.ts:
  * SECURITY: Only shows verified facilities (isVerified=true, accreditationStatus=VERIFIED)
  * Prevents users from joining unverified/fraudulent facilities

- Updated /app/(auth)/login/page.tsx:
  * Added pending_approval message handling from URL params
  * Shows toast notification for users redirected from registration

Stage Summary:
- Complete multi-layer security system implemented
- No one can auto-activate or create facilities without SUPER_ADMIN approval
- Registration numbers are mandatory and unique-checked
- SUPER_ADMIN dashboard has dedicated "Facility Approvals" tab
- All changes compile and build successfully with Next.js
