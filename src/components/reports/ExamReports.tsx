import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_EXAM_ANALYSIS, 
  INITIAL_TOPPERS,
  ClassExamAnalysis,
  ExamTopper 
} from '../../data/reportsData';
import { 
  FileText, 
  Trophy, 
  BarChart3, 
  Award, 
  Download, 
  Printer, 
  CheckCircle2, 
  Star, 
  Medal, 
  TrendingUp,
  Percent,
  GraduationCap,
  MessageSquare,
  Sparkles,
  User,
  Edit2,
  Trash2,
  Plus,
  X,
  Save
} from 'lucide-react';
import { cleanPhoneNumber } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';

interface ExamReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const ExamReports: React.FC<ExamReportsProps> = ({ onExportCsv }) => {
  const { students, schoolInfo, classList } = useSchool();

  const [subTab, setSubTab] = useState<'analysis' | 'performance' | 'toppers' | 'report-card'>('analysis');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1 / Quarterly Examination 2024');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Modifiable dataset states
  const [examAnalysis, setExamAnalysis] = useState<ClassExamAnalysis[]>(INITIAL_EXAM_ANALYSIS);
  const [toppers, setToppers] = useState<ExamTopper[]>(INITIAL_TOPPERS);

  // Modals / Edit states
  const [editingAnalysis, setEditingAnalysis] = useState<ClassExamAnalysis | null>(null);
  const [editingTopper, setEditingTopper] = useState<ExamTopper | null>(null);

  // Report Card Generator State
  const defaultStudent = students[0] || {
    id: 's-1',
    admissionNo: 'WNS-2024-001',
    name: 'S. Nithya Shree',
    standard: '1STD',
    parentName: 'M. Senthil Nathan',
    parentPhone: '9840234567',
    village: 'Essur',
    rteStudent: false,
    useVan: true,
  };

  const [selectedReportCardStudentId, setSelectedReportCardStudentId] = useState<string>(defaultStudent.id);
  const [reportCardTerm, setReportCardTerm] = useState<string>('Quarterly Examination 2024–25');

  const currentReportStudent = students.find(s => s.id === selectedReportCardStudentId) || defaultStudent;

  // Custom marks per student state
  const [studentMarksMap, setStudentMarksMap] = useState<Record<string, Array<{ subject: string; max: number; pass: number; scored: number; grade: string }>>>({});

  const defaultSampleMarks = [
    { subject: 'Tamil (Language 1)', max: 100, pass: 35, scored: 94, grade: 'A+' },
    { subject: 'English (Language 2)', max: 100, pass: 35, scored: 91, grade: 'A+' },
    { subject: 'Mathematics', max: 100, pass: 35, scored: 98, grade: 'O' },
    { subject: 'Environmental Studies / Science', max: 100, pass: 35, scored: 95, grade: 'O' },
    { subject: 'Social Science / General Studies', max: 100, pass: 35, scored: 88, grade: 'A' },
    { subject: 'Moral Science & Value Education', max: 50, pass: 18, scored: 49, grade: 'O' },
    { subject: 'General Knowledge & Current Affairs', max: 50, pass: 18, scored: 48, grade: 'O' },
  ];

  const currentMarks = studentMarksMap[currentReportStudent.id] || defaultSampleMarks;

  const [editingMarkIndex, setEditingMarkIndex] = useState<number | null>(null);
  const [editingMarkForm, setEditingMarkForm] = useState<{ subject: string; max: number; pass: number; scored: number; grade: string }>({
    subject: '',
    max: 100,
    pass: 35,
    scored: 0,
    grade: 'A',
  });
  const [isAddingMark, setIsAddingMark] = useState<boolean>(false);

  const totalScored = currentMarks.reduce((sum, m) => sum + m.scored, 0);
  const maxTotal = currentMarks.reduce((sum, m) => sum + m.max, 0);
  const overallPercentage = maxTotal > 0 ? ((totalScored / maxTotal) * 100).toFixed(1) : '0';

