// NurseAI Sample Data - Nigerian clinical context

export interface Patient {
  id: string
  name: string
  patientId: string
  age: number
  gender: "Male" | "Female"
  bloodType: string
  ward: string
  status: "Inpatient" | "Outpatient" | "Emergency" | "Discharged"
  lastVisit: string
  dob: string
  phone: string
  address: string
  allergies: string[]
  emergencyContact: string
  insuranceId: string
  primaryDiagnosis: string
  attendingDoctor: string
  nurse: string
  bedNumber?: string
  admissionDate?: string
}

export interface VitalsReading {
  id: string
  patientId: string
  date: string
  time: string
  temperature: number
  heartRate: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  respiratoryRate: number
  oxygenSaturation: number
  weight: number
  painScore: number
}

export interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  encounterType: "Admission" | "Follow-up" | "Emergency" | "Routine Check" | "Discharge" | "Consultation" | "Surgery"
  chiefComplaint: string
  diagnosis: string
  nurse: string
  date: string
  status: "Active" | "Discharged" | "Pending" | "Closed" | "Critical"
  notes: string
}

export interface MedicationOrder {
  id: string
  patientId: string
  patientName: string
  medicationName: string
  dosage: string
  route: "Oral" | "IV" | "IM" | "Subcutaneous" | "Topical" | "Inhalation"
  frequency: string
  startDate: string
  endDate: string
  prescribedBy: string
  status: "Pending" | "Verified" | "Administered" | "Held"
  interactionAlert?: boolean
  interactionDetail?: string
}

export interface LabResult {
  id: string
  patientId: string
  testName: string
  result: string
  referenceRange: string
  unit: string
  date: string
  abnormal: boolean
  flaggedBy: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  duration: number
  type: "Follow-up" | "Consultation" | "Check-up" | "Emergency" | "Procedure" | "Lab Review"
  doctor: string
  status: "Scheduled" | "In Progress" | "Completed" | "No Show" | "Cancelled"
  notes: string
}

export interface ChartNote {
  id: string
  patientId: string
  patientName: string
  noteType: "Progress" | "Assessment" | "Handover" | "SBAR" | "Nursing" | "Discharge"
  date: string
  content: string
  aiConfidence: number
  status: "Accepted" | "Rejected" | "Modified" | "Pending Review"
}

