import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NurseOS — filling empty tables...\n');

  // ─── FETCH EXISTING DATA FOR REFERENCES ───────────────────────────────────
  const nurses = await prisma.nurseProfile.findMany({ select: { id: true, userId: true, specialization: true } });
  const patients = await prisma.patientProfile.findMany({ select: { id: true, patientId: true, gender: true } });
  const records = await prisma.medicalRecord.findMany({ select: { id: true, patientId: true, encounterType: true } });
  const facilities = await prisma.facility.findMany({ select: { id: true, name: true, type: true } });
  const departments = await prisma.department.findMany({ select: { id: true, name: true, facilityId: true } });
  const courses = await prisma.course.findMany({ select: { id: true, title: true, category: true } });
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });

  const nurseUserIds = nurses.map(n => n.userId);
  const nurseIds = nurses.map(n => n.id);
  const patientIds = patients.map(p => p.id);
  const facilityIds = facilities.map(f => f.id);
  const recordIds = records.map(r => r.id);

  if (nurseIds.length === 0 || patientIds.length === 0 || facilityIds.length === 0) {
    console.error('❌ Missing base data (nurses, patients, or facilities). Cannot seed.');
    process.exit(1);
  }

  // ─── 1. MEDICATION ORDERS (0 → 10) ────────────────────────────────────────
  const medCount = await prisma.medicationOrder.count();
  if (medCount === 0) {
    console.log('📦 Seeding MedicationOrders...');
    const meds = [
      { name: 'Metformin', dosage: '500mg', route: 'ORAL', frequency: 'Twice daily', duration: 'Ongoing', indications: 'Type 2 Diabetes Mellitus', status: 'ACTIVE' },
      { name: 'Hydroxyurea', dosage: '500mg', route: 'ORAL', frequency: 'Once daily', duration: 'Ongoing', indications: 'Sickle Cell Disease', status: 'ACTIVE' },
      { name: 'Morphine Sulfate', dosage: '5mg', route: 'IV', frequency: 'Every 4 hours PRN', duration: '3 days', indications: 'Severe pain - vaso-occlusive crisis', status: 'ACTIVE' },
      { name: 'Folic Acid', dosage: '5mg', route: 'ORAL', frequency: 'Once daily', duration: 'Ongoing', indications: 'Sickle Cell Disease - hematinic support', status: 'ACTIVE' },
      { name: 'Nifedipine', dosage: '20mg', route: 'ORAL', frequency: 'Every 8 hours', duration: 'Until delivery', indications: 'Pre-eclampsia - blood pressure control', status: 'ACTIVE' },
      { name: 'Magnesium Sulfate', dosage: '4g loading, then 1g/hr', route: 'IV', frequency: 'Continuous infusion', duration: '24-48 hours', indications: 'Severe pre-eclampsia - seizure prophylaxis', status: 'ACTIVE' },
      { name: 'Artemether-Lumefantrine', dosage: '20/120mg', route: 'ORAL', frequency: 'Every 8 hours for 3 days', duration: '3 days', indications: 'Uncomplicated malaria', status: 'COMPLETED' },
      { name: 'Ceftriaxone', dosage: '1g', route: 'IV', frequency: 'Once daily', duration: '7 days', indications: 'Post-operative infection prophylaxis', status: 'ACTIVE' },
      { name: 'Omeprazole', dosage: '20mg', route: 'ORAL', frequency: 'Once daily', duration: '14 days', indications: 'Gastric ulcer prophylaxis', status: 'ACTIVE' },
      { name: 'Enalapril', dosage: '5mg', route: 'ORAL', frequency: 'Once daily', duration: 'Ongoing', indications: 'Hypertension', status: 'PENDING' },
    ];

    for (let i = 0; i < meds.length; i++) {
      const med = meds[i];
      const patientIdx = i % patientIds.length;
      const recordIdx = i % recordIds.length;
      await prisma.medicationOrder.create({
        data: {
          patientId: patientIds[patientIdx],
          recordId: recordIds[recordIdx],
          medicationName: med.name,
          dosage: med.dosage,
          route: med.route,
          frequency: med.frequency,
          duration: med.duration,
          startDate: new Date('2026-04-15'),
          endDate: med.duration === 'Ongoing' ? null : new Date('2026-05-15'),
          indications: med.indications,
          contraindications: '[]',
          status: med.status,
          verifiedByNurseId: nurseIds[i % nurseIds.length],
          administeredAt: med.status === 'COMPLETED' ? new Date('2026-04-20') : null,
        }
      });
    }
    console.log('  ✅ Created 10 MedicationOrders\n');
  } else {
    console.log(`  ⏭  MedicationOrders already has ${medCount} records, skipping.\n`);
  }

  // ─── 2. LAB ORDERS (0 → 10) ──────────────────────────────────────────────
  const labCount = await prisma.labOrder.count();
  if (labCount === 0) {
    console.log('🔬 Seeding LabOrders...');
    const labs = [
      { test: 'Full Blood Count', category: 'HEMATOLOGY', specimen: 'Whole blood', urgency: 'ROUTINE', result: 'Hb: 8.2 g/dL, WBC: 11.5, Plt: 245', unit: '', refRange: 'Hb: 12-16 g/dL', abnormal: true },
      { test: 'HbS Electrophoresis', category: 'HEMATOLOGY', specimen: 'Whole blood', urgency: 'ROUTINE', result: 'HbSS pattern', unit: '', refRange: 'HbAA', abnormal: true },
      { test: 'Blood Glucose (Fasting)', category: 'CHEMISTRY', specimen: 'Plasma', urgency: 'ROUTINE', result: '14.2', unit: 'mmol/L', refRange: '3.9-5.6 mmol/L', abnormal: true },
      { test: 'HbA1c', category: 'CHEMISTRY', specimen: 'Whole blood', urgency: 'ROUTINE', result: '9.8', unit: '%', refRange: '< 6.5%', abnormal: true },
      { test: 'Urine Analysis', category: 'URINALYSIS', specimen: 'Urine', urgency: 'ROUTINE', result: 'Protein: 2+, Glucose: 1+, Ketones: Negative', unit: '', refRange: 'All negative', abnormal: true },
      { test: 'Liver Function Test', category: 'CHEMISTRY', specimen: 'Serum', urgency: 'URGENT', result: 'ALT: 45 U/L, AST: 38 U/L, ALP: 95 U/L', unit: 'U/L', refRange: 'ALT: 7-56 U/L', abnormal: true },
      { test: 'Renal Function Test', category: 'CHEMISTRY', specimen: 'Serum', urgency: 'URGENT', result: 'Creatinine: 1.8 mg/dL, BUN: 28 mg/dL', unit: 'mg/dL', refRange: 'Cr: 0.6-1.2 mg/dL', abnormal: true },
      { test: 'Malaria Parasite (Blood Film)', category: 'PARASITOLOGY', specimen: 'Whole blood', urgency: 'URGENT', result: 'P. falciparum +++, Parasitemia: 4.2%', unit: '%', refRange: 'Negative', abnormal: true },
      { test: 'Blood Group & Rh Typing', category: 'HEMATOLOGY', specimen: 'Whole blood', urgency: 'ROUTINE', result: 'O Positive', unit: '', refRange: 'N/A', abnormal: false },
      { test: 'Coagulation Profile', category: 'HEMATOLOGY', specimen: 'Citrate plasma', urgency: 'URGENT', result: 'PT: 14s, APTT: 38s, INR: 1.2', unit: 'seconds', refRange: 'PT: 11-13.5s, APTT: 25-35s', abnormal: true },
    ];

    for (let i = 0; i < labs.length; i++) {
      const lab = labs[i];
      await prisma.labOrder.create({
        data: {
          patientId: patientIds[i % patientIds.length],
          recordId: recordIds[i % recordIds.length],
          orderedBy: 'Dr. Ogunleye',
          testName: lab.test,
          testCategory: lab.category,
          specimenType: lab.specimen,
          urgency: lab.urgency,
          status: lab.result ? 'COMPLETED' : 'ORDERED',
          resultValue: lab.result,
          resultUnit: lab.unit,
          referenceRange: lab.refRange,
          isAbnormal: lab.abnormal,
          resultDate: lab.result ? new Date('2026-05-01') : null,
        }
      });
    }
    console.log('  ✅ Created 10 LabOrders\n');
  } else {
    console.log(`  ⏭  LabOrders already has ${labCount} records, skipping.\n`);
  }

  // ─── 3. MORE MEDICAL RECORDS (3 → 6+) ────────────────────────────────────
  if (records.length < 6) {
    console.log('📋 Seeding additional MedicalRecords...');
    const deptIds = departments.map(d => d.id);
    const newRecords = [
      { type: 'OUTPATIENT', complaint: 'Recurrent malaria with fever and body weakness', diagnosis: '["Uncomplicated Malaria"]', plan: 'Antimalarial therapy, fluid resuscitation, monitor temperature' },
      { type: 'INPATIENT', complaint: 'Acute appendicitis - right iliac fossa pain', diagnosis: '["Acute Appendicitis"]', plan: 'Emergency appendectomy, post-op antibiotics, pain management' },
      { type: 'EMERGENCY', complaint: 'Severe pre-eclampsia at 34 weeks gestation', diagnosis: '["Severe Pre-eclampsia", "Pregnancy 34 weeks"]', plan: 'Magnesium sulfate infusion, blood pressure control, prepare for delivery' },
    ];

    for (let i = 0; i < newRecords.length; i++) {
      const r = newRecords[i];
      const patientIdx = (i + 3) % patientIds.length;
      const existing = await prisma.medicalRecord.findFirst({
        where: { patientId: patientIds[patientIdx] }
      });
      if (!existing) {
        await prisma.medicalRecord.create({
          data: {
            patientId: patientIds[patientIdx],
            facilityId: facilityIds[i % facilityIds.length],
            departmentId: deptIds[i % deptIds.length] || null,
            encounterType: r.type,
            attendingNurseId: nurseIds[i % nurseIds.length],
            chiefComplaint: r.complaint,
            nursingDiagnosis: r.diagnosis,
            nursingCarePlan: r.plan,
            status: 'ACTIVE',
          }
        });
      }
    }
    const totalRecords = await prisma.medicalRecord.count();
    console.log(`  ✅ MedicalRecords now: ${totalRecords}\n`);
  }

  // ─── 4. MORE VITAL SIGNS (3 → 15) ────────────────────────────────────────
  const vitalCount = await prisma.vitalSign.count();
  if (vitalCount < 10) {
    console.log('💓 Seeding VitalSigns...');
    const vitalsData = [
      { temp: 36.8, hr: 78, rr: 18, bpSys: 120, bpDia: 80, o2: 98, pain: 2, consciousness: 'ALERT' },
      { temp: 38.5, hr: 102, rr: 22, bpSys: 110, bpDia: 70, o2: 94, pain: 8, consciousness: 'ALERT' },
      { temp: 37.2, hr: 88, bpSys: 140, bpDia: 90, o2: 96, rr: 18, pain: 3, consciousness: 'ALERT' },
      { temp: 36.5, hr: 72, rr: 16, bpSys: 118, bpDia: 76, o2: 99, pain: 0, consciousness: 'ALERT' },
      { temp: 39.1, hr: 110, rr: 24, bpSys: 100, bpDia: 65, o2: 92, pain: 7, consciousness: 'RESPONDS_TO_VOICE' },
      { temp: 37.8, hr: 95, rr: 20, bpSys: 155, bpDia: 100, o2: 95, pain: 4, consciousness: 'ALERT' },
      { temp: 36.4, hr: 68, rr: 16, bpSys: 122, bpDia: 78, o2: 98, pain: 0, consciousness: 'ALERT' },
      { temp: 38.0, hr: 92, rr: 20, bpSys: 130, bpDia: 85, o2: 96, pain: 5, consciousness: 'ALERT' },
      { temp: 37.5, hr: 84, rr: 19, bpSys: 125, bpDia: 82, o2: 97, pain: 2, consciousness: 'ALERT' },
      { temp: 36.9, hr: 76, rr: 17, bpSys: 115, bpDia: 74, o2: 98, pain: 1, consciousness: 'ALERT' },
      { temp: 38.3, hr: 98, rr: 21, bpSys: 135, bpDia: 88, o2: 95, pain: 6, consciousness: 'ALERT' },
      { temp: 37.0, hr: 80, rr: 18, bpSys: 128, bpDia: 84, o2: 97, pain: 3, consciousness: 'ALERT' },
    ];

    for (let i = 0; i < vitalsData.length; i++) {
      const v = vitalsData[i];
      await prisma.vitalSign.create({
        data: {
          patientId: patientIds[i % patientIds.length],
          recordId: recordIds[i % recordIds.length] || null,
          recordedByNurseId: nurseIds[i % nurseIds.length],
          temperature: v.temp,
          heartRate: v.hr,
          respiratoryRate: v.rr,
          bloodPressureSystolic: v.bpSys,
          bloodPressureDiastolic: v.bpDia,
          oxygenSaturation: v.o2,
          painScale: v.pain,
          consciousnessLevel: v.consciousness,
          recordedAt: new Date(Date.now() - (i * 4 * 60 * 60 * 1000)),
          earlyWarningScore: v.temp > 38.5 || v.hr > 100 || v.o2 < 95 ? 3 : 1,
          isAbnormal: v.temp > 38.0 || v.hr > 100 || v.bpSys > 140 || v.o2 < 95,
          source: 'MANUAL',
        }
      });
    }
    const totalVitals = await prisma.vitalSign.count();
    console.log(`  ✅ VitalSigns now: ${totalVitals}\n`);
  }

  // ─── 5. MORE NURSING NOTES (2 → 10) ──────────────────────────────────────
  const noteCount = await prisma.nursingNote.count();
  if (noteCount < 8) {
    console.log('📝 Seeding NursingNotes...');
    const notes = [
      { type: 'PROGRESS', content: 'Patient reports decreased pain after medication. Vital signs stable. Continue current care plan. Will reassess in 4 hours.', ai: false },
      { type: 'ASSESSMENT', content: 'Initial nursing assessment completed. Patient alert and oriented x3. Skin warm and dry. Peripheral pulses palpable. IV site clean and dry.', ai: false },
      { type: 'INTERVENTION', content: 'Administered prescribed analgesic as ordered. Applied cold compress to affected area. Patient repositioned for comfort. Pain reassessment due in 30 minutes.', ai: false },
      { type: 'HANDOFF', content: 'Shift handoff: Patient stable on current regimen. Pending lab results for HbA1c and renal function. Family informed of care plan. Dietician consult requested.', ai: false },
      { type: 'AI_ASSISTED', content: 'Based on patient assessment data, recommend: 1) Continue current IV fluid regimen at 125ml/hr, 2) Monitor urine output hourly, 3) Recheck blood glucose in 2 hours, 4) Consider insulin sliding scale if glucose remains > 11 mmol/L', ai: true },
      { type: 'PROGRESS', content: 'Patient ambulated with assistance for 10 meters. Tolerated activity well. No complaints of dizziness or shortness of breath. Will increase distance tomorrow.', ai: false },
      { type: 'ASSESSMENT', content: 'Wound assessment: Surgical site clean, no signs of infection. Sutures intact. Minimal serosanguinous drainage on dressing. Continue current wound care protocol.', ai: false },
      { type: 'INTERVENTION', content: 'Patient educated on sickle cell crisis prevention: adequate hydration, avoidance of extreme temperatures, recognition of early crisis signs. Verbalized understanding of instructions.', ai: false },
    ];

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      await prisma.nursingNote.create({
        data: {
          recordId: recordIds[i % recordIds.length],
          nurseId: nurseIds[i % nurseIds.length],
          noteType: n.type,
          content: n.content,
          aiGenerated: n.ai,
          isSigned: i % 3 !== 0,
          signedAt: i % 3 !== 0 ? new Date() : null,
        }
      });
    }
    const totalNotes = await prisma.nursingNote.count();
    console.log(`  ✅ NursingNotes now: ${totalNotes}\n`);
  }

  // ─── 6. CONSULTATIONS (0 → 5) ────────────────────────────────────────────
  const consultCount = await prisma.consultation.count();
  if (consultCount === 0) {
    console.log('🩺 Seeding Consultations...');
    const consults = [
      { type: 'PEER', subject: 'Pain management advice for sickle cell crisis', desc: 'Patient in vaso-occlusive crisis not responding to current analgesic regimen. Need guidance on escalation protocol.' },
      { type: 'SPECIALIST', subject: 'Cardiology consult for new-onset atrial fibrillation', desc: 'Patient admitted for diabetes management now exhibiting irregular heart rhythm. Requesting cardiology evaluation.' },
      { type: 'PEER', subject: 'Wound care best practices for diabetic foot ulcer', desc: 'Chronic diabetic foot ulcer not responding to standard wound care. Seeking advice on advanced wound management techniques.' },
      { type: 'INTERDISCIPLINARY', subject: 'Discharge planning for complex pre-eclampsia case', desc: 'Patient stabilizing on magnesium sulfate. Need to coordinate discharge plan with obstetrics, pharmacy, and community health.' },
      { type: 'SPECIALIST', subject: 'Pediatric malaria management with complications', desc: 'Child with severe malaria and declining consciousness. Need pediatric infectious disease consult for management guidance.' },
    ];

    for (let i = 0; i < consults.length; i++) {
      const c = consults[i];
      const statuses = ['REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'];
      const status = statuses[i];
      await prisma.consultation.create({
        data: {
          requestingNurseId: nurseIds[i % nurseIds.length],
          consultingNurseId: nurseIds[(i + 1) % nurseIds.length],
          patientId: patientIds[i % patientIds.length],
          recordId: recordIds[i % recordIds.length],
          consultationType: c.type,
          subject: c.subject,
          description: c.desc,
          status,
          scheduledAt: status !== 'REQUESTED' ? new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) : null,
          startedAt: ['IN_PROGRESS', 'COMPLETED'].includes(status) ? new Date(Date.now() - (i * 12 * 60 * 60 * 1000)) : null,
          endedAt: status === 'COMPLETED' ? new Date(Date.now() - (i * 6 * 60 * 60 * 1000)) : null,
          recommendations: status === 'COMPLETED' ? 'Recommended adjustment to current treatment plan. Follow up in 48 hours.' : null,
        }
      });
    }
    console.log('  ✅ Created 5 Consultations\n');
  }

  // ─── 7. KNOWLEDGE ARTICLES (0 → 6) ───────────────────────────────────────
  const articleCount = await prisma.knowledgeArticle.count();
  if (articleCount === 0) {
    console.log('📚 Seeding KnowledgeArticles...');
    const articles = [
      {
        title: 'Managing Sickle Cell Crisis in Nigerian Healthcare Settings',
        slug: 'managing-sickle-cell-crisis-nigeria',
        category: 'HEMATOLOGY',
        tags: '["sickle cell", "pain management", "hematology", "Nigeria"]',
        content: 'Sickle cell disease remains one of the most prevalent genetic disorders in Nigeria, affecting approximately 2% of newborns. This article provides evidence-based guidelines for nursing management of vaso-occlusive crises, including pain assessment protocols, pharmacological interventions, and patient education strategies tailored to the Nigerian healthcare context.',
        summary: 'Evidence-based nursing guidelines for sickle cell crisis management in Nigeria',
        readingTime: 12,
        evidenceLevel: 'HIGH',
      },
      {
        title: 'Infection Prevention Best Practices for Primary Health Centers',
        slug: 'infection-prevention-primary-health-centers',
        category: 'INFECTION_CONTROL',
        tags: '["infection control", "primary health", "hygiene", "prevention"]',
        content: 'Primary health centers in Nigeria face unique challenges in infection prevention due to resource constraints and high patient volumes. This comprehensive guide covers hand hygiene compliance, personal protective equipment usage, waste management protocols, and surveillance strategies that can be implemented even in resource-limited settings.',
        summary: 'Practical infection prevention strategies for resource-limited Nigerian health centers',
        readingTime: 15,
        evidenceLevel: 'HIGH',
      },
      {
        title: 'Emergency Triage: The Nigerian Adaptation of the South African Triage Scale',
        slug: 'emergency-triage-nigerian-adaptation',
        category: 'EMERGENCY_NURSING',
        tags: '["triage", "emergency", "assessment", "critical care"]',
        content: 'Effective triage is crucial in Nigerian emergency departments where patient volumes often exceed available resources. This article describes the adaptation and implementation of the South African Triage Scale (SATS) for Nigerian healthcare settings, including validation studies, training protocols, and real-world implementation outcomes from Lagos University Teaching Hospital.',
        summary: 'Adapted triage scale for Nigerian emergency departments based on SATS',
        readingTime: 10,
        evidenceLevel: 'MODERATE',
      },
      {
        title: 'Maternal Health Nursing: Reducing Maternal Mortality in Northern Nigeria',
        slug: 'maternal-health-nursing-northern-nigeria',
        category: 'MATERNAL_HEALTH',
        tags: '["maternal health", "obstetrics", "northern Nigeria", "mortality"]',
        content: 'Northern Nigeria has some of the highest maternal mortality rates globally. This article examines the role of skilled nursing care in reducing these rates, covering antenatal care protocols, emergency obstetric interventions, cultural competency in maternal care, and community-based approaches to improving maternal health outcomes.',
        summary: 'Nursing strategies for reducing maternal mortality in Northern Nigeria',
        readingTime: 14,
        evidenceLevel: 'HIGH',
      },
      {
        title: 'Digital Health Tools for Nursing Practice in Nigeria',
        slug: 'digital-health-tools-nursing-nigeria',
        category: 'DIGITAL_HEALTH',
        tags: '["digital health", "telemedicine", "technology", "mHealth"]',
        content: 'The digital health revolution is transforming nursing practice across Nigeria. From mobile health applications for patient monitoring to telemedicine platforms for remote consultations, this article reviews the current landscape of digital health tools available to Nigerian nurses, their implementation challenges, and strategies for effective adoption in clinical practice.',
        summary: 'Overview of digital health tools and their adoption in Nigerian nursing practice',
        readingTime: 8,
        evidenceLevel: 'MODERATE',
      },
      {
        title: 'Pediatric Nursing Assessment: A Practical Guide for Nigerian Nurses',
        slug: 'pediatric-nursing-assessment-nigeria',
        category: 'PEDIATRIC_NURSING',
        tags: '["pediatric", "assessment", "child health", "nursing"]',
        content: 'Pediatric nursing assessment requires specialized skills and knowledge. This guide provides Nigerian nurses with a systematic approach to assessing children, including growth monitoring, developmental screening, and recognition of danger signs. Special attention is given to common childhood illnesses in Nigeria such as malaria, pneumonia, and diarrheal diseases.',
        summary: 'Systematic pediatric assessment guide for Nigerian nursing practice',
        readingTime: 11,
        evidenceLevel: 'HIGH',
      },
    ];

    for (const a of articles) {
      await prisma.knowledgeArticle.create({
        data: {
          authorId: nurseIds[0],
          title: a.title,
          slug: a.slug,
          category: a.category,
          tags: a.tags,
          content: a.content,
          summary: a.summary,
          readingTime: a.readingTime,
          evidenceLevel: a.evidenceLevel,
          isPublished: true,
          isFeatured: a.category === 'HEMATOLOGY' || a.category === 'EMERGENCY_NURSING',
          viewCount: Math.floor(Math.random() * 200) + 20,
          likeCount: Math.floor(Math.random() * 30) + 5,
          commentCount: Math.floor(Math.random() * 10),
        }
      });
    }
    console.log('  ✅ Created 6 KnowledgeArticles\n');
  }

  // ─── 8. ARTICLE COMMENTS (0 → 5) ─────────────────────────────────────────
  const commentCount = await prisma.articleComment.count();
  if (commentCount === 0) {
    console.log('💬 Seeding ArticleComments...');
    const articleList = await prisma.knowledgeArticle.findMany({ select: { id: true } });
    if (articleList.length > 0) {
      const commentTexts = [
        'Excellent article! The protocols for sickle cell crisis management are very practical and easy to follow in our setting.',
        'I have been using similar triage protocols in my facility. The Nigerian adaptation makes a significant difference in patient outcomes.',
        'Very timely piece. We need more research on maternal health interventions specific to Northern Nigeria.',
        'The section on digital health tools is particularly relevant. Would love to see more case studies on telemedicine implementation.',
        'Great practical guide. The developmental screening checklist is especially helpful for community health nurses.',
      ];
      for (let i = 0; i < commentTexts.length; i++) {
        await prisma.articleComment.create({
          data: {
            articleId: articleList[i % articleList.length].id,
            authorId: nurseIds[(i + 1) % nurseIds.length],
            content: commentTexts[i],
          }
        });
      }
      console.log('  ✅ Created 5 ArticleComments\n');
    }
  }

  // ─── 9. COMPETENCIES (0 → 10) ────────────────────────────────────────────
  const compCount = await prisma.competency.count();
  if (compCount === 0) {
    console.log('🏅 Seeding Competencies...');
    const competencies = [
      { area: 'CRITICAL_CARE', level: 'ADVANCED' },
      { area: 'PAIN_MANAGEMENT', level: 'ADVANCED' },
      { area: 'INFECTION_CONTROL', level: 'COMPETENT' },
      { area: 'PATIENT_EDUCATION', level: 'PROFICIENT' },
      { area: 'EMERGENCY_TRIAGE', level: 'ADVANCED' },
      { area: 'MATERNAL_CARE', level: 'COMPETENT' },
      { area: 'PEDIATRIC_ASSESSMENT', level: 'PROFICIENT' },
      { area: 'WOUND_MANAGEMENT', level: 'COMPETENT' },
      { area: 'MEDICATION_ADMINISTRATION', level: 'ADVANCED' },
      { area: 'DIGITAL_HEALTH_LITERACY', level: 'DEVELOPING' },
    ];

    for (let i = 0; i < competencies.length; i++) {
      const c = competencies[i];
      await prisma.competency.create({
        data: {
          nurseId: nurseIds[i % nurseIds.length],
          competencyArea: c.area,
          level: c.level,
          assessedBy: 'Head Nurse Assessment Committee',
          assessedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          evidence: 'Clinical observation, portfolio review, and peer assessment',
        }
      });
    }
    console.log('  ✅ Created 10 Competencies\n');
  }

  // ─── 10. PORTFOLIO ENTRIES (0 → 10) ──────────────────────────────────────
  const portfolioCount = await prisma.portfolioEntry.count();
  if (portfolioCount === 0) {
    console.log('📂 Seeding PortfolioEntries...');
    const entries = [
      { type: 'RESEARCH', title: 'Impact of Nurse-Led Triage on Emergency Department Wait Times', desc: 'Conducted a 6-month study at LUTH evaluating the impact of implementing a standardized triage protocol on patient wait times and outcomes. Results showed 35% reduction in average wait time and improved patient satisfaction scores.', featured: true },
      { type: 'CERTIFICATION', title: 'Advanced Cardiac Life Support (ACLS) Certification', desc: 'Completed ACLS certification through the American Heart Association. Demonstrated proficiency in cardiac arrest management, airway management, and pharmacological interventions for cardiac emergencies.', featured: true },
      { type: 'WORKSHOP', title: 'Infection Control Workshop - LUTH Annual Conference 2025', desc: 'Presented findings on hand hygiene compliance improvement strategies implemented across 3 wards. Workshop attended by 85 healthcare professionals.', featured: false },
      { type: 'COMMUNITY_SERVICE', title: 'Community Health Outreach - Sickle Cell Screening Program', desc: 'Led a 2-week community screening program in Lagos mainland, screening 450 individuals for sickle cell trait. Provided genetic counseling and education to 120 families.', featured: true },
      { type: 'PUBLICATION', title: 'Nursing Perspectives on Digital Health Adoption in Nigeria', desc: 'Published in the West African Journal of Nursing, this paper examines barriers and facilitators to digital health tool adoption among Nigerian nurses based on a multi-site survey of 250 nurses.', featured: false },
      { type: 'MENTORSHIP', title: 'Student Nurse Mentorship Program Coordinator', desc: 'Coordinated the student nurse mentorship program at LUTH, pairing 15 final-year nursing students with experienced practitioners. 93% completion rate with positive feedback from both mentors and mentees.', featured: false },
      { type: 'QUALITY_IMPROVEMENT', title: 'Medication Error Reduction Initiative', desc: 'Led a quality improvement project that reduced medication errors by 40% over 6 months through implementation of barcode scanning and double-verification protocols.', featured: true },
      { type: 'CONFERENCE', title: 'West African College of Nursing Conference 2025', desc: 'Attended and presented at the annual WACN conference in Accra, Ghana. Presentation title: "Building Resilient Nursing Workforces in Post-Pandemic West Africa".', featured: false },
      { type: 'TRAINING', title: 'Neonatal Resuscitation Program (NRP) Instructor', desc: 'Completed NRP instructor training and certified to train other healthcare providers in neonatal resuscitation techniques. Have trained 45 healthcare workers across 3 facilities.', featured: false },
      { type: 'AWARD', title: 'Outstanding Nurse of the Year - LUTH 2025', desc: 'Recognized for exceptional patient care, leadership during the cholera outbreak response, and contributions to nursing education at Lagos University Teaching Hospital.', featured: true },
    ];

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      await prisma.portfolioEntry.create({
        data: {
          nurseId: nurseIds[i % nurseIds.length],
          entryType: e.type,
          title: e.title,
          description: e.desc,
          isPublic: true,
          featured: e.featured,
          order: i,
          startDate: new Date(2025, i % 12, 1),
          endDate: e.type === 'COMMUNITY_SERVICE' || e.type === 'TRAINING' ? new Date(2025, (i % 12) + 1, 15) : null,
          isOngoing: e.type === 'MENTORSHIP',
        }
      });
    }
    console.log('  ✅ Created 10 PortfolioEntries\n');
  }

  // ─── 11. AI INTERACTIONS (0 → 8) ─────────────────────────────────────────
  const aiCount = await prisma.aIInteraction.count();
  if (aiCount === 0) {
    console.log('🤖 Seeding AIInteractions...');
    const interactions = [
      { type: 'DIAGNOSIS_SUGGESTION', input: 'Patient presents with severe chest pain, diaphoresis, and radiation to left arm. BP 90/60, HR 110.', output: 'Based on the clinical presentation, consider: 1) Acute Myocardial Infarction (high priority), 2) Pulmonary Embolism, 3) Aortic Dissection. Recommend immediate ECG, cardiac enzymes, and continuous monitoring.' },
      { type: 'CARE_PLAN', input: 'Generate a nursing care plan for a patient with severe pre-eclampsia at 34 weeks.', output: 'Nursing Care Plan for Severe Pre-eclampsia: 1) Monitor BP q15min, 2) Assess for signs of impending eclampsia (headache, visual changes, epigastric pain), 3) Magnesium sulfate protocol, 4) Monitor deep tendon reflexes, 5) Strict I&O, 6) Fetal monitoring, 7) Prepare for potential emergency delivery.' },
      { type: 'MEDICATION_CHECK', input: 'Can I administer ibuprofen to a patient with sickle cell disease and renal impairment (Cr 1.8)?', output: 'CAUTION: Ibuprofen is NOT recommended for this patient. NSAIDs can worsen renal impairment and may precipitate acute kidney injury in sickle cell patients with existing renal dysfunction. Consider acetaminophen for mild pain. For moderate-severe pain, follow sickle cell pain protocol with opioids as ordered.' },
      { type: 'VITALS_INTERPRETATION', input: 'Vitals: T 38.5, HR 110, RR 24, BP 100/65, SpO2 92%, Pain 8/10', output: 'ABNORMAL VITALS - Early Warning Score: 7 (HIGH RISK). Key findings: 1) Pyrexia - possible infection, 2) Tachycardia - compensatory, 3) Hypotension - concerning for sepsis, 4) Hypoxia - requires O2 therapy. Recommend: immediate physician notification, blood cultures, IV access, O2 supplementation, and sepsis bundle if indicated.' },
      { type: 'PATIENT_EDUCATION', input: 'Create a patient education plan for newly diagnosed Type 2 Diabetes patient in Nigeria', output: 'Patient Education Plan - Type 2 Diabetes: 1) Understanding diabetes - what it means in simple terms, 2) Blood glucose monitoring - teach technique and targets, 3) Medication adherence - importance of Metformin timing, 4) Dietary modifications - Nigerian diet adaptations (reduce refined carbs, increase vegetables), 5) Exercise - culturally appropriate activities, 6) Foot care - daily inspection, proper footwear, 7) Warning signs - hypo/hyperglycemia recognition, 8) Follow-up schedule.' },
      { type: 'DOCUMENTATION_ASSIST', input: 'Help me document this nursing note for a patient who had a fall during the night shift.', output: 'Suggested Nursing Note: "Patient found on floor beside bed at 03:45 by nursing staff during rounds. Patient alert, oriented x3, complaining of left hip pain (6/10). No loss of consciousness reported by patient. VS: BP 130/85, HR 92, RR 20, SpO2 96%, T 36.8. Left hip: no visible deformity, tender to palpation, ROM limited due to pain. Neuro checks q1h x4 then q4h. Fall precautions implemented. Physician Dr. Okafor notified at 03:52. X-ray ordered. Patient assisted back to bed with 2-person assist. Incident report filed."' },
      { type: 'DIAGNOSIS_SUGGESTION', input: 'Child age 5 with high fever for 3 days, convulsions, pallor, and splenomegaly', output: 'Clinical considerations for pediatric patient: 1) Severe Malaria (HIGH PRIORITY in endemic area) - request blood film urgently, 2) Meningitis - consider lumbar puncture if malaria negative, 3) Sickle cell crisis with infection. Immediate actions: IV access, blood film, blood culture, antimalarials, antipyretics, seizure precautions.' },
      { type: 'REFERRAL_NOTE', input: 'Generate a referral note for a patient needing transfer from primary health center to tertiary hospital for specialist care', output: 'REFERRAL NOTE: Patient [Name], [Age], [Gender]. Diagnosis: Severe pre-eclampsia at 34 weeks gestation. Current management: Magnesium sulfate infusion (loading dose completed), Nifedipine 20mg PO. VS: BP 160/110, HR 88, SpO2 97%. Reason for referral: Requires NICU-capable facility for potential emergency cesarean section and neonatal resuscitation. Current facility lacks obstetric surgical capability. Please arrange urgent transfer with continuous monitoring en route.' },
    ];

    for (let i = 0; i < interactions.length; i++) {
      const a = interactions[i];
      await prisma.aIInteraction.create({
        data: {
          recordId: recordIds[i % recordIds.length],
          nurseId: nurseIds[i % nurseIds.length],
          interactionType: a.type,
          userInput: a.input,
          aiOutput: a.output,
          aiModel: 'nurseos-ai-v2',
          confidenceScore: 0.85 + Math.random() * 0.12,
          wasAccepted: Math.random() > 0.2,
          feedbackRating: Math.floor(Math.random() * 2) + 4,
          responseTimeMs: Math.floor(Math.random() * 2000) + 500,
        }
      });
    }
    console.log('  ✅ Created 8 AIInteractions\n');
  }

  // ─── 12. MORE NOTIFICATIONS (3 → 12) ─────────────────────────────────────
  const notifCount = await prisma.notification.count();
  if (notifCount < 10) {
    console.log('🔔 Seeding Notifications...');
    const nurseUsers = users.filter(u => u.role === 'NURSE');
    const newNotifs = [
      { type: 'SHIFT', title: 'Shift Reminder', message: 'Your morning shift starts tomorrow at 07:00. Please arrive 15 minutes early for handoff.' },
      { type: 'ALERT', title: 'Critical Lab Result', message: 'Patient PT/2024/00001 - Critical blood glucose level: 22.4 mmol/L. Immediate intervention required.' },
      { type: 'PATIENT', title: 'New Patient Admission', message: 'New patient admitted to Emergency Department. Bed 4 assigned. Initial assessment needed.' },
      { type: 'MEDICATION', title: 'Medication Due', message: 'Metformin 500mg due for Patient PT/2024/00001 in 30 minutes. Please prepare for administration.' },
      { type: 'COURSE', title: 'Course Deadline', message: 'Your enrollment in "Fundamentals of Critical Care Nursing" has a module due in 2 days.' },
      { type: 'ALERT', title: 'License Expiry Warning', message: 'Your nursing license (NMCN/2024/00123) expires in 60 days. Please initiate renewal process.' },
      { type: 'CONSULTATION', title: 'Consultation Request', message: 'Dr. Adeyemi has requested your consultation for a complex wound care case. Please respond within 2 hours.' },
      { type: 'SYSTEM', title: 'System Maintenance', message: 'Scheduled system maintenance tonight from 02:00-04:00. Please save all work before then.' },
      { type: 'REFERRAL', title: 'Referral Update', message: 'Your referral for Patient PT/2024/00003 has been accepted by National Hospital Abuja. Transport being arranged.' },
    ];

    for (let i = 0; i < newNotifs.length; i++) {
      const n = newNotifs[i];
      const targetUser = nurseUsers[i % nurseUsers.length];
      if (targetUser) {
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: i % 3 === 0,
            readAt: i % 3 === 0 ? new Date() : null,
          }
        });
      }
    }
    const totalNotifs = await prisma.notification.count();
    console.log(`  ✅ Notifications now: ${totalNotifs}\n`);
  }

  // ─── 13. AUDIT LOGS (0 → 10) ─────────────────────────────────────────────
  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    console.log('📋 Seeding AuditLogs...');
    const audits = [
      { action: 'LOGIN', resource: 'auth', details: 'Successful login from Chrome on Windows' },
      { action: 'VIEW_PATIENT', resource: 'patient_profile', details: 'Viewed patient record PT/2024/00001' },
      { action: 'UPDATE_VITALS', resource: 'vital_sign', details: 'Recorded vital signs for patient PT/2024/00002' },
      { action: 'ADMINISTER_MEDICATION', resource: 'medication_order', details: 'Administered Metformin 500mg to PT/2024/00001' },
      { action: 'CREATE_NOTE', resource: 'nursing_note', details: 'Created progress note for medical record' },
      { action: 'AI_INTERACTION', resource: 'ai_interaction', details: 'Used AI assistant for diagnosis suggestion' },
      { action: 'UPDATE_PROFILE', resource: 'nurse_profile', details: 'Updated specialization and skills' },
      { action: 'VIEW_LAB_RESULTS', resource: 'lab_order', details: 'Viewed lab results for patient PT/2024/00003' },
      { action: 'CREATE_REFERRAL', resource: 'referral', details: 'Created referral for patient to National Hospital Abuja' },
      { action: 'COMPLETE_COURSE_MODULE', resource: 'enrollment', details: 'Completed Module 3 of Infection Prevention course' },
    ];

    for (let i = 0; i < audits.length; i++) {
      const a = audits[i];
      const nurseUser = users.find(u => u.role === 'NURSE' && nurseUserIds.includes(u.id));
      if (nurseUser) {
        await prisma.auditLog.create({
          data: {
            userId: nurseUser.id,
            action: a.action,
            resource: a.resource,
            details: a.details,
            ipAddress: `192.168.1.${100 + i}`,
            userAgent: 'Mozilla/5.0 Chrome/125.0',
          }
        });
      }
    }
    console.log('  ✅ Created 10 AuditLogs\n');
  }

  // ─── 14. SIMULATIONS (0 → 4) ─────────────────────────────────────────────
  const simCount = await prisma.simulation.count();
  if (simCount === 0) {
    console.log('🎮 Seeding Simulations...');
    const sims = [
      {
        title: 'Cardiac Arrest Response Simulation',
        desc: 'Practice your response to a cardiac arrest scenario in the emergency department. Includes CPR, defibrillation, and medication administration decisions.',
        scenarioType: 'EMERGENCY',
        difficulty: 'ADVANCED',
        patient: '{"age":55,"gender":"MALE","weight":80,"history":"Hypertension, Type 2 Diabetes","presentation":"Unresponsive, no pulse, asystole on monitor"}',
        initial: 'You are the charge nurse in the ED. A 55-year-old male is brought in by ambulance in cardiac arrest. The paramedics have been performing CPR for 10 minutes.',
        decisions: '["Initiate ACLS protocol","Assess rhythm and defibrillate","Administer epinephrine","Consider reversible causes","Post-ROSC management"]',
        correct: '["Check pulse and rhythm","Begin high-quality CPR","Defibrillate if shockable rhythm","Administer epinephrine 1mg IV q3-5min","Amiodarone 300mg IV for VF/pVT"]',
        objectives: '["Demonstrate ACLS protocol","Effective team communication","Appropriate medication selection","Post-ROSC stabilization"]',
        timeLimit: 20,
        duration: 15,
      },
      {
        title: 'Pediatric Sepsis Recognition',
        desc: 'Early recognition and management of sepsis in a 3-year-old child. Practice the pediatric sepsis bundle and escalation protocols.',
        scenarioType: 'PEDIATRIC',
        difficulty: 'INTERMEDIATE',
        patient: '{"age":3,"gender":"FEMALE","weight":14,"history":"Previously healthy","presentation":"Fever for 2 days, lethargic, poor feeding, mottled skin"}',
        initial: 'A mother brings her 3-year-old daughter to the pediatric ward. The child has had fever for 2 days, is lethargic, not feeding, and the skin appears mottled.',
        decisions: '["Perform initial assessment","Recognize sepsis signs","Initiate sepsis bundle","Notify physician","Monitor response"]',
        correct: '["Assess ABCs and vital signs","Calculate pediatric early warning score","Obtain blood cultures before antibiotics","Administer fluid bolus 20ml/kg","Start broad-spectrum antibiotics within 1 hour"]',
        objectives: '["Early sepsis recognition","Pediatric assessment skills","Sepsis bundle implementation","Parent communication"]',
        timeLimit: 25,
        duration: 20,
      },
      {
        title: 'Obstetric Emergency - Shoulder Dystocia',
        desc: 'Manage a shoulder dystocia emergency during delivery. Practice the HELPERR mnemonic and team coordination.',
        scenarioType: 'OBSTETRIC',
        difficulty: 'ADVANCED',
        patient: '{"age":28,"gender":"FEMALE","gravidity":"G2P1","gestation":"39 weeks","history":"Previous SVD, GDM","presentation":"Head delivered, shoulders impacted"}',
        initial: 'You are the midwife assisting with a delivery. The baby\'s head has been delivered but the shoulders are stuck. The clock is ticking - you have approximately 5 minutes before hypoxic injury risk increases significantly.',
        decisions: '["Call for help","Position mother","Apply suprapubic pressure","Attempt maneuvers","Prepare for neonatal resuscitation"]',
        correct: '["Call for additional help immediately","McRoberts maneuver - hyperflex hips","Suprapubic pressure - NOT fundal pressure","Rotational maneuvers if needed","Prepare neonatal resuscitation team"]',
        objectives: '["HELPERR mnemonic application","Team communication under pressure","Appropriate maneuver selection","Documentation of interventions"]',
        timeLimit: 10,
        duration: 8,
      },
      {
        title: 'Medication Error Prevention',
        desc: 'Identify and prevent medication errors in a busy ward setting. Practice the 5 Rights of medication administration.',
        scenarioType: 'MEDICATION_SAFETY',
        difficulty: 'BEGINNER',
        patient: '{"age":67,"gender":"MALE","weight":70,"history":"CKD Stage 3, HTN, T2DM","allergies":"Penicillin, Sulfa drugs"}',
        initial: 'You are preparing to administer medications to 4 patients on the medical ward. The ward is short-staffed and there are several medication orders that need verification. Some orders may contain errors.',
        decisions: '["Verify patient identity","Check medication orders","Identify drug interactions","Assess for contraindications","Document administration"]',
        correct: '["Use two patient identifiers","Verify 5 rights of medication","Check allergies and interactions","Question unclear orders","Document immediately after administration"]',
        objectives: '["5 Rights of medication administration","Error identification skills","Communication about concerns","Proper documentation"]',
        timeLimit: 30,
        duration: 20,
      },
    ];

    for (let i = 0; i < sims.length; i++) {
      const s = sims[i];
      await prisma.simulation.create({
        data: {
          courseId: courses[i % courses.length]?.id || null,
          title: s.title,
          description: s.desc,
          scenarioType: s.scenarioType,
          difficulty: s.difficulty,
          patientProfile: s.patient,
          initialPresentation: s.initial,
          decisionPoints: s.decisions,
          correctActions: s.correct,
          timeLimitMinutes: s.timeLimit,
          durationMinutes: s.duration,
          learningObjectives: s.objectives,
          isPublished: true,
          completionCount: Math.floor(Math.random() * 50) + 10,
          avgScore: 70 + Math.random() * 20,
        }
      });
    }
    console.log('  ✅ Created 4 Simulations\n');
  }

  // ─── 15. SIMULATION ATTEMPTS (0 → 6) ─────────────────────────────────────
  const simAttemptCount = await prisma.simulationAttempt.count();
  if (simAttemptCount === 0) {
    console.log('📊 Seeding SimulationAttempts...');
    const simList = await prisma.simulation.findMany({ select: { id: true } });
    if (simList.length > 0) {
      const attempts = [
        { score: 92, max: 100, time: 912, strengths: '["Excellent ACLS protocol adherence","Clear team communication"]', improvements: '["Could improve documentation timing"]' },
        { score: 78, max: 100, time: 1200, strengths: '["Good recognition of sepsis signs","Appropriate fluid resuscitation"]', improvements: '["Faster antibiotic administration","Better parent communication"]' },
        { score: 85, max: 100, time: 540, strengths: '["Quick call for help","Effective McRoberts maneuver"]', improvements: '["Need to prepare neonatal team earlier"]' },
        { score: 88, max: 100, time: 1500, strengths: '["Thorough patient verification","Caught medication interaction"]', improvements: '["Improve speed under pressure"]' },
        { score: 70, max: 100, time: 1080, strengths: '["Recognized emergency","Initiated basic interventions"]', improvements: '["Need better prioritization","Documentation during emergency"]' },
        { score: 95, max: 100, time: 780, strengths: '["Perfect protocol adherence","Excellent communication","Comprehensive documentation"]', improvements: '[]' },
      ];

      for (let i = 0; i < attempts.length; i++) {
        const a = attempts[i];
        await prisma.simulationAttempt.create({
          data: {
            simulationId: simList[i % simList.length].id,
            nurseId: nurseIds[i % nurseIds.length],
            score: a.score,
            maxScore: a.max,
            timeTakenSeconds: a.time,
            strengths: a.strengths,
            areasForImprovement: a.improvements,
            wouldRepeat: true,
            completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          }
        });
      }
      console.log('  ✅ Created 6 SimulationAttempts\n');
    }
  }

  // ─── 16. APPOINTMENTS (0 → 8) ────────────────────────────────────────────
  const apptCount = await prisma.appointment.count();
  if (apptCount === 0) {
    console.log('📅 Seeding Appointments...');
    const appts = [
      { type: 'FOLLOW_UP', reason: 'Diabetes management review and medication adjustment', duration: 30 },
      { type: 'CHECK_UP', reason: 'Routine antenatal checkup at 34 weeks', duration: 20 },
      { type: 'CONSULTATION', reason: 'Pre-surgical assessment and counseling', duration: 45 },
      { type: 'FOLLOW_UP', reason: 'Post-discharge wound assessment', duration: 20 },
      { type: 'CHECK_UP', reason: 'Sickle cell disease follow-up and blood work review', duration: 30 },
      { type: 'EMERGENCY', reason: 'Acute asthma exacerbation - urgent review', duration: 15 },
      { type: 'CONSULTATION', reason: 'Genetic counseling for sickle cell trait', duration: 60 },
      { type: 'FOLLOW_UP', reason: 'Hypertension management and lifestyle counseling', duration: 25 },
    ];

    for (let i = 0; i < appts.length; i++) {
      const a = appts[i];
      await prisma.appointment.create({
        data: {
          patientId: patientIds[i % patientIds.length],
          facilityId: facilityIds[i % facilityIds.length],
          nurseId: nurseIds[i % nurseIds.length],
          appointmentDate: new Date(Date.now() + (i * 2 * 24 * 60 * 60 * 1000)),
          durationMinutes: a.duration,
          type: a.type,
          status: i < 2 ? 'COMPLETED' : (i < 4 ? 'SCHEDULED' : 'CONFIRMED'),
          reason: a.reason,
        }
      });
    }
    console.log('  ✅ Created 8 Appointments\n');
  }

  // ─── 17. VISIT RECORDS (0 → 6) ───────────────────────────────────────────
  const visitCount = await prisma.visitRecord.count();
  if (visitCount === 0) {
    console.log('🏥 Seeding VisitRecords...');
    const visits = [
      { type: 'EMERGENCY', outcome: 'Admitted for observation and treatment' },
      { type: 'OUTPATIENT', outcome: 'Discharged with medication and follow-up appointment' },
      { type: 'INPATIENT', outcome: 'Transferred to tertiary facility for specialist care' },
      { type: 'OUTPATIENT', outcome: 'Routine checkup - stable, continue current management' },
      { type: 'EMERGENCY', outcome: 'Treated and discharged after stabilization' },
      { type: 'INPATIENT', outcome: 'Improved, discharged home with care plan' },
    ];

    for (let i = 0; i < visits.length; i++) {
      const v = visits[i];
      await prisma.visitRecord.create({
        data: {
          patientId: patientIds[i % patientIds.length],
          facilityId: facilityIds[i % facilityIds.length],
          visitType: v.type,
          outcome: v.outcome,
          visitDate: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)),
        }
      });
    }
    console.log('  ✅ Created 6 VisitRecords\n');
  }

  // ─── 18. MORE REFERRALS (1 → 5) ──────────────────────────────────────────
  const referralCount = await prisma.referral.count();
  if (referralCount < 4) {
    console.log('🔄 Seeding additional Referrals...');
    const newReferrals = [
      { reason: 'Severe pre-eclampsia requiring NICU-capable facility', urgency: 'URGENT', summary: 'Patient at 34 weeks with BP 160/110, on MgSO4. Needs facility with obstetric surgery capability.', status: 'ACCEPTED' },
      { reason: 'Pediatric malaria with cerebral involvement', urgency: 'EMERGENCY', summary: '5-year-old with severe malaria, declining GCS. Needs pediatric ICU and neurology consult.', status: 'PENDING' },
      { reason: 'Complex diabetic foot ulcer not responding to treatment', urgency: 'ROUTINE', summary: 'Chronic ulcer with possible osteomyelitis. Needs vascular surgery and wound care specialist evaluation.', status: 'IN_TRANSIT' },
      { reason: 'Post-operative complication following appendectomy', urgency: 'URGENT', summary: 'Patient developing signs of peritonitis 48 hours post-appendectomy. Needs surgical review.', status: 'COMPLETED' },
    ];

    for (let i = 0; i < newReferrals.length; i++) {
      const r = newReferrals[i];
      await prisma.referral.create({
        data: {
          patientId: patientIds[i % patientIds.length],
          fromFacilityId: facilityIds[i % facilityIds.length],
          toFacilityId: facilityIds[(i + 1) % facilityIds.length],
          referringNurseId: nurseIds[i % nurseIds.length],
          reason: r.reason,
          clinicalSummary: r.summary,
          urgency: r.urgency,
          status: r.status,
          acceptedByNurseId: r.status !== 'PENDING' ? nurseIds[(i + 2) % nurseIds.length] : undefined,
          acceptedAt: ['ACCEPTED', 'COMPLETED', 'IN_TRANSIT'].includes(r.status) ? new Date() : undefined,
          patientArrived: r.status === 'COMPLETED',
          arrivedAt: r.status === 'COMPLETED' ? new Date() : undefined,
          outcomeNotes: r.status === 'COMPLETED' ? 'Patient received and stabilized. Treatment plan adjusted.' : undefined,
        }
      });
    }
    const totalRef = await prisma.referral.count();
    console.log(`  ✅ Referrals now: ${totalRef}\n`);
  }

  // ─── 19. STAFFING PREDICTIONS (0 → 5) ────────────────────────────────────
  const staffingCount = await prisma.staffingPrediction.count();
  if (staffingCount === 0) {
    console.log('📈 Seeding StaffingPredictions...');
    const deptIds = departments.map(d => d.id);
    for (let i = 0; i < 5; i++) {
      await prisma.staffingPrediction.create({
        data: {
          facilityId: facilityIds[i % facilityIds.length],
          departmentId: deptIds[i % deptIds.length] || null,
          predictedDate: new Date(Date.now() + ((i + 1) * 24 * 60 * 60 * 1000)),
          predictedPatientLoad: 15 + Math.floor(Math.random() * 25),
          recommendedStaffing: 4 + Math.floor(Math.random() * 4),
          confidence: 0.72 + Math.random() * 0.2,
          factors: JSON.stringify({
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i],
            seasonalTrend: 'Dry season - increased malaria cases',
            historicalAverage: 20 + Math.floor(Math.random() * 10),
          }),
        }
      });
    }
    console.log('  ✅ Created 5 StaffingPredictions\n');
  }

  // ─── 20. MORE CPD RECORDS (already has 6, add a few more per nurse) ──────
  const cpdCount = await prisma.cPDRecord.count();
  if (cpdCount < 15) {
    console.log('📖 Seeding additional CPDRecords...');
    const cpdActivities = [
      { type: 'WORKSHOP', title: 'Advanced Wound Care Management Workshop', points: 5, provider: 'Wound Care Association of Nigeria' },
      { type: 'SEMINAR', title: 'Patient Safety and Quality Improvement Seminar', points: 3, provider: 'Nigerian Nursing Council' },
      { type: 'ONLINE_COURSE', title: 'Digital Health Literacy for Healthcare Workers', points: 4, provider: 'WHO Digital Health Academy' },
      { type: 'CONFERENCE', title: 'Annual Nursing Research Conference 2025', points: 8, provider: 'University of Lagos School of Nursing' },
      { type: 'PEER_REVIEW', title: 'Peer Review Panel - Journal of Nigerian Nursing', points: 3, provider: 'Journal of Nigerian Nursing' },
      { type: 'CLINICAL_SUPERVISION', title: 'Clinical Supervision of Student Nurses', points: 6, provider: 'LUTH Training Department' },
      { type: 'RESEARCH', title: 'Contributed to malaria treatment protocol study', points: 10, provider: 'Nigerian Institute of Medical Research' },
      { type: 'SELF_DIRECTED', title: 'Advanced Pharmacology Self-Study Module', points: 4, provider: 'NurseOS Academy' },
      { type: 'MENTORING', title: 'Mentored 3 junior nurses through competency assessments', points: 5, provider: 'LUTH Professional Development' },
    ];

    for (let i = 0; i < cpdActivities.length; i++) {
      const c = cpdActivities[i];
      await prisma.cPDRecord.create({
        data: {
          nurseId: nurseIds[i % nurseIds.length],
          activityType: c.type,
          title: c.title,
          description: `Completed ${c.title} as part of continuing professional development requirements.`,
          cpdPoints: c.points,
          dateCompleted: new Date(Date.now() - (i * 15 * 24 * 60 * 60 * 1000)),
          provider: c.provider,
          isVerified: i % 3 === 0,
        }
      });
    }
    const totalCpd = await prisma.cPDRecord.count();
    console.log(`  ✅ CPDRecords now: ${totalCpd}\n`);
  }


  // ─── 20. COMPREHENSIVE NIGERIAN HEALTHCARE FACILITIES ─────────────────────
  const currentFacilityCount = await prisma.facility.count();
  if (currentFacilityCount < 80) {
    console.log('🏥 Seeding comprehensive Nigerian healthcare facilities across all 36 states + FCT...');

    // Helper: check if a facility already exists by name or registrationNumber
    const facilityExists = async (name: string, regNum: string): Promise<boolean> => {
      const found = await prisma.facility.findFirst({
        where: {
          OR: [
            { name: name },
            { registrationNumber: regNum },
          ]
        }
      });
      return !!found;
    };

    interface FacilitySeed {
      name: string;
      type: string;
      level: string;
      address: string;
      city: string;
      state: string;
      phone: string;
      email: string;
      bedCapacity: number;
      staffCount: number;
      registrationNumber: string;
      accreditingBody: string;
      accreditationStatus: string;
      isVerified: boolean;
      isEmergencyCapable: boolean;
      servicesOffered: string;
      operatingHours: string;
    }

    const nigerianFacilities: FacilitySeed[] = [
      // ═══════════════════════════════════════════════════════════════════════
      // FCT - ABUJA (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'National Hospital Abuja', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Central District, Independence Avenue', city: 'Abuja', state: 'FCT', phone: '+234-9-523-5104', email: 'info@nationalhospitalabuja.gov.ng', bedCapacity: 600, staffCount: 2800, registrationNumber: 'FAC/FCT/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Orthopedics","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics & Gynecology","Emergency Medicine","Dialysis"]', operatingHours: '24/7' },
      { name: 'Federal Medical Centre Jabi', type: 'FMC', level: 'TERTIARY', address: 'Jabi District, Off Nnamdi Azikiwe Expressway', city: 'Abuja', state: 'FCT', phone: '+234-9-291-6480', email: 'info@fmcjabi.gov.ng', bedCapacity: 350, staffCount: 1500, registrationNumber: 'FAC/FCT/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care","Radiology"]', operatingHours: '24/7' },
      { name: 'Asokoro District Hospital', type: 'HOSPITAL', level: 'SECONDARY', address: 'Asokoro District, Behind ECOWAS Secretariat', city: 'Abuja', state: 'FCT', phone: '+234-9-314-0280', email: 'info@asokorohospital.gov.ng', bedCapacity: 200, staffCount: 850, registrationNumber: 'FAC/FCT/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Maternity","Emergency"]', operatingHours: '24/7' },
      { name: 'Maitama District Hospital', type: 'HOSPITAL', level: 'SECONDARY', address: 'Maitama District, IBB Way', city: 'Abuja', state: 'FCT', phone: '+234-9-523-3600', email: 'info@maitamahospital.gov.ng', bedCapacity: 180, staffCount: 750, registrationNumber: 'FAC/FCT/SH/002', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Radiology"]', operatingHours: '24/7' },
      { name: 'Gwarinpa Primary Health Center', type: 'PHC', level: 'PRIMARY', address: 'Gwarinpa Estate, 1st Avenue', city: 'Abuja', state: 'FCT', phone: '+234-9-290-1234', email: 'phc.gwarinpa@fct.gov.ng', bedCapacity: 30, staffCount: 45, registrationNumber: 'FAC/FCT/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care","Health Education"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'Nizamiye Hospital Abuja', type: 'HOSPITAL', level: 'TERTIARY', address: 'Kukwaba District, Apo-Karshi Road', city: 'Abuja', state: 'FCT', phone: '+234-9-291-5555', email: 'info@nizamiye.com.ng', bedCapacity: 260, staffCount: 900, registrationNumber: 'FAC/FCT/PVT/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Cardiology","Orthopedics","Neurosurgery","Oncology","General Surgery","Dialysis"]', operatingHours: '24/7' },
      { name: 'Abuja Clinics Diagnostic Centre', type: 'DIAGNOSTIC_CENTER', level: 'SECONDARY', address: 'No 2 Jokes Plaza, Aminu Kano Crescent, Wuse 2', city: 'Abuja', state: 'FCT', phone: '+234-9-460-2200', email: 'info@abujaclinics.com', bedCapacity: 20, staffCount: 120, registrationNumber: 'FAC/FCT/DC/001', accreditingBody: 'Medical Laboratory Science Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Laboratory Services","Radiology","CT Scan","MRI","Ultrasound","Echocardiography"]', operatingHours: 'Mon-Sat 07:00-20:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // LAGOS STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Lagos University Teaching Hospital (LUTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Idi-Araba, Mushin', city: 'Lagos', state: 'Lagos', phone: '+234-1-497-5210', email: 'info@luth.gov.ng', bedCapacity: 760, staffCount: 3500, registrationNumber: 'FAC/LAG/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics & Gynecology","Orthopedics","Emergency Medicine","Radiotherapy"]', operatingHours: '24/7' },
      { name: 'Lagos State University Teaching Hospital (LASUTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: '1-5 Oba Akinjobi Way, GRA, Ikeja', city: 'Ikeja', state: 'Lagos', phone: '+234-1-794-9111', email: 'info@lasuth.gov.ng', bedCapacity: 555, staffCount: 2600, registrationNumber: 'FAC/LAG/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Orthopedics","Pediatrics","Obstetrics","Oncology","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Federal Medical Centre Ebute-Metta', type: 'FMC', level: 'TERTIARY', address: '33-35 Ingawa Street, Ebute-Metta', city: 'Lagos', state: 'Lagos', phone: '+234-1-774-0540', email: 'info@fmcebute.gov.ng', bedCapacity: 300, staffCount: 1300, registrationNumber: 'FAC/LAG/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Ophthalmology","ENT"]', operatingHours: '24/7' },
      { name: 'Lagos Island Maternity Hospital', type: 'MATERNITY_HOME', level: 'SECONDARY', address: '10 Campbell Street, Lagos Island', city: 'Lagos', state: 'Lagos', phone: '+234-1-263-4567', email: 'info@lagosmaternity.gov.ng', bedCapacity: 120, staffCount: 350, registrationNumber: 'FAC/LAG/MH/001', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Antenatal Care","Delivery Services","Postnatal Care","Neonatal Care","Family Planning"]', operatingHours: '24/7' },
      { name: 'Alimosho General Hospital', type: 'HOSPITAL', level: 'SECONDARY', address: 'Igando-Isheri Road, Alimosho', city: 'Igando', state: 'Lagos', phone: '+234-1-898-7654', email: 'info@alimoshoGH.gov.ng', bedCapacity: 150, staffCount: 550, registrationNumber: 'FAC/LAG/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },
      { name: 'Gbagada General Hospital', type: 'HOSPITAL', level: 'SECONDARY', address: 'Gbagada Phase 2, Kosofe', city: 'Gbagada', state: 'Lagos', phone: '+234-1-802-3456', email: 'info@gbagadaGH.gov.ng', bedCapacity: 160, staffCount: 600, registrationNumber: 'FAC/LAG/SH/002', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency","Radiology"]', operatingHours: '24/7' },
      { name: 'Reddington Hospital', type: 'HOSPITAL', level: 'TERTIARY', address: '12 Isaac John Street, GRA, Ikeja', city: 'Ikeja', state: 'Lagos', phone: '+234-1-460-3400', email: 'info@reddingtonhospital.com', bedCapacity: 150, staffCount: 650, registrationNumber: 'FAC/LAG/PVT/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Cardiology","Oncology","Orthopedics","General Surgery","Dialysis","Executive Health"]', operatingHours: '24/7' },
      { name: 'St. Nicholas Hospital Lagos', type: 'HOSPITAL', level: 'TERTIARY', address: '57 Campbell Street, Lagos Island', city: 'Lagos', state: 'Lagos', phone: '+234-1-262-1111', email: 'info@stnicholashospital.com', bedCapacity: 120, staffCount: 550, registrationNumber: 'FAC/LAG/PVT/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Nephrology","Dialysis","Kidney Transplant","General Medicine","Surgery"]', operatingHours: '24/7' },
      { name: 'Lagoon Hospitals Lagos', type: 'HOSPITAL', level: 'TERTIARY', address: '8-10 Isaac John Street, GRA, Ikeja', city: 'Ikeja', state: 'Lagos', phone: '+234-1-270-5650', email: 'info@lagoonhospitals.com', bedCapacity: 100, staffCount: 500, registrationNumber: 'FAC/LAG/PVT/003', accreditingBody: 'Joint Commission International', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Orthopedics","Obstetrics","Emergency Medicine","Critical Care"]', operatingHours: '24/7' },
      { name: 'Evercare Hospital Lekki', type: 'HOSPITAL', level: 'TERTIARY', address: '1A Admiralty Way, Lekki Phase 1', city: 'Lekki', state: 'Lagos', phone: '+234-1-460-3300', email: 'info@evercarehospital.com', bedCapacity: 130, staffCount: 550, registrationNumber: 'FAC/LAG/PVT/004', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Oncology","Pediatrics","Obstetrics","Emergency"]', operatingHours: '24/7' },
      { name: 'First City Hospital Lagos', type: 'CLINIC', level: 'SECONDARY', address: '44 Marina, Lagos Island', city: 'Lagos', state: 'Lagos', phone: '+234-1-263-2222', email: 'info@firstcityhospital.com', bedCapacity: 60, staffCount: 200, registrationNumber: 'FAC/LAG/PVT/005', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics"]', operatingHours: '24/7' },
      { name: 'Lagos Primary Health Center Surulere', type: 'PHC', level: 'PRIMARY', address: '15 Adeniran Ogunsanya Street, Surulere', city: 'Surulere', state: 'Lagos', phone: '+234-1-876-2345', email: 'phc.surulere@lagosstate.gov.ng', bedCapacity: 20, staffCount: 35, registrationNumber: 'FAC/LAG/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'Bridge Clinic Fertility Centre Lagos', type: 'SPECIALIST_CENTER', level: 'TERTIARY', address: '68 Awolowo Road, Ikoyi', city: 'Ikoyi', state: 'Lagos', phone: '+234-1-271-4444', email: 'info@bridgeclinic.com', bedCapacity: 30, staffCount: 85, registrationNumber: 'FAC/LAG/SC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["IVF","Fertility Treatment","Reproductive Medicine","Counseling"]', operatingHours: 'Mon-Sat 08:00-18:00' },
      { name: 'Clina-Lancet Diagnostics Lagos', type: 'DIAGNOSTIC_CENTER', level: 'SECONDARY', address: '13A Adeyemo Alakija Street, Victoria Island', city: 'Lagos', state: 'Lagos', phone: '+234-1-461-2900', email: 'info@clina-lancet.com', bedCapacity: 5, staffCount: 150, registrationNumber: 'FAC/LAG/DC/001', accreditingBody: 'Medical Laboratory Science Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Pathology","Microbiology","Chemistry","Hematology","Molecular Diagnostics"]', operatingHours: 'Mon-Sat 07:00-18:00' },
      { name: 'Nigerian Institute of Medical Research Yaba', type: 'SPECIALIST_CENTER', level: 'TERTIARY', address: '6 Edmund Crescent, Yaba', city: 'Lagos', state: 'Lagos', phone: '+234-1-681-2651', email: 'info@nimr.gov.ng', bedCapacity: 50, staffCount: 400, registrationNumber: 'FAC/LAG/SC/002', accreditingBody: 'Federal Ministry of Health', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Research","Clinical Trials","Laboratory Services","Epidemiology","HIV/AIDS Research","Malaria Research"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'UNILAG Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Lagos, Akoka, Yaba', city: 'Lagos', state: 'Lagos', phone: '+234-1-493-2661', email: 'healthcentre@unilag.edu.ng', bedCapacity: 40, staffCount: 60, registrationNumber: 'FAC/LAG/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services","Pharmacy"]', operatingHours: 'Mon-Fri 08:00-20:00, Sat 09:00-14:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // OYO STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University College Hospital (UCH) Ibadan', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Queen Elizabeth Road, Mokola', city: 'Ibadan', state: 'Oyo', phone: '+234-2-241-0088', email: 'info@uch-ibadan.org', bedCapacity: 850, staffCount: 3800, registrationNumber: 'FAC/OYO/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics & Gynecology","Orthopedics","Emergency Medicine","Radiotherapy"]', operatingHours: '24/7' },
      { name: 'Adeoyo Maternity Hospital Ibadan', type: 'MATERNITY_HOME', level: 'SECONDARY', address: 'Adeoyo Road, Yemetu', city: 'Ibadan', state: 'Oyo', phone: '+234-2-241-2233', email: 'info@adeoyomaternity.gov.ng', bedCapacity: 100, staffCount: 280, registrationNumber: 'FAC/OYO/MH/001', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Antenatal Care","Delivery","Postnatal Care","Neonatal Intensive Care","Family Planning"]', operatingHours: '24/7' },
      { name: 'Ring Road State Hospital Ibadan', type: 'HOSPITAL', level: 'SECONDARY', address: 'Ring Road, Ibadan', city: 'Ibadan', state: 'Oyo', phone: '+234-2-231-4567', email: 'info@ringroadhospital.gov.ng', bedCapacity: 200, staffCount: 700, registrationNumber: 'FAC/OYO/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Maternity","Emergency"]', operatingHours: '24/7' },
      { name: 'Oyo State Primary Health Center Ido', type: 'PHC', level: 'PRIMARY', address: 'Ido-Eruwa Road, Ido', city: 'Ido', state: 'Oyo', phone: '+234-2-234-5678', email: 'phc.ido@oyostate.gov.ng', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/OYO/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'University of Ibadan Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Ibadan Campus, Ibadan', city: 'Ibadan', state: 'Oyo', phone: '+234-2-871-4104', email: 'healthcentre@ui.edu.ng', bedCapacity: 35, staffCount: 50, registrationNumber: 'FAC/OYO/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services","Pharmacy"]', operatingHours: 'Mon-Fri 08:00-20:00' },
      { name: 'Baptist Medical Centre Ogbomoso', type: 'HOSPITAL', level: 'SECONDARY', address: 'Ogbomoso-Ilorin Road, Ogbomoso', city: 'Ogbomoso', state: 'Oyo', phone: '+234-38-220-100', email: 'info@baptistmedicalcentre.org', bedCapacity: 120, staffCount: 350, registrationNumber: 'FAC/OYO/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Eye Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // OGUN STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Abeokuta', type: 'FMC', level: 'TERTIARY', address: 'Idi-Aba, Abeokuta', city: 'Abeokuta', state: 'Ogun', phone: '+234-39-240-255', email: 'info@fmcabeokuta.org', bedCapacity: 400, staffCount: 1600, registrationNumber: 'FAC/OGN/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Olabisi Onabanjo University Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Sagamu-Ikorodu Road, Sagamu', city: 'Sagamu', state: 'Ogun', phone: '+234-37-230-456', email: 'info@oouth.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/OGN/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Sacred Heart Hospital Lantoro', type: 'CLINIC', level: 'SECONDARY', address: 'Lantoro, Abeokuta', city: 'Abeokuta', state: 'Ogun', phone: '+234-39-230-123', email: 'info@sacredheartlantoro.org', bedCapacity: 80, staffCount: 200, registrationNumber: 'FAC/OGN/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // OSUN STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Ladoke Akintola University Teaching Hospital Osogbo', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Ogba-Ago Road, Osogbo', city: 'Osogbo', state: 'Osun', phone: '+234-35-240-255', email: 'info@lauth.org', bedCapacity: 320, staffCount: 1300, registrationNumber: 'FAC/OSN/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Osun State General Hospital Asubiaro', type: 'HOSPITAL', level: 'SECONDARY', address: 'Asubiaro, Osogbo', city: 'Osogbo', state: 'Osun', phone: '+234-35-243-100', email: 'info@asubiarohospital.gov.ng', bedCapacity: 180, staffCount: 650, registrationNumber: 'FAC/OSN/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },
      { name: 'Obafemi Awolowo University Health Centre Ile-Ife', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'Obafemi Awolowo University Campus, Ile-Ife', city: 'Ile-Ife', state: 'Osun', phone: '+234-36-230-510', email: 'healthcentre@oauife.edu.ng', bedCapacity: 40, staffCount: 55, registrationNumber: 'FAC/OSN/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services"]', operatingHours: 'Mon-Fri 08:00-20:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // ONDO STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Owo', type: 'FMC', level: 'TERTIARY', address: 'Owo-Ikare Road, Owo', city: 'Owo', state: 'Ondo', phone: '+234-34-240-255', email: 'info@fmcowo.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/OND/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // EKITI STATE (South-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Ido-Ekiti', type: 'FMC', level: 'TERTIARY', address: 'Afabiti Road, Ido-Ekiti', city: 'Ido-Ekiti', state: 'Ekiti', phone: '+234-35-240-100', email: 'info@fmcidoekiti.org', bedCapacity: 280, staffCount: 1100, registrationNumber: 'FAC/EKT/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Ekiti State University Teaching Hospital Ado-Ekiti', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Adebayo Area, Ado-Ekiti', city: 'Ado-Ekiti', state: 'Ekiti', phone: '+234-35-220-100', email: 'info@eksuth.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/EKT/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // RIVERS STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Port Harcourt Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Alakahia, East-West Road', city: 'Port Harcourt', state: 'Rivers', phone: '+234-84-234-255', email: 'info@upth.gov.ng', bedCapacity: 600, staffCount: 2800, registrationNumber: 'FAC/RVS/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Nephrology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Rivers State University Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: '1 Boma Street, GRA Phase 2, Port Harcourt', city: 'Port Harcourt', state: 'Rivers', phone: '+234-84-230-456', email: 'info@rsuth.gov.ng', bedCapacity: 400, staffCount: 1800, registrationNumber: 'FAC/RVS/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Braithwaite Memorial Specialist Hospital', type: 'SPECIALIST_CENTER', level: 'SECONDARY', address: 'Old GRA, Port Harcourt', city: 'Port Harcourt', state: 'Rivers', phone: '+234-84-233-100', email: 'info@bmsh.gov.ng', bedCapacity: 250, staffCount: 850, registrationNumber: 'FAC/RVS/SC/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Ophthalmology","ENT","Maternity","Emergency"]', operatingHours: '24/7' },
      { name: 'Meridian Hospital Port Harcourt', type: 'CLINIC', level: 'SECONDARY', address: '23 Wogu Street, D-Line, Port Harcourt', city: 'Port Harcourt', state: 'Rivers', phone: '+234-84-345-678', email: 'info@meridianhospital.com', bedCapacity: 60, staffCount: 180, registrationNumber: 'FAC/RVS/PVT/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // DELTA STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Asaba', type: 'FMC', level: 'TERTIARY', address: 'Nnebisi Road, Asaba', city: 'Asaba', state: 'Delta', phone: '+234-56-280-100', email: 'info@fmcasaba.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/DEL/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care","Dialysis"]', operatingHours: '24/7' },
      { name: 'Delta State University Teaching Hospital Oghara', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Oghara, Ethiope West LGA', city: 'Oghara', state: 'Delta', phone: '+234-56-280-200', email: 'info@desuth.edu.ng', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/DEL/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine","Orthopedics"]', operatingHours: '24/7' },
      { name: 'Central Hospital Warri', type: 'HOSPITAL', level: 'SECONDARY', address: 'Upper Erejuwa Road, Warri', city: 'Warri', state: 'Delta', phone: '+234-53-240-100', email: 'info@centralhospitalwarri.gov.ng', bedCapacity: 180, staffCount: 600, registrationNumber: 'FAC/DEL/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // EDO STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Benin Teaching Hospital (UBTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Ugbowo, Benin City', city: 'Benin City', state: 'Edo', phone: '+234-52-251-444', email: 'info@ubth.org', bedCapacity: 700, staffCount: 3200, registrationNumber: 'FAC/EDO/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Dialysis"]', operatingHours: '24/7' },
      { name: 'Irrua Specialist Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Irrua, Esan Central LGA', city: 'Irrua', state: 'Edo', phone: '+234-55-280-100', email: 'info@isth.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/EDO/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Lassa Fever Treatment","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Central Hospital Benin', type: 'HOSPITAL', level: 'SECONDARY', address: 'Sapele Road, Benin City', city: 'Benin City', state: 'Edo', phone: '+234-52-251-888', email: 'info@centralhospitalbenin.gov.ng', bedCapacity: 200, staffCount: 700, registrationNumber: 'FAC/EDO/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },
      { name: 'University of Benin Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Benin, Ugbowo Campus', city: 'Benin City', state: 'Edo', phone: '+234-52-251-223', email: 'healthcentre@uniben.edu', bedCapacity: 30, staffCount: 45, registrationNumber: 'FAC/EDO/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services","Pharmacy"]', operatingHours: 'Mon-Fri 08:00-20:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // AKWA IBOM STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Uyo Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Itam Road, Uyo', city: 'Uyo', state: 'Akwa Ibom', phone: '+234-85-202-255', email: 'info@uuth.gov.ng', bedCapacity: 400, staffCount: 1800, registrationNumber: 'FAC/AKB/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // CROSS RIVER STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Calabar Teaching Hospital', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Oyo Road, Calabar', city: 'Calabar', state: 'Cross River', phone: '+234-87-232-255', email: 'info@ucth.gov.ng', bedCapacity: 500, staffCount: 2200, registrationNumber: 'FAC/CRS/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Calabar Primary Health Center', type: 'PHC', level: 'PRIMARY', address: '12 Mayne Avenue, Calabar', city: 'Calabar', state: 'Cross River', phone: '+234-87-232-567', email: 'phc.calabar@crs.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/CRS/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // BAYELSA STATE (South-South)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Yenagoa', type: 'FMC', level: 'TERTIARY', address: 'Melford Okilo Road, Yenagoa', city: 'Yenagoa', state: 'Bayelsa', phone: '+234-89-290-100', email: 'info@fmcyenagoa.org', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/BYS/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ENUGU STATE (South-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Nigeria Teaching Hospital (UNTH) Enugu', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Ituku-Ozalla, Enugu', city: 'Enugu', state: 'Enugu', phone: '+234-42-254-066', email: 'info@unth.org', bedCapacity: 650, staffCount: 3000, registrationNumber: 'FAC/ENG/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Enugu State University Teaching Hospital Parklane', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Parklane, GRA, Enugu', city: 'Enugu', state: 'Enugu', phone: '+234-42-252-100', email: 'info@esuth.edu.ng', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/ENG/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'National Orthopaedic Hospital Enugu', type: 'SPECIALIST_CENTER', level: 'TERTIARY', address: 'Enugu-Abakaliki Expressway', city: 'Enugu', state: 'Enugu', phone: '+234-42-255-066', email: 'info@nohenugu.gov.ng', bedCapacity: 200, staffCount: 800, registrationNumber: 'FAC/ENG/SC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Orthopedic Surgery","Physiotherapy","Prosthetics","Trauma Care","Spinal Surgery"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ANAMBRA STATE (South-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Nnamdi Azikiwe University Teaching Hospital Nnewi', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Okofia, Nnewi', city: 'Nnewi', state: 'Anambra', phone: '+234-46-460-255', email: 'info@nauth.nnewi.edu.ng', bedCapacity: 400, staffCount: 1600, registrationNumber: 'FAC/ANM/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Dialysis"]', operatingHours: '24/7' },
      { name: 'Chukwuemeka Odumegwu Ojukwu University Teaching Hospital Awka', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Amaku, Awka', city: 'Awka', state: 'Anambra', phone: '+234-46-460-100', email: 'info@coouth.edu.ng', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/ANM/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Iyi-Enu Mission Hospital Ogidi', type: 'HOSPITAL', level: 'SECONDARY', address: 'Ogidi, Idemili North LGA', city: 'Ogidi', state: 'Anambra', phone: '+234-46-460-300', email: 'info@iyienuhospital.org', bedCapacity: 100, staffCount: 250, registrationNumber: 'FAC/ANM/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Eye Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // IMO STATE (South-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Owerri', type: 'FMC', level: 'TERTIARY', address: 'Douglas Road, Owerri', city: 'Owerri', state: 'Imo', phone: '+234-83-230-255', email: 'info@fmcowerri.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/IMO/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care","Dialysis"]', operatingHours: '24/7' },
      { name: 'Imo State University Teaching Hospital Orlu', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Orlu-Okigwe Road, Orlu', city: 'Orlu', state: 'Imo', phone: '+234-83-230-456', email: 'info@imsuth.edu.ng', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/IMO/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Holy Rosary Hospital Emekuku', type: 'HOSPITAL', level: 'SECONDARY', address: 'Emekuku, Owerri North LGA', city: 'Emekuku', state: 'Imo', phone: '+234-83-232-100', email: 'info@holyrosaryemekuku.org', bedCapacity: 120, staffCount: 300, registrationNumber: 'FAC/IMO/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Midwifery Training"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ABIA STATE (South-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Umuahia', type: 'FMC', level: 'TERTIARY', address: 'Ibiam Road, Umuahia', city: 'Umuahia', state: 'Abia', phone: '+234-88-220-255', email: 'info@fmcumuahia.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/ABI/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Abia State University Teaching Hospital Aba', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Aba-Owerri Road, Aba', city: 'Aba', state: 'Abia', phone: '+234-82-220-100', email: 'info@absuth.edu.ng', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/ABI/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // EBONYI STATE (South-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Teaching Hospital Abakaliki (FETHA)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Abakaliki-Enugu Expressway', city: 'Abakaliki', state: 'Ebonyi', phone: '+234-43-280-255', email: 'info@fetha.gov.ng', bedCapacity: 400, staffCount: 1600, registrationNumber: 'FAC/EBS/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Nephrology"]', operatingHours: '24/7' },
      { name: 'Ebonyi State Primary Health Center Abakaliki', type: 'PHC', level: 'PRIMARY', address: 'Ogoja Road, Abakaliki', city: 'Abakaliki', state: 'Ebonyi', phone: '+234-43-280-567', email: 'phc.abakaliki@ebonyistate.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/EBS/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // KANO STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Aminu Kano Teaching Hospital (AKTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Zaria Road, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-255', email: 'info@akth.gov.ng', bedCapacity: 600, staffCount: 2800, registrationNumber: 'FAC/KAN/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Dialysis"]', operatingHours: '24/7' },
      { name: 'Murtala Muhammad Specialist Hospital Kano', type: 'HOSPITAL', level: 'SECONDARY', address: 'Kofar Nassarawa, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-100', email: 'info@mmshkano.gov.ng', bedCapacity: 350, staffCount: 1200, registrationNumber: 'FAC/KAN/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency","Ophthalmology"]', operatingHours: '24/7' },
      { name: 'Kano Primary Health Center Nassarawa', type: 'PHC', level: 'PRIMARY', address: 'Nassarawa GRA, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-300', email: 'phc.nassarawa@kanostate.gov.ng', bedCapacity: 25, staffCount: 40, registrationNumber: 'FAC/KAN/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care","Health Education"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: '68 Nigerian Army Reference Hospital Kano', type: 'HOSPITAL', level: 'TERTIARY', address: 'Kawo, Kaduna Road, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-400', email: 'info@68narh.mil.ng', bedCapacity: 200, staffCount: 800, registrationNumber: 'FAC/KAN/MIL/001', accreditingBody: 'Nigerian Army Medical Corps', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Orthopedics","Trauma Care","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // KADUNA STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Ahmadu Bello University Teaching Hospital (ABUTH) Zaria', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Shika-Zaria, Kaduna State', city: 'Zaria', state: 'Kaduna', phone: '+234-69-550-255', email: 'info@abuth.org', bedCapacity: 550, staffCount: 2500, registrationNumber: 'FAC/KAD/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Nephrology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Barau Dikko Teaching Hospital Kaduna', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Off Independence Way, Kaduna', city: 'Kaduna', state: 'Kaduna', phone: '+234-62-310-255', email: 'info@bdth.edu.ng', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/KAD/TH/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: '44 Nigerian Army Reference Hospital Kaduna', type: 'HOSPITAL', level: 'TERTIARY', address: 'Kawo, Kaduna', city: 'Kaduna', state: 'Kaduna', phone: '+234-62-310-400', email: 'info@44narh.mil.ng', bedCapacity: 250, staffCount: 900, registrationNumber: 'FAC/KAD/MIL/001', accreditingBody: 'Nigerian Army Medical Corps', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Orthopedics","Trauma Care","Emergency Medicine","Physiotherapy"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // SOKOTO STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Usmanu Danfodiyo University Teaching Hospital Sokoto', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Sokoto-Gusau Road, Sokoto', city: 'Sokoto', state: 'Sokoto', phone: '+234-60-230-255', email: 'info@uduth.org', bedCapacity: 500, staffCount: 2200, registrationNumber: 'FAC/SOK/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Nephrology"]', operatingHours: '24/7' },
      { name: 'Sokoto Primary Health Center Wamakko', type: 'PHC', level: 'PRIMARY', address: 'Wamakko, Sokoto', city: 'Wamakko', state: 'Sokoto', phone: '+234-60-230-567', email: 'phc.wamakko@sokotostate.gov.ng', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/SOK/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // KATSINA STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Katsina', type: 'FMC', level: 'TERTIARY', address: 'Kofar Kaura, Katsina', city: 'Katsina', state: 'Katsina', phone: '+234-65-320-255', email: 'info@fmckatsina.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/KTS/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // KEBBI STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Birnin Kebbi', type: 'FMC', level: 'TERTIARY', address: 'Ribah Road, Birnin Kebbi', city: 'Birnin Kebbi', state: 'Kebbi', phone: '+234-52-260-255', email: 'info@fmckebbi.org', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/KEB/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ZAMFARA STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Gusau', type: 'FMC', level: 'TERTIARY', address: 'Sokoto Road, Gusau', city: 'Gusau', state: 'Zamfara', phone: '+234-63-220-255', email: 'info@fmcgusau.org', bedCapacity: 200, staffCount: 800, registrationNumber: 'FAC/ZMF/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Yariman Bakura Specialist Hospital Gusau', type: 'SPECIALIST_CENTER', level: 'SECONDARY', address: 'Gusau-Sokoto Road, Gusau', city: 'Gusau', state: 'Zamfara', phone: '+234-63-220-456', email: 'info@ybsh.gov.ng', bedCapacity: 150, staffCount: 550, registrationNumber: 'FAC/ZMF/SC/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // JIGAWA STATE (North-West)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Rasheed Shekoni Teaching Hospital Dutse', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Kiyawa Road, Dutse', city: 'Dutse', state: 'Jigawa', phone: '+234-66-320-255', email: 'info@rsth.gov.ng', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/JIG/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // PLATEAU STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Jos University Teaching Hospital (JUTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Jos-Zaria Road, Jos', city: 'Jos', state: 'Plateau', phone: '+234-73-461-255', email: 'info@juth.gov.ng', bedCapacity: 500, staffCount: 2200, registrationNumber: 'FAC/PLT/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Oncology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Plateau State Specialist Hospital Jos', type: 'SPECIALIST_CENTER', level: 'SECONDARY', address: 'Hwak Road, Jos', city: 'Jos', state: 'Plateau', phone: '+234-73-461-456', email: 'info@psshjos.gov.ng', bedCapacity: 200, staffCount: 700, registrationNumber: 'FAC/PLT/SC/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Emergency","ENT"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // BENUE STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Makurdi', type: 'FMC', level: 'TERTIARY', address: 'Otukpo Road, Makurdi', city: 'Makurdi', state: 'Benue', phone: '+234-44-532-255', email: 'info@fmcmakurdi.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/BEN/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Benue State University Teaching Hospital Makurdi', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Apir, Makurdi', city: 'Makurdi', state: 'Benue', phone: '+234-44-532-456', email: 'info@bsuth.edu.ng', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/BEN/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // NASARAWA STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Keffi', type: 'FMC', level: 'TERTIARY', address: 'Keffi-Abuja Road, Keffi', city: 'Keffi', state: 'Nasarawa', phone: '+234-47-760-255', email: 'info@fmckeffi.org', bedCapacity: 280, staffCount: 1100, registrationNumber: 'FAC/NAS/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // NIGER STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Bida', type: 'FMC', level: 'TERTIARY', address: 'Bida-Minna Road, Bida', city: 'Bida', state: 'Niger', phone: '+234-66-220-255', email: 'info@fmcbida.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/NIG/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care","Ophthalmology"]', operatingHours: '24/7' },
      { name: 'Ibrahim Badamasi Babangida Specialist Hospital Minna', type: 'HOSPITAL', level: 'SECONDARY', address: 'Top Medical Road, Minna', city: 'Minna', state: 'Niger', phone: '+234-66-220-100', email: 'info@ibbshminna.gov.ng', bedCapacity: 150, staffCount: 550, registrationNumber: 'FAC/NIG/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // KWARA STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Ilorin Teaching Hospital (UITH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Oke-Ose, Ilorin', city: 'Ilorin', state: 'Kwara', phone: '+234-31-220-255', email: 'info@uith.org', bedCapacity: 500, staffCount: 2200, registrationNumber: 'FAC/KWA/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Oncology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Dialysis"]', operatingHours: '24/7' },
      { name: 'Kwara State General Hospital Ilorin', type: 'HOSPITAL', level: 'SECONDARY', address: 'Suru-Lere, Ilorin', city: 'Ilorin', state: 'Kwara', phone: '+234-31-220-456', email: 'info@kwsghilorin.gov.ng', bedCapacity: 180, staffCount: 650, registrationNumber: 'FAC/KWA/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // KOGI STATE (North-Central)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Lokoja', type: 'FMC', level: 'TERTIARY', address: 'Ganaja Road, Lokoja', city: 'Lokoja', state: 'Kogi', phone: '+234-58-220-255', email: 'info@fmclokoja.org', bedCapacity: 280, staffCount: 1100, registrationNumber: 'FAC/KOG/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // TARABA STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Jalingo', type: 'FMC', level: 'TERTIARY', address: 'Jalingo-Wukari Road, Jalingo', city: 'Jalingo', state: 'Taraba', phone: '+234-79-220-255', email: 'info@fmcjalingo.org', bedCapacity: 250, staffCount: 1000, registrationNumber: 'FAC/TAR/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADAMAWA STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Yola', type: 'FMC', level: 'TERTIARY', address: 'Jimeta-Yola Road, Yola', city: 'Yola', state: 'Adamawa', phone: '+234-75-220-255', email: 'info@fmcyola.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/ADM/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },
      { name: 'Adamawa State Primary Health Center Yola', type: 'PHC', level: 'PRIMARY', address: 'Luggere Ward, Yola', city: 'Yola', state: 'Adamawa', phone: '+234-75-220-567', email: 'phc.yola@adamawastate.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/ADM/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // BAUCHI STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Abubakar Tafawa Balewa University Teaching Hospital Bauchi', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Bauchi-Jos Road, Bauchi', city: 'Bauchi', state: 'Bauchi', phone: '+234-77-540-255', email: 'info@atbuth.org', bedCapacity: 400, staffCount: 1600, registrationNumber: 'FAC/BAU/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Bauchi State Primary Health Center Bauchi', type: 'PHC', level: 'PRIMARY', address: 'Kofar Wambai, Bauchi', city: 'Bauchi', state: 'Bauchi', phone: '+234-77-540-567', email: 'phc.bauchi@bauchistate.gov.ng', bedCapacity: 20, staffCount: 35, registrationNumber: 'FAC/BAU/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // BORNO STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Maiduguri Teaching Hospital (UMTH)', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Baga Road, Maiduguri', city: 'Maiduguri', state: 'Borno', phone: '+234-76-230-255', email: 'info@umth.org', bedCapacity: 600, staffCount: 2800, registrationNumber: 'FAC/BOR/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Neurosurgery","Oncology","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine","Trauma Care"]', operatingHours: '24/7' },
      { name: 'State Specialist Hospital Maiduguri', type: 'HOSPITAL', level: 'SECONDARY', address: 'Bolori, Maiduguri', city: 'Maiduguri', state: 'Borno', phone: '+234-76-230-456', email: 'info@sshmaiduguri.gov.ng', bedCapacity: 200, staffCount: 700, registrationNumber: 'FAC/BOR/SH/001', accreditingBody: 'Health Facilities Accreditation Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Emergency"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // GOMBE STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Teaching Hospital Gombe', type: 'TEACHING_HOSPITAL', level: 'TERTIARY', address: 'Dukku Road, Gombe', city: 'Gombe', state: 'Gombe', phone: '+234-72-220-255', email: 'info@fthgombe.org', bedCapacity: 350, staffCount: 1400, registrationNumber: 'FAC/GMB/TH/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Pediatrics","Obstetrics","Orthopedics","Emergency Medicine"]', operatingHours: '24/7' },
      { name: 'Gombe Primary Health Center Gombe', type: 'PHC', level: 'PRIMARY', address: 'Pantami, Gombe', city: 'Gombe', state: 'Gombe', phone: '+234-72-220-567', email: 'phc.gombe@gombestate.gov.ng', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/GMB/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: false, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // YOBE STATE (North-East)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Nguru', type: 'FMC', level: 'TERTIARY', address: 'Nguru-Gashua Road, Nguru', city: 'Nguru', state: 'Yobe', phone: '+234-74-220-255', email: 'info@fmcnguru.org', bedCapacity: 200, staffCount: 800, registrationNumber: 'FAC/YOB/FMC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // FEDERAL MEDICAL CENTRES (Remaining)
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Medical Centre Umuahia', type: 'FMC', level: 'TERTIARY', address: 'Ibiam Road, Umuahia', city: 'Umuahia', state: 'Abia', phone: '+234-88-220-255', email: 'info@fmcumuahia.org', bedCapacity: 300, staffCount: 1200, registrationNumber: 'FAC/ABI/FMC/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Pediatrics","Obstetrics","Emergency Care"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL UNIVERSITY HEALTH CENTRES
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'University of Nigeria Enugu Campus Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Nigeria, Nsukka Campus', city: 'Nsukka', state: 'Enugu', phone: '+234-42-254-067', email: 'healthcentre@unn.edu.ng', bedCapacity: 35, staffCount: 50, registrationNumber: 'FAC/ENG/UHC/002', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services"]', operatingHours: 'Mon-Fri 08:00-20:00' },
      { name: 'Ahmadu Bello University Health Centre Zaria', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'ABU Main Campus, Samaru, Zaria', city: 'Zaria', state: 'Kaduna', phone: '+234-69-550-067', email: 'healthcentre@abu.edu.ng', bedCapacity: 40, staffCount: 55, registrationNumber: 'FAC/KAD/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services"]', operatingHours: 'Mon-Fri 08:00-20:00' },
      { name: 'University of Maiduguri Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Maiduguri Campus', city: 'Maiduguri', state: 'Borno', phone: '+234-76-230-067', email: 'healthcentre@unimaid.edu.ng', bedCapacity: 30, staffCount: 45, registrationNumber: 'FAC/BOR/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services"]', operatingHours: 'Mon-Fri 08:00-20:00' },
      { name: 'University of Port Harcourt Health Centre', type: 'HEALTH_CENTER', level: 'PRIMARY', address: 'University of Port Harcourt, Choba', city: 'Port Harcourt', state: 'Rivers', phone: '+234-84-234-067', email: 'healthcentre@uniport.edu.ng', bedCapacity: 30, staffCount: 45, registrationNumber: 'FAC/RVS/UHC/001', accreditingBody: 'University Health Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["General Medicine","First Aid","Counseling","Laboratory Services"]', operatingHours: 'Mon-Fri 08:00-20:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL PRIVATE HOSPITALS
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Eko Hospital PLC', type: 'HOSPITAL', level: 'TERTIARY', address: '31 Mobolaji Bank Anthony Way, Ikeja', city: 'Ikeja', state: 'Lagos', phone: '+234-1-794-6666', email: 'info@ekohospital.com', bedCapacity: 130, staffCount: 600, registrationNumber: 'FAC/LAG/PVT/006', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Cardiology","Orthopedics","Obstetrics","Pediatrics"]', operatingHours: '24/7' },
      { name: 'Turai Yar\'Adua Hospital Katsina', type: 'HOSPITAL', level: 'SECONDARY', address: 'Kaita Road, Katsina', city: 'Katsina', state: 'Katsina', phone: '+234-65-320-100', email: 'info@tyhkatsina.com', bedCapacity: 80, staffCount: 250, registrationNumber: 'FAC/KTS/PVT/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics"]', operatingHours: '24/7' },
      { name: 'Aminu Dabo Hospital Kano', type: 'HOSPITAL', level: 'SECONDARY', address: 'Court Road, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-500', email: 'info@aminudabohospital.com', bedCapacity: 100, staffCount: 300, registrationNumber: 'FAC/KAN/PVT/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Dialysis"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL FBO/MISSION HOSPITALS
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'ECWA Hospital Egbe', type: 'HOSPITAL', level: 'SECONDARY', address: 'Egbe, Kogi State', city: 'Egbe', state: 'Kogi', phone: '+234-58-220-567', email: 'info@ecwahospitalegbe.org', bedCapacity: 120, staffCount: 300, registrationNumber: 'FAC/KOG/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Eye Care","HIV/AIDS Care"]', operatingHours: '24/7' },
      { name: 'St. Mary\'s Catholic Hospital Enugu', type: 'HOSPITAL', level: 'SECONDARY', address: '49 Park Avenue, GRA, Enugu', city: 'Enugu', state: 'Enugu', phone: '+234-42-252-567', email: 'info@stmaryshospitalenugu.org', bedCapacity: 80, staffCount: 200, registrationNumber: 'FAC/ENG/FBO/002', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics"]', operatingHours: '24/7' },
      { name: 'Catholic Hospital Jos', type: 'HOSPITAL', level: 'SECONDARY', address: '5 Bauchi Road, Jos', city: 'Jos', state: 'Plateau', phone: '+234-73-461-567', email: 'info@catholichospitaljos.org', bedCapacity: 90, staffCount: 220, registrationNumber: 'FAC/PLT/FBO/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Medicine","Surgery","Maternity","Pediatrics","Rehabilitation"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL MATERNITY HOMES
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Blessed Maternity Home Kano', type: 'MATERNITY_HOME', level: 'PRIMARY', address: 'Kofar Wambai, Kano', city: 'Kano', state: 'Kano', phone: '+234-64-640-600', email: 'info@blessedmaternitykano.com', bedCapacity: 25, staffCount: 40, registrationNumber: 'FAC/KAN/MH/001', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Antenatal Care","Delivery","Postnatal Care","Family Planning"]', operatingHours: '24/7' },
      { name: 'Comfort Maternity Home Enugu', type: 'MATERNITY_HOME', level: 'PRIMARY', address: 'Ogui Road, Enugu', city: 'Enugu', state: 'Enugu', phone: '+234-42-252-600', email: 'info@comfortmaternityenugu.com', bedCapacity: 20, staffCount: 35, registrationNumber: 'FAC/ENG/MH/001', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Antenatal Care","Delivery","Postnatal Care","Family Planning"]', operatingHours: '24/7' },
      { name: 'Faith Maternity Home Ibadan', type: 'MATERNITY_HOME', level: 'PRIMARY', address: 'Mokola, Ibadan', city: 'Ibadan', state: 'Oyo', phone: '+234-2-241-600', email: 'info@faithmaternityibadan.com', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/OYO/MH/002', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Antenatal Care","Delivery","Postnatal Care","Family Planning"]', operatingHours: '24/7' },
      { name: 'Divine Favour Maternity Home Abuja', type: 'MATERNITY_HOME', level: 'PRIMARY', address: 'Nyanya, Abuja', city: 'Abuja', state: 'FCT', phone: '+234-9-290-600', email: 'info@divinefavourmaternity.com', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/FCT/MH/001', accreditingBody: 'Nursing and Midwifery Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Antenatal Care","Delivery","Postnatal Care","Family Planning"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL MILITARY HOSPITALS
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Nigerian Navy Reference Hospital Calabar', type: 'HOSPITAL', level: 'TERTIARY', address: 'Ikang Road, Calabar', city: 'Calabar', state: 'Cross River', phone: '+234-87-232-400', email: 'info@nnrhcalabar.mil.ng', bedCapacity: 150, staffCount: 600, registrationNumber: 'FAC/CRS/MIL/001', accreditingBody: 'Nigerian Navy Medical Services', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["General Surgery","Orthopedics","Trauma Care","Pediatrics","Emergency Medicine"]', operatingHours: '24/7' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL DIAGNOSTIC CENTERS
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'PathCare Diagnostics Lagos', type: 'DIAGNOSTIC_CENTER', level: 'SECONDARY', address: '2A Bankole Street, Ikeja', city: 'Ikeja', state: 'Lagos', phone: '+234-1-460-2900', email: 'info@pathcare.com.ng', bedCapacity: 5, staffCount: 100, registrationNumber: 'FAC/LAG/DC/002', accreditingBody: 'Medical Laboratory Science Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Pathology","Microbiology","Chemistry","Hematology","Genomics"]', operatingHours: 'Mon-Sat 07:00-18:00' },
      { name: 'Blossom Medical Diagnostics Abuja', type: 'DIAGNOSTIC_CENTER', level: 'SECONDARY', address: '52 Ademola Adetokunbo Crescent, Wuse 2', city: 'Abuja', state: 'FCT', phone: '+234-9-460-2200', email: 'info@blossomdiagnostics.com', bedCapacity: 5, staffCount: 80, registrationNumber: 'FAC/FCT/DC/002', accreditingBody: 'Medical Laboratory Science Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Radiology","CT Scan","MRI","Ultrasound","Laboratory Services"]', operatingHours: 'Mon-Sat 07:00-20:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // ADDITIONAL PHCs ACROSS STATES
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'PHC Dutse Alhaji Abuja', type: 'PHC', level: 'PRIMARY', address: 'Dutse Alhaji, Bwari Area Council', city: 'Abuja', state: 'FCT', phone: '+234-9-290-2345', email: 'phc.dutse@fct.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/FCT/PHC/002', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: false, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Agege Lagos', type: 'PHC', level: 'PRIMARY', address: 'Agege-Ifako Road, Agege', city: 'Lagos', state: 'Lagos', phone: '+234-1-876-3456', email: 'phc.agege@lagosstate.gov.ng', bedCapacity: 25, staffCount: 40, registrationNumber: 'FAC/LAG/PHC/002', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care","HIV Counseling"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Akobo Ibadan', type: 'PHC', level: 'PRIMARY', address: 'Akobo-Ojurin Road, Ibadan', city: 'Ibadan', state: 'Oyo', phone: '+234-2-234-8901', email: 'phc.akobo@oyostate.gov.ng', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/OYO/PHC/002', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: false, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Zaria Kaduna', type: 'PHC', level: 'PRIMARY', address: 'Samaru, Zaria', city: 'Zaria', state: 'Kaduna', phone: '+234-69-550-890', email: 'phc.zaria@kadunastate.gov.ng', bedCapacity: 20, staffCount: 35, registrationNumber: 'FAC/KAD/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Aba Abia', type: 'PHC', level: 'PRIMARY', address: 'Aba-Owerri Road, Aba', city: 'Aba', state: 'Abia', phone: '+234-82-220-890', email: 'phc.aba@abiastate.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/ABI/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: false, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Makurdi Benue', type: 'PHC', level: 'PRIMARY', address: 'Wadata, Makurdi', city: 'Makurdi', state: 'Benue', phone: '+234-44-532-890', email: 'phc.makurdi@benuestate.gov.ng', bedCapacity: 15, staffCount: 25, registrationNumber: 'FAC/BEN/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: false, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },
      { name: 'PHC Ilorin Kwara', type: 'PHC', level: 'PRIMARY', address: 'Adewole, Ilorin', city: 'Ilorin', state: 'Kwara', phone: '+234-31-220-890', email: 'phc.ilorin@kwarastate.gov.ng', bedCapacity: 20, staffCount: 30, registrationNumber: 'FAC/KWA/PHC/001', accreditingBody: 'National Primary Health Care Development Agency', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: false, servicesOffered: '["Immunization","Antenatal Care","Family Planning","Basic Curative Care"]', operatingHours: 'Mon-Fri 08:00-17:00' },

      // ═══════════════════════════════════════════════════════════════════════
      // REHABILITATION CENTERS
      // ═══════════════════════════════════════════════════════════════════════
      { name: 'Federal Neuro-Psychiatric Hospital Calabar', type: 'REHABILITATION_CENTER', level: 'TERTIARY', address: 'Calabar-Ikom Highway, Calabar', city: 'Calabar', state: 'Cross River', phone: '+234-87-232-890', email: 'info@fnphcalabar.gov.ng', bedCapacity: 200, staffCount: 600, registrationNumber: 'FAC/CRS/RC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Psychiatry","Psychology","Rehabilitation","Substance Abuse Treatment","Counseling"]', operatingHours: '24/7' },
      { name: 'Federal Neuro-Psychiatric Hospital Yaba', type: 'REHABILITATION_CENTER', level: 'TERTIARY', address: '8 Harvey Road, Yaba, Lagos', city: 'Lagos', state: 'Lagos', phone: '+234-1-681-5651', email: 'info@fnphyaba.gov.ng', bedCapacity: 250, staffCount: 700, registrationNumber: 'FAC/LAG/RC/001', accreditingBody: 'Medical and Dental Council of Nigeria', accreditationStatus: 'ACCREDITED', isVerified: true, isEmergencyCapable: true, servicesOffered: '["Psychiatry","Psychology","Rehabilitation","Substance Abuse Treatment","Occupational Therapy"]', operatingHours: '24/7' },
    ];

    let createdCount = 0;
    let skippedCount = 0;
    for (const f of nigerianFacilities) {
      const exists = await facilityExists(f.name, f.registrationNumber);
      if (exists) {
        skippedCount++;
        continue;
      }
      await prisma.facility.create({
        data: {
          name: f.name,
          type: f.type,
          level: f.level,
          address: f.address,
          city: f.city,
          state: f.state,
          country: 'Nigeria',
          phone: f.phone,
          email: f.email,
          bedCapacity: f.bedCapacity,
          staffCount: f.staffCount,
          registrationNumber: f.registrationNumber,
          accreditingBody: f.accreditingBody,
          accreditationStatus: f.accreditationStatus,
          isVerified: f.isVerified,
          isEmergencyCapable: f.isEmergencyCapable,
          servicesOffered: f.servicesOffered,
          operatingHours: f.operatingHours,
        }
      });
      createdCount++;
    }
    const totalFacilities = await prisma.facility.count();
    console.log(`  ✅ Created ${createdCount} new facilities (skipped ${skippedCount} existing). Total facilities now: ${totalFacilities}\n`);
  } else {
    console.log(`  ⏭  Facilities already has ${currentFacilityCount} records, skipping.\n`);
  }

  // ─── FINAL SUMMARY ────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('🌱 SEEDING COMPLETE — Final Database State');
  console.log('='.repeat(60));

  const models = [
    ['Users', prisma.user],
    ['NurseProfiles', prisma.nurseProfile],
    ['PatientProfiles', prisma.patientProfile],
    ['Facilities', prisma.facility],
    ['Departments', prisma.department],
    ['MedicalRecords', prisma.medicalRecord],
    ['VitalSigns', prisma.vitalSign],
    ['NursingNotes', prisma.nursingNote],
    ['AIInteractions', prisma.aIInteraction],
    ['MedicationOrders', prisma.medicationOrder],
    ['LabOrders', prisma.labOrder],
    ['Referrals', prisma.referral],
    ['Consultations', prisma.consultation],
    ['KnowledgeArticles', prisma.knowledgeArticle],
    ['ArticleComments', prisma.articleComment],
    ['Credentials', prisma.credential],
    ['Competencies', prisma.competency],
    ['PortfolioEntries', prisma.portfolioEntry],
    ['CPDRecords', prisma.cPDRecord],
    ['Courses', prisma.course],
    ['CourseModules', prisma.courseModule],
    ['Enrollments', prisma.enrollment],
    ['Simulations', prisma.simulation],
    ['SimulationAttempts', prisma.simulationAttempt],
    ['Appointments', prisma.appointment],
    ['VisitRecords', prisma.visitRecord],
    ['Notifications', prisma.notification],
    ['AuditLogs', prisma.auditLog],
    ['Sessions', prisma.session],
    ['FacilityAnalytics', prisma.facilityAnalytics],
    ['DiseaseSurveillance', prisma.diseaseSurveillance],
    ['StaffingPredictions', prisma.staffingPrediction],
    ['AdminProfiles', prisma.adminProfile],
  ] as const;

  let total = 0;
  for (const [name, model] of models) {
    const count = await (model as any).count();
    const status = count > 0 ? '✅' : '⚠️ ';
    console.log(`  ${status} ${name}: ${count}`);
    total += count;
  }
  console.log('─'.repeat(40));
  console.log(`  📊 Total records: ${total}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
