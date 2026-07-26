# ADR-001: Middleware Security Hardening

**Date:** 2026-07-26
**Status:** Accepted
**Commit:** e30d315
**Author:** Security Audit

---

## Context

A security audit of the NurseOS middleware (`src/middleware.ts`) revealed that multiple dangerous operational endpoints were publicly accessible without any authentication. These endpoints were explicitly listed in the `publicApiRoutes` whitelist array and/or matched by the NextAuth catch-all prefix (`/api/auth/*`), allowing any unauthenticated HTTP client to invoke them.

The vulnerable endpoints and their impacts were:

| Endpoint | Severity | Impact |
|---|---|---|
| `POST /api/setup` | P0 Critical | Execute DDL, run migrations, seed Super Admin |
| `GET /api/setup` | P1 High | Disclose database connection status and table existence |
| `POST /api/setup?force=true` | P0 Critical | Drop and recreate all database tables |
| `POST /api/setup/test-accounts` | P0 Critical | Wipe ALL users, sessions, audit logs, facilities |
| `POST /api/auth/dev-login` | P0 Critical | Full authentication bypass via password login |
| `POST /api/seed` | P1 High | Database seeding (hardcoded secret in source) |
| `POST /api/seed/courses` | P1 High | Course data manipulation |
| `GET /api/seed/courses` | P1 High | Course count information disclosure |

### Root Cause

1. The `publicApiRoutes` array in middleware.ts included `/api/setup`, `/api/setup/test-accounts`, `/api/seed`, and `/api/auth/dev-login`.
2. The NextAuth catch-all prefix (`/api/auth/*`) made `/api/auth/dev-login` public even if removed from the explicit list.
3. Handler-level auth in `/api/setup` only checked authentication for `?force=true`, not for normal POST requests.
4. `/api/seed` used a hardcoded secret (`nurseos-seed-2024`) embedded in source code.
5. `/api/seed/courses` had no authentication check at all.

## Decision

We implemented a defense-in-depth strategy with three layers of protection:

### Layer 1: Middleware Blocklist (primary defense)

Added a `blockedApiRoutes` array that is checked FIRST in `isPublicPath()`, before both the explicit whitelist and the NextAuth catch-all. Any path matching the blocklist returns `false` from `isPublicPath()`, causing the middleware to return `401 { error: "Authentication required" }`.

```typescript
const blockedApiRoutes = [
  '/api/auth/dev-login',
  '/api/setup',
  '/api/setup/test-accounts',
  '/api/seed',
  '/api/seed/courses',
]
```

### Layer 2: Whitelist Cleanup (defense in depth)

Removed all dangerous endpoints from the `publicApiRoutes` array. Removed `/test-login` from `nonIndexablePublicRoutes`.

### Layer 3: Handler-Level Auth (defense in depth)

Each previously-vulnerable handler now includes its own authentication check:

- `/api/setup` (GET + POST): Requires ADMIN role for all operations.
- `/api/auth/dev-login`: Returns 404 when `NODE_ENV === 'production'`.
- `/api/setup/test-accounts`: Returns 404 in production; requires ADMIN auth.
- `/api/seed`: Requires ADMIN auth; hardcoded secret removed.
- `/api/seed/courses` (GET + POST): Requires ADMIN auth.

## Consequences

### Positive

- All 8 dangerous endpoints now return 401 to unauthenticated requests, proven by real HTTP tests against the production build.
- No regressions: 0 new lint errors on modified files; production build succeeds; all 5 legitimate public endpoints remain accessible.
- The blocklist pattern is extensible: any future dangerous endpoint can be secured by adding one line.
- The NextAuth catch-all can no longer accidentally expose dangerous `/api/auth/*` routes.

### Negative

- Developers must authenticate (as ADMIN) to run `/api/setup` in any environment. This adds friction to initial database setup. Mitigation: use the Vercel CLI or direct SQL for first-time setup.
- `/api/auth/dev-login` is no longer usable for testing against the production deployment. It must be tested locally in development mode where `NODE_ENV !== 'production'`.

### Production Test Results (real HTTP against production build)

```
POST /api/setup              => 401  (was 200)
GET  /api/setup              => 401  (was 200)
POST /api/setup?force=true   => 401  (was 200)
POST /api/setup/test-accounts => 401  (was 200)
POST /api/auth/dev-login     => 401  (was 200)
POST /api/seed               => 401  (was 200)
POST /api/seed/courses       => 401  (was 200)
GET  /api/seed/courses       => 401  (was 200)
GET  /api/health             => 200  (unchanged)
POST /api/auth/login         => 503  (unchanged - DB unreachable in test)
GET  /api/auth/pwa-check      => 200  (unchanged)
```

### Files Modified

- `src/middleware.ts` — Added blocklist, removed dangerous routes from whitelist
- `src/app/api/setup/route.ts` — GET and POST require ADMIN auth
- `src/app/api/auth/dev-login/route.ts` — Returns 404 in production
- `src/app/api/setup/test-accounts/route.ts` — Returns 404 in production, requires ADMIN
- `src/app/api/seed/route.ts` — Removed hardcoded secret, requires ADMIN
- `src/app/api/seed/courses/route.ts` — GET and POST require ADMIN

### Commits

- `e30d315` — `security: fix P0 critical vulnerabilities - block unauthenticated access to setup/dev-login/seed endpoints`