// ---- PATIENTS ----
export const patients: Patient[] = [
  {
    id: "p001", name: "Adaeze Okonkwo", patientId: "PT-2024-001", age: 34, gender: "Female",
    bloodType: "O+", ward: "Ward A - General", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1992-05-15", phone: "+234 803 456 7890", address: "23 Awolowo Rd, Ikoyi, Lagos",
    allergies: ["Penicillin", "Sulfa drugs"], emergencyContact: "Chidi Okonkwo +234 802 111 2233",
    insuranceId: "NHIS-78901", primaryDiagnosis: "Severe Malaria with Anemia",
    attendingDoctor: "Dr. Okafor", nurse: "Nurse Adaora", bedNumber: "A-12", admissionDate: "2026-03-01"
  },
  {
    id: "p002", name: "Chinedu Eze", patientId: "PT-2024-002", age: 56, gender: "Male",
    bloodType: "A-", ward: "Ward B - Cardiology", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1970-08-22", phone: "+234 805 678 9012", address: "45 Market Rd, Aba, Abia State",
    allergies: ["Aspirin"], emergencyContact: "Ngozi Eze +234 806 222 3344",
    insuranceId: "NHIS-78902", primaryDiagnosis: "Hypertensive Heart Disease",
    attendingDoctor: "Dr. Adeyemi", nurse: "Nurse Folake", bedNumber: "B-05", admissionDate: "2026-02-28"
  },
  {
    id: "p003", name: "Fatima Abdullahi", patientId: "PT-2024-003", age: 28, gender: "Female",
    bloodType: "B+", ward: "Ward C - Maternity", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1998-01-10", phone: "+234 807 890 1234", address: "12 Buhari Way, Kano",
    allergies: [], emergencyContact: "Ibrahim Abdullahi +234 808 333 4455",
    insuranceId: "NHIS-78903", primaryDiagnosis: "Antenatal - 36 weeks gestation",
    attendingDoctor: "Dr. Bello", nurse: "Nurse Halima", bedNumber: "C-03", admissionDate: "2026-03-03"
  },
  {
    id: "p004", name: "Olumide Adeyemi", patientId: "PT-2024-004", age: 42, gender: "Male",
    bloodType: "AB+", ward: "Ward D - Surgical", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1984-11-03", phone: "+234 809 012 3456", address: "78 Oba Akinolu St, Victoria Island, Lagos",
    allergies: ["Latex", "Ibuprofen"], emergencyContact: "Bimpe Adeyemi +234 801 444 5566",
    insuranceId: "NHIS-78904", primaryDiagnosis: "Post-appendectomy recovery",
    attendingDoctor: "Dr. Ogunleye", nurse: "Nurse Adaora", bedNumber: "D-08", admissionDate: "2026-03-02"
  },
  {
    id: "p005", name: "Blessing Uche", patientId: "PT-2024-005", age: 65, gender: "Female",
    bloodType: "O-", ward: "Ward B - Cardiology", status: "Emergency", lastVisit: "2026-03-04",
    dob: "1961-03-28", phone: "+234 802 234 5678", address: "34 Enugu Rd, Onitsha, Anambra",
    allergies: ["Codeine", "Morphine"], emergencyContact: "Emeka Uche +234 803 555 6677",
    insuranceId: "NHIS-78905", primaryDiagnosis: "Acute Myocardial Infarction",
    attendingDoctor: "Dr. Adeyemi", nurse: "Nurse Folake", bedNumber: "B-01", admissionDate: "2026-03-04"
  },
  {
    id: "p006", name: "Tunde Bakare", patientId: "PT-2024-006", age: 19, gender: "Male",
    bloodType: "A+", ward: "Ward A - General", status: "Outpatient", lastVisit: "2026-03-03",
    dob: "2007-06-14", phone: "+234 815 678 9012", address: "56 Allen Ave, Ikeja, Lagos",
    allergies: [], emergencyContact: "Kemi Bakare +234 816 777 8899",
    insuranceId: "NHIS-78906", primaryDiagnosis: "Sickle Cell Crisis - Vaso-occlusive",
    attendingDoctor: "Dr. Okafor", nurse: "Nurse Chiamaka"
  },
  {
    id: "p007", name: "Amina Musa", patientId: "PT-2024-007", age: 38, gender: "Female",
    bloodType: "B-", ward: "Ward E - Pediatrics", status: "Outpatient", lastVisit: "2026-03-02",
    dob: "1988-09-05", phone: "+234 818 890 1234", address: "23 Ahmadu Bello Way, Kaduna",
    allergies: ["Penicillin"], emergencyContact: "Yusuf Musa +234 819 888 9900",
    insuranceId: "NHIS-78907", primaryDiagnosis: "Pediatric Nursing Follow-up (Child: Aisha Musa, 4y)",
    attendingDoctor: "Dr. Bello", nurse: "Nurse Halima"
  },
  {
    id: "p008", name: "Emeka Nwankwo", patientId: "PT-2024-008", age: 51, gender: "Male",
    bloodType: "O+", ward: "Ward D - Surgical", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1975-04-17", phone: "+234 812 345 6789", address: "90 Wetheral Rd, Owerri, Imo",
    allergies: ["Sulfa drugs"], emergencyContact: "Chioma Nwankwo +234 813 999 0011",
    insuranceId: "NHIS-78908", primaryDiagnosis: "Diabetic Foot Ulcer - Right",
    attendingDoctor: "Dr. Ogunleye", nurse: "Nurse Adaora", bedNumber: "D-11", admissionDate: "2026-02-25"
  },
  {
    id: "p009", name: "Folake Ogunleye", patientId: "PT-2024-009", age: 73, gender: "Female",
    bloodType: "AB-", ward: "Ward A - General", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1953-12-01", phone: "+234 804 567 8901", address: "15 Ring Rd, Ibadan, Oyo",
    allergies: ["Aspirin", "Latex", "Iodine"], emergencyContact: "Dapo Ogunleye +234 805 111 2233",
    insuranceId: "NHIS-78909", primaryDiagnosis: "Community-Acquired Pneumonia",
    attendingDoctor: "Dr. Okafor", nurse: "Nurse Chiamaka", bedNumber: "A-07", admissionDate: "2026-03-01"
  },
  {
    id: "p010", name: "Yusuf Garba", patientId: "PT-2024-010", age: 45, gender: "Male",
    bloodType: "A+", ward: "Ward F - Emergency", status: "Emergency", lastVisit: "2026-03-04",
    dob: "1981-07-20", phone: "+234 806 789 0123", address: "67 Tanko Rd, Jos, Plateau",
    allergies: [], emergencyContact: "Hauwa Garba +234 807 222 3344",
    insuranceId: "NHIS-78910", primaryDiagnosis: "Road Traffic Accident - Multiple Fractures",
    attendingDoctor: "Dr. Ogunleye", nurse: "Nurse Folake", bedNumber: "F-02", admissionDate: "2026-03-04"
  },
  {
    id: "p011", name: "Chidinma Okafor", patientId: "PT-2024-011", age: 29, gender: "Female",
    bloodType: "O+", ward: "Ward C - Maternity", status: "Discharged", lastVisit: "2026-02-28",
    dob: "1997-10-08", phone: "+234 814 890 1234", address: "33 Ogui Rd, Enugu",
    allergies: ["Erythromycin"], emergencyContact: "Obinna Okafor +234 815 333 4455",
    insuranceId: "NHIS-78911", primaryDiagnosis: "Normal Delivery - Postnatal",
    attendingDoctor: "Dr. Bello", nurse: "Nurse Halima"
  },
  {
    id: "p012", name: "Babatunde Akinola", patientId: "PT-2024-012", age: 60, gender: "Male",
    bloodType: "B+", ward: "Ward B - Cardiology", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1966-02-14", phone: "+234 817 901 2345", address: "8 Awolowo Ave, Ibadan, Oyo",
    allergies: ["Metformin"], emergencyContact: "Adetola Akinola +234 818 444 5566",
    insuranceId: "NHIS-78912", primaryDiagnosis: "Type 2 Diabetes with Chronic Kidney Disease",
    attendingDoctor: "Dr. Adeyemi", nurse: "Nurse Folake", bedNumber: "B-09", admissionDate: "2026-02-20"
  },
  {
    id: "p013", name: "Ngozi Ibe", patientId: "PT-2024-013", age: 22, gender: "Female",
    bloodType: "A-", ward: "Ward A - General", status: "Outpatient", lastVisit: "2026-03-01",
    dob: "2004-04-25", phone: "+234 810 012 3456", address: "5 Aba Rd, Port Harcourt, Rivers",
    allergies: [], emergencyContact: "Chibuzo Ibe +234 811 555 6677",
    insuranceId: "NHIS-78913", primaryDiagnosis: "Typhoid Fever - Resolving",
    attendingDoctor: "Dr. Okafor", nurse: "Nurse Chiamaka"
  },
  {
    id: "p014", name: "Ibrahim Sule", patientId: "PT-2024-014", age: 48, gender: "Male",
    bloodType: "O-", ward: "Ward D - Surgical", status: "Inpatient", lastVisit: "2026-03-04",
    dob: "1978-06-30", phone: "+234 813 123 4567", address: "42 Lugard Ave, Sokoto",
    allergies: ["Cephalosporins"], emergencyContact: "Mariam Sule +234 814 666 7788",
    insuranceId: "NHIS-78914", primaryDiagnosis: "Hernia Repair - Post-op Day 2",
    attendingDoctor: "Dr. Ogunleye", nurse: "Nurse Adaora", bedNumber: "D-04", admissionDate: "2026-03-02"
  },
]

