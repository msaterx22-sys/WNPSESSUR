import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_STAFF_MEMBERS, 
  generateMonthlyPayroll, 
  MonthlyPayrollRecord,
  StaffMember 
} from '../../data/reportsData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { 
  DollarSign, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  PieChart, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Eye, 
  X, 
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Edit2,
  Trash2,
  Plus,
  Save,
  Check
} from 'lucide-react';

interface SalaryPayrollReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const SalaryPayrollReports: React.FC<SalaryPayrollReportsProps> = ({ onExportCsv }) => {
  const { schoolInfo } = useSchool();
  const [subTab, setSubTab] = useState<'payslip' | 'dept-summary' | 'bank-advice' | 'statutory' | 'deductions' | 'annual-tax'>('payslip');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-08');
  const [viewingPayslip, setViewingPayslip] = useState<MonthlyPayrollRecord | null>(null);

  // Local state for payroll records across months
  const [payrollRecordsMap, setPayrollRecordsMap] = useState<Record<string, MonthlyPayrollRecord[]>>({
    '2024-08': generateMonthlyPayroll('2024-08'),
  });

  const payrollRecords = payrollRecordsMap[selectedMonth] || generateMonthlyPayroll(selectedMonth);

  const setPayrollRecords = (updater: (prev: MonthlyPayrollRecord[]) => MonthlyPayrollRecord[]) => {
    setPayrollRecordsMap(prevMap => {
      const current = prevMap[selectedMonth] || generateMonthlyPayroll(selectedMonth);
      const updated = updater(current);
      return { ...prevMap, [selectedMonth]: updated };
    });
  };

  // Edit / Add Payroll State
  const [editingPayroll, setEditingPayroll] = useState<MonthlyPayrollRecord | null>(null);
  const [isAddingPayroll, setIsAddingPayroll] = useState<boolean>(false);

