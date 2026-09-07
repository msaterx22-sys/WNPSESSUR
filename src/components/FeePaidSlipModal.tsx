import React, { useRef } from 'react';
import { PaymentReceipt } from '../types';
import { useSchool } from '../context/SchoolContext';
import { 
  formatCurrency, 
  numberToIndianWords, 
  buildWhatsAppReceiptMessage, 
  cleanPhoneNumber,
  generateUpiUrl 
} from '../utils/formatters';
import { UpiQrCode } from './UpiQrCode';
import { Printer, MessageSquare, Phone, X, CheckCircle2, Building2 } from 'lucide-react';

interface FeePaidSlipModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const FeePaidSlipModal: React.FC<FeePaidSlipModalProps> = ({ receipt, onClose }) => {
  const { schoolInfo, students, getStudentTotalFee, getStudentTotalPaid } = useSchool();
  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const student = students.find(s => s.id === receipt.studentId);
  const totalFee = student ? getStudentTotalFee(student) : receipt.amountPaid;
  const totalPaid = student ? getStudentTotalPaid(student.id) : receipt.amountPaid;
  const currentPending = Math.max(0, totalFee - totalPaid);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const encoded = buildWhatsAppReceiptMessage(receipt, schoolInfo, totalFee, totalPaid);
    const phone = cleanPhoneNumber(receipt.parentPhone);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const upiVerificationUrl = generateUpiUrl(
    schoolInfo, 
    receipt.amountPaid, 
    receipt.studentName, 
    receipt.receiptNumber
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print bg-[#4F6D7A] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#89A894] rounded text-white">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Official Fee Paid Slip</h3>
              <p className="text-[11px] text-white/80 font-mono">{receipt.receiptNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white hover:bg-[#F7F8F6] text-[#4F6D7A] px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 bg-[#89A894] hover:bg-[#789683] text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Parent</span>
            </button>

            <a
              href={`tel:${receipt.parentPhone}`}
              className="flex items-center gap-1.5 bg-[#415A65] hover:bg-[#354851] text-white px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
              title="Call Parent Phone"
            >
              <Phone className="w-3.5 h-3.5 text-[#89A894]" />
              <span>Call</span>
            </a>

            <button
              onClick={onClose}
              className="p-1 text-white/70 hover:text-white rounded-md hover:bg-[#415A65] transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Slip Body */}
        <div className="p-6 overflow-y-auto bg-[#F7F8F6] flex-1 flex justify-center">
          <div 
            ref={printRef}
            className="printable-document bg-white border-2 border-[#E2E8E2] rounded-lg p-6 max-w-2xl w-full text-[#2D312E] shadow-xs relative"
          >
            {/* Watermark Logo in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
              <img src={schoolInfo.logoUrl || '/school_logo.jpg'} alt="" className="w-72 h-72 object-contain" />
            </div>

            {/* Receipt Header */}
            <div className="border-b-2 border-[#4F6D7A] pb-4 mb-4">
              <div className="flex items-start justify-between gap-4">
                <img 
                  src={schoolInfo.logoUrl || '/school_logo.jpg'}
                  alt="Wisdom School Logo" 
                  className="w-20 h-20 rounded-full border-2 border-[#89A894] object-cover shrink-0" 
                />

                <div className="text-center flex-1">
                  <h2 className="text-xl font-black uppercase tracking-tight text-[#2D312E] font-serif">
                    {schoolInfo.name}
                  </h2>
                  <p className="text-xs font-bold text-[#89A894] tracking-wider">
                    {schoolInfo.tagline}
                  </p>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    {schoolInfo.address}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-[#6B7280] font-medium mt-1">
                    <span>Admin: <strong className="text-[#2D312E]">{schoolInfo.adminName}</strong></span>
                    <span>•</span>
                    <span>Ph: <strong className="text-[#2D312E]">{schoolInfo.phone}</strong></span>
                    <span>•</span>
                    <span>Email: {schoolInfo.email}</span>
                  </div>
                </div>

                <div className="w-20 shrink-0 text-right">
                  <span className="inline-block bg-[#4F6D7A] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                    OFFICIAL
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-[#E2E8E2] flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[#4F6D7A] bg-[#4F6D7A]/10 px-3 py-1 rounded border border-[#4F6D7A]/20">
                  FEE PAYMENT RECEIPT / PAID SLIP
                </span>
                <div className="text-right text-xs">
                  <span className="text-[#6B7280]">Receipt No: </span>
                  <strong className="font-mono text-[#2D312E]">{receipt.receiptNumber}</strong>
                </div>
              </div>
            </div>

            {/* Student & Payment Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-[#F2F4F2] p-3 rounded-lg border border-[#E2E8E2]">
              <div className="space-y-1">
                <div>
                  <span className="text-[#6B7280]">Student Name:</span>{' '}
                  <strong className="text-[#2D312E] font-semibold">{receipt.studentName}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Admission No:</span>{' '}
                  <strong className="font-mono text-[#2D312E]">{receipt.admissionNo}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Class & Section:</span>{' '}
                  <strong className="text-[#4F6D7A]">{receipt.standard} - Sec {receipt.section}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Parent / Guardian:</span>{' '}
                  <strong className="text-[#2D312E]">{receipt.parentName}</strong>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-[#6B7280]">Payment Date:</span>{' '}
                  <strong className="text-[#2D312E]">{receipt.date}</strong>
                </div>
                <div>
                  <span className="text-[#6B7280]">Payment Mode:</span>{' '}
                  <span className="inline-block px-2 py-0.5 bg-[#89A894]/20 text-[#4F6D7A] font-bold rounded">
                    {receipt.paymentMode}
                  </span>
                </div>
                {receipt.transactionReference && (
                  <div>
                    <span className="text-[#6B7280]">Ref / UTR:</span>{' '}
                    <strong className="font-mono text-[#2D312E]">{receipt.transactionReference}</strong>
                  </div>
                )}
                <div>
                  <span className="text-[#6B7280]">Parent Mobile:</span>{' '}
                  <strong className="text-[#2D312E]">{receipt.parentPhone}</strong>
                </div>
              </div>
            </div>

            {/* Itemized Fee Breakdown Table */}
            <table className="w-full text-xs border border-[#E2E8E2] mb-4">
              <thead>
                <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                  <th className="py-2 px-3 text-left w-12">#</th>
                  <th className="py-2 px-3 text-left">Fee Particulars</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E2]">
                {receipt.breakdown.tuition > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-[#6B7280]">1</td>
                    <td className="py-2 px-3 font-medium">Standard Tuition & Academic Fee ({receipt.standard})</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.tuition)}</td>
                  </tr>
                )}
                {receipt.breakdown.van > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-[#6B7280]">2</td>
                    <td className="py-2 px-3 font-medium">School Van / Transport Fee</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.van)}</td>
                  </tr>
                )}
                {receipt.breakdown.sports > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-[#6B7280]">3</td>
                    <td className="py-2 px-3 font-medium">Annual Sports & Physical Activities Fee</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.sports)}</td>
                  </tr>
                )}
                {receipt.breakdown.lateFee > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-[#6B7280]">4</td>
                    <td className="py-2 px-3 font-medium text-[#D68A6E]">Late Fee / Arrears Fine</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-[#D68A6E]">{formatCurrency(receipt.breakdown.lateFee)}</td>
                  </tr>
                )}
                {receipt.breakdown.other > 0 && (
                  <tr>
                    <td className="py-2 px-3 text-[#6B7280]">5</td>
                    <td className="py-2 px-3 font-medium">Exam & Study Materials</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.other)}</td>
                  </tr>
                )}
                <tr className="bg-[#F2F4F2] font-bold border-t-2 border-[#4F6D7A]/40">
                  <td colSpan={2} className="py-2.5 px-3 text-right text-[#2D312E] uppercase">
                    Total Amount Received
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#4F6D7A] text-sm font-extrabold">
                    {formatCurrency(receipt.amountPaid)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Amount In Words & Balances */}
            <div className="bg-[#89A894]/10 border border-[#89A894]/30 rounded p-2.5 text-xs mb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[#6B7280] uppercase text-[10px] font-bold block">Amount In Words:</span>
                  <span className="font-semibold text-[#2D312E] italic">
                    {numberToIndianWords(receipt.amountPaid)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[#6B7280] uppercase text-[10px] font-bold block">Remaining Pending Balance:</span>
                  <span className={`font-mono font-bold text-xs ${currentPending > 0 ? 'text-[#D68A6E]' : 'text-[#89A894]'}`}>
                    {currentPending > 0 ? formatCurrency(currentPending) : 'NIL (FULLY CLEARED)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Verification & Signatures */}
            <div className="grid grid-cols-3 gap-4 items-end pt-4 border-t border-[#E2E8E2] text-xs">
              <div className="flex flex-col items-center text-center">
                <UpiQrCode upiUrl={upiVerificationUrl} size={90} />
                <span className="text-[10px] text-[#6B7280] mt-1 font-mono">Scan for UPI Verification</span>
                <span className="text-[9px] text-[#6B7280]">{schoolInfo.upiId}</span>
              </div>

              <div className="text-center">
                <div className="h-12 flex items-center justify-center">
                  <div className="border border-dashed border-[#E2E8E2] px-3 py-1 text-[10px] text-[#6B7280] rounded uppercase">
                    School Seal Stamp
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-[#2D312E]">WISDOM SCHOOL ESSUR</p>
                <p className="text-[10px] text-[#6B7280]">Official Stamp</p>
              </div>

              <div className="text-right">
                <div className="h-10 flex items-end justify-end mb-1">
                  <span className="font-serif italic font-bold text-[#4F6D7A] text-sm underline decoration-[#89A894]">
                          {schoolInfo.adminName}
                  </span>
                </div>
                <p className="font-bold text-[#2D312E] text-xs">{schoolInfo.adminName}</p>
                <p className="text-[10px] text-[#6B7280]">School Admin & Authorized Signatory</p>
                <p className="text-[9px] text-[#6B7280]">Ph: {schoolInfo.phone}</p>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-dashed border-[#E2E8E2] text-center text-[10px] text-[#6B7280]">
              * This is a computer generated school fee receipt issued by {schoolInfo.name} Office, {schoolInfo.address}.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="no-print bg-[#F2F4F2] px-6 py-3 border-t border-[#E2E8E2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#6B7280]">
            UPI ID: <strong className="font-mono text-[#2D312E]">{schoolInfo.upiId}</strong> (GPay: {schoolInfo.gpayPhone})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp Receipt</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-[#E2E8E2] hover:bg-[#F7F8F6] text-[#2D312E] font-semibold rounded-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