// ---- VITALS ----
export const vitalsReadings: VitalsReading[] = [
  { id: "v001", patientId: "p001", date: "2026-03-04", time: "08:00", temperature: 38.2, heartRate: 92, bloodPressureSystolic: 128, bloodPressureDiastolic: 82, respiratoryRate: 20, oxygenSaturation: 96, weight: 62, painScore: 4 },
  { id: "v002", patientId: "p001", date: "2026-03-04", time: "14:00", temperature: 37.8, heartRate: 88, bloodPressureSystolic: 124, bloodPressureDiastolic: 78, respiratoryRate: 18, oxygenSaturation: 97, weight: 62, painScore: 3 },
  { id: "v003", patientId: "p001", date: "2026-03-03", time: "08:00", temperature: 38.8, heartRate: 98, bloodPressureSystolic: 132, bloodPressureDiastolic: 86, respiratoryRate: 22, oxygenSaturation: 94, weight: 62, painScore: 6 },
  { id: "v004", patientId: "p001", date: "2026-03-03", time: "14:00", temperature: 38.4, heartRate: 95, bloodPressureSystolic: 130, bloodPressureDiastolic: 84, respiratoryRate: 21, oxygenSaturation: 95, weight: 62, painScore: 5 },
  { id: "v005", patientId: "p001", date: "2026-03-02", time: "08:00", temperature: 39.1, heartRate: 104, bloodPressureSystolic: 136, bloodPressureDiastolic: 88, respiratoryRate: 24, oxygenSaturation: 93, weight: 62, painScore: 7 },
  { id: "v006", patientId: "p001", date: "2026-03-02", time: "14:00", temperature: 38.9, heartRate: 100, bloodPressureSystolic: 134, bloodPressureDiastolic: 86, respiratoryRate: 23, oxygenSaturation: 94, weight: 62, painScore: 6 },
  { id: "v007", patientId: "p001", date: "2026-03-01", time: "08:00", temperature: 39.5, heartRate: 110, bloodPressureSystolic: 140, bloodPressureDiastolic: 90, respiratoryRate: 26, oxygenSaturation: 92, weight: 63, painScore: 8 },
  { id: "v008", patientId: "p002", date: "2026-03-04", time: "08:00", temperature: 36.8, heartRate: 78, bloodPressureSystolic: 158, bloodPressureDiastolic: 98, respiratoryRate: 18, oxygenSaturation: 97, weight: 85, painScore: 2 },
  { id: "v009", patientId: "p002", date: "2026-03-04", time: "14:00", temperature: 36.9, heartRate: 76, bloodPressureSystolic: 152, bloodPressureDiastolic: 94, respiratoryRate: 17, oxygenSaturation: 98, weight: 85, painScore: 1 },
  { id: "v010", patientId: "p002", date: "2026-03-03", time: "08:00", temperature: 37.0, heartRate: 82, bloodPressureSystolic: 164, bloodPressureDiastolic: 102, respiratoryRate: 19, oxygenSaturation: 96, weight: 85, painScore: 3 },
  { id: "v011", patientId: "p002", date: "2026-03-03", time: "14:00", temperature: 36.7, heartRate: 80, bloodPressureSystolic: 160, bloodPressureDiastolic: 100, respiratoryRate: 18, oxygenSaturation: 97, weight: 85, painScore: 2 },
  { id: "v012", patientId: "p002", date: "2026-03-02", time: "08:00", temperature: 36.9, heartRate: 84, bloodPressureSystolic: 170, bloodPressureDiastolic: 106, respiratoryRate: 20, oxygenSaturation: 95, weight: 85, painScore: 4 },
  { id: "v013", patientId: "p002", date: "2026-03-02", time: "14:00", temperature: 37.1, heartRate: 82, bloodPressureSystolic: 166, bloodPressureDiastolic: 104, respiratoryRate: 19, oxygenSaturation: 96, weight: 85, painScore: 3 },
  { id: "v014", patientId: "p005", date: "2026-03-04", time: "08:00", temperature: 37.2, heartRate: 108, bloodPressureSystolic: 90, bloodPressureDiastolic: 58, respiratoryRate: 24, oxygenSaturation: 91, weight: 70, painScore: 8 },
  { id: "v015", patientId: "p005", date: "2026-03-04", time: "10:00", temperature: 37.0, heartRate: 102, bloodPressureSystolic: 94, bloodPressureDiastolic: 62, respiratoryRate: 22, oxygenSaturation: 93, weight: 70, painScore: 7 },
  { id: "v016", patientId: "p003", date: "2026-03-04", time: "08:00", temperature: 36.6, heartRate: 86, bloodPressureSystolic: 118, bloodPressureDiastolic: 74, respiratoryRate: 18, oxygenSaturation: 99, weight: 78, painScore: 2 },
  { id: "v017", patientId: "p004", date: "2026-03-04", time: "08:00", temperature: 37.1, heartRate: 72, bloodPressureSystolic: 122, bloodPressureDiastolic: 78, respiratoryRate: 16, oxygenSaturation: 98, weight: 88, painScore: 5 },
  { id: "v018", patientId: "p010", date: "2026-03-04", time: "09:00", temperature: 36.5, heartRate: 96, bloodPressureSystolic: 138, bloodPressureDiastolic: 88, respiratoryRate: 22, oxygenSaturation: 95, weight: 75, painScore: 9 },
]

