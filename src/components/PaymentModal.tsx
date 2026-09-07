import React, { useState, useEffect } from 'react';
import { Student, PaymentMode, FeeCategory, FeeBreakdown } from '../types';
import { useSchool } from '../context/SchoolContext';
import { formatCurrency, generateUpiUrl } from '../utils/formatters';
import { UpiQrCode } from './UpiQrCode';
import { X, QrCode, Banknote, CreditCard, ShieldCheck, Check } from 'lucide-react';

interface PaymentModalProps {
  initialStudent?: Student | null;
  onClose: () => void;
  onPaymentSuccess: (receipt: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  initialStudent, 
  onClose, 
  onPaymentSuccess 
}) => {
  const { 
    students, 
    schoolInfo, 
    recordPayment, 
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending 
  } = useSchool();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent ? initialStudent.id : (students[0]?.id || ''));
  const currentStudent = students.find(s => s.id === selectedStudentId);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('GPay / UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [category, setCategory] = useState<FeeCategory>('Tuition');

  const [breakdown, setBreakdown] = useState<FeeBreakdown>({
    tuition: 0,
    van: 0,
    sports: 0,
    lateFee: 0,
    other: 0,
  });

  const totalFee = currentStudent ? getStudentTotalFee(currentStudent) : 0;
  const totalPaid = currentStudent ? getStudentTotalPaid(currentStudent.id) : 0;
  const pending = currentStudent ? getStudentPending(currentStudent) : 0;

  // Set default breakdown when student changes
  useEffect(() => {
    if (currentStudent) {
      const studentPending = getStudentPending(currentStudent);
      setBreakdown({
        tuition: studentPending > 0 ? studentPending : 0,
        van: 0,
        sports: 0,
        lateFee: currentStudent.lateFee || 0,
        other: 0,
      });
      setCategory('Tuition');
    }
  }, [selectedStudentId]);

  const totalAmountToPay = 
    (Number(breakdown.tuition) || 0) +
    (Number(breakdown.van) || 0) +
    (Number(breakdown.sports) || 0) +
    (Number(breakdown.lateFee) || 0) +
    (Number(breakdown.other) || 0);

  const upiUrl = currentStudent 
    ? generateUpiUrl(schoolInfo, totalAmountToPay, currentStudent.name) 
    : '';

  const handleQuickFill = (type: 'full' | 'tuition' | 'van' | 'sports') => {
    if (!currentStudent) return;
    if (type === 'full') {
      const p = getStudentPending(currentStudent);
      setBreakdown({
        tuition: p,
        van: 0,
        sports: 0,
        lateFee: 0,
        other: 0,
      });
      setCategory('Composite / Combined');
    } else if (type === 'van') {
      setBreakdown({
        tuition: 0,
        van: currentStudent.vanFee || 4000,
        sports: 0,
        lateFee: 0,
        other: 0,
      });
      setCategory('Van');
    } else if (type === 'sports') {
      setBreakdown({
        tuition: 0,
        van: 0,
        sports: currentStudent.sportsFee || 1200,
        lateFee: 0,
        other: 0,
      });
      setCategory('Sports');
    } else if (type === 'tuition') {
      setBreakdown({
        tuition: currentStudent.tuitionFee,
        van: 0,
        sports: 0,
        lateFee: 0,
        other: 0,
      });
      setCategory('Tuition');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (totalAmountToPay <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    try {
      const receipt = recordPayment({
        studentId: currentStudent.id,
        paymentMode,
        transactionReference: transactionRef,
        category,
        breakdown,
        date: paymentDate,
        notes,
      });
      onPaymentSuccess(receipt);
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#4F6D7A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#89A894] rounded-lg">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Collect Fee & Generate Paid Slip</h3>
              <p className="text-[11px] text-white/80">Wisdom Nursery & Primary School Office</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-[#415A65] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Student Selection */}
          <div>
            <label className="block text-xs font-bold text-[#2D312E] uppercase mb-1">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs font-medium border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] focus:outline-hidden"
              disabled={!!initialStudent}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.standard} - Sec {s.section}) | Adm: {s.admissionNo} | Parent: {s.parentName}
                </option>
              ))}
            </select>
          </div>

          {/* Student Quick Status Card */}
          {currentStudent && (
            <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Class Fee:</span>
                <span className="font-semibold text-[#2D312E]">{formatCurrency(currentStudent.tuitionFee)}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Van / Sports:</span>
                <span className="font-medium text-[#2D312E]">
                  {currentStudent.vanFacility ? `Van: ₹${currentStudent.vanFee} ` : ''}
                  {currentStudent.sportsFacility ? `Sports: ₹${currentStudent.sportsFee}` : ''}
                  {!currentStudent.vanFacility && !currentStudent.sportsFacility && 'None'}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Paid Till Date:</span>
                <span className="font-semibold text-[#4F6D7A]">{formatCurrency(totalPaid)}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Pending Balance:</span>
                <span className={`font-bold ${pending > 0 ? 'text-[#D68A6E]' : 'text-[#89A894]'}`}>
                  {formatCurrency(pending)}
                </span>
              </div>
            </div>
          )}

          {/* Quick Fill Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#2D312E] uppercase">Quick Presets</span>
              <span className="text-[11px] text-[#6B7280]">Click to autofill breakdown</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('full')}
                className="text-xs px-2.5 py-1 bg-[#4F6D7A]/10 text-[#4F6D7A] hover:bg-[#4F6D7A]/20 font-semibold rounded-md border border-[#4F6D7A]/25 transition-colors cursor-pointer"
              >
                Clear Full Balance ({formatCurrency(pending)})
              </button>
              {currentStudent?.vanFacility && (
                <button
                  type="button"
                  onClick={() => handleQuickFill('van')}
                  className="text-xs px-2.5 py-1 bg-[#D68A6E]/10 text-[#D68A6E] hover:bg-[#D68A6E]/20 font-semibold rounded-md border border-[#D68A6E]/30 transition-colors cursor-pointer"
                >
                  Van Fee Only (₹{currentStudent.vanFee})
                </button>
              )}
              {currentStudent?.sportsFacility && (
                <button
                  type="button"
                  onClick={() => handleQuickFill('sports')}
                  className="text-xs px-2.5 py-1 bg-[#89A894]/15 text-[#4F6D7A] hover:bg-[#89A894]/25 font-semibold rounded-md border border-[#89A894]/30 transition-colors cursor-pointer"
                >
                  Sports Fee Only (₹{currentStudent.sportsFee})
                </button>
              )}
            </div>
          </div>

          {/* Fee Itemization Breakdown */}
          <div className="bg-[#F2F4F2] p-3.5 rounded-lg border border-[#E2E8E2] space-y-3">
            <h4 className="text-xs font-bold text-[#2D312E] uppercase tracking-wider">
              Payment Breakdown (₹)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Tuition Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.tuition || ''}
                  onChange={(e) => setBreakdown(prev => ({ ...prev, tuition: Number(e.target.value) || 0 }))}
                  className="w-full text-xs font-mono font-semibold border border-[#E2E8E2] rounded p-2 bg-white text-[#2D312E] focus:ring-1 focus:ring-[#89A894] outline-hidden"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Van / Transport Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.van || ''}
                  onChange={(e) => setBreakdown(prev => ({ ...prev, van: Number(e.target.value) || 0 }))}
                  className="w-full text-xs font-mono font-semibold border border-[#E2E8E2] rounded p-2 bg-white text-[#2D312E] focus:ring-1 focus:ring-[#89A894] outline-hidden"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Sports Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.sports || ''}
                  onChange={(e) => setBreakdown(prev => ({ ...prev, sports: Number(e.target.value) || 0 }))}
                  className="w-full text-xs font-mono font-semibold border border-[#E2E8E2] rounded p-2 bg-white text-[#2D312E] focus:ring-1 focus:ring-[#89A894] outline-hidden"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#D68A6E] mb-1">
                  Late Fee / Fine
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.lateFee || ''}
                  onChange={(e) => setBreakdown(prev => ({ ...prev, lateFee: Number(e.target.value) || 0 }))}
                  className="w-full text-xs font-mono font-semibold border border-[#D68A6E]/30 text-[#D68A6E] rounded p-2 bg-white focus:ring-1 focus:ring-[#D68A6E] outline-hidden"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Other / Exam Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakdown.other || ''}
                  onChange={(e) => setBreakdown(prev => ({ ...prev, other: Number(e.target.value) || 0 }))}
                  className="w-full text-xs font-mono font-semibold border border-[#E2E8E2] rounded p-2 bg-white text-[#2D312E] focus:ring-1 focus:ring-[#89A894] outline-hidden"
                  placeholder="0"
                />
              </div>

              <div className="bg-[#89A894]/15 p-2 rounded border border-[#89A894]/30 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-[#4F6D7A]">Total To Collect:</span>
                <span className="text-base font-mono font-black text-[#4F6D7A]">
                  {formatCurrency(totalAmountToPay)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-[#2D312E] uppercase mb-2">
              Payment Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['GPay / UPI', 'Cash', 'Bank Transfer', 'Cheque'] as PaymentMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`p-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-[#4F6D7A] text-white border-[#4F6D7A] shadow-xs'
                      : 'bg-white text-[#2D312E] border-[#E2E8E2] hover:bg-[#F2F4F2]'
                  }`}
                >
                  {mode === 'GPay / UPI' && <QrCode className="w-3.5 h-3.5" />}
                  {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                  {mode === 'Bank Transfer' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {mode === 'Cheque' && <Check className="w-3.5 h-3.5" />}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* If GPay / UPI is chosen, display dynamic live QR for parent to scan right on office screen! */}
          {paymentMode === 'GPay / UPI' && (
            <div className="bg-[#89A894]/10 border border-[#89A894]/30 rounded-lg p-3 flex flex-col sm:flex-row items-center gap-4">
              <UpiQrCode upiUrl={upiUrl} size={110} />
              <div className="text-xs text-[#2D312E] space-y-1 text-center sm:text-left">
                <div className="font-bold text-[#4F6D7A] flex items-center gap-1 justify-center sm:justify-start">
                  <QrCode className="w-4 h-4 text-[#89A894]" />
                  Instant Google Pay / PhonePe / Paytm QR
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Parent can scan with GPay / PhonePe / BHIM on mobile to pay exact amount: <strong>{formatCurrency(totalAmountToPay)}</strong>
                </p>
                <p className="text-[11px] font-mono text-[#2D312E]">
                  UPI ID: <strong>{schoolInfo.upiId}</strong> ({schoolInfo.gpayPhone})
                </p>
              </div>
            </div>
          )}

          {/* Reference & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2D312E] mb-1">
                Transaction Reference / UTR No (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI-418293019284 or Cash Slip"
                className="w-full text-xs border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2D312E] mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D312E] mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid at school office by father"
              className="w-full text-xs border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-[#E2E8E2] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Admin in charge: <strong>{schoolInfo.adminName}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-[#6B7280] hover:bg-[#F2F4F2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={totalAmountToPay <= 0}
                className="px-5 py-2 text-xs font-bold bg-[#4F6D7A] hover:bg-[#415A65] disabled:opacity-50 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Save & Generate Fee Slip</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
