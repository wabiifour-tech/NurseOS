# Task: Implement Google Social Sign-In with Facility Selection and Admin Approval Flow

## Summary
Successfully implemented Google Social Sign-In with facility selection and admin approval flow for the NurseOS project. The implementation integrates with the existing custom auth system (Zustand store + HttpOnly cookies) while using NextAuth only for the Google OAuth flow.

## Files Created

1. **`/home/z/my-project/NurseOS/src/app/api/auth/[...nextauth]/route.ts`** — NextAuth route handler with Google provider, JWT strategy, and custom redirect to `/auth/callback`

2. **`/home/z/my-project/NurseOS/src/components/auth-provider.tsx`** — Client-side AuthProvider wrapping NextAuth's SessionProvider

3. **`/home/z/my-project/NurseOS/src/app/auth/callback/page.tsx`** — OAuth callback page that checks if Google user exists in DB (ACTIVE → login, PENDING → show waiting message, NEW → redirect to onboarding)

4. **`/home/z/my-project/NurseOS/src/app/api/auth/oauth/link/route.ts`** — API route that links OAuth users to NurseOS accounts (checks existing user status, creates session for active users)

5. **`/home/z/my-project/NurseOS/src/app/api/auth/oauth/complete/route.ts`** — API route that completes onboarding (creates user with PENDING status, NurseProfile, audit log, and admin notification)

6. **`/home/z/my-project/NurseOS/src/app/api/admin/pending-users/route.ts`** — API for admins to list and approve/reject pending users

7. **`/home/z/my-project/NurseOS/src/app/onboarding/page.tsx`** — Onboarding page for new OAuth users to select role and facility

## Files Modified

1. **Login page** — Added "Continue with Google" button with divider
2. **Register page** — Added "Continue with Google" button with divider
3. **Middleware** — Added `/onboarding`, `/auth/callback` to public routes; added OAuth API routes and NextAuth internal routes to public API routes
4. **Auth store** — Added `status?: string` to User interface
5. **Root layout** — Wrapped children with AuthProvider
6. **Admin dashboard** — Added Pending Approvals section with approve/reject functionality
7. **.env / .env.example** — Added NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

## Architecture Decisions

- **NextAuth is used ONLY for Google OAuth flow** — it doesn't replace the custom session/cookie system
- After OAuth, NextAuth redirects to `/auth/callback` which checks the DB and either:
  - Logs in active users (creates custom session token + HttpOnly cookie)
  - Shows pending message for PENDING users
  - Redirects NEW users to `/onboarding`
- Onboarding creates users with PENDING status, requiring admin approval
- Admin approval flow uses the existing admin dashboard with a new "Pending Approvals" section
- All NurseOS source files were copied to the root project directory to work with the running dev server

## Testing
- All pages return 200 status codes: /login, /register, /onboarding, /auth/callback
- API routes work correctly: /api/auth/providers returns Google provider, /api/auth/oauth/link and /api/auth/oauth/complete validate inputs
- Lint passes with no errors