// ---- MEDICAL RECORDS ----
export const medicalRecords: MedicalRecord[] = [
  { id: "mr001", patientId: "p001", patientName: "Adaeze Okonkwo", encounterType: "Admission", chiefComplaint: "High fever, chills, body weakness for 5 days", diagnosis: "Severe Malaria with Anemia", nurse: "Nurse Adaora", date: "2026-03-01", status: "Active", notes: "Patient admitted with severe malaria. IV Artesunate commenced. Blood transfusion ordered for Hb of 6.2g/dL." },
  { id: "mr002", patientId: "p002", patientName: "Chinedu Eze", encounterType: "Admission", chiefComplaint: "Chest pain, shortness of breath, palpitations", diagnosis: "Hypertensive Heart Disease", nurse: "Nurse Folake", date: "2026-02-28", status: "Active", notes: "Patient on antihypertensives. BP trending down. Echocardiogram scheduled." },
  { id: "mr003", patientId: "p003", patientName: "Fatima Abdullahi", encounterType: "Admission", chiefComplaint: "Antenatal admission for imminent delivery", diagnosis: "Antenatal - 36 weeks gestation", nurse: "Nurse Halima", date: "2026-03-03", status: "Active", notes: "G4P3 at 36 weeks. Fetal heart rate normal. Awaiting spontaneous labor." },
  { id: "mr004", patientId: "p004", patientName: "Olumide Adeyemi", encounterType: "Surgery", chiefComplaint: "Acute right lower quadrant abdominal pain", diagnosis: "Acute Appendicitis - Appendectomy done", nurse: "Nurse Adaora", date: "2026-03-02", status: "Active", notes: "Laparoscopic appendectomy performed. Patient recovering well. Wound site clean and dry." },
  { id: "mr005", patientId: "p005", patientName: "Blessing Uche", encounterType: "Emergency", chiefComplaint: "Severe chest pain radiating to left arm", diagnosis: "Acute Myocardial Infarction", nurse: "Nurse Folake", date: "2026-03-04", status: "Critical", notes: "ST-elevation MI confirmed. Thrombolysis initiated. Patient in ICU. Continuous monitoring." },
  { id: "mr006", patientId: "p006", patientName: "Tunde Bakare", encounterType: "Follow-up", chiefComplaint: "Recurrent bone pain crisis", diagnosis: "Sickle Cell Disease - Vaso-occlusive Crisis", nurse: "Nurse Chiamaka", date: "2026-03-03", status: "Active", notes: "Pain management with IV fluids and analgesics. Hydroxyurea therapy discussed." },
  { id: "mr007", patientId: "p008", patientName: "Emeka Nwankwo", encounterType: "Admission", chiefComplaint: "Non-healing wound on right foot", diagnosis: "Diabetic Foot Ulcer - Right", nurse: "Nurse Adaora", date: "2026-02-25", status: "Active", notes: "Wound debridement performed. Antibiotics commenced. Blood sugar control being optimized." },
  { id: "mr008", patientId: "p009", patientName: "Folake Ogunleye", encounterType: "Admission", chiefComplaint: "Cough, fever, difficulty breathing for 1 week", diagnosis: "Community-Acquired Pneumonia", nurse: "Nurse Chiamaka", date: "2026-03-01", status: "Active", notes: "CXR shows right lower lobe consolidation. IV antibiotics started. Oxygen therapy at 3L/min." },
  { id: "mr009", patientId: "p010", patientName: "Yusuf Garba", encounterType: "Emergency", chiefComplaint: "Motor vehicle accident, multiple injuries", diagnosis: "Multiple Fractures - R. Femur, L. Tibia", nurse: "Nurse Folake", date: "2026-03-04", status: "Critical", notes: "Emergency stabilization done. Orthopedic consult for surgical fixation. X-rays confirmed fractures." },
  { id: "mr010", patientId: "p011", patientName: "Chidinma Okafor", encounterType: "Discharge", chiefComplaint: "Postnatal follow-up", diagnosis: "Normal Delivery - Postnatal", nurse: "Nurse Halima", date: "2026-02-28", status: "Discharged", notes: "Mother and baby doing well. Exclusive breastfeeding advised. Postnatal clinic in 6 weeks." },
]

