import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Student, 
  PaymentReceipt, 
  SchoolInfo, 
  StandardClass, 
  DEFAULT_FEE_STRUCTURE, 
  DEFAULT_SCHOOL_INFO, 
  DEFAULT_CLASSES,
  ActiveTab,
  FeeBreakdown,
  PaymentMode,
  FeeCategory,
  SchoolExpense
} from '../types';
import { INITIAL_STUDENTS, INITIAL_RECEIPTS, INITIAL_EXPENSES } from '../data/initialData';
import { safeBrowserStorage } from '../utils/browserStorage';
import {
  DailyAttendanceDetail,
  INITIAL_DAILY_STUDENT_ATTENDANCE,
  INITIAL_STAFF_MEMBERS,
  MonthlyPayrollRecord,
  StaffMember,
  generateMonthlyPayroll,
} from '../data/reportsData';

interface PaymentInput {
  studentId: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  category: FeeCategory;
  breakdown: FeeBreakdown;
  date: string;
  notes?: string;
}

export interface StudentImportResult {
  imported: number;
  skipped: number;
}

interface SchoolContextType {
  schoolInfo: SchoolInfo;
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;
  classList: string[];
  addClass: (className: string, defaultTuitionFee: number) => void;
  deleteClass: (className: string) => boolean;
  feeStructure: Record<string, number>;
  updateFeeStructure: (standard: string, fee: number) => void;
  students: Student[];
  receipts: PaymentReceipt[];
  expenses: SchoolExpense[];
  staffMembers: StaffMember[];
  dailyAttendance: DailyAttendanceDetail[];
  setDailyAttendance: React.Dispatch<React.SetStateAction<DailyAttendanceDetail[]>>;
  addStaffMember: (staffData: Omit<StaffMember, 'id'>) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  payrollRecordsByMonth: Record<string, MonthlyPayrollRecord[]>;
  setPayrollRecordsForMonth: (month: string, records: MonthlyPayrollRecord[]) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: 'admin' | 'parent';
  setUserRole: (role: 'admin' | 'parent') => void;
  activeStudentPortal: Student | null;
  setActiveStudentPortal: (student: Student | null) => void;

  // Student Actions
  addStudent: (studentData: Omit<Student, 'id'>) => Student;
  importStudents: (studentData: Omit<Student, 'id'>[]) => StudentImportResult;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Payment Actions
  recordPayment: (input: PaymentInput) => PaymentReceipt;
  updateReceipt: (id: string, updates: Partial<PaymentReceipt>) => void;
  deleteReceipt: (id: string) => void;

  // Expense Actions
  addExpense: (expenseData: Omit<SchoolExpense, 'id' | 'voucherNo'>) => SchoolExpense;
  updateExpense: (id: string, updates: Partial<SchoolExpense>) => void;
  deleteExpense: (id: string) => void;

  // Calculators
  getStudentTotalFee: (student: Student) => number;
  getStudentTotalPaid: (studentId: string) => number;
  getStudentPending: (student: Student) => number;
  getStudentReceipts: (studentId: string) => PaymentReceipt[];

  // Statistics
  stats: {
    totalStudents: number;
    totalRteStudents: number;
    totalRteTuitionWaived: number;
    totalFeeExpected: number;
    totalCollected: number;
    totalPending: number;
    totalExpenses: number;
    netSchoolBalance: number;
    totalVanExpected: number;
    totalVanCollected: number;
    totalSportsExpected: number;
    totalSportsCollected: number;
    totalLateFeesCollected: number;
  };

