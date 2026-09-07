import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_STAFF_MEMBERS, 
  generateMonthlyPayroll, 
  StaffMember, 
  MonthlyPayrollRecord 
} from '../../data/reportsData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { 
  Users, 
  DollarSign, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Calendar,
  Building,
  CreditCard,
  Edit2,
  Trash2,
  Plus,
  X,
  Save
} from 'lucide-react';

interface StaffReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const StaffReports: React.FC<StaffReportsProps> = ({ onExportCsv }) => {
  const { schoolInfo } = useSchool();
  const [subTab, setSubTab] = useState<'directory' | 'salary-register'>('directory');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-08');

  // Modifiable Staff Members state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(INITIAL_STAFF_MEMBERS);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState<boolean>(false);

  // Modifiable Payroll state
  const [payrollMap, setPayrollMap] = useState<Record<string, MonthlyPayrollRecord[]>>({});
  const payrollRecords = payrollMap[selectedMonth] || generateMonthlyPayroll(selectedMonth);
  const [editingPayroll, setEditingPayroll] = useState<MonthlyPayrollRecord | null>(null);

  // Statistics
  const totalStaff = staffMembers.length;
  const teachingStaff = staffMembers.filter(s => s.department === 'Academic / Teaching').length;
  const transportStaff = staffMembers.filter(s => s.department === 'Transport').length;
  const adminStaff = staffMembers.filter(s => s.department === 'Administration').length;
  const totalGrossPayroll = payrollRecords.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalNetPayroll = payrollRecords.reduce((sum, p) => sum + p.netPayable, 0);

  // Filter staff directory
  const filteredStaff = staffMembers.filter(s => {
    return selectedDept === 'all' || s.department === selectedDept;
  });

  // PDF Export
  const handleExportPdf = () => {
    if (subTab === 'directory') {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Department', 'Qualification', 'Exp', 'Contact', 'Status'];
      const rows = filteredStaff.map(s => [
        s.employeeCode,
        s.name,
        s.designation,
        s.department,
        s.qualification,
        `${s.experienceYears} yrs`,
        s.mobile,
        s.status,
      ]);
      const doc = generateReportTablePdf('Faculty & Staff Directory Report', `Department: ${selectedDept === 'all' ? 'All Departments' : selectedDept}`, headers, rows, schoolInfo);
      doc.save('Staff_Directory_Report.pdf');
    } else {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Basic Pay', 'HRA & DA', 'Gross Pay', 'Deductions', 'Net Payable', 'Status'];
      const rows = payrollRecords.map(p => [
        p.employeeCode,
        p.staffName,
        p.designation,
        formatCurrency(p.basicSalary),
        formatCurrency(p.hra + p.da),
        formatCurrency(p.grossSalary),
        formatCurrency(p.totalDeductions),
        formatCurrency(p.netPayable),
        p.paymentStatus,
      ]);
      // Append summary row
      rows.push(['Total', '', '', '', '', formatCurrency(totalGrossPayroll), formatCurrency(payrollRecords.reduce((sum, p) => sum + p.totalDeductions, 0)), formatCurrency(totalNetPayroll), '']);
      const doc = generateReportTablePdf(`Staff Salary & Payroll Register`, `Payroll Month: ${selectedMonth}`, headers, rows, schoolInfo);
      doc.save(`Staff_Salary_Register_${selectedMonth}.pdf`);
    }
  };

  const handleExport = () => {
    if (subTab === 'directory') {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Department', 'Qualification', 'Experience (Yrs)', 'Subjects Handled', 'Classes', 'Mobile', 'Email', 'Status'];
      const rows = filteredStaff.map(s => [
        s.employeeCode,
        `"${s.name}"`,
        `"${s.designation}"`,
        `"${s.department}"`,
        `"${s.qualification}"`,
        s.experienceYears,
        `"${s.subjectsHandled.join(', ')}"`,
        `"${s.classesAssigned.join(', ')}"`,
        s.mobile,
        s.email,
        s.status,
      ]);
      onExportCsv('Staff_Directory_Report', headers, rows);
    } else {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Department', 'Basic Pay', 'HRA', 'DA', 'Allowances', 'Gross Pay', 'EPF Ded', 'ESI Ded', 'Prof Tax', 'Net Payable', 'Bank Name', 'Account No', 'Payment Mode', 'Status'];
      const rows = payrollRecords.map(p => [
        p.employeeCode,
        `"${p.staffName}"`,
        `"${p.designation}"`,
        `"${p.department}"`,
        p.basicSalary,
        p.hra,
        p.da,
        p.conveyance + p.specialAllowance,
        p.grossSalary,
        p.epfEmployee,
        p.esiEmployee,
        p.professionalTax,
        p.netPayable,
        `"${p.bankName}"`,
        p.accountNo,
        p.paymentMode,
        p.paymentStatus,
      ]);
      onExportCsv(`Staff_Salary_Register_${selectedMonth}`, headers, rows);
    }
  };

