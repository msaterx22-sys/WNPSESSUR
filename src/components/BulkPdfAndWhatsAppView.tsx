import React, { useState, useMemo, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student, PaymentReceipt } from '../types';
import { formatCurrency, formatNumber, cleanPhoneNumber, generateUpiUrl } from '../utils/formatters';
import { 
  generateBulkFeeStatementsPdf, 
  generateBulkDemandNoticesPdf, 
  generateBulkIdCardsPdf,
  generateStudentFeeSlipPdf,
  StudentFeeSummary
} from '../utils/pdfGenerator';
import { 
  Printer, 
  Download, 
  Send, 
  MessageSquare, 
  Check, 
  Copy, 
  Search, 
  Filter, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  Bus, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  Users,
  Eye,
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';

export type BulkDocType = 'feecard' | 'demand_notice' | 'idcard' | 'van_pass';
export type WhatsAppCampaignTemplate = 'demand_notice' | 'urgent_overdue' | 'installment' | 'van_fee' | 'custom';

export const BulkPdfAndWhatsAppView: React.FC = () => {
  const { 
    students, 
    schoolInfo, 
    classList, 
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending, 
    getStudentReceipts 
  } = useSchool();

  // Primary Tab: 'pdf' | 'whatsapp'
  const [activeSubTab, setActiveSubTab] = useState<'pdf' | 'whatsapp'>('pdf');

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'urgent' | 'paid' | 'rte' | 'van'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Student IDs for bulk action
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => {
    // Default select students with pending dues
    return students.filter(s => (s.tuitionFee + (s.vanFee || 0) + (s.sportsFee || 0)) > 0).slice(0, 8).map(s => s.id);
  });

  // PDF settings
  const [docType, setDocType] = useState<BulkDocType>('feecard');
  const [previewStudentIndex, setPreviewStudentIndex] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // WhatsApp Campaign settings
  const [whatsappTemplate, setWhatsappTemplate] = useState<WhatsAppCampaignTemplate>('demand_notice');
  const [paymentDeadline, setPaymentDeadline] = useState('Within 5 Days');
  const [includeUpiDirectLink, setIncludeUpiDirectLink] = useState(true);
  const [includeTamilNote, setIncludeTamilNote] = useState(true);
  const [customMsgText, setCustomMsgText] = useState('');

  // WhatsApp Dispatcher Queue State
  const [queueStatus, setQueueStatus] = useState<Record<string, 'pending' | 'sent' | 'skipped'>>({});
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Filter students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.standard === selectedClass;
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentPhone.includes(searchQuery) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());

      const pending = getStudentPending(s);

      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = pending > 0;
      else if (statusFilter === 'urgent') matchesStatus = pending >= 8000;
      else if (statusFilter === 'paid') matchesStatus = pending <= 0;
      else if (statusFilter === 'rte') matchesStatus = !!s.isRte;
      else if (statusFilter === 'van') matchesStatus = !!s.vanFacility;

      return matchesClass && matchesSearch && matchesStatus;
    });
  }, [students, selectedClass, searchQuery, statusFilter, getStudentPending]);

  // Selected students array
  const selectedStudents = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Total pending amount for selected students
  const totalSelectedPending = useMemo(() => {
    return selectedStudents.reduce((sum, s) => sum + getStudentPending(s), 0);
  }, [selectedStudents, getStudentPending]);

  // Helper to build student fee summary
  const getFeeSummary = (student: Student): StudentFeeSummary => {
    return {
      totalFee: getStudentTotalFee(student),
      totalPaid: getStudentTotalPaid(student.id),
      pendingFee: getStudentPending(student),
      receipts: getStudentReceipts(student.id),
    };
  };

  // Selection handlers
  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    const filteredSet = new Set(filteredStudents.map(s => s.id));
    setSelectedStudentIds(selectedStudentIds.filter(id => !filteredSet.has(id)));
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Browser Bulk Print Handler
  const handleBrowserBulkPrint = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to print.');
      return;
    }
    window.print();
  };

  // Download Merged Multi-Page PDF
  const handleDownloadBulkPdf = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to generate PDF.');
      return;
    }

    setIsGeneratingPdf(true);
    setDownloadSuccessMsg(null);

    // Allow UI to render loading state
    setTimeout(() => {
      try {
        let doc;
        let filename = '';

        if (docType === 'feecard') {
          doc = generateBulkFeeStatementsPdf(selectedStudents, schoolInfo, getFeeSummary, paymentDeadline);
          filename = `Wisdom_School_Fee_Cards_Bulk_${selectedStudents.length}_Students.pdf`;
        } else if (docType === 'demand_notice') {
          doc = generateBulkDemandNoticesPdf(selectedStudents, schoolInfo, getFeeSummary, paymentDeadline);
          filename = `Wisdom_School_Fee_Demand_Notices_Bulk_${selectedStudents.length}_Students.pdf`;
        } else if (docType === 'idcard') {
          doc = generateBulkIdCardsPdf(selectedStudents, schoolInfo);
          filename = `Wisdom_School_ID_Cards_Bulk_${selectedStudents.length}_Students.pdf`;
        } else {
          doc = generateBulkDemandNoticesPdf(selectedStudents, schoolInfo, getFeeSummary, paymentDeadline);
          filename = `Wisdom_School_Transport_Passes_Bulk.pdf`;
        }

        doc.save(filename);
        setDownloadSuccessMsg(`Successfully generated and downloaded ${filename}!`);
        setTimeout(() => setDownloadSuccessMsg(null), 5000);
      } catch (err) {
        console.error('PDF Generation failed:', err);
        alert('Could not generate PDF. Please use the Print option as a fallback.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  // Download Single Student PDF
  const handleDownloadSinglePdf = (student: Student) => {
    const summary = getFeeSummary(student);
    const doc = generateStudentFeeSlipPdf(student, schoolInfo, summary, paymentDeadline);
    doc.save(`Wisdom_FeeSlip_${student.standard}_${student.admissionNo}_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Download all selected individual slips sequentially
  const handleDownloadAllIndividualPdfs = () => {
    if (selectedStudents.length === 0) return;
    if (selectedStudents.length > 25) {
      if (!confirm(`You have selected ${selectedStudents.length} students. This will trigger ${selectedStudents.length} separate file downloads. For large batches, 'Download Merged PDF' is recommended. Do you want to continue?`)) {
        return;
      }
    }

    selectedStudents.forEach((student, index) => {
      setTimeout(() => {
        handleDownloadSinglePdf(student);
      }, index * 300);
    });
  };

  // Generate WhatsApp text for a student
  const buildStudentWhatsAppMessage = (student: Student): string => {
    const summary = getFeeSummary(student);
    const upiLink = includeUpiDirectLink ? `\n📲 *Direct Tap-to-Pay Link (Mobile UPI):*\n${generateUpiUrl(schoolInfo, summary.pendingFee, student.name)}\n` : '';
    const tamilClosing = includeTamilNote 
      ? `\n-----------------------------------------\nவணக்கம்! தங்களின் குழந்தையின் பள்ளி கட்டண நிலுவையை குறிப்பிட்ட காலத்திற்குள் செலுத்தி ஒத்துழைக்குமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.\n-----------------------------------------`
      : '';

    if (whatsappTemplate === 'custom' && customMsgText.trim()) {
      return customMsgText
        .replace(/{student_name}/g, student.name)
        .replace(/{parent_name}/g, student.parentName)
        .replace(/{standard}/g, student.standard)
        .replace(/{pending}/g, `₹${formatNumber(summary.pendingFee)}`)
        .replace(/{upi}/g, schoolInfo.upiId);
    }

    if (whatsappTemplate === 'urgent_overdue') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
🚨 *URGENT: CRITICAL FEE OVERDUE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
This is an urgent official notice regarding pending academic fees for your ward:

👤 *Student:* ${student.name}
🏷️ *Class:* ${student.standard} - ${student.section}
🆔 *Admission No:* ${student.admissionNo}

📊 *Total Annual Fee:* ₹${formatNumber(summary.totalFee)}
✅ *Paid to Date:* ₹${formatNumber(summary.totalPaid)}
🔴 *CRITICAL OVERDUE AMOUNT:* *₹${formatNumber(summary.pendingFee)}*
⏰ *Settlement Due By:* *${paymentDeadline}*

⚠️ Please settle this balance at your earliest convenience to avoid any academic disruption.

💳 *Pay via UPI / Google Pay:*
*UPI ID:* ${schoolInfo.upiId}
*GPay Mobile:* ${schoolInfo.gpayPhone}${upiLink}
(Share payment screenshot for instant receipt generation)

Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})${tamilClosing}`;
    }

    if (whatsappTemplate === 'van_fee') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
🚌 *SCHOOL VAN TRANSPORT FEE DUE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
The school van transportation charges for *${student.name}* (${student.standard}) are pending:

*Route:* ${student.vanRoute || 'Essur Main Route'}
*Total Outstanding:* *₹${formatNumber(summary.pendingFee)}*
*Due Date:* *${paymentDeadline}*

Kindly clear via Google Pay / UPI or at the school office:
*UPI ID:* ${schoolInfo.upiId} (${schoolInfo.gpayPhone})${upiLink}

Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})${tamilClosing}`;
    }

    // Default: Formal Demand Notice
    return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
📋 *OFFICIAL SCHOOL FEE PAYMENT NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
Greetings from Wisdom Nursery and Primary School, Essur.

Please find the current fee account status for your child:
*Student Name:* ${student.name}
*Class & Sec:* ${student.standard} - ${student.section}
*Admission No:* ${student.admissionNo}

📊 *Total Annual Fee:* ₹${formatNumber(summary.totalFee)}
✅ *Total Paid Till Date:* ₹${formatNumber(summary.totalPaid)}
🔴 *Pending Balance Due:* *₹${formatNumber(summary.pendingFee)}*
⏰ *Payment Due By:* *${paymentDeadline}*

📄 *Official Digital Fee Slip:*
You can view & verify your ward's fee statement directly at our office.

💳 *Google Pay / PhonePe UPI:*
*UPI ID:* ${schoolInfo.upiId}
*Mobile:* ${schoolInfo.gpayPhone}${upiLink}

Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})${tamilClosing}`;
  };

  // Open WhatsApp for a student in queue
  const handleSendQueueWhatsApp = (student: Student, index: number) => {
    const text = buildStudentWhatsAppMessage(student);
    const phone = cleanPhoneNumber(student.whatsappNumber || student.parentPhone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');

    setQueueStatus(prev => ({ ...prev, [student.id]: 'sent' }));

    if (autoAdvance && index < selectedStudents.length - 1) {
      setCurrentQueueIndex(index + 1);
    }
  };

  const handleSkipQueue = (student: Student, index: number) => {
    setQueueStatus(prev => ({ ...prev, [student.id]: 'skipped' }));
    if (index < selectedStudents.length - 1) {
      setCurrentQueueIndex(index + 1);
    }
  };

  const handleCopyMessage = (student: Student, index: number) => {
    const text = buildStudentWhatsAppMessage(student);
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const activePreviewStudent = selectedStudents[previewStudentIndex] || selectedStudents[0] || students[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="no-print bg-white p-5 rounded-2xl border border-[#E2E8E2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#4F6D7A]/10 border border-[#4F6D7A]/20 flex items-center justify-center text-[#4F6D7A] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-[#2D312E] tracking-tight">
                Bulk PDF Printing & WhatsApp Center
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#89A894]/20 text-[#4F6D7A] border border-[#89A894]/30">
                Official Hub
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Batch generate multi-page PDF statements, print official demand slips, and run automated WhatsApp parent broadcasts.
            </p>
          </div>
        </div>

        {/* Primary Sub-Tab Switcher */}
        <div className="flex items-center bg-[#F2F4F2] p-1 rounded-xl border border-[#E2E8E2] self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('pdf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'pdf' 
                ? 'bg-white text-[#2D312E] shadow-xs border border-[#E2E8E2]' 
                : 'text-[#6B7280] hover:text-[#2D312E]'
            }`}
          >
            <Printer className="w-4 h-4 text-[#4F6D7A]" />
            <span>Bulk PDF & Print</span>
          </button>
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'whatsapp' 
                ? 'bg-white text-[#2D312E] shadow-xs border border-[#E2E8E2]' 
                : 'text-[#6B7280] hover:text-[#2D312E]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#89A894]" />
            <span>Bulk Parents WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Global Filter & Selection Toolbar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search student, parent, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden focus:ring-1 focus:ring-[#89A894]"
              />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-1.5 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-bold outline-hidden"
            >
              <option value="all">All Standards ({classList.length} Classes)</option>
              {classList.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>

            {/* Dues Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-bold outline-hidden"
            >
              <option value="pending">Pending Dues Only</option>
              <option value="urgent">Urgent Overdue (&ge; ₹8,000)</option>
              <option value="all">All Registered Students</option>
              <option value="paid">Fully Paid Students</option>
              <option value="rte">RTE 25% Quota Students</option>
              <option value="van">Van Enrolled Students</option>
            </select>
          </div>

          {/* Selection Actions & Quick Stats */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded-lg border border-[#E2E8E2] transition-colors cursor-pointer"
            >
              Select All Visible ({filteredStudents.length})
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-[#6B7280] hover:text-[#2D312E] font-medium rounded-lg border border-[#E2E8E2] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Selected Counter Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#E2E8E2]/60 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#2D312E] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#4F6D7A]" />
              Selected: <strong className="text-[#4F6D7A] font-mono text-sm">{selectedStudents.length}</strong> of {students.length} Students
            </span>
            <span className="text-[#6B7280]">|</span>
            <span className="text-[#6B7280]">
              Cumulative Dues: <strong className="text-rose-600 font-mono font-bold text-sm">{formatCurrency(totalSelectedPending)}</strong>
            </span>
          </div>

          {selectedStudents.length === 0 && (
            <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Please select students below to activate bulk operations.
            </span>
          )}
        </div>
      </div>

      {downloadSuccessMsg && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {downloadSuccessMsg}
          </span>
          <button onClick={() => setDownloadSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* SUB-TAB 1: BULK PDF PRINT & DOWNLOAD */}
      {activeSubTab === 'pdf' && (
        <div className="space-y-6">
          
          {/* Controls Bar for Document Type & Download Buttons */}
          <div className="no-print bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] block mb-1">
                  Step 1: Choose Printable Document Format
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDocType('feecard')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      docType === 'feecard'
                        ? 'bg-[#4F6D7A] text-white border-[#4F6D7A] shadow-xs'
                        : 'bg-[#FDFDFB] text-[#2D312E] border-[#E2E8E2] hover:bg-[#F2F4F2]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Fee Card & Ledger</span>
                  </button>

                  <button
                    onClick={() => setDocType('demand_notice')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      docType === 'demand_notice'
                        ? 'bg-[#4F6D7A] text-white border-[#4F6D7A] shadow-xs'
                        : 'bg-[#FDFDFB] text-[#2D312E] border-[#E2E8E2] hover:bg-[#F2F4F2]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Formal Demand Notice / Reminder</span>
                  </button>

                  <button
                    onClick={() => setDocType('idcard')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      docType === 'idcard'
                        ? 'bg-[#4F6D7A] text-white border-[#4F6D7A] shadow-xs'
                        : 'bg-[#FDFDFB] text-[#2D312E] border-[#E2E8E2] hover:bg-[#F2F4F2]'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Student ID Badges (Sheet of 4)</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleBrowserBulkPrint}
                  disabled={selectedStudents.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2D312E] hover:bg-[#1F2220] disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                  title="Print all selected student documents or Save as PDF via browser dialog"
                >
                  <Printer className="w-4 h-4 text-[#89A894]" />
                  <span>Print Selected ({selectedStudents.length})</span>
                </button>

                <button
                  onClick={handleDownloadBulkPdf}
                  disabled={selectedStudents.length === 0 || isGeneratingPdf}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4F6D7A] hover:bg-[#415A65] disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                  title="Generate and download a single merged .pdf file containing all selected students"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingPdf ? 'Generating PDF...' : `Download Merged PDF (${selectedStudents.length})`}
                  </span>
                </button>

                <button
                  onClick={handleDownloadAllIndividualPdfs}
                  disabled={selectedStudents.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded-lg text-xs border border-[#E2E8E2] transition-colors cursor-pointer"
                  title="Download separate PDF files for each student"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#4F6D7A]" />
                  <span>Download Individual PDFs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Student Selection List & Live Document Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Student Checkbox Selection List (4 cols) */}
            <div className="no-print lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs flex flex-col max-h-[750px]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]/70 mb-3">
                <span className="text-xs font-bold text-[#2D312E] uppercase">
                  Select Target Students ({filteredStudents.length})
                </span>
                <span className="text-[11px] font-mono text-[#6B7280]">
                  {selectedStudentIds.length} Checked
                </span>
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {filteredStudents.map((student, idx) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  const pending = getStudentPending(student);
                  const isPreviewing = activePreviewStudent?.id === student.id;

                  return (
                    <div
                      key={student.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                        isChecked 
                          ? 'bg-[#F2F4F2]/70 border-[#89A894]/50' 
                          : 'bg-[#FDFDFB] border-[#E2E8E2] opacity-80'
                      } ${isPreviewing ? 'ring-2 ring-[#4F6D7A]' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStudent(student.id)}
                          className="w-4 h-4 rounded text-[#4F6D7A] focus:ring-[#89A894] border-[#E2E8E2] cursor-pointer"
                        />
                        <div 
                          className="cursor-pointer min-w-0"
                          onClick={() => {
                            const foundIndex = selectedStudents.findIndex(s => s.id === student.id);
                            if (foundIndex >= 0) setPreviewStudentIndex(foundIndex);
                          }}
                        >
                          <div className="font-bold text-[#2D312E] truncate flex items-center gap-1.5">
                            <span>{student.name}</span>
                            <span className="text-[10px] font-normal text-[#6B7280]">({student.standard}-{student.section})</span>
                          </div>
                          <div className="text-[11px] text-[#6B7280] truncate font-mono">
                            {student.admissionNo} • {student.parentPhone}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className={`font-mono font-bold block ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {pending > 0 ? formatCurrency(pending) : 'PAID'}
                          </span>
                          <span className="text-[10px] text-[#6B7280] block">
                            {pending > 0 ? 'due' : 'cleared'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePdf(student)}
                          className="p-1.5 text-[#6B7280] hover:text-[#4F6D7A] hover:bg-white rounded border border-transparent hover:border-[#E2E8E2] transition-colors cursor-pointer"
                          title="Download individual PDF for this student"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Document Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#4F6D7A]" />
                  <span className="font-bold text-[#2D312E]">
                    Print Preview (Showing {previewStudentIndex + 1} of {selectedStudents.length || 1})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={previewStudentIndex <= 0}
                    onClick={() => setPreviewStudentIndex(prev => Math.max(0, prev - 1))}
                    className="p-1 text-[#6B7280] hover:text-[#2D312E] disabled:opacity-30 rounded border border-[#E2E8E2] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono px-2 font-semibold text-[#2D312E]">
                    {selectedStudents.length > 0 ? `${previewStudentIndex + 1} / ${selectedStudents.length}` : '0 / 0'}
                  </span>
                  <button
                    disabled={previewStudentIndex >= selectedStudents.length - 1}
                    onClick={() => setPreviewStudentIndex(prev => Math.min(selectedStudents.length - 1, prev + 1))}
                    className="p-1 text-[#6B7280] hover:text-[#2D312E] disabled:opacity-30 rounded border border-[#E2E8E2] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Canvas Card Preview */}
              {activePreviewStudent ? (
                <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 shadow-xs min-h-[580px]">
                  {docType === 'feecard' && (
                    <FeeCardPreviewCard 
                      student={activePreviewStudent} 
                      school={schoolInfo} 
                      summary={getFeeSummary(activePreviewStudent)} 
                    />
                  )}

                  {docType === 'demand_notice' && (
                    <DemandNoticePreviewCard 
                      student={activePreviewStudent} 
                      school={schoolInfo} 
                      summary={getFeeSummary(activePreviewStudent)} 
                      dueDate={paymentDeadline}
                    />
                  )}

                  {docType === 'idcard' && (
                    <IdCardPreviewCard 
                      student={activePreviewStudent} 
                      school={schoolInfo} 
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8E2] rounded-xl p-12 text-center text-[#6B7280] text-xs">
                  No students selected. Check one or more students from the left column to view print preview.
                </div>
              )}
            </div>
          </div>

          {/* HIDDEN PRINT CONTAINER: Rendered strictly when window.print() is called */}
          <div className="hidden print:block space-y-8">
            {selectedStudents.map((student, idx) => (
              <div key={student.id} className="page-break" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                {docType === 'feecard' && (
                  <FeeCardPreviewCard 
                    student={student} 
                    school={schoolInfo} 
                    summary={getFeeSummary(student)} 
                  />
                )}
                {docType === 'demand_notice' && (
                  <DemandNoticePreviewCard 
                    student={student} 
                    school={schoolInfo} 
                    summary={getFeeSummary(student)} 
                    dueDate={paymentDeadline}
                  />
                )}
                {docType === 'idcard' && (
                  <IdCardPreviewCard 
                    student={student} 
                    school={schoolInfo} 
                  />
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: BULK PARENTS WHATSAPP DISPATCHER */}
      {activeSubTab === 'whatsapp' && (
        <div className="space-y-6">
          
          {/* Campaign Setup Panel */}
          <div className="no-print bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E8E2]/70 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#89A894]" />
                  Parents WhatsApp Campaign Configuration
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Send official fee reminder notices with UPI tap-to-pay links & digital fee statement verification.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#2D312E]">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] border-[#E2E8E2]"
                  />
                  <span>Auto-Advance to Next Parent</span>
                </label>
              </div>
            </div>

            {/* Template Selector & Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Message Template</label>
                <select
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value as any)}
                  className="w-full py-2 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden"
                >
                  <option value="demand_notice">Official Fee Payment Notice</option>
                  <option value="urgent_overdue">Urgent Overdue Notice (&gt; ₹8,000)</option>
                  <option value="van_fee">Van Transport Fee Notice</option>
                  <option value="custom">Custom Customized Template</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Payment Deadline</label>
                <input
                  type="text"
                  value={paymentDeadline}
                  onChange={(e) => setPaymentDeadline(e.target.value)}
                  placeholder="e.g. Within 5 Days or 15-Sept"
                  className="w-full py-1.5 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden"
                />
              </div>

              <div className="flex flex-col justify-center space-y-1.5 pt-2 sm:pt-0">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#2D312E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUpiDirectLink}
                    onChange={(e) => setIncludeUpiDirectLink(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] border-[#E2E8E2]"
                  />
                  <span>Include UPI Tap-to-Pay Link</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#2D312E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTamilNote}
                    onChange={(e) => setIncludeTamilNote(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] border-[#E2E8E2]"
                  />
                  <span>Include Tamil Courtesy Note</span>
                </label>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleDownloadAllIndividualPdfs}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded-lg text-xs border border-[#E2E8E2] transition-colors cursor-pointer"
                  title="Download all selected PDF slips so you can drag and attach into WhatsApp Web"
                >
                  <Download className="w-4 h-4 text-[#4F6D7A]" />
                  <span>Download Slips First</span>
                </button>
              </div>
            </div>

            {whatsappTemplate === 'custom' && (
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-[#2D312E]">Custom WhatsApp Body</label>
                <textarea
                  rows={4}
                  value={customMsgText}
                  onChange={(e) => setCustomMsgText(e.target.value)}
                  placeholder="Type message here. Use placeholders: {student_name}, {parent_name}, {standard}, {pending}, {upi}"
                  className="w-full p-2.5 border border-[#E2E8E2] rounded-lg bg-white font-mono text-xs text-[#2D312E] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>
            )}
          </div>

          {/* Queue Progress Bar */}
          <div className="no-print bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 flex-1 max-w-md">
              <div className="flex justify-between font-bold text-[#2D312E]">
                <span>Broadcast Progress</span>
                <span className="font-mono">
                  {Object.values(queueStatus).filter(s => s === 'sent').length} / {selectedStudents.length} Sent
                </span>
              </div>
              <div className="w-full bg-[#E2E8E2] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#89A894] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${selectedStudents.length > 0 ? (Object.values(queueStatus).filter(s => s === 'sent').length / selectedStudents.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQueueStatus({})}
                className="px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#6B7280] hover:text-[#2D312E] rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Status</span>
              </button>

              {selectedStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const current = selectedStudents[currentQueueIndex] || selectedStudents[0];
                    if (current) handleSendQueueWhatsApp(current, currentQueueIndex);
                  }}
                  className="px-4 py-1.5 bg-[#89A894] hover:bg-[#72927D] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Send Next Parent (#{currentQueueIndex + 1})</span>
                </button>
              )}
            </div>
          </div>

          {/* Parent Dispatch Queue Table */}
          <div className="no-print bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D312E] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4F6D7A]" />
                Selected Recipients Queue ({selectedStudents.length})
              </h3>
              <span className="text-[11px] text-[#6B7280]">
                Click WhatsApp button to dispatch with prefilled message
              </span>
            </div>

            <div className="divide-y divide-[#E2E8E2]/60 overflow-x-auto text-xs">
              {selectedStudents.length === 0 ? (
                <div className="p-8 text-center text-[#6B7280]">
                  No students currently selected in the top filter bar.
                </div>
              ) : (
                selectedStudents.map((student, idx) => {
                  const pending = getStudentPending(student);
                  const isCurrent = idx === currentQueueIndex;
                  const status = queueStatus[student.id] || 'pending';

                  return (
                    <div 
                      key={student.id}
                      className={`p-3.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                        isCurrent ? 'bg-[#F2F4F2]' : 'hover:bg-[#FDFDFB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="w-6 h-6 rounded-full bg-[#E2E8E2] text-[#2D312E] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-[#2D312E] flex items-center gap-1.5">
                            <span>{student.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-[#4F6D7A] font-bold">
                              Class {student.standard}-{student.section}
                            </span>
                          </div>
                          <div className="text-[#6B7280] text-[11px]">
                            Parent: <strong className="text-[#2D312E]">{student.parentName}</strong> • {student.parentPhone}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-mono font-bold text-rose-600 block">
                          {formatCurrency(pending)}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">
                          pending due
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="w-24">
                        {status === 'sent' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            Sent
                          </span>
                        )}
                        {status === 'skipped' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7280] bg-neutral-100 px-2.5 py-1 rounded-full border border-[#E2E8E2]">
                            Skipped
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F6D7A] bg-[#4F6D7A]/10 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePdf(student)}
                          className="p-1.5 text-[#4F6D7A] hover:bg-[#4F6D7A]/10 rounded border border-[#E2E8E2] transition-colors cursor-pointer"
                          title="Download individual PDF fee slip to attach in chat"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(student, idx)}
                          className="p-1.5 text-[#6B7280] hover:text-[#2D312E] hover:bg-neutral-100 rounded border border-[#E2E8E2] transition-colors cursor-pointer"
                          title="Copy personalized message text to clipboard"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSkipQueue(student, idx)}
                          className="px-2.5 py-1.5 text-[#6B7280] hover:text-[#2D312E] hover:bg-neutral-100 rounded border border-[#E2E8E2] font-medium transition-colors cursor-pointer"
                        >
                          Skip
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendQueueWhatsApp(student, idx)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#89A894] hover:bg-[#72927D] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

// --------------------------------------------------------------------------
// PRINT PREVIEW COMPONENTS (Clean HTML renderings matching PDF documents)
// --------------------------------------------------------------------------

interface PreviewProps {
  student: Student;
  school: any;
  summary: StudentFeeSummary;
  dueDate?: string;
}

const FeeCardPreviewCard: React.FC<PreviewProps> = ({ student, school, summary }) => {
  return (
    <div className="border border-[#4F6D7A]/40 rounded-xl p-6 bg-white text-[#2D312E] space-y-5">
      {/* Top Banner */}
      <div className="bg-[#2D312E] text-white p-4 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold tracking-wide uppercase">{school.name}</h2>
          <p className="text-xs text-[#D68A6E] font-medium">{school.address} • Ph: {school.phone}</p>
          <p className="text-[11px] text-neutral-300">Official Student Cum Academic Fee Ledger • 2024-2025</p>
        </div>
        <div className="text-right text-[11px] text-neutral-300">
          <span className="font-mono block">{student.admissionNo}</span>
          <span>Class: <strong>{student.standard}-{student.section}</strong></span>
        </div>
      </div>

      {/* Student Details Box */}
      <div className="grid grid-cols-2 gap-4 bg-[#F2F4F2] p-4 rounded-lg text-xs border border-[#E2E8E2]">
        <div>
          <p className="text-[#6B7280]">Student Name: <strong className="text-[#2D312E]">{student.name}</strong></p>
          <p className="text-[#6B7280]">Admission No: <strong className="font-mono text-[#2D312E]">{student.admissionNo}</strong></p>
          <p className="text-[#6B7280]">Standard: <strong className="text-[#2D312E]">Class {student.standard} (Sec {student.section})</strong></p>
        </div>
        <div>
          <p className="text-[#6B7280]">Parent / Guardian: <strong className="text-[#2D312E]">{student.parentName}</strong></p>
          <p className="text-[#6B7280]">Emergency Phone: <strong className="font-mono text-[#2D312E]">{student.parentPhone}</strong></p>
          <p className="text-[#6B7280]">Quota / Category: <strong className="text-[#4F6D7A]">{student.isRte ? 'RTE 25% Free Seat Scheme' : 'General'}</strong></p>
        </div>
      </div>

      {/* Financial Overview Tiles */}
      <div className="grid grid-cols-3 gap-3 text-xs text-center font-mono">
        <div className="p-3 bg-[#F2F4F2] rounded-lg border border-[#E2E8E2]">
          <span className="text-[10px] text-[#6B7280] block uppercase font-sans font-bold">Total Annual Fee</span>
          <span className="text-base font-extrabold text-[#2D312E]">{formatCurrency(summary.totalFee)}</span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="text-[10px] text-emerald-800 block uppercase font-sans font-bold">Total Paid Till Date</span>
          <span className="text-base font-extrabold text-emerald-700">{formatCurrency(summary.totalPaid)}</span>
        </div>
        <div className={`p-3 rounded-lg border ${summary.pendingFee > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className="text-[10px] block uppercase font-sans font-bold text-[#6B7280]">Pending Balance</span>
          <span className={`text-base font-extrabold ${summary.pendingFee > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatCurrency(summary.pendingFee)}
          </span>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D312E]">
          Receipts Issued & Installments
        </h4>
        <table className="w-full text-xs border border-[#E2E8E2]">
          <thead>
            <tr className="bg-[#F2F4F2] text-[#4F6D7A] border-b border-[#E2E8E2]">
              <th className="p-2 text-left">Receipt No</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Payment Mode</th>
              <th className="p-2 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8E2]">
            {summary.receipts.length > 0 ? (
              summary.receipts.map(rc => (
                <tr key={rc.id}>
                  <td className="p-2 font-mono font-bold text-[#4F6D7A]">{rc.receiptNumber}</td>
                  <td className="p-2 text-[#2D312E]">{rc.date}</td>
                  <td className="p-2 text-[#6B7280]">{rc.paymentMode}</td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatCurrency(rc.amountPaid)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-3 text-center text-[#6B7280] italic">
                  No payment vouchers registered to date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Signatures */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E2E8E2] text-xs text-[#6B7280]">
        <span>Parent / Guardian Signature</span>
        <span className="font-bold text-[#4F6D7A]">[ OFFICIAL SEAL ]</span>
        <span className="font-bold text-[#2D312E]">Headmaster: {school.adminName}</span>
      </div>
    </div>
  );
};

const DemandNoticePreviewCard: React.FC<PreviewProps> = ({ student, school, summary, dueDate }) => {
  return (
    <div className="border-2 border-[#D68A6E] rounded-xl p-6 bg-white text-[#2D312E] space-y-5">
      {/* Letterhead */}
      <div className="bg-[#2D312E] text-white p-4 rounded-lg text-center space-y-1">
        <h2 className="text-base font-black tracking-wide uppercase">{school.name}</h2>
        <p className="text-xs text-[#D68A6E]">{school.address} • Ph: {school.phone}</p>
        <p className="text-[11px] text-neutral-300">Office Administrator: {school.adminName}</p>
      </div>

      <div className="bg-rose-600 text-white text-xs font-bold text-center py-2 rounded">
        OFFICIAL DEMAND NOTICE: OUTSTANDING SCHOOL FEE SETTLEMENT
      </div>

      <div className="flex justify-between text-xs text-[#6B7280]">
        <span>Ref: WNS/NOTICE/2024/{student.admissionNo}</span>
        <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
      </div>

      <div className="text-xs space-y-1 bg-[#F2F4F2] p-3 rounded border border-[#E2E8E2]">
        <p><strong>To:</strong> Thiru / Tmt. {student.parentName}</p>
        <p>Parent of: <strong>{student.name}</strong> (Class {student.standard}-{student.section})</p>
        <p>Admission No: <span className="font-mono">{student.admissionNo}</span> • Mobile: {student.parentPhone}</p>
      </div>

      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2">
        <p className="font-bold text-rose-800">FEE AUDIT SUMMARY:</p>
        <div className="flex justify-between">
          <span>Total Prescribed Fee:</span>
          <strong className="font-mono">{formatCurrency(summary.totalFee)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid to Date:</span>
          <strong className="font-mono text-emerald-700">{formatCurrency(summary.totalPaid)}</strong>
        </div>
        <div className="flex justify-between border-t border-rose-200 pt-1 text-sm">
          <span className="font-bold text-rose-800">PENDING BALANCE DUE:</span>
          <strong className="font-mono text-rose-700 text-base">{formatCurrency(summary.pendingFee)}</strong>
        </div>
        <p className="text-[11px] text-rose-800 font-semibold pt-1">
          Settlement Deadline: {dueDate || 'Within 5 Days'}
        </p>
      </div>

      <div className="bg-[#F2F4F2] p-3 rounded text-xs space-y-1 text-[#2D312E] border border-[#E2E8E2]">
        <p className="font-bold text-[#4F6D7A]">Modes of Payment:</p>
        <p>• Google Pay / PhonePe UPI: <span className="font-mono font-bold text-[#D68A6E]">{school.upiId}</span></p>
        <p>• Official GPay Registered Mobile: <span className="font-mono font-bold">{school.gpayPhone}</span></p>
        <p>• School Office Cash Counter: Essur (9:00 AM - 4:30 PM)</p>
      </div>

      <div className="flex justify-between pt-6 border-t border-[#E2E8E2] text-xs">
        <span className="text-[#6B7280]">Parent Acknowledgment</span>
        <span className="font-bold text-[#2D312E]">Admin: {school.adminName}</span>
      </div>
    </div>
  );
};

const IdCardPreviewCard: React.FC<{ student: Student; school: any }> = ({ student, school }) => {
  return (
    <div className="max-w-xs mx-auto border-2 border-[#4F6D7A] rounded-2xl overflow-hidden bg-white shadow-md text-xs">
      <div className="bg-[#2D312E] text-white p-3 text-center">
        <h3 className="font-black text-xs uppercase tracking-wide">{school.name}</h3>
        <p className="text-[10px] text-[#D68A6E]">Essur - 603301 • ID CARD</p>
      </div>

      <div className="p-4 flex flex-col items-center space-y-3">
        <div className="w-20 h-20 rounded-xl bg-[#F2F4F2] border-2 border-[#4F6D7A] overflow-hidden flex items-center justify-center">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-[#6B7280]">NO PHOTO</span>
          )}
        </div>

        <div className="text-center">
          <h4 className="font-black text-sm text-[#2D312E] uppercase">{student.name}</h4>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#4F6D7A] text-white text-[10px] font-bold">
            Class {student.standard} - Sec {student.section}
          </span>
        </div>

        <div className="w-full space-y-1 text-[11px] text-[#6B7280] border-t border-[#E2E8E2] pt-2">
          <p>Admission No: <strong className="text-[#2D312E] font-mono">{student.admissionNo}</strong></p>
          <p>Parent: <strong className="text-[#2D312E]">{student.parentName}</strong></p>
          <p>Phone: <strong className="text-[#2D312E] font-mono">{student.parentPhone}</strong></p>
          <p>Blood Group: <strong className="text-[#D68A6E]">{student.bloodGroup || 'O+ve'}</strong></p>
          <p>Van Pass: <strong className="text-[#2D312E]">{student.vanFacility ? 'Enrolled' : 'No'}</strong></p>
        </div>
      </div>

      <div className="bg-[#F2F4F2] p-2 text-center text-[10px] text-[#6B7280] border-t border-[#E2E8E2]">
        Principal / Office Sign: {school.adminName}
      </div>
    </div>
  );
};
