import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_CLASS_ATTENDANCE, 
  INITIAL_STAFF_ATTENDANCE, 
  INITIAL_DAILY_STUDENT_ATTENDANCE,
  DailyAttendanceDetail 
} from '../../data/reportsData';
import { 
  Calendar, 
  UserCheck, 
  Clock, 
  Users, 
  Download, 
  Printer, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Award,
  PlusCircle,
  X,
  Send,
  Save,
  Check,
  Filter
} from 'lucide-react';
import { cleanPhoneNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { Edit2, Trash2 } from 'lucide-react';

interface AttendanceReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const AttendanceReports: React.FC<AttendanceReportsProps> = ({ onExportCsv }) => {
  const { students, classList, schoolInfo } = useSchool();

  const [subTab, setSubTab] = useState<'student-summary' | 'staff-summary' | 'daily-detail'>('student-summary');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceDetail[]>(INITIAL_DAILY_STUDENT_ATTENDANCE);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<DailyAttendanceDetail | null>(null);

  // Take Attendance Modal State
  const [isRollCallOpen, setIsRollCallOpen] = useState<boolean>(false);
  const [rollCallClass, setRollCallClass] = useState<string>(classList[0] || '1STD');
  const [rollCallDate, setRollCallDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // In-modal roll-call roster state
  interface RollCallItem {
    studentId: string;
    admissionNo: string;
    rollNo: number;
    studentName: string;
    standard: string;
    parentPhone: string;
    status: 'Present' | 'Absent' | 'Late';
    reason: string;
  }

  const [rollCallList, setRollCallList] = useState<RollCallItem[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Initialize roll call roster whenever class or modal opens
  const openRollCallModal = () => {
    populateRollCall(rollCallClass);
    setIsRollCallOpen(true);
    setSaveSuccessMessage(null);
  };

  const populateRollCall = (cls: string) => {
    const classStudents = students.filter(s => s.standard === cls);
    if (classStudents.length > 0) {
      setRollCallList(classStudents.map((s, idx) => ({
        studentId: s.id,
        admissionNo: s.admissionNo,
        rollNo: idx + 1,
        studentName: s.name,
        standard: s.standard,
        parentPhone: s.parentPhone || schoolInfo.phone,
        status: 'Present',
        reason: '',
      })));
    } else {
      // Fallback if class has no students in context yet
      setRollCallList([
        {
          studentId: 'temp-1',
          admissionNo: 'WNS-2024-01',
          rollNo: 1,
          studentName: 'A. Kavin Kumar',
          standard: cls,
          parentPhone: '9840123456',
          status: 'Present',
          reason: '',
        },
        {
          studentId: 'temp-2',
          admissionNo: 'WNS-2024-02',
          rollNo: 2,
          studentName: 'S. Nithya Shree',
          standard: cls,
          parentPhone: '9840234567',
          status: 'Present',
          reason: '',
        },
        {
          studentId: 'temp-3',
          admissionNo: 'WNS-2024-03',
          rollNo: 3,
          studentName: 'M. Dhilip',
          standard: cls,
          parentPhone: '9840345678',
          status: 'Present',
          reason: '',
        },
      ]);
    }
  };

  const handleRollCallClassChange = (newCls: string) => {
    setRollCallClass(newCls);
    populateRollCall(newCls);
  };

  const markAllStatus = (status: 'Present' | 'Absent') => {
    setRollCallList(prev => prev.map(item => ({ ...item, status, reason: status === 'Present' ? '' : item.reason })));
  };

  const toggleStudentStatus = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setRollCallList(prev => prev.map(item => item.studentId === studentId ? { ...item, status } : item));
  };

  const updateStudentReason = (studentId: string, reason: string) => {
    setRollCallList(prev => prev.map(item => item.studentId === studentId ? { ...item, reason } : item));
  };

  const handleSaveRollCall = () => {
    const newRecords: DailyAttendanceDetail[] = rollCallList.map((item, idx) => ({
      id: `daily-${rollCallDate}-${item.admissionNo}-${Date.now() + idx}`,
      studentName: item.studentName,
      admissionNo: item.admissionNo,
      rollNo: item.rollNo,
      standard: item.standard,
      section: 'A',
      date: rollCallDate,
      status: item.status,
      reason: item.reason || (item.status === 'Present' ? 'Present on time' : 'Uninformed absence'),
      parentPhone: item.parentPhone,
      notifiedWhatsApp: false,
    }));

    // Prepend to daily records and update date filter
    setDailyRecords(prev => [...newRecords, ...prev.filter(r => !(r.date === rollCallDate && r.standard === rollCallClass))]);
    setSelectedDate(rollCallDate);
    setSelectedClass(rollCallClass);
    setSubTab('daily-detail');
    setSaveSuccessMessage(`Successfully saved attendance for ${rollCallList.length} students in ${rollCallClass} on ${rollCallDate}!`);
    setTimeout(() => {
      setIsRollCallOpen(false);
      setSaveSuccessMessage(null);
    }, 1500);
  };

  // Overall calculations
  const totalEnrolled = INITIAL_CLASS_ATTENDANCE.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalPresents = INITIAL_CLASS_ATTENDANCE.reduce((sum, c) => sum + c.totalPresentCount, 0);
  const totalAbsents = INITIAL_CLASS_ATTENDANCE.reduce((sum, c) => sum + c.totalAbsentCount, 0);
  const overallAttendancePercent = (totalPresents / (totalPresents + totalAbsents)) * 100;

  const staffPresentSum = INITIAL_STAFF_ATTENDANCE.reduce((sum, s) => sum + s.presentDays, 0);
  const staffWorkingSum = INITIAL_STAFF_ATTENDANCE.reduce((sum, s) => sum + s.workingDays, 0);
  const staffOverallPercent = (staffPresentSum / staffWorkingSum) * 100;

  // Filter daily detail
  const filteredDaily = dailyRecords.filter(r => {
    const matchClass = selectedClass === 'all' || r.standard === selectedClass;
    const matchDate = !selectedDate || r.date === selectedDate;
    return matchClass && matchDate;
  });

  const handleNotifyWhatsApp = (record: DailyAttendanceDetail) => {
    const text = `Dear Parent, This is an attendance notification from Wisdom Nursery and Primary School, Essur for ${record.studentName} (${record.standard}-${record.section}) on ${selectedDate}: Marked ${record.status.toUpperCase()}${record.reason ? ` (${record.reason})` : ''}. For queries contact office: ${schoolInfo.phone}.`;
    const url = `https://wa.me/91${cleanPhoneNumber(record.parentPhone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    setDailyRecords(prev => prev.map(item => item.id === record.id ? { ...item, notifiedWhatsApp: true } : item));
  };

  const handleBatchNotifyAbsentees = () => {
    const absentees = filteredDaily.filter(r => r.status !== 'Present' && !r.notifiedWhatsApp);
    if (absentees.length === 0) {
      alert('All absentees for this date/class have already been notified or there are no absentees!');
      return;
    }
    // Open first absentee and prompt
    handleNotifyWhatsApp(absentees[0]);
  };

  const handleExport = () => {
    if (subTab === 'student-summary') {
      const headers = ['Standard', 'Section', 'Class Teacher', 'Strength', 'Working Days', 'Presents', 'Absents', 'Attendance %', 'Boys %', 'Girls %'];
      const rows = INITIAL_CLASS_ATTENDANCE.map(c => [
        c.standard,
        c.section,
        `"${c.classTeacher}"`,
        c.totalStudents,
        c.workingDays,
        c.totalPresentCount,
        c.totalAbsentCount,
        `${c.attendancePercent.toFixed(1)}%`,
        `${c.boysPercent.toFixed(1)}%`,
        `${c.girlsPercent.toFixed(1)}%`,
      ]);
      onExportCsv('Student_Attendance_Summary_Report', headers, rows);
    } else if (subTab === 'staff-summary') {
      const headers = ['Employee Code', 'Staff Name', 'Designation', 'Working Days', 'Present Days', 'Leaves Taken', 'Half Days', 'Attendance %', 'Punctuality Rating'];
      const rows = INITIAL_STAFF_ATTENDANCE.map(s => [
        s.employeeCode,
        `"${s.name}"`,
        `"${s.designation}"`,
        s.workingDays,
        s.presentDays,
        s.leavesTaken,
        s.halfDays,
        `${s.attendancePercent.toFixed(1)}%`,
        s.punctualityScore,
      ]);
      onExportCsv('Staff_Attendance_Summary_Report', headers, rows);
    } else {
      const headers = ['Date', 'Standard', 'Roll No', 'Admission No', 'Student Name', 'Status', 'Reason', 'Parent Mobile', 'Notified'];
      const rows = filteredDaily.map(d => [
        d.date || selectedDate,
        `${d.standard}-${d.section}`,
        d.rollNo,
        d.admissionNo,
        `"${d.studentName}"`,
        d.status,
        `"${d.reason || 'Normal Attendance'}"`,
        d.parentPhone,
        d.notifiedWhatsApp ? 'Yes' : 'No',
      ]);
      onExportCsv(`Daily_Attendance_Detail_${selectedDate || 'Register'}`, headers, rows);
    }
  };

  const handleExportPdf = () => {
    if (subTab === 'student-summary') {
      const headers = ['Standard', 'Section', 'Teacher', 'Strength', 'Working Days', 'Presents', 'Absents', 'Attendance %'];
      const rows = INITIAL_CLASS_ATTENDANCE.map(c => [
        c.standard,
        c.section,
        c.classTeacher,
        c.totalStudents,
        c.workingDays,
        c.totalPresentCount,
        c.totalAbsentCount,
        `${c.attendancePercent.toFixed(1)}%`,
      ]);
      const doc = generateReportTablePdf('Student Attendance Summary', `Term Attendance Analysis ${schoolInfo.academicYear}`, headers, rows, schoolInfo);
      doc.save('Student_Attendance_Summary.pdf');
    } else if (subTab === 'staff-summary') {
      const headers = ['Emp Code', 'Staff Name', 'Designation', 'Working Days', 'Present', 'Leaves', 'Attendance %', 'Rating'];
      const rows = INITIAL_STAFF_ATTENDANCE.map(s => [
        s.employeeCode,
        s.name,
        s.designation,
        s.workingDays,
        s.presentDays,
        s.leavesTaken,
        `${s.attendancePercent.toFixed(1)}%`,
        s.punctualityScore,
      ]);
      const doc = generateReportTablePdf('Faculty & Staff Attendance Register', 'Staff Punctuality & Leave Ledger', headers, rows, schoolInfo);
      doc.save('Staff_Attendance_Register.pdf');
    } else {
      const headers = ['Date', 'Standard', 'Roll #', 'Adm #', 'Student Name', 'Status', 'Reason', 'Parent Mobile'];
      const rows = filteredDaily.map(d => [
        d.date || selectedDate,
        `${d.standard}-${d.section}`,
        d.rollNo,
        d.admissionNo,
        d.studentName,
        d.status,
        d.reason || 'Present on time',
        d.parentPhone,
      ]);
      const doc = generateReportTablePdf(`Daily Roll Call Register - ${selectedDate}`, `Class: ${selectedClass.toUpperCase()}`, headers, rows, schoolInfo);
      doc.save(`Daily_Attendance_Register_${selectedDate}.pdf`);
    }
  };

  const handleDeleteDailyRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this attendance record from the register?')) {
      setDailyRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSaveEditedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setDailyRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r));
    setEditingRecord(null);
  };

  // Roll call modal stats
  const rollCallPresents = rollCallList.filter(s => s.status === 'Present').length;
  const rollCallAbsents = rollCallList.filter(s => s.status === 'Absent').length;
  const rollCallLate = rollCallList.filter(s => s.status === 'Late').length;
  const rollCallPercent = rollCallList.length > 0 ? ((rollCallPresents / rollCallList.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector & Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-2 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('student-summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'student-summary' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Attendance Summary</span>
          </button>
          <button
            onClick={() => setSubTab('staff-summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'staff-summary' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Attendance Summary</span>
          </button>
          <button
            onClick={() => setSubTab('daily-detail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'daily-detail' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Detail Roster</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* New Interactive Feature: Take Attendance Button */}
          <button
            onClick={openRollCallModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Take Daily Roll Call</span>
          </button>

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
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Overall Student Attendance</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{overallAttendancePercent.toFixed(1)}%</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{totalEnrolled} Students Enrolled</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Staff Attendance Rate</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{staffOverallPercent.toFixed(1)}%</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{INITIAL_STAFF_ATTENDANCE.length} Faculty & Staff</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Top Performing Class</span>
          <span className="text-base font-extrabold text-[#2D312E] mt-0.5 block">5STD - A (98.0%)</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">R. Saravanan (Class Teacher)</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Academic Working Cycle</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">24 Working Days</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">Term 1 ({schoolInfo.academicYear})</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDENT ATTENDANCE SUMMARY                                             */}
      {/* ========================================================================= */}
      {subTab === 'student-summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4F6D7A]" />
                  Class-wise Student Attendance Summary & Analysis
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Monthly attendance percentages, gender ratios, consistent attenders, and leave patterns
                </p>
              </div>
              <button
                onClick={openRollCallModal}
                className="px-3 py-1 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Mark Attendance</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Class Teacher</th>
                    <th className="py-2.5 px-3 text-center">Strength</th>
                    <th className="py-2.5 px-3 text-center">Working Days</th>
                    <th className="py-2.5 px-3 text-center text-[#89A894]">Present</th>
                    <th className="py-2.5 px-3 text-center text-[#D68A6E]">Absent</th>
                    <th className="py-2.5 px-3 text-center">Attendance Rate</th>
                    <th className="py-2.5 px-3 text-center">Boys / Girls %</th>
                    <th className="py-2.5 px-3 text-center">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/70">
                  {INITIAL_CLASS_ATTENDANCE.map((c) => (
                    <tr key={c.standard} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#4F6D7A]">{c.standard} - {c.section}</td>
                      <td className="py-2.5 px-3 font-medium text-[#2D312E]">{c.classTeacher}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">{c.totalStudents}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{c.workingDays}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#89A894]">{c.totalPresentCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#D68A6E]">{c.totalAbsentCount}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          c.attendancePercent >= 95 ? 'bg-[#89A894]/20 text-[#2D312E]' : 'bg-[#D68A6E]/20 text-[#D68A6E]'
                        }`}>
                          {c.attendancePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">
                        {c.boysPercent.toFixed(0)}% / {c.girlsPercent.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {c.attendancePercent >= 95 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#89A894]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> High
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D68A6E]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Follow Up
                          </span>
                        )}
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
      {/* 2. STAFF ATTENDANCE SUMMARY                                               */}
      {/* ========================================================================= */}
      {subTab === 'staff-summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#4F6D7A]" />
                Faculty & Staff Attendance Register & Leave Balance
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Monthly duties attended, casual leave encashment, on-duty days, and punctuality audit
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Emp Code</th>
                    <th className="py-2.5 px-3">Staff Name</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-center">Total Working</th>
                    <th className="py-2.5 px-3 text-center text-[#89A894]">Days Present</th>
                    <th className="py-2.5 px-3 text-center text-[#D68A6E]">Leaves</th>
                    <th className="py-2.5 px-3 text-center">OD</th>
                    <th className="py-2.5 px-3 text-center">Attendance %</th>
                    <th className="py-2.5 px-3 text-center">Punctuality Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/70">
                  {INITIAL_STAFF_ATTENDANCE.map((s) => (
                    <tr key={s.staffId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{s.employeeCode}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{s.name}</td>
                      <td className="py-2.5 px-3 font-medium text-[#4F6D7A]">{s.designation}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{s.workingDays}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#89A894]">{s.presentDays}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#D68A6E]">{s.leavesTaken}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">{s.onDutyDays}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          s.attendancePercent === 100 ? 'bg-[#89A894]/20 text-[#2D312E]' : 'bg-[#4F6D7A]/15 text-[#4F6D7A]'
                        }`}>
                          {s.attendancePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.punctualityScore === 'Excellent' ? 'bg-[#89A894]/20 text-[#2D312E]' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <Award className="w-3 h-3" />
                          {s.punctualityScore}
                        </span>
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
      {/* 3. DAILY DETAIL ROSTER                                                    */}
      {/* ========================================================================= */}
      {subTab === 'daily-detail' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B7280] font-medium">Select Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B7280] font-medium">Standard:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-medium text-[#2D312E]"
                >
                  <option value="all">All Standards</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchNotifyAbsentees}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notify All Absentees</span>
              </button>

              <button
                onClick={openRollCallModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Mark Roll Call</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Roll #</th>
                    <th className="py-2.5 px-3">Adm #</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Remarks / Reason</th>
                    <th className="py-2.5 px-3">Parent Contact</th>
                    <th className="no-print py-2.5 px-3 text-center">Notification</th>
                    <th className="no-print py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredDaily.length > 0 ? (
                    filteredDaily.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{r.date || selectedDate}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#6B7280]">{r.rollNo}</td>
                        <td className="py-2.5 px-3 font-mono text-[#6B7280]">{r.admissionNo}</td>
                        <td className="py-2.5 px-3 font-bold text-[#2D312E]">{r.studentName}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{r.standard}{r.section ? `-${r.section}` : ''}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Present'
                              ? 'bg-[#89A894]/20 text-[#2D312E]'
                              : r.status === 'Absent'
                              ? 'bg-[#D68A6E]/20 text-[#D68A6E]'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.status === 'Present' && <CheckCircle2 className="w-3 h-3 text-[#89A894]" />}
                            {r.status === 'Absent' && <XCircle className="w-3 h-3 text-[#D68A6E]" />}
                            {r.status === 'Late' && <Clock className="w-3 h-3 text-amber-600" />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#6B7280]">{r.reason || 'Present on time'}</td>
                        <td className="py-2.5 px-3">
                          <a href={`tel:${r.parentPhone}`} className="text-[#4F6D7A] hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#89A894]" />
                            {r.parentPhone}
                          </a>
                        </td>
                        <td className="no-print py-2.5 px-3 text-center">
                          {r.status !== 'Present' ? (
                            <button
                              onClick={() => handleNotifyWhatsApp(r)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                                r.notifiedWhatsApp
                                  ? 'bg-gray-100 text-[#6B7280]'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>{r.notifiedWhatsApp ? 'Notified' : 'Send WhatsApp'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#6B7280]">Attended</span>
                          )}
                        </td>
                        <td className="no-print py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingRecord({ ...r })}
                              className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                              title="Edit Attendance Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDailyRecord(r.id)}
                              className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[#6B7280]">
                        No roll call recorded for {selectedClass === 'all' ? 'any class' : selectedClass} on {selectedDate}.
                        <button
                          onClick={openRollCallModal}
                          className="block mx-auto mt-2 text-xs font-bold text-[#4F6D7A] underline cursor-pointer"
                        >
                          Click here to mark roll call now
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ATTENDANCE RECORD MODAL                                              */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] overflow-hidden">
            <div className="bg-[#4F6D7A] px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Edit Attendance Entry</h3>
                <p className="text-[11px] text-white/80">
                  {editingRecord.studentName} ({editingRecord.standard} - Roll #{editingRecord.rollNo})
                </p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRecord} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Attendance Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Present', 'Absent', 'Late'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setEditingRecord(prev => prev ? { ...prev, status: st } : null)}
                      className={`py-2 text-center rounded-lg font-bold border transition-colors cursor-pointer ${
                        editingRecord.status === st
                          ? st === 'Present'
                            ? 'bg-[#89A894] text-white border-[#89A894]'
                            : st === 'Absent'
                            ? 'bg-[#D68A6E] text-white border-[#D68A6E]'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-[#F2F4F2] text-[#2D312E] border-[#E2E8E2]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Remarks / Reason for Absence or Late
                </label>
                <input
                  type="text"
                  value={editingRecord.reason || ''}
                  onChange={(e) => setEditingRecord(prev => prev ? { ...prev, reason: e.target.value } : null)}
                  placeholder="e.g., Fever, Family function, Bus missed"
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase mb-1">
                  Parent Contact Mobile
                </label>
                <input
                  type="text"
                  value={editingRecord.parentPhone || ''}
                  onChange={(e) => setEditingRecord(prev => prev ? { ...prev, parentPhone: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs font-semibold text-[#2D312E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-[#E2E8E2] rounded-lg text-xs font-bold text-[#6B7280] hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAKE DAILY ROLL CALL / ATTENDANCE MODAL                                   */}
      {/* ========================================================================= */}
      {isRollCallOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-[#E2E8E2]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2] rounded-t-2xl">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#4F6D7A]" />
                  Take Daily Roll Call & Attendance
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Wisdom Nursery & Primary School • Fast 1-Click Roll Call Marking
                </p>
              </div>

              <button
                onClick={() => setIsRollCallOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-[#E2E8E2] bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2D312E] w-20">Class:</span>
                <select
                  value={rollCallClass}
                  onChange={(e) => handleRollCallClassChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
                >
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-[#2D312E] w-20">Date:</span>
                <input
                  type="date"
                  value={rollCallDate}
                  onChange={(e) => setRollCallDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono font-medium text-[#2D312E]"
                />
              </div>

              {/* Quick Batch Actions */}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8E2]/60">
                <div className="flex items-center gap-2">
                  <span className="text-[#6B7280] font-medium">Quick Mark:</span>
                  <button
                    onClick={() => markAllStatus('Present')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200 cursor-pointer"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => markAllStatus('Absent')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-bold border border-rose-200 cursor-pointer"
                  >
                    All Absent
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-emerald-700 font-bold">Present: {rollCallPresents}</span>
                  <span>•</span>
                  <span className="text-rose-700 font-bold">Absent: {rollCallAbsents}</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">Late: {rollCallLate}</span>
                  <span>•</span>
                  <span className="text-[#4F6D7A] font-bold">Rate: {rollCallPercent}%</span>
                </div>
              </div>
            </div>

            {/* Notification alert banner */}
            {saveSuccessMessage && (
              <div className="bg-emerald-100 text-emerald-900 px-4 py-2 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                {saveSuccessMessage}
              </div>
            )}

            {/* Student Roll Call List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-[#E2E8E2]">
              {rollCallList.map((item) => (
                <div key={item.studentId} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F2F4F2] flex items-center justify-center font-mono font-bold text-[#6B7280] text-[11px]">
                      {item.rollNo}
                    </span>
                    <div>
                      <p className="font-bold text-[#2D312E]">{item.studentName}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono">{item.admissionNo} • Ph: {item.parentPhone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Buttons */}
                    <div className="flex bg-[#F2F4F2] p-0.5 rounded-lg border border-[#E2E8E2]">
                      <button
                        onClick={() => toggleStudentStatus(item.studentId, 'Present')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          item.status === 'Present'
                            ? 'bg-[#89A894] text-white shadow-2xs'
                            : 'text-[#2D312E] hover:bg-white/60'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => toggleStudentStatus(item.studentId, 'Absent')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          item.status === 'Absent'
                            ? 'bg-[#D68A6E] text-white shadow-2xs'
                            : 'text-[#2D312E] hover:bg-white/60'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => toggleStudentStatus(item.studentId, 'Late')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          item.status === 'Late'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-[#2D312E] hover:bg-white/60'
                        }`}
                      >
                        Late / Half Day
                      </button>
                    </div>

                    {/* Reason input if absent */}
                    {item.status !== 'Present' && (
                      <input
                        type="text"
                        placeholder="Reason (e.g. Fever, Leave)"
                        value={item.reason}
                        onChange={(e) => updateStudentReason(item.studentId, e.target.value)}
                        className="px-2 py-1 bg-[#FDFDFB] border border-[#E2E8E2] rounded text-xs w-36 text-[#2D312E]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8E2] bg-[#F2F4F2] rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setIsRollCallOpen(false)}
                className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveRollCall}
                className="flex items-center gap-2 px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Attendance & Update Register</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
