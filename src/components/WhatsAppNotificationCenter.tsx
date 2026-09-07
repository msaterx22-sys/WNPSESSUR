import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';
import { formatCurrency, formatNumber, cleanPhoneNumber, generateUpiUrl } from '../utils/formatters';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  Copy, 
  Check, 
  AlertTriangle, 
  Bus, 
  Trophy, 
  FileText,
  Search,
  Sparkles,
  Sliders,
  Settings2,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Play,
  X,
  ShieldAlert,
  HelpCircle,
  Layers,
  Printer
} from 'lucide-react';

export type TemplateMode = 
  | 'auto_by_balance' 
  | 'tier_urgent' 
  | 'tier_installment' 
  | 'tier_minor' 
  | 'van_fee' 
  | 'sports_fee' 
  | 'custom';

export type BalanceFilter = 'all' | 'urgent' | 'installment' | 'minor';

interface SentRecord {
  timestamp: string;
  template: string;
}

export const WhatsAppNotificationCenter: React.FC = () => {
  const { 
    students, 
    schoolInfo, 
    classList, 
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending,
    setActiveTab
  } = useSchool();

  // Configuration thresholds (persisted in localStorage)
  const [highDueThreshold, setHighDueThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('wisdom_whatsapp_high_threshold');
    return saved ? Number(saved) : 10000;
  });

  const [minorDueThreshold, setMinorDueThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('wisdom_whatsapp_minor_threshold');
    return saved ? Number(saved) : 3000;
  });

  const [dueDatePreset, setDueDatePreset] = useState<string>(() => {
    return localStorage.getItem('wisdom_whatsapp_due_date') || 'Within 5 days';
  });

  const [includeUpiLink, setIncludeUpiLink] = useState<boolean>(() => {
    const saved = localStorage.getItem('wisdom_whatsapp_include_upi');
    return saved !== null ? saved === 'true' : true;
  });

  const [includeTamilNote, setIncludeTamilNote] = useState<boolean>(() => {
    const saved = localStorage.getItem('wisdom_whatsapp_include_tamil');
    return saved !== null ? saved === 'true' : true;
  });

  // Filters & selection state
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'tuition' | 'van' | 'sports'>('all');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templateMode, setTemplateMode] = useState<TemplateMode>('auto_by_balance');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isDispatchWizardOpen, setIsDispatchWizardOpen] = useState(false);
  const [wizardCurrentIndex, setWizardCurrentIndex] = useState(0);

  // Sent tracking history (persisted)
  const [sentHistory, setSentHistory] = useState<Record<string, SentRecord>>(() => {
    try {
      const saved = localStorage.getItem('wisdom_whatsapp_sent_history');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Helper to determine balance tier for a student
  const getStudentBalanceTier = (student: Student, pending: number): 'urgent' | 'installment' | 'minor' | 'cleared' => {
    if (pending <= 0) return 'cleared';
    if (pending >= highDueThreshold) return 'urgent';
    if (pending >= minorDueThreshold) return 'installment';
    return 'minor';
  };

  // Filtered target students list
  const targetStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass === 'all' || s.standard === selectedClass;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentPhone.includes(searchQuery) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());

      const pending = getStudentPending(s);
      
      // Must have pending dues to appear in reminders
      if (pending <= 0) return false;

      // Facility filter
      let matchesFacility = true;
      if (facilityFilter === 'tuition') matchesFacility = pending > 0;
      if (facilityFilter === 'van') matchesFacility = s.vanFacility && pending > 0;
      if (facilityFilter === 'sports') matchesFacility = s.sportsFacility && pending > 0;

      // Balance tier filter
      let matchesBalance = true;
      const tier = getStudentBalanceTier(s, pending);
      if (balanceFilter === 'urgent') matchesBalance = tier === 'urgent';
      if (balanceFilter === 'installment') matchesBalance = tier === 'installment';
      if (balanceFilter === 'minor') matchesBalance = tier === 'minor';

      return matchesClass && matchesSearch && matchesFacility && matchesBalance;
    });
  }, [students, selectedClass, searchQuery, facilityFilter, balanceFilter, highDueThreshold, minorDueThreshold]);

  // Balance tier counts and totals across all students with pending dues
  const tierStats = useMemo(() => {
    let urgentCount = 0;
    let urgentTotal = 0;
    let installmentCount = 0;
    let installmentTotal = 0;
    let minorCount = 0;
    let minorTotal = 0;
    let totalPending = 0;

    students.forEach(s => {
      const pending = getStudentPending(s);
      if (pending > 0) {
        totalPending += pending;
        const tier = getStudentBalanceTier(s, pending);
        if (tier === 'urgent') {
          urgentCount++;
          urgentTotal += pending;
        } else if (tier === 'installment') {
          installmentCount++;
          installmentTotal += pending;
        } else {
          minorCount++;
          minorTotal += pending;
        }
      }
    });

    return {
      allCount: urgentCount + installmentCount + minorCount,
      totalPending,
      urgentCount,
      urgentTotal,
      installmentCount,
      installmentTotal,
      minorCount,
      minorTotal,
    };
  }, [students, highDueThreshold, minorDueThreshold]);

  // Selected student for preview (defaults to first in list or previously selected)
  const currentPreviewStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = students.find(s => s.id === selectedStudentId);
      if (found) return found;
    }
    return targetStudents[0] || students[0] || null;
  }, [selectedStudentId, targetStudents, students]);

  // Resolve which template tier should be applied for a specific student
  const getResolvedTier = (student: Student): 'urgent' | 'installment' | 'minor' | 'van' | 'sports' | 'custom' => {
    if (templateMode === 'custom') return 'custom';
    if (templateMode === 'van_fee') return 'van';
    if (templateMode === 'sports_fee') return 'sports';
    if (templateMode === 'tier_urgent') return 'urgent';
    if (templateMode === 'tier_installment') return 'installment';
    if (templateMode === 'tier_minor') return 'minor';

    // In 'auto_by_balance' mode: automatically decide based on balance
    const pending = getStudentPending(student);
    const tier = getStudentBalanceTier(student, pending);
    if (tier === 'urgent') return 'urgent';
    if (tier === 'installment') return 'installment';
    return 'minor';
  };

  // Generate automated message content based on student and resolved template
  const generateMessageText = (student: Student): string => {
    const total = getStudentTotalFee(student);
    const paid = getStudentTotalPaid(student.id);
    const pending = getStudentPending(student);
    const resolvedTier = getResolvedTier(student);

    if (resolvedTier === 'custom') {
      return customMessage || `Dear Parent (${student.parentName}),\nGreetings from ${schoolInfo.name}, Essur.\nPlease clear the pending fee of ₹${formatNumber(pending)} for ${student.name} (${student.standard}).\nUPI: ${schoolInfo.upiId}\nAdmin: ${schoolInfo.adminName} (${schoolInfo.phone})`;
    }

    // Direct UPI payment link parameter
    const upiDirectLink = includeUpiLink
      ? `\n📲 *Direct Tap-to-Pay Link (Mobile UPI):*\n${generateUpiUrl(schoolInfo, pending, student.name)}\n`
      : '';

    // Tamil courtesy closing note
    const tamilClosing = includeTamilNote
      ? `\n-----------------------------------------\nவணக்கம்! தங்களின் குழந்தையின் பள்ளி கட்டண நிலுவையை குறிப்பிட்ட காலத்திற்குள் செலுத்தி ஒத்துழைக்குமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.\n-----------------------------------------`
      : '';

    // 1. Van transport fee reminder
    if (resolvedTier === 'van') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
🚌 *SCHOOL VAN TRANSPORT FEE DUE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
Van transportation charges for *${student.name}* (${student.standard} - ${student.section}) are currently pending:

*Van Route / Pickup:* ${student.vanRoute || 'Essur Main Route'}
*Monthly/Term Van Fee:* ₹${formatNumber(student.vanFee || 1500)}
*Total Balance Outstanding:* *₹${formatNumber(pending)}*
*Payment Due By:* *${dueDatePreset}*

Kindly clear this at the school office or via Google Pay / UPI to ensure uninterrupted van boarding service for your child.

💳 *Pay via UPI / Google Pay:*
*UPI ID:* ${schoolInfo.upiId}
*GPay Mobile:* ${schoolInfo.gpayPhone}${upiDirectLink}
(Kindly share transaction screenshot after paying)

Admin: ${schoolInfo.adminName} (${schoolInfo.phone})${tamilClosing}`;
    }

    // 2. Sports & kit fee reminder
    if (resolvedTier === 'sports') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
🏆 *ANNUAL SPORTS & ACTIVITIES FEE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
The annual sports kit and activities fee for *${student.name}* (${student.standard} - ${student.section}) is pending:

*Sports Fee Due:* *₹${formatNumber(student.sportsFee || 1200)}*
*Total Student Balance:* *₹${formatNumber(pending)}*
*Due By:* *${dueDatePreset}*

Kindly arrange payment to ensure participation in the upcoming athletic events and physical education programs.

*UPI GPay ID:* ${schoolInfo.upiId} (${schoolInfo.gpayPhone})${upiDirectLink}
Office: ${schoolInfo.adminName} (${schoolInfo.phone})${tamilClosing}`;
    }

    // 3. TIER URGENT: Critical overdue notice for large pending balances (> threshold)
    if (resolvedTier === 'urgent') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
