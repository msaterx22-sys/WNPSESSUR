import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { formatCurrency, formatNumber, cleanPhoneNumber } from '../../utils/formatters';
import { 
  CreditCard, 
  Bus, 
  AlertCircle, 
  Percent, 
  Layers, 
  Phone, 
  MessageSquare, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Award,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { Student } from '../../types';

interface FeeConveyanceReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const FeeConveyanceReports: React.FC<FeeConveyanceReportsProps> = ({ onExportCsv }) => {
  const { students, receipts, expenses, classList, getStudentTotalFee, getStudentTotalPaid, updateStudent, deleteStudent, schoolInfo } = useSchool();
  const [subTab, setSubTab] = useState<'summary' | 'outstanding' | 'defaulters' | 'types'>('summary');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [defaulterFilter, setDefaulterFilter] = useState<'defaulters' | 'discounts'>('defaulters');

  // Edit fee concession state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [feeFormData, setFeeFormData] = useState({
    tuitionFee: 0,
    vanFee: 0,
    sportsFee: 0,
    discount: 0,
    discountReason: '',
    vanFacility: false,
  });

  // 1. Fee & Conveyance Summary calculations
  const classBreakdowns = classList.map(standard => {
    const classStudents = students.filter(s => s.standard === standard);
    const totalStudents = classStudents.length;
    const tuitionExpected = classStudents.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);
    const vanStudents = classStudents.filter(s => s.vanFacility);
    const vanExpected = classStudents.reduce((sum, s) => sum + (s.vanFee || 0), 0);
    const sportsExpected = classStudents.reduce((sum, s) => sum + (s.sportsFee || 0), 0);
    const discountsTotal = classStudents.reduce((sum, s) => sum + (s.discount || 0), 0);
    const netExpected = classStudents.reduce((sum, s) => sum + getStudentTotalFee(s), 0);

    const classReceipts = receipts.filter(r => r.standard === standard);
    const totalCollected = classReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const tuitionCollected = classReceipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0);
    const vanCollected = classReceipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0);
    const sportsCollected = classReceipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0);

    const pending = Math.max(0, netExpected - totalCollected);
    const collectionPercent = netExpected > 0 ? Math.min(100, (totalCollected / netExpected) * 100) : 0;

    return {
      standard,
      totalStudents,
      tuitionExpected,
      tuitionCollected,
      vanSubscribers: vanStudents.length,
      vanExpected,
      vanCollected,
      sportsExpected,
      sportsCollected,
      discountsTotal,
      netExpected,
      totalCollected,
      pending,
      collectionPercent,
    };
  });

  // Overall totals
  const overallExpected = classBreakdowns.reduce((sum, c) => sum + c.netExpected, 0);
  const overallCollected = classBreakdowns.reduce((sum, c) => sum + c.totalCollected, 0);
  const overallPending = Math.max(0, overallExpected - overallCollected);
  const overallVanExpected = classBreakdowns.reduce((sum, c) => sum + c.vanExpected, 0);
  const overallVanCollected = classBreakdowns.reduce((sum, c) => sum + c.vanCollected, 0);
  const totalVanSubscribers = students.filter(s => s.vanFacility).length;

  // Van fuel/maintenance expenses
  const vanExpensesTotal = expenses
    .filter(e => e.category === 'Van Fuel & Maintenance')
    .reduce((sum, e) => sum + e.amount, 0);

  // Route breakdown
  const routeStats: Record<string, { students: number; feeExpected: number; paid: number }> = {};
  students.filter(s => s.vanFacility).forEach(s => {
    const route = s.vanRoute || 'Default Essur Route';
    if (!routeStats[route]) {
      routeStats[route] = { students: 0, feeExpected: 0, paid: 0 };
    }
    routeStats[route].students += 1;
    routeStats[route].feeExpected += (s.vanFee || 0);
    const receiptsForStudent = receipts.filter(r => r.studentId === s.id);
    routeStats[route].paid += receiptsForStudent.reduce((sum, r) => sum + (r.breakdown.van || 0), 0);
  });

  // 2. Collection & Outstanding Ledger
  const studentLedger = students.map(student => {
    const totalFee = getStudentTotalFee(student);
    const totalPaid = getStudentTotalPaid(student.id);
    const pending = Math.max(0, totalFee - totalPaid);
    const percentPaid = totalFee > 0 ? Math.min(100, Math.round((totalPaid / totalFee) * 100)) : 100;
    return {
      student,
      totalFee,
      totalPaid,
      pending,
      percentPaid,
      status: pending === 0 ? 'Cleared' : totalPaid === 0 ? 'Zero Paid' : 'Partial Paid',
    };
  });

  const filteredStudentLedger = studentLedger.filter(item => {
    const matchesClass = selectedClass === 'all' || item.student.standard === selectedClass;
    const matchesSearch = 
      item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // 3. Defaulters & Discounts
  const defaulters = studentLedger
    .filter(i => i.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const discountsList = students
    .filter(s => (s.discount && s.discount > 0) || s.isRte)
    .map(s => ({
      student: s,
      discountAmount: s.discount || 0,
      isRte: !!s.isRte,
      totalFee: getStudentTotalFee(s),
      reason: s.isRte ? 'RTE 25% Govt Quota (100% Free Tuition)' : s.notes || 'Management / Sibling Concession',
    }));

  // 4. Fee Type-wise Summary
  const feeTypeTuition = receipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0);
  const feeTypeVan = receipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0);
  const feeTypeSports = receipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0);
  const feeTypeLate = receipts.reduce((sum, r) => sum + (r.breakdown.lateFee || 0), 0);
  const feeTypeOther = receipts.reduce((sum, r) => sum + (r.breakdown.other || 0), 0);
  const totalHeadWise = feeTypeTuition + feeTypeVan + feeTypeSports + feeTypeLate + feeTypeOther;

  // Handlers for CSV export
  const handleExport = () => {
    if (subTab === 'summary') {
      const headers = ['Standard', 'Total Students', 'Tuition Expected', 'Tuition Collected', 'Van Subscribers', 'Van Expected', 'Van Collected', 'Sports Expected', 'Net Total Demand', 'Total Collected', 'Outstanding', 'Collection %'];
      const rows = classBreakdowns.map(c => [
        c.standard,
        c.totalStudents,
        c.tuitionExpected,
        c.tuitionCollected,
        c.vanSubscribers,
        c.vanExpected,
        c.vanCollected,
        c.sportsExpected,
        c.netExpected,
        c.totalCollected,
        c.pending,
        `${c.collectionPercent.toFixed(1)}%`
      ]);
      onExportCsv('Fee_and_Conveyance_Summary_Report', headers, rows);
    } else if (subTab === 'outstanding') {
      const headers = ['Admission No', 'Student Name', 'Standard', 'Section', 'Parent Name', 'Mobile', 'Van User', 'Total Fee', 'Amount Paid', 'Outstanding Dues', 'Status'];
      const rows = filteredStudentLedger.map(i => [
        i.student.admissionNo,
        `"${i.student.name}"`,
        i.student.standard,
        i.student.section,
        `"${i.student.parentName}"`,
        i.student.parentPhone,
        i.student.vanFacility ? 'Yes' : 'No',
        i.totalFee,
        i.totalPaid,
        i.pending,
        i.status,
      ]);
      onExportCsv('Fee_Collection_and_Outstanding_Ledger', headers, rows);
    } else if (subTab === 'defaulters') {
      if (defaulterFilter === 'defaulters') {
        const headers = ['Admission No', 'Student Name', 'Standard', 'Parent Name', 'Mobile', 'Total Fee', 'Paid', 'Overdue Balance'];
        const rows = defaulters.map(i => [
          i.student.admissionNo,
          `"${i.student.name}"`,
          `${i.student.standard}-${i.student.section}`,
          `"${i.student.parentName}"`,
          i.student.parentPhone,
          i.totalFee,
          i.totalPaid,
          i.pending,
        ]);
        onExportCsv('Fee_Defaulters_Register', headers, rows);
      } else {
        const headers = ['Admission No', 'Student Name', 'Standard', 'Concession Type', 'Concession / Waiver (INR)', 'Net Payable'];
        const rows = discountsList.map(d => [
          d.student.admissionNo,
          `"${d.student.name}"`,
          d.student.standard,
          `"${d.reason}"`,
          d.isRte ? d.student.tuitionFee : d.discountAmount,
          d.totalFee,
        ]);
        onExportCsv('Fee_Discounts_and_Concessions_Register', headers, rows);
      }
    } else {
      const headers = ['Fee Component Head', 'Total Collected (INR)', 'Percentage of Total'];
      const rows = [
        ['Tuition & Academic Fees', feeTypeTuition, `${((feeTypeTuition / totalHeadWise) * 100).toFixed(1)}%`],
        ['Van & Conveyance Fees', feeTypeVan, `${((feeTypeVan / totalHeadWise) * 100).toFixed(1)}%`],
        ['Sports & Physical Activities', feeTypeSports, `${((feeTypeSports / totalHeadWise) * 100).toFixed(1)}%`],
        ['Late Fees & Arrears Fines', feeTypeLate, `${((feeTypeLate / totalHeadWise) * 100).toFixed(1)}%`],
        ['Exam & Learning Materials', feeTypeOther, `${((feeTypeOther / totalHeadWise) * 100).toFixed(1)}%`],
      ];
      onExportCsv('Fee_Type_Wise_Summary_Report', headers, rows);
    }
  };

  const handleExportPdf = () => {
    if (subTab === 'summary') {
      const headers = ['Standard', 'Enrolled', 'Demand (INR)', 'Collected (INR)', 'Van Students', 'Van Collected', 'Pending (INR)', 'Collection %'];
      const rows = classBreakdowns.map(c => [
        c.standard,
        c.totalStudents,
        c.netExpected,
        c.totalCollected,
        c.vanSubscribers,
        c.vanCollected,
        c.pending,
        `${c.collectionPercent.toFixed(1)}%`,
      ]);
      const doc = generateReportTablePdf('Fee & Conveyance Summary Report', 'Standard-wise Collection & Demand', headers, rows, schoolInfo);
      doc.save('Fee_and_Conveyance_Summary_Report.pdf');
    } else if (subTab === 'outstanding') {
      const headers = ['Adm #', 'Student Name', 'Standard', 'Parent Name', 'Van', 'Demand (INR)', 'Paid (INR)', 'Due (INR)', 'Status'];
      const rows = filteredStudentLedger.map(i => [
        i.student.admissionNo,
        i.student.name,
        `${i.student.standard}-${i.student.section}`,
        i.student.parentName,
        i.student.vanFacility ? `Yes (Rs.${i.student.vanFee})` : 'No',
        i.totalFee,
        i.totalPaid,
        i.pending,
        i.status,
      ]);
      const doc = generateReportTablePdf('Student Fee Collection & Outstanding Ledger', `Academic Year ${schoolInfo.academicYear}`, headers, rows, schoolInfo);
      doc.save('Fee_Collection_Outstanding_Ledger.pdf');
    } else if (subTab === 'defaulters') {
      if (defaulterFilter === 'defaulters') {
        const headers = ['Adm #', 'Student Name', 'Standard', 'Parent Phone', 'Total Demand', 'Paid', 'Pending Due'];
        const rows = defaulters.map(d => [
          d.student.admissionNo,
          d.student.name,
          `${d.student.standard}-${d.student.section}`,
          d.student.parentPhone,
          d.totalFee,
          d.totalPaid,
          d.pending,
        ]);
        const doc = generateReportTablePdf('Fee Defaulters & Arrears Register', 'Pending Balance Statement', headers, rows, schoolInfo);
        doc.save('Fee_Defaulters_Register.pdf');
      } else {
        const headers = ['Adm #', 'Student Name', 'Standard', 'Reason / Category', 'Concession Amt', 'Total Fee'];
        const rows = discountsList.map(d => [
          d.student.admissionNo,
          d.student.name,
          d.student.standard,
          d.reason,
          d.isRte ? d.student.tuitionFee : d.discountAmount,
          d.totalFee,
        ]);
        const doc = generateReportTablePdf('Fee Concessions & Waivers Ledger', 'Concession Register', headers, rows, schoolInfo);
        doc.save('Fee_Discounts_Concessions.pdf');
      }
    } else {
      const headers = ['Fee Head', 'Collected (INR)', 'Share %'];
      const rows = [
        ['Tuition & Academic Fees', feeTypeTuition, `${((feeTypeTuition / totalHeadWise) * 100).toFixed(1)}%`],
        ['Van & Conveyance Fees', feeTypeVan, `${((feeTypeVan / totalHeadWise) * 100).toFixed(1)}%`],
        ['Sports & Physical Activities', feeTypeSports, `${((feeTypeSports / totalHeadWise) * 100).toFixed(1)}%`],
        ['Late Fees & Arrears Fines', feeTypeLate, `${((feeTypeLate / totalHeadWise) * 100).toFixed(1)}%`],
        ['Exam & Learning Materials', feeTypeOther, `${((feeTypeOther / totalHeadWise) * 100).toFixed(1)}%`],
      ];
      const doc = generateReportTablePdf('Fee Type-Wise Summary & Distribution', 'Official Component Head Breakdown', headers, rows, schoolInfo);
      doc.save('Fee_Type_Wise_Summary.pdf');
    }
  };

  const handleOpenEditFee = (student: Student) => {
    setEditingStudent(student);
    setFeeFormData({
      tuitionFee: student.tuitionFee || 0,
      vanFee: student.vanFee || 0,
      sportsFee: student.sportsFee || 0,
      discount: student.discount || 0,
      discountReason: student.notes || '',
      vanFacility: student.vanFacility || false,
    });
  };

  const handleSaveFeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent(editingStudent.id, {
      tuitionFee: Number(feeFormData.tuitionFee),
      vanFee: Number(feeFormData.vanFee),
      sportsFee: Number(feeFormData.sportsFee),
      discount: Number(feeFormData.discount),
      notes: feeFormData.discountReason.trim(),
      vanFacility: feeFormData.vanFacility,
    });
    setEditingStudent(null);
  };

  const handleDeleteOrWaive = (student: Student, pending: number) => {
    if (pending > 0) {
      const choice = window.confirm(
        `Student ${student.name} (${student.standard}) has outstanding dues of Rs. ${formatNumber(pending)}.\n\nClick OK to apply a 100% Fee Concession / Waiver to clear this balance.\nClick Cancel to keep balance.`
      );
      if (choice) {
        updateStudent(student.id, {
          discount: (student.discount || 0) + pending,
          notes: `Dues Waived by Admin on ${new Date().toLocaleDateString('en-IN')}`,
        });
      }
    } else {
      if (window.confirm(`Are you sure you want to remove student record for ${student.name} (${student.admissionNo})?`)) {
        deleteStudent(student.id);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-1.5 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSubTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'summary' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Fee & Conveyance Summary</span>
          </button>
          <button
            onClick={() => setSubTab('outstanding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'outstanding' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collection / Outstanding</span>
          </button>
          <button
            onClick={() => setSubTab('defaulters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'defaulters' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Defaulters / Discounts</span>
          </button>
          <button
            onClick={() => setSubTab('types')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'types' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fee Type-wise Summary</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Download Official PDF Report"
          >
            <Download className="w-3.5 h-3.5 text-red-600" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Annual Demand</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{formatCurrency(overallExpected)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{students.length} Enrolled Students</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Realized to Date</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{formatCurrency(overallCollected)}</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">
            {overallExpected > 0 ? `${((overallCollected / overallExpected) * 100).toFixed(1)}% Realized` : '100%'}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Outstanding Dues</span>
          <span className="text-base font-extrabold text-[#D68A6E] font-mono mt-0.5 block">{formatCurrency(overallPending)}</span>
          <span className="text-[10px] text-[#D68A6E] font-bold mt-1 block">{defaulters.length} Students Pending</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Conveyance (Van) Demand</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{formatCurrency(overallVanExpected)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{totalVanSubscribers} Commuters across 3 routes</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FEE & CONVEYANCE SUMMARY TAB                                           */}
      {/* ========================================================================= */}
      {subTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8E2] bg-[#F2F4F2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#4F6D7A]" />
                  Standard-wise Fee & Conveyance Realization Matrix
                </h3>
                <p className="text-[11px] text-[#6B7280]">Demand, collection and outstanding balance across classes LKG to 5STD</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3 text-center">Strength</th>
                    <th className="py-2.5 px-3 text-right">Tuition Demanded</th>
                    <th className="py-2.5 px-3 text-center">Van Riders</th>
                    <th className="py-2.5 px-3 text-right">Van Demanded</th>
                    <th className="py-2.5 px-3 text-right">Sports Demanded</th>
                    <th className="py-2.5 px-3 text-right">Net Demand</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894]">Collected</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Realized %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/70">
                  {classBreakdowns.map((row) => (
                    <tr key={row.standard} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#4F6D7A]">{row.standard}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{row.totalStudents}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(row.tuitionExpected)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-[#4F6D7A]/10 text-[#4F6D7A] px-2 py-0.5 rounded font-bold">
                          <Bus className="w-3 h-3" />
                          {row.vanSubscribers}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(row.vanExpected)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(row.sportsExpected)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(row.netExpected)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#89A894]">{formatCurrency(row.totalCollected)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D68A6E]">
                        {row.pending > 0 ? formatCurrency(row.pending) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${row.collectionPercent >= 80 ? 'bg-[#89A894]' : row.collectionPercent >= 50 ? 'bg-[#4F6D7A]' : 'bg-[#D68A6E]'}`} 
                              style={{ width: `${row.collectionPercent}%` }} 
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px]">{row.collectionPercent.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-3 px-3 uppercase">Total School</td>
                    <td className="py-3 px-3 text-center">{students.length}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(classBreakdowns.reduce((sum, c) => sum + c.tuitionExpected, 0))}</td>
                    <td className="py-3 px-3 text-center">{totalVanSubscribers}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(overallVanExpected)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(classBreakdowns.reduce((sum, c) => sum + c.sportsExpected, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#2D312E]">{formatCurrency(overallExpected)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#89A894]">{formatCurrency(overallCollected)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#D68A6E]">{formatCurrency(overallPending)}</td>
                    <td className="py-3 px-3 text-center text-sm font-mono text-[#4F6D7A]">
                      {overallExpected > 0 ? `${((overallCollected / overallExpected) * 100).toFixed(1)}%` : '100%'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Route-wise Conveyance & Vehicle Operating Cost Audit */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8E2] pb-2.5">
              <div>
                <h4 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#89A894]" />
                  School Van Transportation Routes & Operating Cost Audit
                </h4>
                <p className="text-[11px] text-[#6B7280]">
                  Realized van student fees vs fleet fuel and maintenance expenditures
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#4F6D7A]/10 text-[#4F6D7A] px-2 py-1 rounded font-bold">
                  Fleet Diesel & Maintenance Cost: {formatCurrency(vanExpensesTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(routeStats).map(([route, stats]) => (
                <div key={route} className="bg-[#F7F8F6] p-3 rounded-lg border border-[#E2E8E2] space-y-1.5">
                  <div className="font-bold text-xs text-[#2D312E] flex items-center justify-between">
                    <span>{route}</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[10px] text-[#4F6D7A] border border-[#E2E8E2]">
                      {stats.students} Students
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E2E8E2]">
                    <div>
                      <span className="text-[#6B7280]">Demanded:</span>
                      <strong className="block font-mono text-[#2D312E]">{formatCurrency(stats.feeExpected)}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Realized:</span>
                      <strong className="block font-mono text-[#89A894]">{formatCurrency(stats.paid)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COLLECTION & OUTSTANDING LEDGER TAB                                    */}
      {/* ========================================================================= */}
      {subTab === 'outstanding' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, admission no, parent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4F6D7A]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280]">Filter Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-xs text-[#2D312E] focus:outline-none"
              >
                <option value="all">All Standards ({students.length})</option>
                {classList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Adm #</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Parent & Contact</th>
                    <th className="py-2.5 px-3 text-center">Van User</th>
                    <th className="py-2.5 px-3 text-right">Total Demand</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894]">Total Paid</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="no-print py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredStudentLedger.map((item) => (
                    <tr key={item.student.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{item.student.admissionNo}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{item.student.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{item.student.standard}-{item.student.section}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[#2D312E]">{item.student.parentName}</div>
                        <div className="text-[10px] text-[#6B7280]">{item.student.parentPhone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.student.vanFacility ? (
                          <span className="inline-block bg-[#4F6D7A]/10 text-[#4F6D7A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Yes (₹{item.student.vanFee})
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatCurrency(item.totalFee)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#89A894]">{formatCurrency(item.totalPaid)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D68A6E]">
                        {item.pending > 0 ? formatCurrency(item.pending) : 'CLEARED'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Cleared'
                            ? 'bg-[#89A894]/20 text-[#2D312E]'
                            : item.status === 'Partial Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-[#D68A6E]/20 text-[#D68A6E]'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditFee(item.student)}
                            className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                            title="Edit Fee Structure & Concessions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrWaive(item.student, item.pending)}
                            className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title={item.pending > 0 ? "Waive Dues" : "Delete Student Record"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      {/* 3. DEFAULTERS & DISCOUNTS TAB                                             */}
      {/* ========================================================================= */}
      {subTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDefaulterFilter('defaulters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  defaulterFilter === 'defaulters'
                    ? 'bg-[#D68A6E] text-white'
                    : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-gray-200'
                }`}
              >
                Outstanding Defaulters ({defaulters.length})
              </button>
              <button
                onClick={() => setDefaulterFilter('discounts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  defaulterFilter === 'discounts'
                    ? 'bg-[#4F6D7A] text-white'
                    : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-gray-200'
                }`}
              >
                Discounts & RTE Concessions ({discountsList.length})
              </button>
            </div>

            <span className="text-xs text-[#6B7280]">
              {defaulterFilter === 'defaulters' 
                ? `Total Defaulter Dues: ${formatCurrency(defaulters.reduce((sum, d) => sum + d.pending, 0))}`
                : `${discountsList.length} Students receiving fee support / subsidy`}
            </span>
          </div>

          {defaulterFilter === 'defaulters' ? (
            <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Adm #</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Parent Name</th>
                      <th className="py-2.5 px-3">Mobile Contact</th>
                      <th className="py-2.5 px-3 text-right">Total Expected</th>
                      <th className="py-2.5 px-3 text-right text-[#89A894]">Paid</th>
                      <th className="py-2.5 px-3 text-right text-[#D68A6E]">Overdue Due</th>
                      <th className="no-print py-2.5 px-3 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]/60">
                    {defaulters.map((item, index) => {
                      const whatsappMsg = `Dear Parent, Greetings from Wisdom Nursery & Primary School, Essur. This is a gentle reminder regarding pending school fees of ${formatCurrency(item.pending)} for your ward ${item.student.name} (${item.student.standard}). Kindly clear the balance at the earliest. Admin: R. Saravanan (Ph: 9176593129).`;
                      const whatsappUrl = `https://wa.me/91${cleanPhoneNumber(item.student.whatsappNumber || item.student.parentPhone)}?text=${encodeURIComponent(whatsappMsg)}`;

                      return (
                        <tr key={item.student.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="py-2.5 px-3 text-[#6B7280] font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 font-mono text-[#6B7280]">{item.student.admissionNo}</td>
                          <td className="py-2.5 px-3 font-bold text-[#2D312E]">{item.student.name}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{item.student.standard}-{item.student.section}</td>
                          <td className="py-2.5 px-3 font-medium text-[#2D312E]">{item.student.parentName}</td>
                          <td className="py-2.5 px-3">
                            <a href={`tel:${item.student.parentPhone}`} className="text-[#4F6D7A] hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#89A894]" />
                              {item.student.parentPhone}
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.totalFee)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#89A894]">{formatCurrency(item.totalPaid)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-[#D68A6E] text-sm">
                            {formatCurrency(item.pending)}
                          </td>
                          <td className="no-print py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#89A894]/20 hover:bg-[#89A894]/30 text-[#4F6D7A] font-bold rounded text-[11px] transition-colors"
                                title="Send WhatsApp Fee Reminder"
                              >
                                <MessageSquare className="w-3 h-3 text-[#89A894]" />
                                <span>Remind</span>
                              </a>
                              <button
                                onClick={() => handleOpenEditFee(item.student)}
                                className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                                title="Edit Fee / Concession"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrWaive(item.student, item.pending)}
                                className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                title="Waive Remaining Dues"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                      <th className="py-2.5 px-3">Adm #</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Parent Name</th>
                      <th className="py-2.5 px-3">Concession / Discount Category</th>
                      <th className="py-2.5 px-3 text-right">Standard Tuition</th>
                      <th className="py-2.5 px-3 text-right text-[#D68A6E]">Concession Granted</th>
                      <th className="py-2.5 px-3 text-right font-bold text-[#89A894]">Net Fee Charged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E2]/60">
                    {discountsList.map((d) => (
                      <tr key={d.student.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{d.student.admissionNo}</td>
                        <td className="py-2.5 px-3 font-bold text-[#2D312E]">{d.student.name}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{d.student.standard}-{d.student.section}</td>
                        <td className="py-2.5 px-3 font-medium text-[#2D312E]">{d.student.parentName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.isRte ? 'bg-purple-100 text-purple-800' : 'bg-[#89A894]/20 text-[#4F6D7A]'
                          }`}>
                            <Award className="w-3 h-3" />
                            {d.reason}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(d.student.tuitionFee)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D68A6E]">
                          {d.isRte ? formatCurrency(d.student.tuitionFee) : formatCurrency(d.discountAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#89A894]">
                          {formatCurrency(d.totalFee)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FEE TYPE-WISE SUMMARY TAB                                              */}
      {/* ========================================================================= */}
      {subTab === 'types' && (
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
            <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4F6D7A]" />
              Fee Type & Particulars Realization Ledger
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Aggregation of revenue receipts by component head (Tuition, Conveyance, Sports, Late Fees, Materials)
            </p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <table className="w-full text-xs text-left border border-[#E2E8E2]">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] font-bold uppercase tracking-wider border-b border-[#E2E8E2]">
                    <th className="py-2 px-3">Fee Particulars Head</th>
                    <th className="py-2 px-3 text-right">Realized Amount (₹)</th>
                    <th className="py-2 px-3 text-center">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#2D312E]">Standard Tuition & Academic Fee</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#4F6D7A]">{formatCurrency(feeTypeTuition)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalHeadWise > 0 ? ((feeTypeTuition / totalHeadWise) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#2D312E]">Van Conveyance & Transportation</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#89A894]">{formatCurrency(feeTypeVan)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalHeadWise > 0 ? ((feeTypeVan / totalHeadWise) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#2D312E]">Annual Sports & Activities Kit</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(feeTypeSports)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalHeadWise > 0 ? ((feeTypeSports / totalHeadWise) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#2D312E]">Late Fees & Arrears Penalties</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D68A6E]">{formatCurrency(feeTypeLate)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalHeadWise > 0 ? ((feeTypeLate / totalHeadWise) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#2D312E]">Exam Stationery & Workbooks</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#6B7280]">{formatCurrency(feeTypeOther)}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalHeadWise > 0 ? ((feeTypeOther / totalHeadWise) * 100).toFixed(1) : 0}%</td>
                  </tr>
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-2.5 px-3 uppercase text-[#2D312E]">Total Realized Across Heads</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#4F6D7A]">{formatCurrency(totalHeadWise)}</td>
                    <td className="py-2.5 px-3 text-center">100.0%</td>
                  </tr>
                </tbody>
              </table>

              {/* Graphical Visual Distribution */}
              <div className="bg-[#F7F8F6] p-4 rounded-xl border border-[#E2E8E2] flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#2D312E] mb-2">Revenue Share Visual Breakdown</h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#6B7280]">Tuition & Academic</span>
                        <span className="font-mono font-bold">{((feeTypeTuition / (totalHeadWise || 1)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#4F6D7A] h-2 rounded-full" style={{ width: `${(feeTypeTuition / (totalHeadWise || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#6B7280]">Van Transportation</span>
                        <span className="font-mono font-bold">{((feeTypeVan / (totalHeadWise || 1)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#89A894] h-2 rounded-full" style={{ width: `${(feeTypeVan / (totalHeadWise || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#6B7280]">Sports & Physical Ed</span>
                        <span className="font-mono font-bold">{((feeTypeSports / (totalHeadWise || 1)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#D68A6E] h-2 rounded-full" style={{ width: `${(feeTypeSports / (totalHeadWise || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8E2] text-[11px] text-[#6B7280]">
                  * Generated from official receipts register for Wisdom Nursery & Primary School, Essur.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT STUDENT FEE & CONCESSION MODAL                                       */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2E8E2] overflow-hidden">
            <div className="bg-[#4F6D7A] px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Edit Student Fee Structure & Concession</h3>
                <p className="text-[11px] text-white/80">
                  {editingStudent.name} (Adm: {editingStudent.admissionNo} - Class {editingStudent.standard})
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeeEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Annual Tuition Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={feeFormData.tuitionFee}
                    onChange={(e) => setFeeFormData(prev => ({ ...prev, tuitionFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                    Sports & Activity Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={feeFormData.sportsFee}
                    onChange={(e) => setFeeFormData(prev => ({ ...prev, sportsFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F7F8F6] rounded-xl border border-[#E2E8E2] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D312E] flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#4F6D7A]" />
                    School Van Conveyance Facility
                  </label>
                  <input
                    type="checkbox"
                    checked={feeFormData.vanFacility}
                    onChange={(e) => setFeeFormData(prev => ({ ...prev, vanFacility: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#4F6D7A]"
                  />
                </div>
                {feeFormData.vanFacility && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7280] uppercase mb-1">
                      Annual Van Transportation Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={feeFormData.vanFee}
                      onChange={(e) => setFeeFormData(prev => ({ ...prev, vanFee: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                      placeholder="Enter Van Fee (e.g. 5000)"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <label className="block text-xs font-bold text-purple-900">
                  Fee Discount / Concession / RTE Subsidy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-purple-800 font-semibold mb-1">
                      Concession Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={feeFormData.discount}
                      onChange={(e) => setFeeFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-purple-800 font-semibold mb-1">
                      Concession Reason / Order
                    </label>
                    <input
                      type="text"
                      value={feeFormData.discountReason}
                      onChange={(e) => setFeeFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                      placeholder="e.g. Sibling Discount, RTE 25%"
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-[#2D312E]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-[#E2E8E2] rounded-lg text-xs font-bold text-[#6B7280] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Fee Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
