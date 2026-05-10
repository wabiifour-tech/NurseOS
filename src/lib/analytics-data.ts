// NurseAnalytics Module Data

export const facilitySelector = [
  { id: "F001", name: "Lagos University Teaching Hospital" },
  { id: "F002", name: "Federal Medical Centre, Abuja" },
  { id: "F003", name: "University College Hospital, Ibadan" },
  { id: "F004", name: "Ahmadu Bello University Teaching Hospital" },
  { id: "F005", name: "University of Nigeria Teaching Hospital" },
  { id: "F006", name: "Lagos State General Hospital" },
  { id: "F007", name: "National Hospital, Abuja" },
  { id: "F008", name: "Rivers State University Teaching Hospital" },
];

// KPI Data
export const kpiData = {
  totalPatients: 1247,
  avgWaitTime: "34 min",
  bedOccupancy: 87.3,
  nurseToPatientRatio: "1:6",
  medicationErrors: 2,
  patientSatisfaction: 4.2,
};

// Patient Volume Data (Area Chart)
export const patientVolumeData = [
  { month: "Jan", inpatient: 320, outpatient: 580, emergency: 120 },
  { month: "Feb", inpatient: 305, outpatient: 610, emergency: 135 },
  { month: "Mar", inpatient: 340, outpatient: 625, emergency: 142 },
  { month: "Apr", inpatient: 355, outpatient: 640, emergency: 128 },
  { month: "May", inpatient: 375, outpatient: 660, emergency: 155 },
  { month: "Jun", inpatient: 390, outpatient: 695, emergency: 148 },
  { month: "Jul", inpatient: 410, outpatient: 720, emergency: 162 },
  { month: "Aug", inpatient: 395, outpatient: 700, emergency: 158 },
  { month: "Sep", inpatient: 380, outpatient: 680, emergency: 145 },
  { month: "Oct", inpatient: 365, outpatient: 655, emergency: 138 },
  { month: "Nov", inpatient: 350, outpatient: 640, emergency: 132 },
  { month: "Dec", inpatient: 330, outpatient: 610, emergency: 125 },
];

// Diagnosis Distribution Data (Pie Chart)
export const diagnosisData = [
  { name: "Malaria", value: 28, fill: "#10b981" },
  { name: "Hypertension", value: 18, fill: "#14b8a6" },
  { name: "Diabetes", value: 14, fill: "#059669" },
  { name: "Respiratory Infection", value: 12, fill: "#0d9488" },
  { name: "Typhoid", value: 10, fill: "#047857" },
  { name: "HIV/AIDS", value: 8, fill: "#065f46" },
  { name: "Trauma/Injury", value: 6, fill: "#115e59" },
  { name: "Others", value: 4, fill: "#a7f3d0" },
];

// Peak Hours Data (Bar Chart)
export const peakHoursData = [
  { hour: "6AM", patients: 15 },
  { hour: "7AM", patients: 28 },
  { hour: "8AM", patients: 45 },
  { hour: "9AM", patients: 62 },
  { hour: "10AM", patients: 78 },
  { hour: "11AM", patients: 85 },
  { hour: "12PM", patients: 72 },
  { hour: "1PM", patients: 55 },
  { hour: "2PM", patients: 48 },
  { hour: "3PM", patients: 42 },
  { hour: "4PM", patients: 38 },
  { hour: "5PM", patients: 32 },
  { hour: "6PM", patients: 25 },
  { hour: "7PM", patients: 20 },
  { hour: "8PM", patients: 15 },
  { hour: "9PM", patients: 12 },
  { hour: "10PM", patients: 8 },
  { hour: "11PM", patients: 5 },
];

// Staffing Overview Data (Bar Chart)
export const staffingData = [
  { department: "Emergency", scheduled: 15, present: 13 },
  { department: "ICU", scheduled: 12, present: 11 },
  { department: "Pediatrics", scheduled: 10, present: 10 },
  { department: "Maternity", scheduled: 14, present: 12 },
  { department: "Surgery", scheduled: 11, present: 9 },
  { department: "Medical", scheduled: 13, present: 12 },
  { department: "Outpatient", scheduled: 8, present: 7 },
];