// ---- MEDICATIONS ----
export const medicationOrders: MedicationOrder[] = [
  { id: "med001", patientId: "p001", patientName: "Adaeze Okonkwo", medicationName: "Artesunate", dosage: "120mg", route: "IV", frequency: "Every 12 hours", startDate: "2026-03-01", endDate: "2026-03-05", prescribedBy: "Dr. Okafor", status: "Verified", interactionAlert: false },
  { id: "med002", patientId: "p001", patientName: "Adaeze Okonkwo", medicationName: "Paracetamol", dosage: "1g", route: "Oral", frequency: "Every 6 hours PRN", startDate: "2026-03-01", endDate: "2026-03-05", prescribedBy: "Dr. Okafor", status: "Administered", interactionAlert: false },
  { id: "med003", patientId: "p002", patientName: "Chinedu Eze", medicationName: "Amlodipine", dosage: "10mg", route: "Oral", frequency: "Once daily", startDate: "2026-02-28", endDate: "2026-03-14", prescribedBy: "Dr. Adeyemi", status: "Verified", interactionAlert: false },
  { id: "med004", patientId: "p002", patientName: "Chinedu Eze", medicationName: "Lisinopril", dosage: "20mg", route: "Oral", frequency: "Once daily", startDate: "2026-02-28", endDate: "2026-03-14", prescribedBy: "Dr. Adeyemi", status: "Verified", interactionAlert: true, interactionDetail: "Concurrent use with Amlodipine may cause additive hypotension" },
  { id: "med005", patientId: "p002", patientName: "Chinedu Eze", medicationName: "Aspirin", dosage: "75mg", route: "Oral", frequency: "Once daily", startDate: "2026-02-28", endDate: "2026-03-14", prescribedBy: "Dr. Adeyemi", status: "Held", interactionAlert: true, interactionDetail: "Patient has documented Aspirin allergy - CONTRAINDICATED" },
  { id: "med006", patientId: "p003", patientName: "Fatima Abdullahi", medicationName: "Folic Acid", dosage: "5mg", route: "Oral", frequency: "Once daily", startDate: "2026-03-03", endDate: "2026-04-03", prescribedBy: "Dr. Bello", status: "Verified", interactionAlert: false },
  { id: "med007", patientId: "p004", patientName: "Olumide Adeyemi", medicationName: "Ceftriaxone", dosage: "1g", route: "IV", frequency: "Every 24 hours", startDate: "2026-03-02", endDate: "2026-03-06", prescribedBy: "Dr. Ogunleye", status: "Verified", interactionAlert: false },
  { id: "med008", patientId: "p004", patientName: "Olumide Adeyemi", medicationName: "Tramadol", dosage: "50mg", route: "Oral", frequency: "Every 8 hours", startDate: "2026-03-02", endDate: "2026-03-06", prescribedBy: "Dr. Ogunleye", status: "Administered", interactionAlert: false },
  { id: "med009", patientId: "p005", patientName: "Blessing Uche", medicationName: "Streptokinase", dosage: "1.5 million IU", route: "IV", frequency: "Single dose", startDate: "2026-03-04", endDate: "2026-03-04", prescribedBy: "Dr. Adeyemi", status: "Administered", interactionAlert: false },
  { id: "med010", patientId: "p005", patientName: "Blessing Uche", medicationName: "Morphine", dosage: "2mg", route: "IV", frequency: "Every 4 hours PRN", startDate: "2026-03-04", endDate: "2026-03-05", prescribedBy: "Dr. Adeyemi", status: "Held", interactionAlert: true, interactionDetail: "Patient has documented Morphine allergy - CONTRAINDICATED" },
  { id: "med011", patientId: "p006", patientName: "Tunde Bakare", medicationName: "Hydroxyurea", dosage: "500mg", route: "Oral", frequency: "Once daily", startDate: "2026-03-03", endDate: "2026-03-17", prescribedBy: "Dr. Okafor", status: "Pending", interactionAlert: false },
  { id: "med012", patientId: "p008", patientName: "Emeka Nwankwo", medicationName: "Metformin", dosage: "850mg", route: "Oral", frequency: "Twice daily", startDate: "2026-02-25", endDate: "2026-03-11", prescribedBy: "Dr. Adeyemi", status: "Verified", interactionAlert: true, interactionDetail: "Contraindicated in renal impairment - CKD Stage 3. Consider dose adjustment." },
  { id: "med013", patientId: "p008", patientName: "Emeka Nwankwo", medicationName: "Ciprofloxacin", dosage: "500mg", route: "Oral", frequency: "Twice daily", startDate: "2026-02-25", endDate: "2026-03-11", prescribedBy: "Dr. Ogunleye", status: "Verified", interactionAlert: false },
  { id: "med014", patientId: "p009", patientName: "Folake Ogunleye", medicationName: "Cefuroxime", dosage: "750mg", route: "IV", frequency: "Every 8 hours", startDate: "2026-03-01", endDate: "2026-03-08", prescribedBy: "Dr. Okafor", status: "Administered", interactionAlert: false },
  { id: "med015", patientId: "p010", patientName: "Yusuf Garba", medicationName: "Gentamicin", dosage: "240mg", route: "IV", frequency: "Once daily", startDate: "2026-03-04", endDate: "2026-03-11", prescribedBy: "Dr. Ogunleye", status: "Pending", interactionAlert: false },
]