  // Overall aggregate stats
  const totalStudentsAppeared = examAnalysis.reduce((sum, c) => sum + c.totalAppeared, 0);
  const totalPassed = examAnalysis.reduce((sum, c) => sum + c.totalPassed, 0);
  const overallPassPercent = totalStudentsAppeared > 0 ? (totalPassed / totalStudentsAppeared) * 100 : 0;
  const totalDistinctions = examAnalysis.reduce((sum, c) => sum + c.distinctionCount, 0);
  const schoolAverage = examAnalysis.length > 0 
    ? (examAnalysis.reduce((sum, c) => sum + c.classAverageMarks, 0) / examAnalysis.length).toFixed(1) 
    : '0';

  // Filtered toppers
  const filteredToppers = toppers.filter(t => selectedClass === 'all' || t.standard === selectedClass);

  const handleExportPdf = () => {
    if (subTab === 'analysis') {
      const headers = ['Standard', 'Appeared', 'Passed', 'Pass %', 'Distinction', 'First Class', 'Second Class', 'Avg %', 'High %'];
      const rows = examAnalysis.map(c => [
        `${c.standard}-${c.section}`,
        c.totalAppeared,
        c.totalPassed,
        `${c.passPercentage}%`,
        c.distinctionCount,
        c.firstClassCount,
        c.secondClassCount,
        `${c.classAverageMarks}%`,
        `${c.highestClassScore}%`,
      ]);
      const doc = generateReportTablePdf('Class-Wise Examination Result Analysis', `Evaluation Term: ${selectedTerm}`, headers, rows, schoolInfo);
      doc.save('Exam_Result_Analysis.pdf');
    } else if (subTab === 'performance') {
      const headers = ['Standard', 'Exam Term', 'Class Average', 'Highest Score', 'Lowest Score', 'Pass Rate'];
      const rows = examAnalysis.map(c => [
        `${c.standard}-${c.section}`,
        c.examTerm,
        `${c.classAverageMarks}%`,
        `${c.highestClassScore}%`,
        `${c.lowestClassScore}%`,
        `${c.passPercentage}%`,
      ]);
      const doc = generateReportTablePdf('Scholastic Performance & Mastery Report', 'Class Evaluation Metrics', headers, rows, schoolInfo);
      doc.save('Class_Performance_Report.pdf');
    } else if (subTab === 'toppers') {
      const headers = ['Rank', 'Standard', 'Student Name', 'Admission No', 'Marks Scored', 'Max Marks', 'Percentage', 'Grade'];
      const rows = filteredToppers.map(t => [
        `Rank ${t.rank}`,
        `${t.standard}-${t.section}`,
        t.studentName,
        t.admissionNo,
        t.totalMarksScored,
        t.maxMarks,
        `${t.percentage}%`,
        t.grade,
      ]);
      const doc = generateReportTablePdf('Academic Honor Roll & Class Toppers', `Official Merit Register • ${selectedTerm}`, headers, rows, schoolInfo);
      doc.save('Academic_Toppers_Honor_Roll.pdf');
    } else {
      const headers = ['Subject / Learning Area', 'Max Marks', 'Pass Marks', 'Marks Obtained', 'Grade'];
      const rows = currentMarks.map(m => [
        m.subject,
        m.max,
        m.pass,
        m.scored,
        m.grade,
      ]);
      // Append summary rows
      rows.push(['Total Aggregate Marks', maxTotal, 176, totalScored, `${overallPercentage}%`]);
      const doc = generateReportTablePdf(
        `Progress Report Card: ${currentReportStudent.name}`,
        `Admission: ${currentReportStudent.admissionNo} • Class: ${currentReportStudent.standard} • ${reportCardTerm}`,
        headers,
        rows,
        schoolInfo
      );
      doc.save(`Report_Card_${currentReportStudent.admissionNo}.pdf`);
    }
  };