// AI Insights
export const aiInsights = [
  {
    id: 1,
    type: "warning" as const,
    title: "ICU Staffing Shortage Predicted",
    description: "Based on current trends, ICU will be 25% understaffed during the night shift tomorrow. Consider calling in backup staff.",
    confidence: 89,
  },
  {
    id: 2,
    type: "info" as const,
    title: "Malaria Cases Rising",
    description: "Outpatient malaria cases have increased 18% this week. Consider pre-positioning rapid test kits and ACTs.",
    confidence: 94,
  },
  {
    id: 3,
    type: "success" as const,
    title: "Patient Satisfaction Improving",
    description: "Satisfaction scores have improved 12% since implementing the new triage protocol. Keep up the good work!",
    confidence: 91,
  },
  {
    id: 4,
    type: "warning" as const,
    title: "Medication Error Risk",
    description: "High correlation between overtime shifts and medication errors. 3 nurses have exceeded 60hrs this week.",
    confidence: 85,
  },
];

// Patient Demographics
export const ageDemographics = [
  { group: "0-4", male: 85, female: 78 },
  { group: "5-14", male: 62, female: 58 },
  { group: "15-24", male: 95, female: 112 },
  { group: "25-34", male: 120, female: 145 },
  { group: "35-44", male: 105, female: 118 },
  { group: "45-54", male: 88, female: 95 },
  { group: "55-64", male: 65, female: 72 },
  { group: "65+", male: 42, female: 48 },
];

// Top Diagnoses Table
export const topDiagnoses = [
  { rank: 1, diagnosis: "Uncomplicated Malaria", cases: 342, percentage: 27.4, trend: "up" as const, change: "+12%" },
  { rank: 2, diagnosis: "Essential Hypertension", cases: 218, percentage: 17.5, trend: "up" as const, change: "+5%" },
  { rank: 3, diagnosis: "Type 2 Diabetes Mellitus", cases: 176, percentage: 14.1, trend: "stable" as const, change: "+1%" },
  { rank: 4, diagnosis: "Upper Respiratory Tract Infection", cases: 145, percentage: 11.6, trend: "down" as const, change: "-8%" },
  { rank: 5, diagnosis: "Enteric Fever (Typhoid)", cases: 124, percentage: 9.9, trend: "up" as const, change: "+15%" },
  { rank: 6, diagnosis: "HIV/AIDS (on ART)", cases: 98, percentage: 7.9, trend: "stable" as const, change: "-2%" },
  { rank: 7, diagnosis: "Road Traffic Injury", cases: 72, percentage: 5.8, trend: "down" as const, change: "-3%" },
  { rank: 8, diagnosis: "Sickle Cell Crisis", cases: 45, percentage: 3.6, trend: "up" as const, change: "+7%" },
];

// Admission Trends
export const admissionTrends = [
  { month: "Jan", admissions: 285, discharges: 270, readmissions: 15 },
  { month: "Feb", admissions: 275, discharges: 265, readmissions: 12 },
  { month: "Mar", admissions: 310, discharges: 295, readmissions: 18 },
  { month: "Apr", admissions: 325, discharges: 308, readmissions: 14 },
  { month: "May", admissions: 340, discharges: 325, readmissions: 20 },
  { month: "Jun", admissions: 355, discharges: 340, readmissions: 16 },
  { month: "Jul", admissions: 370, discharges: 350, readmissions: 22 },
  { month: "Aug", admissions: 360, discharges: 345, readmissions: 19 },
  { month: "Sep", admissions: 345, discharges: 330, readmissions: 17 },
  { month: "Oct", admissions: 330, discharges: 315, readmissions: 14 },
  { month: "Nov", admissions: 318, discharges: 305, readmissions: 12 },
  { month: "Dec", admissions: 295, discharges: 280, readmissions: 10 },
];

// Length of Stay Distribution
export const losDistribution = [
  { range: "0-1 day", patients: 180 },
  { range: "2-3 days", patients: 320 },
  { range: "4-7 days", patients: 280 },
  { range: "8-14 days", patients: 150 },
  { range: "15-30 days", patients: 75 },
  { range: "30+ days", patients: 35 },
];

