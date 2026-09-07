import React, { useState, useRef } from 'react';
import { PaymentReceipt } from '../types';
import { useSchool } from '../context/SchoolContext';
import { 
  formatCurrency, 
  formatNumber, 
  numberToIndianWords, 
  generateUpiUrl 
} from '../utils/formatters';
import { generateBulkReceiptsPdf } from '../utils/pdfGenerator';
import { UpiQrCode } from './UpiQrCode';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Receipt, 
  Layers, 
  FileText,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles
} from 'lucide-react';

interface ConsolidatedReceiptsPrintModalProps {
  receipts: PaymentReceipt[];
  onClose: () => void;
}

export const ConsolidatedReceiptsPrintModal: React.FC<ConsolidatedReceiptsPrintModalProps> = ({
  receipts,
  onClose,
}) => {
  const { schoolInfo, students, getStudentTotalFee, getStudentTotalPaid } = useSchool();
  const [layoutMode, setLayoutMode] = useState<'single' | 'two_per_page'>('single');
  const [includeBalances, setIncludeBalances] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'all' | 'paged'>('all');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Student summary getter for each receipt
  const getStudentInfo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return undefined;
    const totalFee = getStudentTotalFee(student);
    const totalPaid = getStudentTotalPaid(student.id);
    return {
      totalFee,
      totalPaid,
      pendingFee: Math.max(0, totalFee - totalPaid),
    };
  };

  const totalAmount = receipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadSuccess(null);

    setTimeout(() => {
      try {
        const doc = generateBulkReceiptsPdf(
          receipts,
          schoolInfo,
          getStudentInfo,
          { layout: layoutMode, includePendingBalance: includeBalances }
        );
        const filename = `Wisdom_School_Receipts_Consolidated_${receipts.length}_Receipts_${layoutMode === 'two_per_page' ? 'Eco' : 'Standard'}.pdf`;
        doc.save(filename);
        setDownloadSuccess(`Downloaded consolidated PDF (${receipts.length} receipts)!`);
        setTimeout(() => setDownloadSuccess(null), 4000);
      } catch (err) {
        console.error('Failed to generate consolidated PDF:', err);
        alert('Could not generate PDF. You can use the browser Print option as a direct fallback.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  if (receipts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2D312E]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="no-print bg-[#2D312E] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#4F6D7A] rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Consolidated Fee Receipts Print & PDF Export
                <span className="bg-[#89A894] text-[#2D312E] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {receipts.length} {receipts.length === 1 ? 'Receipt' : 'Receipts'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-300">
                Combined Total: <strong className="text-[#89A894] font-mono">{formatCurrency(totalAmount)}</strong> | Official Wisdom School Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls & Format Selector Toolbar (Hidden on Print) */}
        <div className="no-print bg-[#F2F4F2] px-5 py-2.5 border-b border-[#E2E8E2] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Layout Mode Selector */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-[#E2E8E2]">
              <span className="text-[11px] font-bold text-[#6B7280]">Print Layout:</span>
              <button
                onClick={() => setLayoutMode('single')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  layoutMode === 'single'
                    ? 'bg-[#4F6D7A] text-white'
                    : 'text-[#6B7280] hover:text-[#2D312E]'
                }`}
              >
                1 Slip / Page (Full)
              </button>
              <button
                onClick={() => setLayoutMode('two_per_page')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  layoutMode === 'two_per_page'
                    ? 'bg-[#4F6D7A] text-white'
                    : 'text-[#6B7280] hover:text-[#2D312E]'
                }`}
              >
                2 Slips / Page (Eco)
              </button>
            </div>

            {/* Pending Balance Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[#2D312E] select-none text-[11px]">
              <input
                type="checkbox"
                checked={includeBalances}
                onChange={(e) => setIncludeBalances(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#4F6D7A] focus:ring-[#89A894] border-[#E2E8E2]"
              />
              <span className="font-medium">Show Student Pending Balances</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Browser Print Button */}
            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#4F6D7A] hover:bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Print all selected receipts using system print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All ({receipts.length})</span>
            </button>

            {/* Download Merged PDF via jsPDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download consolidated PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Merged PDF'}</span>
            </button>
          </div>
        </div>

        {/* Download Success Notice */}
        {downloadSuccess && (
          <div className="no-print bg-[#89A894]/20 border-b border-[#89A894]/40 px-5 py-2 text-xs text-[#2D312E] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#89A894]" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* Preview Scrollable Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#F7F8F6] flex-1">
          <div ref={printContainerRef} className="printable-document space-y-6 max-w-3xl mx-auto">
            {receipts.map((receipt, index) => {
              const student = students.find(s => s.id === receipt.studentId);
              const totalFee = student ? getStudentTotalFee(student) : receipt.amountPaid;
              const totalPaid = student ? getStudentTotalPaid(student.id) : receipt.amountPaid;
              const currentPending = Math.max(0, totalFee - totalPaid);
              const upiVerificationUrl = generateUpiUrl(
                schoolInfo, 
                receipt.amountPaid, 
                receipt.studentName, 
                receipt.receiptNumber
              );

              return (
                <div 
                  key={receipt.id}
                  className="print-page-break print-avoid-break bg-white border-2 border-[#E2E8E2] rounded-lg p-6 text-[#2D312E] shadow-xs relative"
                >
                  {/* Watermark Logo in background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
                    <img src={schoolInfo.logoUrl || '/school_logo.jpg'} alt="" className="w-64 h-64 object-contain" />
                  </div>

                  {/* Receipt Header */}
                  <div className="border-b-2 border-[#4F6D7A] pb-3.5 mb-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <img 
                        src={schoolInfo.logoUrl || '/school_logo.jpg'}
                        alt="Wisdom School Logo" 
                        className="w-16 h-16 rounded-full border-2 border-[#89A894] object-cover shrink-0" 
                      />

                      <div className="text-center flex-1">
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#2D312E] font-serif">
                          {schoolInfo.name}
                        </h2>
                        <p className="text-[11px] font-bold text-[#89A894] tracking-wider">
                          {schoolInfo.tagline}
                        </p>
                        <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">
                          {schoolInfo.address}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] text-[#6B7280] font-medium mt-0.5">
                          <span>Admin: <strong className="text-[#2D312E]">{schoolInfo.adminName}</strong></span>
                          <span>•</span>
                          <span>Ph: <strong className="text-[#2D312E]">{schoolInfo.phone}</strong></span>
                          <span>•</span>
                          <span>Email: {schoolInfo.email}</span>
                        </div>
                      </div>

                      <div className="w-20 shrink-0 text-right">
                        <span className="inline-block bg-[#4F6D7A] text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                          OFFICIAL
                        </span>
                        <div className="text-[9px] text-[#6B7280] mt-1 font-mono">
                          #{index + 1} of {receipts.length}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dashed border-[#E2E8E2] flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#4F6D7A] bg-[#4F6D7A]/10 px-2.5 py-0.5 rounded border border-[#4F6D7A]/20">
                        FEE PAYMENT RECEIPT / PAID SLIP
                      </span>
                      <div className="text-right text-xs">
                        <span className="text-[#6B7280]">Receipt No: </span>
                        <strong className="font-mono text-[#2D312E] font-bold">{receipt.receiptNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Student & Payment Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3.5 bg-[#F2F4F2] p-3 rounded-lg border border-[#E2E8E2]">
                    <div className="space-y-1">
                      <div>
                        <span className="text-[#6B7280]">Student Name:</span>{' '}
                        <strong className="text-[#2D312E] font-bold">{receipt.studentName}</strong>
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
                  <table className="w-full text-xs border border-[#E2E8E2] mb-3.5">
                    <thead>
                      <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                        <th className="py-1.5 px-3 text-left w-10">#</th>
                        <th className="py-1.5 px-3 text-left">Fee Particulars</th>
                        <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8E2]">
                      {receipt.breakdown.tuition > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 text-[#6B7280]">1</td>
                          <td className="py-1.5 px-3 font-medium">Standard Tuition & Academic Fee ({receipt.standard})</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.tuition)}</td>
                        </tr>
                      )}
                      {receipt.breakdown.van > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 text-[#6B7280]">2</td>
                          <td className="py-1.5 px-3 font-medium">School Van / Transport Fee</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.van)}</td>
                        </tr>
                      )}
                      {receipt.breakdown.sports > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 text-[#6B7280]">3</td>
                          <td className="py-1.5 px-3 font-medium">Annual Sports & Physical Activities Fee</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.sports)}</td>
                        </tr>
                      )}
                      {receipt.breakdown.lateFee > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 text-[#6B7280]">4</td>
                          <td className="py-1.5 px-3 font-medium text-[#D68A6E]">Late Fee / Arrears Fine</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-[#D68A6E]">{formatCurrency(receipt.breakdown.lateFee)}</td>
                        </tr>
                      )}
                      {receipt.breakdown.other > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 text-[#6B7280]">5</td>
                          <td className="py-1.5 px-3 font-medium">Exam & Study Materials</td>
                          <td className="py-1.5 px-3 text-right font-mono font-semibold">{formatCurrency(receipt.breakdown.other)}</td>
                        </tr>
                      )}
                      <tr className="bg-[#F2F4F2] font-bold border-t-2 border-[#4F6D7A]/40">
                        <td colSpan={2} className="py-2 px-3 text-right text-[#2D312E] uppercase">
                          Total Amount Received
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#4F6D7A] text-sm font-extrabold">
                          {formatCurrency(receipt.amountPaid)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Amount In Words & Balances */}
                  <div className="bg-[#89A894]/10 border border-[#89A894]/30 rounded p-2.5 text-xs mb-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[#6B7280] uppercase text-[10px] font-bold block">Amount In Words:</span>
                        <span className="font-semibold text-[#2D312E] italic">
                          {numberToIndianWords(receipt.amountPaid)}
                        </span>
                      </div>
                      {includeBalances && (
                        <div className="text-right shrink-0">
                          <span className="text-[#6B7280] uppercase text-[10px] font-bold block">Remaining Pending Balance:</span>
                          <span className={`font-mono font-bold text-xs ${currentPending > 0 ? 'text-[#D68A6E]' : 'text-[#89A894]'}`}>
                            {currentPending > 0 ? formatCurrency(currentPending) : 'NIL (FULLY CLEARED)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Verification & Signatures */}
                  <div className="grid grid-cols-3 gap-4 items-end pt-3 border-t border-[#E2E8E2] text-xs">
                    <div className="flex flex-col items-center text-center">
                      <UpiQrCode upiUrl={upiVerificationUrl} size={76} />
                      <span className="text-[9px] text-[#6B7280] mt-1 font-mono">UPI Verification</span>
                      <span className="text-[8px] text-[#6B7280]">{schoolInfo.upiId}</span>
                    </div>

                    <div className="text-center">
                      <div className="h-10 flex items-center justify-center">
                        <div className="border border-dashed border-[#E2E8E2] px-3 py-1 text-[9px] text-[#6B7280] rounded uppercase">
                          School Seal Stamp
                        </div>
                      </div>
                      <p className="text-[10px] font-semibold text-[#2D312E]">WISDOM SCHOOL ESSUR</p>
                      <p className="text-[9px] text-[#6B7280]">Official Stamp</p>
                    </div>

                    <div className="text-right">
                      <div className="h-8 flex items-end justify-end mb-0.5">
                        <span className="font-serif italic font-bold text-[#4F6D7A] text-xs underline decoration-[#89A894]">
                          R. Saravanan
                        </span>
                      </div>
                      <p className="font-bold text-[#2D312E] text-xs">{schoolInfo.adminName}</p>
                      <p className="text-[9px] text-[#6B7280]">School Admin & Authorized Signatory</p>
                      <p className="text-[8px] text-[#6B7280]">Ph: {schoolInfo.phone}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-[#E2E8E2] text-center text-[9px] text-[#6B7280]">
                    * This is a computer generated school fee receipt issued by Wisdom Nursery & Primary School Office, Essur - 603301. [Document {index + 1} of {receipts.length}]
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on Print) */}
        <div className="no-print bg-[#F2F4F2] px-5 py-3 border-t border-[#E2E8E2] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <span className="font-semibold text-[#2D312E]">{receipts.length} Receipts</span> ready for printing or download.
            <span>•</span>
            <span>Total Collection: <strong className="text-[#89A894] font-mono">{formatCurrency(totalAmount)}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#4F6D7A] hover:bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Receipts</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Consolidated PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E2E8E2] hover:bg-[#F7F8F6] text-[#2D312E] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
