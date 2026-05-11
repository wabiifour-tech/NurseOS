import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseConnected, resetDbConnectionStatus } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * GET /api/seed — Check if database has been seeded
 * POST /api/seed — Seed the database with demo data
 *
 * This endpoint does the same thing as `npx prisma db seed` but
 * works from Vercel's serverless environment.
 */

export async function GET() {
  const dbConnected = await isDatabaseConnected()
  if (!dbConnected) {
    return NextResponse.json({ status: 'database_not_configured', seeded: false })
  }

  try {
    const userCount = await db.user.count()
    const facilityCount = await db.facility.count()
    return NextResponse.json({
      status: 'ok',
      seeded: userCount > 0 || facilityCount > 0,
      stats: { users: userCount, facilities: facilityCount },
    })
  } catch {
    return NextResponse.json({ status: 'error', seeded: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbConnected = await isDatabaseConnected()
    if (!dbConnected) {
      return NextResponse.json(
        { error: 'Database not configured. Set DATABASE_URL first.' },
        { status: 503 }
      )
    }

    // Check if tables exist
    try {
      await db.user.findFirst({ take: 1 })
    } catch {
      return NextResponse.json(
        { error: 'Tables do not exist yet. Please POST to /api/setup first to create the tables.' },
        { status: 400 }
      )
    }

    // Check if already seeded
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already has data. Seeding skipped.',
        status: 'already_seeded',
        existingUsers,
      })
    }

    const log: string[] = []

    // ========== CREATE FACILITIES ==========
    log.push('Creating facilities...')
    const facilities = await Promise.all([
      db.facility.create({
        data: {
          name: 'Lagos University Teaching Hospital', type: 'HOSPITAL', level: 'TERTIARY',
          address: 'Idi-Araba, Mushin', city: 'Lagos', state: 'Lagos', country: 'Nigeria',
          latitude: 6.5244, longitude: 3.3792, phone: '+234-1-497-2550', email: 'info@luth.org.ng',
          website: 'https://luth.org.ng', bedCapacity: 760, staffCount: 2850,
          registrationNumber: 'FHN/LAG/001', accreditingBody: 'Federal Ministry of Health',
          accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true,
          servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Cardiology', 'Oncology', 'Radiology', 'Laboratory']),
          operatingHours: '24/7',
        },
      }),
      db.facility.create({
        data: {
          name: 'National Hospital Abuja', type: 'HOSPITAL', level: 'TERTIARY',
          address: 'Central District, Garki', city: 'Abuja', state: 'FCT', country: 'Nigeria',
          latitude: 9.0579, longitude: 7.4951, phone: '+234-9-523-3111', email: 'info@nationalhospital.gov.ng',
          website: 'https://nationalhospital.gov.ng', bedCapacity: 500, staffCount: 2100,
          registrationNumber: 'FHN/FCT/001', accreditingBody: 'Federal Ministry of Health',
          accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true,
          servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Neurosurgery', 'Nephrology', 'Cardiology', 'Orthopedics']),
          operatingHours: '24/7',
        },
      }),
      db.facility.create({
        data: {
          name: 'University College Hospital Ibadan', type: 'HOSPITAL', level: 'TERTIARY',
          address: 'Queen Elizabeth Road, Mokola', city: 'Ibadan', state: 'Oyo', country: 'Nigeria',
          latitude: 7.3775, longitude: 3.9470, phone: '+234-2-241-0088', email: 'info@uch-ibadan.org.ng',
          bedCapacity: 650, staffCount: 2400, registrationNumber: 'FHN/OYO/001',
          accreditingBody: 'Federal Ministry of Health', accreditationStatus: 'ACCREDITED',
          isVerified: true, isEmergencyCapable: true,
          servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Oncology', 'Dermatology', 'Psychiatry', 'Radiology']),
          operatingHours: '24/7',
        },
      }),
      db.facility.create({
        data: {
          name: 'Gwagwalada Primary Health Center', type: 'PRIMARY_HEALTH_CENTER', level: 'PRIMARY',
          address: 'Gwagwalada Town', city: 'Gwagwalada', state: 'FCT', country: 'Nigeria',
          phone: '+234-803-600-1234', bedCapacity: 30, staffCount: 45,
          registrationNumber: 'PHC/FCT/GWA/001', accreditingBody: 'FCT Primary Health Care Board',
          accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false,
          servicesOffered: JSON.stringify(['Antenatal Care', 'Immunization', 'Family Planning', 'Malaria Treatment', 'HIV Counseling']),
          operatingHours: 'Mon-Fri 8:00-17:00, Sat 8:00-13:00',
        },
      }),
      db.facility.create({
        data: {
          name: 'Rainbow Specialist Medical Center', type: 'SPECIALIST_CENTER', level: 'SECONDARY',
          address: '52 Awolowo Road, Ikoyi', city: 'Lagos', state: 'Lagos', country: 'Nigeria',
          latitude: 6.4485, longitude: 3.4267, phone: '+234-1-269-7800', email: 'info@rainbowspecialist.com',
          bedCapacity: 80, staffCount: 180, registrationNumber: 'FHN/LAG/SPE/042',
          accreditingBody: 'Lagos State Ministry of Health', accreditationStatus: 'ACCREDITED',
          isVerified: true, isEmergencyCapable: true,
          servicesOffered: JSON.stringify(['Cardiology', 'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Rheumatology']),
          operatingHours: 'Mon-Sat 8:00-20:00, Emergency 24/7',
        },
      }),
    ])
    log.push(`Created ${facilities.length} facilities`)

    // ========== CREATE ADMIN USER ==========
    log.push('Creating admin user...')
    const adminUser = await db.user.create({
      data: {
        email: 'admin@nurseos.ng', passwordHash: await hashPassword('Admin@2024'),
        firstName: 'Amina', lastName: 'Okonkwo', middleName: 'Blessing', displayName: 'Amina Okonkwo',
        phone: '+234-803-000-0001', countryCode: 'NG', role: 'ADMIN', status: 'ACTIVE', emailVerified: true,
        adminProfile: { create: { facilityId: facilities[0].id, department: 'Administration', accessLevel: 5 } },
      },
    })
    log.push('Admin: admin@nurseos.ng / Admin@2024')

    // ========== CREATE NURSE USERS ==========
    log.push('Creating nurse users...')
    const nurseData = [
      { firstName: 'Chidinma', lastName: 'Eze', middleName: 'Grace', email: 'chidinma.eze@nurseos.ng', phone: '+234-803-000-0002', specialization: 'Critical Care Nursing', yearsOfExperience: 8, licenseNumber: 'NMCN/2024/00123', degree: 'B.NSc', university: 'University of Lagos', graduationYear: 2015, facilityId: facilities[0].id, blsCertified: true, aclsCertified: true, bio: 'Experienced critical care nurse with a passion for patient advocacy and evidence-based practice.', skills: ['Critical Care', 'Ventilator Management', 'IV Therapy', 'Patient Assessment', 'Emergency Response'], languages: ['English', 'Igbo', 'Yoruba'] },
      { firstName: 'Adamu', lastName: 'Bello', middleName: 'Ibrahim', email: 'adamu.bello@nurseos.ng', phone: '+234-803-000-0003', specialization: 'Community Health Nursing', yearsOfExperience: 12, licenseNumber: 'NMCN/2024/00456', degree: 'M.Sc Nursing', university: 'Ahmadu Bello University', graduationYear: 2011, facilityId: facilities[3].id, blsCertified: true, aclsCertified: false, bio: 'Community health specialist dedicated to improving primary healthcare delivery in underserved areas across Northern Nigeria.', skills: ['Community Health', 'Health Education', 'Epidemiology', 'Maternal & Child Health', 'HIV/AIDS Management'], languages: ['English', 'Hausa', 'Fulfulde'] },
      { firstName: 'Folake', lastName: 'Adeyemi', middleName: 'Oluwaseun', email: 'folake.adeyemi@nurseos.ng', phone: '+234-803-000-0004', specialization: 'Pediatric Nursing', yearsOfExperience: 6, licenseNumber: 'NMCN/2024/00789', degree: 'B.NSc', university: 'Obafemi Awolowo University', graduationYear: 2017, facilityId: facilities[2].id, blsCertified: true, aclsCertified: true, bio: 'Pediatric nurse specializing in neonatal care. Passionate about reducing infant mortality through evidence-based interventions.', skills: ['Pediatric Care', 'Neonatal Intensive Care', 'Child Development', 'Family-Centered Care', 'Immunization'], languages: ['English', 'Yoruba'] },
      { firstName: 'Ngozi', lastName: 'Okafor', middleName: 'Chioma', email: 'ngozi.okafor@nurseos.ng', phone: '+234-803-000-0005', specialization: 'Midwifery', yearsOfExperience: 10, licenseNumber: 'NMCN/2024/01012', degree: 'B.NSc (Midwifery)', university: 'University of Nigeria Nsukka', graduationYear: 2013, facilityId: facilities[0].id, blsCertified: true, aclsCertified: false, bio: 'Certified midwife with extensive experience in antenatal care, labor management, and postnatal support.', skills: ['Midwifery', 'Antenatal Care', 'Labor & Delivery', 'Postnatal Care', 'Emergency Obstetric Care'], languages: ['English', 'Igbo'] },
      { firstName: 'Blessing', lastName: 'Ibrahim', middleName: null, email: 'blessing.ibrahim@nurseos.ng', phone: '+234-803-000-0006', specialization: 'Medical-Surgical Nursing', yearsOfExperience: 4, licenseNumber: 'NMCN/2024/01345', degree: 'B.NSc', university: 'Bayero University Kano', graduationYear: 2019, facilityId: facilities[1].id, blsCertified: true, aclsCertified: false, bio: 'Medical-surgical nurse focused on perioperative care and wound management.', skills: ['Medical-Surgical', 'Wound Care', 'Perioperative', 'Patient Education', 'IV Therapy'], languages: ['English', 'Hausa'] },
    ]

    const nurses = []
    for (const nd of nurseData) {
      const user = await db.user.create({
        data: {
          email: nd.email, passwordHash: await hashPassword('Nurse@2024'),
          firstName: nd.firstName, lastName: nd.lastName, middleName: nd.middleName || null,
          displayName: `${nd.firstName} ${nd.lastName}`, phone: nd.phone, countryCode: 'NG',
          role: 'NURSE', status: 'ACTIVE', emailVerified: true,
          nurseProfile: {
            create: {
              licenseNumber: nd.licenseNumber, licenseIssuingBody: 'NMCN',
              licenseExpiryDate: new Date('2026-12-31'), specialization: nd.specialization,
              yearsOfExperience: nd.yearsOfExperience, currentFacilityId: nd.facilityId,
              blsCertified: nd.blsCertified, blsCertExpiry: nd.blsCertified ? new Date('2025-06-30') : null,
              aclsCertified: nd.aclsCertified, aclsCertExpiry: nd.aclsCertified ? new Date('2025-09-15') : null,
              nursingCouncil: 'Nigeria', degree: nd.degree, university: nd.university,
              graduationYear: nd.graduationYear, bio: nd.bio,
              skills: JSON.stringify(nd.skills), languages: JSON.stringify(nd.languages),
              availableForConsult: nd.yearsOfExperience >= 8, rating: 4.2, totalRatings: 15,
            },
          },
        },
        include: { nurseProfile: true },
      })
      nurses.push(user)
    }
    log.push(`Created ${nurses.length} nurses (password: Nurse@2024)`)

    // ========== CREATE PATIENTS ==========
    log.push('Creating patients...')
    const patientData = [
      { firstName: 'Emeka', lastName: 'Nwankwo', email: 'emeka.nwankwo@email.com', dateOfBirth: '1985-03-15', gender: 'MALE', bloodType: 'O+', genotype: 'AA', allergies: ['Penicillin'], emergencyContactName: 'Ada Nwankwo', emergencyContactPhone: '+234-803-111-0001', emergencyContactRelation: 'Wife', stateOfOrigin: 'Anambra', occupation: 'Civil Engineer', insuranceProvider: 'NHIS', insuranceNumber: 'NHIS/2024/88901' },
      { firstName: 'Aisha', lastName: 'Mohammed', email: 'aisha.mohammed@email.com', dateOfBirth: '1992-07-22', gender: 'FEMALE', bloodType: 'A+', genotype: 'AS', allergies: ['Sulfa drugs', 'Latex'], emergencyContactName: 'Ibrahim Mohammed', emergencyContactPhone: '+234-803-111-0002', emergencyContactRelation: 'Husband', stateOfOrigin: 'Kano', occupation: 'Teacher', insuranceProvider: 'NHIS', insuranceNumber: 'NHIS/2024/88902' },
      { firstName: 'Oluwaseun', lastName: 'Fasanya', email: 'oluwaseun.fasanya@email.com', dateOfBirth: '1978-11-05', gender: 'MALE', bloodType: 'B+', genotype: 'AA', allergies: [], emergencyContactName: 'Bimpe Fasanya', emergencyContactPhone: '+234-803-111-0003', emergencyContactRelation: 'Sister', stateOfOrigin: 'Ogun', occupation: 'Banker', insuranceProvider: 'Leadway Health', insuranceNumber: 'LWH/2024/22345' },
      { firstName: 'Fatima', lastName: 'Abubakar', email: null, dateOfBirth: '1955-01-30', gender: 'FEMALE', bloodType: 'AB+', genotype: 'AA', allergies: ['Aspirin'], emergencyContactName: 'Yusuf Abubakar', emergencyContactPhone: '+234-803-111-0004', emergencyContactRelation: 'Son', stateOfOrigin: 'Borno', occupation: 'Retired Civil Servant', insuranceProvider: 'NHIS', insuranceNumber: 'NHIS/2024/88903' },
      { firstName: 'Chukwuma', lastName: 'Okafor', email: 'chukwuma.okafor@email.com', dateOfBirth: '2018-06-10', gender: 'MALE', bloodType: 'O-', genotype: 'SS', allergies: [], emergencyContactName: 'Nneka Okafor', emergencyContactPhone: '+234-803-111-0005', emergencyContactRelation: 'Mother', stateOfOrigin: 'Imo', occupation: null, insuranceProvider: 'NHIS', insuranceNumber: 'NHIS/2024/88904' },
      { firstName: 'Adaeze', lastName: 'Eze', email: 'adaeze.eze@email.com', dateOfBirth: '1990-09-18', gender: 'FEMALE', bloodType: 'A-', genotype: 'AA', allergies: ['Ibuprofen'], emergencyContactName: 'Obinna Eze', emergencyContactPhone: '+234-803-111-0006', emergencyContactRelation: 'Brother', stateOfOrigin: 'Enugu', occupation: 'Pharmacist', insuranceProvider: 'AXA Mansard', insuranceNumber: 'AXA/2024/55678' },
    ]

    const patients = []
    for (let i = 0; i < patientData.length; i++) {
      const pd = patientData[i]
      const patientId = `PT/2024/${String(i + 1).padStart(5, '0')}`
      let userId: string | null = null
      if (pd.email) {
        const user = await db.user.create({
          data: { email: pd.email.toLowerCase(), passwordHash: await hashPassword(`patient-seed-${i}`), firstName: pd.firstName, lastName: pd.lastName, displayName: `${pd.firstName} ${pd.lastName}`, countryCode: 'NG', role: 'PATIENT', status: 'ACTIVE' },
        })
        userId = user.id
      }
      const patient = await db.patientProfile.create({
        data: { userId, patientId, dateOfBirth: pd.dateOfBirth ? new Date(pd.dateOfBirth) : null, gender: pd.gender, bloodType: pd.bloodType, genotype: pd.genotype, allergies: JSON.stringify(pd.allergies), emergencyContactName: pd.emergencyContactName, emergencyContactPhone: pd.emergencyContactPhone, emergencyContactRelation: pd.emergencyContactRelation, nationality: 'Nigerian', stateOfOrigin: pd.stateOfOrigin, occupation: pd.occupation, insuranceProvider: pd.insuranceProvider || null, insuranceNumber: pd.insuranceNumber || null },
      })
      patients.push(patient)
    }
    log.push(`Created ${patients.length} patients`)

    // ========== CREATE DEPARTMENTS ==========
    log.push('Creating departments...')
    const departments = await Promise.all([
      db.department.create({ data: { facilityId: facilities[0].id, name: 'Emergency Department', headNurseId: nurses[0].nurseProfile!.id, description: '24/7 Emergency and Trauma Care' } }),
      db.department.create({ data: { facilityId: facilities[0].id, name: 'Maternity Ward', headNurseId: nurses[3].nurseProfile!.id, description: 'Antenatal, Labour, and Postnatal Care' } }),
      db.department.create({ data: { facilityId: facilities[1].id, name: 'Pediatrics', headNurseId: nurses[2].nurseProfile!.id, description: 'Pediatric and Neonatal Care Unit' } }),
      db.department.create({ data: { facilityId: facilities[3].id, name: 'General Outpatient', headNurseId: nurses[1].nurseProfile!.id, description: 'Primary care and outpatient services' } }),
    ])
    log.push(`Created ${departments.length} departments`)

    // ========== CREATE MEDICAL RECORDS ==========
    log.push('Creating medical records...')
    const medicalRecords = await Promise.all([
      db.medicalRecord.create({ data: { patientId: patients[0].id, facilityId: facilities[0].id, departmentId: departments[0].id, encounterType: 'EMERGENCY', attendingNurseId: nurses[0].nurseProfile!.id, chiefComplaint: 'Severe chest pain and shortness of breath', historyOfPresentIllness: 'Patient presents with acute onset chest pain radiating to left arm.', pastMedicalHistory: 'Hypertension x5 years, Type 2 Diabetes Mellitus x3 years', nursingAssessment: 'Patient appears in acute distress. Alert and oriented. Skin diaphoretic.', nursingDiagnosis: JSON.stringify(['Acute Pain related to myocardial ischemia', 'Decreased Cardiac Output']), status: 'ACTIVE' } }),
      db.medicalRecord.create({ data: { patientId: patients[1].id, facilityId: facilities[0].id, departmentId: departments[1].id, encounterType: 'INPATIENT', attendingNurseId: nurses[3].nurseProfile!.id, chiefComplaint: 'Antenatal admission for threatened preterm labor at 32 weeks', historyOfPresentIllness: 'Gravida 2 Para 1, 32 weeks gestation with regular uterine contractions.', pastMedicalHistory: 'Previous C-section 3 years ago', nursingAssessment: 'Patient in mild discomfort. Vital signs stable. Fetal heart rate 140 bpm.', nursingDiagnosis: JSON.stringify(['Risk for Preterm Labor', 'Anxiety related to pregnancy complications']), status: 'ACTIVE' } }),
      db.medicalRecord.create({ data: { patientId: patients[4].id, facilityId: facilities[1].id, departmentId: departments[2].id, encounterType: 'INPATIENT', attendingNurseId: nurses[2].nurseProfile!.id, chiefComplaint: 'Vaso-occlusive crisis secondary to sickle cell disease', historyOfPresentIllness: '6-year-old male with known SS genotype presenting with severe pain.', pastMedicalHistory: 'Sickle Cell Disease (SS), multiple vaso-occlusive crises', nursingAssessment: 'Child in severe pain, crying, guarding limbs. Pale conjunctiva. Mild jaundice.', nursingDiagnosis: JSON.stringify(['Acute Pain related to vaso-occlusion', 'Risk for Infection']), status: 'ACTIVE' } }),
    ])
    log.push(`Created ${medicalRecords.length} medical records`)

    // ========== CREATE VITAL SIGNS ==========
    await Promise.all([
      db.vitalSign.create({ data: { patientId: patients[0].id, recordId: medicalRecords[0].id, recordedByNurseId: nurses[0].nurseProfile!.id, temperature: 37.2, heartRate: 102, respiratoryRate: 24, bloodPressureSystolic: 160, bloodPressureDiastolic: 100, oxygenSaturation: 94, weight: 85, height: 175, bmi: 27.8, painScale: 8, consciousnessLevel: 'ALERT', earlyWarningScore: 5, isAbnormal: true, notes: 'Patient in acute distress.' } }),
      db.vitalSign.create({ data: { patientId: patients[1].id, recordId: medicalRecords[1].id, recordedByNurseId: nurses[3].nurseProfile!.id, temperature: 36.8, heartRate: 88, respiratoryRate: 18, bloodPressureSystolic: 120, bloodPressureDiastolic: 78, oxygenSaturation: 98, weight: 72, painScale: 3, consciousnessLevel: 'ALERT', earlyWarningScore: 1, isAbnormal: false } }),
      db.vitalSign.create({ data: { patientId: patients[4].id, recordId: medicalRecords[2].id, recordedByNurseId: nurses[2].nurseProfile!.id, temperature: 37.8, heartRate: 120, respiratoryRate: 28, bloodPressureSystolic: 110, bloodPressureDiastolic: 70, oxygenSaturation: 96, weight: 20, height: 115, bmi: 15.1, painScale: 9, consciousnessLevel: 'ALERT', earlyWarningScore: 4, isAbnormal: true, notes: 'Child in severe pain from sickle cell crisis.' } }),
    ])
    log.push('Created vital signs')

    // ========== CREATE NURSING NOTES ==========
    await Promise.all([
      db.nursingNote.create({ data: { recordId: medicalRecords[0].id, nurseId: nurses[0].nurseProfile!.id, noteType: 'SOAP', content: JSON.stringify({ subjective: 'Patient reports severe chest pain 8/10', objective: 'BP 160/100, HR 102, SpO2 94%', assessment: 'Acute coronary syndrome suspected', plan: 'Continue cardiac monitoring. Administer prescribed NTG SL.' }), aiGenerated: false, isSigned: true, signedAt: new Date() } }),
      db.nursingNote.create({ data: { recordId: medicalRecords[1].id, nurseId: nurses[3].nurseProfile!.id, noteType: 'SBAR', content: JSON.stringify({ situation: 'Mrs. Mohammed, 32 weeks gestation, regular contractions', background: 'Previous C-section 3 years ago', assessment: 'Threatened preterm labor. Cervix 2cm dilated.', recommendation: 'Tocolytics as prescribed. Continuous fetal monitoring.' }), aiGenerated: false, isSigned: true, signedAt: new Date() } }),
    ])
    log.push('Created nursing notes')

    // ========== CREATE COURSES ==========
    const courses = await Promise.all([
      db.course.create({ data: { title: 'Fundamentals of Critical Care Nursing', slug: 'fundamentals-critical-care-nursing', description: 'Comprehensive course covering the essentials of critical care nursing.', category: 'Critical Care', level: 'INTERMEDIATE', durationMinutes: 480, cpdPoints: 8, language: 'en', tags: JSON.stringify(['critical care', 'ICU', 'ventilator']), isPublished: true, isFree: false, price: 15000, enrollmentCount: 234, rating: 4.6, totalRatings: 89 } }),
      db.course.create({ data: { title: 'Infection Prevention and Control in Nigerian Healthcare Settings', slug: 'infection-prevention-control-nigeria', description: 'Essential training on infection prevention and control practices tailored to Nigeria.', category: 'Infection Control', level: 'BEGINNER', durationMinutes: 180, cpdPoints: 3, language: 'en', tags: JSON.stringify(['infection control', 'IPC', 'hand hygiene', 'PPE']), isPublished: true, isFree: true, enrollmentCount: 567, rating: 4.8, totalRatings: 201 } }),
      db.course.create({ data: { title: 'Emergency Obstetric and Newborn Care (EmONC)', slug: 'emergency-obstetric-newborn-care', description: 'Training in life-saving emergency obstetric and newborn care interventions.', category: 'Maternal Health', level: 'INTERMEDIATE', durationMinutes: 360, cpdPoints: 6, language: 'en', tags: JSON.stringify(['obstetrics', 'newborn care', 'EmONC', 'midwifery']), isPublished: true, isFree: true, enrollmentCount: 412, rating: 4.7, totalRatings: 156 } }),
      db.course.create({ data: { title: 'Sickle Cell Disease: Nursing Management and Patient Education', slug: 'sickle-cell-disease-nursing-management', description: 'Specialized course on the nursing management of sickle cell disease.', category: 'Hematology', level: 'INTERMEDIATE', durationMinutes: 240, cpdPoints: 4, language: 'en', tags: JSON.stringify(['sickle cell', 'hematology', 'pain management']), isPublished: true, isFree: true, enrollmentCount: 189, rating: 4.5, totalRatings: 67 } }),
      db.course.create({ data: { title: 'Digital Health and Telemedicine for Nigerian Nurses', slug: 'digital-health-telemedicine-nigeria', description: 'Introduction to digital health tools and telemedicine practices for nurses.', category: 'Digital Health', level: 'BEGINNER', durationMinutes: 120, cpdPoints: 2, language: 'en', tags: JSON.stringify(['telemedicine', 'digital health', 'technology']), isPublished: true, isFree: true, enrollmentCount: 345, rating: 4.3, totalRatings: 124 } }),
      db.course.create({ data: { title: 'Advanced Cardiac Life Support (ACLS) Certification Prep', slug: 'acls-certification-preparation', description: 'Comprehensive preparation course for ACLS certification.', category: 'Emergency Care', level: 'ADVANCED', durationMinutes: 600, cpdPoints: 10, language: 'en', tags: JSON.stringify(['ACLS', 'cardiac', 'emergency', 'resuscitation']), isPublished: true, isFree: false, price: 25000, enrollmentCount: 156, rating: 4.9, totalRatings: 98 } }),
    ])
    log.push(`Created ${courses.length} courses`)

    // ========== CREATE COURSE MODULES ==========
    const moduleTitles: Record<string, string[]> = {
      'Critical Care': ['Introduction to Critical Care', 'Ventilator Management', 'Hemodynamic Monitoring', 'Pharmacology in ICU'],
      'Infection Control': ['Understanding HAIs', 'Hand Hygiene & PPE', 'Outbreak Response', 'Waste Management'],
      'Maternal Health': ['Antenatal Care Assessment', 'Managing Obstetric Emergencies', 'Newborn Resuscitation', 'Postpartum Complications'],
      'Hematology': ['Understanding Sickle Cell Disease', 'Pain Management Strategies', 'Crisis Prevention', 'Psychosocial Support'],
      'Digital Health': ['Introduction to Digital Health', 'Telemedicine Best Practices', 'EHR & Data Management'],
      'Emergency Care': ['BLS Review & Updates', 'ACLS Algorithms', 'Pharmacology', 'Megacode Practice'],
    }
    for (const course of courses) {
      const titles = moduleTitles[course.category] || ['Introduction', 'Core Concepts', 'Advanced Topics']
      for (let m = 0; m < titles.length; m++) {
        await db.courseModule.create({ data: { courseId: course.id, title: titles[m], description: `Learning module covering key aspects of ${course.category.toLowerCase()}.`, order: m + 1, contentType: m === 0 ? 'VIDEO' : m % 2 === 0 ? 'TEXT' : 'INTERACTIVE', durationMinutes: 20, isRequired: true } })
      }
    }
    log.push('Created course modules')

    // ========== CREATE ENROLLMENTS ==========
    for (let i = 0; i < Math.min(nurses.length, 4); i++) {
      await db.enrollment.create({ data: { courseId: courses[i % courses.length].id, nurseId: nurses[i].nurseProfile!.id, progressPercent: [35, 60, 15, 80][i], lastAccessedAt: new Date() } })
    }
    log.push('Created enrollments')

    // ========== CREATE REFERRAL ==========
    await db.referral.create({ data: { patientId: patients[4].id, fromFacilityId: facilities[3].id, toFacilityId: facilities[1].id, referringNurseId: nurses[1].nurseProfile!.id, reason: 'Sickle cell crisis requiring specialized pediatric hematology care', clinicalSummary: '6-year-old male with SS genotype, 3rd vaso-occlusive crisis this year.', urgency: 'URGENT', status: 'ACCEPTED', acceptedByNurseId: nurses[2].nurseProfile!.id, acceptedAt: new Date() } })
    log.push('Created referral')

    // ========== CREATE DISEASE SURVEILLANCE ==========
    await Promise.all([
      db.diseaseSurveillance.create({ data: { facilityId: facilities[0].id, region: 'South West', diseaseName: 'Cholera', caseCount: 45, expectedRange: '5-15', isOutbreakAlert: true, alertLevel: 'HIGH', affectedGroups: JSON.stringify(['Children under 5', 'Elderly']), geographicCluster: 'Lagos Island, Eti-Osa LGA' } }),
      db.diseaseSurveillance.create({ data: { facilityId: facilities[1].id, region: 'North Central', diseaseName: 'Lassa Fever', caseCount: 12, expectedRange: '2-8', isOutbreakAlert: true, alertLevel: 'MODERATE', affectedGroups: JSON.stringify(['Rural communities', 'Healthcare workers']) } }),
      db.diseaseSurveillance.create({ data: { facilityId: facilities[2].id, region: 'South West', diseaseName: 'Meningitis', caseCount: 8, expectedRange: '1-5', isOutbreakAlert: false, alertLevel: 'LOW', affectedGroups: JSON.stringify(['Young adults', 'Students']) } }),
    ])
    log.push('Created disease surveillance data')

    // ========== CREATE CREDENTIALS ==========
    for (const nurse of nurses.slice(0, 3)) {
      await db.credential.create({ data: { nurseId: nurse.nurseProfile!.id, credentialType: 'LICENSE', credentialName: 'Registered Nurse License', issuingBody: 'Nursing and Midwifery Council of Nigeria', issueDate: new Date('2020-01-15'), expiryDate: new Date('2026-12-31'), credentialNumber: nurse.nurseProfile!.licenseNumber, isVerified: true, verifiedBy: 'NMCN Verification System', verifiedAt: new Date(), isPublic: true } })
      if (nurse.nurseProfile!.blsCertified) {
        await db.credential.create({ data: { nurseId: nurse.nurseProfile!.id, credentialType: 'CERTIFICATION', credentialName: 'Basic Life Support (BLS)', issuingBody: 'American Heart Association / Nigerian Resuscitation Council', issueDate: new Date('2023-06-01'), expiryDate: new Date('2025-06-01'), isVerified: true, verifiedAt: new Date(), isPublic: true } })
      }
    }
    log.push('Created credentials')

    // ========== CREATE CPD RECORDS ==========
    for (const nurse of nurses.slice(0, 3)) {
      await db.cPDRecord.create({ data: { nurseId: nurse.nurseProfile!.id, activityType: 'COURSE', title: 'Infection Prevention and Control Update 2024', description: 'Annual IPC refresher training', cpdPoints: 3, dateCompleted: new Date('2024-03-15'), provider: 'NurseOS Academy', isVerified: true } })
      await db.cPDRecord.create({ data: { nurseId: nurse.nurseProfile!.id, activityType: 'WORKSHOP', title: 'Digital Health Workshop for Healthcare Workers', description: 'Hands-on workshop on telemedicine and digital health tools', cpdPoints: 2, dateCompleted: new Date('2024-05-20'), provider: 'Nigeria Digital Health Initiative', isVerified: true } })
    }
    log.push('Created CPD records')

    // ========== CREATE NOTIFICATIONS ==========
    await Promise.all([
      db.notification.create({ data: { userId: nurses[0].id, type: 'ALERT', title: 'License Expiry Reminder', message: 'Your nursing license (NMCN/2024/00123) will expire in 90 days.', isRead: false } }),
      db.notification.create({ data: { userId: nurses[2].id, type: 'COURSE', title: 'New Course Available', message: 'A new course "Advanced Pediatric Emergency Care" is now available!', isRead: false } }),
      db.notification.create({ data: { userId: adminUser.id, type: 'SYSTEM', title: 'Weekly Analytics Report Ready', message: 'Your facility analytics report for this week is ready.', isRead: true, readAt: new Date() } }),
    ])
    log.push('Created notifications')

    // ========== CREATE FACILITY ANALYTICS (7 days x 5 facilities) ==========
    const today = new Date()
    for (const facility of facilities) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(today)
        date.setDate(date.getDate() - d)
        await db.facilityAnalytics.create({
          data: { facilityId: facility.id, date, totalPatients: Math.floor(facility.bedCapacity ? facility.bedCapacity / 2 : 30), newPatients: 8, totalEncounters: 35, avgWaitTimeMin: 30, avgLengthOfStay: 3.5, nurseToPatientRatio: 4.5, bedOccupancyRate: 78, medicationErrors: 1, nearMissEvents: 2, patientSatisfactionScore: 4.2, nurseSatisfactionScore: 3.8, readmissionRate: 4.5, infectionRate: 1.8, mortalityRate: 0.9, topDiagnoses: JSON.stringify(['Malaria', 'Hypertension', 'Diabetes', 'Respiratory Infection', 'Typhoid']), peakHours: JSON.stringify({ morning: '8-11', evening: '17-20' }), staffingData: JSON.stringify({ morning: 35, afternoon: 25, night: 18 }), period: 'DAILY' },
        })
      }
    }
    log.push('Created facility analytics (7 days x 5 facilities)')

    resetDbConnectionStatus()

    return NextResponse.json({
      message: 'Database seeded successfully!',
      status: 'seed_complete',
      log,
      testAccounts: {
        admin: 'admin@nurseos.ng / Admin@2024',
        nurses: [
          'chidinma.eze@nurseos.ng / Nurse@2024',
          'adamu.bello@nurseos.ng / Nurse@2024',
          'folake.adeyemi@nurseos.ng / Nurse@2024',
          'ngozi.okafor@nurseos.ng / Nurse@2024',
          'blessing.ibrahim@nurseos.ng / Nurse@2024',
        ],
      },
      summary: {
        facilities: facilities.length,
        adminUsers: 1,
        nurseUsers: nurses.length,
        patients: patients.length,
        departments: departments.length,
        medicalRecords: medicalRecords.length,
        courses: courses.length,
        vitalSigns: 3,
        nursingNotes: 2,
        referrals: 1,
        diseaseSurveillance: 3,
        credentials: '6+',
        cpdRecords: '6+',
        notifications: 3,
        facilityAnalytics: '35 (7 days x 5 facilities)',
      },
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database.', details: error?.message?.substring(0, 500) },
      { status: 500 }
    )
  }
}