// Patient Satisfaction Trends
export const satisfactionTrends = [
  { month: "Jan", overall: 3.8, nursing: 4.0, doctor: 3.7, facility: 3.5 },
  { month: "Feb", overall: 3.9, nursing: 4.1, doctor: 3.8, facility: 3.6 },
  { month: "Mar", overall: 3.9, nursing: 4.1, doctor: 3.7, facility: 3.7 },
  { month: "Apr", overall: 4.0, nursing: 4.2, doctor: 3.9, facility: 3.7 },
  { month: "May", overall: 4.0, nursing: 4.2, doctor: 3.8, facility: 3.8 },
  { month: "Jun", overall: 4.1, nursing: 4.3, doctor: 3.9, facility: 3.8 },
  { month: "Jul", overall: 4.1, nursing: 4.3, doctor: 4.0, facility: 3.9 },
  { month: "Aug", overall: 4.2, nursing: 4.4, doctor: 4.0, facility: 3.9 },
  { month: "Sep", overall: 4.1, nursing: 4.3, doctor: 3.9, facility: 3.8 },
  { month: "Oct", overall: 4.2, nursing: 4.4, doctor: 4.0, facility: 3.9 },
  { month: "Nov", overall: 4.2, nursing: 4.4, doctor: 4.1, facility: 4.0 },
  { month: "Dec", overall: 4.3, nursing: 4.5, doctor: 4.1, facility: 4.0 },
];

// Staffing Levels
export const staffingLevels = [
  { department: "Emergency", current: 13, recommended: 16, ratio: "1:7" },
  { department: "ICU", current: 11, recommended: 14, ratio: "1:3" },
  { department: "Pediatrics", current: 10, recommended: 10, ratio: "1:5" },
  { department: "Maternity", current: 12, recommended: 15, ratio: "1:6" },
  { department: "Surgery", current: 9, recommended: 12, ratio: "1:5" },
  { department: "Medical", current: 12, recommended: 13, ratio: "1:6" },
  { department: "Outpatient", current: 7, recommended: 8, ratio: "1:12" },
];

// Shift Coverage
export const shiftCoverage = [
  { shift: "Morning (6AM-2PM)", coverage: 95, nurses: 42 },
  { shift: "Afternoon (2PM-10PM)", coverage: 88, nurses: 36 },
  { shift: "Night (10PM-6AM)", coverage: 72, nurses: 24 },
];

// Staffing Predictions
export const staffingPredictions = [
  { day: "Monday", predicted: 38, confidence: 92, risk: "low" as const },
  { day: "Tuesday", predicted: 36, confidence: 88, risk: "low" as const },
  { day: "Wednesday", predicted: 35, confidence: 85, risk: "medium" as const },
  { day: "Thursday", predicted: 33, confidence: 80, risk: "medium" as const },
  { day: "Friday", predicted: 30, confidence: 75, risk: "high" as const },
  { day: "Saturday", predicted: 28, confidence: 82, risk: "high" as const },
  { day: "Sunday", predicted: 25, confidence: 78, risk: "high" as const },
];

// Leave and Absence
export const leaveData = [
  { name: "Nurse Adebayo K.", type: "Annual Leave", from: "Mar 12", to: "Mar 18", status: "Approved" },
  { name: "Nurse Chukwu M.", type: "Sick Leave", from: "Mar 14", to: "Mar 16", status: "Approved" },
  { name: "Nurse Ibrahim S.", type: "Maternity Leave", from: "Mar 1", to: "Jun 1", status: "Approved" },
  { name: "Nurse Okafor P.", type: "Study Leave", from: "Mar 10", to: "Mar 20", status: "Pending" },
  { name: "Nurse Adeyemi T.", type: "Compassionate", from: "Mar 15", to: "Mar 17", status: "Approved" },
];

// Cost per Nurse per Shift
export const costData = [
  { level: "Nursing Officer I", dayShift: 18500, nightShift: 22200, weekendShift: 25900 },
  { level: "Nursing Officer II", dayShift: 15800, nightShift: 18960, weekendShift: 22120 },
  { level: "Senior Nursing Officer", dayShift: 21200, nightShift: 25440, weekendShift: 29680 },
  { level: "Principal Nursing Officer", dayShift: 24500, nightShift: 29400, weekendShift: 34300 },
  { level: "Chief Nursing Officer", dayShift: 28700, nightShift: 34440, weekendShift: 40180 },
];