// ---- LAB RESULTS ----
export const labResults: LabResult[] = [
  { id: "lab001", patientId: "p001", testName: "Packed Cell Volume (PCV)", result: "18%", referenceRange: "36-46%", unit: "%", date: "2026-03-01", abnormal: true, flaggedBy: "System" },
  { id: "lab002", patientId: "p001", testName: "Malaria Parasite", result: "Positive +++", referenceRange: "Negative", unit: "", date: "2026-03-01", abnormal: true, flaggedBy: "Lab" },
  { id: "lab003", patientId: "p001", testName: "Random Blood Sugar", result: "5.8", referenceRange: "3.9-7.2", unit: "mmol/L", date: "2026-03-01", abnormal: false, flaggedBy: "" },
  { id: "lab004", patientId: "p002", testName: "Echocardiogram EF", result: "42%", referenceRange: "55-70%", unit: "%", date: "2026-03-01", abnormal: true, flaggedBy: "Cardiology" },
  { id: "lab005", patientId: "p002", testName: "Serum Creatinine", result: "1.8", referenceRange: "0.7-1.3", unit: "mg/dL", date: "2026-03-02", abnormal: true, flaggedBy: "System" },
  { id: "lab006", patientId: "p005", testName: "Troponin I", result: "12.5", referenceRange: "<0.04", unit: "ng/mL", date: "2026-03-04", abnormal: true, flaggedBy: "Lab" },
  { id: "lab007", patientId: "p005", testName: "ECG", result: "ST elevation V1-V4", referenceRange: "Normal sinus rhythm", unit: "", date: "2026-03-04", abnormal: true, flaggedBy: "Cardiology" },
  { id: "lab008", patientId: "p006", testName: "Hemoglobin S", result: "85%", referenceRange: "0%", unit: "%", date: "2026-03-03", abnormal: true, flaggedBy: "Lab" },
  { id: "lab009", patientId: "p008", testName: "HbA1c", result: "9.2%", referenceRange: "<6.5%", unit: "%", date: "2026-02-26", abnormal: true, flaggedBy: "System" },
  { id: "lab010", patientId: "p008", testName: "Wound Culture", result: "Staph aureus", referenceRange: "No growth", unit: "", date: "2026-02-27", abnormal: true, flaggedBy: "Microbiology" },
  { id: "lab011", patientId: "p012", testName: "eGFR", result: "32", referenceRange: ">60", unit: "mL/min", date: "2026-02-22", abnormal: true, flaggedBy: "System" },
  { id: "lab012", patientId: "p012", testName: "Serum Potassium", result: "5.6", referenceRange: "3.5-5.0", unit: "mmol/L", date: "2026-03-01", abnormal: true, flaggedBy: "Lab" },
]

