import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/middleware/compose';
import crypto from 'crypto';

const COURSES = [
  {
    title: 'Infection Prevention and Control (WHO)',
    slug: 'infection-prevention-who',
    description:
      'A comprehensive course based on the WHO guidelines on Infection Prevention and Control (IPC). This course covers the core components of IPC programmes, standard and transmission-based precautions, hand hygiene best practices (including the WHO "My 5 Moments for Hand Hygiene"), appropriate use of personal protective equipment (PPE), safe injection practices, environmental cleaning, waste management, and outbreak preparedness and response. Participants will learn evidence-based strategies to reduce healthcare-associated infections (HAIs) and protect both patients and healthcare workers. The course aligns with the WHO Core Components for IPC Programmes and the Global Action Plan on Antimicrobial Resistance.\n\nResources:\n- WHO IPC Guidelines: https://www.who.int/publications/i/item/9789241501507\n- WHO Hand Hygiene: https://www.who.int/teams/integrated-health-services/infection-prevention-control/hand-hygiene\n- WHO IPC Global Unit: https://www.who.int/teams/integrated-health-services/infection-prevention-control',
    category: 'GLOBAL_HEALTH',
    level: 'BEGINNER',
    durationMinutes: 480,
    cpdPoints: 8,
    tags: ['infection-control', 'WHO', 'hand-hygiene', 'PPE', 'outbreak-response', 'HAI', 'antimicrobial-resistance'],
  },
  {
    title: 'Patient Safety Fundamentals (WHO)',
    slug: 'patient-safety-who',
    description:
      'This course is based on the WHO Patient Safety Curriculum Guide and covers the fundamental principles of patient safety in healthcare settings. Topics include the global burden of harm in healthcare, medication safety (including the WHO Medication Without Harm initiative), surgical safety checklists, patient identification, communication and teamwork, reporting and learning from errors, and creating a culture of safety. Participants will understand how to apply the WHO Global Patient Safety Action Plan 2021-2030 and implement strategies to reduce avoidable harm in their practice settings.\n\nResources:\n- WHO Patient Safety: https://www.who.int/teams/integrated-health-services/patient-safety\n- WHO Medication Without Harm: https://www.who.int/initiatives/medication-without-harm\n- WHO Global Patient Safety Action Plan: https://www.who.int/publications/i/item/9789240032705',
    category: 'GLOBAL_HEALTH',
    level: 'BEGINNER',
    durationMinutes: 360,
    cpdPoints: 6,
    tags: ['patient-safety', 'WHO', 'medication-safety', 'surgical-safety', 'error-reporting', 'safety-culture'],
  },
  {
    title: 'Emergency and Trauma Care (WHO)',
    slug: 'emergency-trauma-who',
    description:
      'An intermediate-level course based on WHO emergency and trauma care guidelines. This course provides systematic training in the primary survey approach (ABCDE: Airway, Breathing, Circulation, Disability, Exposure), secondary assessment, and triage systems including the WHO Interagency Emergency Triage (IET). Participants will learn mass casualty management, emergency obstetric care, paediatric emergency care, burn management, and trauma team coordination. The course covers the WHO Emergency Care System Framework and the Basic Emergency Care (BEC) course content, preparing nurses to deliver safe, effective emergency care in both high-resource and resource-limited settings.\n\nResources:\n- WHO Emergency Care: https://www.who.int/health-topics/emergency-care\n- WHO BEC Course: https://www.who.int/publications/i/item/9789241500340\n- WHO Trauma Care Guidelines: https://www.who.int/publications/i/item/9789241547723',
    category: 'EMERGENCY',
    level: 'INTERMEDIATE',
    durationMinutes: 600,
    cpdPoints: 10,
    tags: ['emergency', 'trauma', 'ABCDE', 'triage', 'mass-casualty', 'WHO', 'critical-care', 'obstetric-emergency'],
  },
  {
    title: 'Mental Health Gap Action Programme (WHO mhGAP)',
    slug: 'mhgap-who',
    description:
      'This course is based on the WHO Mental Health Gap Action Programme (mhGAP) Intervention Guide, version 2.0. It trains nurses and other non-specialist health workers to identify and manage common mental, neurological, and substance use (MNS) disorders in non-specialized health settings. Topics include depression, psychosis, bipolar disorder, epilepsy, developmental disorders, behavioural disorders, dementia, alcohol use disorders, drug use disorders, self-harm/suicide, and other significant emotional or medically unexplained complaints. Participants will learn the mhGAP master chart approach, clinical assessment algorithms, and psychosocial and pharmacological interventions suitable for resource-constrained settings.\n\nResources:\n- WHO mhGAP: https://www.who.int/teams/mental-health-and-substance-use/treat-care/mental-health-gap-action-programme\n- mhGAP Intervention Guide v2.0: https://www.who.int/publications/i/item/9789241549796\n- WHO Mental Health: https://www.who.int/health-topics/mental-health',
    category: 'MENTAL_HEALTH',
    level: 'INTERMEDIATE',
    durationMinutes: 480,
    cpdPoints: 8,
    tags: ['mental-health', 'mhGAP', 'WHO', 'depression', 'psychosis', 'substance-use', 'epilepsy', 'suicide-prevention'],
  },
  {
    title: 'NMCN Professional Code of Conduct',
    slug: 'nmcn-code-conduct',
    description:
      'A foundational course on the Nursing and Midwifery Council of Nigeria (NMCN) Professional Code of Conduct and Ethics. This course covers the ethical principles governing nursing practice in Nigeria, including professional boundaries, patient rights and confidentiality, informed consent, documentation standards, duty of care, and professional accountability. Participants will learn about the NMCN disciplinary procedures, the roles and functions of the Nurses Tribunal, grounds for professional misconduct, and the consequences of ethical violations. The course also addresses cultural competence in the Nigerian healthcare context, handling of patient complaints, and maintaining professional integrity in challenging work environments.\n\nResources:\n- NMCN Official Website: https://www.nmcn.gov.ng\n- NMCN Code of Conduct: https://www.nmcn.gov.ng/professional-standards\n- NMCN Act: https://www.nmcn.gov.ng/about-us/enabling-act',
    category: 'PROFESSIONAL',
    level: 'BEGINNER',
    durationMinutes: 240,
    cpdPoints: 4,
    tags: ['NMCN', 'code-of-conduct', 'ethics', 'professional-boundaries', 'Nigeria', 'disciplinary', 'accountability'],
  },
  {
    title: 'NMCN Continuing Professional Development',
    slug: 'nmcn-cpd',
    description:
      'A course on the NMCN Continuing Professional Development (CPD) framework and requirements for nurses in Nigeria. This course covers the mandatory CPD units required for licence renewal, how to build and maintain a professional development portfolio, identifying learning needs, setting professional goals, and documenting CPD activities. Participants will learn about the NMCN revalidation process, acceptable CPD activities (formal learning, self-directed learning, and professional practice), and how to reflect on practice for meaningful professional growth. The course also provides guidance on accessing CPD opportunities, mentorship, and career advancement within the Nigerian nursing system.\n\nResources:\n- NMCN CPD Guidelines: https://www.nmcn.gov.ng\n- NMCN Licence Renewal: https://www.nmcn.gov.ng/licence-renewal\n- NMCN Official Portal: https://portal.nmcn.gov.ng',
    category: 'PROFESSIONAL',
    level: 'BEGINNER',
    durationMinutes: 180,
    cpdPoints: 3,
    tags: ['NMCN', 'CPD', 'professional-development', 'revalidation', 'portfolio', 'Nigeria', 'licence-renewal'],
  },
  {
    title: 'ICN Nursing Ethics and Human Rights',
    slug: 'icn-nursing-ethics',
    description:
      'An intermediate course based on the International Council of Nurses (ICN) Code of Ethics for Nurses. This course explores the four principal elements of the ICN Code: nurses and people, nurses and practice, nurses and the profession, and nurses and co-workers. Participants will examine human rights in nursing practice, including the right to health, patient autonomy, informed consent, and protection of vulnerable populations. The course covers ethical decision-making frameworks, advocacy for patients and the profession, navigating moral distress, and the nurse\u2019s role in promoting social justice and health equity. Case studies from diverse global contexts illustrate ethical challenges in contemporary nursing.\n\nResources:\n- ICN Code of Ethics: https://www.icn.ch/sites/default/files/inline-files/2012_ICN_Codeofethicsfornurses_%20eng.pdf\n- ICN Official Website: https://www.icn.ch\n- ICN Nursing Policy: https://www.icn.ch/policy-and-advocacy',
    category: 'PROFESSIONAL',
    level: 'INTERMEDIATE',
    durationMinutes: 360,
    cpdPoints: 6,
    tags: ['ICN', 'ethics', 'human-rights', 'code-of-ethics', 'advocacy', 'social-justice', 'patient-rights', 'moral-distress'],
  },
  {
    title: 'ICN Global Nursing Leadership',
    slug: 'icn-nursing-leadership',
    description:
      'An advanced leadership course developed around the ICN Global Nursing Leadership Framework. This course covers leadership theories relevant to nursing (transformational, servant, and authentic leadership), strategic thinking and planning, change management models (Kotter, Lewin, ADKAR), policy advocacy and health system strengthening, and interprofessional collaboration. Participants will develop skills in leading diverse teams, managing conflict, building resilience, mentoring the next generation of nurse leaders, and influencing health policy at national and international levels. The course draws on the ICN Global Nursing Leadership Institute curriculum and prepares nurses for senior leadership, management, and policy roles.\n\nResources:\n- ICN Leadership: https://www.icn.ch/leadership\n- ICN GNLI: https://www.icn.ch/leadership/global-nursing-leadership-institute\n- ICN Policy and Advocacy: https://www.icn.ch/policy-and-advocacy',
    category: 'LEADERSHIP',
    level: 'ADVANCED',
    durationMinutes: 480,
    cpdPoints: 8,
    tags: ['ICN', 'leadership', 'change-management', 'policy-advocacy', 'GNLI', 'transformational-leadership', 'health-policy', 'mentoring'],
  },
  {
    title: 'NCLEX-RN Comprehensive Preparation',
    slug: 'nclex-rn-prep',
    description:
      'A comprehensive NCLEX-RN preparation course designed for nurses planning to practise in the United States. This course covers all major content areas tested on the NCLEX-RN: Safe Effective Care Environment (Management of Care, Safety/Infection Control), Health Promotion and Maintenance, Psychosocial Integrity, and Physiological Integrity (Basic Care/Comfort, Pharmacological/Parenteral Therapies, Reduction of Risk Potential, Physiological Adaptation). Participants will learn test-taking strategies specific to Computerized Adaptive Testing (CAT), clinical judgment models (including the NCSBN Clinical Judgment Measurement Model), and practice with thousands of NCLEX-style questions. The course includes comprehensive content review, practice exams, and detailed rationales for all answer choices.\n\nResources:\n- NCSBN NCLEX: https://www.ncsbn.org/nclex.htm\n- NCLEX-RN Test Plan: https://www.ncsbn.org/nclex-rn-test-plan.htm\n- NCSBN Clinical Judgment: https://www.ncsbn.org/clinical-judgment.htm',
    category: 'NCLEX',
    level: 'INTERMEDIATE',
    durationMinutes: 1200,
    cpdPoints: 20,
    tags: ['NCLEX', 'NCLEX-RN', 'US-nursing', 'clinical-judgment', 'CAT', 'test-preparation', 'pharmacology', 'management-of-care'],
  },
  {
    title: 'NCLEX-PN Preparation Course',
    slug: 'nclex-pn-prep',
    description:
      'A focused NCLEX-PN preparation course for practical/vocational nurses seeking licensure in the United States. This course covers the NCLEX-PN test plan content areas: Safe Effective Care Environment (Coordinated Care, Safety/Infection Control), Health Promotion and Maintenance, Psychosocial Integrity, and Physiological Integrity (Basic Care/Comfort, Pharmacological Therapies, Reduction of Risk Potential, Physiological Adaptation). Participants will study PN-specific nursing fundamentals, pharmacology with an emphasis on medication administration and dosage calculations, and the coordinated care model unique to practical nursing. The course includes targeted practice questions, test strategies for adaptive testing, and simulated exam experiences.\n\nResources:\n- NCSBN NCLEX-PN: https://www.ncsbn.org/nclex-pn.htm\n- NCLEX-PN Test Plan: https://www.ncsbn.org/nclex-pn-test-plan.htm\n- NCSBN Learning Extension: https://learningext.com',
    category: 'NCLEX',
    level: 'INTERMEDIATE',
    durationMinutes: 900,
    cpdPoints: 15,
    tags: ['NCLEX', 'NCLEX-PN', 'practical-nursing', 'pharmacology', 'dosage-calculation', 'coordinated-care', 'test-preparation'],
  },
  {
    title: 'Basic Life Support (BLS) Certification Prep',
    slug: 'bls-certification',
    description:
      'A beginner-friendly course preparing nurses for Basic Life Support (BLS) certification. This course covers the essential skills of BLS for healthcare providers, including high-quality cardiopulmonary resuscitation (CPR) for adults, children, and infants, automated external defibrillator (AED) use, relief of choking (foreign-body airway obstruction) for all age groups, and the BLS algorithm for single-rescuer and multi-rescuer scenarios. Participants will learn the Chain of Survival, recognition of cardiac arrest, team dynamics during resuscitation, and the importance of early defibrillation. The course follows the latest AHA Guidelines for CPR and Emergency Cardiovascular Care and prepares participants for hands-on skills testing and written certification exams.\n\nResources:\n- AHA BLS: https://www.heart.org/en/cpr/cpr-courses-and-kits/healthcare-professional/basic-life-support-bls\n- AHA Guidelines: https://www.heart.org/en/professional/aha-guidelines\n- ILCOR CoSTR: https://www.ilcor.org',
    category: 'CLINICAL_SKILLS',
    level: 'BEGINNER',
    durationMinutes: 180,
    cpdPoints: 3,
    tags: ['BLS', 'CPR', 'AED', 'choking', 'cardiac-arrest', 'life-support', 'AHA', 'resuscitation'],
  },
  {
    title: 'Advanced Cardiovascular Life Support (ACLS)',
    slug: 'acls-certification',
    description:
      'An advanced course preparing nurses for ACLS certification. This course covers the management of cardiac arrest, post-cardiac arrest care, acute coronary syndromes (ACS), stroke, bradycardia, tachycardia, and other cardiovascular emergencies. Participants will learn systematic approaches including the BLS assessment, primary and secondary surveys, H\u2019s and T\u2019s of reversible causes, and the ACLS algorithms for cardiac arrest, bradycardia, tachycardia with a pulse, and post-cardiac arrest care. The course includes ECG rhythm interpretation (sinus rhythms, atrial arrhythmias, heart blocks, ventricular arrhythmias, and pulseless rhythms), ACLS pharmacology (epinephrine, amiodarone, atropine, adenosine, and others), airway management, and megacode team leadership scenarios.\n\nResources:\n- AHA ACLS: https://www.heart.org/en/cpr/cpr-courses-and-kits/healthcare-professional/advanced-cardiovascular-life-support-acls\n- AHA Guidelines: https://www.heart.org/en/professional/aha-guidelines\n- ACLS Medical Training: https://www.aclsmedicaltraining.com',
    category: 'CLINICAL_SKILLS',
    level: 'ADVANCED',
    durationMinutes: 480,
    cpdPoints: 8,
    tags: ['ACLS', 'cardiac-arrest', 'ECG', 'arrhythmia', 'pharmacology', 'cardiovascular', 'megacode', 'stroke'],
  },
  {
    title: 'Maternal and Child Health Nursing',
    slug: 'maternal-child-health',
    description:
      'An intermediate course covering the full spectrum of maternal and child health nursing. Topics include preconception care, antenatal care (following WHO Focused Antenatal Care guidelines), normal and complicated labour and delivery, postpartum care, neonatal care (including essential newborn care and neonatal resuscitation), breastfeeding support, family planning methods and counselling, and integrated management of childhood illness (IMCI). Participants will learn about high-risk pregnancies (gestational diabetes, pre-eclampsia, eclampsia, placenta previa), obstetric emergencies (shoulder dystocia, postpartum haemorrhage, ruptured uterus), and the WHO Safe Childbirth Checklist. The course also addresses child growth and development monitoring, immunization schedules, and nutritional requirements across the maternal-child health continuum.\n\nResources:\n- WHO Maternal Health: https://www.who.int/health-topics/maternal-health\n- WHO Newborn Health: https://www.who.int/health-topics/newborn-health\n- WHO Safe Childbirth Checklist: https://www.who.int/publications/i/item/9789241549451',
    category: 'MATERNITY',
    level: 'INTERMEDIATE',
    durationMinutes: 600,
    cpdPoints: 10,
    tags: ['maternal-health', 'child-health', 'antenatal', 'labour', 'neonatal', 'breastfeeding', 'family-planning', 'IMCI', 'postpartum'],
  },
  {
    title: 'Community Health Nursing',
    slug: 'community-health-nursing',
    description:
      'An intermediate course on community health nursing principles and practice. This course covers the foundations of primary healthcare (Alma-Ata Declaration and Astana Declaration), epidemiology and biostatistics for community health, health promotion and disease prevention strategies, community assessment and diagnosis, population-based nursing interventions, and community health programme planning and evaluation. Participants will learn about communicable disease surveillance and control, non-communicable disease management at the community level, environmental health, occupational health, school health nursing, and disaster preparedness and response. The course addresses the unique role of community health nurses in resource-limited settings, including outreach programmes, home visits, and working with community health workers and traditional birth attendants.\n\nResources:\n- WHO Primary Health Care: https://www.who.int/health-topics/primary-health-care\n- WHO Health Promotion: https://www.who.int/health-topics/health-promotion\n- WHO Epidemiology: https://www.who.int/teams/epidemic-and-pandemic-preparedness-and-prevention',
    category: 'COMMUNITY',
    level: 'INTERMEDIATE',
    durationMinutes: 480,
    cpdPoints: 8,
    tags: ['community-health', 'primary-healthcare', 'epidemiology', 'health-promotion', 'disease-prevention', 'surveillance', 'disaster-preparedness'],
  },
  {
    title: 'Pharmacology for Nurses',
    slug: 'pharmacology-nurses',
    description:
      'An intermediate course covering essential pharmacology knowledge for nursing practice. This course provides a systematic review of major drug classifications, mechanisms of action, therapeutic uses, adverse effects, contraindications, and nursing implications. Key areas include cardiovascular drugs (antihypertensives, antiarrhythmics, anticoagulants), central nervous system drugs (analgesics, sedatives, anticonvulsants), anti-infectives (antibiotics, antivirals, antifungals, antimalarials), endocrine drugs (insulin, oral hypoglycaemics, corticosteroids), respiratory drugs, gastrointestinal drugs, and chemotherapy agents. Participants will develop competency in dosage calculations (oral, parenteral, IV drip rates), medication administration safety (the "Rights" of medication administration), drug interactions, pharmacokinetics and pharmacodynamics basics, patient education on medications, and the nurse\u2019s role in medication reconciliation and error prevention.\n\nResources:\n- FDA Drug Safety: https://www.fda.gov/drugs\n- WHO Essential Medicines: https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines\n- ISMP Safety: https://www.ismp.org',
    category: 'PHARMACOLOGY',
    level: 'INTERMEDIATE',
    durationMinutes: 600,
    cpdPoints: 10,
    tags: ['pharmacology', 'drug-classifications', 'dosage-calculation', 'medication-safety', 'adverse-effects', 'nursing-implications', 'IV-therapy', 'antibiotics'],
  },
];

