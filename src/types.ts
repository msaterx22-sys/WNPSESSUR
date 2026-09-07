export type StandardClass = string;

export interface SchoolClassInfo {
  name: string;
  tuitionFee: number;
}

export const DEFAULT_CLASSES: string[] = ['LKG', 'UKG', '1STD', '2STD', '3STD', '4STD', '5STD'];

export interface FeeStructure {
  standard: StandardClass;
  displayName: string;
  tuitionFee: number;
}

export const DEFAULT_FEE_STRUCTURE: Record<string, number> = {
  'LKG': 16500,
  'UKG': 17600,
  '1STD': 18150,
  '2STD': 18700,
  '3STD': 19800,
  '4STD': 20350,
  '5STD': 20500,
};

export interface SchoolInfo {
  name: string;
  tagline: string;
  academicYear: string;
  logoUrl?: string;
  adminName: string;
  location: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  upiId: string;
  gpayPhone: string;
  bankName?: string;
}

export const DEFAULT_SCHOOL_INFO: SchoolInfo = {
  name: 'Wisdom Nursery and Primary School',
  tagline: 'Learn Today, Lead Tomorrow',
  academicYear: '2026-2027',
  logoUrl: '/school_logo.jpg',
  adminName: 'R. SARAVANAN',
  location: 'Essur',
  address: 'Essur - 603301, Tamil Nadu',
  pincode: '603301',
  phone: '+91 9176593129',
  email: 'wisdomrs.tamil@gmail.com',
  upiId: 'rsaravanan102002-1@okhdfcbank',
  gpayPhone: '9176593129',
  bankName: 'HDFC Bank',
};

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  standard: StandardClass;
  section: string;
  gender: 'Boy' | 'Girl';
  parentName: string;
  parentPhone: string;
  whatsappNumber: string;
  address: string;
  photoUrl?: string; // Student ID and Van Card photo data URL or image path
  isRte?: boolean; // Right to Education (RTE Quota - free tuition / govt subsidized)
  rteApplicationNo?: string; // RTE Government application / registration code
  rteGovtReimbursed?: boolean; // Reimbursement status from state govt
  vanFacility: boolean;
  vanRoute?: string;
  vanFee: number;
  sportsFacility: boolean;
  sportsFee: number;
  tuitionFee: number;
  otherFee: number;
  discount: number;
  lateFee: number;
  admissionDate: string;
  bloodGroup?: string;
  notes?: string;
}

export type PaymentMode = 'Cash' | 'GPay / UPI' | 'Bank Transfer' | 'Cheque';

export type FeeCategory = 'Tuition' | 'Van' | 'Sports' | 'Late Fee' | 'Composite / Combined';

export interface FeeBreakdown {
  tuition: number;
  van: number;
  sports: number;
  lateFee: number;
  other: number;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  standard: StandardClass;
  section: string;
  parentName: string;
  parentPhone: string;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  transactionReference?: string;
  category: FeeCategory;
  breakdown: FeeBreakdown;
  amountPaid: number;
  totalPendingAfterPayment: number;
  collectedBy: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'Staff Salary & Wages'
  | 'Van Fuel & Maintenance'
  | 'Electricity & Utilities'
  | 'Stationery, Books & Printing'
  | 'Sports & Cultural Events'
  | 'Building & Maintenance'
  | 'RTE & Govt Documentation'
  | 'Refreshments & Food'
  | 'Other / Miscellaneous';

export interface SchoolExpense {
  id: string;
  voucherNo: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  paidTo: string;
  receiptImage?: string; // optional image/bill receipt data URL
  notes?: string;
  recordedBy: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'payments'
  | 'expenses'
  | 'feecards'
  | 'bulk'
  | 'whatsapp'
  | 'reports'
  | 'fee-conveyance'
  | 'attendance'
  | 'exam'
  | 'staff'
  | 'library'
  | 'inventory'
  | 'payroll'
  | 'cash-audit'
  | 'settings';
