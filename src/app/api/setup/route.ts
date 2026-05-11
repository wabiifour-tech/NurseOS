import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'
import { randomUUID } from 'crypto'

/**
 * POST /api/setup — Push Prisma schema to the database
 * Call this once after connecting a new PostgreSQL database.
 * After setup, auth (register/login) will work immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set DATABASE_URL in Vercel → Settings → Environment Variables first.' },
        { status: 503 }
      )
    }

    // Check if core tables already exist
    try {
      await db.user.findFirst({ take: 1 })
      return NextResponse.json({
        message: 'Database is already set up. Tables exist. You can register and log in!',
        status: 'already_setup',
      })
    } catch {
      // Tables don't exist yet — proceed
    }

    // Create tables using PostgreSQL-compatible DDL
    // Using gen_random_uuid() which is available in PostgreSQL 13+

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
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
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NurseProfile" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminProfile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "facilityId" TEXT,
        "department" TEXT,
        "accessLevel" INTEGER NOT NULL DEFAULT 1
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PatientProfile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT UNIQUE,
        "patientId" TEXT NOT NULL UNIQUE,
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Facility" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "resource" TEXT NOT NULL,
        "resourceId" TEXT,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "data" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "readAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MedicalRecord" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VitalSign" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NursingNote" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MedicationOrder" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LabOrder" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AIInteraction" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Department" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "facilityId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "headNurseId" TEXT,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Referral" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Consultation" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "KnowledgeArticle" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ArticleComment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "articleId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FacilityAnalytics" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DiseaseSurveillance" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StaffingPrediction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "facilityId" TEXT NOT NULL,
        "departmentId" TEXT,
        "predictedDate" TIMESTAMP(3) NOT NULL,
        "predictedPatientLoad" INTEGER,
        "recommendedStaffing" INTEGER,
        "confidence" DOUBLE PRECISION,
        "factors" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Credential" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Competency" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nurseId" TEXT NOT NULL,
        "competencyArea" TEXT NOT NULL,
        "level" TEXT NOT NULL,
        "assessedBy" TEXT,
        "assessedAt" TIMESTAMP(3),
        "evidence" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PortfolioEntry" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CPDRecord" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Course" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CourseModule" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Enrollment" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Simulation" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SimulationAttempt" (
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
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Appointment" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VisitRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "patientId" TEXT NOT NULL,
        "facilityId" TEXT,
        "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "visitType" TEXT NOT NULL,
        "outcome" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Create indexes
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId", "createdAt")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NurseProfile_licenseNumber_idx" ON "NurseProfile"("licenseNumber")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId", "isRead", "createdAt")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId", "encounterDate")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "VitalSign_patientId_idx" ON "VitalSign"("patientId", "recordedAt")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "NursingNote_recordId_idx" ON "NursingNote"("recordId", "createdAt")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MedicationOrder_patientId_idx" ON "MedicationOrder"("patientId", "status")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Referral_fromFacilityId_idx" ON "Referral"("fromFacilityId", "status")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Credential_nurseId_idx" ON "Credential"("nurseId", "credentialType")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Course_slug_idx" ON "Course"("slug")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Enrollment_courseId_nurseId_key" ON "Enrollment"("courseId", "nurseId")`)

    // Add foreign key constraints
    const fkConstraints = [
      `ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "NurseProfile" ADD CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    ]

    for (const fk of fkConstraints) {
      try {
        await db.$executeRawUnsafe(fk)
      } catch {
        // FK may already exist, ignore
      }
    }

    resetDbConnectionStatus()

    return NextResponse.json({
      message: 'Database schema created successfully! All 30+ tables are ready. You can now register and log in.',
      status: 'setup_complete',
    })
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
