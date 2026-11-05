import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student, PaymentReceipt } from '../types';
import { cleanPhoneNumber, formatCurrency, generateUpiUrl } from '../utils/formatters';
import { UpiQrCode } from './UpiQrCode';
import { 
  Search, 
  UserCheck, 
  Phone, 
  MessageSquare, 
  QrCode, 
  Printer, 
  Bus, 
  Trophy, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ParentPortalViewProps {
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onViewFeeCard: (student: Student) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  onViewReceipt,
  onViewFeeCard,
}) => {
  const { 
    students, 
    schoolInfo, 
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending, 
    getStudentReceipts,
    dailyAttendance,
    activeStudentPortal,
    setActiveStudentPortal
  } = useSchool();

  const [searchKey, setSearchKey] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = searchKey.trim().toLowerCase();
    if (!query) return;

    const digits = query.replace(/\D/g, '');
    const matched = students.find(student => (
      student.admissionNo.trim().toLowerCase() === query
      || (digits.length >= 10 && (
        cleanPhoneNumber(student.parentPhone) === cleanPhoneNumber(query)
        || cleanPhoneNumber(student.whatsappNumber) === cleanPhoneNumber(query)
      ))
    ));

    if (matched) {
      setActiveStudentPortal(matched);
    } else {
      setLoginError('No matching student found. Please check the Admission Number or Mobile Number.');
    }
  };

  const currentStudent = activeStudentPortal;

  if (!currentStudent) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-[#E2E8E2] p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full border-2 border-[#D68A6E] overflow-hidden shadow-xs">
            <img src={schoolInfo.logoUrl || '/school_logo.jpg'} alt="Wisdom School" className="w-full h-full object-cover" />
          </div>

          <div>
            <h2 className="text-xl font-black text-[#2D312E]">
              Wisdom School Parent & Student Portal
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Essur - 603301 • Admin: {schoolInfo.adminName} ({schoolInfo.phone})
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#2D312E] uppercase mb-1">
                Enter Admission No or full Registered Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. WIS-2024-001 or 9840123456"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  className="w-full text-sm font-semibold border border-[#E2E8E2] rounded-xl p-3 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
                  required
                />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Demo access only. Enter a full admission number or registered mobile number.
              </p>
            </div>

            {loginError && (
              <div className="bg-[#D68A6E]/10 border border-[#D68A6E]/30 text-[#D68A6E] text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] leading-relaxed text-amber-900">
            This GitHub Pages demo stores its records in this browser. It does not verify parent identity or sync data between devices.
          </div>

          {/* Quick Select demo pill list */}
          <div className="pt-4 border-t border-[#E2E8E2]/70 text-xs">
            <span className="text-[#6B7280] block mb-2 font-medium">Or quick login as demo student:</span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {students.slice(0, 5).map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStudentPortal(s)}
                  className="px-2.5 py-1 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] rounded-full text-[11px] font-semibold transition-colors border border-[#E2E8E2]"
                >
                  {s.name} ({s.standard})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalFee = getStudentTotalFee(currentStudent);
  const totalPaid = getStudentTotalPaid(currentStudent.id);
  const pending = getStudentPending(currentStudent);
  const receipts = getStudentReceipts(currentStudent.id);

  const upiPayUrl = generateUpiUrl(schoolInfo, pending, currentStudent.name);
  const attendanceRecords = dailyAttendance
    .filter(record => record.admissionNo === currentStudent.admissionNo && record.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const paymentConfirmationMessage = encodeURIComponent(
    `Hello ${schoolInfo.adminName}, I have made a UPI fee payment for ${currentStudent.name} (${currentStudent.admissionNo}) of ${formatCurrency(pending)}. Please verify the transaction and issue the official receipt.`
  );
  const officeWhatsApp = cleanPhoneNumber(schoolInfo.phone);

  return (
    <div className="space-y-6">
      
      {/* Student Profile Top Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8E2] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-[#89A894] overflow-hidden bg-[#89A894]/10 flex items-center justify-center shrink-0">
            <img src={schoolInfo.logoUrl || '/school_logo.jpg'} alt="Wisdom School" className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#2D312E]">{currentStudent.name}</h2>
              <span className="bg-[#4F6D7A]/15 text-[#4F6D7A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#4F6D7A]/30">
                {currentStudent.standard} - Sec {currentStudent.section}
              </span>
            </div>
            <div className="text-xs text-[#6B7280] mt-0.5 space-x-2">
              <span>Adm No: <strong className="font-mono text-[#2D312E]">{currentStudent.admissionNo}</strong></span>
              <span>•</span>
              <span>Roll No: <strong className="text-[#2D312E]">{currentStudent.rollNo}</strong></span>
              <span>•</span>
              <span>Parent: <strong className="text-[#2D312E]">{currentStudent.parentName}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onViewFeeCard(currentStudent)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#4F6D7A] font-bold rounded-lg text-xs border border-[#E2E8E2] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>View Fee & Van Card</span>
          </button>

          <button
            onClick={() => setActiveStudentPortal(null)}
            className="px-3 py-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded-lg text-xs transition-colors border border-[#E2E8E2]"
          >
            Switch Student
          </button>
        </div>
      </div>

      <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Demo portal only: student details are not protected by verified parent accounts and changes do not sync to other devices. Do not enter sensitive information.
        </span>
      </div>

      {/* Fee Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-2xs">
          <span className="text-xs font-bold uppercase text-[#6B7280] block">Total Academic Fee</span>
          <span className="text-2xl font-black text-[#2D312E] font-mono mt-1 block">
            {formatCurrency(totalFee)}
          </span>
          <span className="text-[11px] text-[#6B7280] mt-1 block">
            Tuition: ₹{currentStudent.tuitionFee}
            {currentStudent.vanFacility ? ` + Van: ₹${currentStudent.vanFee}` : ''}
            {currentStudent.sportsFacility ? ` + Sports: ₹${currentStudent.sportsFee}` : ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#89A894]/30 bg-[#89A894]/10 shadow-2xs">
          <span className="text-xs font-bold uppercase text-[#4F6D7A] block">Total Fee Paid</span>
          <span className="text-2xl font-black text-[#4F6D7A] font-mono mt-1 block">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[11px] text-[#4F6D7A] mt-1 block">
            {receipts.length} Payment Receipts Issued
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D68A6E]/30 bg-[#D68A6E]/10 shadow-2xs">
          <span className="text-xs font-bold uppercase text-[#D68A6E] block">Pending Balance Due</span>
          <span className={`text-2xl font-black font-mono mt-1 block ${pending > 0 ? 'text-[#D68A6E]' : 'text-[#89A894]'}`}>
            {pending > 0 ? formatCurrency(pending) : 'NIL (FULLY CLEARED)'}
          </span>
          <span className="text-[11px] text-[#6B7280] mt-1 block">
            {pending > 0 ? 'Payable to Wisdom School Office' : 'All annual dues cleared'}
          </span>
        </div>
      </div>

      {/* Online UPI Payment Section (If Pending Due) */}
      {pending > 0 && (
        <div className="bg-[#2D312E] text-white rounded-2xl p-6 shadow-md border border-[#4F6D7A]/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="bg-[#89A894]/20 text-[#89A894] border border-[#89A894]/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Instant UPI / Google Pay
              </span>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Pay Pending Fee of {formatCurrency(pending)} Online
              </h3>
              <p className="text-xs text-[#E2E8E2] max-w-lg leading-relaxed">
                Scan the QR code with Google Pay, PhonePe, Paytm, or BHIM. After making payment, please send a screenshot to School Admin <strong>R. SARAVANAN</strong> for immediate receipt generation.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start text-xs">
                <span className="bg-black/30 px-3 py-1 rounded font-mono text-[#D68A6E] border border-white/10">
                  UPI ID: {schoolInfo.upiId}
                </span>
                <span className="bg-black/30 px-3 py-1 rounded font-mono text-[#89A894] border border-white/10">
                  GPay Phone: {schoolInfo.gpayPhone}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl shadow-lg flex flex-col items-center text-[#2D312E] shrink-0">
              <UpiQrCode upiUrl={upiPayUrl} size={140} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-1">
                Scan to Pay ₹{pending}
              </span>
              <a
                href={upiPayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-1.5 px-3 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded text-xs text-center transition-colors block"
              >
                Pay in UPI App
              </a>
              <a
                href={`https://wa.me/${officeWhatsApp}?text=${paymentConfirmationMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-1.5 px-3 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded text-xs text-center transition-colors block"
              >
                I paid — message office
              </a>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[#E2E8E2]">
            UPI payments are not verified automatically. The balance changes only after the school records and verifies your payment.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-[#E2E8E2] bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#2D312E]">
              <CalendarDays className="h-4 w-4 text-[#4F6D7A]" />
              Attendance updates
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">Daily attendance recorded by the school office on this browser</p>
          </div>
          <span className="rounded-full bg-[#F2F4F2] px-2.5 py-1 text-[11px] font-semibold text-[#4F6D7A]">
            {attendanceRecords.length} {attendanceRecords.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        {attendanceRecords.length > 0 ? (
          <div className="divide-y divide-[#E2E8E2]">
            {attendanceRecords.slice(0, 7).map(record => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#2D312E]">
                    {record.date} <span className="font-normal text-[#6B7280]">· {record.standard} - {record.section}</span>
                  </p>
                  {record.reason && <p className="mt-0.5 text-[11px] text-[#6B7280]">{record.reason}</p>}
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  record.status === 'Present'
                    ? 'bg-emerald-50 text-emerald-700'
                    : record.status === 'Absent'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                }`}>
                  {record.status === 'Present' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#F7F8F6] px-4 py-6 text-center text-xs text-[#6B7280]">
            No saved attendance updates for this student yet. Attendance data is available only in the browser where the office records it.
          </div>
        )}
      </section>

      {/* Payment History & Fee Slips Table */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2D312E] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#89A894]" />
              Fee Payment Receipts & Slips History ({receipts.length})
            </h3>
            <p className="text-xs text-[#6B7280]">Official fee slips issued by school administration</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2]">
              <tr>
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Fee Particulars</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]/60">
              {receipts.length > 0 ? (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{r.receiptNumber}</td>
                    <td className="py-2.5 px-3 text-[#6B7280]">{r.date}</td>
                    <td className="py-2.5 px-3 text-[#2D312E]">
                      {r.breakdown.tuition > 0 && `Tuition: ₹${r.breakdown.tuition} `}
                      {r.breakdown.van > 0 && `• Van: ₹${r.breakdown.van} `}
                      {r.breakdown.sports > 0 && `• Sports: ₹${r.breakdown.sports}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-[#F2F4F2] rounded font-semibold text-[#2D312E] border border-[#E2E8E2]">
                        {r.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#89A894]">
                      {formatCurrency(r.amountPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onViewReceipt(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#4F6D7A] font-bold rounded text-[11px] border border-[#E2E8E2] transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Download / Print Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#6B7280]">
                    No fee payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Contact Admin Bar */}
      <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-[#2D312E] block">Need Fee Assistance or Van Route Change?</span>
          <span className="text-[#6B7280]">Contact School Admin R. SARAVANAN, Essur - 603301</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${schoolInfo.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F7F8F6] text-[#2D312E] font-bold rounded-lg border border-[#E2E8E2] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#89A894]" />
            <span>Call Admin</span>
          </a>
          <a
            href={`https://wa.me/919176593129?text=${encodeURIComponent(`Hello Admin R. Saravanan, Enquiry regarding student ${currentStudent.name} (Adm: ${currentStudent.admissionNo})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Admin</span>
          </a>
        </div>
      </div>

    </div>
  );
};
