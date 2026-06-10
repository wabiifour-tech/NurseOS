import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

/**
 * GET /api/setup — Check setup status
 * POST /api/setup — Create all database tables using raw SQL DDL
 *
 * Uses db.$executeRawUnsafe() instead of `prisma db push` because
 * Vercel's serverless environment cannot run `npx` commands.
 *
 * The SQL DDL is generated to exactly match the Prisma schema.
 * Call POST once after connecting a new PostgreSQL database.
 */

// ─── SQL DDL for all tables (matches Prisma schema exactly) ───
// Tables are ordered by dependency (independent tables first)

function getCreateTableSQL(): string[] {
  return [
    // ═══ FACILITY (independent) ═══
    `CREATE TABLE IF NOT EXISTS "Facility" (
      "id" TEXT PRIMARY KEY,
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
    )`,

    // ═══ USER (depends on Facility via optional facilityId) ═══
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
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
      "twoFactorSecret" TEXT,
      "compactMode" BOOLEAN NOT NULL DEFAULT false,
      "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
      "deletedAt" TIMESTAMP(3),
      "facilityId" TEXT,
      "lastLoginAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ NURSE PROFILE (depends on User, Facility) ═══
    `CREATE TABLE IF NOT EXISTS "NurseProfile" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "NurseProfile_currentFacilityId_fkey" FOREIGN KEY ("currentFacilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ ADMIN PROFILE (depends on User, Facility) ═══
    `CREATE TABLE IF NOT EXISTS "AdminProfile" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL UNIQUE,
      "facilityId" TEXT,
      "department" TEXT,
      "accessLevel" INTEGER NOT NULL DEFAULT 1,
      CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AdminProfile_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ PATIENT PROFILE (depends on User?, Facility) ═══
    `CREATE TABLE IF NOT EXISTS "PatientProfile" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "PatientProfile_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ PASSWORD RESET (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "PasswordReset" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ SESSION (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ NOTIFICATION (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "data" TEXT,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "readAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ AUDIT LOG (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "resource" TEXT NOT NULL,
      "resourceId" TEXT,
      "details" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ DEPARTMENT (depends on Facility, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "Department" (
      "id" TEXT PRIMARY KEY,
      "facilityId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "headNurseId" TEXT,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Department_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Department_headNurseId_fkey" FOREIGN KEY ("headNurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ MEDICAL RECORD (depends on PatientProfile, Facility, Department?, NurseProfile?) ═══
    `CREATE TABLE IF NOT EXISTS "MedicalRecord" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MedicalRecord_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MedicalRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "MedicalRecord_attendingNurseId_fkey" FOREIGN KEY ("attendingNurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ VITAL SIGN (depends on PatientProfile, MedicalRecord?, NurseProfile?) ═══
    `CREATE TABLE IF NOT EXISTS "VitalSign" (
      "id" TEXT PRIMARY KEY,
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
      "source" TEXT NOT NULL DEFAULT 'MANUAL',
      CONSTRAINT "VitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VitalSign_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "VitalSign_recordedByNurseId_fkey" FOREIGN KEY ("recordedByNurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ NURSING NOTE (depends on MedicalRecord, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "NursingNote" (
      "id" TEXT PRIMARY KEY,
      "recordId" TEXT NOT NULL,
      "nurseId" TEXT NOT NULL,
      "noteType" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
      "aiPrompt" TEXT,
      "isSigned" BOOLEAN NOT NULL DEFAULT false,
      "signedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NursingNote_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "NursingNote_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ AI INTERACTION (depends on MedicalRecord, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "AIInteraction" (
      "id" TEXT PRIMARY KEY,
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
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AIInteraction_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AIInteraction_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ MEDICATION ORDER (depends on PatientProfile, MedicalRecord, NurseProfile?) ═══
    `CREATE TABLE IF NOT EXISTS "MedicationOrder" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MedicationOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MedicationOrder_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MedicationOrder_verifiedByNurseId_fkey" FOREIGN KEY ("verifiedByNurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ LAB ORDER (depends on PatientProfile, MedicalRecord) ═══
    `CREATE TABLE IF NOT EXISTS "LabOrder" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "LabOrder_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ REFERRAL (depends on PatientProfile, Facility?, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "Referral" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Referral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Referral_fromFacilityId_fkey" FOREIGN KEY ("fromFacilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Referral_toFacilityId_fkey" FOREIGN KEY ("toFacilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Referral_referringNurseId_fkey" FOREIGN KEY ("referringNurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Referral_acceptedByNurseId_fkey" FOREIGN KEY ("acceptedByNurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ CONSULTATION (depends on NurseProfile, PatientProfile?) ═══
    `CREATE TABLE IF NOT EXISTS "Consultation" (
      "id" TEXT PRIMARY KEY,
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
      "webrtcOffer" TEXT,
      "webrtcAnswer" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Consultation_requestingNurseId_fkey" FOREIGN KEY ("requestingNurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Consultation_consultingNurseId_fkey" FOREIGN KEY ("consultingNurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ CONSULTATION MESSAGE (depends on Consultation, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "ConsultationMessage" (
      "id" TEXT PRIMARY KEY,
      "consultationId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ConsultationMessage_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ConsultationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ KNOWLEDGE ARTICLE (depends on NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "KnowledgeArticle" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ ARTICLE COMMENT (depends on KnowledgeArticle, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "ArticleComment" (
      "id" TEXT PRIMARY KEY,
      "articleId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ArticleComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ FACILITY ANALYTICS (depends on Facility) ═══
    `CREATE TABLE IF NOT EXISTS "FacilityAnalytics" (
      "id" TEXT PRIMARY KEY,
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
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "FacilityAnalytics_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "FacilityAnalytics_facilityId_date_period_key" UNIQUE ("facilityId", "date", "period")
    )`,

    // ═══ DISEASE SURVEILLANCE (depends on Facility) ═══
    `CREATE TABLE IF NOT EXISTS "DiseaseSurveillance" (
      "id" TEXT PRIMARY KEY,
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
      "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DiseaseSurveillance_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ STAFFING PREDICTION (depends on Facility) ═══
    `CREATE TABLE IF NOT EXISTS "StaffingPrediction" (
      "id" TEXT PRIMARY KEY,
      "facilityId" TEXT NOT NULL,
      "departmentId" TEXT,
      "predictedDate" TIMESTAMP(3) NOT NULL,
      "predictedPatientLoad" INTEGER,
      "recommendedStaffing" INTEGER,
      "confidence" DOUBLE PRECISION,
      "factors" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StaffingPrediction_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ CREDENTIAL (depends on NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "Credential" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Credential_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ COMPETENCY (depends on NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "Competency" (
      "id" TEXT PRIMARY KEY,
      "nurseId" TEXT NOT NULL,
      "competencyArea" TEXT NOT NULL,
      "level" TEXT NOT NULL,
      "assessedBy" TEXT,
      "assessedAt" TIMESTAMP(3),
      "evidence" TEXT,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Competency_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ PORTFOLIO ENTRY (depends on NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "PortfolioEntry" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PortfolioEntry_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ CPD RECORD (depends on NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "CPDRecord" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CPDRecord_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ COURSE (independent) ═══
    `CREATE TABLE IF NOT EXISTS "Course" (
      "id" TEXT PRIMARY KEY,
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
    )`,

    // ═══ COURSE MODULE (depends on Course) ═══
    `CREATE TABLE IF NOT EXISTS "CourseModule" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ SIMULATION (depends on Course?) ═══
    `CREATE TABLE IF NOT EXISTS "Simulation" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Simulation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ ENROLLMENT (depends on Course, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "Enrollment" (
      "id" TEXT PRIMARY KEY,
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
      "review" TEXT,
      CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Enrollment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Enrollment_courseId_nurseId_key" UNIQUE ("courseId", "nurseId")
    )`,

    // ═══ SIMULATION ATTEMPT (depends on Simulation, NurseProfile) ═══
    `CREATE TABLE IF NOT EXISTS "SimulationAttempt" (
      "id" TEXT PRIMARY KEY,
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
      "wouldRepeat" BOOLEAN,
      CONSTRAINT "SimulationAttempt_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SimulationAttempt_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ APPOINTMENT (depends on PatientProfile, Facility?, NurseProfile?) ═══
    `CREATE TABLE IF NOT EXISTS "Appointment" (
      "id" TEXT PRIMARY KEY,
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
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Appointment_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Appointment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "NurseProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ VISIT RECORD (depends on PatientProfile) ═══
    `CREATE TABLE IF NOT EXISTS "VisitRecord" (
      "id" TEXT PRIMARY KEY,
      "patientId" TEXT NOT NULL,
      "facilityId" TEXT,
      "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "visitType" TEXT NOT NULL,
      "outcome" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VisitRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ SUBSCRIPTION (depends on User, Facility) ═══
    `CREATE TABLE IF NOT EXISTS "Subscription" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "facilityId" TEXT NOT NULL UNIQUE,
      "plan" TEXT NOT NULL DEFAULT 'FREE',
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "isActive" BOOLEAN NOT NULL DEFAULT false,
      "trialEndsAt" TIMESTAMP(3),
      "currentPeriodStart" TIMESTAMP(3),
      "currentPeriodEnd" TIMESTAMP(3),
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "paymentMethod" TEXT,
      "paymentReference" TEXT,
      "amountPaid" DOUBLE PRECISION,
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "verifiedBy" TEXT,
      "verifiedAt" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Subscription_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ NOTIFICATION PREFERENCE (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "NotificationPreference" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "NotificationPreference_userId_key_key" UNIQUE ("userId", "key")
    )`,

    // ═══ REPORT SCHEDULE (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "ReportSchedule" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "templateId" TEXT NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "frequency" TEXT NOT NULL DEFAULT 'Monthly',
      "recipients" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ReportSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ReportSchedule_userId_templateId_key" UNIQUE ("userId", "templateId")
    )`,

    // ═══ GENERATED REPORT (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "GeneratedReport" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "facilityId" TEXT,
      "templateId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "reportType" TEXT NOT NULL,
      "period" TEXT NOT NULL,
      "contentBlob" TEXT,
      "fileSize" INTEGER,
      "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GeneratedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ DIRECT MESSAGE (depends on User) ═══
    `CREATE TABLE IF NOT EXISTS "DirectMessage" (
      "id" TEXT PRIMARY KEY,
      "threadKey" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "recipientId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "readAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // ═══ ANNOUNCEMENT (depends on User, Facility?) ═══
    `CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT PRIMARY KEY,
      "authorId" TEXT NOT NULL,
      "facilityId" TEXT,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'GENERAL',
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "isPinned" BOOLEAN NOT NULL DEFAULT false,
      "isGlobal" BOOLEAN NOT NULL DEFAULT false,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Announcement_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,

    // ═══ ANNOUNCEMENT READ (depends on Announcement, User) ═══
    `CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
      "id" TEXT PRIMARY KEY,
      "announcementId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "AnnouncementRead_announcementId_userId_key" UNIQUE ("announcementId", "userId")
    )`,

    // ═══ PRISMA MIGRATIONS TABLE (needed by Prisma) ═══
    `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" TIMESTAMP(3),
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMP(3),
      "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 1
    )`,

    // ─── INDEXES ───

    // User indexes
    `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
    `CREATE INDEX IF NOT EXISTS "User_facilityId_idx" ON "User"("facilityId")`,

    // NurseProfile indexes
    `CREATE INDEX IF NOT EXISTS "NurseProfile_licenseNumber_idx" ON "NurseProfile"("licenseNumber")`,

    // PasswordReset indexes
    `CREATE INDEX IF NOT EXISTS "PasswordReset_token_idx" ON "PasswordReset"("token")`,
    `CREATE INDEX IF NOT EXISTS "PasswordReset_userId_idx" ON "PasswordReset"("userId")`,

    // PatientProfile indexes
    `CREATE INDEX IF NOT EXISTS "PatientProfile_patientId_idx" ON "PatientProfile"("patientId")`,
    `CREATE INDEX IF NOT EXISTS "PatientProfile_facilityId_idx" ON "PatientProfile"("facilityId")`,

    // Facility indexes
    `CREATE INDEX IF NOT EXISTS "Facility_type_city_state_idx" ON "Facility"("type", "city", "state")`,
    `CREATE INDEX IF NOT EXISTS "Facility_isVerified_idx" ON "Facility"("isVerified")`,

    // Department indexes
    `CREATE INDEX IF NOT EXISTS "Department_facilityId_idx" ON "Department"("facilityId")`,

    // MedicalRecord indexes
    `CREATE INDEX IF NOT EXISTS "MedicalRecord_patientId_encounterDate_idx" ON "MedicalRecord"("patientId", "encounterDate")`,
    `CREATE INDEX IF NOT EXISTS "MedicalRecord_facilityId_status_idx" ON "MedicalRecord"("facilityId", "status")`,

    // VitalSign indexes
    `CREATE INDEX IF NOT EXISTS "VitalSign_patientId_recordedAt_idx" ON "VitalSign"("patientId", "recordedAt")`,

    // NursingNote indexes
    `CREATE INDEX IF NOT EXISTS "NursingNote_recordId_createdAt_idx" ON "NursingNote"("recordId", "createdAt")`,

    // AIInteraction indexes
    `CREATE INDEX IF NOT EXISTS "AIInteraction_recordId_idx" ON "AIInteraction"("recordId")`,

    // MedicationOrder indexes
    `CREATE INDEX IF NOT EXISTS "MedicationOrder_patientId_status_idx" ON "MedicationOrder"("patientId", "status")`,

    // LabOrder indexes
    `CREATE INDEX IF NOT EXISTS "LabOrder_patientId_status_idx" ON "LabOrder"("patientId", "status")`,

    // Referral indexes
    `CREATE INDEX IF NOT EXISTS "Referral_fromFacilityId_status_idx" ON "Referral"("fromFacilityId", "status")`,

    // Consultation indexes
    `CREATE INDEX IF NOT EXISTS "Consultation_requestingNurseId_status_idx" ON "Consultation"("requestingNurseId", "status")`,

    // ConsultationMessage indexes
    `CREATE INDEX IF NOT EXISTS "ConsultationMessage_consultationId_createdAt_idx" ON "ConsultationMessage"("consultationId", "createdAt")`,

    // KnowledgeArticle indexes
    `CREATE INDEX IF NOT EXISTS "KnowledgeArticle_category_isPublished_idx" ON "KnowledgeArticle"("category", "isPublished")`,
    `CREATE INDEX IF NOT EXISTS "KnowledgeArticle_slug_idx" ON "KnowledgeArticle"("slug")`,

    // ArticleComment indexes
    `CREATE INDEX IF NOT EXISTS "ArticleComment_articleId_createdAt_idx" ON "ArticleComment"("articleId", "createdAt")`,

    // FacilityAnalytics indexes
    `CREATE INDEX IF NOT EXISTS "FacilityAnalytics_facilityId_date_idx" ON "FacilityAnalytics"("facilityId", "date")`,

    // DiseaseSurveillance indexes
    `CREATE INDEX IF NOT EXISTS "DiseaseSurveillance_diseaseName_region_reportedAt_idx" ON "DiseaseSurveillance"("diseaseName", "region", "reportedAt")`,

    // StaffingPrediction indexes
    `CREATE INDEX IF NOT EXISTS "StaffingPrediction_facilityId_predictedDate_idx" ON "StaffingPrediction"("facilityId", "predictedDate")`,

    // Credential indexes
    `CREATE INDEX IF NOT EXISTS "Credential_nurseId_credentialType_idx" ON "Credential"("nurseId", "credentialType")`,

    // Competency indexes
    `CREATE INDEX IF NOT EXISTS "Competency_nurseId_competencyArea_idx" ON "Competency"("nurseId", "competencyArea")`,

    // PortfolioEntry indexes
    `CREATE INDEX IF NOT EXISTS "PortfolioEntry_nurseId_entryType_idx" ON "PortfolioEntry"("nurseId", "entryType")`,

    // CPDRecord indexes
    `CREATE INDEX IF NOT EXISTS "CPDRecord_nurseId_dateCompleted_idx" ON "CPDRecord"("nurseId", "dateCompleted")`,

    // Course indexes
    `CREATE INDEX IF NOT EXISTS "Course_category_isPublished_idx" ON "Course"("category", "isPublished")`,
    `CREATE INDEX IF NOT EXISTS "Course_slug_idx" ON "Course"("slug")`,

    // CourseModule indexes
    `CREATE INDEX IF NOT EXISTS "CourseModule_courseId_order_idx" ON "CourseModule"("courseId", "order")`,

    // Simulation indexes
    `CREATE INDEX IF NOT EXISTS "Simulation_scenarioType_difficulty_idx" ON "Simulation"("scenarioType", "difficulty")`,

    // SimulationAttempt indexes
    `CREATE INDEX IF NOT EXISTS "SimulationAttempt_simulationId_nurseId_idx" ON "SimulationAttempt"("simulationId", "nurseId")`,

    // Enrollment indexes
    `CREATE INDEX IF NOT EXISTS "Enrollment_nurseId_idx" ON "Enrollment"("nurseId")`,

    // Appointment indexes
    `CREATE INDEX IF NOT EXISTS "Appointment_facilityId_appointmentDate_idx" ON "Appointment"("facilityId", "appointmentDate")`,

    // VisitRecord indexes
    `CREATE INDEX IF NOT EXISTS "VisitRecord_patientId_visitDate_idx" ON "VisitRecord"("patientId", "visitDate")`,

    // Notification indexes
    `CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt")`,

    // AuditLog indexes
    `CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId")`,

    // Session indexes
    `CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token")`,
    `CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")`,

    // Subscription indexes
    `CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Subscription_facilityId_idx" ON "Subscription"("facilityId")`,
    `CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status")`,

    // NotificationPreference indexes
    `CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId")`,

    // ReportSchedule indexes
    `CREATE INDEX IF NOT EXISTS "ReportSchedule_userId_idx" ON "ReportSchedule"("userId")`,

    // GeneratedReport indexes
    `CREATE INDEX IF NOT EXISTS "GeneratedReport_userId_templateId_idx" ON "GeneratedReport"("userId", "templateId")`,
    `CREATE INDEX IF NOT EXISTS "GeneratedReport_userId_generatedAt_idx" ON "GeneratedReport"("userId", "generatedAt")`,

    // DirectMessage indexes
    `CREATE INDEX IF NOT EXISTS "DirectMessage_threadKey_createdAt_idx" ON "DirectMessage"("threadKey", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "DirectMessage_recipientId_isRead_idx" ON "DirectMessage"("recipientId", "isRead")`,
    `CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_idx" ON "DirectMessage"("senderId")`,

    // Announcement indexes
    `CREATE INDEX IF NOT EXISTS "Announcement_facilityId_createdAt_idx" ON "Announcement"("facilityId", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "Announcement_isGlobal_createdAt_idx" ON "Announcement"("isGlobal", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "Announcement_priority_createdAt_idx" ON "Announcement"("priority", "createdAt")`,

    // AnnouncementRead indexes
    `CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_idx" ON "AnnouncementRead"("userId")`,
  ]
}

// Tables to drop in reverse dependency order
function getDropTablesSQL(): string[] {
  const tables = [
    'AnnouncementRead', 'Announcement', 'DirectMessage',
    'GeneratedReport', 'ReportSchedule', 'NotificationPreference',
    'Subscription', 'VisitRecord', 'Appointment',
    'SimulationAttempt', 'Enrollment', 'Simulation', 'CourseModule', 'Course',
    'CPDRecord', 'PortfolioEntry', 'Competency', 'Credential',
    'StaffingPrediction', 'DiseaseSurveillance', 'FacilityAnalytics',
    'ArticleComment', 'KnowledgeArticle',
    'ConsultationMessage', 'Consultation', 'Referral',
    'LabOrder', 'MedicationOrder', 'AIInteraction',
    'NursingNote', 'VitalSign', 'MedicalRecord',
    'Department', 'PatientProfile', 'AdminProfile', 'NurseProfile',
    'PasswordReset', 'Session', 'Notification', 'AuditLog',
    'User', 'Facility',
    '_prisma_migrations',
  ]
  return tables.map(t => `DROP TABLE IF EXISTS "${t}" CASCADE`)
}

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
  const { searchParams } = new URL(request.url)
  const forceReset = searchParams.get('force') === 'true'
  const repairMode = searchParams.get('repair') === 'true'

  // Check if tables already exist
  let tablesAlreadyExist = false
  let schemaBroken = false
  try {
    await db.user.findFirst({ take: 1 })
    tablesAlreadyExist = true
  } catch (err: unknown) {
    const errMsg = ((err as Error)?.message || '').toLowerCase()
    if (errMsg.includes('does not exist') || errMsg.includes('column')) {
      try {
        const result = await db.$queryRaw`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User')` as Array<{ exists: boolean }>
        if (result?.[0]?.exists) {
          tablesAlreadyExist = true
          schemaBroken = true
        }
      } catch {}
    }
  }

  // Count existing users (to decide if auto-repair is safe)
  let userCount = 0
  try {
    const countResult = await db.$queryRaw`SELECT COUNT(*)::int as count FROM "User"` as Array<{ count: number }>
    userCount = countResult?.[0]?.count || 0
  } catch {
    userCount = 0
  }

  // If schema is broken and no users, auto-repair
  // Otherwise if tables exist and no force/repair, return already_setup
  if (schemaBroken && userCount === 0) {
    // Auto-force reset: safe because no data to protect
  } else if (tablesAlreadyExist && !forceReset && !repairMode) {
    return NextResponse.json({
      message: 'Database is already set up. Tables exist. You can register and log in!',
      status: 'already_setup',
    })
  }

  // Auth check for destructive operations on existing data
  let authUser = null
  try {
    authUser = await getAuthenticatedUser(request)
  } catch {}

  if (forceReset && !schemaBroken) {
    if (!authUser) return unauthorizedResponse()
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required for force reset' }, { status: 403 })
    }
  } else if (userCount > 0 && !schemaBroken) {
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

    // If force reset or broken schema with no users, drop all tables first
    const needsReset = forceReset || (schemaBroken && userCount === 0)
    if (needsReset) {
      console.log('[Setup] Dropping all existing tables...')
      const dropStatements = getDropTablesSQL()
      for (const sql of dropStatements) {
        try {
          await db.$executeRawUnsafe(sql)
        } catch {
          // Ignore — table might not exist
        }
      }
      console.log('[Setup] All tables dropped.')
    }

    // Create all tables using raw SQL DDL
    console.log('[Setup] Creating tables via raw SQL DDL...')
    const createStatements = getCreateTableSQL()
    const errors: string[] = []
    let tablesCreated = 0

    for (let i = 0; i < createStatements.length; i++) {
      const sql = createStatements[i]
      try {
        await db.$executeRawUnsafe(sql)
        // Only count table creation (not index creation)
        if (sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
          tablesCreated++
        }
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || String(err)
        // Ignore "already exists" errors for indexes
        if (errMsg.includes('already exists') && sql.trim().toUpperCase().startsWith('CREATE INDEX')) {
          continue
        }
        console.error(`[Setup] Error on statement ${i}:`, errMsg.substring(0, 200))
        errors.push(`Statement ${i}: ${errMsg.substring(0, 200)}`)
      }
    }

    console.log(`[Setup] Created ${tablesCreated} tables with ${errors.length} errors.`)

    // Reset cached connection status
    resetDbConnectionStatus()

    // Verify tables were created
    let tablesExist = false
    try {
      await db.user.findFirst({ take: 1 })
      tablesExist = true
    } catch {}

    if (tablesExist) {
      // Seed Super Admin if no users exist
      let superAdminSeeded = false
      try {
        const existingUserCount = await db.user.count()
        if (existingUserCount === 0) {
          const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@nurseos.digital'
          const adminPassword = process.env.SUPER_ADMIN_PASSWORD

          if (adminPassword) {
            const passwordHash = await bcrypt.hash(adminPassword, 10)
            const superAdmin = await db.user.create({
              data: {
                id: randomUUID(),
                email: adminEmail.toLowerCase(),
                passwordHash,
                firstName: 'Super',
                lastName: 'Admin',
                displayName: 'Super Admin',
                role: 'ADMIN',
                status: 'ACTIVE',
                countryCode: 'NG',
              },
            })
            await db.adminProfile.create({
              data: {
                id: randomUUID(),
                userId: superAdmin.id,
                accessLevel: 10,
              },
            })
            superAdminSeeded = true
          } else {
            console.log('[Setup] No SUPER_ADMIN_PASSWORD env var set — skipping super admin seeding')
          }
        }
      } catch (seedErr: unknown) {
        console.error('[Setup] Super admin seeding failed:', (seedErr as Error)?.message)
      }

      const seedMsg = superAdminSeeded
        ? ' Super Admin account has been seeded.'
        : ' No super admin seeded — set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars to seed one on next setup.'

      return NextResponse.json({
        message: `Database schema created successfully! ${tablesCreated} tables are ready. You can now register and log in.${seedMsg}`,
        status: 'setup_complete',
        method: 'raw_sql_ddl',
        tablesCreated,
        superAdminSeeded,
        errors: errors.length > 0 ? errors : undefined,
      })
    } else {
      return NextResponse.json({
        message: `Schema creation completed but tables could not be verified. ${tablesCreated} tables were created with ${errors.length} errors.`,
        status: 'partial_setup',
        method: 'raw_sql_ddl',
        tablesCreated,
        errors: errors.length > 0 ? errors : undefined,
      }, { status: 207 })
    }
  } catch (error: unknown) {
    console.error('[Setup] Setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create database schema.',
        details: (error as Error)?.message?.substring(0, 500),
      },
      { status: 500 }
    )
  }
}
