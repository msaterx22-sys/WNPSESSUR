import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  formatCurrency, 
  buildWhatsAppPendingNotice, 
  cleanPhoneNumber 
} from '../utils/formatters';
import { 
  Users, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Bus, 
  Trophy, 
  TrendingUp, 
  Phone, 
  MessageSquare, 
  Printer, 
  CreditCard,
  UserPlus
} from 'lucide-react';
import { Student, PaymentReceipt, StandardClass } from '../types';

interface DashboardViewProps {
  onCollectPayment: (student: Student) => void;
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onAddNewStudent: () => void;
  onViewFeeCard: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onCollectPayment,
  onViewReceipt,
  onAddNewStudent,
  onViewFeeCard,
}) => {
  const { 
    students, 
    receipts, 
    stats, 
    schoolInfo, 
    feeStructure, 
    classList,
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending,
    setActiveTab
  } = useSchool();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Pending students list sorted by highest pending amount
  const pendingStudents = students
    .map(s => ({
      student: s,
      total: getStudentTotalFee(s),
      paid: getStudentTotalPaid(s.id),
      pending: getStudentPending(s),
    }))
    .filter(item => item.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const handleSendWhatsAppReminder = (item: { student: Student; total: number; paid: number; pending: number }) => {
    const encoded = buildWhatsAppPendingNotice(item.student, schoolInfo, item.total, item.paid, item.pending);
    const phone = cleanPhoneNumber(item.student.whatsappNumber || item.student.parentPhone);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const standardsList: string[] = classList;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner with Office Admin badge */}
      <div className="bg-[#2D312E] text-white rounded-2xl p-5 shadow-sm border border-[#3A3F3B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={schoolInfo.logoUrl || '/school_logo.jpg'}
            alt="Wisdom School Seal" 
            className="w-16 h-16 rounded-full border-2 border-[#89A894] object-cover bg-white shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Wisdom School Fee Office
              </h2>
              <span className="bg-[#89A894]/20 text-[#89A894] border border-[#89A894]/40 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Admin: {schoolInfo.adminName}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              Essur - 603301, Tamil Nadu • Ph: <strong>{schoolInfo.phone}</strong> • UPI: <strong className="font-mono text-[#D68A6E]">{schoolInfo.upiId}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onAddNewStudent}
            className="flex items-center gap-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className="flex items-center gap-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Due Alerts</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="dashboard-stat-card dashboard-stat-card--blue bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-[#6B7280]">Total Enrolled</span>
            <span className="p-1.5 bg-[#3B82A0]/15 text-[#3B82A0] rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#2D312E]">{stats.totalStudents}</div>
          <div className="text-[11px] text-[#6B7280] mt-1">LKG to 5th Standard</div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--gold bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-[#6B7280]">Total Expected</span>
            <span className="p-1.5 bg-[#C38A3A]/15 text-[#A66F24] rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#2D312E] font-mono">
            {formatCurrency(stats.totalFeeExpected)}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-1">Tuition + Van + Sports</div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--green bg-white p-4 rounded-xl border border-[#4F9B72]/35 bg-[#4F9B72]/5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-[#4F6D7A]">Total Collected</span>
            <span className="p-1.5 bg-[#4F9B72]/20 text-[#4F9B72] rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#4F9B72] font-mono">
            {formatCurrency(stats.totalCollected)}
          </div>
          <div className="text-[11px] text-[#4F6D7A] font-medium mt-1">
            {stats.totalFeeExpected > 0 ? `${Math.round((stats.totalCollected / stats.totalFeeExpected) * 100)}% Collected` : '0%'}
          </div>
        </div>

        <div className="dashboard-stat-card dashboard-stat-card--coral bg-white p-4 rounded-xl border border-[#D26A5A]/35 bg-[#D26A5A]/5 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-[#D26A5A]">Pending Balance</span>
            <span className="p-1.5 bg-[#D26A5A]/15 text-[#D26A5A] rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-[#D26A5A] font-mono">
            {formatCurrency(stats.totalPending)}
          </div>
          <div className="text-[11px] text-[#D26A5A]/90 font-medium mt-1">
            {pendingStudents.length} Students with balance
          </div>
        </div>
      </div>

      {/* Auxiliary Fee Breakdown Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FDFDFB] border border-[#E2E8E2] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#89A894]/15 text-[#4F6D7A] rounded-lg">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D312E] block">Van Transport Collection</span>
              <span className="text-[11px] text-[#6B7280]">
                Target: {formatCurrency(stats.totalVanExpected)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#2D312E] font-mono">
              {formatCurrency(stats.totalVanCollected)}
            </span>
          </div>
        </div>

        <div className="bg-[#FDFDFB] border border-[#E2E8E2] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4F6D7A]/15 text-[#4F6D7A] rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D312E] block">Sports & Activities</span>
              <span className="text-[11px] text-[#6B7280]">
                Target: {formatCurrency(stats.totalSportsExpected)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#2D312E] font-mono">
              {formatCurrency(stats.totalSportsCollected)}
            </span>
          </div>
        </div>

        <div className="bg-[#FDFDFB] border border-[#E2E8E2] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D68A6E]/15 text-[#D68A6E] rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D312E] block">Late Fees / Arrears</span>
              <span className="text-[11px] text-[#6B7280]">Collected penalty fines</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-[#2D312E] font-mono">
              {formatCurrency(stats.totalLateFeesCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* Class-by-Class Fee Structure & Collection Tracker */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#2D312E] uppercase tracking-wide">
              Standard-wise Fee Structure & Collections
            </h3>
            <p className="text-xs text-[#6B7280]">
              Official school base tuition rates & collection rate across standards
            </p>
          </div>
          <span className="text-xs font-bold text-[#4F6D7A] bg-[#89A894]/15 px-2.5 py-1 rounded border border-[#89A894]/30">
            LKG 16,500 • UKG 17,600 • 1st 18,150 • 2nd 18,700 • 3rd 19,800 • 4th 20,350 • 5th 20,500
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {standardsList.map((std) => {
            const stdStudents = students.filter(s => s.standard === std);
            const stdExpected = stdStudents.reduce((sum, s) => sum + getStudentTotalFee(s), 0);
            const stdCollected = stdStudents.reduce((sum, s) => sum + getStudentTotalPaid(s.id), 0);
            const stdPending = Math.max(0, stdExpected - stdCollected);
            const percent = stdExpected > 0 ? Math.round((stdCollected / stdExpected) * 100) : 0;

            return (
              <div key={std} className="border border-[#E2E8E2] rounded-lg p-3 bg-[#FDFDFB] hover:bg-[#F2F4F2]/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-[#2D312E] bg-white px-2 py-0.5 rounded border border-[#E2E8E2]">
                    {std}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4F6D7A]">
                    Base: ₹{feeStructure[std]?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Enrolled:</span>
                    <strong className="text-[#2D312E]">{stdStudents.length} Students</strong>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Collected:</span>
                    <strong className="text-[#89A894] font-mono">{formatCurrency(stdCollected)}</strong>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Pending:</span>
                    <strong className="text-[#D68A6E] font-mono">{formatCurrency(stdPending)}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5">
                  <div className="w-full bg-[#E2E8E2] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#4F6D7A] h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6B7280] mt-1 font-semibold">
                    <span>Progress</span>
                    <span>{percent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Immediate Pending Follow-ups & Recent Fee Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Pending Fee Dues & 1-Click WhatsApp / Call */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#D68A6E]" />
                Pending Fee Follow-ups ({pendingStudents.length})
              </h3>
              <p className="text-xs text-[#6B7280]">1-click WhatsApp message & phone call</p>
            </div>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="text-xs text-[#4F6D7A] hover:text-[#2D312E] font-semibold"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[#E2E8E2]/60 overflow-y-auto max-h-96 flex-1 pr-1">
            {pendingStudents.length > 0 ? (
              pendingStudents.map(({ student, pending, total, paid }) => (
                <div key={student.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-[#2D312E] flex items-center gap-1.5">
                      {student.name}
                      <span className="text-[10px] bg-[#F2F4F2] text-[#2D312E] px-1.5 py-0.2 rounded font-semibold border border-[#E2E8E2]">
                        {student.standard}-{student.section}
                      </span>
                    </div>
                    <div className="text-[#6B7280] text-[11px]">
                      Parent: {student.parentName} • {student.parentPhone}
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      Due: <strong className="text-[#D68A6E]">{formatCurrency(pending)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSendWhatsAppReminder({ student, total, paid, pending })}
                      title="Send WhatsApp payment reminder"
                      className="p-1.5 bg-[#89A894]/15 hover:bg-[#89A894]/25 text-[#4F6D7A] rounded-md border border-[#89A894]/30 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`tel:${student.parentPhone}`}
                      title="Call Parent Phone"
                      className="p-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] rounded-md border border-[#E2E8E2] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onCollectPayment(student)}
                      className="px-2.5 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-md text-[11px] transition-colors shadow-2xs"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#6B7280] text-xs">
                All student fees are currently fully paid!
              </div>
            )}
          </div>
        </div>

        {/* Recent Fee Slips / Receipts */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#89A894]" />
                Recent Fee Paid Slips
              </h3>
              <p className="text-xs text-[#6B7280]">Official receipts issued by school office</p>
            </div>
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs text-[#4F6D7A] hover:text-[#2D312E] font-semibold"
            >
              All Slips
            </button>
          </div>

          <div className="divide-y divide-[#E2E8E2]/60 overflow-y-auto max-h-96 flex-1 pr-1">
            {receipts.slice(0, 7).map((receipt) => (
              <div key={receipt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#4F6D7A]">{receipt.receiptNumber}</span>
                    <span className="font-semibold text-[#2D312E]">{receipt.studentName}</span>
                    <span className="text-[10px] text-[#6B7280]">({receipt.standard})</span>
                  </div>
                  <div className="text-[#6B7280] text-[11px] mt-0.5">
                    {receipt.date} • Mode: <strong className="text-[#2D312E]">{receipt.paymentMode}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-[#89A894] text-xs">
                    {formatCurrency(receipt.amountPaid)}
                  </span>
                  <button
                    onClick={() => onViewReceipt(receipt)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded text-[11px] transition-colors border border-[#E2E8E2]"
                  >
                    <Printer className="w-3 h-3 text-[#6B7280]" />
                    <span>View Slip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