// Disease Surveillance Data
export const diseaseAlerts = [
  {
    id: "DA-001",
    disease: "Lassa Fever",
    severity: "Emergency" as const,
    states: ["Edo", "Ondo", "Ebonyi", "Taraba"],
    cases: 892,
    deaths: 167,
    lastUpdated: "2024-03-15",
    trend: "increasing",
  },
  {
    id: "DA-002",
    disease: "Cholera",
    severity: "Warning" as const,
    states: ["Lagos", "Kano", "Borno", "Adamawa"],
    cases: 2456,
    deaths: 78,
    lastUpdated: "2024-03-14",
    trend: "increasing",
  },
  {
    id: "DA-003",
    disease: "Meningitis",
    severity: "Watch" as const,
    states: ["Kebbi", "Sokoto", "Zamfara"],
    cases: 234,
    deaths: 22,
    lastUpdated: "2024-03-13",
    trend: "stable",
  },
  {
    id: "DA-004",
    disease: "COVID-19",
    severity: "Watch" as const,
    states: ["Lagos", "FCT", "Rivers", "Kaduna"],
    cases: 345,
    deaths: 8,
    lastUpdated: "2024-03-12",
    trend: "decreasing",
  },
  {
    id: "DA-005",
    disease: "Yellow Fever",
    severity: "Alert" as const,
    states: ["Bauchi", "Benue", "Delta", "Enugu"],
    cases: 156,
    deaths: 34,
    lastUpdated: "2024-03-14",
    trend: "increasing",
  },
  {
    id: "DA-006",
    disease: "Diphtheria",
    severity: "Alert" as const,
    states: ["Kano", "Katsina", "Jigawa"],
    cases: 578,
    deaths: 45,
    lastUpdated: "2024-03-15",
    trend: "increasing",
  },
];

// Disease Trend Data
export const diseaseTrendData = {
  malaria: [
    { month: "Jan", cases: 4200 },
    { month: "Feb", cases: 3800 },
    { month: "Mar", cases: 4500 },
    { month: "Apr", cases: 5200 },
    { month: "May", cases: 6100 },
    { month: "Jun", cases: 7800 },
    { month: "Jul", cases: 8200 },
    { month: "Aug", cases: 7500 },
    { month: "Sep", cases: 6800 },
    { month: "Oct", cases: 5500 },
    { month: "Nov", cases: 4800 },
    { month: "Dec", cases: 4100 },
  ],
  cholera: [
    { month: "Jan", cases: 120 },
    { month: "Feb", cases: 180 },
    { month: "Mar", cases: 350 },
    { month: "Apr", cases: 620 },
    { month: "May", cases: 1100 },
    { month: "Jun", cases: 1800 },
    { month: "Jul", cases: 2200 },
    { month: "Aug", cases: 1900 },
    { month: "Sep", cases: 1400 },
    { month: "Oct", cases: 900 },
    { month: "Nov", cases: 500 },
    { month: "Dec", cases: 250 },
  ],
  lassa: [
    { month: "Jan", cases: 180 },
    { month: "Feb", cases: 220 },
    { month: "Mar", cases: 195 },
    { month: "Apr", cases: 140 },
    { month: "May", cases: 85 },
    { month: "Jun", cases: 50 },
    { month: "Jul", cases: 35 },
    { month: "Aug", cases: 25 },
    { month: "Sep", cases: 20 },
    { month: "Oct", cases: 30 },
    { month: "Nov", cases: 65 },
    { month: "Dec", cases: 120 },
  ],
  covid: [
    { month: "Jan", cases: 450 },
    { month: "Feb", cases: 380 },
    { month: "Mar", cases: 320 },
    { month: "Apr", cases: 280 },
    { month: "May", cases: 220 },
    { month: "Jun", cases: 190 },
    { month: "Jul", cases: 250 },
    { month: "Aug", cases: 310 },
    { month: "Sep", cases: 280 },
    { month: "Oct", cases: 220 },
    { month: "Nov", cases: 180 },
    { month: "Dec", cases: 150 },
  ],
};

