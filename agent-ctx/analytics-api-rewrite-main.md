# Task: Rewrite 4 NurseOS Analytics Sub-pages to Use Real API Calls

## Summary
Rewrote all 4 analytics sub-pages to use `GET /api/nurseanalytics/dashboard` instead of hardcoded mock data from `@/lib/analytics-data`.

## Files Modified

### 1. `/src/app/(dashboard)/analytics/staffing/page.tsx`
- Removed imports from `@/lib/analytics-data` (staffingLevels, shiftCoverage, staffingPredictions, leaveData, costData)
- Added `useAuthStore` for auth token
- Added `useEffect` to fetch from `/api/nurseanalytics/dashboard`
- Derived shift coverage from `staffingMetrics.shiftDistribution` (morning/afternoon/night)
- Used `staffingMetrics.nursesOnDuty`, `totalActiveNurses`, `nurseToPatientRatio` for summary cards
- For data not in API (staffing predictions, leave data, cost data): showed informative empty/placeholder states
- Added loading spinner, error handling with toast, empty states

### 2. `/src/app/(dashboard)/analytics/surveillance/page.tsx`
- Removed imports from `@/lib/analytics-data` (diseaseAlerts, diseaseTrendData, surveillanceReports)
- Used `diseaseSurveillance` array from API for active alerts and map data
- Derived severity/trend from `alertLevel` field
- Used `weeklyTrends` for disease trend charts when available
- For data not in API (diseaseTrendData per disease, surveillanceReports): showed empty states
- Added loading spinner, error handling with toast, empty states

### 3. `/src/app/(dashboard)/analytics/reports/page.tsx`
- Removed imports from `@/lib/analytics-data` (reportTemplates, generatedReports)
- Kept report templates as built-in static data (always available for the UI)
- Generated reports: showed empty state since API doesn't provide this
- Report scheduler: still functional with static template data
- Added loading spinner, error handling with toast

### 4. `/src/app/(dashboard)/analytics/patients/page.tsx`
- Removed imports from `@/lib/analytics-data` (ageDemographics, topDiagnoses, admissionTrends, losDistribution, satisfactionTrends)
- Used `overview.totalPatients` for summary cards
- Used `patientMetrics` for readmission rate, avg length of stay
- Used `topDiagnoses` from API for the diagnoses table
- Derived admission trends from `weeklyTrends` API data
- For data not in API (ageDemographics, losDistribution, satisfactionTrends): showed empty states or derived approximations when totalPatients > 0
- Added loading spinner, error handling with toast, empty states

## Common Patterns Applied to All 4 Pages
1. ✅ Removed all imports from `@/lib/analytics-data`
2. ✅ Kept `'use client'` directive
3. ✅ Call `GET /api/nurseanalytics/dashboard` with auth token from `useAuthStore`
4. ✅ Added loading state with `Loader2` spinner
5. ✅ Added empty state when no data available
6. ✅ Added error handling with `toast.error()` from sonner
7. ✅ Kept all existing UI components and styling
8. ✅ Kept the emerald/teal color scheme
9. ✅ For data not in API response: showed placeholder/empty states with informative messages
10. ✅ Used `useAuthStore` to get auth token for API calls

## Lint Status
All pre-existing lint errors are in other files (login, register, page.tsx). No new lint errors introduced by these changes.
