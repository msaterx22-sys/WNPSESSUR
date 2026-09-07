import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  TrendingUp, 
  QrCode, 
  Banknote, 
  Calendar, 
  CheckCircle2,
  PieChart,
  Wallet,
  TrendingDown,
  GraduationCap,
  Users,
  BookOpen,
  Package,
  DollarSign,
  ClipboardList
} from 'lucide-react';

import { FeeConveyanceReports } from './reports/FeeConveyanceReports';
import { AttendanceReports } from './reports/AttendanceReports';
import { ExamReports } from './reports/ExamReports';
import { StaffReports } from './reports/StaffReports';
import { LibraryReports } from './reports/LibraryReports';
import { InventoryReports } from './reports/InventoryReports';
import { SalaryPayrollReports } from './reports/SalaryPayrollReports';

type ReportDomain = 
  | 'fee-conveyance'
  | 'attendance'
  | 'exam'
  | 'staff'
  | 'library'
  | 'inventory'
  | 'payroll'
  | 'cash-audit';

export interface MonthlyFinancialReportsProps {
  initialDomain?: ReportDomain;
}

export const MonthlyFinancialReports: React.FC<MonthlyFinancialReportsProps> = ({ initialDomain = 'fee-conveyance' }) => {
  const { 
    receipts, 
    schoolInfo, 
    students, 
    feeStructure, 
    classList, 
    expenses, 
    getStudentTotalFee, 
    getStudentTotalPaid,
    setActiveTab
  } = useSchool();

  const [activeDomain, setActiveDomain] = useState<ReportDomain>(initialDomain);

  React.useEffect(() => {
    if (initialDomain) {
      setActiveDomain(initialDomain);
    }
  }, [initialDomain]);

  // Generic CSV export helper used across all reporting tabs
  const handleExportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State and aggregations for Cash & Audit Register
  const availableMonths = Array.from(new Set(receipts.map(r => r.date.slice(0, 7)))).sort().reverse();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const defaultMonth = availableMonths.includes(currentMonthStr) ? currentMonthStr : (availableMonths[0] || currentMonthStr);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [reportScope, setReportScope] = useState<'month' | 'all'>('month');

  const filteredReceipts = receipts.filter(r => {
    if (reportScope === 'all') return true;
    return r.date.startsWith(selectedMonth);
  });

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalTuition = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0);
  const totalVan = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0);
  const totalSports = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0);
  const totalLateFee = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.lateFee || 0), 0);
  const totalOther = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.other || 0), 0);

  const upiCollected = filteredReceipts
    .filter(r => r.paymentMode === 'GPay / UPI')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const cashCollected = filteredReceipts
    .filter(r => r.paymentMode === 'Cash')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const dateMap: Record<string, { total: number; cash: number; upi: number; count: number }> = {};
  filteredReceipts.forEach(r => {
    if (!dateMap[r.date]) {
      dateMap[r.date] = { total: 0, cash: 0, upi: 0, count: 0 };
    }
    dateMap[r.date].total += r.amountPaid;
    dateMap[r.date].count += 1;
    if (r.paymentMode === 'GPay / UPI') dateMap[r.date].upi += r.amountPaid;
    if (r.paymentMode === 'Cash') dateMap[r.date].cash += r.amountPaid;
  });

  const dailyRecords = Object.entries(dateMap).sort((a, b) => b[0].localeCompare(a[0]));

  const filteredExpenses = expenses.filter(e => {
    if (reportScope === 'all') return true;
    return e.date.startsWith(selectedMonth);
  });

  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netSavingsSurplus = totalAmount - totalExpensesAmount;

  const handleExportCashAuditCSV = () => {
    const headers = ['Receipt No', 'Date', 'Admission No', 'Student Name', 'Standard', 'Mode', 'Tuition (INR)', 'Van (INR)', 'Sports (INR)', 'Late Fee (INR)', 'Total Paid (INR)', 'Reference'];
    const rows = filteredReceipts.map(r => [
      r.receiptNumber,
      r.date,
      r.admissionNo,
      `"${r.studentName}"`,
      r.standard,
      r.paymentMode,
      r.breakdown.tuition,
      r.breakdown.van,
      r.breakdown.sports,
      r.breakdown.lateFee,
      r.amountPaid,
      `"${r.transactionReference || ''}"`,
    ]);
    handleExportCsv(`WisdomSchool_FinancialReport_${reportScope === 'month' ? selectedMonth : 'FullYear'}`, headers, rows);
  };

  const domainTabs: { id: ReportDomain; label: string; badge: string; icon: React.ReactNode }[] = [
    { 
      id: 'fee-conveyance', 
      label: 'Fee & Conveyance', 
      badge: '4 types',
      icon: <Wallet className="w-4 h-4" /> 
    },
    { 
      id: 'attendance', 
      label: 'Attendance Reports', 
      badge: '3 types',
      icon: <Calendar className="w-4 h-4" /> 
    },
    { 
      id: 'exam', 
      label: 'Exam Reports', 
      badge: '3 types',
      icon: <GraduationCap className="w-4 h-4" /> 
    },
    { 
      id: 'staff', 
      label: 'Staff Reports', 
      badge: '2 types',
      icon: <Users className="w-4 h-4" /> 
    },
    { 
      id: 'library', 
      label: 'Library Reports', 
      badge: '3 types',
      icon: <BookOpen className="w-4 h-4" /> 
    },
    { 
      id: 'inventory', 
      label: 'Inventory Reports', 
      badge: '4 types',
      icon: <Package className="w-4 h-4" /> 
    },
    { 
      id: 'payroll', 
      label: 'Salary & Payroll', 
      badge: '6 types',
      icon: <DollarSign className="w-4 h-4" /> 
    },
    { 
      id: 'cash-audit', 
      label: 'Cash & Audit Register', 
      badge: 'Daily',
      icon: <FileSpreadsheet className="w-4 h-4" /> 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Category Navigator */}
      <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E8E2] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-[#2D312E] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#4F6D7A]" />
              Wisdom School Master Reporting & Institutional Analytics Suite
            </h1>
            <p className="text-xs text-[#6B7280]">
              25 Comprehensive Audit & Academic Reports Across Financial, Attendance, Exam, Staff, Library, Inventory & Payroll Operations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#4F6D7A] bg-[#4F6D7A]/10 px-2.5 py-1 rounded-lg">
              Academic Year: {schoolInfo.academicYear}
            </span>
          </div>
        </div>

        {/* Primary Domains Tab Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E2E8E2]">
          {domainTabs.map(tab => {
            const isActive = activeDomain === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveDomain(tab.id);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4F6D7A] text-white shadow-xs'
                    : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-[#E2E8E2]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-[#6B7280]'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Domain Content */}
      <div className="report-content-container">
        {activeDomain === 'fee-conveyance' && (
          <FeeConveyanceReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'attendance' && (
          <AttendanceReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'exam' && (
          <ExamReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'staff' && (
          <StaffReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'library' && (
          <LibraryReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'inventory' && (
          <InventoryReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'payroll' && (
          <SalaryPayrollReports onExportCsv={handleExportCsv} />
        )}

        {activeDomain === 'cash-audit' && (
          <div className="space-y-6">
            {/* Controls Bar for Cash Audit */}
            <div className="no-print bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D312E]">Scope:</span>
                  <div className="flex bg-[#F2F4F2] p-0.5 rounded-md border border-[#E2E8E2]">
                    <button
                      onClick={() => setReportScope('month')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        reportScope === 'month' ? 'bg-[#89A894] text-white shadow-2xs' : 'text-[#6B7280]'
                      }`}
                    >
                      Selected Month
                    </button>
                    <button
                      onClick={() => setReportScope('all')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        reportScope === 'all' ? 'bg-[#89A894] text-white shadow-2xs' : 'text-[#6B7280]'
                      }`}
                    >
                      All Months (Full Year)
                    </button>
                  </div>
                </div>

                {reportScope === 'month' && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#2D312E]">Month:</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-[#E2E8E2] rounded p-1 text-xs bg-[#FDFDFB] text-[#2D312E] focus:bg-white outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCashAuditCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded-lg text-xs transition-colors border border-[#E2E8E2] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div className="printable-document bg-white border border-[#E2E8E2] rounded-xl p-6 shadow-xs space-y-6">
              {/* Formal Report Header */}
              <div className="border-b-2 border-[#2D312E] pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={schoolInfo.logoUrl || '/school_logo.jpg'}
                    alt="Wisdom School Seal" 
                    className="w-14 h-14 rounded-full border border-[#D68A6E] object-cover" 
                  />
                  <div>
                    <h1 className="text-lg font-black uppercase tracking-tight text-[#2D312E] font-serif">
                      {schoolInfo.name}
                    </h1>
                    <p className="text-xs text-[#6B7280]">
                      {schoolInfo.address} • Ph: {schoolInfo.phone}
                    </p>
                    <p className="text-[11px] text-[#4F6D7A] font-bold">
                      MONTHLY FINANCIAL COLLECTION & AUDIT STATEMENT
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <p className="text-[#6B7280]">Period: <strong className="text-[#2D312E]">{reportScope === 'month' ? selectedMonth : 'Full Academic Year'}</strong></p>
                  <p className="text-[#6B7280]">Generated: <strong className="text-[#2D312E]">{new Date().toLocaleDateString('en-IN')}</strong></p>
                  <p className="text-[#6B7280]">In Charge: <strong className="text-[#2D312E]">{schoolInfo.adminName}</strong></p>
                </div>
              </div>

              {/* Executive Metrics Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F2F4F2] border border-[#E2E8E2]">
                  <span className="text-[#6B7280] block text-[11px] uppercase font-bold">Total Collections</span>
                  <span className="text-xl font-black text-[#2D312E] font-mono">
                    {formatCurrency(totalAmount)}
                  </span>
                  <span className="text-[10px] text-[#6B7280] block mt-0.5">{filteredReceipts.length} Receipts Issued</span>
                </div>

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-rose-700 block text-[11px] uppercase font-bold">Period Expenses</span>
                  <span className="text-xl font-black text-rose-700 font-mono">
                    {formatCurrency(totalExpensesAmount)}
                  </span>
                  <span className="text-[10px] text-rose-600 block mt-0.5">{filteredExpenses.length} Vouchers</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-800 block text-[11px] uppercase font-bold">Net Operational Surplus</span>
                  <span className={`text-xl font-black font-mono ${netSavingsSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(netSavingsSurplus)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Collections minus Expenses</span>
                </div>

                <div className="p-3 rounded-lg bg-[#89A894]/15 border border-[#89A894]/30">
                  <span className="text-[#4F6D7A] block text-[11px] uppercase font-bold">Google Pay / UPI</span>
                  <span className="text-xl font-black text-[#4F6D7A] font-mono">
                    {formatCurrency(upiCollected)}
                  </span>
                  <span className="text-[10px] text-[#4F6D7A]/80 block mt-0.5 font-mono">{schoolInfo.upiId}</span>
                </div>
              </div>

              {/* Revenue Breakdown by Category */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D312E] mb-2">
                  1. Revenue Categorization
                </h3>
                <table className="w-full text-xs border border-[#E2E8E2]">
                  <thead>
                    <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                      <th className="p-2 text-left">Fee Head</th>
                      <th className="p-2 text-right">Amount Collected</th>
                      <th className="p-2 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]/60">
                    <tr>
                      <td className="p-2 font-medium text-[#2D312E]">Standard Tuition Fees (LKG - 5STD)</td>
                      <td className="p-2 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(totalTuition)}</td>
                      <td className="p-2 text-right font-mono text-[#6B7280]">
                        {totalAmount > 0 ? `${Math.round((totalTuition / totalAmount) * 100)}%` : '0%'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-[#2D312E]">School Van / Transport Service</td>
                      <td className="p-2 text-right font-mono font-bold text-[#4F6D7A]">{formatCurrency(totalVan)}</td>
                      <td className="p-2 text-right font-mono text-[#6B7280]">
                        {totalAmount > 0 ? `${Math.round((totalVan / totalAmount) * 100)}%` : '0%'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-[#2D312E]">Annual Sports & Athletic Activities</td>
                      <td className="p-2 text-right font-mono font-bold text-[#4F6D7A]">{formatCurrency(totalSports)}</td>
                      <td className="p-2 text-right font-mono text-[#6B7280]">
                        {totalAmount > 0 ? `${Math.round((totalSports / totalAmount) * 100)}%` : '0%'}
                      </td>
                    </tr>
                    {totalLateFee > 0 && (
                      <tr>
                        <td className="p-2 font-medium text-[#D68A6E]">Late Fee Fines & Arrears</td>
                        <td className="p-2 text-right font-mono font-bold text-[#D68A6E]">{formatCurrency(totalLateFee)}</td>
                        <td className="p-2 text-right font-mono text-[#6B7280]">
                          {totalAmount > 0 ? `${Math.round((totalLateFee / totalAmount) * 100)}%` : '0%'}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#F2F4F2] font-bold border-t-2 border-[#E2E8E2]">
                      <td className="p-2.5 uppercase text-[#2D312E]">Grand Total Received</td>
                      <td className="p-2.5 text-right font-mono text-[#89A894] text-sm font-extrabold">{formatCurrency(totalAmount)}</td>
                      <td className="p-2.5 text-right font-mono text-[#2D312E]">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Standard-wise Performance */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D312E] mb-2">
                  2. Standard-wise Summary
                </h3>
                <table className="w-full text-xs border border-[#E2E8E2]">
                  <thead>
                    <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                      <th className="p-2 text-left">Class</th>
                      <th className="p-2 text-right">Standard Fee (₹)</th>
                      <th className="p-2 text-right">Students</th>
                      <th className="p-2 text-right">Expected Total</th>
                      <th className="p-2 text-right">Collected In Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]/60">
                    {classList.map(std => {
                      const stdStudents = students.filter(s => s.standard === std);
                      const stdExpected = stdStudents.reduce((sum, s) => sum + getStudentTotalFee(s), 0);
                      const stdCollectedInFilter = filteredReceipts
                        .filter(r => r.standard === std)
                        .reduce((sum, r) => sum + r.amountPaid, 0);

                      return (
                        <tr key={std}>
                          <td className="p-2 font-bold text-[#4F6D7A]">{std}</td>
                          <td className="p-2 text-right font-mono text-[#2D312E]">₹{feeStructure[std]?.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right text-[#6B7280]">{stdStudents.length}</td>
                          <td className="p-2 text-right font-mono text-[#2D312E]">{formatCurrency(stdExpected)}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#89A894]">{formatCurrency(stdCollectedInFilter)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Day-by-Day Collection Register */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D312E] mb-2">
                  3. Daily Collection Register
                </h3>
                <table className="w-full text-xs border border-[#E2E8E2]">
                  <thead>
                    <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-center">Receipts Count</th>
                      <th className="p-2 text-right">Cash Received</th>
                      <th className="p-2 text-right">UPI / GPay</th>
                      <th className="p-2 text-right">Day Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]/60">
                    {dailyRecords.length > 0 ? (
                      dailyRecords.map(([date, rec]) => (
                        <tr key={date}>
                          <td className="p-2 font-mono font-semibold text-[#2D312E]">{date}</td>
                          <td className="p-2 text-center text-[#6B7280]">{rec.count}</td>
                          <td className="p-2 text-right font-mono text-[#2D312E]">{formatCurrency(rec.cash)}</td>
                          <td className="p-2 text-right font-mono text-[#4F6D7A]">{formatCurrency(rec.upi)}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(rec.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[#6B7280]">
                          No transactions recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Auditor & Admin Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-900 text-xs">
                <div>
                  <p className="text-slate-500 text-[11px]">Prepared by:</p>
                  <p className="font-bold text-slate-900 mt-4">Wisdom School Office Accounts</p>
                  <p className="text-[10px] text-slate-500">Essur - 603301</p>
                </div>

                <div className="text-right">
                  <p className="text-slate-500 text-[11px]">Verified & Approved by:</p>
                  <p className="font-serif italic font-bold text-slate-900 mt-2 text-sm underline">
                    R. Saravanan
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{schoolInfo.adminName}</p>
                  <p className="text-[10px] text-slate-500">School Admin & Principal</p>
                  <p className="text-[10px] text-slate-500">Ph: {schoolInfo.phone}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