  const handleExport = () => {
    if (subTab === 'analysis') {
      const headers = ['Standard', 'Appeared', 'Passed', 'Pass %', 'Distinction (90%+)', 'First Class (75-89%)', 'Second Class (60-74%)', 'Class Average %', 'Highest Score'];
      const rows = examAnalysis.map(c => [
        `${c.standard}-${c.section}`,
        c.totalAppeared,
        c.totalPassed,
        `${c.passPercentage}%`,
        c.distinctionCount,
        c.firstClassCount,
        c.secondClassCount,
        `${c.classAverageMarks}%`,
        `${c.highestClassScore}%`,
      ]);
      onExportCsv('Exam_Result_Analysis_Report', headers, rows);
    } else if (subTab === 'performance') {
      const headers = ['Standard', 'Exam Term', 'Class Average', 'Highest Score', 'Lowest Score', 'Pass Rate', 'Subjects Tested'];
      const rows = examAnalysis.map(c => [
        `${c.standard}-${c.section}`,
        c.examTerm,
        `${c.classAverageMarks}%`,
        `${c.highestClassScore}%`,
        `${c.lowestClassScore}%`,
        `${c.passPercentage}%`,
        c.subjects.map(s => `${s.subject}: ${s.averageMarks}%`).join('; '),
      ]);
      onExportCsv('Class_Performance_Report', headers, rows);
    } else if (subTab === 'toppers') {
      const headers = ['Rank', 'Standard', 'Student Name', 'Admission No', 'Roll No', 'Marks Scored', 'Max Marks', 'Percentage', 'Grade', 'Parent Name'];
      const rows = filteredToppers.map(t => [
        `Rank ${t.rank}`,
        `${t.standard}-${t.section}`,
        `"${t.studentName}"`,
        t.admissionNo,
        t.rollNo,
        t.totalMarksScored,
        t.maxMarks,
        `${t.percentage}%`,
        t.grade,
        `"${t.parentName}"`,
      ]);
      onExportCsv('Exam_Toppers_Honor_Roll', headers, rows);
    } else {
      const headers = ['Subject', 'Max Marks', 'Pass Marks', 'Marks Scored', 'Grade'];
      const rows = currentMarks.map(m => [
        `"${m.subject}"`,
        m.max,
        m.pass,
        m.scored,
        m.grade
      ]);
      onExportCsv(`ReportCard_${currentReportStudent.admissionNo}_${reportCardTerm}`, headers, rows);
    }
  };