export const POST = withAuth({}, async (ctx) => {
  // Defense-in-depth: require admin auth (also blocked by middleware)
  if (ctx.role !== 'SUPER_ADMIN' && ctx.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get existing slugs to avoid duplicates
    const existingSlugs = new Set(
      (await db.course.findMany({ select: { slug: true } })).map((c) => c.slug)
    );

    let seeded = 0;
    let skipped = 0;
    let errors = 0;

    for (const courseData of COURSES) {
      try {
        if (existingSlugs.has(courseData.slug)) {
          skipped++;
          continue;
        }

        await db.course.create({
          data: {
            id: crypto.randomUUID(),
            title: courseData.title,
            slug: courseData.slug,
            description: courseData.description,
            category: courseData.category,
            level: courseData.level,
            instructorIds: '[]',
            modules: null,
            durationMinutes: courseData.durationMinutes,
            cpdPoints: courseData.cpdPoints,
            language: 'en',
            tags: JSON.stringify(courseData.tags),
            thumbnailUrl: null,
            isPublished: true,
            isFree: true,
            price: null,
            enrollmentCount: 0,
            rating: 0,
            totalRatings: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        existingSlugs.add(courseData.slug);
        seeded++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Unique constraint violation — already exists
          skipped++;
        } else {
          errors++;
          console.error(`Error seeding "${courseData.title}":`, err.message);
        }
      }
    }

    const finalCount = await db.course.count();

    console.log(
      `✅ Standard nursing courses seed complete: ${seeded} seeded, ${skipped} skipped, ${errors} errors. Total courses: ${finalCount}`
    );

    return NextResponse.json({
      success: true,
      seeded,
      skipped,
      errors,
      totalCourses: finalCount,
    });
  } catch (error: any) {
    console.error('Course seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed courses' },
      { status: 500 }
    );
  }
})

export const GET = withAuth({}, async (ctx) => {

  try {
    const seededSlugs = COURSES.map((c) => c.slug);
    const existing = await db.course.findMany({
      where: { slug: { in: seededSlugs } },
      select: { slug: true },
    });
    const existingSlugSet = new Set(existing.map((c) => c.slug));

    const missing = COURSES.filter((c) => !existingSlugSet.has(c.slug));

    return NextResponse.json({
      totalDefined: COURSES.length,
      alreadySeeded: existingSlugSet.size,
      missing: missing.length,
      missingCourses: missing.map((c) => ({ title: c.title, slug: c.slug })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check course seed status' },
      { status: 500 }
    );
  }
})