// ---- APPOINTMENTS ----
export const appointments: Appointment[] = [
  { id: "apt001", patientId: "p006", patientName: "Tunde Bakare", date: "2026-03-04", time: "09:00", duration: 30, type: "Follow-up", doctor: "Dr. Okafor", status: "Completed", notes: "Review sickle cell crisis management plan" },
  { id: "apt002", patientId: "p007", patientName: "Amina Musa", date: "2026-03-04", time: "09:30", duration: 45, type: "Consultation", doctor: "Dr. Bello", status: "Completed", notes: "Pediatric follow-up for child Aisha" },
  { id: "apt003", patientId: "p003", patientName: "Fatima Abdullahi", date: "2026-03-04", time: "10:00", duration: 30, type: "Check-up", doctor: "Dr. Bello", status: "In Progress", notes: "Antenatal check - fetal monitoring" },
  { id: "apt004", patientId: "p013", patientName: "Ngozi Ibe", date: "2026-03-04", time: "11:00", duration: 20, type: "Follow-up", doctor: "Dr. Okafor", status: "Scheduled", notes: "Post-typhoid recovery assessment" },
  { id: "apt005", patientId: "p014", patientName: "Ibrahim Sule", date: "2026-03-04", time: "11:30", duration: 30, type: "Procedure", doctor: "Dr. Ogunleye", status: "Scheduled", notes: "Post-op wound assessment" },
  { id: "apt006", patientId: "p001", patientName: "Adaeze Okonkwo", date: "2026-03-04", time: "14:00", duration: 20, type: "Lab Review", doctor: "Dr. Okafor", status: "Scheduled", notes: "Review post-transfusion labs" },
  { id: "apt007", patientId: "p002", patientName: "Chinedu Eze", date: "2026-03-04", time: "14:30", duration: 30, type: "Follow-up", doctor: "Dr. Adeyemi", status: "Scheduled", notes: "Cardiology follow-up - BP review" },
  { id: "apt008", patientId: "p011", patientName: "Chidinma Okafor", date: "2026-03-04", time: "15:00", duration: 20, type: "Check-up", doctor: "Dr. Bello", status: "No Show", notes: "Postnatal check - did not show" },
  { id: "apt009", patientId: "p006", patientName: "Tunde Bakare", date: "2026-03-05", time: "09:00", duration: 30, type: "Follow-up", doctor: "Dr. Okafor", status: "Scheduled", notes: "Review hydroxyurea therapy" },
  { id: "apt010", patientId: "p008", patientName: "Emeka Nwankwo", date: "2026-03-05", time: "10:00", duration: 30, type: "Procedure", doctor: "Dr. Ogunleye", status: "Scheduled", notes: "Wound debridement and dressing change" },
  { id: "apt011", patientId: "p004", patientName: "Olumide Adeyemi", date: "2026-03-05", time: "11:00", duration: 20, type: "Follow-up", doctor: "Dr. Ogunleye", status: "Scheduled", notes: "Post-appendectomy review" },
  { id: "apt012", patientId: "p012", patientName: "Babatunde Akinola", date: "2026-03-05", time: "14:00", duration: 30, type: "Consultation", doctor: "Dr. Adeyemi", status: "Scheduled", notes: "Renal function review and medication adjustment" },
  { id: "apt013", patientId: "p009", patientName: "Folake Ogunleye", date: "2026-03-06", time: "09:00", duration: 30, type: "Follow-up", doctor: "Dr. Okafor", status: "Scheduled", notes: "Pneumonia treatment response review" },
  { id: "apt014", patientId: "p003", patientName: "Fatima Abdullahi", date: "2026-03-06", time: "10:00", duration: 45, type: "Procedure", doctor: "Dr. Bello", status: "Scheduled", notes: "Delivery assessment" },
]

