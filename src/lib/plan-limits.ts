// NurseOS Plan Limits Configuration
// Centralized config for all subscription plan features and limits

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'

export interface PlanLimits {
  name: string
  price: string
  period: string
  patientLimit: number          // Max patients (-1 = unlimited)
  aiQueriesPerDay: number       // Max AI queries per day (-1 = unlimited)
  nurseAccounts: number         // Max nurse accounts per facility (-1 = unlimited)
  nurseIdVerification: boolean  // Can verify credentials
  predictiveAnalytics: boolean  // Access to predictive analytics engine
  customIntegrations: boolean   // EMR/HR integrations
  prioritySupport: boolean      // Priority support
  dataExport: boolean           // Data export (CSV/API)
  premiumCourses: boolean       // Access to premium NurseAcademy courses
  customReporting: boolean      // Custom report dashboards
  multiDepartment: boolean      // Multi-department management
  dedicatedAccountManager: boolean
  whiteLabel: boolean           // White-label branding
  onPremise: boolean            // On-premise deployment
  customAiTraining: boolean     // Custom AI model training
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    name: 'Free',
    price: '₦0',
    period: 'forever',
    patientLimit: 5,
    aiQueriesPerDay: 10,
    nurseAccounts: 1,
    nurseIdVerification: false,
    predictiveAnalytics: false,
    customIntegrations: false,
    prioritySupport: false,
    dataExport: false,
    premiumCourses: false,
    customReporting: false,
    multiDepartment: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    onPremise: false,
    customAiTraining: false,
  },
  STARTER: {
    name: 'Facility Starter',
    price: '₦50K',
    period: '/month',
    patientLimit: 50,
    aiQueriesPerDay: -1,
    nurseAccounts: 50,
    nurseIdVerification: true,
    predictiveAnalytics: false,
    customIntegrations: false,
    prioritySupport: false,
    dataExport: true,
    premiumCourses: false,
    customReporting: false,
    multiDepartment: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    onPremise: false,
    customAiTraining: false,
  },
  PRO: {
    name: 'Pro',
    price: '₦150K',
    period: '/month',
    patientLimit: -1,
    aiQueriesPerDay: -1,
    nurseAccounts: -1,
    nurseIdVerification: true,
    predictiveAnalytics: true,
    customIntegrations: true,
    prioritySupport: true,
    dataExport: true,
    premiumCourses: true,
    customReporting: true,
    multiDepartment: true,
    dedicatedAccountManager: false,
    whiteLabel: false,
    onPremise: false,
    customAiTraining: false,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    patientLimit: -1,
    aiQueriesPerDay: -1,
    nurseAccounts: -1,
    nurseIdVerification: true,
    predictiveAnalytics: true,
    customIntegrations: true,
    prioritySupport: true,
    dataExport: true,
    premiumCourses: true,
    customReporting: true,
    multiDepartment: true,
    dedicatedAccountManager: true,
    whiteLabel: true,
    onPremise: true,
    customAiTraining: true,
  },
}

// Check if a feature is available for a given plan
export function hasFeature(plan: PlanType, feature: keyof PlanLimits): boolean {
  return !!PLAN_LIMITS[plan]?.[feature]
}

// Get a numeric limit for a given plan
export function getLimit(plan: PlanType, limit: 'patientLimit' | 'aiQueriesPerDay' | 'nurseAccounts'): number {
  return PLAN_LIMITS[plan]?.[limit] ?? 0
}

// Check if a numeric limit is exceeded
export function isLimitExceeded(plan: PlanType, limit: 'patientLimit' | 'aiQueriesPerDay' | 'nurseAccounts', currentCount: number): boolean {
  const max = getLimit(plan, limit)
  if (max === -1) return false // Unlimited
  return currentCount >= max
}

// Get plan display info
export function getPlanInfo(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE
}

// All plans for dropdowns/selectors
export const ALL_PLANS: PlanType[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']

// Plan badge colors
export const PLAN_COLORS: Record<PlanType, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
  STARTER: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  PRO: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
}
