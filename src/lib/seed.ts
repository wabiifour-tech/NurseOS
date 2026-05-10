import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('🌱 Seeding NurseOS database...\n')

  // Clean existing data (in reverse dependency order)
  console.log('🧹 Cleaning existing data...')
  await prisma.simulationAttempt.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.courseModule.deleteMany()
  await prisma.course.deleteMany()
  await prisma.cPDRecord.deleteMany()
  await prisma.portfolioEntry.deleteMany()
  await prisma.competency.deleteMany()
  await prisma.credential.deleteMany()
  await prisma.staffingPrediction.deleteMany()
  await prisma.diseaseSurveillance.deleteMany()
  await prisma.facilityAnalytics.deleteMany()
  await prisma.articleComment.deleteMany()
  await prisma.knowledgeArticle.deleteMany()
  await prisma.consultation.deleteMany()
  await prisma.referral.deleteMany()
  await prisma.labOrder.deleteMany()
  await prisma.medicationOrder.deleteMany()
  await prisma.aIInteraction.deleteMany()
  await prisma.nursingNote.deleteMany()
  await prisma.vitalSign.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.visitRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.department.deleteMany()
  await prisma.adminProfile.deleteMany()
  await prisma.nurseProfile.deleteMany()
  await prisma.patientProfile.deleteMany()
  await prisma.facility.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Data cleaned.\n')

  // ========== CREATE FACILITIES ==========
  console.log('🏥 Creating facilities...')
  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: 'Lagos University Teaching Hospital',
        type: 'HOSPITAL',
        level: 'TERTIARY',
        address: 'Idi-Araba, Mushin',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        latitude: 6.5244,
        longitude: 3.3792,
        phone: '+234-1-497-2550',
        email: 'info@luth.org.ng',
        website: 'https://luth.org.ng',
        bedCapacity: 760,
        staffCount: 2850,
        registrationNumber: 'FHN/LAG/001',
        accreditingBody: 'Federal Ministry of Health',
        accreditationStatus: 'ACCREDITED',
        isVerified: true,
        isEmergencyCapable: true,
        servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Cardiology', 'Oncology', 'Radiology', 'Laboratory']),
        operatingHours: '24/7',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'National Hospital Abuja',
        type: 'HOSPITAL',
        level: 'TERTIARY',
        address: 'Central District, Garki',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        latitude: 9.0579,
        longitude: 7.4951,
        phone: '+234-9-523-3111',
        email: 'info@nationalhospital.gov.ng',
        website: 'https://nationalhospital.gov.ng',
        bedCapacity: 500,
        staffCount: 2100,
        registrationNumber: 'FHN/FCT/001',
        accreditingBody: 'Federal Ministry of Health',
        accreditationStatus: 'ACCREDITED',
        isVerified: true,
        isEmergencyCapable: true,
        servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Neurosurgery', 'Nephrology', 'Cardiology', 'Orthopedics']),
        operatingHours: '24/7',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'University College Hospital Ibadan',
        type: 'HOSPITAL',
        level: 'TERTIARY',
        address: 'Queen Elizabeth Road, Mokola',
        city: 'Ibadan',
        state: 'Oyo',
        country: 'Nigeria',
        latitude: 7.3775,
        longitude: 3.9470,
        phone: '+234-2-241-0088',
        email: 'info@uch-ibadan.org.ng',
        bedCapacity: 650,
        staffCount: 2400,
        registrationNumber: 'FHN/OYO/001',
        accreditingBody: 'Federal Ministry of Health',
        accreditationStatus: 'ACCREDITED',
        isVerified: true,
        isEmergencyCapable: true,
        servicesOffered: JSON.stringify(['Emergency', 'Surgery', 'Pediatrics', 'Obstetrics', 'Oncology', 'Dermatology', 'Psychiatry', 'Radiology']),
        operatingHours: '24/7',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Gwagwalada Primary Health Center',
        type: 'PRIMARY_HEALTH_CENTER',
        level: 'PRIMARY',
        address: 'Gwagwalada Town',
        city: 'Gwagwalada',
        state: 'FCT',
        country: 'Nigeria',
        phone: '+234-803-600-1234',
        bedCapacity: 30,
        staffCount: 45,
        registrationNumber: 'PHC/FCT/GWA/001',
        accreditingBody: 'FCT Primary Health Care Board',
        accreditationStatus: 'ACCREDITED',
        isVerified: true,
        isEmergencyCapable: false,
        servicesOffered: JSON.stringify(['Antenatal Care', 'Immunization', 'Family Planning', 'Malaria Treatment', 'HIV Counseling']),
        operatingHours: 'Mon-Fri 8:00-17:00, Sat 8:00-13:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Rainbow Specialist Medical Center',
        type: 'SPECIALIST_CENTER',
        level: 'SECONDARY',
        address: '52 Awolowo Road, Ikoyi',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        latitude: 6.4485,
        longitude: 3.4267,
        phone: '+234-1-269-7800',
        email: 'info@rainbowspecialist.com',
        bedCapacity: 80,
        staffCount: 180,
        registrationNumber: 'FHN/LAG/SPE/042',
        accreditingBody: 'Lagos State Ministry of Health',
        accreditationStatus: 'ACCREDITED',
        isVerified: true,
        isEmergencyCapable: true,
        servicesOffered: JSON.stringify(['Cardiology', 'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Rheumatology']),
        operatingHours: 'Mon-Sat 8:00-20:00, Emergency 24/7',
      },
    }),
  ])
  console.log(`✅ Created ${facilities.length} facilities.\n`)

  // ========== CREATE ADMIN USER ==========
  console.log('👑 Creating admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@nurseos.ng',
      passwordHash: await hashPassword('Admin@2024'),
      firstName: 'Amina',
      lastName: 'Okonkwo',
      middleName: 'Blessing',
      displayName: 'Amina Okonkwo',
      phone: '+234-803-000-0001',
      countryCode: 'NG',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      adminProfile: {
        create: {
          facilityId: facilities[0].id,
          department: 'Administration',
          accessLevel: 5,
        },
      },
    },
  })
  console.log(`✅ Admin user created: ${adminUser.email}\n`)

  // ========== CREATE NURSE USERS ==========
  console.log('👩‍⚕️ Creating nurse users...')
  const nurseData = [
    {
      firstName: 'Chidinma',
      lastName: 'Eze',
      middleName: 'Grace',
      email: 'chidinma.eze@nurseos.ng',
      phone: '+234-803-000-0002',
      specialization: 'Critical Care Nursing',
      yearsOfExperience: 8,
      licenseNumber: 'NMCN/2024/00123',
      degree: 'B.NSc',
      university: 'University of Lagos',
      graduationYear: 2015,
      facilityId: facilities[0].id,
      blsCertified: true,
      aclsCertified: true,
      bio: 'Experienced critical care nurse with a passion for patient advocacy and evidence-based practice. Certified in both BLS and ACLS.',
      skills: ['Critical Care', 'Ventilator Management', 'IV Therapy', 'Patient Assessment', 'Emergency Response'],
      languages: ['English', 'Igbo', 'Yoruba'],
    },
    {
      firstName: 'Adamu',
      lastName: 'Bello',
      middleName: 'Ibrahim',
      email: 'adamu.bello@nurseos.ng',
      phone: '+234-803-000-0003',
      specialization: 'Community Health Nursing',
      yearsOfExperience: 12,
      licenseNumber: 'NMCN/2024/00456',
      degree: 'M.Sc Nursing',
      university: 'Ahmadu Bello University',
      graduationYear: 2011,
      facilityId: facilities[3].id,
      blsCertified: true,
      aclsCertified: false,
      bio: 'Community health specialist dedicated to improving primary healthcare delivery in underserved areas across Northern Nigeria.',
      skills: ['Community Health', 'Health Education', 'Epidemiology', 'Maternal & Child Health', 'HIV/AIDS Management'],
      languages: ['English', 'Hausa', 'Fulfulde'],
    },
    {
      firstName: 'Folake',
      lastName: 'Adeyemi',
      middleName: 'Oluwaseun',
      email: 'folake.adeyemi@nurseos.ng',
      phone: '+234-803-000-0004',
      specialization: 'Pediatric Nursing',
      yearsOfExperience: 6,
      licenseNumber: 'NMCN/2024/00789',
      degree: 'B.NSc',
      university: 'Obafemi Awolowo University',
      graduationYear: 2017,
      facilityId: facilities[2].id,
      blsCertified: true,
      aclsCertified: true,
      bio: 'Pediatric nurse specializing in neonatal care. Passionate about reducing infant mortality through evidence-based interventions.',
      skills: ['Pediatric Care', 'Neonatal Intensive Care', 'Child Development', 'Family-Centered Care', 'Immunization'],
      languages: ['English', 'Yoruba'],
    },
    {
      firstName: 'Ngozi',
      lastName: 'Okafor',
      middleName: 'Chioma',
      email: 'ngozi.okafor@nurseos.ng',
      phone: '+234-803-000-0005',
      specialization: 'Midwifery',
      yearsOfExperience: 10,
      licenseNumber: 'NMCN/2024/01012',
      degree: 'B.NSc (Midwifery)',
      university: 'University of Nigeria Nsukka',
      graduationYear: 2013,
      facilityId: facilities[0].id,
      blsCertified: true,
      aclsCertified: false,
      bio: 'Certified midwife with extensive experience in antenatal care, labor management, and postnatal support. Advocate for safe motherhood.',
      skills: ['Midwifery', 'Antenatal Care', 'Labor & Delivery', 'Postnatal Care', 'Emergency Obstetric Care'],
      languages: ['English', 'Igbo'],
    },
    {
      firstName: 'Blessing',
      lastName: 'Ibrahim',
      email: 'blessing.ibrahim@nurseos.ng',
      phone: '+234-803-000-0006',
      specialization: 'Medical-Surgical Nursing',
      yearsOfExperience: 4,
      licenseNumber: 'NMCN/2024/01345',
      degree: 'B.NSc',
      university: 'Bayero University Kano',
      graduationYear: 2019,
      facilityId: facilities[1].id,
      blsCertified: true,
      aclsCertified: false,
      bio: 'Medical-surgical nurse focused on perioperative care and wound management.',
      skills: ['Medical-Surgical', 'Wound Care', 'Perioperative', 'Patient Education', 'IV Therapy'],
      languages: ['English', 'Hausa'],
    },
  ]

  const nurses = []
  for (const nd of nurseData) {
    const user = await prisma.user.create({
      data: {
        email: nd.email,
        passwordHash: await hashPassword('Nurse@2024'),
        firstName: nd.firstName,
        lastName: nd.lastName,
        middleName: nd.middleName || null,
        displayName: `${nd.firstName} ${nd.lastName}`,
        phone: nd.phone,
        countryCode: 'NG',
        role: 'NURSE',
        status: 'ACTIVE',
        emailVerified: true,
        nurseProfile: {
          create: {
            licenseNumber: nd.licenseNumber,
            licenseIssuingBody: 'NMCN',
            licenseExpiryDate: new Date('2026-12-31'),
            specialization: nd.specialization,
            yearsOfExperience: nd.yearsOfExperience,
            currentFacilityId: nd.facilityId,
            blsCertified: nd.blsCertified,
            blsCertExpiry: nd.blsCertified ? new Date('2025-06-30') : null,
            aclsCertified: nd.aclsCertified,
            aclsCertExpiry: nd.aclsCertified ? new Date('2025-09-15') : null,
            nursingCouncil: 'Nigeria',
            degree: nd.degree,
            university: nd.university,
            graduationYear: nd.graduationYear,
            bio: nd.bio,
            skills: JSON.stringify(nd.skills),
            languages: JSON.stringify(nd.languages),
            availableForConsult: nd.yearsOfExperience >= 8,
            rating: 3.5 + Math.random() * 1.5,
            totalRatings: Math.floor(Math.random() * 50) + 5,
          },
        },
      },
      include: { nurseProfile: true },
    })
    nurses.push(user)
  }
  console.log(`✅ Created ${nurses.length} nurse users.\n`)

  // ========== CREATE PATIENTS ==========
  console.log('🤒 Creating patients...')
  const patientData = [
    {
      firstName: 'Emeka',
      lastName: 'Nwankwo',
      email: 'emeka.nwankwo@email.com',
      dateOfBirth: '1985-03-15',
      gender: 'MALE',
      bloodType: 'O+',
      genotype: 'AA',
      allergies: ['Penicillin'],
      emergencyContactName: 'Ada Nwankwo',
      emergencyContactPhone: '+234-803-111-0001',
      emergencyContactRelation: 'Wife',
      stateOfOrigin: 'Anambra',
      occupation: 'Civil Engineer',
      insuranceProvider: 'NHIS',
      insuranceNumber: 'NHIS/2024/88901',
    },
    {
      firstName: 'Aisha',
      lastName: 'Mohammed',
      email: 'aisha.mohammed@email.com',
      dateOfBirth: '1992-07-22',
      gender: 'FEMALE',
      bloodType: 'A+',
      genotype: 'AS',
      allergies: ['Sulfa drugs', 'Latex'],
      emergencyContactName: 'Ibrahim Mohammed',
      emergencyContactPhone: '+234-803-111-0002',
      emergencyContactRelation: 'Husband',
      stateOfOrigin: 'Kano',
      occupation: 'Teacher',
      insuranceProvider: 'NHIS',
      insuranceNumber: 'NHIS/2024/88902',
    },
    {
      firstName: 'Oluwaseun',
      lastName: 'Fasanya',
      email: 'oluwaseun.fasanya@email.com',
      dateOfBirth: '1978-11-05',
      gender: 'MALE',
      bloodType: 'B+',
      genotype: 'AA',
      allergies: [],
      emergencyContactName: 'Bimpe Fasanya',
      emergencyContactPhone: '+234-803-111-0003',
      emergencyContactRelation: 'Sister',
      stateOfOrigin: 'Ogun',
      occupation: 'Banker',
      insuranceProvider: 'Leadway Health',
      insuranceNumber: 'LWH/2024/22345',
    },
    {
      firstName: 'Fatima',
      lastName: 'Abubakar',
      dateOfBirth: '1955-01-30',
      gender: 'FEMALE',
      bloodType: 'AB+',
      genotype: 'AA',
      allergies: ['Aspirin'],
      emergencyContactName: 'Yusuf Abubakar',
      emergencyContactPhone: '+234-803-111-0004',
      emergencyContactRelation: 'Son',
      stateOfOrigin: 'Borno',
      occupation: 'Retired Civil Servant',
      insuranceProvider: 'NHIS',
      insuranceNumber: 'NHIS/2024/88903',
    },
    {
      firstName: 'Chukwuma',
      lastName: 'Okafor',
      email: 'chukwuma.okafor@email.com',
      dateOfBirth: '2018-06-10',
      gender: 'MALE',
      bloodType: 'O-',
      genotype: 'SS',
      allergies: [],
      emergencyContactName: 'Nneka Okafor',
      emergencyContactPhone: '+234-803-111-0005',
      emergencyContactRelation: 'Mother',
      stateOfOrigin: 'Imo',
      occupation: null,
      insuranceProvider: 'NHIS',
      insuranceNumber: 'NHIS/2024/88904',
    },
    {
      firstName: 'Adaeze',
      lastName: 'Eze',
      email: 'adaeze.eze@email.com',
      dateOfBirth: '1990-09-18',
      gender: 'FEMALE',
      bloodType: 'A-',
      genotype: 'AA',
      allergies: ['Ibuprofen'],
      emergencyContactName: 'Obinna Eze',
      emergencyContactPhone: '+234-803-111-0006',
      emergencyContactRelation: 'Brother',
      stateOfOrigin: 'Enugu',
      occupation: 'Pharmacist',
      insuranceProvider: 'AXA Mansard',
      insuranceNumber: 'AXA/2024/55678',
    },
  ]

  const patients = []
  for (let i = 0; i < patientData.length; i++) {
    const pd = patientData[i]
    const patientId = `PT/2024/${String(i + 1).padStart(5, '0')}`

    let userId: string | undefined
    if (pd.email) {
      const tempPassword = await bcrypt.hash(`patient-${Date.now()}-${i}`, 10)
      const user = await prisma.user.create({
        data: {
          email: pd.email,
          passwordHash: tempPassword,
          firstName: pd.firstName,
          lastName: pd.lastName,
          displayName: `${pd.firstName} ${pd.lastName}`,
          countryCode: 'NG',
          role: 'PATIENT',
          status: 'ACTIVE',
        },
      })
      userId = user.id
    }

    const patient = await prisma.patientProfile.create({
      data: {
        userId: userId || null,
        patientId,
        dateOfBirth: pd.dateOfBirth ? new Date(pd.dateOfBirth) : null,
        gender: pd.gender,
        bloodType: pd.bloodType,
        genotype: pd.genotype,
        allergies: JSON.stringify(pd.allergies),
        emergencyContactName: pd.emergencyContactName,
        emergencyContactPhone: pd.emergencyContactPhone,
        emergencyContactRelation: pd.emergencyContactRelation,
        nationality: 'Nigerian',
        stateOfOrigin: pd.stateOfOrigin,
        occupation: pd.occupation,
        insuranceProvider: pd.insuranceProvider || null,
        insuranceNumber: pd.insuranceNumber || null,
      },
    })
    patients.push(patient)
  }
  console.log(`✅ Created ${patients.length} patients.\n`)

  // ========== CREATE DEPARTMENTS ==========
  console.log('🏢 Creating departments...')
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        facilityId: facilities[0].id,
        name: 'Emergency Department',
        headNurseId: nurses[0].nurseProfile!.id,
        description: '24/7 Emergency and Trauma Care',
      },
    }),
    prisma.department.create({
      data: {
        facilityId: facilities[0].id,
        name: 'Maternity Ward',
        headNurseId: nurses[3].nurseProfile!.id,
        description: 'Antenatal, Labour, and Postnatal Care',
      },
    }),
    prisma.department.create({
      data: {
        facilityId: facilities[1].id,
        name: 'Pediatrics',
        headNurseId: nurses[2].nurseProfile!.id,
        description: 'Pediatric and Neonatal Care Unit',
      },
    }),
    prisma.department.create({
      data: {
        facilityId: facilities[3].id,
        name: 'General Outpatient',
        headNurseId: nurses[1].nurseProfile!.id,
        description: 'Primary care and outpatient services',
      },
    }),
  ])
  console.log(`✅ Created ${departments.length} departments.\n`)

  // ========== CREATE MEDICAL RECORDS ==========
  console.log('📋 Creating medical records...')
  const medicalRecords = await Promise.all([
    prisma.medicalRecord.create({
      data: {
        patientId: patients[0].id,
        facilityId: facilities[0].id,
        departmentId: departments[0].id,
        encounterType: 'EMERGENCY',
        attendingNurseId: nurses[0].nurseProfile!.id,
        chiefComplaint: 'Severe chest pain and shortness of breath',
        historyOfPresentIllness: 'Patient presents with acute onset chest pain radiating to left arm, associated with sweating and breathlessness. Started 2 hours ago while at rest.',
        pastMedicalHistory: 'Hypertension x5 years, Type 2 Diabetes Mellitus x3 years',
        nursingAssessment: 'Patient appears in acute distress. Alert and oriented. Skin diaphoretic. complains of 8/10 chest pain.',
        nursingDiagnosis: JSON.stringify(['Acute Pain related to myocardial ischemia', 'Decreased Cardiac Output', 'Anxiety related to health status']),
        status: 'ACTIVE',
      },
    }),
    prisma.medicalRecord.create({
      data: {
        patientId: patients[1].id,
        facilityId: facilities[0].id,
        departmentId: departments[1].id,
        encounterType: 'INPATIENT',
        attendingNurseId: nurses[3].nurseProfile!.id,
        chiefComplaint: 'Antenatal admission for threatened preterm labor at 32 weeks',
        historyOfPresentIllness: 'Gravida 2 Para 1, 32 weeks gestation presenting with regular uterine contractions. No bleeding or fluid leak.',
        pastMedicalHistory: 'Previous C-section 3 years ago',
        nursingAssessment: 'Patient in mild discomfort. Vital signs stable. Fetal heart rate 140 bpm. Contractions every 5-7 minutes.',
        nursingDiagnosis: JSON.stringify(['Risk for Preterm Labor', 'Anxiety related to pregnancy complications', 'Knowledge Deficit regarding preterm labor precautions']),
        status: 'ACTIVE',
      },
    }),
    prisma.medicalRecord.create({
      data: {
        patientId: patients[4].id,
        facilityId: facilities[1].id,
        departmentId: departments[2].id,
        encounterType: 'INPATIENT',
        attendingNurseId: nurses[2].nurseProfile!.id,
        chiefComplaint: 'Vaso-occlusive crisis secondary to sickle cell disease',
        historyOfPresentIllness: '6-year-old male with known SS genotype presenting with severe pain in limbs and abdomen. Third crisis this year.',
        pastMedicalHistory: 'Sickle Cell Disease (SS), multiple vaso-occlusive crises',
        nursingAssessment: 'Child in severe pain, crying, guarding limbs. Pale conjunctiva. Mild jaundice noted. Temperature 37.8°C.',
        nursingDiagnosis: JSON.stringify(['Acute Pain related to vaso-occlusion', 'Risk for Infection', 'Fluid Volume Deficit']),
        status: 'ACTIVE',
      },
    }),
  ])
  console.log(`✅ Created ${medicalRecords.length} medical records.\n`)

  // ========== CREATE VITAL SIGNS ==========
  console.log('🩺 Creating vital signs...')
  await Promise.all([
    prisma.vitalSign.create({
      data: {
        patientId: patients[0].id,
        recordId: medicalRecords[0].id,
        recordedByNurseId: nurses[0].nurseProfile!.id,
        temperature: 37.2,
        heartRate: 102,
        respiratoryRate: 24,
        bloodPressureSystolic: 160,
        bloodPressureDiastolic: 100,
        oxygenSaturation: 94,
        weight: 85,
        height: 175,
        bmi: 27.8,
        painScale: 8,
        consciousnessLevel: 'ALERT',
        earlyWarningScore: 5,
        isAbnormal: true,
        notes: 'Patient in acute distress. Abnormal vitals noted.',
      },
    }),
    prisma.vitalSign.create({
      data: {
        patientId: patients[1].id,
        recordId: medicalRecords[1].id,
        recordedByNurseId: nurses[3].nurseProfile!.id,
        temperature: 36.8,
        heartRate: 88,
        respiratoryRate: 18,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 78,
        oxygenSaturation: 98,
        weight: 72,
        painScale: 3,
        consciousnessLevel: 'ALERT',
        earlyWarningScore: 1,
        isAbnormal: false,
      },
    }),
    prisma.vitalSign.create({
      data: {
        patientId: patients[4].id,
        recordId: medicalRecords[2].id,
        recordedByNurseId: nurses[2].nurseProfile!.id,
        temperature: 37.8,
        heartRate: 120,
        respiratoryRate: 28,
        bloodPressureSystolic: 110,
        bloodPressureDiastolic: 70,
        oxygenSaturation: 96,
        weight: 20,
        height: 115,
        bmi: 15.1,
        painScale: 9,
        consciousnessLevel: 'ALERT',
        earlyWarningScore: 4,
        isAbnormal: true,
        notes: 'Child in severe pain from sickle cell crisis. Febrile.',
      },
    }),
  ])
  console.log('✅ Created vital signs.\n')

  // ========== CREATE FACILITY ANALYTICS ==========
  console.log('📊 Creating facility analytics...')
  const today = new Date()
  for (const facility of facilities) {
    // Create 7 days of analytics
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)

      await prisma.facilityAnalytics.create({
        data: {
          facilityId: facility.id,
          date,
          totalPatients: Math.floor(Math.random() * 50) + (facility.bedCapacity ? facility.bedCapacity / 2 : 30),
          newPatients: Math.floor(Math.random() * 15) + 3,
          totalEncounters: Math.floor(Math.random() * 40) + 20,
          avgWaitTimeMin: Math.floor(Math.random() * 45) + 15,
          avgLengthOfStay: Math.random() * 3 + 2,
          nurseToPatientRatio: Math.random() * 3 + 3,
          bedOccupancyRate: Math.random() * 30 + 65,
          medicationErrors: Math.floor(Math.random() * 3),
          nearMissEvents: Math.floor(Math.random() * 5),
          patientSatisfactionScore: Math.random() * 1.5 + 3.5,
          nurseSatisfactionScore: Math.random() * 1.5 + 3.2,
          readmissionRate: Math.random() * 5 + 2,
          infectionRate: Math.random() * 3 + 0.5,
          mortalityRate: Math.random() * 1.5 + 0.2,
          topDiagnoses: JSON.stringify(['Malaria', 'Hypertension', 'Diabetes', 'Respiratory Infection', 'Typhoid']),
          peakHours: JSON.stringify({ morning: '8-11', evening: '17-20' }),
          staffingData: JSON.stringify({
            morning: Math.floor(Math.random() * 20) + 30,
            afternoon: Math.floor(Math.random() * 15) + 20,
            night: Math.floor(Math.random() * 12) + 15,
          }),
          period: 'DAILY',
        },
      })
    }
  }
  console.log('✅ Created facility analytics.\n')

  // ========== CREATE COURSES ==========
  console.log('📚 Creating courses...')
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'Fundamentals of Critical Care Nursing',
        slug: 'fundamentals-critical-care-nursing',
        description: 'Comprehensive course covering the essentials of critical care nursing including ventilator management, hemodynamic monitoring, and evidence-based interventions for critically ill patients.',
        category: 'Critical Care',
        level: 'INTERMEDIATE',
        durationMinutes: 480,
        cpdPoints: 8,
        language: 'en',
        tags: JSON.stringify(['critical care', 'ICU', 'ventilator', 'hemodynamics']),
        isPublished: true,
        isFree: false,
        price: 15000,
        enrollmentCount: 234,
        rating: 4.6,
        totalRatings: 89,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Infection Prevention and Control in Nigerian Healthcare Settings',
        slug: 'infection-prevention-control-nigeria',
        description: 'Essential training on infection prevention and control practices tailored to the Nigerian healthcare environment. Covers hand hygiene, PPE use, waste management, and outbreak response.',
        category: 'Infection Control',
        level: 'BEGINNER',
        durationMinutes: 180,
        cpdPoints: 3,
        language: 'en',
        tags: JSON.stringify(['infection control', 'IPC', 'hand hygiene', 'PPE', 'outbreak']),
        isPublished: true,
        isFree: true,
        enrollmentCount: 567,
        rating: 4.8,
        totalRatings: 201,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Emergency Obstetric and Newborn Care (EmONC)',
        slug: 'emergency-obstetric-newborn-care',
        description: 'Training in life-saving emergency obstetric and newborn care interventions. Designed for nurses and midwives working in labor wards and maternity units across Nigeria.',
        category: 'Maternal Health',
        level: 'INTERMEDIATE',
        durationMinutes: 360,
        cpdPoints: 6,
        language: 'en',
        tags: JSON.stringify(['obstetrics', 'newborn care', 'EmONC', 'maternal health', 'midwifery']),
        isPublished: true,
        isFree: true,
        enrollmentCount: 412,
        rating: 4.7,
        totalRatings: 156,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Sickle Cell Disease: Nursing Management and Patient Education',
        slug: 'sickle-cell-disease-nursing-management',
        description: 'Specialized course on the nursing management of sickle cell disease, including pain management, crisis prevention, patient education, and psychosocial support strategies.',
        category: 'Hematology',
        level: 'INTERMEDIATE',
        durationMinutes: 240,
        cpdPoints: 4,
        language: 'en',
        tags: JSON.stringify(['sickle cell', 'hematology', 'pain management', 'patient education']),
        isPublished: true,
        isFree: true,
        enrollmentCount: 189,
        rating: 4.5,
        totalRatings: 67,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Digital Health and Telemedicine for Nigerian Nurses',
        slug: 'digital-health-telemedicine-nigeria',
        description: 'Introduction to digital health tools and telemedicine practices for nurses. Learn how to leverage technology for remote patient monitoring, virtual consultations, and health data management.',
        category: 'Digital Health',
        level: 'BEGINNER',
        durationMinutes: 120,
        cpdPoints: 2,
        language: 'en',
        tags: JSON.stringify(['telemedicine', 'digital health', 'technology', 'e-health']),
        isPublished: true,
        isFree: true,
        enrollmentCount: 345,
        rating: 4.3,
        totalRatings: 124,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Advanced Cardiac Life Support (ACLS) Certification Prep',
        slug: 'acls-certification-preparation',
        description: 'Comprehensive preparation course for the Advanced Cardiac Life Support certification. Covers BLS review, ACLS algorithms, pharmacology, and megacode practice scenarios.',
        category: 'Emergency Care',
        level: 'ADVANCED',
        durationMinutes: 600,
        cpdPoints: 10,
        language: 'en',
        tags: JSON.stringify(['ACLS', 'cardiac', 'emergency', 'resuscitation', 'certification']),
        isPublished: true,
        isFree: false,
        price: 25000,
        enrollmentCount: 156,
        rating: 4.9,
        totalRatings: 98,
      },
    }),
  ])
  console.log(`✅ Created ${courses.length} courses.\n`)

  // ========== CREATE COURSE MODULES ==========
  console.log('📖 Creating course modules...')
  for (const course of courses) {
    const moduleCount = Math.floor(Math.random() * 3) + 3
    for (let m = 0; m < moduleCount; m++) {
      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: `Module ${m + 1}: ${getModuleTitle(course.category, m)}`,
          description: `Learning module covering key aspects of ${course.category.toLowerCase()}.`,
          order: m + 1,
          contentType: m === 0 ? 'VIDEO' : m % 2 === 0 ? 'TEXT' : 'INTERACTIVE',
          durationMinutes: Math.floor(Math.random() * 30) + 15,
          isRequired: true,
        },
      })
    }
  }
  console.log('✅ Created course modules.\n')

  // ========== CREATE ENROLLMENTS ==========
  console.log('🎓 Creating enrollments...')
  for (let i = 0; i < Math.min(nurses.length, 4); i++) {
    const course = courses[i % courses.length]
    await prisma.enrollment.create({
      data: {
        courseId: course.id,
        nurseId: nurses[i].nurseProfile!.id,
        progressPercent: Math.floor(Math.random() * 80) + 10,
        lastAccessedAt: new Date(),
      },
    })
  }
  console.log('✅ Created enrollments.\n')

  // ========== CREATE NURSING NOTES ==========
  console.log('📝 Creating nursing notes...')
  await Promise.all([
    prisma.nursingNote.create({
      data: {
        recordId: medicalRecords[0].id,
        nurseId: nurses[0].nurseProfile!.id,
        noteType: 'SOAP',
        content: JSON.stringify({
          subjective: 'Patient reports severe chest pain 8/10, radiating to left arm. States "I feel like something heavy is sitting on my chest."',
          objective: 'BP 160/100, HR 102, RR 24, SpO2 94%, Temp 37.2°C. Skin diaphoretic. Alert and oriented x3.',
          assessment: 'Acute coronary syndrome suspected. Abnormal vital signs with chest pain presentation.',
          plan: 'Continue cardiac monitoring. Administer prescribed NTG SL. Monitor vitals q15min. Prepare for possible cardiac catheterization.',
        }),
        aiGenerated: false,
        isSigned: true,
        signedAt: new Date(),
      },
    }),
    prisma.nursingNote.create({
      data: {
        recordId: medicalRecords[1].id,
        nurseId: nurses[3].nurseProfile!.id,
        noteType: 'SBAR',
        content: JSON.stringify({
          situation: 'Mrs. Mohammed, 32 weeks gestation, G2P1, admitted with regular uterine contractions every 5-7 minutes.',
          background: 'Previous C-section 3 years ago. No complications in current pregnancy until now. No bleeding or fluid leak.',
          assessment: 'Threatened preterm labor. Cervix 2cm dilated. Fetal heart rate stable at 140 bpm. No signs of fetal distress.',
          recommendation: 'Tocolytics as prescribed. Betamethasone for fetal lung maturity. Continuous fetal monitoring. Notify consultant if contractions increase.',
        }),
        aiGenerated: false,
        isSigned: true,
        signedAt: new Date(),
      },
    }),
  ])
  console.log('✅ Created nursing notes.\n')

  // ========== CREATE REFERRALS ==========
  console.log('🔄 Creating referrals...')
  await prisma.referral.create({
    data: {
      patientId: patients[4].id,
      fromFacilityId: facilities[3].id,
      toFacilityId: facilities[1].id,
      referringNurseId: nurses[1].nurseProfile!.id,
      reason: 'Sickle cell crisis requiring specialized pediatric hematology care not available at PHC level',
      clinicalSummary: '6-year-old male with SS genotype, 3rd vaso-occlusive crisis this year. Severe pain, mild fever. Requires IV fluids, analgesia, and possible blood transfusion.',
      urgency: 'URGENT',
      status: 'ACCEPTED',
      acceptedByNurseId: nurses[2].nurseProfile!.id,
      acceptedAt: new Date(),
    },
  })
  console.log('✅ Created referrals.\n')

  // ========== CREATE DISEASE SURVEILLANCE ==========
  console.log('🦠 Creating disease surveillance data...')
  await Promise.all([
    prisma.diseaseSurveillance.create({
      data: {
        facilityId: facilities[0].id,
        region: 'South West',
        diseaseName: 'Cholera',
        caseCount: 45,
        expectedRange: '5-15',
        isOutbreakAlert: true,
        alertLevel: 'HIGH',
        affectedGroups: JSON.stringify(['Children under 5', 'Elderly', 'Immunocompromised']),
        geographicCluster: 'Lagos Island, Eti-Osa LGA',
      },
    }),
    prisma.diseaseSurveillance.create({
      data: {
        facilityId: facilities[1].id,
        region: 'North Central',
        diseaseName: 'Lassa Fever',
        caseCount: 12,
        expectedRange: '2-8',
        isOutbreakAlert: true,
        alertLevel: 'MODERATE',
        affectedGroups: JSON.stringify(['Rural communities', 'Healthcare workers']),
      },
    }),
    prisma.diseaseSurveillance.create({
      data: {
        facilityId: facilities[2].id,
        region: 'South West',
        diseaseName: 'Meningitis',
        caseCount: 8,
        expectedRange: '1-5',
        isOutbreakAlert: false,
        alertLevel: 'LOW',
        affectedGroups: JSON.stringify(['Young adults', 'Students']),
      },
    }),
  ])
  console.log('✅ Created disease surveillance data.\n')

  // ========== CREATE CREDENTIALS FOR NURSES ==========
  console.log('🏅 Creating credentials...')
  for (const nurse of nurses.slice(0, 3)) {
    await prisma.credential.create({
      data: {
        nurseId: nurse.nurseProfile!.id,
        credentialType: 'LICENSE',
        credentialName: 'Registered Nurse License',
        issuingBody: 'Nursing and Midwifery Council of Nigeria',
        issueDate: new Date('2020-01-15'),
        expiryDate: new Date('2026-12-31'),
        credentialNumber: nurse.nurseProfile!.licenseNumber,
        isVerified: true,
        verifiedBy: 'NMCN Verification System',
        verifiedAt: new Date(),
        isPublic: true,
      },
    })

    if (nurse.nurseProfile!.blsCertified) {
      await prisma.credential.create({
        data: {
          nurseId: nurse.nurseProfile!.id,
          credentialType: 'CERTIFICATION',
          credentialName: 'Basic Life Support (BLS)',
          issuingBody: 'American Heart Association / Nigerian Resuscitation Council',
          issueDate: new Date('2023-06-01'),
          expiryDate: new Date('2025-06-01'),
          isVerified: true,
          verifiedAt: new Date(),
          isPublic: true,
        },
      })
    }
  }
  console.log('✅ Created credentials.\n')

  // ========== CREATE CPD RECORDS ==========
  console.log('📈 Creating CPD records...')
  for (const nurse of nurses.slice(0, 3)) {
    await prisma.cPDRecord.create({
      data: {
        nurseId: nurse.nurseProfile!.id,
        activityType: 'COURSE',
        title: 'Infection Prevention and Control Update 2024',
        description: 'Annual IPC refresher training covering latest WHO guidelines and Nigerian protocols',
        cpdPoints: 3,
        dateCompleted: new Date('2024-03-15'),
        provider: 'NurseOS Academy',
        isVerified: true,
      },
    })

    await prisma.cPDRecord.create({
      data: {
        nurseId: nurse.nurseProfile!.id,
        activityType: 'WORKSHOP',
        title: 'Digital Health Workshop for Healthcare Workers',
        description: 'Hands-on workshop on telemedicine, electronic health records, and digital health tools',
        cpdPoints: 2,
        dateCompleted: new Date('2024-05-20'),
        provider: 'Nigeria Digital Health Initiative',
        isVerified: true,
      },
    })
  }
  console.log('✅ Created CPD records.\n')

  // ========== CREATE NOTIFICATIONS ==========
  console.log('🔔 Creating notifications...')
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: nurses[0].id,
        type: 'ALERT',
        title: 'License Expiry Reminder',
        message: 'Your nursing license (NMCN/2024/00123) will expire in 90 days. Please initiate renewal process.',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: nurses[2].id,
        type: 'COURSE',
        title: 'New Course Available',
        message: 'A new course "Advanced Pediatric Emergency Care" is now available. Earn 5 CPD points!',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'SYSTEM',
        title: 'Weekly Analytics Report Ready',
        message: 'Your facility analytics report for this week is ready for review.',
        isRead: true,
        readAt: new Date(),
      },
    }),
  ])
  console.log('✅ Created notifications.\n')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - Facilities: ${facilities.length}`)
  console.log(`   - Admin users: 1`)
  console.log(`   - Nurse users: ${nurses.length}`)
  console.log(`   - Patients: ${patients.length}`)
  console.log(`   - Departments: ${departments.length}`)
  console.log(`   - Medical records: ${medicalRecords.length}`)
  console.log(`   - Courses: ${courses.length}`)
  console.log(`\n🔐 Test Accounts:`)
  console.log(`   - Admin: admin@nurseos.ng / Admin@2024`)
  console.log(`   - Nurse: chidinma.eze@nurseos.ng / Nurse@2024`)
  console.log(`   - Nurse: adamu.bello@nurseos.ng / Nurse@2024`)
  console.log(`   - Nurse: folake.adeyemi@nurseos.ng / Nurse@2024`)
}

function getModuleTitle(category: string, index: number): string {
  const titles: Record<string, string[]> = {
    'Critical Care': ['Introduction to Critical Care', 'Ventilator Management', 'Hemodynamic Monitoring', 'Pharmacology in ICU', 'Evidence-Based Practice'],
    'Infection Control': ['Understanding Healthcare-Associated Infections', 'Hand Hygiene & PPE', 'Outbreak Response & Surveillance', 'Waste Management Protocols'],
    'Maternal Health': ['Antenatal Care Assessment', 'Managing Obstetric Emergencies', 'Newborn Resuscitation', 'Postpartum Complications'],
    'Hematology': ['Understanding Sickle Cell Disease', 'Pain Management Strategies', 'Crisis Prevention & Education', 'Psychosocial Support'],
    'Digital Health': ['Introduction to Digital Health', 'Telemedicine Best Practices', 'EHR & Data Management', 'Future of Nursing Technology'],
    'Emergency Care': ['BLS Review & Updates', 'ACLS Algorithms', 'Cardiac Pharmacology', 'Megacode Practice Scenarios'],
  }
  const moduleTitles = titles[category] || ['Introduction', 'Core Concepts', 'Advanced Topics', 'Practical Application']
  return moduleTitles[index % moduleTitles.length]
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