  // Staff Handlers
  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      setStaffMembers(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (isAddingStaff) {
      setStaffMembers(prev => [...prev, editingStaff]);
    } else {
      setStaffMembers(prev => prev.map(s => s.id === editingStaff.id ? editingStaff : s));
    }
    setEditingStaff(null);
    setIsAddingStaff(false);
  };

  // Payroll Handlers
  const handleDeletePayroll = (payrollId: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete payroll entry for "${staffName}"?`)) {
      const updated = payrollRecords.filter(p => p.payrollId !== payrollId);
      setPayrollMap(prev => ({ ...prev, [selectedMonth]: updated }));
    }
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;
    const updated = payrollRecords.map(p => p.payrollId === editingPayroll.payrollId ? editingPayroll : p);
    setPayrollMap(prev => ({ ...prev, [selectedMonth]: updated }));
    setEditingPayroll(null);
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-1.5 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSubTab('directory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'directory' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Directory</span>
          </button>
          <button
            onClick={() => setSubTab('salary-register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'salary-register' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salary Register</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A]/10 hover:bg-[#4F6D7A]/20 text-[#4F6D7A] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Faculty & Staff</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{totalStaff} Personnel</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">100% Active Regular Payroll</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Teaching Faculty</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{teachingStaff} Teachers</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">Kindergarten & Primary (1-5STD)</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Monthly Gross Wage Bill</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{formatCurrency(totalGrossPayroll)}</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">Basic + Allowances</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Monthly Net Disbursed</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{formatCurrency(totalNetPayroll)}</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">Post PF, ESI & Tax Deductions</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STAFF DIRECTORY TAB                                                    */}
      {/* ========================================================================= */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280] font-medium">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
              >
                <option value="all">All Departments ({staffMembers.length})</option>
                <option value="Academic / Teaching">Academic / Teaching ({teachingStaff})</option>
                <option value="Administration">Administration ({adminStaff})</option>
                <option value="Transport">Transport / Fleet ({transportStaff})</option>
                <option value="Support Staff">Support Staff</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6B7280]">{filteredStaff.length} Employees Shown</span>
              <button
                onClick={() => {
                  const newCode = `EMP-${(staffMembers.length + 1).toString().padStart(3, '0')}`;
                  setEditingStaff({
                    id: `staff-${Date.now()}`,
                    employeeCode: newCode,
                    name: '',
                    designation: 'Teacher',
                    department: 'Academic / Teaching',
                    qualification: 'B.Ed',
                    experienceYears: 1,
                    joiningDate: new Date().toISOString().split('T')[0],
                    salaryGrade: 'Grade-C',
                    subjectsHandled: ['General'],
                    classesAssigned: ['Standard 1'],
                    mobile: '9876543210',
                    email: '',
                    status: 'Active',
                  });
                  setIsAddingStaff(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff</span>
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
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Qualification</th>
                    <th className="py-2.5 px-3 text-center">Exp</th>
                    <th className="py-2.5 px-3">Assigned Classes / Roles</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="no-print py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{s.employeeCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{s.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{s.designation}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-[#4F6D7A]/10 text-[#4F6D7A] px-2 py-0.5 rounded text-[10px] font-bold">
                          {s.department}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#2D312E]">{s.qualification}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.experienceYears} yrs</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{s.classesAssigned.join(', ')}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-mono text-[#2D312E]">
                          <Phone className="w-3 h-3 text-[#89A894]" />
                          {s.mobile}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-[#89A894]/20 text-[#2D312E] font-bold text-[10px] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-[#89A894]" />
                          {s.status}
                        </span>
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStaff({ ...s });
                              setIsAddingStaff(false);
                            }}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(s.id, s.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Staff Member"
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
      {/* 2. SALARY REGISTER TAB                                                    */}
      {/* ========================================================================= */}
      {subTab === 'salary-register' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280] font-medium">Payroll Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
              />
            </div>

            <div className="text-xs text-[#6B7280]">
              Disbursement Cycle: {selectedMonth}-31 • Mode: Bank NEFT / Direct
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
                    <th className="py-2.5 px-3 text-right">HRA & DA</th>
                    <th className="py-2.5 px-3 text-right">Allowances</th>
                    <th className="py-2.5 px-3 text-right font-bold">Gross Salary</th>
                    <th className="py-2.5 px-3 text-right text-[#D68A6E]">Deductions</th>
                    <th className="py-2.5 px-3 text-right text-[#89A894] font-black">Net Payable</th>
                    <th className="py-2.5 px-3">Bank Details</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="no-print py-2.5 px-3 text-center">Actions</th>
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
                      <td className="py-2.5 px-3 text-right font-mono text-[#6B7280]">{formatCurrency(p.conveyance + p.specialAllowance)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">{formatCurrency(p.grossSalary)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D68A6E]">{formatCurrency(p.totalDeductions)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-[#89A894] text-sm">{formatCurrency(p.netPayable)}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] font-medium text-[#2D312E]">{p.bankName}</div>
                        <div className="font-mono text-[9px] text-[#6B7280]">{p.accountNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-[#89A894]/20 text-[#2D312E] font-bold text-[10px] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-[#89A894]" />
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingPayroll({ ...p })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Payroll Entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(p.payrollId, p.staffName)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Payroll Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#F2F4F2] font-black border-t-2 border-[#4F6D7A]">
                    <td className="py-3 px-3 uppercase text-[#2D312E]" colSpan={3}>Total Monthly Payroll</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.basicSalary, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + (p.hra + p.da), 0))}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(payrollRecords.reduce((sum, p) => sum + (p.conveyance + p.specialAllowance), 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#2D312E]">{formatCurrency(totalGrossPayroll)}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#D68A6E]">{formatCurrency(payrollRecords.reduce((sum, p) => sum + p.totalDeductions, 0))}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-[#89A894]">{formatCurrency(totalNetPayroll)}</td>
                    <td className="py-3 px-3 text-[11px] text-[#6B7280]" colSpan={2}>Direct Bank NEFT Transmission</td>
                    <td className="no-print py-3 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Staff Member */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#E2E8E2] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4F6D7A]" />
                {isAddingStaff ? 'Add Staff Member' : `Edit Staff: ${editingStaff.name}`}
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-[#6B7280] hover:text-[#2D312E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={editingStaff.employeeCode}
                    onChange={(e) => setEditingStaff({ ...editingStaff, employeeCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    placeholder="e.g. Mrs. S. Revathi"
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Department</label>
                  <select
                    value={editingStaff.department}
                    onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  >
                    <option value="Academic / Teaching">Academic / Teaching</option>
                    <option value="Administration">Administration</option>
                    <option value="Transport">Transport</option>
                    <option value="Support Staff">Support Staff</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingStaff.designation}
                    onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    placeholder="e.g. Primary Teacher"
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Qualification</label>
                  <input
                    type="text"
                    value={editingStaff.qualification}
                    onChange={(e) => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                    placeholder="e.g. M.Sc, B.Ed"
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingStaff.experienceYears}
                    onChange={(e) => setEditingStaff({ ...editingStaff, experienceYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    value={editingStaff.mobile}
                    onChange={(e) => setEditingStaff({ ...editingStaff, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Status</label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Relieved">Relieved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#6B7280] font-bold block mb-1">Assigned Classes / Roles (comma-separated)</label>
                <input
                  type="text"
                  value={editingStaff.classesAssigned.join(', ')}
                  onChange={(e) => setEditingStaff({ ...editingStaff, classesAssigned: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Std 1-A, Std 2-B"
                  className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2D312E] font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Payroll Entry */}
      {editingPayroll && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#E2E8E2] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#89A894]" />
                Edit Payroll: {editingPayroll.staffName} ({editingPayroll.employeeCode})
              </h3>
              <button
                onClick={() => setEditingPayroll(null)}
                className="text-[#6B7280] hover:text-[#2D312E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPayroll.basicSalary}
                    onChange={(e) => {
                      const basic = parseInt(e.target.value) || 0;
                      const hra = editingPayroll.hra;
                      const da = editingPayroll.da;
                      const allowances = editingPayroll.conveyance + editingPayroll.specialAllowance;
                      const gross = basic + hra + da + allowances;
                      const net = gross - editingPayroll.totalDeductions;
                      setEditingPayroll({
                        ...editingPayroll,
                        basicSalary: basic,
                        grossSalary: gross,
                        netPayable: net,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">HRA (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPayroll.hra}
                    onChange={(e) => {
                      const hra = parseInt(e.target.value) || 0;
                      const gross = editingPayroll.basicSalary + hra + editingPayroll.da + editingPayroll.conveyance + editingPayroll.specialAllowance;
                      setEditingPayroll({
                        ...editingPayroll,
                        hra,
                        grossSalary: gross,
                        netPayable: gross - editingPayroll.totalDeductions,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">DA (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPayroll.da}
                    onChange={(e) => {
                      const da = parseInt(e.target.value) || 0;
                      const gross = editingPayroll.basicSalary + editingPayroll.hra + da + editingPayroll.conveyance + editingPayroll.specialAllowance;
                      setEditingPayroll({
                        ...editingPayroll,
                        da,
                        grossSalary: gross,
                        netPayable: gross - editingPayroll.totalDeductions,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Total Deductions (PF/ESI/Tax) (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPayroll.totalDeductions}
                    onChange={(e) => {
                      const ded = parseInt(e.target.value) || 0;
                      setEditingPayroll({
                        ...editingPayroll,
                        totalDeductions: ded,
                        netPayable: editingPayroll.grossSalary - ded,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold text-[#D68A6E]"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Net Payable (Calculated)</label>
                  <div className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono font-black text-sm text-[#89A894]">
                    {formatCurrency(editingPayroll.netPayable)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editingPayroll.bankName}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, bankName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Account No</label>
                  <input
                    type="text"
                    value={editingPayroll.accountNo}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, accountNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Payment Mode</label>
                  <select
                    value={editingPayroll.paymentMode}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  >
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Payment Status</label>
                  <select
                    value={editingPayroll.paymentStatus}
                    onChange={(e) => setEditingPayroll({ ...editingPayroll, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processed">Processed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingPayroll(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2D312E] font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Payroll</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
