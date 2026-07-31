# ADR-002: Adopt Prisma Migrate and Eliminate Raw DDL from Production

**Date:** 2026-07-27
**Status:** Proposed
**Author:** Architecture Review
**Review Standard:** Architect Review Standards v1.1

---

## Context

NurseOS deploys its database schema via a 1,514-line API route (`src/app/api/setup/route.ts`) that generates and executes raw SQL DDL using Prisma's `$executeRawUnsafe`. This route was created because Vercel's serverless environment cannot run `npx prisma` CLI commands at build time.

The current state has several critical problems:

1. **Dual schema definition.** The same 55-table database schema is defined in two places: `prisma/schema.prisma` (1,261 lines, Prisma DSL) and `getCreateTableSQL()` in `setup/route.ts` (~1,200 lines, TypeScript string concatenation). These have diverged across 10+ commits to `schema.prisma` and 14 commits to `setup/route.ts`.

2. **Hardcoded column migrations.** Lines 1400-1410 of `setup/route.ts` contain a manually maintained list of 8 column additions. The schema has been modified in 10 commits. This list is already incomplete and will continue to fall out of sync.

3. **Production DDL execution.** `$executeRawUnsafe` is called 4 times per setup request to execute CREATE TABLE, DROP TABLE, CREATE INDEX, and ALTER TABLE statements. Even behind ADMIN authentication (post ADR-001), this represents the highest blast radius code pattern in the production codebase.

4. **No migration history.** The `prisma/migrations/` directory is empty after 95 commits. There is no record of when schema changes were made, what they contained, or how to roll them back.

5. **Migration tooling exists but is unused.** `package.json` already defines `db:push`, `db:migrate`, and `db:reset` scripts, but they have never been used in production.

6. **Force reset destroys migration history.** The `?force=true` parameter drops all tables including `_prisma_migrations` (line 1248), which would destroy any future Prisma migration tracking table.

### Evidence

- [Verified] `src/app/api/setup/route.ts`: 1,514 lines, 4 `$executeRawUnsafe` calls, 8 hardcoded column migrations, DROP TABLE on `_prisma_migrations`.
- [Verified] `prisma/schema.prisma`: 1,261 lines, 55 models, 37 cascade delete relations.
- [Verified] `prisma/migrations/`: empty directory.
- [Verified] `package.json`: `db:push`, `db:migrate`, `db:reset` scripts defined.
- [Verified] Git log: 10 commits modified `schema.prisma`, 14 commits modified `setup/route.ts`.

## Decision

Adopt Prisma Migrate as the sole mechanism for schema changes. Eliminate all `$executeRawUnsafe` DDL execution from production code.

### Specific changes:

1. **Generate a baseline migration** from the current production schema using `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`. This captures the current state as the first migration.

2. **Remove `getCreateTableSQL()`, `getDropTablesSQL()`, and `getCreateIndexSQL()`** functions (~1,200 lines) from `setup/route.ts`.

3. **Remove all `$executeRawUnsafe` calls** from `setup/route.ts`. The route should no longer execute any DDL.

4. **Replace the POST handler** with a thin wrapper that calls `prisma migrate deploy` via the Prisma SDK's `$executeRaw` (for the migration SQL file) or, more practically, documents that schema changes are applied via CI/CD or manual `npx prisma migrate deploy`.

5. **Extract super-admin seeding** into a separate idempotent function/route that checks for existing users before creating one.

6. **Remove `?force=true`** destructive reset entirely. No HTTP endpoint should drop all tables, even for admins.

7. **Remove the hardcoded column migration list** (lines 1400-1410). Prisma Migrate handles this automatically.

8. **Add `prisma migrate deploy` to the Vercel build command** or as a post-deploy hook. On Vercel, this can be done via a build script that runs `npx prisma migrate deploy` against the production database.

## Consequences

### Positive

- **SSOT restored:** `prisma/schema.prisma` becomes the unambiguous single source of truth for the database schema. Eliminates ~1,200 lines of duplicated DDL.
- **Schema change history:** Every schema change is recorded in a versioned migration file with a timestamp and name. Rollback is possible via `prisma migrate rollback`.
- **CI/CD unblocked:** `prisma migrate deploy` can run as a deployment gate in a CI pipeline, ensuring schema changes are applied in a controlled, reviewable manner.
- **Automatic column tracking:** Prisma Migrate detects schema changes automatically. The hardcoded 8-column list is eliminated.
- **No production DDL:** The most dangerous code pattern in the codebase is removed entirely.
- **Reviewable changes:** Schema changes become pull requests containing migration files that can be reviewed before merge.

### Negative

- **Initial setup complexity:** Generating the baseline migration requires careful work to match the existing production schema exactly. A mismatch could cause the baseline migration to fail or modify existing data.
- **Vercel build time:** Running `prisma migrate deploy` adds time to the build process. This is typically 2-5 seconds for Neon PostgreSQL.
- **Lost self-service setup:** The POST `/api/setup` endpoint can no longer be used to initialize a fresh database from the API. Setup must be done via CI/CD or a developer running `npx prisma migrate deploy` manually. Mitigation: document the setup procedure and create a one-time setup script.
- **Migration conflicts:** If multiple developers create migrations on the same base, merge conflicts will occur. This is standard Prisma Migrate workflow but requires team discipline.

### Migration Strategy

1. **Baseline capture:** Connect to the production database, run `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` to generate the initial migration. This MUST be done against the actual production schema, not a local copy.
2. **Verification:** Compare the generated migration SQL against the current production schema using `\d` in psql. Every table, column, index, and constraint must match.
3. **Apply and commit:** Apply the baseline migration, commit the migration file, push to main.
4. **Refactor setup route:** Remove DDL functions, remove `$executeRawUnsafe`, keep super-admin seeding logic.
5. **CI integration:** Add `prisma migrate deploy` to the build/deploy pipeline.

### Rollback Plan

If the migration adoption causes issues:
1. The original `setup/route.ts` is preserved in git history (pre-migration commits).
2. `git revert` restores the previous setup route.
3. The baseline migration file can be deleted from `prisma/migrations/` and `_prisma_migrations` table truncated to return to the previous state.
4. Rollback time: < 10 minutes (git revert + redeploy).

### Files to Modify

- `prisma/migrations/` — Create baseline migration directory and SQL file
- `src/app/api/setup/route.ts` — Remove ~1,200 lines of DDL, remove `$executeRawUnsafe`, keep status check and seeding
- `package.json` — Potentially update build script to include `prisma migrate deploy`
- `vercel.json` or `vercel` project settings — Add build step for migration deployment
