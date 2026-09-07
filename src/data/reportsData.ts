import { StandardClass } from '../types';

// ============================================================================
// STAFF & FACULTY DATA
// ============================================================================

export interface StaffMember {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: 'Academic / Teaching' | 'Administration' | 'Transport' | 'Support Staff';
  qualification: string;
  subjectsHandled: string[];
  classesAssigned: string[];
  dateOfJoining: string;
  experienceYears: number;
  mobile: string;
  email: string;
  status: 'Active' | 'On Leave';
  basicSalary: number;
  hra: number;
  da: number;
  conveyance: number;
  specialAllowance: number;
  epfEligible: boolean;
  esiEligible: boolean;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
}

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'stf-001',
    employeeCode: 'EMP-001',
    name: 'R. Saravanan',
    designation: 'Headmaster & Correspondent',
    department: 'Administration',
    qualification: 'M.A., M.Ed., M.Phil.',
    subjectsHandled: ['School Administration', 'Moral Science', 'Social Studies'],
    classesAssigned: ['4STD', '5STD'],
    dateOfJoining: '2014-06-01',
    experienceYears: 18,
    mobile: '9176593129',
    email: 'wisdomrs.tamil@gmail.com',
    status: 'Active',
    basicSalary: 32000,
    hra: 6400,
    da: 4800,
    conveyance: 2500,
    specialAllowance: 4500,
    epfEligible: true,
    esiEligible: false,
    bankName: 'HDFC Bank',
    accountNo: '50100234981240',
    ifscCode: 'HDFC0001245',
    panNumber: 'ABCPS1234F',
    uanNumber: '100456789012',
  },
  {
    id: 'stf-002',
    employeeCode: 'EMP-002',
    name: 'K. Meenakshi',
    designation: 'Senior Tamil Teacher & Academic In-charge',
    department: 'Academic / Teaching',
    qualification: 'M.A. (Tamil), B.Ed.',
    subjectsHandled: ['Tamil Literature', 'Tamil Grammar', 'Moral Science'],
    classesAssigned: ['3STD', '4STD', '5STD'],
    dateOfJoining: '2017-06-12',
    experienceYears: 12,
    mobile: '9841238901',
    email: 'meenakshi.k@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 22500,
    hra: 4500,
    da: 3375,
    conveyance: 1500,
    specialAllowance: 2000,
    epfEligible: true,
    esiEligible: false,
    bankName: 'State Bank of India',
    accountNo: '30491823901',
    ifscCode: 'SBIN0001048',
    panNumber: 'ABMPM4567G',
    uanNumber: '100456789013',
  },
  {
    id: 'stf-003',
    employeeCode: 'EMP-003',
    name: 'S. Priya Dharshini',
    designation: 'Primary English Teacher',
    department: 'Academic / Teaching',
    qualification: 'M.A. (English), B.Ed.',
    subjectsHandled: ['English Prose & Poetry', 'Grammar', 'Spoken English & Phonics'],
    classesAssigned: ['1STD', '2STD', '3STD'],
    dateOfJoining: '2019-06-03',
    experienceYears: 8,
    mobile: '9790451234',
    email: 'priya.s@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 19500,
    hra: 3900,
    da: 2925,
    conveyance: 1200,
    specialAllowance: 1500,
    epfEligible: true,
    esiEligible: true,
    bankName: 'Indian Overseas Bank',
    accountNo: '142001000049281',
    ifscCode: 'IOBA0001420',
    panNumber: 'ALRPD8901K',
    uanNumber: '100456789014',
  },
  {
    id: 'stf-004',
    employeeCode: 'EMP-004',
    name: 'V. Anandhakumar',
    designation: 'Mathematics & Vedic Maths Faculty',
    department: 'Academic / Teaching',
    qualification: 'M.Sc. (Maths), B.Ed.',
    subjectsHandled: ['Mathematics', 'Mental Maths', 'Analytical Reasoning'],
    classesAssigned: ['3STD', '4STD', '5STD'],
    dateOfJoining: '2018-07-15',
    experienceYears: 9,
    mobile: '9443219087',
    email: 'anand.v@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 21000,
    hra: 4200,
    da: 3150,
    conveyance: 1400,
    specialAllowance: 1800,
    epfEligible: true,
    esiEligible: true,
    bankName: 'Canara Bank',
    accountNo: '1240101004829',
    ifscCode: 'CNRB0001240',
    panNumber: 'AKUPA2345L',
    uanNumber: '100456789015',
  },
  {
    id: 'stf-005',
    employeeCode: 'EMP-005',
    name: 'N. Rajeshwari',
    designation: 'Science & Environmental Studies Teacher',
    department: 'Academic / Teaching',
    qualification: 'B.Sc. (Botany), B.Ed.',
    subjectsHandled: ['General Science', 'EVS', 'Nature Study & Gardening'],
    classesAssigned: ['1STD', '2STD', '4STD'],
    dateOfJoining: '2020-01-08',
    experienceYears: 6,
    mobile: '9840982345',
    email: 'rajeshwari.n@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 18000,
    hra: 3600,
    da: 2700,
    conveyance: 1200,
    specialAllowance: 1200,
    epfEligible: true,
    esiEligible: true,
    bankName: 'HDFC Bank',
    accountNo: '50100349182741',
    ifscCode: 'HDFC0001245',
    panNumber: 'ANRPN6789M',
    uanNumber: '100456789016',
  },
  {
    id: 'stf-006',
    employeeCode: 'EMP-006',
    name: 'M. Sumathi',
    designation: 'Kindergarten & Montessori Head (LKG / UKG)',
    department: 'Academic / Teaching',
    qualification: 'D.T.Ed., Montessori Diploma',
    subjectsHandled: ['Rhymes & Storytelling', 'Tamil & English Alphabets', 'Activity Corner'],
    classesAssigned: ['LKG', 'UKG'],
    dateOfJoining: '2016-06-01',
    experienceYears: 11,
    mobile: '9789123456',
    email: 'sumathi.m@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 17500,
    hra: 3500,
    da: 2625,
    conveyance: 1000,
    specialAllowance: 1500,
    epfEligible: true,
    esiEligible: true,
    bankName: 'State Bank of India',
    accountNo: '30891274619',
    ifscCode: 'SBIN0001048',
    panNumber: 'AVPSM1234N',
    uanNumber: '100456789017',
  },
  {
    id: 'stf-007',
    employeeCode: 'EMP-007',
    name: 'G. Bhuvaneshwari',
    designation: 'Assistant Kindergarten Teacher & Art Master',
    department: 'Academic / Teaching',
    qualification: 'D.T.Ed., Fine Arts Cert.',
    subjectsHandled: ['Drawing & Colouring', 'Clay Modelling', 'Handwriting & Phonics'],
    classesAssigned: ['LKG', 'UKG', '1STD'],
    dateOfJoining: '2021-09-01',
    experienceYears: 4,
    mobile: '9677890123',
    email: 'bhuvi.g@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 14500,
    hra: 2900,
    da: 2175,
    conveyance: 1000,
    specialAllowance: 1000,
    epfEligible: true,
    esiEligible: true,
    bankName: 'Indian Bank',
    accountNo: '648912340192',
    ifscCode: 'IDIB000E021',
    panNumber: 'AGRPB5678P',
    uanNumber: '100456789018',
  },
  {
    id: 'stf-008',
    employeeCode: 'EMP-008',
    name: 'P. Murugan',
    designation: 'Physical Education Teacher & Yoga Instructor',
    department: 'Academic / Teaching',
    qualification: 'B.P.Ed., Yoga Diploma',
    subjectsHandled: ['Physical Education', 'Athletics & Games', 'Morning Drill & Yoga'],
    classesAssigned: ['All Classes (LKG - 5STD)'],
    dateOfJoining: '2019-06-15',
    experienceYears: 7,
    mobile: '9444567890',
    email: 'murugan.pe@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 17000,
    hra: 3400,
    da: 2550,
    conveyance: 1200,
    specialAllowance: 1000,
    epfEligible: true,
    esiEligible: true,
    bankName: 'Canara Bank',
    accountNo: '1240101009182',
    ifscCode: 'CNRB0001240',
    panNumber: 'APMPM9012Q',
    uanNumber: '100456789019',
  },
  {
    id: 'stf-009',
    employeeCode: 'EMP-009',
    name: 'C. Venkatesan',
    designation: 'Senior School Van Driver & Fleet In-charge',
    department: 'Transport',
    qualification: 'SSLC, Heavy Vehicle Transport License',
    subjectsHandled: ['Student Transportation - Route 1 & 2', 'Van Maintenance Log'],
    classesAssigned: ['School Van Routes 1, 2, 3'],
    dateOfJoining: '2015-06-01',
    experienceYears: 14,
    mobile: '9840192837',
    email: 'transport@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 16000,
    hra: 3200,
    da: 2400,
    conveyance: 2000,
    specialAllowance: 1000,
    epfEligible: true,
    esiEligible: true,
    bankName: 'State Bank of India',
    accountNo: '20194819284',
    ifscCode: 'SBIN0001048',
    panNumber: 'ACUPV3456R',
    uanNumber: '100456789020',
  },
  {
    id: 'stf-010',
    employeeCode: 'EMP-010',
    name: 'E. Balaji',
    designation: 'School Van Driver - Route 3 (Bypass & Outer)',
    department: 'Transport',
    qualification: 'SSLC, Heavy Transport Badge',
    subjectsHandled: ['Student Transportation - Route 3', 'Pre-Trip Vehicle Inspection'],
    classesAssigned: ['School Van Route 3'],
    dateOfJoining: '2022-06-10',
    experienceYears: 5,
    mobile: '9789012345',
    email: 'van2@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 14000,
    hra: 2800,
    da: 2100,
    conveyance: 1500,
    specialAllowance: 800,
    epfEligible: true,
    esiEligible: true,
    bankName: 'Indian Bank',
    accountNo: '648919482910',
    ifscCode: 'IDIB000E021',
    panNumber: 'AEBPB7890S',
    uanNumber: '100456789021',
  },
  {
    id: 'stf-011',
    employeeCode: 'EMP-011',
    name: 'A. Sivakumar',
    designation: 'Accounts Clerk & Office Administrator',
    department: 'Administration',
    qualification: 'B.Com, Tally ERP, Office Automation',
    subjectsHandled: ['Fee Counter', 'Receipt Maintenance', 'Government Documentation'],
    classesAssigned: ['School Office'],
    dateOfJoining: '2019-11-01',
    experienceYears: 6,
    mobile: '9940123987',
    email: 'accounts@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 16500,
    hra: 3300,
    da: 2475,
    conveyance: 1200,
    specialAllowance: 1200,
    epfEligible: true,
    esiEligible: true,
    bankName: 'HDFC Bank',
    accountNo: '50100481928491',
    ifscCode: 'HDFC0001245',
    panNumber: 'ASPSA1234T',
    uanNumber: '100456789022',
  },
  {
    id: 'stf-012',
    employeeCode: 'EMP-012',
    name: 'T. Kannammal',
    designation: 'Senior Ayah, Kindergarten Caretaker & First Aider',
    department: 'Support Staff',
    qualification: '8th Standard Pass, Child Care & First Aid Training',
    subjectsHandled: ['KG Classroom Support', 'Child Safety & Cleanliness', 'Dining Support'],
    classesAssigned: ['LKG', 'UKG'],
    dateOfJoining: '2015-06-01',
    experienceYears: 10,
    mobile: '9600123456',
    email: 'support@wisdomessur.edu.in',
    status: 'Active',
    basicSalary: 11000,
    hra: 2200,
    da: 1650,
    conveyance: 800,
    specialAllowance: 600,
    epfEligible: true,
    esiEligible: true,
    bankName: 'State Bank of India',
    accountNo: '20491829104',
    ifscCode: 'SBIN0001048',
    panNumber: 'ATKPK5678U',
    uanNumber: '100456789023',
  },
];