  // State reset / export / import
  resetToDefaults: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonData: string) => boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const readStoredValue = <T,>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T => {
  try {
    const saved = safeBrowserStorage.getItem(key);
    if (!saved) return fallback;

    const parsed: unknown = JSON.parse(saved);
    return !isValid || isValid(parsed) ? parsed as T : fallback;
  } catch {
    safeBrowserStorage.removeItem(key);
    return fallback;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isSchoolInfo = (value: unknown): value is SchoolInfo => {
  if (!isObject(value)) return false;

  const requiredKeys = ['name', 'tagline', 'adminName', 'location', 'address', 'pincode', 'phone', 'email', 'upiId', 'gpayPhone'];
  return requiredKeys.every(key => typeof value[key] === 'string')
    && (value.academicYear === undefined || typeof value.academicYear === 'string')
    && (value.logoUrl === undefined || typeof value.logoUrl === 'string')
    && (value.principalSignatureUrl === undefined || typeof value.principalSignatureUrl === 'string');
};

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isStaffMember = (value: unknown): value is StaffMember => {
  if (!isObject(value)) return false;

  const stringKeys = [
    'id', 'employeeCode', 'name', 'designation', 'department', 'qualification',
    'dateOfJoining', 'mobile', 'email', 'status', 'bankName', 'accountNo',
    'ifscCode', 'panNumber', 'uanNumber',
  ];
  const numberKeys = [
    'experienceYears', 'basicSalary', 'hra', 'da', 'conveyance', 'specialAllowance',
  ];
  return stringKeys.every(key => typeof value[key] === 'string')
    && numberKeys.every(key => typeof value[key] === 'number')
    && Array.isArray(value.subjectsHandled)
    && value.subjectsHandled.every(item => typeof item === 'string')
    && Array.isArray(value.classesAssigned)
    && value.classesAssigned.every(item => typeof item === 'string')
    && typeof value.epfEligible === 'boolean'
    && typeof value.esiEligible === 'boolean'
    && ['Academic / Teaching', 'Administration', 'Transport', 'Support Staff'].includes(String(value.department))
    && ['Active', 'On Leave', 'Relieved'].includes(String(value.status));
};

const isStaffMemberArray = (value: unknown): value is StaffMember[] => (
  Array.isArray(value) && value.every(isStaffMember)
);

const isMonthlyPayrollRecord = (value: unknown): value is MonthlyPayrollRecord => {
  if (!isObject(value)) return false;

  const stringKeys = [
    'payrollId', 'month', 'staffId', 'employeeCode', 'staffName', 'designation',
    'department', 'bankName', 'accountNo', 'ifscCode', 'panNumber', 'uanNumber',
    'paymentMode', 'paymentStatus', 'transactionReference', 'disbursementDate',
  ];
  const numberKeys = [
    'basicSalary', 'hra', 'da', 'conveyance', 'specialAllowance', 'grossSalary',
    'epfEmployee', 'esiEmployee', 'professionalTax', 'advanceOrLoanDeduction',
    'totalDeductions', 'netPayable',
  ];
  return stringKeys.every(key => typeof value[key] === 'string')
    && numberKeys.every(key => typeof value[key] === 'number')
    && ['Bank NEFT', 'Bank Transfer', 'Cash'].includes(String(value.paymentMode))
    && ['Disbursed', 'Pending'].includes(String(value.paymentStatus));
};

const isPayrollRecordsByMonth = (value: unknown): value is Record<string, MonthlyPayrollRecord[]> => (
  isObject(value)
  && Object.values(value).every(records => Array.isArray(records) && records.every(isMonthlyPayrollRecord))
);

const isDailyAttendanceArray = (value: unknown): value is DailyAttendanceDetail[] => (
  Array.isArray(value) && value.every(record => (
    isObject(record)
    && typeof record.id === 'string'
    && (record.date === undefined || typeof record.date === 'string')
    && typeof record.rollNo === 'string'
    && typeof record.admissionNo === 'string'
    && typeof record.studentName === 'string'
    && typeof record.standard === 'string'
    && typeof record.section === 'string'
    && ['Present', 'Absent', 'Late', 'Half Day'].includes(String(record.status))
    && (record.reason === undefined || typeof record.reason === 'string')
    && typeof record.parentPhone === 'string'
    && typeof record.notifiedWhatsApp === 'boolean'
  ))
);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const stored = readStoredValue('wisdom_school_info', DEFAULT_SCHOOL_INFO, isSchoolInfo);
    const merged = { ...DEFAULT_SCHOOL_INFO, ...stored };
    if (merged.academicYear === '2024-2025' || merged.academicYear === '2024 - 2025') {
      merged.academicYear = DEFAULT_SCHOOL_INFO.academicYear;
    }
    return merged;
  });

  const [classList, setClassList] = useState<string[]>(() => {
    return readStoredValue('wisdom_class_list', DEFAULT_CLASSES, isArray) as string[];
  });

  const [feeStructure, setFeeStructure] = useState<Record<string, number>>(() => {
    return readStoredValue('wisdom_fee_structure', DEFAULT_FEE_STRUCTURE, isObject) as Record<string, number>;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    return readStoredValue('wisdom_students', INITIAL_STUDENTS, isArray) as Student[];
  });

  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => {
    return readStoredValue('wisdom_receipts', INITIAL_RECEIPTS, isArray) as PaymentReceipt[];
  });

  const [expenses, setExpenses] = useState<SchoolExpense[]>(() => {
    return readStoredValue('wisdom_expenses', INITIAL_EXPENSES, isArray) as SchoolExpense[];
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => (
    readStoredValue('wisdom_staff_members', INITIAL_STAFF_MEMBERS, isStaffMemberArray)
  ));
  const [payrollRecordsByMonth, setPayrollRecordsByMonth] = useState<Record<string, MonthlyPayrollRecord[]>>(() => (
    readStoredValue('wisdom_payroll_records', {}, isPayrollRecordsByMonth)
  ));
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceDetail[]>(() => (
    readStoredValue('wisdom_daily_attendance', INITIAL_DAILY_STUDENT_ATTENDANCE, isDailyAttendanceArray)
  ));
  const [dailyAttendanceHydrated, setDailyAttendanceHydrated] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const hydrateSavedData = async () => {
      const [
        storedSchoolInfo,
        storedClassList,
        storedFeeStructure,
        storedStudents,
        storedReceipts,
        storedExpenses,
        storedStaffMembers,
        storedPayrollRecords,
        storedDailyAttendance,
      ] = await Promise.all([
        safeBrowserStorage.loadJson('wisdom_school_info'),
        safeBrowserStorage.loadJson('wisdom_class_list'),
        safeBrowserStorage.loadJson('wisdom_fee_structure'),
        safeBrowserStorage.loadJson('wisdom_students'),
        safeBrowserStorage.loadJson('wisdom_receipts'),
        safeBrowserStorage.loadJson('wisdom_expenses'),
        safeBrowserStorage.loadJson('wisdom_staff_members'),
        safeBrowserStorage.loadJson('wisdom_payroll_records'),
        safeBrowserStorage.loadJson('wisdom_daily_attendance'),
      ]);

      if (isCancelled) return;

      try {
        if (storedSchoolInfo) {
          const parsed = JSON.parse(storedSchoolInfo) as unknown;
          if (isSchoolInfo(parsed)) {
            setSchoolInfo(prev => ({ ...DEFAULT_SCHOOL_INFO, ...prev, ...parsed }));
          }
        }

        if (storedClassList) {
          const parsed = JSON.parse(storedClassList) as unknown;
          if (Array.isArray(parsed)) {
            setClassList(parsed as string[]);
          }
        }

        if (storedFeeStructure) {
          const parsed = JSON.parse(storedFeeStructure) as unknown;
          if (isObject(parsed)) {
            setFeeStructure(parsed as Record<string, number>);
          }
        }

        if (storedStudents) {
          const parsed = JSON.parse(storedStudents) as unknown;
          if (Array.isArray(parsed)) {
            setStudents(parsed as Student[]);
          }
        }

        if (storedReceipts) {
          const parsed = JSON.parse(storedReceipts) as unknown;
          if (Array.isArray(parsed)) {
            setReceipts(parsed as PaymentReceipt[]);
          }
        }

        if (storedExpenses) {
          const parsed = JSON.parse(storedExpenses) as unknown;
          if (Array.isArray(parsed)) {
            setExpenses(parsed as SchoolExpense[]);
          }
        }

        if (storedStaffMembers) {
          const parsed = JSON.parse(storedStaffMembers) as unknown;
          if (isStaffMemberArray(parsed)) {
            setStaffMembers(parsed);
          }
        }

        if (storedPayrollRecords) {
          const parsed = JSON.parse(storedPayrollRecords) as unknown;
          if (isPayrollRecordsByMonth(parsed)) {
            setPayrollRecordsByMonth(parsed);
          }
        }

        if (storedDailyAttendance) {
          const parsed = JSON.parse(storedDailyAttendance) as unknown;
          if (isDailyAttendanceArray(parsed)) {
            setDailyAttendance(parsed);
          }
        }
      } catch {
        // Ignore malformed persisted payloads and keep the currently loaded defaults.
      } finally {
        setDailyAttendanceHydrated(true);
      }
    };

    void hydrateSavedData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'parent'>('admin');
  const [activeStudentPortal, setActiveStudentPortal] = useState<Student | null>(null);

  // Persistence to browser storage (localStorage with IndexedDB fallback)
  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_school_info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_class_list', JSON.stringify(classList));
  }, [classList]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_fee_structure', JSON.stringify(feeStructure));
  }, [feeStructure]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_staff_members', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    void safeBrowserStorage.saveJson('wisdom_payroll_records', JSON.stringify(payrollRecordsByMonth));
  }, [payrollRecordsByMonth]);

  useEffect(() => {
    if (dailyAttendanceHydrated) {
      void safeBrowserStorage.saveJson('wisdom_daily_attendance', JSON.stringify(dailyAttendance));
    }
  }, [dailyAttendance, dailyAttendanceHydrated]);

  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setSchoolInfo(prev => ({ ...prev, ...info }));
  };

  const addClass = (className: string, defaultTuitionFee: number) => {
    const trimmed = className.trim().toUpperCase();
    if (!trimmed) return;
    if (!classList.includes(trimmed)) {
      setClassList(prev => [...prev, trimmed]);
    }
    setFeeStructure(prev => ({ ...prev, [trimmed]: defaultTuitionFee }));
  };

  const deleteClass = (className: string): boolean => {
    const hasStudents = students.some(s => s.standard === className);
    if (hasStudents) {
      alert(`Cannot delete Class "${className}" because students are currently enrolled in it. Please reassign or remove students first.`);
      return false;
    }
    setClassList(prev => prev.filter(c => c !== className));
    return true;
  };

  const updateFeeStructure = (standard: string, fee: number) => {
    setFeeStructure(prev => ({ ...prev, [standard]: fee }));
  };

  const addStudent = (studentData: Omit<Student, 'id'>): Student => {
    const newId = `std-${Date.now().toString().slice(-6)}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
    };
    setStudents(prev => [newStudent, ...prev]);
    return newStudent;
  };

  const importStudents = (studentData: Omit<Student, 'id'>[]): StudentImportResult => {
    const existingAdmissionNumbers = new Set(students.map(student => student.admissionNo.trim().toLowerCase()));
    const seenAdmissionNumbers = new Set<string>();
    const recordsToAdd = studentData.filter(student => {
      const admissionKey = student.admissionNo.trim().toLowerCase();
      if (!admissionKey || existingAdmissionNumbers.has(admissionKey) || seenAdmissionNumbers.has(admissionKey)) {
        return false;
      }
      seenAdmissionNumbers.add(admissionKey);
      return true;
    });
    const now = Date.now();
    const newStudents = recordsToAdd.map((student, index) => ({
      ...student,
      id: `std-${now}-${index}`,
    }));

    if (newStudents.length > 0) {
      setStudents(prev => [...newStudents, ...prev]);
      const importedStandards = [...new Set(newStudents.map(student => student.standard).filter(Boolean))];
      setClassList(prev => [...prev, ...importedStandards.filter(standard => !prev.includes(standard))]);
      setFeeStructure(prev => importedStandards.reduce(
        (fees, standard) => fees[standard] === undefined ? { ...fees, [standard]: 0 } : fees,
        prev,
      ));
    }

    return {
      imported: newStudents.length,
      skipped: studentData.length - newStudents.length,
    };
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (activeStudentPortal && activeStudentPortal.id === id) {
      setActiveStudentPortal(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setReceipts(prev => prev.filter(r => r.studentId !== id));
    if (activeStudentPortal && activeStudentPortal.id === id) {
      setActiveStudentPortal(null);
    }
  };

  const getStudentTotalFee = (student: Student): number => {
    // If student is under RTE Free Education Quota, tuition fee is waived unless specific fee is recorded
    const defaultClassFee = feeStructure[student.standard] ?? 0;
    const tuition = student.isRte 
      ? (student.tuitionFee !== undefined ? student.tuitionFee : 0)
      : (student.tuitionFee !== undefined ? student.tuitionFee : defaultClassFee);
    const van = student.vanFacility ? (student.vanFee || 0) : 0;
    const sports = student.sportsFacility ? (student.sportsFee || 0) : 0;
    const other = student.otherFee || 0;
    const late = student.lateFee || 0;
    const discount = student.discount || 0;
    return Math.max(0, (tuition + van + sports + other + late) - discount);
  };

  const getStudentTotalPaid = (studentId: string): number => {
    return receipts
      .filter(r => r.studentId === studentId)
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  };

  const getStudentPending = (student: Student): number => {
    const total = getStudentTotalFee(student);
    const paid = getStudentTotalPaid(student.id);
    return Math.max(0, total - paid);
  };

  const getStudentReceipts = (studentId: string): PaymentReceipt[] => {
    return receipts
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const recordPayment = (input: PaymentInput): PaymentReceipt => {
    const student = students.find(s => s.id === input.studentId);
    if (!student) throw new Error('Student not found');

    const totalPaidInBreakdown = 
      (input.breakdown.tuition || 0) +
      (input.breakdown.van || 0) +
      (input.breakdown.sports || 0) +
      (input.breakdown.lateFee || 0) +
      (input.breakdown.other || 0);

    const currentTotalPaid = getStudentTotalPaid(student.id);
    const studentTotalFee = getStudentTotalFee(student);
    const newTotalPaid = currentTotalPaid + totalPaidInBreakdown;
    const remainingBalance = Math.max(0, studentTotalFee - newTotalPaid);

    const receiptNo = `WREC-${new Date().getFullYear()}-${1000 + receipts.length + 1}`;

    const newReceipt: PaymentReceipt = {
      id: `rec-${Date.now().toString().slice(-6)}`,
      receiptNumber: receiptNo,
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      standard: student.standard,
      section: student.section,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      date: input.date || new Date().toISOString().split('T')[0],
      paymentMode: input.paymentMode,
      transactionReference: input.transactionReference,
      category: input.category,
      breakdown: input.breakdown,
      amountPaid: totalPaidInBreakdown,
      totalPendingAfterPayment: remainingBalance,
      collectedBy: `${schoolInfo.adminName} - Admin`,
      notes: input.notes,
    };

    setReceipts(prev => [newReceipt, ...prev]);
    return newReceipt;
  };

  const updateReceipt = (id: string, updates: Partial<PaymentReceipt>) => {
    setReceipts(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
      if (updates.breakdown && updates.amountPaid === undefined) {
        updated.amountPaid = 
          (updated.breakdown.tuition || 0) +
          (updated.breakdown.van || 0) +
          (updated.breakdown.sports || 0) +
          (updated.breakdown.lateFee || 0) +
          (updated.breakdown.other || 0);
      }
      return updated;
    }));
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  // Expense Management
  const addExpense = (expenseData: Omit<SchoolExpense, 'id' | 'voucherNo'>): SchoolExpense => {
    const voucherNo = `WEXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`;
    const newExpense: SchoolExpense = {
      ...expenseData,
      id: `exp-${Date.now().toString().slice(-6)}`,
      voucherNo,
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<SchoolExpense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addStaffMember = (staffData: Omit<StaffMember, 'id'>): StaffMember => {
    const newStaff: StaffMember = {
      ...staffData,
      id: `stf-${Date.now()}`,
    };
    setStaffMembers(prev => [...prev, newStaff]);
    setPayrollRecordsByMonth(prev => {
      const next = { ...prev };
      Object.keys(prev).forEach(month => {
        const records = prev[month] ?? [];
        const newRecord = generateMonthlyPayroll(month, [newStaff])[0];
        if (newRecord && !records.some(record => record.staffId === newStaff.id)) {
          next[month] = [...records, newRecord];
        }
      });
      return next;
    });
    return newStaff;
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev => prev.map(staff => staff.id === id ? { ...staff, ...updates } : staff));
  };

  const deleteStaffMember = (id: string) => {
    setStaffMembers(prev => prev.filter(staff => staff.id !== id));
  };

  const setPayrollRecordsForMonth = (month: string, records: MonthlyPayrollRecord[]) => {
    setPayrollRecordsByMonth(prev => ({ ...prev, [month]: records }));
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all data to default Wisdom School demo records?')) {
      setSchoolInfo(DEFAULT_SCHOOL_INFO);
      setClassList(DEFAULT_CLASSES);
      setFeeStructure(DEFAULT_FEE_STRUCTURE);
      setStudents(INITIAL_STUDENTS);
      setReceipts(INITIAL_RECEIPTS);
      setExpenses(INITIAL_EXPENSES);
      setStaffMembers(INITIAL_STAFF_MEMBERS);
      setPayrollRecordsByMonth({});
      setDailyAttendance(INITIAL_DAILY_STUDENT_ATTENDANCE);
      void safeBrowserStorage.clearJson('wisdom_school_info');
      void safeBrowserStorage.clearJson('wisdom_class_list');
      void safeBrowserStorage.clearJson('wisdom_fee_structure');
      void safeBrowserStorage.clearJson('wisdom_students');
      void safeBrowserStorage.clearJson('wisdom_receipts');
      void safeBrowserStorage.clearJson('wisdom_expenses');
      void safeBrowserStorage.clearJson('wisdom_staff_members');
      void safeBrowserStorage.clearJson('wisdom_payroll_records');
      void safeBrowserStorage.clearJson('wisdom_daily_attendance');
    }
  };

  const exportDatabaseJson = () => {
    const data = {
      exportDate: new Date().toISOString(),
      schoolInfo,
      classList,
      feeStructure,
      students,
      receipts,
      expenses,
      staffMembers,
      dailyAttendance,
      payrollRecordsByMonth,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WisdomSchool_DatabaseBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.students && parsed.receipts) {
        if (parsed.schoolInfo) setSchoolInfo(parsed.schoolInfo);
        if (parsed.classList) setClassList(parsed.classList);
        if (parsed.feeStructure) setFeeStructure(parsed.feeStructure);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (isStaffMemberArray(parsed.staffMembers)) setStaffMembers(parsed.staffMembers);
        if (isPayrollRecordsByMonth(parsed.payrollRecordsByMonth)) {
          setPayrollRecordsByMonth(parsed.payrollRecordsByMonth);
        }
        if (isDailyAttendanceArray(parsed.dailyAttendance)) {
          setDailyAttendance(parsed.dailyAttendance);
        }
        setStudents(parsed.students);
        setReceipts(parsed.receipts);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Comprehensive stats computation
  const totalStudents = students.length;
  const totalRteStudents = students.filter(s => s.isRte).length;
  const totalRteTuitionWaived = students.filter(s => s.isRte).reduce((acc, s) => acc + (feeStructure[s.standard] || 0), 0);
  const totalFeeExpected = students.reduce((acc, s) => acc + getStudentTotalFee(s), 0);
  const totalCollected = receipts.reduce((acc, r) => acc + (r.amountPaid || 0), 0);
  const totalPending = Math.max(0, totalFeeExpected - totalCollected);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netSchoolBalance = totalCollected - totalExpenses;

  const totalVanExpected = students.reduce((acc, s) => acc + (s.vanFacility ? (s.vanFee || 0) : 0), 0);
  const totalVanCollected = receipts.reduce((acc, r) => acc + (r.breakdown.van || 0), 0);

  const totalSportsExpected = students.reduce((acc, s) => acc + (s.sportsFacility ? (s.sportsFee || 0) : 0), 0);
  const totalSportsCollected = receipts.reduce((acc, r) => acc + (r.breakdown.sports || 0), 0);

  const totalLateFeesCollected = receipts.reduce((acc, r) => acc + (r.breakdown.lateFee || 0), 0);

  const stats = {
    totalStudents,
    totalRteStudents,
    totalRteTuitionWaived,
    totalFeeExpected,
    totalCollected,
    totalPending,
    totalExpenses,
    netSchoolBalance,
    totalVanExpected,
    totalVanCollected,
    totalSportsExpected,
    totalSportsCollected,
    totalLateFeesCollected,
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolInfo,
        updateSchoolInfo,
        classList,
        addClass,
        deleteClass,
        feeStructure,
        updateFeeStructure,
        students,
        receipts,
        expenses,
        staffMembers,
        dailyAttendance,
        setDailyAttendance,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        payrollRecordsByMonth,
        setPayrollRecordsForMonth,
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        activeStudentPortal,
        setActiveStudentPortal,
        addStudent,
        importStudents,
        updateStudent,
        deleteStudent,
        recordPayment,
        updateReceipt,
        deleteReceipt,
        addExpense,
        updateExpense,
        deleteExpense,
        getStudentTotalFee,
        getStudentTotalPaid,
        getStudentPending,
        getStudentReceipts,
        stats,
        resetToDefaults,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