  const handleShareReportCardWhatsApp = () => {
    const text = `*WISDOM NURSERY & PRIMARY SCHOOL - ESSUR*\n*STUDENT PROGRESS REPORT CARD*\n\nStudent: *${currentReportStudent.name}*\nAdmission No: *${currentReportStudent.admissionNo}*\nStandard: *${currentReportStudent.standard}*\nExamination: *${reportCardTerm}*\n\n*Marks Statement:*\n` +
      currentMarks.map(m => `• ${m.subject}: ${m.scored}/${m.max} (${m.grade})`).join('\n') +
      `\n\n*Total Marks: ${totalScored}/${maxTotal} (${overallPercentage}%)*\n*Result: PASSED & PROMOTED*\n\nRemarks: Excellent academic performance and enthusiastic participation.\n\nPrincipal / Admin: ${schoolInfo.adminName} (Ph: ${schoolInfo.phone})`;

    const phone = currentReportStudent.parentPhone || schoolInfo.phone;
    const url = `https://wa.me/91${cleanPhoneNumber(phone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Handlers for deleting & editing Exam Analysis
  const handleDeleteAnalysis = (standard: string) => {
    if (window.confirm(`Are you sure you want to delete examination analysis for ${standard}?`)) {
      setExamAnalysis(prev => prev.filter(a => a.standard !== standard));
    }
  };

  const handleSaveAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnalysis) return;
    setExamAnalysis(prev => prev.map(a => a.standard === editingAnalysis.standard ? editingAnalysis : a));
    setEditingAnalysis(null);
  };

  // Handlers for deleting & editing Toppers
  const handleDeleteTopper = (admissionNo: string) => {
    if (window.confirm(`Are you sure you want to delete topper record for student (${admissionNo})?`)) {
      setToppers(prev => prev.filter(t => t.admissionNo !== admissionNo));
    }
  };

  const handleSaveTopper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopper) return;
    setToppers(prev => prev.map(t => t.admissionNo === editingTopper.admissionNo ? editingTopper : t));
    setEditingTopper(null);
  };

  // Handlers for marks in Report Card
  const handleDeleteMark = (index: number) => {
    if (window.confirm(`Delete subject mark row "${currentMarks[index].subject}"?`)) {
      const updated = currentMarks.filter((_, i) => i !== index);
      setStudentMarksMap(prev => ({ ...prev, [currentReportStudent.id]: updated }));
    }
  };

  const handleOpenEditMark = (index: number) => {
    setEditingMarkIndex(index);
    setEditingMarkForm({ ...currentMarks[index] });
    setIsAddingMark(false);
  };

  const handleSaveMark = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...currentMarks];
    if (isAddingMark) {
      updated.push({ ...editingMarkForm });
    } else if (editingMarkIndex !== null) {
      updated[editingMarkIndex] = { ...editingMarkForm };
    }
    setStudentMarksMap(prev => ({ ...prev, [currentReportStudent.id]: updated }));
    setEditingMarkIndex(null);
    setIsAddingMark(false);
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-2 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('analysis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'analysis' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Result Analysis</span>
          </button>
          <button
            onClick={() => setSubTab('performance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'performance' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Class Performance</span>
          </button>
          <button
            onClick={() => setSubTab('toppers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'toppers' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Topper List</span>
          </button>
          <button
            onClick={() => setSubTab('report-card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'report-card' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Report Card Generator</span>
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
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Overall Pass Percentage</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{overallPassPercent.toFixed(1)}%</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{totalPassed} of {totalStudentsAppeared} Students Passed</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Distinctions (90%+)</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{totalDistinctions} Students</span>
          <span className="text-[10px] text-[#4F6D7A] font-semibold mt-1 block">Honors Honor Roll</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">School Average Score</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">{schoolAverage}%</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">Quarterly Exam 2024</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">School Highest Score</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">98.8%</span>
          <span className="text-[10px] text-[#89A894] font-bold mt-1 block">M. Sneha (5STD)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RESULT ANALYSIS                                                        */}
      {/* ========================================================================= */}
      {subTab === 'analysis' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#4F6D7A]" />
                  Term-wise Examination Result Analysis & Grade Banding
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Class pass percentages, grade distributions (Distinction, 1st Class, 2nd Class), and score benchmarks
                </p>
              </div>

              <span className="text-xs font-bold text-[#4F6D7A] bg-[#4F6D7A]/10 px-2.5 py-1 rounded-md">
                Term: Quarterly 2024–25
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3 text-center">Appeared</th>
                    <th className="py-2.5 px-3 text-center text-[#89A894]">Passed</th>
                    <th className="py-2.5 px-3 text-center">Pass %</th>
                    <th className="py-2.5 px-3 text-center text-amber-700">Distinction (90%+)</th>
                    <th className="py-2.5 px-3 text-center text-[#4F6D7A]">First (75-89%)</th>
                    <th className="py-2.5 px-3 text-center">Second (60-74%)</th>
                    <th className="py-2.5 px-3 text-center">Class Avg</th>
                    <th className="py-2.5 px-3 text-center text-[#89A894]">High Score</th>
                    <th className="no-print py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/70">
                  {examAnalysis.map((c) => (
                    <tr key={c.standard} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#4F6D7A]">{c.standard} - {c.section}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{c.totalAppeared}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#89A894]">{c.totalPassed}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#89A894]/20 text-[#2D312E]">
                          {c.passPercentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-700">{c.distinctionCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#4F6D7A]">{c.firstClassCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#6B7280]">{c.secondClassCount}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#2D312E]">{c.classAverageMarks}%</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#89A894]">{c.highestClassScore}%</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingAnalysis({ ...c })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Result Analysis"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnalysis(c.standard)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Result Entry"
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
      {/* 2. CLASS PERFORMANCE                                                      */}
      {/* ========================================================================= */}
      {subTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2]">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#4F6D7A]" />
                Subject-wise Mastery & Performance Matrix
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Subject averages for Tamil, English, Mathematics, Science/EVS, Social Science, and Moral Science
              </p>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_EXAM_ANALYSIS.map((c) => (
                <div key={c.standard} className="p-4 rounded-xl border border-[#E2E8E2] bg-[#FDFDFB] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8E2]/60 pb-2">
                    <div>
                      <h4 className="font-bold text-xs text-[#2D312E]">{c.standard} - {c.section} Overall Class Performance</h4>
                      <p className="text-[10px] text-[#6B7280]">Pass Rate: <strong className="text-[#89A894]">{c.passPercentage}%</strong> • Highest: <strong>{c.highestClassScore}%</strong></p>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-[#4F6D7A]">{c.classAverageMarks}% Avg</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {c.subjects.map(s => (
                      <div key={s.subject} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-[#2D312E]">{s.subject}</span>
                          <span className="font-mono font-bold text-[#4F6D7A]">{s.averageMarks}%</span>
                        </div>
                        <div className="w-full bg-[#E2E8E2] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#4F6D7A] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(s.averageMarks, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOPPER LIST                                                            */}
      {/* ========================================================================= */}
      {subTab === 'toppers' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#6B7280] font-semibold">Filter Standard:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
              >
                <option value="all">All Standards (LKG to 5STD)</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <span className="text-xs text-[#6B7280]">
              Showing {filteredToppers.length} Honor Roll Students
            </span>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3 text-center">Rank</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Adm #</th>
                    <th className="py-2.5 px-3">Parent Name</th>
                    <th className="py-2.5 px-3 text-right">Marks Scored</th>
                    <th className="py-2.5 px-3 text-right">Percentage</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredToppers.map((t) => (
                    <tr key={`${t.standard}-${t.rank}-${t.admissionNo}`} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                          t.rank === 1 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : t.rank === 2
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : 'bg-orange-100 text-orange-900 border border-orange-300'
                        }`}>
                          {t.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#4F6D7A]">{t.standard}-{t.section}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E] flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {t.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{t.admissionNo}</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{t.parentName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2D312E]">
                        {t.totalMarksScored} / {t.maxMarks}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#89A894]">
                        {t.percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {t.grade}
                        </span>
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const found = students.find(s => s.admissionNo === t.admissionNo);
                              if (found) setSelectedReportCardStudentId(found.id);
                              setSubTab('report-card');
                            }}
                            className="px-2 py-1 bg-[#4F6D7A]/10 hover:bg-[#4F6D7A]/20 text-[#4F6D7A] font-bold rounded text-[11px] transition-colors cursor-pointer"
                          >
                            Card
                          </button>
                          <button
                            onClick={() => setEditingTopper({ ...t })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Topper Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopper(t.admissionNo)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Topper"
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
      {/* 4. STUDENT REPORT CARD GENERATOR & PRINTABLE SHEET                        */}
      {/* ========================================================================= */}
      {subTab === 'report-card' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="no-print bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] font-bold">Select Student:</span>
                <select
                  value={selectedReportCardStudentId}
                  onChange={(e) => setSelectedReportCardStudentId(e.target.value)}
                  className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#2D312E]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.standard} - {s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] font-bold">Exam Term:</span>
                <select
                  value={reportCardTerm}
                  onChange={(e) => setReportCardTerm(e.target.value)}
                  className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
                >
                  <option value="Quarterly Examination 2024–25">Quarterly Examination 2024–25</option>
                  <option value="Half Yearly Examination 2024–25">Half Yearly Examination 2024–25</option>
                  <option value="Annual Examination 2024–25">Annual Final Examination 2024–25</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareReportCardWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Send to Parent (WhatsApp)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Card</span>
              </button>
            </div>
          </div>

          {/* Printable Official Report Card Document */}
          <div className="printable-document bg-white border-2 border-[#2D312E] rounded-2xl p-6 shadow-md space-y-6">
            {/* School Crest & Header */}
            <div className="border-b-2 border-[#2D312E] pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={schoolInfo.logoUrl || '/school_logo.jpg'} 
                  alt="Wisdom School Seal" 
                  className="w-16 h-16 rounded-full border-2 border-[#D68A6E] object-cover" 
                />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-[#2D312E] font-serif">
                    {schoolInfo.name}
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    {schoolInfo.address} • Phone: {schoolInfo.phone}
                  </p>
                  <p className="text-xs font-bold text-[#4F6D7A] tracking-wider uppercase mt-0.5">
                    STUDENT PROGRESS REPORT & MARKS MEMORANDUM • {reportCardTerm}
                  </p>
                </div>
              </div>

              <div className="text-right border-l-2 border-[#E2E8E2] pl-4">
                <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Academic Year</span>
                <span className="font-mono font-extrabold text-sm text-[#2D312E]">{schoolInfo.academicYear}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold block mt-1">
                  Status: PROMOTED
                </span>
              </div>
            </div>

            {/* Student Biodata Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F7F8F6] p-3.5 rounded-xl border border-[#E2E8E2]">
              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-extrabold text-[#2D312E] text-sm">{currentReportStudent.name}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Admission Number</span>
                <span className="font-mono font-bold text-[#4F6D7A]">{currentReportStudent.admissionNo}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Standard & Section</span>
                <span className="font-bold text-[#2D312E]">{currentReportStudent.standard} - Section A</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Parent / Guardian</span>
                <span className="font-medium text-[#2D312E]">{currentReportStudent.parentName}</span>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D312E] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#4F6D7A]" />
                  1. Scholastic Academic Performance
                </h3>
                <button
                  onClick={() => {
                    setEditingMarkForm({ subject: '', max: 100, pass: 35, scored: 0, grade: 'A' });
                    setIsAddingMark(true);
                    setEditingMarkIndex(null);
                  }}
                  className="no-print flex items-center gap-1 px-2.5 py-1 bg-[#4F6D7A]/10 hover:bg-[#4F6D7A]/20 text-[#4F6D7A] font-bold rounded text-[11px] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Subject</span>
                </button>
              </div>

              <table className="w-full text-xs border border-[#2D312E]">
                <thead>
                  <tr className="bg-[#2D312E] text-white font-bold text-left">
                    <th className="p-2">Subject / Curricular Discipline</th>
                    <th className="p-2 text-center">Maximum Marks</th>
                    <th className="p-2 text-center">Passing Marks</th>
                    <th className="p-2 text-center">Marks Obtained</th>
                    <th className="p-2 text-center">Grade</th>
                    <th className="p-2 text-center">Evaluation</th>
                    <th className="no-print p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  {currentMarks.map((m, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FDFDFB]'}>
                      <td className="p-2 font-semibold text-[#2D312E]">{m.subject}</td>
                      <td className="p-2 text-center font-mono text-[#6B7280]">{m.max}</td>
                      <td className="p-2 text-center font-mono text-[#6B7280]">{m.pass}</td>
                      <td className="p-2 text-center font-mono font-bold text-[#2D312E]">{m.scored}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[10px] bg-[#89A894]/20 text-[#2D312E]">
                          {m.grade}
                        </span>
                      </td>
                      <td className="p-2 text-center font-medium text-[#89A894]">
                        {m.scored >= 90 ? 'Outstanding' : m.scored >= 75 ? 'Excellent' : 'Good'}
                      </td>
                      <td className="no-print p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditMark(idx)}
                            className="p-1 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded cursor-pointer transition-colors"
                            title="Edit Mark"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMark(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#F2F4F2] font-extrabold border-t-2 border-[#2D312E]">
                    <td className="p-2.5 uppercase text-[#2D312E]">Total Aggregate Marks</td>
                    <td className="p-2.5 text-center font-mono text-[#2D312E]">{maxTotal}</td>
                    <td className="p-2.5 text-center font-mono text-[#6B7280]">176</td>
                    <td className="p-2.5 text-center font-mono text-sm text-[#4F6D7A]">{totalScored}</td>
                    <td className="p-2.5 text-center font-mono text-sm text-[#89A894]">{overallPercentage}%</td>
                    <td className="p-2.5 text-center font-mono text-emerald-800">PASSED (FIRST CLASS)</td>
                    <td className="no-print p-2.5 text-center"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Co-Curricular & Personality Assessment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-[#E2E8E2] p-3 rounded-xl bg-[#FDFDFB]">
              <div className="text-center p-2 border-r border-[#E2E8E2]">
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Discipline & Conduct</span>
                <span className="font-extrabold text-[#2D312E] text-sm mt-1 block">A+ (Exemplary)</span>
              </div>
              <div className="text-center p-2 border-r border-[#E2E8E2]">
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Handwriting & Presentation</span>
                <span className="font-extrabold text-[#2D312E] text-sm mt-1 block">A (Neat & Legible)</span>
              </div>
              <div className="text-center p-2 border-r border-[#E2E8E2]">
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Sports & Physical Fitness</span>
                <span className="font-extrabold text-[#2D312E] text-sm mt-1 block">A+ (Active & Agile)</span>
              </div>
              <div className="text-center p-2">
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Attendance in Term</span>
                <span className="font-mono font-extrabold text-[#89A894] text-sm mt-1 block">96.5%</span>
              </div>
            </div>

            {/* Teacher Remarks & Recommendations */}
            <div className="p-3 bg-[#F2F4F2] rounded-xl border border-[#E2E8E2] text-xs">
              <span className="font-bold text-[#2D312E] block text-[11px] uppercase tracking-wider mb-1">
                Class Teacher Remarks & Learning Observations:
              </span>
              <p className="text-[#2D312E] italic">
                "{currentReportStudent.name} is an attentive, intellectually curious student who grasps foundational concepts swiftly. Demonstrates exceptional problem-solving acumen in Mathematics and expresses ideas fluently in English and Tamil. Encouraged to continue consistent daily reading."
              </p>
            </div>

            {/* Official Certification & Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-[#2D312E] text-xs">
              <div>
                <p className="text-[#6B7280] text-[10px] uppercase font-bold">Class Teacher</p>
                <p className="font-serif italic font-bold text-[#2D312E] mt-4">Mrs. K. Malathi, B.Ed</p>
                <p className="text-[10px] text-[#6B7280]">Wisdom Nursery & Primary</p>
              </div>

              <div className="text-center">
                <p className="text-[#6B7280] text-[10px] uppercase font-bold">Parent / Guardian Signature</p>
                <div className="h-6 mt-4 border-b border-dashed border-[#6B7280]"></div>
                <p className="text-[10px] text-[#6B7280] mt-1">Date: ________________</p>
              </div>

              <div className="text-right">
                <p className="text-[#6B7280] text-[10px] uppercase font-bold">Headmaster / Administrator</p>
                <p className="font-serif italic font-bold text-[#2D312E] mt-4 underline">R. Saravanan</p>
                <p className="text-[10px] text-[#6B7280]">Admin & Principal, Essur</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Class Result Analysis */}
      {editingAnalysis && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E2E8E2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#4F6D7A]" />
                Edit Class Result: {editingAnalysis.standard} - {editingAnalysis.section}
              </h3>
              <button
                onClick={() => setEditingAnalysis(null)}
                className="text-[#6B7280] hover:text-[#2D312E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnalysis} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Total Appeared</label>
                  <input
                    type="number"
                    min="1"
                    value={editingAnalysis.totalAppeared}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const passed = editingAnalysis.totalPassed;
                      const pct = val > 0 ? parseFloat(((passed / val) * 100).toFixed(1)) : 0;
                      setEditingAnalysis({
                        ...editingAnalysis,
                        totalAppeared: val,
                        passPercentage: pct,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Total Passed</label>
                  <input
                    type="number"
                    min="0"
                    max={editingAnalysis.totalAppeared}
                    value={editingAnalysis.totalPassed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const app = editingAnalysis.totalAppeared;
                      const pct = app > 0 ? parseFloat(((val / app) * 100).toFixed(1)) : 0;
                      setEditingAnalysis({
                        ...editingAnalysis,
                        totalPassed: val,
                        passPercentage: pct,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Distinction (90%+)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingAnalysis.distinctionCount}
                    onChange={(e) => setEditingAnalysis({ ...editingAnalysis, distinctionCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">First Class</label>
                  <input
                    type="number"
                    min="0"
                    value={editingAnalysis.firstClassCount}
                    onChange={(e) => setEditingAnalysis({ ...editingAnalysis, firstClassCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Second Class</label>
                  <input
                    type="number"
                    min="0"
                    value={editingAnalysis.secondClassCount}
                    onChange={(e) => setEditingAnalysis({ ...editingAnalysis, secondClassCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-2 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Class Average (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingAnalysis.classAverageMarks}
                    onChange={(e) => setEditingAnalysis({ ...editingAnalysis, classAverageMarks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Highest Score (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingAnalysis.highestClassScore}
                    onChange={(e) => setEditingAnalysis({ ...editingAnalysis, highestClassScore: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingAnalysis(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2D312E] font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Topper Record */}
      {editingTopper && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E2E8E2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Edit Topper: {editingTopper.studentName}
              </h3>
              <button
                onClick={() => setEditingTopper(null)}
                className="text-[#6B7280] hover:text-[#2D312E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopper} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Rank</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingTopper.rank}
                    onChange={(e) => setEditingTopper({ ...editingTopper, rank: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Grade</label>
                  <input
                    type="text"
                    value={editingTopper.grade}
                    onChange={(e) => setEditingTopper({ ...editingTopper, grade: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Marks Scored</label>
                  <input
                    type="number"
                    min="0"
                    value={editingTopper.totalMarksScored}
                    onChange={(e) => {
                      const scored = parseInt(e.target.value) || 0;
                      const max = editingTopper.maxMarks;
                      const pct = max > 0 ? parseFloat(((scored / max) * 100).toFixed(1)) : 0;
                      setEditingTopper({
                        ...editingTopper,
                        totalMarksScored: scored,
                        percentage: pct,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="100"
                    value={editingTopper.maxMarks}
                    onChange={(e) => {
                      const max = parseInt(e.target.value) || 100;
                      const scored = editingTopper.totalMarksScored;
                      const pct = max > 0 ? parseFloat(((scored / max) * 100).toFixed(1)) : 0;
                      setEditingTopper({
                        ...editingTopper,
                        maxMarks: max,
                        percentage: pct,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#6B7280] font-bold block mb-1">Percentage: {editingTopper.percentage}%</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => setEditingTopper(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2D312E] font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Topper</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Subject Mark */}
      {(editingMarkIndex !== null || isAddingMark) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E2E8E2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4F6D7A]" />
                {isAddingMark ? 'Add Subject Mark' : 'Edit Subject Mark'}
              </h3>
              <button
                onClick={() => {
                  setEditingMarkIndex(null);
                  setIsAddingMark(false);
                }}
                className="text-[#6B7280] hover:text-[#2D312E] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMark} className="space-y-3 text-xs">
              <div>
                <label className="text-[#6B7280] font-bold block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editingMarkForm.subject}
                  onChange={(e) => setEditingMarkForm({ ...editingMarkForm, subject: e.target.value })}
                  placeholder="e.g. Science / EVS"
                  className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="10"
                    value={editingMarkForm.max}
                    onChange={(e) => setEditingMarkForm({ ...editingMarkForm, max: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Pass Marks</label>
                  <input
                    type="number"
                    min="0"
                    value={editingMarkForm.pass}
                    onChange={(e) => setEditingMarkForm({ ...editingMarkForm, pass: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Marks Scored</label>
                  <input
                    type="number"
                    min="0"
                    max={editingMarkForm.max}
                    value={editingMarkForm.scored}
                    onChange={(e) => {
                      const scored = parseInt(e.target.value) || 0;
                      let grade = 'D';
                      const pct = editingMarkForm.max > 0 ? (scored / editingMarkForm.max) * 100 : 0;
                      if (pct >= 95) grade = 'O';
                      else if (pct >= 90) grade = 'A+';
                      else if (pct >= 80) grade = 'A';
                      else if (pct >= 70) grade = 'B+';
                      else if (pct >= 60) grade = 'B';
                      else if (pct >= 50) grade = 'C';
                      else if (pct >= 35) grade = 'P';
                      setEditingMarkForm({
                        ...editingMarkForm,
                        scored,
                        grade,
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] font-bold block mb-1">Grade</label>
                  <input
                    type="text"
                    value={editingMarkForm.grade}
                    onChange={(e) => setEditingMarkForm({ ...editingMarkForm, grade: e.target.value })}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMarkIndex(null);
                    setIsAddingMark(false);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#2D312E] font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Mark</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