// ============================================================================
// ATTENDANCE DATA
// ============================================================================

export interface ClassAttendanceSummary {
  standard: string;
  section: string;
  classTeacher: string;
  totalStudents: number;
  workingDays: number;
  totalPresentCount: number;
  totalAbsentCount: number;
  attendancePercent: number;
  boysPercent: number;
  girlsPercent: number;
  topAttenders: string[];
  chronicAbsentees: string[];
}

export const INITIAL_CLASS_ATTENDANCE: ClassAttendanceSummary[] = [
  {
    standard: 'LKG',
    section: 'A',
    classTeacher: 'M. Sumathi',
    totalStudents: 18,
    workingDays: 24,
    totalPresentCount: 406,
    totalAbsentCount: 26,
    attendancePercent: 94.0,
    boysPercent: 93.5,
    girlsPercent: 94.6,
    topAttenders: ['Kavin Kumar S', 'Dharshini R', 'Vikramadityan S'],
    chronicAbsentees: ['Rithvik N (Medical leave)'],
  },
  {
    standard: 'UKG',
    section: 'A',
    classTeacher: 'G. Bhuvaneshwari',
    totalStudents: 22,
    workingDays: 24,
    totalPresentCount: 504,
    totalAbsentCount: 24,
    attendancePercent: 95.5,
    boysPercent: 95.2,
    girlsPercent: 95.8,
    topAttenders: ['Aadhavan M', 'Subhiksha R', 'Pranesh G'],
    chronicAbsentees: ['Karthik P (Out of station)'],
  },
  {
    standard: '1STD',
    section: 'A',
    classTeacher: 'S. Priya Dharshini',
    totalStudents: 24,
    workingDays: 24,
    totalPresentCount: 548,
    totalAbsentCount: 28,
    attendancePercent: 95.1,
    boysPercent: 94.8,
    girlsPercent: 95.5,
    topAttenders: ['Keerthana V', 'Sanjay Kumar R', 'Pranav K'],
    chronicAbsentees: [],
  },
  {
    standard: '2STD',
    section: 'A',
    classTeacher: 'N. Rajeshwari',
    totalStudents: 20,
    workingDays: 24,
    totalPresentCount: 462,
    totalAbsentCount: 18,
    attendancePercent: 96.3,
    boysPercent: 96.0,
    girlsPercent: 96.5,
    topAttenders: ['Manoj K', 'Pooja S', 'Nithilan M'],
    chronicAbsentees: ['Yazhini B (Chickenpox)'],
  },
  {
    standard: '3STD',
    section: 'A',
    classTeacher: 'V. Anandhakumar',
    totalStudents: 21,
    workingDays: 24,
    totalPresentCount: 489,
    totalAbsentCount: 15,
    attendancePercent: 97.0,
    boysPercent: 96.8,
    girlsPercent: 97.2,
    topAttenders: ['Akilan V', 'Janani T', 'Gokulnath R'],
    chronicAbsentees: [],
  },
  {
    standard: '4STD',
    section: 'A',
    classTeacher: 'K. Meenakshi',
    totalStudents: 19,
    workingDays: 24,
    totalPresentCount: 440,
    totalAbsentCount: 16,
    attendancePercent: 96.5,
    boysPercent: 96.2,
    girlsPercent: 96.8,
    topAttenders: ['Naveen Prasath S', 'Ananya R', 'Deepak K'],
    chronicAbsentees: [],
  },
  {
    standard: '5STD',
    section: 'A',
    classTeacher: 'R. Saravanan',
    totalStudents: 21,
    workingDays: 24,
    totalPresentCount: 494,
    totalAbsentCount: 10,
    attendancePercent: 98.0,
    boysPercent: 97.8,
    girlsPercent: 98.2,
    topAttenders: ['Tharun K', 'Sivasankari M', 'Surya Narayanan V'],
    chronicAbsentees: [],
  },
];

