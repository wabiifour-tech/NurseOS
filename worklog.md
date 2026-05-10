---
Task ID: 1
Agent: Main Agent
Task: Deep scan and fix all root issues in NurseOS codebase

Work Log:
- Read and analyzed all critical files: middleware, auth routes, pages, API routes, data files, schema
- Identified 35+ issues across critical, high, medium, and low severity
- Fixed critical auth/redirect bug: replaced router.push + router.refresh with window.location.href
- Replaced SHA-256 password hashing with bcrypt (login, register, seed, patients route)
- Fixed smart-chart route: replaced dynamic import with top-level db import
- Fixed sidebar.tsx Math.random() hydration mismatch with deterministic value
- Fixed Settings page: connected profile save and password change to actual API endpoints
- Created /api/auth/change-password and /api/auth/profile endpoints
- Fixed Dashboard page: removed unused imports (recharts, Separator, Calendar) and unused mounted state
- Fixed Help page: marked contact form as coming soon instead of faking success
- Fixed Prisma schema: added Appointment-NurseProfile relation
- Added server-side password validation matching client-side Zod schema
- Created shared auth helper at /lib/auth.ts (getAuthenticatedUser, unauthorizedResponse)
- Added authentication to all 7 unprotected API routes (10 handlers total)
- Fixed root API route: replaced "Hello world" with proper API info
- Marked data export as coming soon in Settings page
- Seed database re-seeded with bcrypt passwords

Stage Summary:
- All critical bugs fixed: auth redirect, password security, hydration mismatch
- All API routes now have authentication via shared helper
- Settings page actually saves to database
- Password changes actually work via API
- Build compiles cleanly with no errors
- 52 static/dynamic pages all generated successfully
