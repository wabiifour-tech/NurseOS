import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

/**
 * GET /api/setup — Check setup status
 * POST /api/setup — Push Prisma schema to the database (create tables)
 *
 * Call POST once after connecting a new PostgreSQL database.
 * After setup, auth (register/login) will work immediately.
 */

export async function GET() {
  const dbConnected = await isDatabaseConnected()

  if (!dbConnected) {
    return NextResponse.json({
      status: 'database_not_configured',
      database: 'disconnected',
      tablesExist: false,
      message: 'Database is not configured. Set DATABASE_URL in Vercel → Settings → Environment Variables.',
    })
  }

  // Check if core tables already exist
  let tablesExist = false
  try {
    await db.user.findFirst({ take: 1 })
    tablesExist = true
  } catch {
    tablesExist = false
  }

  return NextResponse.json({
    status: tablesExist ? 'ready' : 'needs_setup',
    database: 'connected',
    tablesExist,
    message: tablesExist
      ? 'Database is ready. All tables exist. You can register and log in.'
      : 'Database is connected but tables do not exist. Send a POST request to /api/setup to create them.',
  })
}

export async function POST(request: NextRequest) {
  // 🔒 Require admin authentication for destructive operations
  // Allow unauthenticated setup ONLY if no users exist yet (first-time setup)
  // Use ?force=true to drop all tables and recreate (useful for fixing schema issues)
  const { searchParams } = new URL(request.url)
  const forceReset = searchParams.get('force') === 'true'

  // First-time setup: if tables don't exist yet, skip auth entirely
  // This handles the case where the database is connected but has no tables
  let tablesAlreadyExist = false
  try {
    await db.user.findFirst({ take: 1 })
    tablesAlreadyExist = true
  } catch {
    // Tables don't exist yet — first-time setup
  }

  // Only check auth if tables already exist (i.e., this is not a first-time setup)
  if (tablesAlreadyExist && !forceReset) {
    return NextResponse.json({
      message: 'Database is already set up. Tables exist. You can register and log in!',
      status: 'already_setup',
    })
  }

  let authUser = null
  try {
    authUser = await getAuthenticatedUser(request)
  } catch {
    // Tables may not exist yet, so auth lookup fails — that's OK for first-time setup
  }
  let userCount = 0
  try { userCount = await db.user.count() } catch { /* tables may not exist yet */ }

  // If force reset, require admin auth
  if (forceReset) {
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required for force reset' }, { status: 403 })
    }
  } else if (userCount > 0) {
    // Not force reset, but users exist — require admin auth
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set DATABASE_URL in Vercel → Settings → Environment Variables first.' },
        { status: 503 }
      )
    }

    // Force reset: drop all tables and recreate
    if (forceReset) {
      const allTables = [
        'SimulationAttempt', 'Enrollment', 'CourseModule', 'Simulation', 'Course',
        'CPDRecord', 'PortfolioEntry', 'Competency', 'Credential',
        'StaffingPrediction', 'DiseaseSurveillance', 'FacilityAnalytics',
        'ArticleComment', 'KnowledgeArticle',
        'Consultation', 'Referral', 'LabOrder', 'MedicationOrder', 'AIInteraction',
        'NursingNote', 'VitalSign', 'MedicalRecord', 'Appointment', 'VisitRecord',
        'Department', 'Subscription', 'Notification', 'AuditLog', 'Session',
        'PatientProfile', 'AdminProfile', 'NurseProfile',
        'User', 'Facility',
      ]
      for (const table of allTables) {
        try {
          await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`)
        } catch {
          // Ignore errors — table might not exist
        }
      }
      // Also drop any indexes that might remain
      try {
        const indexNames = [
          'FacilityAnalytics_facilityId_date_period_key',
          'Enrollment_courseId_nurseId_key',
        ]
        for (const idx of indexNames) {
          try { await db.$executeRawUnsafe(`DROP INDEX IF EXISTS "${idx}"`) } catch {}
        }
      } catch {}
    }

    // Check if core tables already exist (and not force reset)
    if (!forceReset) {
      try {
        await db.user.findFirst({ take: 1 })
        return NextResponse.json({
          message: 'Database is already set up. Tables exist. You can register and log in!',
          status: 'already_setup',
      })
    } catch {
      // Tables don't exist yet — proceed with creation
    }
    } // end if (!forceReset)

    // Create all tables using PostgreSQL-compatible DDL
    const tables: Array<{ name: string; sql: string }> = [
      {
        name: 'User',
        sql: `CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "middleName" TEXT,
          "displayName" TEXT,
          "avatarUrl" TEXT,
          "phone" TEXT,
          "countryCode" TEXT NOT NULL DEFAULT 'NG',
          "role" TEXT NOT NULL DEFAULT 'NURSE',
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "emailVerified" BOOLEAN NOT NULL DEFAULT false,
          "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
          "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
          "facilityId" TEXT,
          "lastLoginAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'NurseProfile',
        sql: `CREATE TABLE IF NOT EXISTS "NurseProfile" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "licenseNumber" TEXT NOT NULL UNIQUE,
          "licenseIssuingBody" TEXT NOT NULL DEFAULT 'Nursing Registration Board',
          "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
          "specialization" TEXT,
          "yearsOfExperience" INTEGER,
          "currentFacilityId" TEXT,
          "blsCertified" BOOLEAN NOT NULL DEFAULT false,
          "blsCertExpiry" TIMESTAMP(3),
          "aclsCertified" BOOLEAN NOT NULL DEFAULT false,
          "aclsCertExpiry" TIMESTAMP(3),
          "nursingCouncil" TEXT NOT NULL DEFAULT 'Nigeria',
          "degree" TEXT,
          "university" TEXT,
          "graduationYear" INTEGER,
          "bio" TEXT,
          "skills" TEXT NOT NULL DEFAULT '[]',
          "languages" TEXT NOT NULL DEFAULT '["English"]',
          "availableForConsult" BOOLEAN NOT NULL DEFAULT false,
          "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalRatings" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'AdminProfile',
        sql: `CREATE TABLE IF NOT EXISTS "AdminProfile" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "facilityId" TEXT,
          "department" TEXT,
          "accessLevel" INTEGER NOT NULL DEFAULT 1
        )`,
      },
      {
        name: 'PatientProfile',
        sql: `CREATE TABLE IF NOT EXISTS "PatientProfile" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT UNIQUE,
          "patientId" TEXT NOT NULL UNIQUE,
          "facilityId" TEXT,
          "dateOfBirth" TIMESTAMP(3),
          "gender" TEXT,
          "bloodType" TEXT,
          "genotype" TEXT,
          "allergies" TEXT NOT NULL DEFAULT '[]',
          "emergencyContactName" TEXT,
          "emergencyContactPhone" TEXT,
          "emergencyContactRelation" TEXT,
          "nationality" TEXT DEFAULT 'Nigerian',
          "stateOfOrigin" TEXT,
          "lga" TEXT,
          "religion" TEXT,
          "occupation" TEXT,
          "insuranceProvider" TEXT,
          "insuranceNumber" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Facility',
        sql: `CREATE TABLE IF NOT EXISTS "Facility" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "level" TEXT,
          "address" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "country" TEXT NOT NULL DEFAULT 'Nigeria',
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "phone" TEXT,
          "email" TEXT,
          "website" TEXT,
          "bedCapacity" INTEGER,
          "staffCount" INTEGER,
          "registrationNumber" TEXT UNIQUE,
          "accreditingBody" TEXT,
          "accreditationStatus" TEXT DEFAULT 'PENDING',
          "isVerified" BOOLEAN NOT NULL DEFAULT false,
          "isEmergencyCapable" BOOLEAN NOT NULL DEFAULT false,
          "servicesOffered" TEXT NOT NULL DEFAULT '[]',
          "operatingHours" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Session',
        sql: `CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'AuditLog',
        sql: `CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "resource" TEXT NOT NULL,
          "resourceId" TEXT,
          "details" TEXT,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'Notification',
        sql: `CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "data" TEXT,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "readAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'Department',
        sql: `CREATE TABLE IF NOT EXISTS "Department" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "facilityId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "headNurseId" TEXT,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'MedicalRecord',
        sql: `CREATE TABLE IF NOT EXISTS "MedicalRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "facilityId" TEXT NOT NULL,
          "departmentId" TEXT,
          "encounterType" TEXT NOT NULL,
          "encounterDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "attendingNurseId" TEXT,
          "attendingDoctorId" TEXT,
          "chiefComplaint" TEXT NOT NULL,
          "historyOfPresentIllness" TEXT,
          "pastMedicalHistory" TEXT,
          "familyHistory" TEXT,
          "socialHistory" TEXT,
          "nursingAssessment" TEXT,
          "nursingDiagnosis" TEXT NOT NULL DEFAULT '[]',
          "nursingCarePlan" TEXT,
          "interventions" TEXT NOT NULL DEFAULT '[]',
          "evaluationNotes" TEXT,
          "dischargeSummary" TEXT,
          "aiSuggestions" TEXT,
          "aiConfidenceScore" DOUBLE PRECISION,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'VitalSign',
        sql: `CREATE TABLE IF NOT EXISTS "VitalSign" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "recordId" TEXT,
          "recordedByNurseId" TEXT,
          "temperature" DOUBLE PRECISION,
          "heartRate" INTEGER,
          "respiratoryRate" INTEGER,
          "bloodPressureSystolic" INTEGER,
          "bloodPressureDiastolic" INTEGER,
          "oxygenSaturation" DOUBLE PRECISION,
          "weight" DOUBLE PRECISION,
          "height" DOUBLE PRECISION,
          "bmi" DOUBLE PRECISION,
          "bloodGlucose" DOUBLE PRECISION,
          "painScale" INTEGER,
          "consciousnessLevel" TEXT,
          "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "earlyWarningScore" DOUBLE PRECISION,
          "isAbnormal" BOOLEAN,
          "notes" TEXT,
          "source" TEXT NOT NULL DEFAULT 'MANUAL'
        )`,
      },
      {
        name: 'NursingNote',
        sql: `CREATE TABLE IF NOT EXISTS "NursingNote" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "recordId" TEXT NOT NULL,
          "nurseId" TEXT NOT NULL,
          "noteType" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
          "aiPrompt" TEXT,
          "isSigned" BOOLEAN NOT NULL DEFAULT false,
          "signedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'AIInteraction',
        sql: `CREATE TABLE IF NOT EXISTS "AIInteraction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "recordId" TEXT NOT NULL,
          "nurseId" TEXT NOT NULL,
          "interactionType" TEXT NOT NULL,
          "userInput" TEXT NOT NULL,
          "aiOutput" TEXT NOT NULL,
          "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
          "confidenceScore" DOUBLE PRECISION,
          "wasAccepted" BOOLEAN,
          "feedbackRating" INTEGER,
          "responseTimeMs" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'MedicationOrder',
        sql: `CREATE TABLE IF NOT EXISTS "MedicationOrder" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "recordId" TEXT NOT NULL,
          "prescribedByDoctorId" TEXT,
          "verifiedByNurseId" TEXT,
          "medicationName" TEXT NOT NULL,
          "dosage" TEXT NOT NULL,
          "route" TEXT NOT NULL,
          "frequency" TEXT NOT NULL,
          "duration" TEXT,
          "startDate" TIMESTAMP(3) NOT NULL,
          "endDate" TIMESTAMP(3),
          "indications" TEXT,
          "contraindications" TEXT NOT NULL DEFAULT '[]',
          "drugInteractions" TEXT,
          "interactionAlerts" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "administeredAt" TIMESTAMP(3),
          "administeredByNurseId" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'LabOrder',
        sql: `CREATE TABLE IF NOT EXISTS "LabOrder" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "recordId" TEXT NOT NULL,
          "orderedBy" TEXT NOT NULL,
          "testName" TEXT NOT NULL,
          "testCategory" TEXT NOT NULL,
          "specimenType" TEXT,
          "urgency" TEXT NOT NULL DEFAULT 'ROUTINE',
          "status" TEXT NOT NULL DEFAULT 'ORDERED',
          "resultValue" TEXT,
          "resultUnit" TEXT,
          "referenceRange" TEXT,
          "isAbnormal" BOOLEAN,
          "resultDate" TIMESTAMP(3),
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Referral',
        sql: `CREATE TABLE IF NOT EXISTS "Referral" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "fromFacilityId" TEXT,
          "toFacilityId" TEXT,
          "toFacilityName" TEXT,
          "referringNurseId" TEXT NOT NULL,
          "referringDoctorId" TEXT,
          "reason" TEXT,
          "clinicalSummary" TEXT,
          "urgency" TEXT NOT NULL DEFAULT 'ROUTINE',
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "acceptedByNurseId" TEXT,
          "acceptedAt" TIMESTAMP(3),
          "patientArrived" BOOLEAN NOT NULL DEFAULT false,
          "arrivedAt" TIMESTAMP(3),
          "outcomeNotes" TEXT,
          "feedbackRating" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Consultation',
        sql: `CREATE TABLE IF NOT EXISTS "Consultation" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "requestingNurseId" TEXT NOT NULL,
          "consultingNurseId" TEXT NOT NULL,
          "patientId" TEXT,
          "recordId" TEXT,
          "consultationType" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'REQUESTED',
          "scheduledAt" TIMESTAMP(3),
          "startedAt" TIMESTAMP(3),
          "endedAt" TIMESTAMP(3),
          "notes" TEXT,
          "recommendations" TEXT,
          "recordingUrl" TEXT,
          "transcript" TEXT,
          "aiSummary" TEXT,
          "rating" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'KnowledgeArticle',
        sql: `CREATE TABLE IF NOT EXISTS "KnowledgeArticle" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "authorId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL UNIQUE,
          "category" TEXT NOT NULL,
          "tags" TEXT NOT NULL DEFAULT '[]',
          "content" TEXT NOT NULL,
          "summary" TEXT,
          "readingTime" INTEGER,
          "evidenceLevel" TEXT,
          "references" TEXT NOT NULL DEFAULT '[]',
          "viewCount" INTEGER NOT NULL DEFAULT 0,
          "likeCount" INTEGER NOT NULL DEFAULT 0,
          "commentCount" INTEGER NOT NULL DEFAULT 0,
          "isPublished" BOOLEAN NOT NULL DEFAULT false,
          "isFeatured" BOOLEAN NOT NULL DEFAULT false,
          "language" TEXT NOT NULL DEFAULT 'en',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'ArticleComment',
        sql: `CREATE TABLE IF NOT EXISTS "ArticleComment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "articleId" TEXT NOT NULL,
          "authorId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'FacilityAnalytics',
        sql: `CREATE TABLE IF NOT EXISTS "FacilityAnalytics" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "facilityId" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "totalPatients" INTEGER,
          "newPatients" INTEGER,
          "totalEncounters" INTEGER,
          "avgWaitTimeMin" DOUBLE PRECISION,
          "avgLengthOfStay" DOUBLE PRECISION,
          "nurseToPatientRatio" DOUBLE PRECISION,
          "bedOccupancyRate" DOUBLE PRECISION,
          "medicationErrors" INTEGER,
          "nearMissEvents" INTEGER,
          "patientSatisfactionScore" DOUBLE PRECISION,
          "nurseSatisfactionScore" DOUBLE PRECISION,
          "readmissionRate" DOUBLE PRECISION,
          "infectionRate" DOUBLE PRECISION,
          "mortalityRate" DOUBLE PRECISION,
          "topDiagnoses" TEXT,
          "peakHours" TEXT,
          "staffingData" TEXT,
          "aiInsights" TEXT,
          "period" TEXT NOT NULL DEFAULT 'DAILY',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'FacilityAnalytics_unique',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS "FacilityAnalytics_facilityId_date_period_key" ON "FacilityAnalytics"("facilityId", "date", "period")`,
      },
      {
        name: 'DiseaseSurveillance',
        sql: `CREATE TABLE IF NOT EXISTS "DiseaseSurveillance" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "facilityId" TEXT NOT NULL,
          "region" TEXT NOT NULL,
          "diseaseName" TEXT NOT NULL,
          "caseCount" INTEGER NOT NULL,
          "expectedRange" TEXT NOT NULL,
          "isOutbreakAlert" BOOLEAN NOT NULL DEFAULT false,
          "alertLevel" TEXT,
          "affectedGroups" TEXT NOT NULL DEFAULT '[]',
          "geographicCluster" TEXT,
          "aiPrediction" TEXT,
          "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'StaffingPrediction',
        sql: `CREATE TABLE IF NOT EXISTS "StaffingPrediction" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "facilityId" TEXT NOT NULL,
          "departmentId" TEXT,
          "predictedDate" TIMESTAMP(3) NOT NULL,
          "predictedPatientLoad" INTEGER,
          "recommendedStaffing" INTEGER,
          "confidence" DOUBLE PRECISION,
          "factors" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'Credential',
        sql: `CREATE TABLE IF NOT EXISTS "Credential" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nurseId" TEXT NOT NULL,
          "credentialType" TEXT NOT NULL,
          "credentialName" TEXT NOT NULL,
          "issuingBody" TEXT NOT NULL,
          "issueDate" TIMESTAMP(3) NOT NULL,
          "expiryDate" TIMESTAMP(3),
          "credentialNumber" TEXT,
          "verificationHash" TEXT,
          "isVerified" BOOLEAN NOT NULL DEFAULT false,
          "verifiedBy" TEXT,
          "verifiedAt" TIMESTAMP(3),
          "documentUrl" TEXT,
          "isPublic" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Competency',
        sql: `CREATE TABLE IF NOT EXISTS "Competency" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nurseId" TEXT NOT NULL,
          "competencyArea" TEXT NOT NULL,
          "level" TEXT NOT NULL,
          "assessedBy" TEXT,
          "assessedAt" TIMESTAMP(3),
          "evidence" TEXT,
          "expiresAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'PortfolioEntry',
        sql: `CREATE TABLE IF NOT EXISTS "PortfolioEntry" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nurseId" TEXT NOT NULL,
          "entryType" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "url" TEXT,
          "evidenceUrls" TEXT NOT NULL DEFAULT '[]',
          "impactMetrics" TEXT,
          "startDate" TIMESTAMP(3),
          "endDate" TIMESTAMP(3),
          "isOngoing" BOOLEAN NOT NULL DEFAULT false,
          "isPublic" BOOLEAN NOT NULL DEFAULT true,
          "featured" BOOLEAN NOT NULL DEFAULT false,
          "order" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'CPDRecord',
        sql: `CREATE TABLE IF NOT EXISTS "CPDRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "nurseId" TEXT NOT NULL,
          "activityType" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "cpdPoints" DOUBLE PRECISION NOT NULL,
          "dateCompleted" TIMESTAMP(3) NOT NULL,
          "provider" TEXT,
          "certificateUrl" TEXT,
          "isVerified" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Course',
        sql: `CREATE TABLE IF NOT EXISTS "Course" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "slug" TEXT NOT NULL UNIQUE,
          "description" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "level" TEXT NOT NULL,
          "instructorIds" TEXT NOT NULL DEFAULT '[]',
          "modules" TEXT,
          "durationMinutes" INTEGER,
          "cpdPoints" DOUBLE PRECISION,
          "language" TEXT NOT NULL DEFAULT 'en',
          "tags" TEXT NOT NULL DEFAULT '[]',
          "thumbnailUrl" TEXT,
          "isPublished" BOOLEAN NOT NULL DEFAULT false,
          "isFree" BOOLEAN NOT NULL DEFAULT true,
          "price" DOUBLE PRECISION,
          "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
          "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalRatings" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'CourseModule',
        sql: `CREATE TABLE IF NOT EXISTS "CourseModule" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "courseId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "order" INTEGER NOT NULL,
          "contentType" TEXT NOT NULL,
          "contentUrl" TEXT,
          "contentBody" TEXT,
          "videoUrl" TEXT,
          "durationMinutes" INTEGER,
          "isRequired" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'Enrollment',
        sql: `CREATE TABLE IF NOT EXISTS "Enrollment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "courseId" TEXT NOT NULL,
          "nurseId" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
          "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          "progressPercent" INTEGER NOT NULL DEFAULT 0,
          "currentModuleId" TEXT,
          "lastAccessedAt" TIMESTAMP(3),
          "certificateUrl" TEXT,
          "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
          "certificateNumber" TEXT,
          "rating" INTEGER,
          "review" TEXT
        )`,
      },
      {
        name: 'Enrollment_unique',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_courseId_nurseId_key" ON "Enrollment"("courseId", "nurseId")`,
      },
      {
        name: 'Simulation',
        sql: `CREATE TABLE IF NOT EXISTS "Simulation" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "courseId" TEXT,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "scenarioType" TEXT NOT NULL,
          "difficulty" TEXT NOT NULL,
          "patientProfile" TEXT,
          "initialPresentation" TEXT,
          "decisionPoints" TEXT,
          "correctActions" TEXT NOT NULL DEFAULT '[]',
          "timeLimitMinutes" INTEGER,
          "scoringCriteria" TEXT,
          "durationMinutes" INTEGER,
          "scenario" TEXT,
          "learningObjectives" TEXT NOT NULL DEFAULT '[]',
          "aiFeedbackEnabled" BOOLEAN NOT NULL DEFAULT true,
          "isPublished" BOOLEAN NOT NULL DEFAULT true,
          "completionCount" INTEGER NOT NULL DEFAULT 0,
          "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'SimulationAttempt',
        sql: `CREATE TABLE IF NOT EXISTS "SimulationAttempt" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "simulationId" TEXT NOT NULL,
          "nurseId" TEXT NOT NULL,
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          "score" DOUBLE PRECISION,
          "maxScore" DOUBLE PRECISION,
          "actionsTaken" TEXT,
          "timeTakenSeconds" INTEGER,
          "aiEvaluation" TEXT,
          "strengths" TEXT NOT NULL DEFAULT '[]',
          "areasForImprovement" TEXT NOT NULL DEFAULT '[]',
          "wouldRepeat" BOOLEAN
        )`,
      },
      {
        name: 'Appointment',
        sql: `CREATE TABLE IF NOT EXISTS "Appointment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "facilityId" TEXT,
          "nurseId" TEXT,
          "doctorId" TEXT,
          "appointmentDate" TIMESTAMP(3) NOT NULL,
          "durationMinutes" INTEGER NOT NULL DEFAULT 15,
          "type" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
          "reason" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
      {
        name: 'VisitRecord',
        sql: `CREATE TABLE IF NOT EXISTS "VisitRecord" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "patientId" TEXT NOT NULL,
          "facilityId" TEXT,
          "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "visitType" TEXT NOT NULL,
          "outcome" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'Subscription',
        sql: `CREATE TABLE IF NOT EXISTS "Subscription" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "facilityId" TEXT NOT NULL UNIQUE,
          "plan" TEXT NOT NULL DEFAULT 'FREE',
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "trialEndsAt" TIMESTAMP(3),
          "currentPeriodStart" TIMESTAMP(3),
          "currentPeriodEnd" TIMESTAMP(3),
          "paymentMethod" TEXT,
          "paymentReference" TEXT,
          "amountPaid" DOUBLE PRECISION,
          "currency" TEXT NOT NULL DEFAULT 'NGN',
          "verifiedBy" TEXT,
          "verifiedAt" TIMESTAMP(3),
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )`,
      },
    ]

    const createdTables: string[] = []
    const errors: Array<{ table: string; error: string }> = []

    for (const table of tables) {
      try {
        await db.$executeRawUnsafe(table.sql)
        createdTables.push(table.name)
      } catch (err: any) {
        errors.push({ table: table.name, error: err?.message?.substring(0, 200) || 'Unknown error' })
      }
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
      `CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token")`,
      `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_resource_idx" ON "AuditLog"("resource", "resourceId")`,
      `CREATE INDEX IF NOT EXISTS "NurseProfile_licenseNumber_idx" ON "NurseProfile"("licenseNumber")`,
      `CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId", "isRead", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "PatientProfile_patientId_idx" ON "PatientProfile"("patientId")`,
      `CREATE INDEX IF NOT EXISTS "PatientProfile_facilityId_idx" ON "PatientProfile"("facilityId")`,
      `CREATE INDEX IF NOT EXISTS "Facility_type_city_state_idx" ON "Facility"("type", "city", "state")`,
      `CREATE INDEX IF NOT EXISTS "Facility_isVerified_idx" ON "Facility"("isVerified")`,
      `CREATE INDEX IF NOT EXISTS "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId", "encounterDate")`,
      `CREATE INDEX IF NOT EXISTS "MedicalRecord_facilityId_idx" ON "MedicalRecord"("facilityId", "status")`,
      `CREATE INDEX IF NOT EXISTS "VitalSign_patientId_idx" ON "VitalSign"("patientId", "recordedAt")`,
      `CREATE INDEX IF NOT EXISTS "NursingNote_recordId_idx" ON "NursingNote"("recordId", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "MedicationOrder_patientId_idx" ON "MedicationOrder"("patientId", "status")`,
      `CREATE INDEX IF NOT EXISTS "LabOrder_patientId_idx" ON "LabOrder"("patientId", "status")`,
      `CREATE INDEX IF NOT EXISTS "Referral_fromFacilityId_idx" ON "Referral"("fromFacilityId", "status")`,
      `CREATE INDEX IF NOT EXISTS "Credential_nurseId_idx" ON "Credential"("nurseId", "credentialType")`,
      `CREATE INDEX IF NOT EXISTS "Competency_nurseId_idx" ON "Competency"("nurseId", "competencyArea")`,
      `CREATE INDEX IF NOT EXISTS "Course_slug_idx" ON "Course"("slug")`,
      `CREATE INDEX IF NOT EXISTS "Course_category_idx" ON "Course"("category", "isPublished")`,
      `CREATE INDEX IF NOT EXISTS "CourseModule_courseId_idx" ON "CourseModule"("courseId", "order")`,
      `CREATE INDEX IF NOT EXISTS "Enrollment_nurseId_idx" ON "Enrollment"("nurseId")`,
      `CREATE INDEX IF NOT EXISTS "SimulationAttempt_idx" ON "SimulationAttempt"("simulationId", "nurseId")`,
      `CREATE INDEX IF NOT EXISTS "KnowledgeArticle_idx" ON "KnowledgeArticle"("category", "isPublished")`,
      `CREATE INDEX IF NOT EXISTS "ArticleComment_idx" ON "ArticleComment"("articleId", "createdAt")`,
      `CREATE INDEX IF NOT EXISTS "Appointment_facilityId_idx" ON "Appointment"("facilityId", "appointmentDate")`,
      `CREATE INDEX IF NOT EXISTS "VisitRecord_patientId_idx" ON "VisitRecord"("patientId", "visitDate")`,
      `CREATE INDEX IF NOT EXISTS "CPDRecord_nurseId_idx" ON "CPDRecord"("nurseId", "dateCompleted")`,
      `CREATE INDEX IF NOT EXISTS "DiseaseSurveillance_idx" ON "DiseaseSurveillance"("diseaseName", "region", "reportedAt")`,
      `CREATE INDEX IF NOT EXISTS "StaffingPrediction_idx" ON "StaffingPrediction"("facilityId", "predictedDate")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_facilityId_idx" ON "Subscription"("facilityId")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status")`,
    ]

    for (const idxSql of indexes) {
      try {
        await db.$executeRawUnsafe(idxSql)
      } catch {
        // Index may already exist, ignore
      }
    }

    // Add foreign key constraints
    const fkConstraints = [
      `ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "NurseProfile" ADD CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "User" ADD CONSTRAINT "User_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ]

    for (const fk of fkConstraints) {
      try {
        await db.$executeRawUnsafe(fk)
      } catch {
        // FK may already exist, ignore
      }
    }

    // Reset cached connection status so next health check sees the new tables
    resetDbConnectionStatus()

    // Verify tables were created
    let tablesExist = false
    try {
      await db.user.findFirst({ take: 1 })
      tablesExist = true
    } catch {
      tablesExist = false
    }

    if (tablesExist) {
      // ── Seed Super Admin if no users exist ──
      let superAdminSeeded = false
      try {
        const existingUserCount = await db.user.count()
        if (existingUserCount === 0) {
          const passwordHash = await bcrypt.hash('#Abolaji7977', 10)
          const superAdmin = await db.user.create({
            data: {
              id: randomUUID(),
              email: 'wabithetechnurse@nurseos.com',
              passwordHash,
              firstName: 'Wabi',
              lastName: 'The Tech Nurse',
              displayName: 'Wabi The Tech Nurse',
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              countryCode: 'NG',
            },
          })
          // Create AdminProfile with accessLevel=10 to mark as SUPER_ADMIN
          await db.adminProfile.create({
            data: {
              id: randomUUID(),
              userId: superAdmin.id,
              accessLevel: 10,
            },
          })
          superAdminSeeded = true
        }
      } catch (seedErr: any) {
        console.error('Super admin seeding failed:', seedErr?.message)
      }

      return NextResponse.json({
        message: `Database schema created successfully! All tables are ready. You can now register and log in.${superAdminSeeded ? ' Super Admin account has been seeded (wabithetechnurse@nurseos.com / #Abolaji7977).' : ''}`,
        status: 'setup_complete',
        tablesCreated: createdTables.length,
        superAdminSeeded,
      })
    } else {
      return NextResponse.json({
        message: 'Schema creation partially completed. Some tables may have issues.',
        status: 'partial_setup',
        tablesCreated: createdTables.length,
        errors: errors.length > 0 ? errors : undefined,
        hint: 'Try running `npx prisma db push` from your local machine with the DATABASE_URL from Vercel.',
      }, { status: 207 })
    }
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create database schema.',
        details: error?.message?.substring(0, 500),
        hint: 'Try running `npx prisma db push` from your local machine with the DATABASE_URL from Vercel.',
      },
      { status: 500 }
    )
  }
}