  const handleDeletePayrollRecord = (payrollId: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete payroll record for "${staffName}"?`)) {
      setPayrollRecords(prev => prev.filter(p => p.payrollId !== payrollId));
    }
  };

  const handleSavePayrollRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;
    const basic = Number(editingPayroll.basicSalary) || 0;
    const hra = Number(editingPayroll.hra) || 0;
    const da = Number(editingPayroll.da) || 0;
    const conveyance = Number(editingPayroll.conveyance) || 0;
    const spl = Number(editingPayroll.specialAllowance) || 0;
    const gross = basic + hra + da + conveyance + spl;

    const epf = Number(editingPayroll.epfEmployee) || 0;
    const esi = Number(editingPayroll.esiEmployee) || 0;
    const pt = Number(editingPayroll.professionalTax) || 0;
    const adv = Number(editingPayroll.advanceOrLoanDeduction) || 0;
    const ded = epf + esi + pt + adv;

    const net = gross - ded;

    const recordToSave: MonthlyPayrollRecord = {
      ...editingPayroll,
      basicSalary: basic,
      hra,
      da,
      conveyance,
      specialAllowance: spl,
      grossSalary: gross,
      epfEmployee: epf,
      esiEmployee: esi,
      professionalTax: pt,
      advanceOrLoanDeduction: adv,
      totalDeductions: ded,
      netPayable: net,
      month: selectedMonth,
    };

    if (isAddingPayroll) {
      setPayrollRecords(prev => [recordToSave, ...prev]);
    } else {
      setPayrollRecords(prev => prev.map(p => p.payrollId === recordToSave.payrollId ? recordToSave : p));
    }

    setEditingPayroll(null);
    setIsAddingPayroll(false);
  };

  // Individual Payslip PDF Download
  const handleDownloadSlipPdf = (p: MonthlyPayrollRecord) => {
    const headers = ['Component Category', 'Earnings Head', 'Amount (INR)', 'Deductions Head', 'Amount (INR)'];
    const rows = [
      ['Standard Pay', 'Basic Salary', formatCurrency(p.basicSalary), 'EPF (12%)', formatCurrency(p.epfEmployee)],
      ['Allowances', 'House Rent Allowance (HRA)', formatCurrency(p.hra), 'ESI (0.75%)', formatCurrency(p.esiEmployee)],
      ['Allowances', 'Dearness Allowance (DA)', formatCurrency(p.da), 'Professional Tax', formatCurrency(p.professionalTax)],
      ['Allowances', 'Conveyance Allowance', formatCurrency(p.conveyance), 'Advance / Loan Recovery', formatCurrency(p.advanceOrLoanDeduction)],
      ['Allowances', 'Special Allowance', formatCurrency(p.specialAllowance), '-', '-'],
      ['Summary', 'Gross Earnings', formatCurrency(p.grossSalary), 'Total Deductions', formatCurrency(p.totalDeductions)],
      ['Net Salary Disbursed', '', formatCurrency(p.netPayable), `Mode: ${p.paymentMode}`, `Ref: ${p.transactionReference}`],
    ];
    const doc = generateReportTablePdf(`Official Salary Pay Slip - ${p.month}`, `Employee: ${p.staffName} (${p.employeeCode}) | Dept: ${p.department}`, headers, rows, schoolInfo);
    doc.save(`Payslip_${p.employeeCode}_${p.month}.pdf`);
  };

  // 1. Calculations for Department Summary
  const deptStats: Record<string, { count: number; basicSum: number; allowancesSum: number; grossSum: number; dedSum: number; netSum: number }> = {};
  payrollRecords.forEach(p => {
    if (!deptStats[p.department]) {
      deptStats[p.department] = { count: 0, basicSum: 0, allowancesSum: 0, grossSum: 0, dedSum: 0, netSum: 0 };
    }
    const allowances = p.hra + p.da + p.conveyance + p.specialAllowance;
    deptStats[p.department].count += 1;
    deptStats[p.department].basicSum += p.basicSalary;
    deptStats[p.department].allowancesSum += allowances;
    deptStats[p.department].grossSum += p.grossSalary;
    deptStats[p.department].dedSum += p.totalDeductions;
    deptStats[p.department].netSum += p.netPayable;
  });

  // Overall Totals
  const totalGross = payrollRecords.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNet = payrollRecords.reduce((sum, p) => sum + p.netPayable, 0);
  const totalEPF = payrollRecords.reduce((sum, p) => sum + p.epfEmployee, 0);
  const totalESI = payrollRecords.reduce((sum, p) => sum + p.esiEmployee, 0);
  const totalProfTax = payrollRecords.reduce((sum, p) => sum + p.professionalTax, 0);
  const totalAdvances = payrollRecords.reduce((sum, p) => sum + p.advanceOrLoanDeduction, 0);
  const totalDeductionsAll = payrollRecords.reduce((sum, p) => sum + p.totalDeductions, 0);

  const handleExport = () => {
    if (subTab === 'payslip') {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Department', 'Basic Pay', 'HRA', 'DA', 'Conveyance', 'Special Allw', 'Gross', 'EPF', 'ESI', 'Prof Tax', 'Advances', 'Total Ded', 'Net Payable', 'Mode', 'Bank Ref'];
      const rows = payrollRecords.map(p => [
        p.employeeCode,
        `"${p.staffName}"`,
        `"${p.designation}"`,
        `"${p.department}"`,
        p.basicSalary,
        p.hra,
        p.da,
        p.conveyance,
        p.specialAllowance,
        p.grossSalary,
        p.epfEmployee,
        p.esiEmployee,
        p.professionalTax,
        p.advanceOrLoanDeduction,
        p.totalDeductions,
        p.netPayable,
        p.paymentMode,
        p.transactionReference,
      ]);
      onExportCsv(`Salary_Sheet_${selectedMonth}`, headers, rows);
    } else if (subTab === 'dept-summary') {
      const headers = ['Department', 'Headcount', 'Basic Total', 'Allowances Total', 'Gross Payroll', 'Total Deductions', 'Net Disbursed', 'Share of Payroll %'];
      const rows = Object.entries(deptStats).map(([dept, s]) => [
        `"${dept}"`,
        s.count,
        s.basicSum,
        s.allowancesSum,
        s.grossSum,
        s.dedSum,
        s.netSum,
        `${((s.grossSum / (totalGross || 1)) * 100).toFixed(1)}%`,
      ]);
      onExportCsv(`Department_Payroll_Summary_${selectedMonth}`, headers, rows);
    } else if (subTab === 'bank-advice') {
      const headers = ['Sl No', 'Employee Code', 'Beneficiary Account Name', 'Bank Name', 'Account Number', 'IFSC Code', 'Amount (INR)', 'Payment Narrative / Narration'];
      const rows = payrollRecords.map((p, idx) => [
        idx + 1,
        p.employeeCode,
        `"${p.staffName}"`,
        `"${p.bankName}"`,
        `'${p.accountNo}`,
        p.ifscCode,
        p.netPayable,
        `SALARY-${selectedMonth}-${p.employeeCode}`,
      ]);
      onExportCsv(`Bank_Payment_Advice_${selectedMonth}`, headers, rows);
    } else if (subTab === 'statutory') {
      const headers = ['Emp Code', 'Staff Name', 'UAN Number', 'Basic Wages', 'Employee PF (12%)', 'Employer PF (12%)', 'Employee ESI (0.75%)', 'Employer ESI (3.25%)', 'Total Statutory Remittance'];
      const rows = payrollRecords.map(p => {
        const employerPF = p.epfEmployee; // Matching 12%
        const employerESI = Math.round(p.grossSalary * 0.0325);
        return [
          p.employeeCode,
          `"${p.staffName}"`,
          p.uanNumber,
          p.basicSalary,
          p.epfEmployee,
          employerPF,
          p.esiEmployee,
          employerESI,
          p.epfEmployee + employerPF + p.esiEmployee + employerESI,
        ];
      });
      onExportCsv(`Statutory_EPF_ESI_Compliance_${selectedMonth}`, headers, rows);
    } else if (subTab === 'deductions') {
      const headers = ['Component Category', 'Component Name', 'Total Monthly Value (INR)', 'Percentage of Gross'];
      const rows = [
        ['Earnings / Allowance', 'Basic Salary', payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0), '58.5%'],
        ['Earnings / Allowance', 'House Rent Allowance (HRA)', payrollRecords.reduce((sum, p) => sum + p.hra, 0), '11.7%'],
        ['Earnings / Allowance', 'Dearness Allowance (DA)', payrollRecords.reduce((sum, p) => sum + p.da, 0), '8.8%'],
        ['Earnings / Allowance', 'Conveyance Allowance', payrollRecords.reduce((sum, p) => sum + p.conveyance, 0), '6.1%'],
        ['Earnings / Allowance', 'Special / Admin Allowance', payrollRecords.reduce((sum, p) => sum + p.specialAllowance, 0), '6.5%'],
        ['Statutory Deduction', 'Employee Provident Fund (EPF 12%)', totalEPF, `${((totalEPF / totalGross) * 100).toFixed(1)}%`],
        ['Statutory Deduction', 'Employee State Insurance (ESI 0.75%)', totalESI, `${((totalESI / totalGross) * 100).toFixed(1)}%`],
        ['State Tax', 'Professional Tax (Tamil Nadu)', totalProfTax, `${((totalProfTax / totalGross) * 100).toFixed(1)}%`],
        ['Recovery / Advance', 'Salary Advances Recovered', totalAdvances, `${((totalAdvances / totalGross) * 100).toFixed(1)}%`],
      ];
      onExportCsv(`Deductions_and_Allowances_Breakdown_${selectedMonth}`, headers, rows);
    } else {
      const headers = ['Emp Code', 'Staff Name', 'PAN Number', 'Gross Annual CTC (INR)', 'Standard Deduction', 'Net Taxable Income', 'Tax Regime', 'Estimated Annual TDS'];
      const rows = payrollRecords.map(p => {
        const annualGross = p.grossSalary * 12;
        const stdDed = 50000;
        const taxable = Math.max(0, annualGross - stdDed);
        const tds = taxable > 700000 ? Math.round((taxable - 700000) * 0.1) : 0;
        return [
          p.employeeCode,
          `"${p.staffName}"`,
          p.panNumber,
          annualGross,
          stdDed,
          taxable,
          'New Tax Regime (Sec 115BAC)',
          tds,
        ];
      });
      onExportCsv(`Annual_Salary_and_Tax_Form16_Summary`, headers, rows);
    }
  };

  const handleExportPdf = () => {
    if (subTab === 'payslip') {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Basic', 'HRA+DA', 'Gross', 'EPF', 'ESI+PT', 'Net Pay', 'Mode'];
      const rows = payrollRecords.map(p => [
        p.employeeCode,
        p.staffName,
        p.designation,
        formatCurrency(p.basicSalary),
        formatCurrency(p.hra + p.da),
        formatCurrency(p.grossSalary),
        formatCurrency(p.epfEmployee),
        formatCurrency(p.esiEmployee + p.professionalTax),
        formatCurrency(p.netPayable),
        p.paymentMode,
      ]);
      const doc = generateReportTablePdf(`Monthly Salary Sheet - ${selectedMonth}`, `Total Staff: ${payrollRecords.length} | Gross Wages: ${formatCurrency(totalGross)} | Net Disbursed: ${formatCurrency(totalNet)}`, headers, rows, schoolInfo);
      doc.save(`Salary_Sheet_${selectedMonth}.pdf`);
    } else if (subTab === 'dept-summary') {
      const headers = ['Department', 'Headcount', 'Basic Total', 'Allowances', 'Gross Wages', 'Deductions', 'Net Disbursed', 'Share %'];
      const rows = Object.entries(deptStats).map(([dept, s]) => [
        dept,
        s.count,
        formatCurrency(s.basicSum),
        formatCurrency(s.allowancesSum),
        formatCurrency(s.grossSum),
        formatCurrency(s.dedSum),
        formatCurrency(s.netSum),
        `${((s.grossSum / (totalGross || 1)) * 100).toFixed(1)}%`,
      ]);
      const doc = generateReportTablePdf(`Department Wage Bill Summary - ${selectedMonth}`, `Total Departments: ${Object.keys(deptStats).length} | Gross Wages: ${formatCurrency(totalGross)}`, headers, rows, schoolInfo);
      doc.save(`Department_Payroll_${selectedMonth}.pdf`);
    } else if (subTab === 'bank-advice') {
      const headers = ['Sl', 'Emp Code', 'Staff Name', 'Bank Name', 'Account No', 'IFSC', 'Amount', 'Payment Ref'];
      const rows = payrollRecords.map((p, idx) => [
        idx + 1,
        p.employeeCode,
        p.staffName,
        p.bankName,
        p.accountNo,
        p.ifscCode,
        formatCurrency(p.netPayable),
        `SALARY-${selectedMonth}-${p.employeeCode}`,
      ]);
      const doc = generateReportTablePdf(`Bank Payment Advice & NEFT Transfer - ${selectedMonth}`, `Total Disbursed: ${formatCurrency(totalNet)} | Beneficiaries: ${payrollRecords.length}`, headers, rows, schoolInfo);
      doc.save(`Bank_Payment_Advice_${selectedMonth}.pdf`);
    } else if (subTab === 'statutory') {
      const headers = ['Emp Code', 'Staff Name', 'UAN Number', 'EPF Wages', 'EE PF (12%)', 'ER PF (12%)', 'EE ESI (0.75%)', 'ER ESI (3.25%)', 'Total Remittance'];
      const rows = payrollRecords.map(p => {
        const erPF = p.epfEmployee;
        const erESI = Math.round(p.grossSalary * 0.0325);
        return [
          p.employeeCode,
          p.staffName,
          p.uanNumber,
          formatCurrency(p.basicSalary),
          formatCurrency(p.epfEmployee),
          formatCurrency(erPF),
          formatCurrency(p.esiEmployee),
          formatCurrency(erESI),
          formatCurrency(p.epfEmployee + erPF + p.esiEmployee + erESI),
        ];
      });
      const doc = generateReportTablePdf(`Statutory EPF & ESI Compliance - ${selectedMonth}`, `Total Remittance: ${formatCurrency(totalEPF * 2 + totalESI + Math.round(totalGross * 0.0325))}`, headers, rows, schoolInfo);
      doc.save(`Statutory_EPF_ESI_${selectedMonth}.pdf`);
    } else if (subTab === 'deductions') {
      const headers = ['Category', 'Component', 'Monthly Amount', 'Share of Gross'];
      const rows = [
        ['Earnings', 'Basic Salary', formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0)), '58.5%'],
        ['Earnings', 'House Rent Allowance (HRA)', formatCurrency(payrollRecords.reduce((sum, p) => sum + p.hra, 0)), '11.7%'],
        ['Earnings', 'Dearness Allowance (DA)', formatCurrency(payrollRecords.reduce((sum, p) => sum + p.da, 0)), '8.8%'],
        ['Earnings', 'Conveyance Allowance', formatCurrency(payrollRecords.reduce((sum, p) => sum + p.conveyance, 0)), '6.1%'],
        ['Earnings', 'Special Allowance', formatCurrency(payrollRecords.reduce((sum, p) => sum + p.specialAllowance, 0)), '6.5%'],
        ['Deduction', 'EPF (12%)', formatCurrency(totalEPF), `${((totalEPF / totalGross) * 100).toFixed(1)}%`],
        ['Deduction', 'ESI (0.75%)', formatCurrency(totalESI), `${((totalESI / totalGross) * 100).toFixed(1)}%`],
        ['State Tax', 'Professional Tax', formatCurrency(totalProfTax), `${((totalProfTax / totalGross) * 100).toFixed(1)}%`],
        ['Recovery', 'Salary Advances', formatCurrency(totalAdvances), `${((totalAdvances / totalGross) * 100).toFixed(1)}%`],
      ];
      const doc = generateReportTablePdf(`Allowances & Deductions Breakdown - ${selectedMonth}`, `Gross: ${formatCurrency(totalGross)} | Deductions: ${formatCurrency(totalDeductionsAll)} | Net: ${formatCurrency(totalNet)}`, headers, rows, schoolInfo);
      doc.save(`Deductions_Allowances_${selectedMonth}.pdf`);
    } else {
      const headers = ['Emp Code', 'Staff Name', 'PAN', 'Annual CTC', 'Std Ded', 'Taxable Salary', 'Tax Regime', 'Est. TDS'];
      const rows = payrollRecords.map(p => {
        const annualGross = p.grossSalary * 12;
        const stdDed = 50000;
        const taxable = Math.max(0, annualGross - stdDed);
        const tds = taxable > 700000 ? Math.round((taxable - 700000) * 0.1) : 0;
        return [
          p.employeeCode,
          p.staffName,
          p.panNumber,
          formatCurrency(annualGross),
          formatCurrency(stdDed),
          formatCurrency(taxable),
          'New Regime (115BAC)',
          tds > 0 ? formatCurrency(tds) : 'NIL',
        ];
      });
      const doc = generateReportTablePdf(`Annual Salary & Tax Form 16 Summary (FY 2024-25)`, `Assessment Year: 2025-26 | Total Staff: ${payrollRecords.length}`, headers, rows, schoolInfo);
      doc.save(`Annual_Salary_Tax_Form16.pdf`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-1.5 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSubTab('payslip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'payslip' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Monthly Salary Sheet</span>
          </button>
          <button
            onClick={() => setSubTab('dept-summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'dept-summary' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Department Summary</span>
          </button>
          <button
            onClick={() => setSubTab('bank-advice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'bank-advice' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bank Payment Advice</span>
          </button>
          <button
            onClick={() => setSubTab('statutory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'statutory' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>EPF & ESI Statutory</span>
          </button>
          <button
            onClick={() => setSubTab('deductions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'deductions' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Deductions & Allowances</span>
          </button>
          <button
            onClick={() => setSubTab('annual-tax')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'annual-tax' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Annual Tax & Form 16</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8E2] hover:bg-gray-50 text-[#2D312E] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4F6D7A]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8E2] hover:bg-gray-50 text-[#2D312E] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#4F6D7A]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Monthly Gross Wages</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{formatCurrency(totalGross)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">12 Staff Members on Roll</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Statutory Deductions</span>
          <span className="text-base font-extrabold text-[#D68A6E] font-mono mt-0.5 block">{formatCurrency(totalDeductionsAll)}</span>
          <span className="text-[10px] text-[#D68A6E] font-bold mt-1 block">EPF, ESI & Professional Tax</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Net Bank Disbursement</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{formatCurrency(totalNet)}</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">Disbursed on {selectedMonth}-31</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">EPF Statutory Remittance</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{formatCurrency(totalEPF * 2)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">Employee (12%) + Employer (12%)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTHLY SALARY SHEET / PAYSLIP TAB                                     */}
      {/* ========================================================================= */}
      {subTab === 'payslip' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280] font-medium">Payroll Cycle:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newCode = `EMP-${String(payrollRecords.length + 1).padStart(3, '0')}`;
                  setEditingPayroll({
                    payrollId: `pay-${Date.now()}`,
                    staffId: `staff-${Date.now()}`,
                    employeeCode: newCode,
                    staffName: '',
                    designation: 'Teacher',
                    department: 'Academics',
                    month: selectedMonth,
                    basicSalary: 25000,
                    hra: 5000,
                    da: 3750,
                    conveyance: 2600,
                    specialAllowance: 2750,
                    grossSalary: 39100,
                    epfEmployee: 1800,
                    esiEmployee: 293,
                    professionalTax: 208,
                    advanceOrLoanDeduction: 0,
                    totalDeductions: 2301,
                    netPayable: 36799,
                    bankName: 'State Bank of India',
                    accountNo: '30491823901',
                    ifscCode: 'SBIN0001234',
                    paymentMode: 'Bank Transfer (NEFT)',
                    transactionReference: `NEFT${Date.now().toString().slice(-8)}`,
                    uanNumber: '100928374615',
                    panNumber: 'ABCDE1234F',
                  });
                  setIsAddingPayroll(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Salary Entry</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-right">Basic Pay</th>
                    <th className="py-2.5 px-3 text-right">HRA / DA</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#2D312E]">Gross Earnings</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">EPF (12%)</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">ESI / PT</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894] font-black">Net Pay</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {payrollRecords.map((p) => (
                    <tr key={p.payrollId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.employeeCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{p.staffName}</td>
                      <td className="py-2.5 px-3 font-medium text-[#4F6D7A]">{p.designation}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(p.basicSalary)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(p.hra + p.da)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(p.grossSalary)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(p.epfEmployee)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(p.esiEmployee + p.professionalTax)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-[#89A894] text-sm">{formatCurrency(p.netPayable)}</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingPayslip(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#4F6D7A]/10 hover:bg-[#4F6D7A]/20 text-[#4F6D7A] font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="View Payslip"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Slip</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingPayroll({ ...p });
                              setIsAddingPayroll(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Edit Payroll Record"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePayrollRecord(p.payrollId, p.staffName)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-3 px-3 uppercase text-[#2D312E]" colSpan={3}>Total Payroll</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + (p.hra + p.da), 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#2D312E]">{formatCurrency(totalGross)}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(totalEPF)}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(totalESI + totalProfTax)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#89A894]">{formatCurrency(totalNet)}</td>
                    <td className="no-print py-3 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEPARTMENT & DESIGNATION SUMMARY TAB                                   */}
      {/* ========================================================================= */}
      {subTab === 'dept-summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4F6D7A]" />
                Departmental & Cost Center Wage Bill Summary
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Breakdown of school compensation by academic, transport, administrative, and auxiliary staff
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Department Division</th>
                    <th className="py-2.5 px-3 text-center">Headcount</th>
                    <th className="py-2.5 px-3 text-right">Basic Wages</th>
                    <th className="py-2.5 px-3 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Gross Payroll</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">Deductions</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894] font-black">Net Disbursed</th>
                    <th className="py-2.5 px-3 text-center">Budget Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {Object.entries(deptStats).map(([dept, s]) => {
                    const share = (s.grossSum / (totalGross || 1)) * 100;
                    return (
                      <tr key={dept} className="hover:bg-[#F7F8F6]/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#4F6D7A]">{dept}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">{s.count} Staff</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(s.basicSum)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(s.allowancesSum)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(s.grossSum)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(s.dedSum)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-[#89A894]">{formatCurrency(s.netSum)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold text-[11px] px-2 py-0.5 rounded">
                            {share.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-3 px-3 uppercase text-[#2D312E]">Total Institutional Expenditure</td>
                    <td className="py-3 px-3 text-center font-mono">12 Staff</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(totalGross - payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#2D312E]">{formatCurrency(totalGross)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#D68A6E]">{formatCurrency(totalDeductionsAll)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#89A894]">{formatCurrency(totalNet)}</td>
                    <td className="py-3 px-3 text-center">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BANK PAYMENT ADVICE (NEFT / RTGS REGISTER)                             */}
      {/* ========================================================================= */}
      {subTab === 'bank-advice' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#4F6D7A]" />
                  Bank Electronic Payment Advice & NEFT Salary Transfer Schedule
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Official direct bank transfer instruction sheet formatted for corporate net banking batch upload
                </p>
              </div>
              <span className="text-xs font-bold text-[#89A894] bg-white border border-[#E2E8E2] px-2.5 py-1 rounded-lg">
                Total Transfer: {formatCurrency(totalNet)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3 text-center">Sl #</th>
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Beneficiary Staff Name</th>
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3">Account Number</th>
                    <th className="py-2.5 px-3">IFSC Code</th>
                    <th className="py-2.5 px-3 text-right font-black text-[#89A894]">Transfer Amount</th>
                    <th className="py-2.5 px-3">Payment Narration</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {payrollRecords.map((p, idx) => (
                    <tr key={p.payrollId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{p.employeeCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{p.staffName}</td>
                      <td className="py-2.5 px-3 font-medium text-[#2D312E]">{p.bankName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2D312E]">{p.accountNo}</td>
                      <td className="py-2.5 px-3 font-mono text-[#4F6D7A]">{p.ifscCode}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-[#89A894] text-sm">
                        {formatCurrency(p.netPayable)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7280]">
                        SALARY-{selectedMonth}-{p.employeeCode}
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingPayroll({ ...p });
                              setIsAddingPayroll(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Edit Bank / Salary Record"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeletePayrollRecord(p.payrollId, p.staffName)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STATUTORY EPF / ESI COMPLIANCE SUMMARY                                */}
      {/* ========================================================================= */}
      {subTab === 'statutory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4F6D7A]" />
                Statutory EPF & ESI Monthly Compliance Ledger
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Statutory deductions per EPFO & ESIC norms with employee & matching employer contribution calculations
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">UAN Number</th>
                    <th className="py-2.5 px-3 text-right">EPF Wages (Basic)</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">EE PF (12%)</th>
                    <th className="py-2.5 px-3 text-right text-[#4F6D7A]">ER PF (12%)</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">EE ESI (0.75%)</th>
                    <th className="py-2.5 px-3 text-right text-[#4F6D7A]">ER ESI (3.25%)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#2D312E]">Total Remittance</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {payrollRecords.map((p) => {
                    const erPF = p.epfEmployee;
                    const erESI = Math.round(p.grossSalary * 0.0325);
                    const totalRemit = p.epfEmployee + erPF + p.esiEmployee + erESI;
                    return (
                      <tr key={p.payrollId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.employeeCode}</td>
                        <td className="py-2.5 px-3 font-bold text-[#2D312E]">{p.staffName}</td>
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.uanNumber}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(p.basicSalary)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(p.epfEmployee)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#4F6D7A]">{formatCurrency(erPF)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(p.esiEmployee)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#4F6D7A]">{formatCurrency(erESI)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(totalRemit)}</td>
                        <td className="no-print py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setEditingPayroll({ ...p });
                              setIsAddingPayroll(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                            title="Edit Statutory Details"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-3 px-3 uppercase text-[#2D312E]" colSpan={3}>Combined Statutory Liabilities</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(totalEPF)}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#4F6D7A]">{formatCurrency(totalEPF)}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#D68A6E]">{formatCurrency(totalESI)}</td>
                    <td className="py-3 px-3 text-right font-mono text-[#4F6D7A]">{formatCurrency(Math.round(totalGross * 0.0325))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#4F6D7A]">
                      {formatCurrency(totalEPF * 2 + totalESI + Math.round(totalGross * 0.0325))}
                    </td>
                    <td className="no-print py-3 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DEDUCTIONS & ALLOWANCES BREAKDOWN TAB                                  */}
      {/* ========================================================================= */}
      {subTab === 'deductions' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
            <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#4F6D7A]" />
              Allowances vs Deductions Component Audit
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Detailed breakdown of earnings allowances and statutory/voluntary deductions
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Allowances Column */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#4F6D7A] pb-1.5 border-b border-[#E2E8E2]">
                Earnings & Allowance Heads
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Basic Salary</span>
                  <span className="font-mono font-bold">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-bold">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.hra, 0))}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Dearness Allowance (DA)</span>
                  <span className="font-mono font-bold">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.da, 0))}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Conveyance Allowance</span>
                  <span className="font-mono font-bold">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.conveyance, 0))}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Special & Academic Allowance</span>
                  <span className="font-mono font-bold">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.specialAllowance, 0))}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#4F6D7A]/10 border border-[#4F6D7A]/20">
                  <span className="font-bold text-[#4F6D7A]">Total Gross Earnings</span>
                  <span className="font-mono font-black text-[#4F6D7A] text-sm">{formatCurrency(totalGross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#D68A6E] pb-1.5 border-b border-[#E2E8E2]">
                Deductions & Recoveries
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Employee Provident Fund (EPF 12%)</span>
                  <span className="font-mono font-bold text-[#D68A6E]">{formatCurrency(totalEPF)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Employee State Insurance (ESI 0.75%)</span>
                  <span className="font-mono font-bold text-[#D68A6E]">{formatCurrency(totalESI)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Professional Tax (Tamil Nadu)</span>
                  <span className="font-mono font-bold text-[#D68A6E]">{formatCurrency(totalProfTax)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F7F8F6]">
                  <span className="font-medium text-[#2D312E]">Salary Advances / Loan Recovery</span>
                  <span className="font-mono font-bold text-[#D68A6E]">{formatCurrency(totalAdvances)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#D68A6E]/10 border border-[#D68A6E]/20">
                  <span className="font-bold text-[#D68A6E]">Total Deductions</span>
                  <span className="font-mono font-black text-[#D68A6E] text-sm">{formatCurrency(totalDeductionsAll)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#89A894]/20 border border-[#89A894]/30">
                  <span className="font-black text-[#2D312E]">Net Payable to Faculty</span>
                  <span className="font-mono font-black text-[#89A894] text-base">{formatCurrency(totalNet)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ANNUAL SALARY & TAX STATEMENT (FORM 16 SUMMARY)                        */}
      {/* ========================================================================= */}
      {subTab === 'annual-tax' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#4F6D7A]" />
                  Annual Compensation & Form 16 Tax Statement (FY 2024-25)
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Projected 12-month CTC, Standard Deduction u/s 16(ia), and Net Taxable Income assessment
                </p>
              </div>
              <span className="text-xs bg-white border border-[#E2E8E2] px-2.5 py-1 rounded font-bold text-[#4F6D7A]">
                Assessment Year: 2025-26
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">PAN Number</th>
                    <th className="py-2.5 px-3 text-right">Annual Gross CTC</th>
                    <th className="py-2.5 px-3 text-right text-[#6B7280]">Std Deduction</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#2D312E]">Net Taxable Salary</th>
                    <th className="py-2.5 px-3 text-center">Tax Regime</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894]">Est. TDS Deducted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {payrollRecords.map((p) => {
                    const annualGross = p.grossSalary * 12;
                    const stdDed = 50000;
                    const taxable = Math.max(0, annualGross - stdDed);
                    const tds = taxable > 700000 ? Math.round((taxable - 700000) * 0.1) : 0;
                    return (
                      <tr key={p.payrollId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{p.employeeCode}</td>
                        <td className="py-2.5 px-3 font-bold text-[#2D312E]">{p.staffName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{p.panNumber}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatCurrency(annualGross)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(stdDed)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(taxable)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-[#89A894]/20 text-[#2D312E] text-[10px] font-bold px-2 py-0.5 rounded">
                            New Regime (115BAC)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#89A894] font-bold">
                          {tds > 0 ? formatCurrency(tds) : 'NIL (Rebate 87A)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INDIVIDUAL PAYSLIP MODAL / PRINT PREVIEW                                  */}
      {/* ========================================================================= */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E2E8E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="no-print px-5 py-3.5 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4F6D7A]" />
                <h4 className="font-bold text-sm text-[#2D312E]">Official Salary Pay Slip</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSlipPdf(viewingPayslip)}
                  className="px-3 py-1 bg-[#89A894] text-white text-xs font-bold rounded-lg hover:bg-[#789683] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-[#4F6D7A] text-white text-xs font-bold rounded-lg hover:bg-[#415A65] flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Pay Slip Layout */}
            <div className="p-6 space-y-4 text-xs font-sans">
              {/* School Header */}
              <div className="text-center border-b border-[#E2E8E2] pb-3 space-y-0.5">
                <h2 className="font-extrabold text-base text-[#4F6D7A] uppercase tracking-wide">
                  Wisdom Nursery and Primary School
                </h2>
                <p className="text-[11px] text-[#6B7280]">Essur Village & Post - 603301</p>
                <p className="text-[11px] font-bold text-[#2D312E] pt-1">
                  SALARY SLIP FOR THE MONTH OF {viewingPayslip.month.toUpperCase()}
                </p>
              </div>

              {/* Staff Details Grid */}
              <div className="grid grid-cols-2 gap-2 bg-[#F7F8F6] p-3 rounded-xl border border-[#E2E8E2] text-[11px]">
                <div>
                  <span className="text-[#6B7280]">Employee Name: </span>
                  <strong className="text-[#2D312E]">{viewingPayslip.staffName}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Employee Code: </span>
                  <strong className="font-mono text-[#4F6D7A]">{viewingPayslip.employeeCode}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Designation: </span>
                  <strong className="text-[#2D312E]">{viewingPayslip.designation}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Department: </span>
                  <strong className="text-[#2D312E]">{viewingPayslip.department}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Bank Account: </span>
                  <strong className="font-mono text-[#2D312E]">{viewingPayslip.bankName} - {viewingPayslip.accountNo}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">UAN / PAN: </span>
                  <strong className="font-mono text-[#2D312E]">{viewingPayslip.uanNumber} / {viewingPayslip.panNumber}</strong>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-2 gap-4 border border-[#E2E8E2] rounded-xl overflow-hidden">
                {/* Earnings */}
                <div className="border-r border-[#E2E8E2]">
                  <div className="bg-[#F2F4F2] p-2 font-bold text-[#4F6D7A] border-b border-[#E2E8E2]">Earnings</div>
                  <div className="p-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Basic Pay</span>
                      <span className="font-mono font-medium">{formatCurrency(viewingPayslip.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">HRA</span>
                      <span className="font-mono font-medium">{formatCurrency(viewingPayslip.hra)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">DA</span>
                      <span className="font-mono font-medium">{formatCurrency(viewingPayslip.da)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Conveyance</span>
                      <span className="font-mono font-medium">{formatCurrency(viewingPayslip.conveyance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Special Allowance</span>
                      <span className="font-mono font-medium">{formatCurrency(viewingPayslip.specialAllowance)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#E2E8E2] font-bold">
                      <span>Gross Earnings</span>
                      <span className="font-mono text-[#4F6D7A]">{formatCurrency(viewingPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div className="bg-[#F2F4F2] p-2 font-bold text-[#D68A6E] border-b border-[#E2E8E2]">Deductions</div>
                  <div className="p-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">EPF Employee (12%)</span>
                      <span className="font-mono font-medium text-[#D68A6E]">{formatCurrency(viewingPayslip.epfEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">ESI Employee (0.75%)</span>
                      <span className="font-mono font-medium text-[#D68A6E]">{formatCurrency(viewingPayslip.esiEmployee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Professional Tax</span>
                      <span className="font-mono font-medium text-[#D68A6E]">{formatCurrency(viewingPayslip.professionalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Salary Advance</span>
                      <span className="font-mono font-medium text-[#D68A6E]">{formatCurrency(viewingPayslip.advanceOrLoanDeduction)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#E2E8E2] font-bold">
                      <span>Total Deductions</span>
                      <span className="font-mono text-[#D68A6E]">{formatCurrency(viewingPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight */}
              <div className="bg-[#89A894]/20 p-3 rounded-xl border border-[#89A894]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#2D312E] font-medium block">Net Salary Payable:</span>
                  <span className="text-[10px] text-[#6B7280]">Transferred via {viewingPayslip.paymentMode} ({viewingPayslip.transactionReference})</span>
                </div>
                <span className="text-lg font-black font-mono text-[#2D312E]">{formatCurrency(viewingPayslip.netPayable)}</span>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-[10px] text-[#6B7280]">
                <div>
                  <div className="h-8 border-b border-dashed border-[#6B7280]/40 mx-6 mb-1"></div>
                  <span>Staff Signature</span>
                </div>
                <div>
                  <div className="h-8 border-b border-dashed border-[#6B7280]/40 mx-6 mb-1"></div>
                  <span>Headmaster / Correspondent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* EDIT / ADD PAYROLL RECORD MODAL                                          */}
      {/* ========================================================================= */}
      {editingPayroll && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E2E8E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#4F6D7A]" />
                <h4 className="font-bold text-sm text-[#2D312E]">
                  {isAddingPayroll ? 'Create New Staff Payroll Record' : `Edit Payroll - ${editingPayroll.staffName || editingPayroll.employeeCode}`}
                </h4>
              </div>
              <button
                onClick={() => setEditingPayroll(null)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Staff Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={editingPayroll.employeeCode}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, employeeCode: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono text-[#2D312E]"
                    placeholder="EMP-013"
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Staff Full Name *</label>
                  <input
                    type="text"
                    value={editingPayroll.staffName}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, staffName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    placeholder="e.g., S. Vignesh"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Payroll Month</label>
                  <input
                    type="month"
                    value={editingPayroll.month || selectedMonth}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, month: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingPayroll.designation}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, designation: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                    placeholder="Senior Mathematics Teacher"
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Department</label>
                  <select
                    value={editingPayroll.department}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Support & Housekeeping">Support & Housekeeping</option>
                    <option value="Transport & Security">Transport & Security</option>
                  </select>
                </div>
              </div>

              {/* Earnings Section */}
              <div className="bg-[#F7F8F6] p-3 rounded-xl border border-[#E2E8E2] space-y-2">
                <span className="font-bold text-[#4F6D7A] block">Monthly Earnings Heads (INR)</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Basic Pay</label>
                    <input
                      type="number"
                      value={editingPayroll.basicSalary}
                      onChange={(e) => {
                        const basic = Number(e.target.value) || 0;
                        const hra = Math.round(basic * 0.20);
                        const da = Math.round(basic * 0.15);
                        const epf = Math.min(1800, Math.round(basic * 0.12));
                        setEditingPayroll({
                          ...editingPayroll,
                          basicSalary: basic,
                          hra,
                          da,
                          epfEmployee: epf,
                        });
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">HRA (20%)</label>
                    <input
                      type="number"
                      value={editingPayroll.hra}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, hra: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">DA (15%)</label>
                    <input
                      type="number"
                      value={editingPayroll.da}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, da: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Conveyance</label>
                    <input
                      type="number"
                      value={editingPayroll.conveyance}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, conveyance: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Special Allw</label>
                    <input
                      type="number"
                      value={editingPayroll.specialAllowance}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, specialAllowance: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#E2E8E2] text-[11px] font-bold">
                  <span className="text-[#6B7280]">Calculated Gross Earnings:</span>
                  <span className="font-mono text-[#4F6D7A]">
                    {formatCurrency(
                      (Number(editingPayroll.basicSalary) || 0) +
                      (Number(editingPayroll.hra) || 0) +
                      (Number(editingPayroll.da) || 0) +
                      (Number(editingPayroll.conveyance) || 0) +
                      (Number(editingPayroll.specialAllowance) || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="bg-[#F7F8F6] p-3 rounded-xl border border-[#E2E8E2] space-y-2">
                <span className="font-bold text-[#D68A6E] block">Monthly Deductions Heads (INR)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">EPF (12%)</label>
                    <input
                      type="number"
                      value={editingPayroll.epfEmployee}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, epfEmployee: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#D68A6E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">ESI (0.75%)</label>
                    <input
                      type="number"
                      value={editingPayroll.esiEmployee}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, esiEmployee: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#D68A6E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Prof. Tax (PT)</label>
                    <input
                      type="number"
                      value={editingPayroll.professionalTax}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, professionalTax: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#D68A6E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Advance / Loan</label>
                    <input
                      type="number"
                      value={editingPayroll.advanceOrLoanDeduction}
                      onChange={(e) => setEditingPayroll({ ...editingPayroll, advanceOrLoanDeduction: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#D68A6E]"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#E2E8E2] text-[11px] font-bold">
                  <span className="text-[#6B7280]">Calculated Total Deductions:</span>
                  <span className="font-mono text-[#D68A6E]">
                    {formatCurrency(
                      (Number(editingPayroll.epfEmployee) || 0) +
                      (Number(editingPayroll.esiEmployee) || 0) +
                      (Number(editingPayroll.professionalTax) || 0) +
                      (Number(editingPayroll.advanceOrLoanDeduction) || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Net Payable Realtime Preview */}
              {(() => {
                const gr = (Number(editingPayroll.basicSalary) || 0) +
                  (Number(editingPayroll.hra) || 0) +
                  (Number(editingPayroll.da) || 0) +
                  (Number(editingPayroll.conveyance) || 0) +
                  (Number(editingPayroll.specialAllowance) || 0);
                const dd = (Number(editingPayroll.epfEmployee) || 0) +
                  (Number(editingPayroll.esiEmployee) || 0) +
                  (Number(editingPayroll.professionalTax) || 0) +
                  (Number(editingPayroll.advanceOrLoanDeduction) || 0);
                const net = gr - dd;
                return (
                  <div className="bg-[#89A894]/20 p-2.5 rounded-xl border border-[#89A894]/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#2D312E] block">Estimated Net Take-Home Salary:</span>
                      <span className="text-[10px] text-[#6B7280]">Disbursed to account via {editingPayroll.paymentMode}</span>
                    </div>
                    <span className="text-base font-black font-mono text-[#2D312E]">{formatCurrency(net)}</span>
                  </div>
                );
              })()}

              {/* Bank & Statutory Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F2F4F2]/50 p-2.5 rounded-xl border border-[#E2E8E2]">
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={editingPayroll.bankName}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, bankName: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded text-xs"
                    placeholder="State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">Account Number</label>
                  <input
                    type="text"
                    value={editingPayroll.accountNo}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, accountNo: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-xs"
                    placeholder="30491823901"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">IFSC Code</label>
                  <input
                    type="text"
                    value={editingPayroll.ifscCode}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, ifscCode: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-xs"
                    placeholder="SBIN0001234"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">UAN Number</label>
                  <input
                    type="text"
                    value={editingPayroll.uanNumber}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, uanNumber: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-xs"
                    placeholder="100928374615"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">PAN Number</label>
                  <input
                    type="text"
                    value={editingPayroll.panNumber}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, panNumber: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-xs"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6B7280] mb-0.5">Txn / Voucher Ref</label>
                  <input
                    type="text"
                    value={editingPayroll.transactionReference}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, transactionReference: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-xs"
                    placeholder="NEFT99283711"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#F2F4F2] border-t border-[#E2E8E2] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPayroll(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayrollRecord}
                className="px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isAddingPayroll ? 'Create Salary Record' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