export interface StaffAttendanceRecord {
  staffId: string;
  employeeCode: string;
  name: string;
  designation: string;
  workingDays: number;
  presentDays: number;
  leavesTaken: number;
  halfDays: number;
  onDutyDays: number;
  attendancePercent: number;
  punctualityScore: 'Excellent' | 'Good' | 'Fair';
}

export const INITIAL_STAFF_ATTENDANCE: StaffAttendanceRecord[] = [
  { staffId: 'stf-001', employeeCode: 'EMP-001', name: 'R. Saravanan', designation: 'Headmaster', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 2, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-002', employeeCode: 'EMP-002', name: 'K. Meenakshi', designation: 'Sr. Tamil Teacher', workingDays: 24, presentDays: 23, leavesTaken: 1, halfDays: 0, onDutyDays: 0, attendancePercent: 95.8, punctualityScore: 'Excellent' },
  { staffId: 'stf-003', employeeCode: 'EMP-003', name: 'S. Priya Dharshini', designation: 'English Teacher', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 0, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-004', employeeCode: 'EMP-004', name: 'V. Anandhakumar', designation: 'Maths Teacher', workingDays: 24, presentDays: 23.5, leavesTaken: 0.5, halfDays: 1, onDutyDays: 0, attendancePercent: 97.9, punctualityScore: 'Good' },
  { staffId: 'stf-005', employeeCode: 'EMP-005', name: 'N. Rajeshwari', designation: 'Science Teacher', workingDays: 24, presentDays: 22, leavesTaken: 2, halfDays: 0, onDutyDays: 0, attendancePercent: 91.7, punctualityScore: 'Good' },
  { staffId: 'stf-006', employeeCode: 'EMP-006', name: 'M. Sumathi', designation: 'KG Head', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 0, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-007', employeeCode: 'EMP-007', name: 'G. Bhuvaneshwari', designation: 'Asst. KG Teacher', workingDays: 24, presentDays: 23, leavesTaken: 1, halfDays: 0, onDutyDays: 0, attendancePercent: 95.8, punctualityScore: 'Good' },
  { staffId: 'stf-008', employeeCode: 'EMP-008', name: 'P. Murugan', designation: 'PET Master', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 1, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-009', employeeCode: 'EMP-009', name: 'C. Venkatesan', designation: 'Van Driver (Fleet In-charge)', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 0, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-010', employeeCode: 'EMP-010', name: 'E. Balaji', designation: 'Van Driver 2', workingDays: 24, presentDays: 23, leavesTaken: 1, halfDays: 0, onDutyDays: 0, attendancePercent: 95.8, punctualityScore: 'Good' },
  { staffId: 'stf-011', employeeCode: 'EMP-011', name: 'A. Sivakumar', designation: 'Accounts Clerk', workingDays: 24, presentDays: 24, leavesTaken: 0, halfDays: 0, onDutyDays: 0, attendancePercent: 100, punctualityScore: 'Excellent' },
  { staffId: 'stf-012', employeeCode: 'EMP-012', name: 'T. Kannammal', designation: 'Ayah & First Aider', workingDays: 24, presentDays: 23, leavesTaken: 1, halfDays: 0, onDutyDays: 0, attendancePercent: 95.8, punctualityScore: 'Good' },
];

export interface DailyAttendanceDetail {
  id: string;
  rollNo: string;
  admissionNo: string;
  studentName: string;
  standard: string;
  section: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  reason?: string;
  parentPhone: string;
  notifiedWhatsApp: boolean;
}

export const INITIAL_DAILY_STUDENT_ATTENDANCE: DailyAttendanceDetail[] = [
  { id: 'att-1', rollNo: '01', admissionNo: 'WIS-2024-001', studentName: 'Kavin Kumar S', standard: 'LKG', section: 'A', status: 'Present', parentPhone: '9840123456', notifiedWhatsApp: false },
  { id: 'att-2', rollNo: '02', admissionNo: 'WIS-2024-002', studentName: 'Dharshini R', standard: 'LKG', section: 'A', status: 'Present', parentPhone: '9444156789', notifiedWhatsApp: false },
  { id: 'att-3', rollNo: '03', admissionNo: 'WIS-2024-007', studentName: 'Vikramadityan S', standard: 'LKG', section: 'A', status: 'Present', parentPhone: '9840918273', notifiedWhatsApp: false },
  { id: 'att-4', rollNo: '04', admissionNo: 'WIS-2024-008', studentName: 'Rithvik N', standard: 'LKG', section: 'A', status: 'Absent', reason: 'Viral fever / Sick leave', parentPhone: '9789012345', notifiedWhatsApp: true },
  { id: 'att-5', rollNo: '01', admissionNo: 'WIS-2024-003', studentName: 'Aadhavan M', standard: 'UKG', section: 'A', status: 'Present', parentPhone: '9840234567', notifiedWhatsApp: false },
  { id: 'att-6', rollNo: '02', admissionNo: 'WIS-2024-004', studentName: 'Subhiksha R', standard: 'UKG', section: 'A', status: 'Present', parentPhone: '9790345678', notifiedWhatsApp: false },
  { id: 'att-7', rollNo: '03', admissionNo: 'WIS-2024-009', studentName: 'Karthik P', standard: 'UKG', section: 'A', status: 'Absent', reason: 'Family temple function at Tiruvannamalai', parentPhone: '9444987654', notifiedWhatsApp: true },
  { id: 'att-8', rollNo: '01', admissionNo: 'WIS-2024-005', studentName: 'Keerthana V', standard: '1STD', section: 'A', status: 'Present', parentPhone: '9841456789', notifiedWhatsApp: false },
  { id: 'att-9', rollNo: '02', admissionNo: 'WIS-2024-006', studentName: 'Sanjay Kumar R', standard: '1STD', section: 'A', status: 'Present', parentPhone: '9444567890', notifiedWhatsApp: false },
  { id: 'att-10', rollNo: '03', admissionNo: 'WIS-2024-010', studentName: 'Pranav K', standard: '1STD', section: 'A', status: 'Late', reason: 'Heavy rain traffic on Madurantakam road', parentPhone: '9840112233', notifiedWhatsApp: false },
  { id: 'att-11', rollNo: '01', admissionNo: 'WIS-2024-011', studentName: 'Manoj K', standard: '2STD', section: 'A', status: 'Present', parentPhone: '9840223344', notifiedWhatsApp: false },
  { id: 'att-12', rollNo: '02', admissionNo: 'WIS-2024-012', studentName: 'Yazhini B', standard: '2STD', section: 'A', status: 'Absent', reason: 'Chickenpox recovery period', parentPhone: '9444334455', notifiedWhatsApp: true },
  { id: 'att-13', rollNo: '01', admissionNo: 'WIS-2024-013', studentName: 'Akilan V', standard: '3STD', section: 'A', status: 'Present', parentPhone: '9840445566', notifiedWhatsApp: false },
  { id: 'att-14', rollNo: '02', admissionNo: 'WIS-2024-014', studentName: 'Janani T', standard: '3STD', section: 'A', status: 'Present', parentPhone: '9790556677', notifiedWhatsApp: false },
  { id: 'att-15', rollNo: '01', admissionNo: 'WIS-2024-015', studentName: 'Naveen Prasath S', standard: '4STD', section: 'A', status: 'Present', parentPhone: '9841667788', notifiedWhatsApp: false },
  { id: 'att-16', rollNo: '02', admissionNo: 'WIS-2024-016', studentName: 'Ananya R', standard: '4STD', section: 'A', status: 'Present', parentPhone: '9444778899', notifiedWhatsApp: false },
  { id: 'att-17', rollNo: '01', admissionNo: 'WIS-2024-017', studentName: 'Tharun K', standard: '5STD', section: 'A', status: 'Present', parentPhone: '9840889900', notifiedWhatsApp: false },
  { id: 'att-18', rollNo: '02', admissionNo: 'WIS-2024-018', studentName: 'Sivasankari M', standard: '5STD', section: 'A', status: 'Present', parentPhone: '9790990011', notifiedWhatsApp: false },
];

// ============================================================================
// EXAM & ACADEMIC DATA
// ============================================================================

export interface SubjectScore {
  subject: string;
  totalMarks: number;
  highestMarks: number;
  averageMarks: number;
  passPercentage: number;
}

export interface ClassExamAnalysis {
  standard: string;
  section: string;
  examTerm: string;
  totalEnrolled: number;
  totalAppeared: number;
  totalPassed: number;
  passPercentage: number;
  distinctionCount: number; // >= 90%
  firstClassCount: number;   // 75% - 89%
  secondClassCount: number;  // 60% - 74%
  thirdClassCount: number;   // 40% - 59%
  failCount: number;         // < 40%
  classAverageMarks: number;
  highestClassScore: number;
  lowestClassScore: number;
  subjects: SubjectScore[];
}

export const INITIAL_EXAM_ANALYSIS: ClassExamAnalysis[] = [
  {
    standard: '1STD',
    section: 'A',
    examTerm: 'Term 1 / Quarterly Examination 2024',
    totalEnrolled: 24,
    totalAppeared: 24,
    totalPassed: 24,
    passPercentage: 100,
    distinctionCount: 14,
    firstClassCount: 8,
    secondClassCount: 2,
    thirdClassCount: 0,
    failCount: 0,
    classAverageMarks: 86.4,
    highestClassScore: 98.0,
    lowestClassScore: 68.0,
    subjects: [
      { subject: 'Tamil', totalMarks: 100, highestMarks: 99, averageMarks: 88.5, passPercentage: 100 },
      { subject: 'English', totalMarks: 100, highestMarks: 98, averageMarks: 85.0, passPercentage: 100 },
      { subject: 'Mathematics', totalMarks: 100, highestMarks: 100, averageMarks: 89.2, passPercentage: 100 },
      { subject: 'Environmental Studies', totalMarks: 100, highestMarks: 96, averageMarks: 83.0, passPercentage: 100 },
    ],
  },
  {
    standard: '2STD',
    section: 'A',
    examTerm: 'Term 1 / Quarterly Examination 2024',
    totalEnrolled: 20,
    totalAppeared: 20,
    totalPassed: 20,
    passPercentage: 100,
    distinctionCount: 11,
    firstClassCount: 7,
    secondClassCount: 2,
    thirdClassCount: 0,
    failCount: 0,
    classAverageMarks: 84.8,
    highestClassScore: 97.5,
    lowestClassScore: 65.0,
    subjects: [
      { subject: 'Tamil', totalMarks: 100, highestMarks: 98, averageMarks: 86.0, passPercentage: 100 },
      { subject: 'English', totalMarks: 100, highestMarks: 96, averageMarks: 82.5, passPercentage: 100 },
      { subject: 'Mathematics', totalMarks: 100, highestMarks: 99, averageMarks: 88.0, passPercentage: 100 },
      { subject: 'Environmental Studies', totalMarks: 100, highestMarks: 97, averageMarks: 82.8, passPercentage: 100 },
    ],
  },
  {
    standard: '3STD',
    section: 'A',
    examTerm: 'Term 1 / Quarterly Examination 2024',
    totalEnrolled: 21,
    totalAppeared: 21,
    totalPassed: 20,
    passPercentage: 95.2,
    distinctionCount: 10,
    firstClassCount: 8,
    secondClassCount: 2,
    thirdClassCount: 1,
    failCount: 0,
    classAverageMarks: 83.5,
    highestClassScore: 98.4,
    lowestClassScore: 58.0,
    subjects: [
      { subject: 'Tamil', totalMarks: 100, highestMarks: 98, averageMarks: 84.5, passPercentage: 100 },
      { subject: 'English', totalMarks: 100, highestMarks: 96, averageMarks: 81.0, passPercentage: 95.2 },
      { subject: 'Mathematics', totalMarks: 100, highestMarks: 100, averageMarks: 86.8, passPercentage: 100 },
      { subject: 'Science', totalMarks: 100, highestMarks: 99, averageMarks: 82.4, passPercentage: 100 },
      { subject: 'Social Science', totalMarks: 100, highestMarks: 99, averageMarks: 82.8, passPercentage: 100 },
    ],
  },
  {
    standard: '4STD',
    section: 'A',
    examTerm: 'Term 1 / Quarterly Examination 2024',
    totalEnrolled: 19,
    totalAppeared: 19,
    totalPassed: 19,
    passPercentage: 100,
    distinctionCount: 9,
    firstClassCount: 7,
    secondClassCount: 3,
    thirdClassCount: 0,
    failCount: 0,
    classAverageMarks: 82.9,
    highestClassScore: 97.2,
    lowestClassScore: 62.0,
    subjects: [
      { subject: 'Tamil', totalMarks: 100, highestMarks: 97, averageMarks: 84.0, passPercentage: 100 },
      { subject: 'English', totalMarks: 100, highestMarks: 95, averageMarks: 80.5, passPercentage: 100 },
      { subject: 'Mathematics', totalMarks: 100, highestMarks: 99, averageMarks: 85.6, passPercentage: 100 },
      { subject: 'Science', totalMarks: 100, highestMarks: 98, averageMarks: 81.8, passPercentage: 100 },
      { subject: 'Social Science', totalMarks: 100, highestMarks: 97, averageMarks: 82.5, passPercentage: 100 },
    ],
  },
  {
    standard: '5STD',
    section: 'A',
    examTerm: 'Term 1 / Quarterly Examination 2024',
    totalEnrolled: 21,
    totalAppeared: 21,
    totalPassed: 21,
    passPercentage: 100,
    distinctionCount: 12,
    firstClassCount: 8,
    secondClassCount: 1,
    thirdClassCount: 0,
    failCount: 0,
    classAverageMarks: 87.1,
    highestClassScore: 99.2,
    lowestClassScore: 66.0,
    subjects: [
      { subject: 'Tamil', totalMarks: 100, highestMarks: 99, averageMarks: 89.2, passPercentage: 100 },
      { subject: 'English', totalMarks: 100, highestMarks: 98, averageMarks: 84.8, passPercentage: 100 },
      { subject: 'Mathematics', totalMarks: 100, highestMarks: 100, averageMarks: 89.5, passPercentage: 100 },
      { subject: 'Science', totalMarks: 100, highestMarks: 99, averageMarks: 86.4, passPercentage: 100 },
      { subject: 'Social Science', totalMarks: 100, highestMarks: 100, averageMarks: 85.8, passPercentage: 100 },
    ],
  },
];

export interface ExamTopper {
  rank: 1 | 2 | 3;
  standard: string;
  section: string;
  studentName: string;
  admissionNo: string;
  rollNo: string;
  totalMarksScored: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  parentName: string;
  photoUrl?: string;
}

export const INITIAL_TOPPERS: ExamTopper[] = [
  // 5STD Toppers
  { rank: 1, standard: '5STD', section: 'A', studentName: 'Tharun K', admissionNo: 'WIS-2024-017', rollNo: '01', totalMarksScored: 496, maxMarks: 500, percentage: 99.2, grade: 'A+ (Distinction)', parentName: 'Karthikeyan P' },
  { rank: 2, standard: '5STD', section: 'A', studentName: 'Sivasankari M', admissionNo: 'WIS-2024-018', rollNo: '02', totalMarksScored: 489, maxMarks: 500, percentage: 97.8, grade: 'A+ (Distinction)', parentName: 'Muruganandam S' },
  { rank: 3, standard: '5STD', section: 'A', studentName: 'Surya Narayanan V', admissionNo: 'WIS-2024-019', rollNo: '03', totalMarksScored: 481, maxMarks: 500, percentage: 96.2, grade: 'A+ (Distinction)', parentName: 'Venkatesan R' },
  // 4STD Toppers
  { rank: 1, standard: '4STD', section: 'A', studentName: 'Ananya R', admissionNo: 'WIS-2024-016', rollNo: '02', totalMarksScored: 486, maxMarks: 500, percentage: 97.2, grade: 'A+ (Distinction)', parentName: 'Ramesh Babu' },
  { rank: 2, standard: '4STD', section: 'A', studentName: 'Naveen Prasath S', admissionNo: 'WIS-2024-015', rollNo: '01', totalMarksScored: 480, maxMarks: 500, percentage: 96.0, grade: 'A+ (Distinction)', parentName: 'Saravanan M' },
  { rank: 3, standard: '4STD', section: 'A', studentName: 'Deepak K', admissionNo: 'WIS-2024-020', rollNo: '03', totalMarksScored: 474, maxMarks: 500, percentage: 94.8, grade: 'A+ (Distinction)', parentName: 'Krishnamoorthy' },
  // 3STD Toppers
  { rank: 1, standard: '3STD', section: 'A', studentName: 'Akilan V', admissionNo: 'WIS-2024-013', rollNo: '01', totalMarksScored: 492, maxMarks: 500, percentage: 98.4, grade: 'A+ (Distinction)', parentName: 'Vijay Anand' },
  { rank: 2, standard: '3STD', section: 'A', studentName: 'Janani T', admissionNo: 'WIS-2024-014', rollNo: '02', totalMarksScored: 484, maxMarks: 500, percentage: 96.8, grade: 'A+ (Distinction)', parentName: 'Thirunavukkarasu' },
  { rank: 3, standard: '3STD', section: 'A', studentName: 'Gokulnath R', admissionNo: 'WIS-2024-021', rollNo: '03', totalMarksScored: 472, maxMarks: 500, percentage: 94.4, grade: 'A+ (Distinction)', parentName: 'Rajendran P' },
  // 2STD Toppers
  { rank: 1, standard: '2STD', section: 'A', studentName: 'Pooja S', admissionNo: 'WIS-2024-022', rollNo: '02', totalMarksScored: 390, maxMarks: 400, percentage: 97.5, grade: 'A+ (Distinction)', parentName: 'Sivakumar N' },
  { rank: 2, standard: '2STD', section: 'A', studentName: 'Manoj K', admissionNo: 'WIS-2024-011', rollNo: '01', totalMarksScored: 384, maxMarks: 400, percentage: 96.0, grade: 'A+ (Distinction)', parentName: 'Kumaraguru' },
  { rank: 3, standard: '2STD', section: 'A', studentName: 'Nithilan M', admissionNo: 'WIS-2024-023', rollNo: '03', totalMarksScored: 376, maxMarks: 400, percentage: 94.0, grade: 'A+ (Distinction)', parentName: 'Manikandan E' },
  // 1STD Toppers
  { rank: 1, standard: '1STD', section: 'A', studentName: 'Keerthana V', admissionNo: 'WIS-2024-005', rollNo: '01', totalMarksScored: 392, maxMarks: 400, percentage: 98.0, grade: 'A+ (Distinction)', parentName: 'Venkatesan G' },
  { rank: 2, standard: '1STD', section: 'A', studentName: 'Sanjay Kumar R', admissionNo: 'WIS-2024-006', rollNo: '02', totalMarksScored: 388, maxMarks: 400, percentage: 97.0, grade: 'A+ (Distinction)', parentName: 'Ravichandran' },
  { rank: 3, standard: '1STD', section: 'A', studentName: 'Pranav K', admissionNo: 'WIS-2024-010', rollNo: '03', totalMarksScored: 381, maxMarks: 400, percentage: 95.2, grade: 'A+ (Distinction)', parentName: 'Kannan M' },
];

// ============================================================================
// LIBRARY DATA
// ============================================================================

export interface LibraryBook {
  accessionNo: string;
  title: string;
  author: string;
  category: 'Tamil Literature' | 'Moral Science & Stories' | 'Science & Nature' | 'Mathematics Puzzles' | 'General Knowledge & Encyclopedias' | 'English Readers & Phonics' | 'Teacher References';
  language: 'Tamil' | 'English' | 'Bilingual';
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  price: number;
  editionYear: string;
}

export const INITIAL_LIBRARY_CATALOG: LibraryBook[] = [
  { accessionNo: 'LIB-001', title: 'Thirukkural Kathaigal (திருக்குறள் நீதிக் கதைகள்)', author: 'Kavingar Azha. Valliappa', category: 'Tamil Literature', language: 'Tamil', shelfLocation: 'Rack A - Shelf 1', totalCopies: 8, availableCopies: 5, price: 180, editionYear: '2022' },
  { accessionNo: 'LIB-002', title: 'Panchatantra Fables (Complete Illustrated)', author: 'Pandit Vishnu Sharma', category: 'Moral Science & Stories', language: 'Bilingual', shelfLocation: 'Rack A - Shelf 2', totalCopies: 10, availableCopies: 6, price: 250, editionYear: '2023' },
  { accessionNo: 'LIB-003', title: 'Tenali Raman Funny & Clever Tales (தெனாலிராமன் கதைகள்)', author: 'Thooran', category: 'Moral Science & Stories', language: 'Tamil', shelfLocation: 'Rack A - Shelf 3', totalCopies: 6, availableCopies: 2, price: 150, editionYear: '2021' },
  { accessionNo: 'LIB-004', title: 'Wings of Fire - Illustrated Student Edition', author: 'Dr. A.P.J. Abdul Kalam', category: 'General Knowledge & Encyclopedias', language: 'English', shelfLocation: 'Rack B - Shelf 1', totalCopies: 12, availableCopies: 7, price: 320, editionYear: '2022' },
  { accessionNo: 'LIB-005', title: 'Children’s Illustrated Science Wonder Book', author: 'Dr. N. Pitchamuthu', category: 'Science & Nature', language: 'Bilingual', shelfLocation: 'Rack B - Shelf 2', totalCopies: 8, availableCopies: 4, price: 380, editionYear: '2023' },
  { accessionNo: 'LIB-006', title: 'Fun with Vedic Mathematics for Kids', author: 'R. K. Sridharan', category: 'Mathematics Puzzles', language: 'English', shelfLocation: 'Rack B - Shelf 3', totalCopies: 5, availableCopies: 3, price: 220, editionYear: '2022' },
  { accessionNo: 'LIB-007', title: 'Aesop’s Fables with Colourful Visuals', author: 'Aesop / Retold by Ruskin Bond', category: 'English Readers & Phonics', language: 'English', shelfLocation: 'Rack C - Shelf 1', totalCopies: 10, availableCopies: 6, price: 190, editionYear: '2023' },
  { accessionNo: 'LIB-008', title: 'Bharathiyar Padalgal for Children (பாரதியார் மழலைப்பாடல்கள்)', author: 'Mahakavi Subramania Bharati', category: 'Tamil Literature', language: 'Tamil', shelfLocation: 'Rack A - Shelf 1', totalCopies: 15, availableCopies: 11, price: 120, editionYear: '2020' },
  { accessionNo: 'LIB-009', title: 'Amazing World Animals & Birds Guide', author: 'National Geographic Kids India', category: 'Science & Nature', language: 'English', shelfLocation: 'Rack B - Shelf 2', totalCopies: 6, availableCopies: 2, price: 450, editionYear: '2023' },
  { accessionNo: 'LIB-010', title: 'Birbal the Wise - 50 Wit Stories', author: 'Anant Pai (Amar Chitra Katha)', category: 'Moral Science & Stories', language: 'English', shelfLocation: 'Rack C - Shelf 2', totalCopies: 8, availableCopies: 4, price: 240, editionYear: '2022' },
  { accessionNo: 'LIB-011', title: 'Oxford Primary Illustrated School Dictionary', author: 'Oxford University Press', category: 'Teacher References', language: 'English', shelfLocation: 'Reference Desk - Ref 1', totalCopies: 6, availableCopies: 4, price: 550, editionYear: '2023' },
  { accessionNo: 'LIB-012', title: 'Our Motherland Tamil Nadu Heritage & Culture', author: 'Tamil Nadu Textbook Corporation', category: 'General Knowledge & Encyclopedias', language: 'Bilingual', shelfLocation: 'Rack B - Shelf 1', totalCopies: 10, availableCopies: 8, price: 210, editionYear: '2021' },
];

export interface BookIssueRecord {
  issueId: string;
  accessionNo: string;
  bookTitle: string;
  borrowerType: 'Student' | 'Staff';
  borrowerId: string;
  borrowerName: string;
  borrowerClassOrDept: string;
  borrowerPhone: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Issued' | 'Returned' | 'Overdue';
  fineAmount: number;
}

export const INITIAL_BOOK_ISSUES: BookIssueRecord[] = [
  { issueId: 'ISS-001', accessionNo: 'LIB-001', bookTitle: 'Thirukkural Kathaigal', borrowerType: 'Student', borrowerId: 'std-001', borrowerName: 'Kavin Kumar S', borrowerClassOrDept: 'LKG-A', borrowerPhone: '9840123456', issueDate: '2024-08-20', dueDate: '2024-09-03', status: 'Overdue', fineAmount: 8 },
  { issueId: 'ISS-002', accessionNo: 'LIB-004', bookTitle: 'Wings of Fire - Student Edition', borrowerType: 'Student', borrowerId: 'std-017', borrowerName: 'Tharun K', borrowerClassOrDept: '5STD-A', borrowerPhone: '9840889900', issueDate: '2024-08-28', dueDate: '2024-09-11', status: 'Issued', fineAmount: 0 },
  { issueId: 'ISS-003', accessionNo: 'LIB-003', bookTitle: 'Tenali Raman Funny Stories', borrowerType: 'Student', borrowerId: 'std-013', borrowerName: 'Akilan V', borrowerClassOrDept: '3STD-A', borrowerPhone: '9840445566', issueDate: '2024-08-15', dueDate: '2024-08-29', status: 'Overdue', fineAmount: 18 },
  { issueId: 'ISS-004', accessionNo: 'LIB-005', bookTitle: 'Science Wonder Book', borrowerType: 'Staff', borrowerId: 'stf-005', borrowerName: 'N. Rajeshwari', borrowerClassOrDept: 'Science Dept', borrowerPhone: '9840982345', issueDate: '2024-08-10', dueDate: '2024-09-10', status: 'Issued', fineAmount: 0 },
  { issueId: 'ISS-005', accessionNo: 'LIB-002', bookTitle: 'Panchatantra Fables', borrowerType: 'Student', borrowerId: 'std-005', borrowerName: 'Keerthana V', borrowerClassOrDept: '1STD-A', borrowerPhone: '9841456789', issueDate: '2024-08-12', dueDate: '2024-08-26', returnDate: '2024-08-25', status: 'Returned', fineAmount: 0 },
  { issueId: 'ISS-006', accessionNo: 'LIB-006', bookTitle: 'Vedic Mathematics for Kids', borrowerType: 'Staff', borrowerId: 'stf-004', borrowerName: 'V. Anandhakumar', borrowerClassOrDept: 'Maths Dept', borrowerPhone: '9443219087', issueDate: '2024-08-18', dueDate: '2024-09-18', status: 'Issued', fineAmount: 0 },
  { issueId: 'ISS-007', accessionNo: 'LIB-009', bookTitle: 'Amazing Animals & Birds Guide', borrowerType: 'Student', borrowerId: 'std-015', borrowerName: 'Naveen Prasath S', borrowerClassOrDept: '4STD-A', borrowerPhone: '9841667788', issueDate: '2024-08-14', dueDate: '2024-08-28', status: 'Overdue', fineAmount: 20 },
  { issueId: 'ISS-008', accessionNo: 'LIB-007', bookTitle: 'Aesop’s Fables with Visuals', borrowerType: 'Student', borrowerId: 'std-002', borrowerName: 'Dharshini R', borrowerClassOrDept: 'LKG-A', borrowerPhone: '9444156789', issueDate: '2024-09-01', dueDate: '2024-09-15', status: 'Issued', fineAmount: 0 },
];

// ============================================================================
// INVENTORY DATA
// ============================================================================

export interface InventoryItem {
  itemId: string;
  itemCode: string;
  name: string;
  category: 'Textbooks & Workbooks' | 'Stationery & Papers' | 'Uniforms & Kits' | 'Sports Equipment' | 'First Aid & Health' | 'Van Fleet Spares';
  unit: 'Pieces' | 'Sets' | 'Boxes' | 'Bundles' | 'Rolls';
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  totalValuation: number;
  location: string;
  supplier: string;
}

export const INITIAL_INVENTORY_STOCK: InventoryItem[] = [
  { itemId: 'INV-001', itemCode: 'TXT-LKG-01', name: 'LKG Rhymes, Letters & Activity Workbook Set', category: 'Textbooks & Workbooks', unit: 'Sets', currentStock: 25, reorderLevel: 10, unitCost: 450, totalValuation: 11250, location: 'Store Room - Cupboard A1', supplier: 'Universal Book Distributors, Chennai' },
  { itemId: 'INV-002', itemCode: 'TXT-UKG-01', name: 'UKG Phonics, Numbers & Tamil Worksheets Set', category: 'Textbooks & Workbooks', unit: 'Sets', currentStock: 30, reorderLevel: 10, unitCost: 480, totalValuation: 14400, location: 'Store Room - Cupboard A2', supplier: 'Universal Book Distributors, Chennai' },
  { itemId: 'INV-003', itemCode: 'STN-NB-192', name: 'Four-Line & Square-Line 192-Page Wisdom Notebooks', category: 'Stationery & Papers', unit: 'Bundles', currentStock: 48, reorderLevel: 15, unitCost: 350, totalValuation: 16800, location: 'Store Room - Cupboard B1', supplier: 'Sri Krishna Paper Mart, Madurantakam' },
  { itemId: 'INV-004', itemCode: 'STN-EXM-A4', name: 'Printed Term Examination Ruled Answer Sheets (500/ream)', category: 'Stationery & Papers', unit: 'Boxes', currentStock: 6, reorderLevel: 5, unitCost: 1250, totalValuation: 7500, location: 'Exam Cell - Locker 2', supplier: 'Venkateswara Printers, Essur' },
  { itemId: 'INV-005', itemCode: 'UNI-TSH-SET', name: 'Wisdom House Uniform T-Shirts & Shorts/Skirts (All sizes)', category: 'Uniforms & Kits', unit: 'Sets', currentStock: 14, reorderLevel: 20, unitCost: 650, totalValuation: 9100, location: 'Tailoring Stock Room', supplier: 'Senthil Garments, Tiruppur' },
  { itemId: 'INV-006', itemCode: 'UNI-TIE-BLT', name: 'Wisdom School Logo Tie & Elastic Belt Combo', category: 'Uniforms & Kits', unit: 'Sets', currentStock: 35, reorderLevel: 15, unitCost: 120, totalValuation: 4200, location: 'Store Room - Drawer C', supplier: 'Classic Ties, Chennai' },
  { itemId: 'INV-007', itemCode: 'SPT-FB-SIZE3', name: 'Cosco Youth Football (Size 3) for Primary Drills', category: 'Sports Equipment', unit: 'Pieces', currentStock: 8, reorderLevel: 4, unitCost: 480, totalValuation: 3840, location: 'PET Room - Sports Rack 1', supplier: 'Champion Sports, Chengalpattu' },
  { itemId: 'INV-008', itemCode: 'SPT-RING-SET', name: 'Ring Throw, Cones & Hurdles Agility Training Kit', category: 'Sports Equipment', unit: 'Sets', currentStock: 4, reorderLevel: 2, unitCost: 1800, totalValuation: 7200, location: 'PET Room - Sports Rack 2', supplier: 'Champion Sports, Chengalpattu' },
  { itemId: 'INV-009', itemCode: 'MED-KIT-FA', name: 'Primary First Aid Refill (Bandages, Dettol, Silverex, Paracetamol)', category: 'First Aid & Health', unit: 'Boxes', currentStock: 5, reorderLevel: 3, unitCost: 850, totalValuation: 4250, location: 'Medical Room - First Aid Box', supplier: 'Essur Medical Stores' },
  { itemId: 'INV-010', itemCode: 'VAN-FLT-OIL', name: 'Heavy Duty 15W-40 Engine Oil & Diesel Filters (20L can)', category: 'Van Fleet Spares', unit: 'Pieces', currentStock: 2, reorderLevel: 2, unitCost: 4500, totalValuation: 9000, location: 'Van Garage Storage', supplier: 'Hindustan Petroleum Dealer, Tindivanam Road' },
];

export interface InventoryPurchase {
  purchaseId: string;
  invoiceNo: string;
  purchaseDate: string;
  vendorName: string;
  itemsDescription: string;
  totalQuantity: number;
  totalCost: number;
  paymentMode: string;
  receivedBy: string;
}

export const INITIAL_INVENTORY_PURCHASES: InventoryPurchase[] = [
  { purchaseId: 'PUR-001', invoiceNo: 'INV-2024-891', purchaseDate: '2024-06-02', vendorName: 'Universal Book Distributors, Chennai', itemsDescription: 'LKG & UKG Textbooks & Phonics Workbooks (60 Sets)', totalQuantity: 60, totalCost: 27900, paymentMode: 'Bank Transfer', receivedBy: 'R. Saravanan' },
  { purchaseId: 'PUR-002', invoiceNo: 'INV-2024-104', purchaseDate: '2024-06-10', vendorName: 'Senthil Garments, Tiruppur', itemsDescription: 'School Uniform Sets & Sports Jerseys (80 Sets)', totalQuantity: 80, totalCost: 52000, paymentMode: 'Cheque', receivedBy: 'A. Sivakumar' },
  { purchaseId: 'PUR-003', invoiceNo: 'BILL-492', purchaseDate: '2024-07-04', vendorName: 'Sri Krishna Paper Mart, Madurantakam', itemsDescription: '192-Page Four-Line Notebooks & Ruled Pads (50 Bundles)', totalQuantity: 50, totalCost: 17500, paymentMode: 'GPay / UPI', receivedBy: 'A. Sivakumar' },
  { purchaseId: 'PUR-004', invoiceNo: 'CS-9812', purchaseDate: '2024-07-22', vendorName: 'Champion Sports, Chengalpattu', itemsDescription: 'Football, Throwball, Badminton, Cones & Whistles', totalQuantity: 24, totalCost: 11040, paymentMode: 'GPay / UPI', receivedBy: 'P. Murugan' },
  { purchaseId: 'PUR-005', invoiceNo: 'VP-301', purchaseDate: '2024-08-15', vendorName: 'Venkateswara Printers, Essur', itemsDescription: 'Term Examination Ruled Question-cum-Answer Sheets', totalQuantity: 10, totalCost: 12500, paymentMode: 'Cash', receivedBy: 'A. Sivakumar' },
];

export interface InventoryIssueLog {
  issueId: string;
  date: string;
  itemName: string;
  quantity: number;
  issuedTo: string;
  recipientPerson: string;
  purpose: string;
}

export const INITIAL_INVENTORY_ISSUES: InventoryIssueLog[] = [
  { issueId: 'LOG-001', date: '2024-06-08', itemName: 'LKG Rhymes, Letters & Activity Workbook Set', quantity: 18, issuedTo: 'Class LKG-A', recipientPerson: 'M. Sumathi (KG Teacher)', purpose: 'Annual Academic Kit Distribution' },
  { issueId: 'LOG-002', date: '2024-06-08', itemName: 'UKG Phonics, Numbers & Tamil Worksheets Set', quantity: 22, issuedTo: 'Class UKG-A', recipientPerson: 'G. Bhuvaneshwari (Teacher)', purpose: 'Annual Academic Kit Distribution' },
  { issueId: 'LOG-003', date: '2024-07-05', itemName: 'Wisdom Notebooks (192 Pages)', quantity: 30, issuedTo: 'Classes 1STD & 2STD', recipientPerson: 'S. Priya Dharshini', purpose: 'English & Tamil Handwriting Class' },
  { issueId: 'LOG-004', date: '2024-08-10', itemName: 'Cosco Youth Football & Cones Kit', quantity: 2, issuedTo: 'Physical Education Dept', recipientPerson: 'P. Murugan (PET Master)', purpose: 'Inter-House Sports Practice' },
  { issueId: 'LOG-005', date: '2024-08-25', itemName: 'Printed Term Examination Ruled Answer Sheets', quantity: 4, issuedTo: 'Exam Cell', recipientPerson: 'K. Meenakshi (Academic In-charge)', purpose: 'Quarterly Examination Stationery' },
];

// ============================================================================
// SALARY & PAYROLL DATA (6 COMPREHENSIVE REPORTS)
// ============================================================================

export interface MonthlyPayrollRecord {
  payrollId: string;
  month: string; // e.g., '2024-08'
  staffId: string;
  employeeCode: string;
  staffName: string;
  designation: string;
  department: string;
  basicSalary: number;
  hra: number;
  da: number;
  conveyance: number;
  specialAllowance: number;
  grossSalary: number;
  epfEmployee: number; // 12% of basic
  esiEmployee: number; // 0.75% of gross (if applicable)
  professionalTax: number;
  advanceOrLoanDeduction: number;
  totalDeductions: number;
  netPayable: number;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
  paymentMode: 'Bank NEFT' | 'Bank Transfer' | 'Cash';
  paymentStatus: 'Disbursed' | 'Pending';
  transactionReference: string;
  disbursementDate: string;
}

export function generateMonthlyPayroll(monthStr: string = '2024-08'): MonthlyPayrollRecord[] {
  return INITIAL_STAFF_MEMBERS.map((staff, idx) => {
    const grossSalary = staff.basicSalary + staff.hra + staff.da + staff.conveyance + staff.specialAllowance;
    const epfEmployee = staff.epfEligible ? Math.round(staff.basicSalary * 0.12) : 0;
    const esiEmployee = staff.esiEligible && grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;
    const professionalTax = grossSalary > 20000 ? 200 : grossSalary > 15000 ? 150 : 100;
    const advanceOrLoanDeduction = idx === 3 ? 1000 : idx === 8 ? 500 : 0; // occasional advance deduction
    const totalDeductions = epfEmployee + esiEmployee + professionalTax + advanceOrLoanDeduction;
    const netPayable = grossSalary - totalDeductions;

    return {
      payrollId: `PAY-${monthStr.replace('-', '')}-${staff.employeeCode}`,
      month: monthStr,
      staffId: staff.id,
      employeeCode: staff.employeeCode,
      staffName: staff.name,
      designation: staff.designation,
      department: staff.department,
      basicSalary: staff.basicSalary,
      hra: staff.hra,
      da: staff.da,
      conveyance: staff.conveyance,
      specialAllowance: staff.specialAllowance,
      grossSalary,
      epfEmployee,
      esiEmployee,
      professionalTax,
      advanceOrLoanDeduction,
      totalDeductions,
      netPayable,
      bankName: staff.bankName,
      accountNo: staff.accountNo,
      ifscCode: staff.ifscCode,
      panNumber: staff.panNumber,
      uanNumber: staff.uanNumber,
      paymentMode: staff.department === 'Support Staff' ? 'Cash' : 'Bank NEFT',
      paymentStatus: 'Disbursed',
      transactionReference: staff.department === 'Support Staff' ? 'Cash Voucher #104' : `NEFT-${monthStr.replace('-', '')}-WSDM${1000 + idx}`,
      disbursementDate: `${monthStr}-31`,
    };
  });
}
