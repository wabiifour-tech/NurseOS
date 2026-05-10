# Task: Rewrite 4 NurseID Pages to Use Real API Calls

## Summary
Rewrote all 4 NurseID pages to fetch data from real API endpoints instead of hardcoded mock data from `@/lib/nurseid-data`.

## Changes Made

### 1. Credentials Page (`src/app/(dashboard)/nurseid/credentials/page.tsx`)
- Removed `import { credentials, credentialTypes } from '@/lib/nurseid-data'`
- Added `import { toast } from 'sonner'` and `import { useAuthStore } from '@/lib/auth-store'`
- Added `Loader2` icon import for loading spinner
- Defined `ApiCredential` interface matching API response shape
- Added `computeStatus()` function to derive display status from `isVerified` + `expiryDate`
- Added `formatDate()` helper
- Added state: `credentials`, `loading`, `error`, `submitting`, form fields
- `fetchCredentials()` via `useCallback` + `useEffect` calling `GET /api/nurseid/credentials`
- `handleSubmit()` POSTing to `/api/nurseid/credentials` with auth token
- Loading skeleton with `Loader2` spinner
- Error state with retry button
- Empty state when no credentials exist
- Stats computed from real data via `computeStatus()`
- Expiry alert computed from real expiring credentials
- Form fields controlled with React state, reset on dialog close
- Filter types hardcoded as `CREDENTIAL_TYPES` constant (no longer imported)

### 2. CPD Page (`src/app/(dashboard)/nurseid/cpd/page.tsx`)
- Removed `import { cpdActivities, cpdTypes, cpdPointsByType } from '@/lib/nurseid-data'`
- Added toast + useAuthStore + Loader2 imports
- Defined `ApiCPDRecord` interface
- State: `cpdRecords`, `totalPoints`, `loading`, `error`, `submitting`, form fields
- `fetchCPD()` calling `GET /api/nurseid/cpd` (uses `data.records` + `data.totalPoints`)
- `handleSubmit()` POSTing to `/api/nurseid/cpd`
- Points breakdown pie chart computed dynamically from real data via `useMemo`
- Circular progress uses `totalPoints` from API
- Loading/error/empty states
- CPD types hardcoded as `CPD_TYPES` constant
- Type colors via `TYPE_COLORS` record

### 3. Portfolio Page (`src/app/(dashboard)/nurseid/portfolio/page.tsx`)
- Removed `import { portfolioEntries, portfolioTypes } from '@/lib/nurseid-data'`
- Added toast + useAuthStore + Loader2 imports
- Defined `ApiPortfolioEntry` interface
- State: `entries`, `loading`, `error`, `submitting`, form fields
- `fetchPortfolio()` calling `GET /api/nurseid/portfolio`
- `handleSubmit()` POSTing to `/api/nurseid/portfolio` with `entryType` field
- `parseEvidence()` helper to parse JSON `evidenceUrls` string
- Loading/error/empty states
- Portfolio types hardcoded as `PORTFOLIO_TYPES` constant
- Evidence URLs displayed as badges (replacing old `skills` array)

### 4. Competencies Page (`src/app/(dashboard)/nurseid/competencies/page.tsx`)
- Removed `import { competencies, competencyLevels, competencyRadarData } from '@/lib/nurseid-data'`
- Added toast + useAuthStore + Loader2 imports
- Defined `ApiCompetency` interface
- Added `levelToNumber()` and `levelToName()` helpers for string↔number level mapping
- State: `competencies`, `loading`, `error`, `submitting`, form fields
- `fetchCompetencies()` calling `GET /api/nurseid/competencies`
- `handleSubmit()` POSTing to `/api/nurseid/competencies` with `competencyArea` and `level`
- Radar chart data computed from real data
- Level distribution computed from real data
- Stats (avg level, expert count, proficient count) computed from real data
- Expanded detail shows `assessedBy`, `evidence`, `expiresAt` from API
- Loading/error/empty states
- Competency levels hardcoded as `COMPETENCY_LEVELS` constant

## API Route Mapping
All 4 API routes already existed and were used as-is:
- `GET/POST /api/nurseid/credentials` → `Credential` model
- `GET/POST /api/nurseid/cpd` → `CPDRecord` model  
- `GET/POST /api/nurseid/portfolio` → `PortfolioEntry` model
- `GET/POST /api/nurseid/competencies` → `Competency` model

## Verification
- ESLint passes cleanly on all 4 files (0 errors, 0 warnings)
- Dev server compiles successfully with no errors