// Surveillance Reports
export const surveillanceReports = [
  {
    id: "SR-001",
    title: "Weekly Lassa Fever Situation Report - Week 11",
    author: "NCDC Surveillance Team",
    date: "2024-03-15",
    type: "Weekly Report",
    status: "Published",
  },
  {
    id: "SR-002",
    title: "Cholera Outbreak Response Update - Lagos State",
    author: "Lagos State Epidemiologist",
    date: "2024-03-14",
    type: "Outbreak Report",
    status: "Published",
  },
  {
    id: "SR-003",
    title: "Monthly Malaria Surveillance Summary - February 2024",
    author: "NMCP Data Team",
    date: "2024-03-10",
    type: "Monthly Report",
    status: "Published",
  },
  {
    id: "SR-004",
    title: "Diphtheria Outbreak Investigation Report - Kano State",
    author: "Kano State Epidemiologist",
    date: "2024-03-08",
    type: "Investigation Report",
    status: "Draft",
  },
  {
    id: "SR-005",
    title: "Yellow Fever Vaccination Campaign Monitoring Report",
    author: "NPHCDA Surveillance Unit",
    date: "2024-03-05",
    type: "Campaign Report",
    status: "Published",
  },
];

// Report Templates
export const reportTemplates = [
  {
    id: "RT-001",
    name: "Monthly Summary Report",
    description: "Comprehensive monthly overview of facility operations",
    frequency: "Monthly",
    lastGenerated: "2024-03-01",
    sections: ["Patient Statistics", "Staffing Summary", "Financial Overview", "Quality Metrics"],
  },
  {
    id: "RT-002",
    name: "Clinical Outcomes Report",
    description: "Analysis of patient outcomes and clinical quality indicators",
    frequency: "Quarterly",
    lastGenerated: "2024-01-15",
    sections: ["Mortality Rates", "Readmission Rates", "Infection Rates", "Patient Outcomes"],
  },
  {
    id: "RT-003",
    name: "Staffing Report",
    description: "Staffing levels, overtime, and workforce analytics",
    frequency: "Monthly",
    lastGenerated: "2024-03-01",
    sections: ["Staffing Levels", "Overtime Analysis", "Leave Management", "Cost Analysis"],
  },
  {
    id: "RT-004",
    name: "Infection Control Report",
    description: "Healthcare-associated infections and prevention metrics",
    frequency: "Monthly",
    lastGenerated: "2024-03-01",
    sections: ["HAI Rates", "Hand Hygiene Compliance", "Isolation Statistics", "Antimicrobial Stewardship"],
  },
];

// Generated Reports
export const generatedReports = [
  {
    id: "GR-001",
    title: "February 2024 Monthly Summary",
    template: "Monthly Summary Report",
    generatedBy: "Nurse Adaora Nwosu",
    date: "2024-03-01",
    period: "Feb 2024",
    format: "PDF",
    size: "2.4 MB",
  },
  {
    id: "GR-002",
    title: "Q4 2023 Clinical Outcomes",
    template: "Clinical Outcomes Report",
    generatedBy: "Dr. Ngozi Eze",
    date: "2024-01-15",
    period: "Oct-Dec 2023",
    format: "PDF",
    size: "4.8 MB",
  },
  {
    id: "GR-003",
    title: "February 2024 Staffing Report",
    template: "Staffing Report",
    generatedBy: "Admin Department",
    date: "2024-03-01",
    period: "Feb 2024",
    format: "CSV",
    size: "1.1 MB",
  },
  {
    id: "GR-004",
    title: "February 2024 Infection Control",
    template: "Infection Control Report",
    generatedBy: "Infection Control Unit",
    date: "2024-03-01",
    period: "Feb 2024",
    format: "PDF",
    size: "3.2 MB",
  },
  {
    id: "GR-005",
    title: "January 2024 Monthly Summary",
    template: "Monthly Summary Report",
    generatedBy: "Nurse Adaora Nwosu",
    date: "2024-02-01",
    period: "Jan 2024",
    format: "PDF",
    size: "2.1 MB",
  },
];
