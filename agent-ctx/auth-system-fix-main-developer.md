# Task: Fix Auth System - Database Schema Mismatch and OAuth Issues

## Task ID: auth-system-fix
## Agent: Main Developer
## Date: 2024-03-04

## Summary

Fixed four critical problems in the NurseOS auth system:
1. Replaced raw SQL DDL in `/api/setup` with Prisma `db push` to eliminate schema drift
2. Updated NextAuth configuration for proper Google OAuth handling
3. Fixed middleware to properly whitelist all NextAuth routes
4. Created `/api/auth/setup-status` endpoint for frontend status checks

## Changes Made

### 1. `/src/app/api/setup/route.ts` — Replaced Raw SQL with Prisma db push
- **Before**: ~1130 lines of raw SQL DDL statements that drifted from the Prisma schema
- **After**: ~175 lines using `execSync('npx prisma db push')` to push schema exactly as defined
- Key changes:
  - POST handler now runs `npx prisma db push --skip-generate` for first-time setup
  - Uses `--accept-data-loss` flag when force reset is requested or schema is broken with no users
  - Kept the same auth logic (first-time setup = no auth, force reset = admin auth required)
  - Kept super admin seeding after push
  - Kept GET handler unchanged (checks if User table exists)
  - Reset DB connection cache after push
  - Proper error handling with helpful hints

### 2. `/src/app/api/auth/[...nextauth]/route.ts` — Updated NextAuth Configuration
- **Before**: Minimal signIn callback (always returned true), no error handling
- **After**: Robust configuration with:
  - Google OAuth credentials check (blocks sign-in if not configured, logs helpful error)
  - Email validation (blocks sign-in if no email returned)
  - Database user lookup in signIn callback (checks existing user status)
  - Blocks sign-in for DELETED/SUSPENDED users
  - Persists provider and accessToken info in JWT
  - Better redirect callback (always goes to `/auth/callback?provider=google`)
  - Added error page redirect to `/login`
  - Added `debug: true` in development mode
  - Graceful error handling when DB tables don't exist yet

### 3. `/src/middleware.ts` — Fixed NextAuth Route Whitelisting
- **Before**: Specific `nextAuthRoutes` array listing individual sub-routes (`/api/auth/providers`, `/api/auth/session`, etc.)
- **After**: Catch-all prefix check `pathname.startsWith('/api/auth/')` covers ALL NextAuth routes
  - This properly handles `/api/auth/callback/google`, `/api/auth/signin/google`, etc.
  - Added `/api/auth/setup-status` to publicApiRoutes
  - Removed the `nextAuthRoutes` array (replaced by prefix check)

### 4. `/src/app/api/auth/setup-status/route.ts` — New Endpoint
- Returns comprehensive setup status for the frontend:
  - `setupComplete`: boolean - whether DB is ready for auth
  - `database`: 'connected' | 'disconnected' | 'error'
  - `canRegister`: boolean
  - `canLogin`: boolean
  - `tablesExist`: boolean
  - `userCount`: number
  - `googleOAuthConfigured`: boolean
  - `nextauthConfigured`: boolean
  - `warnings`: array of configuration warnings
  - `action`: helpful next step for the user

## Verification
- `npx prisma generate` runs successfully
- All endpoints return proper responses:
  - GET `/api/setup` → returns setup status
  - GET `/api/auth/setup-status` → returns detailed setup status
  - GET `/api/auth/providers` → 200 (whitelisted by middleware)
  - GET `/api/auth/csrf` → 200 (whitelisted by middleware)
- No lint errors in modified source files
- Dev server running without errors