// ---- CHART NOTES ----
export const chartNotes: ChartNote[] = [
  { id: "cn001", patientId: "p001", patientName: "Adaeze Okonkwo", noteType: "Progress", date: "2026-03-04", content: "S: Patient reports decreased fever and improved energy. Still experiencing mild headache and body weakness.\nO: Temp 37.8°C (down from 38.2°C AM), HR 88, BP 124/78, SpO2 97%. IV site intact, no signs of phlebitis.\nA: Malaria improving on IV Artesunate. Anemia being addressed with blood transfusion.\nP: Continue IV Artesunate q12h. Monitor vitals q4h. Recheck PCV tomorrow AM.", aiConfidence: 94, status: "Accepted" },
  { id: "cn002", patientId: "p005", patientName: "Blessing Uche", noteType: "SBAR", date: "2026-03-04", content: "SITUATION: Mrs. Blessing Uche, 65yo female, admitted to ICU with Acute MI. Currently hemodynamically unstable.\nBACKGROUND: Presented 2h ago with severe chest pain. ECG shows ST elevation V1-V4. Troponin 12.5 ng/mL. Thrombolysis initiated.\nASSESSMENT: Critical condition. BP 90/58, HR 108, SpO2 91%. Risk of cardiogenic shock.\nRECOMMENDATION: Continuous cardiac monitoring. Prepare for possible PCI transfer. Maintain bed rest.", aiConfidence: 89, status: "Accepted" },
  { id: "cn003", patientId: "p004", patientName: "Olumide Adeyemi", noteType: "Nursing", date: "2026-03-04", content: "Patient resting in bed, post-op day 2. Wound dressing clean and dry, no signs of infection. Tolerating oral fluids well. Pain managed with Tramadol 50mg PO q8h - reports pain 3/10. Ambulated to bathroom with assistance. IV access patent.", aiConfidence: 97, status: "Accepted" },
  { id: "cn004", patientId: "p002", patientName: "Chinedu Eze", noteType: "Handover", date: "2026-03-04", content: "Handover to night shift: Mr. Chinedu Eze, 56yo, Ward B Bed 5. Hypertensive Heart Disease. BP trending down on Amlodipine + Lisinopril (current 152/94). ALERT: Aspirin held due to documented allergy - do NOT administer. Echocardiogram scheduled for tomorrow. Continue current meds and monitoring.", aiConfidence: 92, status: "Modified" },
  { id: "cn005", patientId: "p010", patientName: "Yusuf Garba", noteType: "Assessment", date: "2026-03-04", content: "Initial assessment: Trauma patient from RTA. Multiple fractures R. femur and L. tibia. C-spine cleared. GCS 15/15. Bilateral chest clear. Abdomen soft, non-tender. Fractures immobilized. Awaiting orthopedic surgery consult. Pain 9/10 - requesting analgesia.", aiConfidence: 91, status: "Pending Review" },
  { id: "cn006", patientId: "p003", patientName: "Fatima Abdullahi", noteType: "Progress", date: "2026-03-04", content: "Antenatal progress note: G4P3 at 36+2 weeks. Fetal heart rate 140 bpm (normal). No contractions observed. Fundal height 34cm. Patient comfortable, ambulating within ward. Folic acid and iron supplements continued. Awaiting spontaneous labor.", aiConfidence: 96, status: "Accepted" },
]

// Helper function to calculate NEWS2 score
export function calculateNEWS2(v: VitalsReading): number {
  let score = 0
  // Respiration rate
  if (v.respiratoryRate <= 8) score += 3
  else if (v.respiratoryRate >= 25) score += 3
  else if (v.respiratoryRate >= 21) score += 2
  else if (v.respiratoryRate >= 12) score += 0
  else score += 1
  // SpO2
  if (v.oxygenSaturation <= 91) score += 3
  else if (v.oxygenSaturation <= 93) score += 2
  else if (v.oxygenSaturation <= 95) score += 1
  else score += 0
  // Temperature
  if (v.temperature <= 35) score += 3
  else if (v.temperature >= 39.1) score += 2
  else if (v.temperature <= 36) score += 1
  else score += 0
  // Systolic BP
  if (v.bloodPressureSystolic <= 90) score += 3
  else if (v.bloodPressureSystolic <= 100) score += 2
  else if (v.bloodPressureSystolic <= 110) score += 1
  else if (v.bloodPressureSystolic >= 220) score += 3
  else score += 0
  // Heart rate
  if (v.heartRate <= 40) score += 3
  else if (v.heartRate >= 131) score += 3
  else if (v.heartRate >= 111) score += 2
  else if (v.heartRate >= 91) score += 1
  else score += 0
  // AVPU - simplified, always alert for our data
  return score
}

export function getNEWS2Color(score: number): string {
  if (score <= 1) return "text-emerald-600 bg-emerald-50 border-emerald-200"
  if (score <= 4) return "text-amber-600 bg-amber-50 border-amber-200"
  if (score <= 6) return "text-orange-600 bg-orange-50 border-orange-200"
  return "text-red-600 bg-red-50 border-red-200"
}

export function getNEWS2Label(score: number): string {
  if (score <= 1) return "Low"
  if (score <= 4) return "Low-Medium"
  if (score <= 6) return "Medium"
  return "High"
}