🚨 *URGENT: CRITICAL FEE OVERDUE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
This is an urgent and important official communication from Wisdom Nursery and Primary School regarding the outstanding academic fees for your child:

👤 *Student:* ${student.name}
🏷️ *Class & Sec:* ${student.standard} - ${student.section}
🆔 *Admission No:* ${student.admissionNo}

📊 *Total Prescribed Annual Fee:* ₹${formatNumber(total)}
✅ *Amount Paid to Date:* ₹${formatNumber(paid)}
🔴 *CRITICAL OVERDUE BALANCE:* *₹${formatNumber(pending)}*
⏰ *Settlement Due By:* *${dueDatePreset}*

⚠️ As this outstanding balance significantly exceeds the academic term threshold, we request you to arrange immediate settlement. Timely fee clearance is necessary for upcoming terminal examinations and academic record verification.

💳 *Instant Payment via Google Pay / PhonePe / UPI:*
*UPI ID:* ${schoolInfo.upiId}
*GPay Mobile:* ${schoolInfo.gpayPhone}${upiDirectLink}
(Please WhatsApp payment screenshot / UTR number once paid for instant receipt generation)

For installment arrangements or office consultation, please contact:
Office Admin: *${schoolInfo.adminName}* (${schoolInfo.phone})${tamilClosing}`;
    }

    // 4. TIER INSTALLMENT: Term installment reminder (moderate balances)
    if (resolvedTier === 'installment') {
      return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
📋 *ACADEMIC TERM INSTALLMENT DUE NOTICE*
-----------------------------------------
Dear Parent (${student.parentName}),
Greetings from Wisdom Nursery and Primary School. Thank you for your continued partnership in your child's education.

This is a reminder regarding the scheduled academic fee installment for:

👤 *Student:* ${student.name}
🏷️ *Class & Sec:* ${student.standard} - ${student.section}
🆔 *Admission No:* ${student.admissionNo}

📊 *Total Annual Academic Fee:* ₹${formatNumber(total)}
✅ *Amount Paid Till Date:* ₹${formatNumber(paid)}
🟡 *Current Term Balance Due:* *₹${formatNumber(pending)}*
📅 *Payment Due Date:* *${dueDatePreset}*

Kindly arrange to clear this installment at your earliest convenience to facilitate timely study materials and term exam preparations.

💳 *Fast Payment via UPI / Google Pay:*
*UPI ID:* ${schoolInfo.upiId}
*GPay Mobile:* ${schoolInfo.gpayPhone}${upiDirectLink}
(Please share transaction confirmation once completed)

Thank you,
*${schoolInfo.adminName}* (Office Admin)
Ph: ${schoolInfo.phone}${tamilClosing}`;
    }

    // 5. TIER MINOR: Courtesy reminder for small residual balances
    return `🏫 *${schoolInfo.name.toUpperCase()}*
📍 ${schoolInfo.address}
📞 Office Admin: ${schoolInfo.adminName} (${schoolInfo.phone})
-----------------------------------------
💬 *FEE ACCOUNT BALANCE CLEARANCE*
-----------------------------------------
Dear Parent (${student.parentName}),
Greetings from Wisdom School Office. We thank you for making regular fee payments for *${student.name}* (${student.standard} - ${student.section}).

A minor residual balance of *₹${formatNumber(pending)}* remains outstanding on the student fee card:

🔹 *Current Outstanding Balance:* *₹${formatNumber(pending)}*
📅 *Kindly Clear By:* *${dueDatePreset}*

We request you to kindly clear this nominal remaining balance at the school office or via Google Pay to bring the account to complete zero-balance status.

💳 *Quick UPI / GPay:*
*UPI ID:* ${schoolInfo.upiId}
*GPay:* ${schoolInfo.gpayPhone}${upiDirectLink}

Thank you for your prompt cooperation!
Office Admin: *${schoolInfo.adminName}* (${schoolInfo.phone})${tamilClosing}`;
  };

  // Record dispatch and open WhatsApp
  const handleSendWhatsApp = (student: Student) => {
    const text = generateMessageText(student);
    const phone = cleanPhoneNumber(student.whatsappNumber || student.parentPhone);
    const resolvedTier = getResolvedTier(student);
    
    // Save to sent history
    const updated = {
      ...sentHistory,
      [student.id]: {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        template: resolvedTier,
      }
    };
    setSentHistory(updated);
    try {
      localStorage.setItem('wisdom_whatsapp_sent_history', JSON.stringify(updated));
    } catch {
      // ignore
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copy formatted text of preview student
  const handleCopyMessage = (student: Student) => {
    const text = generateMessageText(student);
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Copy all phone numbers of filtered list
  const handleCopyNumbers = () => {
    const numbers = targetStudents
      .map(s => cleanPhoneNumber(s.whatsappNumber || s.parentPhone))
      .filter(Boolean)
      .join(', ');
    navigator.clipboard.writeText(numbers);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 2000);
  };

  // Save configuration modal changes
  const handleSaveConfig = () => {
    localStorage.setItem('wisdom_whatsapp_high_threshold', highDueThreshold.toString());
    localStorage.setItem('wisdom_whatsapp_minor_threshold', minorDueThreshold.toString());
    localStorage.setItem('wisdom_whatsapp_due_date', dueDatePreset);
    localStorage.setItem('wisdom_whatsapp_include_upi', includeUpiLink.toString());
    localStorage.setItem('wisdom_whatsapp_include_tamil', includeTamilNote.toString());
    setShowConfigModal(false);
  };

  // Reset sent tracking history
  const handleClearSentHistory = () => {
    if (window.confirm('Reset the sent reminders tracking history for this session?')) {
      setSentHistory({});
      localStorage.removeItem('wisdom_whatsapp_sent_history');
    }
  };

  // Guided sequential dispatch wizard actions
  const activeWizardStudent = targetStudents[wizardCurrentIndex] || null;

  const handleStartWizard = () => {
    if (targetStudents.length === 0) return;
    setWizardCurrentIndex(0);
    setIsDispatchWizardOpen(true);
  };

  const handleWizardSendAndNext = () => {
    if (!activeWizardStudent) return;
    handleSendWhatsApp(activeWizardStudent);
    if (wizardCurrentIndex < targetStudents.length - 1) {
      setWizardCurrentIndex(prev => prev + 1);
    } else {
      setTimeout(() => setIsDispatchWizardOpen(false), 500);
    }
  };

  const handleWizardSkip = () => {
    if (wizardCurrentIndex < targetStudents.length - 1) {
      setWizardCurrentIndex(prev => prev + 1);
    } else {
      setIsDispatchWizardOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Deck */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#89A894]/20 text-[#4F6D7A] rounded-lg border border-[#89A894]/30">
                <MessageSquare className="w-5 h-5 text-[#4F6D7A]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
                  WhatsApp Fee Reminder Center
                  <span className="text-[11px] font-bold text-[#4F6D7A] bg-[#4F6D7A]/10 px-2.5 py-0.5 rounded-full border border-[#4F6D7A]/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#4F6D7A]" />
                    Balance-Adaptive Automation
                  </span>
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Automated payment reminder templates dynamically tailored to each parent's exact pending fee balance
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('bulk')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D312E] hover:bg-[#1F2220] text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
              title="Batch generate PDFs and execute automated bulk WhatsApp queue dispatch"
            >
              <Printer className="w-3.5 h-3.5 text-[#89A894]" />
              <span>Bulk PDF & WhatsApp Hub</span>
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded-lg text-xs transition-colors border border-[#E2E8E2] cursor-pointer"
              title="Configure balance thresholds and payment deadlines"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#4F6D7A]" />
              <span>Thresholds & Due Date</span>
            </button>

            <button
              onClick={handleCopyNumbers}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded-lg text-xs transition-colors border border-[#E2E8E2] cursor-pointer"
              title="Copy phone numbers of all filtered parents"
            >
              {copiedNumbers ? <Check className="w-3.5 h-3.5 text-[#89A894]" /> : <Copy className="w-3.5 h-3.5 text-[#4F6D7A]" />}
              <span>{copiedNumbers ? 'Numbers Copied!' : 'Copy Numbers'}</span>
            </button>

            {targetStudents.length > 0 && (
              <button
                onClick={handleStartWizard}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                title="Step through sending reminders sequentially to all parents"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Dispatch Runner ({targetStudents.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Balance Tiers Overview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8E2]/70">
          
          <button
            onClick={() => setBalanceFilter('all')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              balanceFilter === 'all'
                ? 'bg-[#4F6D7A]/10 border-[#4F6D7A] ring-1 ring-[#4F6D7A]'
                : 'bg-[#F2F4F2]/50 border-[#E2E8E2] hover:bg-[#F2F4F2]'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#2D312E]">All Pending Dues</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-[#4F6D7A] border border-[#E2E8E2]">
                {tierStats.allCount} Parents
              </span>
            </div>
            <div className="text-sm font-mono font-black text-[#2D312E]">
              {formatCurrency(tierStats.totalPending)}
            </div>
            <div className="text-[10px] text-[#6B7280] mt-0.5">
              All students with arrears
            </div>
          </button>

          <button
            onClick={() => setBalanceFilter('urgent')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              balanceFilter === 'urgent'
                ? 'bg-[#D68A6E]/15 border-[#D68A6E] ring-1 ring-[#D68A6E]'
                : 'bg-[#F2F4F2]/50 border-[#E2E8E2] hover:bg-[#F2F4F2]'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#D68A6E] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgent (&gt; ₹{formatNumber(highDueThreshold)})
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-[#D68A6E] border border-[#D68A6E]/30">
                {tierStats.urgentCount}
              </span>
            </div>
            <div className="text-sm font-mono font-black text-[#D68A6E]">
              {formatCurrency(tierStats.urgentTotal)}
            </div>
            <div className="text-[10px] text-[#6B7280] mt-0.5">
              Critical overdue notice
            </div>
          </button>

          <button
            onClick={() => setBalanceFilter('installment')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              balanceFilter === 'installment'
                ? 'bg-[#4F6D7A]/15 border-[#4F6D7A] ring-1 ring-[#4F6D7A]'
                : 'bg-[#F2F4F2]/50 border-[#E2E8E2] hover:bg-[#F2F4F2]'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#4F6D7A] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Installment ({formatNumber(minorDueThreshold)}-{formatNumber(highDueThreshold)})
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-[#4F6D7A] border border-[#4F6D7A]/30">
                {tierStats.installmentCount}
              </span>
            </div>
            <div className="text-sm font-mono font-black text-[#4F6D7A]">
              {formatCurrency(tierStats.installmentTotal)}
            </div>
            <div className="text-[10px] text-[#6B7280] mt-0.5">
              Mid-term installment notice
            </div>
          </button>

          <button
            onClick={() => setBalanceFilter('minor')}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              balanceFilter === 'minor'
                ? 'bg-[#89A894]/20 border-[#89A894] ring-1 ring-[#89A894]'
                : 'bg-[#F2F4F2]/50 border-[#E2E8E2] hover:bg-[#F2F4F2]'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-[#4F6D7A] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#89A894]" />
                Minor (&lt; ₹{formatNumber(minorDueThreshold)})
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full font-bold text-[#4F6D7A] border border-[#89A894]/30">
                {tierStats.minorCount}
              </span>
            </div>
            <div className="text-sm font-mono font-black text-[#4F6D7A]">
              {formatCurrency(tierStats.minorTotal)}
            </div>
            <div className="text-[10px] text-[#6B7280] mt-0.5">
              Clearance courtesy notice
            </div>
          </button>

        </div>

        {/* Template Selector Bar */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8E2]/70">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#2D312E] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>Choose Template Mode:</span>
              <span className="text-[#6B7280] font-normal lowercase">(determines message wording)</span>
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Due Date: <strong className="text-[#2D312E]">{dueDatePreset}</strong> • UPI Link: <strong className={includeUpiLink ? 'text-[#89A894]' : 'text-[#6B7280]'}>{includeUpiLink ? 'Included' : 'Off'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            
            {/* Auto-Select by Balance Button */}
            <button
              onClick={() => setTemplateMode('auto_by_balance')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'auto_by_balance'
                  ? 'bg-[#4F6D7A] text-white border-[#4F6D7A] shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className={`w-3.5 h-3.5 ${templateMode === 'auto_by_balance' ? 'text-[#89A894]' : 'text-[#4F6D7A]'}`} />
                <span className="truncate">Auto-Adaptive</span>
              </div>
              <span className={`text-[10px] font-normal ${templateMode === 'auto_by_balance' ? 'text-white/80' : 'text-[#6B7280]'}`}>
                Adapts per balance
              </span>
            </button>

            {/* Force Urgent Template */}
            <button
              onClick={() => setTemplateMode('tier_urgent')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'tier_urgent'
                  ? 'bg-[#D68A6E] text-white border-[#D68A6E] shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D68A6E] shrink-0" />
                <span className="truncate">Urgent Overdue</span>
              </div>
              <span className={`text-[10px] font-normal ${templateMode === 'tier_urgent' ? 'text-white/80' : 'text-[#6B7280]'}`}>
                &gt; ₹{formatNumber(highDueThreshold)}
              </span>
            </button>

            {/* Force Installment Template */}
            <button
              onClick={() => setTemplateMode('tier_installment')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'tier_installment'
                  ? 'bg-[#4F6D7A]/20 text-[#4F6D7A] border-[#4F6D7A] font-extrabold shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#4F6D7A] shrink-0" />
                <span className="truncate">Installment Due</span>
              </div>
              <span className="text-[10px] font-normal text-[#6B7280]">
                Mid-term due
              </span>
            </button>

            {/* Force Minor Balance Template */}
            <button
              onClick={() => setTemplateMode('tier_minor')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'tier_minor'
                  ? 'bg-[#89A894]/20 text-[#4F6D7A] border-[#89A894] font-extrabold shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#89A894] shrink-0" />
                <span className="truncate">Minor Balance</span>
              </div>
              <span className="text-[10px] font-normal text-[#6B7280]">
                &lt; ₹{formatNumber(minorDueThreshold)}
              </span>
            </button>

            {/* Van Transport Due */}
            <button
              onClick={() => setTemplateMode('van_fee')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'van_fee'
                  ? 'bg-[#D68A6E]/20 text-[#D68A6E] border-[#D68A6E] font-extrabold shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Bus className="w-3.5 h-3.5 text-[#D68A6E] shrink-0" />
                <span className="truncate">Van Transport</span>
              </div>
              <span className="text-[10px] font-normal text-[#6B7280]">
                Route fees
              </span>
            </button>

            {/* Sports Fee Due */}
            <button
              onClick={() => setTemplateMode('sports_fee')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'sports_fee'
                  ? 'bg-[#4F6D7A]/20 text-[#4F6D7A] border-[#4F6D7A] font-extrabold shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3.5 h-3.5 text-[#4F6D7A] shrink-0" />
                <span className="truncate">Sports & Kit</span>
              </div>
              <span className="text-[10px] font-normal text-[#6B7280]">
                Athletic dues
              </span>
            </button>

            {/* Custom Admin Message */}
            <button
              onClick={() => setTemplateMode('custom')}
              className={`p-2.5 rounded-lg text-xs font-bold text-left border flex flex-col justify-between transition-all cursor-pointer ${
                templateMode === 'custom'
                  ? 'bg-[#89A894]/20 text-[#4F6D7A] border-[#89A894] font-extrabold shadow-xs'
                  : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F7F8F6]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-[#4F6D7A] shrink-0" />
                <span className="truncate">Custom Text</span>
              </div>
              <span className="text-[10px] font-normal text-[#6B7280]">
                Write your own
              </span>
            </button>

          </div>

          {templateMode === 'custom' && (
            <div className="pt-2 animate-in fade-in duration-150">
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type custom school announcement for parents. Student name and pending amount will be included automatically..."
                className="w-full text-xs p-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
              />
            </div>
          )}
        </div>

      </div>

      {/* Main Two-Column Layout: Target Parents Table + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Target Parents List with Filters */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden flex flex-col">
          
          {/* Table Header & Search Filter Bar */}
          <div className="p-4 border-b border-[#E2E8E2] space-y-3 bg-[#F2F4F2]/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-2">
                  <span>Target Parents ({targetStudents.length})</span>
                  {balanceFilter !== 'all' && (
                    <span className="text-[11px] font-medium text-[#4F6D7A] bg-[#4F6D7A]/10 px-2 py-0.5 rounded">
                      Filter: {balanceFilter}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Select any row to view its exact balance template or click WhatsApp to dispatch immediately
                </p>
              </div>

              {/* Sent Status Tracker Badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6B7280]">
                  Dispatched Today:{' '}
                  <strong className="text-[#4F6D7A]">
                    {Object.keys(sentHistory).length}
                  </strong>
                </span>
                {Object.keys(sentHistory).length > 0 && (
                  <button
                    onClick={handleClearSentHistory}
                    className="text-[11px] text-[#D68A6E] hover:underline cursor-pointer"
                    title="Reset sent checks"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search student, parent, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E2E8E2] rounded-lg bg-white text-[#2D312E] focus:ring-1 focus:ring-[#89A894] outline-hidden"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="py-1.5 px-2.5 text-xs border border-[#E2E8E2] rounded-lg bg-white text-[#2D312E] outline-hidden cursor-pointer"
              >
                <option value="all">All Classes</option>
                {classList.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              {/* Facility Filter */}
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs border border-[#E2E8E2] rounded-lg bg-white text-[#2D312E] outline-hidden cursor-pointer"
              >
                <option value="all">All Fee Types</option>
                <option value="tuition">Tuition Dues Only</option>
                <option value="van">Van Dues Only</option>
                <option value="sports">Sports Dues Only</option>
              </select>

              {/* Balance Filter dropdown for quick switch */}
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as BalanceFilter)}
                className="py-1.5 px-2.5 text-xs border border-[#E2E8E2] rounded-lg bg-white text-[#2D312E] outline-hidden font-semibold cursor-pointer"
              >
                <option value="all">All Balance Levels</option>
                <option value="urgent">Urgent (&gt; ₹{formatNumber(highDueThreshold)})</option>
                <option value="installment">Installment (₹{formatNumber(minorDueThreshold)}-₹{formatNumber(highDueThreshold)})</option>
                <option value="minor">Minor (&lt; ₹{formatNumber(minorDueThreshold)})</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
                <tr>
                  <th className="py-2.5 px-3">Student & Class</th>
                  <th className="py-2.5 px-3">Parent Contact</th>
                  <th className="py-2.5 px-3 text-right">Pending Balance</th>
                  <th className="py-2.5 px-3 text-center">Assigned Template</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E2]/60">
                {targetStudents.length > 0 ? (
                  targetStudents.map((s) => {
                    const pending = getStudentPending(s);
                    const tier = getStudentBalanceTier(s, pending);
                    const isSelected = currentPreviewStudent?.id === s.id;
                    const sentRecord = sentHistory[s.id];

                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[#4F6D7A]/10 font-medium' 
                            : 'hover:bg-[#F7F8F6]/80'
                        }`}
                      >
                        {/* Student Name */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#2D312E] flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4F6D7A]" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {s.standard} - Sec {s.section} ({s.admissionNo})
                          </div>
                        </td>

                        {/* Parent Name & Phone */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#2D312E]">{s.parentName}</div>
                          <div className="text-[11px] font-mono text-[#6B7280]">
                            {s.whatsappNumber || s.parentPhone}
                          </div>
                        </td>

                        {/* Pending Amount */}
                        <td className="py-2.5 px-3 text-right">
                          <div className={`font-mono font-bold ${
                            tier === 'urgent' 
                              ? 'text-[#D68A6E]' 
                              : tier === 'installment'
                              ? 'text-[#4F6D7A]'
                              : 'text-[#2D312E]'
                          }`}>
                            {formatCurrency(pending)}
                          </div>
                          <div className="text-[10px] text-[#6B7280]">
                            {s.vanFacility ? '+ Van ' : ''}{s.sportsFacility ? '+ Sports' : ''}
                          </div>
                        </td>

                        {/* Assigned Template Tag */}
                        <td className="py-2.5 px-3 text-center">
                          {tier === 'urgent' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#D68A6E]/15 text-[#D68A6E] border border-[#D68A6E]/30">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent Notice
                            </span>
                          )}
                          {tier === 'installment' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#4F6D7A]/15 text-[#4F6D7A] border border-[#4F6D7A]/30">
                              <Clock className="w-3 h-3" />
                              Installment
                            </span>
                          )}
                          {tier === 'minor' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#89A894]/20 text-[#4F6D7A] border border-[#89A894]/30">
                              <CheckCircle2 className="w-3 h-3 text-[#89A894]" />
                              Clearance
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* WhatsApp Send Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsApp(s);
                              }}
                              title="Send WhatsApp Message"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-white font-bold rounded text-[11px] transition-colors shadow-2xs cursor-pointer ${
                                sentRecord 
                                  ? 'bg-[#4F6D7A] hover:bg-[#415A65]' 
                                  : 'bg-[#89A894] hover:bg-[#789683]'
                              }`}
                            >
                              {sentRecord ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Sent ({sentRecord.timestamp})</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </>
                              )}
                            </button>

                            {/* Phone Call Link */}
                            <a
                              href={`tel:${s.parentPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              title={`Call ${s.parentName}`}
                              className="p-1 bg-[#F2F4F2] text-[#4F6D7A] hover:bg-[#E2E8E2] rounded border border-[#E2E8E2] transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-[#2D312E]">No matching parents with pending dues</p>
                        <p className="text-xs">Try switching the class, facility, or balance filter above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          {targetStudents.length > 0 && (
            <div className="p-3 bg-[#F2F4F2]/50 border-t border-[#E2E8E2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
              <span>
                Showing <strong>{targetStudents.length}</strong> parents • Total Pending:{' '}
                <strong className="text-[#2D312E] font-mono">
                  {formatCurrency(targetStudents.reduce((sum, s) => sum + getStudentPending(s), 0))}
                </strong>
              </span>
              <span>
                Click any row to view its live message on the right
              </span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Message Preview & Direct Actions */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs p-4 flex flex-col justify-between">
          
          <div>
            {/* Header of Preview */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2] mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F6D7A]">
                  Live WhatsApp Preview
                </span>
              </div>

              {currentPreviewStudent && (
                <div className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#89A894]/30 bg-[#89A894]/15 text-[#4F6D7A]">
                  {templateMode === 'auto_by_balance' ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto: {getResolvedTier(currentPreviewStudent).toUpperCase()}
                    </span>
                  ) : (
                    <span>Template: {templateMode}</span>
                  )}
                </div>
              )}
            </div>

            {/* Recipient Details Bar */}
            {currentPreviewStudent && (
              <div className="bg-[#F2F4F2] p-2.5 rounded-lg border border-[#E2E8E2] mb-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2D312E]">
                    {currentPreviewStudent.name} ({currentPreviewStudent.standard} - {currentPreviewStudent.section})
                  </span>
                  <span className="font-mono font-bold text-[#D68A6E]">
                    Due: {formatCurrency(getStudentPending(currentPreviewStudent))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Parent: {currentPreviewStudent.parentName}</span>
                  <span className="font-mono">{currentPreviewStudent.whatsappNumber || currentPreviewStudent.parentPhone}</span>
                </div>
              </div>
            )}

            {/* Message Bubble Simulator */}
            {currentPreviewStudent ? (
              <div className="bg-[#EBECE7] p-3 rounded-xl shadow-inner font-sans text-xs">
                <div className="bg-white rounded-lg p-3.5 shadow-xs space-y-2 whitespace-pre-wrap font-sans text-[#2D312E] leading-relaxed border border-[#E2E8E2] max-h-[460px] overflow-y-auto">
                  {generateMessageText(currentPreviewStudent)}
                </div>
                
                <div className="flex items-center justify-between text-[10px] text-[#6B7280] mt-1.5 px-1">
                  <span>Direct WhatsApp API template</span>
                  <span>Formatted for Mobile</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#6B7280] text-xs">
                No students available to preview.
              </div>
            )}
          </div>

          {/* Bottom Actions for Preview Student */}
          {currentPreviewStudent && (
            <div className="mt-4 pt-3 border-t border-[#E2E8E2] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyMessage(currentPreviewStudent)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded-lg text-xs transition-colors border border-[#E2E8E2] cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-[#89A894]" /> : <Copy className="w-3.5 h-3.5 text-[#4F6D7A]" />}
                  <span>{copiedMessage ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <a
                  href={`tel:${currentPreviewStudent.parentPhone}`}
                  className="flex items-center justify-center gap-1.5 py-2 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#4F6D7A] font-semibold rounded-lg text-xs transition-colors border border-[#E2E8E2]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Parent</span>
                </a>
              </div>

              <button
                onClick={() => handleSendWhatsApp(currentPreviewStudent)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp to {currentPreviewStudent.parentName}</span>
              </button>

              <p className="text-[10px] text-[#6B7280] text-center">
                Opens official WhatsApp Web / App with message pre-filled
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Configuration & Thresholds Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-[#E2E8E2] space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#4F6D7A]/15 text-[#4F6D7A] rounded-lg">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-[#2D312E] text-sm">
                    Automated Reminder Configurations
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Customize balance cutoff thresholds and default payment deadline
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-1">
              
              {/* High / Critical Threshold */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D68A6E]" />
                    Critical / Urgent Balance Threshold (₹)
                  </span>
                  <span className="text-[11px] font-mono text-[#D68A6E] font-bold">
                    &gt; {formatCurrency(highDueThreshold)}
                  </span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={highDueThreshold}
                  onChange={(e) => setHighDueThreshold(Number(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                />
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Students with dues at or above this amount automatically receive the firm <strong>Urgent Final Notice</strong> template.
                </p>
              </div>

              {/* Minor Threshold */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#89A894]" />
                    Minor / Residual Clearance Cutoff (₹)
                  </span>
                  <span className="text-[11px] font-mono text-[#4F6D7A] font-bold">
                    &lt; {formatCurrency(minorDueThreshold)}
                  </span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={minorDueThreshold}
                  onChange={(e) => setMinorDueThreshold(Number(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                />
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Balances below this cutoff receive the friendly <strong>Minor Balance Clearance</strong> notice. Amounts between receive the <strong>Term Installment</strong> notice.
                </p>
              </div>

              {/* Due Date Preset */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">
                  Payment Deadline / Due By Notice
                </label>
                <input
                  type="text"
                  value={dueDatePreset}
                  onChange={(e) => setDueDatePreset(e.target.value)}
                  placeholder="e.g. Within 3 working days / by 15th of this month"
                  className="w-full text-xs border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {['Within 3 days', 'Within 5 days', 'By 15th of this month', 'End of this month'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDueDatePreset(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#F2F4F2] text-[#4F6D7A] hover:bg-[#E2E8E2] border border-[#E2E8E2] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8E2]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUpiLink}
                    onChange={(e) => setIncludeUpiLink(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] accent-[#4F6D7A]"
                  />
                  <span className="font-semibold text-[#2D312E]">
                    Include direct tap-to-pay mobile link (`upi://pay`) in message
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTamilNote}
                    onChange={(e) => setIncludeTamilNote(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F6D7A] accent-[#4F6D7A]"
                  />
                  <span className="font-semibold text-[#2D312E]">
                    Include bilingual Tamil courtesy reminder note at end of message
                  </span>
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8E2]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 font-semibold text-[#6B7280] hover:bg-[#F2F4F2] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2 font-bold bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-lg shadow-xs cursor-pointer"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Guided Sequential Auto-Dispatch Runner Modal */}
      {isDispatchWizardOpen && activeWizardStudent && (
        <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-5 border border-[#E2E8E2] space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            
            {/* Wizard Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#4F6D7A] text-white rounded-md">
                    <Play className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-bold text-[#2D312E] text-sm">
                    Sequential Auto-Dispatch Runner
                  </h3>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Queue {wizardCurrentIndex + 1} of {targetStudents.length} parents
                </p>
              </div>

              <button
                onClick={() => setIsDispatchWizardOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E2E8E2] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#4F6D7A] h-full transition-all duration-300"
                style={{ width: `${((wizardCurrentIndex + 1) / targetStudents.length) * 100}%` }}
              />
            </div>

            {/* Current Target Card */}
            <div className="bg-[#F2F4F2] p-3 rounded-lg border border-[#E2E8E2] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#2D312E]">
                  {activeWizardStudent.name} ({activeWizardStudent.standard} - {activeWizardStudent.section})
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Parent: <strong>{activeWizardStudent.parentName}</strong> • Phone: <span className="font-mono">{activeWizardStudent.whatsappNumber || activeWizardStudent.parentPhone}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-black text-sm text-[#D68A6E]">
                  {formatCurrency(getStudentPending(activeWizardStudent))}
                </div>
                <div className="text-[10px] font-bold text-[#4F6D7A]">
                  {getResolvedTier(activeWizardStudent).toUpperCase()} TEMPLATE
                </div>
              </div>
            </div>

            {/* Preview of Message for this Student */}
            <div className="bg-[#EBECE7] p-3 rounded-lg">
              <div className="bg-white p-3 rounded border border-[#E2E8E2] max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-[#2D312E]">
                {generateMessageText(activeWizardStudent)}
              </div>
            </div>

            {/* Wizard Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8E2]">
              <button
                type="button"
                onClick={handleWizardSkip}
                className="px-3 py-1.5 text-xs text-[#6B7280] hover:bg-[#F2F4F2] rounded-lg font-medium cursor-pointer"
              >
                Skip This Parent
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(activeWizardStudent)}
                  className="px-3 py-1.5 text-xs bg-white border border-[#E2E8E2] text-[#2D312E] hover:bg-[#F2F4F2] rounded-lg font-semibold cursor-pointer"
                >
                  Copy Text
                </button>

                <button
                  type="button"
                  onClick={handleWizardSendAndNext}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[#89A894] hover:bg-[#789683] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Send &amp; {wizardCurrentIndex < targetStudents.length - 1 ? 'Next' : 'Finish'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

