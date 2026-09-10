import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { PaymentReceipt, SchoolExpense, PaymentMode, FeeCategory } from '../../types';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Printer,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  CheckCircle2,
  DollarSign,
  Banknote,
  Search,
  Filter,
  Check,
  Building,
  CreditCard,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Receipt
} from 'lucide-react';

interface CashAuditReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const CashAuditReports: React.FC<CashAuditReportsProps> = ({ onExportCsv }) => {
  const {
    receipts,
    expenses,
    schoolInfo,
    students,
    feeStructure,
    classList,
    updateReceipt,
    deleteReceipt,
    recordPayment,
    updateExpense,
    deleteExpense,
    addExpense,
    getStudentTotalFee
  } = useSchool();

  const [subTab, setSubTab] = useState<'daily' | 'receipts' | 'reconciliation' | 'expenses' | 'denomination'>('daily');

  // Month & scope filtering
  const availableMonths = Array.from(new Set(receipts.map(r => r.date.slice(0, 7))))
    .sort()
    .reverse();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const defaultMonth = availableMonths.includes(currentMonthStr)
    ? currentMonthStr
    : availableMonths[0] || currentMonthStr;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [reportScope, setReportScope] = useState<'month' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Filtered collections
  const filteredReceipts = receipts.filter(r => {
    const matchesMonth = reportScope === 'all' || r.date.startsWith(selectedMonth);
    const matchesSearch =
      !searchQuery ||
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.transactionReference || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = selectedMode === 'all' || r.paymentMode === selectedMode;
    const matchesClass = selectedClass === 'all' || r.standard === selectedClass;
    return matchesMonth && matchesSearch && matchesMode && matchesClass;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesMonth = reportScope === 'all' || e.date.startsWith(selectedMonth);
    const matchesSearch =
      !searchQuery ||
      e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  // Aggregations
  const totalCollections = filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalTuition = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0);
  const totalVan = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0);
  const totalSports = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0);
  const totalLateFee = filteredReceipts.reduce((sum, r) => sum + (r.breakdown.lateFee || 0), 0);

  const cashCollected = filteredReceipts
    .filter(r => r.paymentMode === 'Cash')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const upiCollected = filteredReceipts
    .filter(r => r.paymentMode === 'GPay / UPI')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const bankTransferCollected = filteredReceipts
    .filter(r => r.paymentMode === 'Bank Transfer' || r.paymentMode === 'Cheque')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netOperationalSurplus = totalCollections - totalExpensesAmount;

  // Day-by-day mapping
  const dateMap: Record<string, { total: number; cash: number; upi: number; bank: number; count: number; receipts: PaymentReceipt[] }> = {};
  filteredReceipts.forEach(r => {
    if (!dateMap[r.date]) {
      dateMap[r.date] = { total: 0, cash: 0, upi: 0, bank: 0, count: 0, receipts: [] };
    }
    dateMap[r.date].total += r.amountPaid;
    dateMap[r.date].count += 1;
    dateMap[r.date].receipts.push(r);
    if (r.paymentMode === 'Cash') dateMap[r.date].cash += r.amountPaid;
    else if (r.paymentMode === 'GPay / UPI') dateMap[r.date].upi += r.amountPaid;
    else dateMap[r.date].bank += r.amountPaid;
  });

  const dailyRecords = Object.entries(dateMap).sort((a, b) => b[0].localeCompare(a[0]));

  // =========================================================================
  // CRUD STATE: Edit / Add Receipt Modal
  // =========================================================================
  const [editingReceipt, setEditingReceipt] = useState<PaymentReceipt | null>(null);
  const [isAddingReceipt, setIsAddingReceipt] = useState<boolean>(false);

  // =========================================================================
  // CRUD STATE: Edit / Add Expense Modal
  // =========================================================================
  const [editingExpense, setEditingExpense] = useState<SchoolExpense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState<boolean>(false);

  // =========================================================================
  // DAY CLOSING CASH DENOMINATION STATE
  // =========================================================================
  const [denominationDate, setDenominationDate] = useState<string>(
    dailyRecords[0] ? dailyRecords[0][0] : new Date().toISOString().split('T')[0]
  );
  const [denomCounts, setDenomCounts] = useState<{ [key: number]: number }>({
    500: 12,
    200: 10,
    100: 15,
    50: 8,
    20: 10,
    10: 20,
    5: 10,
  });

  const calculatedPhysicalCash = Object.entries(denomCounts).reduce(
    (acc, [val, count]) => acc + Number(val) * (Number(count) || 0),
    0
  );
  const targetDayCash = dateMap[denominationDate]?.cash || 0;
  const cashDiscrepancy = calculatedPhysicalCash - targetDayCash;

  // =========================================================================
  // CSV EXPORT HANDLER
  // =========================================================================
  const handleExportCsvData = () => {
    if (subTab === 'daily') {
      const headers = ['Date', 'Day Total (INR)', 'Receipts Count', 'Cash (INR)', 'UPI / GPay (INR)', 'Bank / Cheque (INR)'];
      const rows = dailyRecords.map(([date, rec]) => [
        date,
        rec.total,
        rec.count,
        rec.cash,
        rec.upi,
        rec.bank,
      ]);
      onExportCsv(`Daily_Cash_Register_${selectedMonth}`, headers, rows);
    } else if (subTab === 'receipts') {
      const headers = ['Receipt No', 'Date', 'Admission No', 'Student Name', 'Standard', 'Payment Mode', 'Tuition', 'Van', 'Sports', 'Late Fee', 'Total Paid (INR)', 'Reference'];
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
      onExportCsv(`Cash_Audit_Receipts_Ledger_${selectedMonth}`, headers, rows);
    } else if (subTab === 'expenses') {
      const headers = ['Voucher No', 'Date', 'Category', 'Expense Description', 'Paid To', 'Mode', 'Amount (INR)', 'Recorded By'];
      const rows = filteredExpenses.map(e => [
        e.voucherNo,
        e.date,
        `"${e.category}"`,
        `"${e.title}"`,
        `"${e.paidTo}"`,
        e.paymentMode,
        e.amount,
        `"${e.recordedBy}"`,
      ]);
      onExportCsv(`Cash_Audit_Expenses_${selectedMonth}`, headers, rows);
    } else if (subTab === 'denomination') {
      const headers = ['Denomination (INR)', 'Count', 'Subtotal (INR)'];
      const denomEntries = Object.entries(denomCounts) as Array<[string, number]>;
      const rows: Array<[string, number, number]> = denomEntries.map(([val, cnt]) => {
        const numericValue = Number(val);
        return [`Rs. ${numericValue}`, cnt, numericValue * cnt];
      });
      rows.push(['Total Physical Cash', 0, calculatedPhysicalCash]);
      rows.push(['System Register Cash', 0, targetDayCash]);
      rows.push(['Discrepancy (Physical - System)', 0, cashDiscrepancy]);
      onExportCsv(`Cash_Denomination_Closing_${denominationDate}`, headers, rows as (string | number)[][]);
    } else {
      // Reconciliation
      const headers = ['Metric / Head', 'Value (INR)', 'Notes'];
      const rows = [
        ['Total Student Collections', totalCollections, `${filteredReceipts.length} receipts`],
        ['Total Cash Inflow', cashCollected, 'Physical cash received'],
        ['Total Digital / UPI Inflow', upiCollected, 'Direct to bank'],
        ['Total Outflow / Expenses', totalExpensesAmount, `${filteredExpenses.length} vouchers`],
        ['Net Operational Surplus', netOperationalSurplus, 'Surplus retained in institution'],
      ];
      onExportCsv(`Cash_Reconciliation_Statement_${selectedMonth}`, headers, rows);
    }
  };

  // =========================================================================
  // PDF EXPORT HANDLER (generateReportTablePdf)
  // =========================================================================
  const handleExportPdf = () => {
    if (subTab === 'daily') {
      const headers = ['Date', 'Receipts', 'Cash (INR)', 'UPI / GPay', 'Bank Trf', 'Day Total (INR)'];
      const rows = dailyRecords.map(([date, rec]) => [
        date,
        rec.count,
        formatCurrency(rec.cash),
        formatCurrency(rec.upi),
        formatCurrency(rec.bank),
        formatCurrency(rec.total),
      ]);
      const doc = generateReportTablePdf(
        `Daily Cash & Collections Register - ${reportScope === 'month' ? selectedMonth : 'Full Academic Year'}`,
        `Total Collections: ${formatCurrency(totalCollections)} across ${filteredReceipts.length} receipts. Cash: ${formatCurrency(cashCollected)}, UPI: ${formatCurrency(upiCollected)}`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Daily_Cash_Register_${selectedMonth}.pdf`);
    } else if (subTab === 'receipts') {
      const headers = ['Receipt No', 'Date', 'Student Name', 'Class', 'Mode', 'Tuition', 'Van', 'Total Paid (INR)'];
      const rows = filteredReceipts.map(r => [
        r.receiptNumber,
        r.date,
        r.studentName,
        r.standard,
        r.paymentMode,
        formatCurrency(r.breakdown.tuition),
        formatCurrency(r.breakdown.van),
        formatCurrency(r.amountPaid),
      ]);
      const doc = generateReportTablePdf(
        `Official Cash & Fee Receipts Audit Ledger - ${reportScope === 'month' ? selectedMonth : 'Full Year'}`,
        `Detailed transaction audit log | School Admin: ${schoolInfo.adminName}`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Cash_Receipts_Audit_Ledger_${selectedMonth}.pdf`);
    } else if (subTab === 'expenses') {
      const headers = ['Voucher No', 'Date', 'Category', 'Expense Title', 'Paid To', 'Mode', 'Amount (INR)'];
      const rows = filteredExpenses.map(e => [
        e.voucherNo,
        e.date,
        e.category,
        e.title,
        e.paidTo,
        e.paymentMode,
        formatCurrency(e.amount),
      ]);
      const doc = generateReportTablePdf(
        `Cash & Voucher Outflows Audit Statement - ${reportScope === 'month' ? selectedMonth : 'Full Year'}`,
        `Total Outflows: ${formatCurrency(totalExpensesAmount)} across ${filteredExpenses.length} vouchers`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Cash_Expense_Audit_${selectedMonth}.pdf`);
    } else if (subTab === 'denomination') {
      const headers = ['Denomination Note / Coin', 'Notes Count', 'Subtotal (INR)'];
      const denomEntries = Object.entries(denomCounts) as Array<[string, number]>;
      const rows: Array<[string, number, string]> = denomEntries.map(([val, cnt]) => {
        const numericValue = Number(val);
        return [`Rs. ${numericValue} Note`, cnt, formatCurrency(numericValue * cnt)];
      });
      rows.push(['Total Physical Cash Counted', 0, formatCurrency(calculatedPhysicalCash)]);
      rows.push(['Daily System Register Recorded', 0, formatCurrency(targetDayCash)]);
      rows.push(['Cash Discrepancy (Physical - System)', 0, formatCurrency(cashDiscrepancy)]);
      const doc = generateReportTablePdf(
        `Daily Cash Denomination & Physical Closing Register - ${denominationDate}`,
        `Verified by Admin: ${schoolInfo.adminName} | Closing Status: ${cashDiscrepancy === 0 ? 'PERFECTLY BALANCED' : 'DISCREPANCY DETECTED'}`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Cash_Denomination_Closing_${denominationDate}.pdf`);
    } else {
      // Reconciliation
      const headers = ['Audit Metric / Reconciliation Head', 'Subtotal Amount (INR)', 'Audit Classification'];
      const rows = [
        ['Total Student Fee Collections', formatCurrency(totalCollections), 'Direct Inflows (Receipts)'],
        ['  - Physical Cash Handover', formatCurrency(cashCollected), 'Cash at Office Drawer'],
        ['  - Google Pay / UPI Collections', formatCurrency(upiCollected), 'Direct to School Bank Account'],
        ['  - Bank Transfer / Cheque Clearances', formatCurrency(bankTransferCollected), 'Bank Clearing'],
        ['Total Operational Disbursements (Expenses)', formatCurrency(totalExpensesAmount), 'Operational Outflows (Vouchers)'],
        ['Net Cash Operating Surplus', formatCurrency(netOperationalSurplus), 'Institutional Reserves Retained'],
      ];
      const doc = generateReportTablePdf(
        `Cash & Collections Audit Reconciliation Statement - ${selectedMonth}`,
        `Financial period audit verified for Wisdom Nursery and Primary School`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Cash_Audit_Reconciliation_${selectedMonth}.pdf`);
    }
  };

  // =========================================================================
  // CRUD ACTIONS: Save & Delete Receipt
  // =========================================================================
  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;

    if (isAddingReceipt) {
      // Create new receipt
      recordPayment({
        studentId: editingReceipt.studentId || (students[0]?.id ?? 'std-001'),
        paymentMode: editingReceipt.paymentMode,
        transactionReference: editingReceipt.transactionReference,
        category: editingReceipt.category,
        breakdown: editingReceipt.breakdown,
        date: editingReceipt.date,
        notes: editingReceipt.notes,
      });
    } else {
      // Update existing receipt
      updateReceipt(editingReceipt.id, {
        receiptNumber: editingReceipt.receiptNumber,
        date: editingReceipt.date,
        studentName: editingReceipt.studentName,
        standard: editingReceipt.standard,
        paymentMode: editingReceipt.paymentMode,
        transactionReference: editingReceipt.transactionReference,
        breakdown: editingReceipt.breakdown,
        amountPaid: editingReceipt.amountPaid,
        notes: editingReceipt.notes,
      });
    }

    setEditingReceipt(null);
    setIsAddingReceipt(false);
  };

  const handleDeleteReceipt = (receipt: PaymentReceipt) => {
    const confirm = window.confirm(
      `Are you sure you want to permanently delete receipt "${receipt.receiptNumber}" for ${receipt.studentName} (₹${receipt.amountPaid.toLocaleString('en-IN')})?\n\nThis will immediately deduct the amount from the Daily Cash Register.`
    );
    if (!confirm) return;
    deleteReceipt(receipt.id);
  };

  // =========================================================================
  // CRUD ACTIONS: Save & Delete Expense Voucher
  // =========================================================================
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    if (isAddingExpense) {
      addExpense({
        title: editingExpense.title,
        category: editingExpense.category,
        amount: editingExpense.amount,
        date: editingExpense.date,
        paymentMode: editingExpense.paymentMode,
        paidTo: editingExpense.paidTo,
        notes: editingExpense.notes,
        recordedBy: editingExpense.recordedBy || `${schoolInfo.adminName} - Admin`,
      });
    } else {
      updateExpense(editingExpense.id, {
        voucherNo: editingExpense.voucherNo,
        title: editingExpense.title,
        category: editingExpense.category,
        amount: editingExpense.amount,
        date: editingExpense.date,
        paymentMode: editingExpense.paymentMode,
        paidTo: editingExpense.paidTo,
        notes: editingExpense.notes,
      });
    }

    setEditingExpense(null);
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = (expense: SchoolExpense) => {
    const confirm = window.confirm(
      `Are you sure you want to delete expense voucher "${expense.voucherNo}" - ${expense.title} (₹${expense.amount.toLocaleString('en-IN')})?\n\nThis will update cash balance and audit registers immediately.`
    );
    if (!confirm) return;
    deleteExpense(expense.id);
  };

  return (
    <div className="space-y-6">
      {/* Action and Control Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F2F4F2] p-1 rounded-xl border border-[#E2E8E2]">
          <button
            onClick={() => setSubTab('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'daily'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Cash Register</span>
          </button>
          <button
            onClick={() => setSubTab('receipts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'receipts'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Audit Receipts Ledger</span>
          </button>
          <button
            onClick={() => setSubTab('reconciliation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'reconciliation'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Reconciliation & Surplus</span>
          </button>
          <button
            onClick={() => setSubTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'expenses'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Cash Outflows (Expenses)</span>
          </button>
          <button
            onClick={() => setSubTab('denomination')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'denomination'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Day-End Denomination Tally</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {subTab === 'receipts' && (
            <button
              onClick={() => {
                const newRec: PaymentReceipt = {
                  id: `rec-manual-${Date.now()}`,
                  receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
                  studentId: students[0]?.id || 'std-001',
                  studentName: students[0]?.name || 'Student Name',
                  admissionNo: students[0]?.admissionNo || 'WIS-2024-001',
                  standard: students[0]?.standard || '1STD',
                  section: 'A',
                  parentName: students[0]?.parentName || 'Parent',
                  parentPhone: students[0]?.parentPhone || '9876543210',
                  date: new Date().toISOString().split('T')[0],
                  paymentMode: 'Cash',
                  category: 'Composite / Combined',
                  breakdown: { tuition: 5000, van: 0, sports: 0, lateFee: 0, other: 0 },
                  amountPaid: 5000,
                  totalPendingAfterPayment: 0,
                  collectedBy: `${schoolInfo.adminName} - Admin`,
                  notes: 'Direct office cash collection',
                };
                setEditingReceipt(newRec);
                setIsAddingReceipt(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Cash Receipt</span>
            </button>
          )}

          {subTab === 'expenses' && (
            <button
              onClick={() => {
                const newExp: SchoolExpense = {
                  id: `exp-manual-${Date.now()}`,
                  voucherNo: `WEXP-${Date.now().toString().slice(-4)}`,
                  title: '',
                  category: 'Stationery, Books & Printing',
                  amount: 1000,
                  date: new Date().toISOString().split('T')[0],
                  paymentMode: 'Cash',
                  paidTo: '',
                  notes: 'Cash voucher disbursement',
                  recordedBy: `${schoolInfo.adminName} - Admin`,
                };
                setEditingExpense(newExp);
                setIsAddingExpense(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Expense Voucher</span>
            </button>
          )}

          <button
            onClick={handleExportCsvData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded-lg text-xs transition-colors border border-[#E2E8E2] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Scope & Date Filter Bar */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
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
                className="border border-[#E2E8E2] rounded px-2 py-1 text-xs bg-[#FDFDFB] text-[#2D312E] focus:bg-white outline-hidden"
              />
            </div>
          )}

          {subTab === 'receipts' && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#2D312E]">Mode:</span>
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="border border-[#E2E8E2] rounded px-2 py-1 text-xs bg-[#FDFDFB] text-[#2D312E]"
                >
                  <option value="all">All Modes</option>
                  <option value="Cash">Cash Only</option>
                  <option value="GPay / UPI">GPay / UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#2D312E]">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="border border-[#E2E8E2] rounded px-2 py-1 text-xs bg-[#FDFDFB] text-[#2D312E]"
                >
                  <option value="all">All Classes</option>
                  {classList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {(subTab === 'receipts' || subTab === 'expenses') && (
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by student, voucher, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs outline-hidden focus:bg-white text-[#2D312E]"
            />
          </div>
        )}
      </div>

      {/* Executive Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] block text-[11px] uppercase font-bold">Total Collections</span>
          <span className="text-xl font-black text-[#2D312E] font-mono">
            {formatCurrency(totalCollections)}
          </span>
          <span className="text-[10px] text-[#6B7280] block mt-0.5">{filteredReceipts.length} Receipts Recorded</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <span className="text-emerald-800 block text-[11px] uppercase font-bold">Cash in Hand (Physical)</span>
          <span className="text-xl font-black text-emerald-700 font-mono">
            {formatCurrency(cashCollected)}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Physical cash drawer balance</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#89A894]/15 border border-[#89A894]/30 shadow-xs">
          <span className="text-[#4F6D7A] block text-[11px] uppercase font-bold">Google Pay / UPI Inflow</span>
          <span className="text-xl font-black text-[#4F6D7A] font-mono">
            {formatCurrency(upiCollected)}
          </span>
          <span className="text-[10px] text-[#4F6D7A]/80 block mt-0.5 font-mono">{schoolInfo.upiId}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-xs">
          <span className="text-rose-800 block text-[11px] uppercase font-bold">Total Cash Expenses</span>
          <span className="text-xl font-black text-rose-700 font-mono">
            {formatCurrency(totalExpensesAmount)}
          </span>
          <span className="text-[10px] text-rose-600 block mt-0.5">{filteredExpenses.length} Outflow Vouchers</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: DAILY CASH REGISTER                                             */}
      {/* ========================================================================= */}
      {subTab === 'daily' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#4F6D7A]" />
                Daily Collection & Cash Register
              </h3>
              <p className="text-xs text-[#6B7280]">
                Day-by-day cash, digital UPI collections and daily receipts summary for {reportScope === 'month' ? selectedMonth : 'Full Academic Year'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F2F4F2] px-2.5 py-1 rounded-lg text-[#4F6D7A] border border-[#E2E8E2]">
              {dailyRecords.length} Active Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-center">Receipts Count</th>
                  <th className="p-2.5 text-right">Cash Received</th>
                  <th className="p-2.5 text-right">UPI / GPay</th>
                  <th className="p-2.5 text-right">Bank / Cheque</th>
                  <th className="p-2.5 text-right">Day Total Collection</th>
                  <th className="p-2.5 text-center no-print">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E2]/60">
                {dailyRecords.length > 0 ? (
                  dailyRecords.map(([date, rec]) => (
                    <tr key={date} className="hover:bg-[#F7F8F6] transition-colors">
                      <td className="p-2.5 font-mono font-semibold text-[#2D312E]">
                        {date}
                        <span className="block text-[10px] text-[#6B7280] font-sans">
                          {new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold rounded-full text-[11px]">
                          {rec.count}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(rec.cash)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#4F6D7A]">
                        {formatCurrency(rec.upi)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#6B7280]">
                        {formatCurrency(rec.bank)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-[#2D312E] text-sm">
                        {formatCurrency(rec.total)}
                      </td>
                      <td className="p-2.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSearchQuery(date);
                              setSubTab('receipts');
                            }}
                            className="px-2 py-1 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] text-[10px] font-bold rounded cursor-pointer border border-[#E2E8E2]"
                            title="View all receipts for this date"
                          >
                            View Receipts ({rec.count})
                          </button>
                          <button
                            onClick={() => {
                              setDenominationDate(date);
                              setSubTab('denomination');
                            }}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded cursor-pointer border border-emerald-300"
                            title="Cash Denomination Closing for this date"
                          >
                            Denomination Tally
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#6B7280]">
                      No transactions recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
              {dailyRecords.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#E2E8E2] text-xs">
                    <td className="p-2.5 text-[#2D312E] uppercase">Total Period Collections</td>
                    <td className="p-2.5 text-center font-mono text-[#4F6D7A]">{filteredReceipts.length} Receipts</td>
                    <td className="p-2.5 text-right font-mono text-emerald-800">{formatCurrency(cashCollected)}</td>
                    <td className="p-2.5 text-right font-mono text-[#4F6D7A]">{formatCurrency(upiCollected)}</td>
                    <td className="p-2.5 text-right font-mono text-[#6B7280]">{formatCurrency(bankTransferCollected)}</td>
                    <td className="p-2.5 text-right font-mono text-[#89A894] text-sm font-black">{formatCurrency(totalCollections)}</td>
                    <td className="p-2.5 text-center text-[10px] text-[#6B7280] no-print">Verified</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: DETAILED RECEIPTS & AUDIT LEDGER (WITH EDIT & DELETE)          */}
      {/* ========================================================================= */}
      {subTab === 'receipts' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#4F6D7A]" />
                Detailed Fee Receipts & Cash Audit Ledger
              </h3>
              <p className="text-xs text-[#6B7280]">
                Line-by-line collection records with full editing, deletion, and recalculation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-[#F2F4F2] px-2.5 py-1 rounded-lg text-[#4F6D7A] border border-[#E2E8E2]">
                {filteredReceipts.length} Records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                  <th className="p-2.5">Receipt No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Student / Admission</th>
                  <th className="p-2.5 text-center">Class</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right">Tuition</th>
                  <th className="p-2.5 text-right">Van Fee</th>
                  <th className="p-2.5 text-right">Sports / Late</th>
                  <th className="p-2.5 text-right">Total Paid (₹)</th>
                  <th className="p-2.5 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E2]/60">
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-[#F7F8F6] transition-colors">
                      <td className="p-2.5 font-mono font-bold text-[#4F6D7A]">
                        {receipt.receiptNumber}
                      </td>
                      <td className="p-2.5 font-mono text-[#2D312E]">
                        {receipt.date}
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-[#2D312E] block">{receipt.studentName}</span>
                        <span className="text-[10px] text-[#6B7280] font-mono">{receipt.admissionNo}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold rounded text-[10px]">
                          {receipt.standard}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          receipt.paymentMode === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : receipt.paymentMode === 'GPay / UPI'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {receipt.paymentMode}
                        </span>
                        {receipt.transactionReference && (
                          <span className="block text-[9px] font-mono text-[#6B7280] mt-0.5">
                            {receipt.transactionReference}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#2D312E]">
                        {formatCurrency(receipt.breakdown.tuition)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#4F6D7A]">
                        {formatCurrency(receipt.breakdown.van)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#6B7280]">
                        {formatCurrency((receipt.breakdown.sports || 0) + (receipt.breakdown.lateFee || 0))}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-sm text-[#2D312E]">
                        {formatCurrency(receipt.amountPaid)}
                      </td>
                      <td className="p-2.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingReceipt({ ...receipt });
                              setIsAddingReceipt(false);
                            }}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Receipt Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(receipt)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-[#6B7280]">
                      No receipts found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredReceipts.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#E2E8E2] text-xs">
                    <td colSpan={5} className="p-2.5 text-[#2D312E] uppercase">Total Filtered Collections</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(totalTuition)}</td>
                    <td className="p-2.5 text-right font-mono text-[#4F6D7A]">{formatCurrency(totalVan)}</td>
                    <td className="p-2.5 text-right font-mono text-[#6B7280]">{formatCurrency(totalSports + totalLateFee)}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-800 text-sm">{formatCurrency(totalCollections)}</td>
                    <td className="p-2.5 no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: RECONCILIATION & SURPLUS STATEMENT                              */}
      {/* ========================================================================= */}
      {subTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#4F6D7A]" />
              Institutional Cash Inflow & Outflow Reconciliation
            </h3>
            <p className="text-xs text-[#6B7280]">
              Audited reconciliation between student collections, cash in hand, digital bank deposits, and institutional operational expenses.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Inflow Card */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    TOTAL CASH & REVENUE INFLOWS
                  </span>
                  <span className="font-mono font-black text-emerald-800 text-base">{formatCurrency(totalCollections)}</span>
                </div>
                <div className="space-y-2 text-xs border-t border-emerald-200/60 pt-2">
                  <div className="flex justify-between">
                    <span className="text-emerald-900">Physical Cash Collected at Office:</span>
                    <span className="font-mono font-bold text-emerald-950">{formatCurrency(cashCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-900">Direct Google Pay / UPI Deposits:</span>
                    <span className="font-mono font-bold text-emerald-950">{formatCurrency(upiCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-900">Bank Transfer / Cheques:</span>
                    <span className="font-mono font-bold text-emerald-950">{formatCurrency(bankTransferCollected)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200/40 text-[11px] text-emerald-700">
                    <span>Number of receipts issued:</span>
                    <span>{filteredReceipts.length}</span>
                  </div>
                </div>
              </div>

              {/* Outflow Card */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    TOTAL CASH DISBURSEMENTS (EXPENSES)
                  </span>
                  <span className="font-mono font-black text-rose-800 text-base">{formatCurrency(totalExpensesAmount)}</span>
                </div>
                <div className="space-y-2 text-xs border-t border-rose-200/60 pt-2">
                  <div className="flex justify-between">
                    <span className="text-rose-900">Staff Salary & Advance Disbursals:</span>
                    <span className="font-mono font-bold text-rose-950">
                      {formatCurrency(filteredExpenses.filter(e => e.category === 'Staff Salary & Wages').reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-900">School Van Fuel & Maintenance:</span>
                    <span className="font-mono font-bold text-rose-950">
                      {formatCurrency(filteredExpenses.filter(e => e.category === 'Van Fuel & Maintenance').reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-900">Stationery, Utilities & Events:</span>
                    <span className="font-mono font-bold text-rose-950">
                      {formatCurrency(filteredExpenses.filter(e => e.category !== 'Staff Salary & Wages' && e.category !== 'Van Fuel & Maintenance').reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-rose-200/40 text-[11px] text-rose-700">
                    <span>Number of expense vouchers:</span>
                    <span>{filteredExpenses.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Surplus Ribbon */}
            <div className="bg-[#F2F4F2] p-4 rounded-xl border border-[#E2E8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#2D312E] block uppercase">
                  Net Institutional Operating Surplus / Cash Retained:
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Operating surplus available after all monthly staff, transport, and campus outlays
                </span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black font-mono ${netOperationalSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(netOperationalSurplus)}
                </span>
                <span className="block text-[10px] text-[#6B7280]">
                  Audit status: <strong>VERIFIED BALANCED</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: CASH OUTFLOWS (EXPENSES VOUCHERS WITH EDIT & DELETE)            */}
      {/* ========================================================================= */}
      {subTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                Cash Expenses & Outflow Vouchers Register
              </h3>
              <p className="text-xs text-[#6B7280]">
                Manage school expenses, salary disbursements, and operational cash payments
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#F2F4F2] px-2.5 py-1 rounded-lg text-[#4F6D7A] border border-[#E2E8E2]">
              {filteredExpenses.length} Vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                  <th className="p-2.5">Voucher No</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Paid To</th>
                  <th className="p-2.5">Mode</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                  <th className="p-2.5 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E2]/60">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-[#F7F8F6] transition-colors">
                      <td className="p-2.5 font-mono font-bold text-rose-700">
                        {expense.voucherNo}
                      </td>
                      <td className="p-2.5 font-mono text-[#2D312E]">
                        {expense.date}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold rounded text-[10px]">
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium text-[#2D312E]">
                        {expense.title}
                        {expense.notes && (
                          <span className="block text-[10px] text-[#6B7280]">{expense.notes}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-[#2D312E]">
                        {expense.paidTo}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          expense.paymentMode === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {expense.paymentMode}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-rose-700 text-sm">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="p-2.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExpense({ ...expense });
                              setIsAddingExpense(false);
                            }}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Expense Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="Delete Expense Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-[#6B7280]">
                      No expenses recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#E2E8E2] text-xs">
                    <td colSpan={6} className="p-2.5 text-[#2D312E] uppercase">Total Period Cash Disbursements</td>
                    <td className="p-2.5 text-right font-mono text-rose-700 text-sm font-black">{formatCurrency(totalExpensesAmount)}</td>
                    <td className="p-2.5 no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: DAY-END CASH DENOMINATION TALLY                                */}
      {/* ========================================================================= */}
      {subTab === 'denomination' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8E2]">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#4F6D7A]" />
                Daily Physical Cash Denomination Closing Tally
              </h3>
              <p className="text-xs text-[#6B7280]">
                Reconcile physical office currency notes against digital collections for {denominationDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#2D312E]">Closing Date:</span>
              <input
                type="date"
                value={denominationDate}
                onChange={(e) => setDenominationDate(e.target.value)}
                className="border border-[#E2E8E2] rounded px-2 py-1 text-xs bg-[#F2F4F2] text-[#2D312E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Denomination Counter */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold text-[#4F6D7A] block">Physical Currency Notes & Coins Count:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[500, 200, 100, 50, 20, 10, 5].map(val => (
                  <div key={val} className="p-2.5 bg-[#F2F4F2] rounded-lg border border-[#E2E8E2] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2D312E] block">₹{val} Note</span>
                      <span className="text-[10px] text-[#6B7280]">
                        = ₹{((denomCounts[val] || 0) * val).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={denomCounts[val] ?? 0}
                      onChange={(e) => {
                        const cnt = Math.max(0, parseInt(e.target.value) || 0);
                        setDenomCounts({ ...denomCounts, [val]: cnt });
                      }}
                      className="w-16 px-2 py-1 bg-white border border-[#E2E8E2] rounded text-center font-mono font-bold text-[#2D312E]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Reconciliation Balance Card */}
            <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E2E8E2] space-y-3 flex flex-col justify-between">
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#2D312E] block">Daily Closing Status</span>
                <div className="flex justify-between py-1 border-b border-[#E2E8E2]">
                  <span className="text-[#6B7280]">Physical Cash Count:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {formatCurrency(calculatedPhysicalCash)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E2]">
                  <span className="text-[#6B7280]">System Recorded Cash:</span>
                  <span className="font-mono font-bold text-[#4F6D7A] text-sm">
                    {formatCurrency(targetDayCash)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-xs font-bold">
                  <span>Discrepancy:</span>
                  <span className={`font-mono ${cashDiscrepancy === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {cashDiscrepancy === 0 ? '₹0 (Balanced)' : `${cashDiscrepancy > 0 ? '+' : ''}${formatCurrency(cashDiscrepancy)}`}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8E2] space-y-2">
                <button
                  onClick={() => alert(`Denomination closing recorded for ${denominationDate}. Physical Cash: ₹${calculatedPhysicalCash.toLocaleString('en-IN')}`)}
                  className="w-full py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lock & Sign Daily Closing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD RECEIPT                                                 */}
      {/* ========================================================================= */}
      {editingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E2E8E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#4F6D7A]" />
                <h4 className="font-bold text-sm text-[#2D312E]">
                  {isAddingReceipt ? 'Record New Fee / Cash Receipt' : `Edit Receipt #${editingReceipt.receiptNumber}`}
                </h4>
              </div>
              <button
                onClick={() => setEditingReceipt(null)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={editingReceipt.receiptNumber}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, receiptNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={editingReceipt.date}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#6B7280] font-medium mb-1">Student Name</label>
                  <input
                    type="text"
                    value={editingReceipt.studentName}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, studentName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Standard / Class</label>
                  <select
                    value={editingReceipt.standard}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, standard: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    {classList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Payment Mode</label>
                  <select
                    value={editingReceipt.paymentMode}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GPay / UPI">GPay / UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Transaction Ref / Cheque No</label>
                  <input
                    type="text"
                    value={editingReceipt.transactionReference || ''}
                    onChange={(e) => setEditingReceipt({ ...editingReceipt, transactionReference: e.target.value })}
                    placeholder="e.g., UPI-9840123 / CHQ-1049"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg font-mono text-[#2D312E]"
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-[#F7F8F6] p-3 rounded-xl border border-[#E2E8E2] space-y-2">
                <span className="font-bold text-[#4F6D7A] block">Fee Breakdown Heads (INR)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Tuition Fee</label>
                    <input
                      type="number"
                      value={editingReceipt.breakdown.tuition}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const bd = { ...editingReceipt.breakdown, tuition: val };
                        const total = bd.tuition + bd.van + bd.sports + bd.lateFee + (bd.other || 0);
                        setEditingReceipt({ ...editingReceipt, breakdown: bd, amountPaid: total });
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Van Fee</label>
                    <input
                      type="number"
                      value={editingReceipt.breakdown.van}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const bd = { ...editingReceipt.breakdown, van: val };
                        const total = bd.tuition + bd.van + bd.sports + bd.lateFee + (bd.other || 0);
                        setEditingReceipt({ ...editingReceipt, breakdown: bd, amountPaid: total });
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Sports Fee</label>
                    <input
                      type="number"
                      value={editingReceipt.breakdown.sports}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const bd = { ...editingReceipt.breakdown, sports: val };
                        const total = bd.tuition + bd.van + bd.sports + bd.lateFee + (bd.other || 0);
                        setEditingReceipt({ ...editingReceipt, breakdown: bd, amountPaid: total });
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#6B7280] mb-0.5">Late Fee / Fine</label>
                    <input
                      type="number"
                      value={editingReceipt.breakdown.lateFee}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const bd = { ...editingReceipt.breakdown, lateFee: val };
                        const total = bd.tuition + bd.van + bd.sports + bd.lateFee + (bd.other || 0);
                        setEditingReceipt({ ...editingReceipt, breakdown: bd, amountPaid: total });
                      }}
                      className="w-full px-2 py-1 bg-white border border-[#E2E8E2] rounded font-mono text-[#2D312E]"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#E2E8E2]">
                  <span className="font-bold text-[#2D312E]">Total Amount Paid:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {formatCurrency(editingReceipt.amountPaid)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Receipt Notes / Remarks</label>
                <input
                  type="text"
                  value={editingReceipt.notes || ''}
                  onChange={(e) => setEditingReceipt({ ...editingReceipt, notes: e.target.value })}
                  placeholder="e.g., Paid via parent directly at front desk"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                />
              </div>

              <div className="px-5 py-3 bg-[#F2F4F2] -mx-5 -mb-5 mt-4 border-t border-[#E2E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isAddingReceipt ? 'Record Receipt' : 'Save Receipt Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD EXPENSE VOUCHER                                         */}
      {/* ========================================================================= */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E2E8E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
                <h4 className="font-bold text-sm text-[#2D312E]">
                  {isAddingExpense ? 'Record New Outflow / Expense Voucher' : `Edit Voucher #${editingExpense.voucherNo}`}
                </h4>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Voucher Number</label>
                  <input
                    type="text"
                    value={editingExpense.voucherNo}
                    onChange={(e) => setEditingExpense({ ...editingExpense, voucherNo: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Expense Title / Purpose *</label>
                <input
                  type="text"
                  value={editingExpense.title}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  placeholder="e.g., Van 2 Diesel Fill & Oil Top-up"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Category</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Staff Salary & Wages">Staff Salary & Wages</option>
                    <option value="Van Fuel & Maintenance">Van Fuel & Maintenance</option>
                    <option value="Electricity & Utilities">Electricity & Utilities</option>
                    <option value="Stationery, Books & Printing">Stationery, Books & Printing</option>
                    <option value="Sports & Cultural Events">Sports & Cultural Events</option>
                    <option value="Building & Maintenance">Building & Maintenance</option>
                    <option value="RTE & Govt Documentation">RTE & Govt Documentation</option>
                    <option value="Refreshments & Food">Refreshments & Food</option>
                    <option value="Other / Miscellaneous">Other / Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg font-mono font-bold text-rose-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Paid To (Vendor / Person)</label>
                  <input
                    type="text"
                    value={editingExpense.paidTo}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paidTo: e.target.value })}
                    placeholder="e.g., Sri Ramajayam Fuels"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Payment Mode</label>
                  <select
                    value={editingExpense.paymentMode}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="GPay / UPI">GPay / UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Remarks / Voucher Notes</label>
                <input
                  type="text"
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  placeholder="e.g., Bill receipt attached with signature"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8E2] rounded-lg text-[#2D312E]"
                />
              </div>

              <div className="px-5 py-3 bg-[#F2F4F2] -mx-5 -mb-5 mt-4 border-t border-[#E2E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#2D312E] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isAddingExpense ? 'Add Voucher' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
