import React, { useState, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { PaymentReceipt, StandardClass, PaymentMode } from '../types';
import { formatCurrency, buildWhatsAppReceiptMessage, cleanPhoneNumber } from '../utils/formatters';
import { generateBulkReceiptsPdf } from '../utils/pdfGenerator';
import { 
  Receipt, 
  Search, 
  Printer, 
  MessageSquare, 
  Trash2, 
  Plus, 
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Edit,
  Download,
  CheckSquare,
  Square,
  FileText,
  Layers,
  X,
  Sparkles
} from 'lucide-react';
import { EditReceiptModal } from './EditReceiptModal';
import { ConsolidatedReceiptsPrintModal } from './ConsolidatedReceiptsPrintModal';

interface ReceiptsViewProps {
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onNewPayment: () => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  onViewReceipt,
  onNewPayment,
}) => {
  const { receipts, students, schoolInfo, classList, getStudentTotalFee, getStudentTotalPaid, deleteReceipt } = useSchool();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [receiptToEdit, setReceiptToEdit] = useState<PaymentReceipt | null>(null);

  // Multi-Selection State for Bulk Printing / PDF
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [showConsolidatedModal, setShowConsolidatedModal] = useState<boolean>(false);
  const [isBulkGeneratingPdf, setIsBulkGeneratingPdf] = useState<boolean>(false);
  const [bulkPdfSuccess, setBulkPdfSuccess] = useState<string | null>(null);
  const [bulkLayout, setBulkLayout] = useState<'single' | 'two_per_page'>('single');

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = 
      r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.parentPhone.includes(searchQuery) ||
      (r.transactionReference && r.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClass = selectedClass === 'all' || r.standard === selectedClass;
    const matchesMode = selectedMode === 'all' || r.paymentMode === selectedMode;

    return matchesSearch && matchesClass && matchesMode;
  });

  const selectedReceipts = receipts.filter(r => selectedReceiptIds.includes(r.id));
  const selectedTotal = selectedReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const allFilteredSelected = filteredReceipts.length > 0 && filteredReceipts.every(r => selectedReceiptIds.includes(r.id));
  const someFilteredSelected = filteredReceipts.some(r => selectedReceiptIds.includes(r.id)) && !allFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      // Deselect all filtered
      const filteredIdSet = new Set(filteredReceipts.map(r => r.id));
      setSelectedReceiptIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered
      const allFilteredIds = filteredReceipts.map(r => r.id);
      setSelectedReceiptIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const toggleSelectReceipt = (id: string) => {
    setSelectedReceiptIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedReceiptIds([]);
  };

  // Direct Bulk PDF download
  const handleDirectDownloadBulkPdf = () => {
    if (selectedReceipts.length === 0) return;
    setIsBulkGeneratingPdf(true);
    setBulkPdfSuccess(null);

    setTimeout(() => {
      try {
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

        const doc = generateBulkReceiptsPdf(
          selectedReceipts,
          schoolInfo,
          getStudentInfo,
          { layout: bulkLayout, includePendingBalance: true }
        );
        const filename = `Wisdom_School_Receipts_Consolidated_${selectedReceipts.length}_Receipts_${bulkLayout === 'two_per_page' ? 'Eco' : 'Standard'}.pdf`;
        doc.save(filename);
        setBulkPdfSuccess(`Downloaded ${filename} (${selectedReceipts.length} receipts)!`);
        setTimeout(() => setBulkPdfSuccess(null), 5000);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Could not generate PDF. Please use the Print preview modal option.');
      } finally {
        setIsBulkGeneratingPdf(false);
      }
    }, 100);
  };

  const handleDelete = (receipt: PaymentReceipt) => {
    if (window.confirm(`Delete receipt ${receipt.receiptNumber} (${formatCurrency(receipt.amountPaid)}) for ${receipt.studentName}? This will adjust the student balance.`)) {
      deleteReceipt(receipt.id);
      setSelectedReceiptIds(prev => prev.filter(id => id !== receipt.id));
    }
  };

  const handleWhatsApp = (receipt: PaymentReceipt) => {
    const student = students.find(s => s.id === receipt.studentId);
    const totalFee = student ? getStudentTotalFee(student) : receipt.amountPaid;
    const totalPaid = student ? getStudentTotalPaid(student.id) : receipt.amountPaid;
    const encoded = buildWhatsAppReceiptMessage(receipt, schoolInfo, totalFee, totalPaid);
    const phone = cleanPhoneNumber(receipt.parentPhone);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const totalCollectedInFilter = filteredReceipts.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Header and summary */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#4F6D7A]" />
              Fee Paid Slips & Receipt Register ({filteredReceipts.length})
            </h2>
            <p className="text-xs text-[#6B7280]">
              Select multiple payment records to generate consolidated multi-page PDF receipts for printing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Total In View</span>
              <span className="font-mono font-black text-[#89A894] text-sm">
                {formatCurrency(totalCollectedInFilter)}
              </span>
            </div>
            <button
              onClick={onNewPayment}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Payment</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8E2]/70">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by receipt no, student, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden"
            >
              <option value="all">All Standards ({classList.join(', ')})</option>
              {classList.map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden"
            >
              <option value="all">All Payment Modes</option>
              {(['GPay / UPI', 'Cash', 'Bank Transfer', 'Cheque'] as PaymentMode[]).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Notification Bar (When Receipts Are Selected) */}
      {selectedReceiptIds.length > 0 && (
        <div className="bg-[#4F6D7A] text-white p-3.5 rounded-xl shadow-md border border-[#415A65] flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <CheckSquare className="w-5 h-5 text-[#89A894]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">
                  {selectedReceipts.length} Payment {selectedReceipts.length === 1 ? 'Record' : 'Records'} Selected
                </span>
                <span className="bg-[#89A894] text-[#2D312E] text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                  Total: {formatCurrency(selectedTotal)}
                </span>
              </div>
              <p className="text-[11px] text-gray-200 mt-0.5">
                Generate a single consolidated PDF document with all {selectedReceipts.length} receipts for easy batch printing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Eco vs Full Page Layout Option */}
            <div className="flex items-center bg-white/15 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setBulkLayout('single')}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  bulkLayout === 'single' ? 'bg-white text-[#4F6D7A] shadow-xs' : 'text-gray-200 hover:text-white'
                }`}
                title="1 Full Official Voucher per A4 Sheet"
              >
                1 / Page
              </button>
              <button
                onClick={() => setBulkLayout('two_per_page')}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  bulkLayout === 'two_per_page' ? 'bg-white text-[#4F6D7A] shadow-xs' : 'text-gray-200 hover:text-white'
                }`}
                title="2 Eco Slips per A4 Sheet (Save Paper)"
              >
                2 / Page (Eco)
              </button>
            </div>

            {/* Print / Preview Consolidated Receipts */}
            <button
              onClick={() => setShowConsolidatedModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#4F6D7A] hover:bg-gray-100 font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Preview</span>
            </button>

            {/* Direct Consolidated PDF Download */}
            <button
              onClick={handleDirectDownloadBulkPdf}
              disabled={isBulkGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isBulkGeneratingPdf ? 'Generating...' : 'Download Consolidated PDF'}</span>
            </button>

            {/* Clear selection */}
            <button
              onClick={handleClearSelection}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success banner for PDF generation */}
      {bulkPdfSuccess && (
        <div className="bg-[#89A894]/20 border border-[#89A894]/40 rounded-lg p-3 text-xs text-[#2D312E] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#89A894]" />
            <span>{bulkPdfSuccess}</span>
          </div>
          <button 
            onClick={() => setBulkPdfSuccess(null)}
            className="text-[#6B7280] hover:text-[#2D312E]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Receipts Table with Multi-Selection */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2] uppercase tracking-wider">
              <tr>
                {/* Header Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="w-4 h-4 rounded text-[#4F6D7A] focus:ring-[#89A894] border-[#E2E8E2] cursor-pointer"
                    title={allFilteredSelected ? 'Deselect all visible receipts' : 'Select all visible receipts'}
                  />
                </th>
                <th className="py-3 px-4">Receipt # & Date</th>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Fee Breakdown</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]/60">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => {
                  const isSelected = selectedReceiptIds.includes(receipt.id);
                  return (
                    <tr 
                      key={receipt.id} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-[#89A894]/12 hover:bg-[#89A894]/18' 
                          : 'hover:bg-[#F7F8F6]/80'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectReceipt(receipt.id)}
                          className="w-4 h-4 rounded text-[#4F6D7A] focus:ring-[#89A894] border-[#E2E8E2] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#4F6D7A] text-xs">
                          {receipt.receiptNumber}
                        </div>
                        <div className="text-[#6B7280] text-[11px] mt-0.5">
                          {receipt.date}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2D312E] text-xs">{receipt.studentName}</div>
                        <div className="text-[#6B7280] text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-[#F2F4F2] px-1 py-0.2 rounded border border-[#E2E8E2]">{receipt.admissionNo}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#4F6D7A]">{receipt.standard}-{receipt.section}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-[#2D312E] space-x-1.5">
                          {receipt.breakdown.tuition > 0 && <span>Tuition: ₹{receipt.breakdown.tuition}</span>}
                          {receipt.breakdown.van > 0 && <span className="text-[#4F6D7A] font-medium">Van: ₹{receipt.breakdown.van}</span>}
                          {receipt.breakdown.sports > 0 && <span className="text-[#4F6D7A] font-medium">Sports: ₹{receipt.breakdown.sports}</span>}
                          {receipt.breakdown.lateFee > 0 && <span className="text-[#D68A6E] font-medium">Late: ₹{receipt.breakdown.lateFee}</span>}
                        </div>
                        {receipt.notes && (
                          <div className="text-[10px] text-[#6B7280] italic mt-0.5">{receipt.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          receipt.paymentMode === 'GPay / UPI' 
                            ? 'bg-[#89A894]/15 text-[#4F6D7A] border border-[#89A894]/30' 
                            : 'bg-[#F2F4F2] text-[#2D312E] border border-[#E2E8E2]'
                        }`}>
                          {receipt.paymentMode === 'GPay / UPI' && <QrCode className="w-3 h-3 text-[#89A894]" />}
                          {receipt.paymentMode === 'Cash' && <Banknote className="w-3 h-3 text-[#6B7280]" />}
                          {receipt.paymentMode}
                        </span>
                        {receipt.transactionReference && (
                          <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                            {receipt.transactionReference}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-extrabold text-[#89A894] text-sm">
                          {formatCurrency(receipt.amountPaid)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewReceipt(receipt)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-bold rounded text-[11px] border border-[#E2E8E2] transition-colors cursor-pointer"
                            title="View & Print Individual Official PDF Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>Print Slip</span>
                          </button>

                          <button
                            onClick={() => handleWhatsApp(receipt)}
                            className="p-1.5 bg-[#89A894]/15 hover:bg-[#89A894]/25 text-[#4F6D7A] rounded border border-[#89A894]/30 transition-colors cursor-pointer"
                            title="Send Receipt on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setReceiptToEdit(receipt)}
                            className="p-1.5 text-[#6B7280] hover:text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Receipt Information & Amounts"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(receipt)}
                            className="p-1.5 text-[#6B7280] hover:text-[#D68A6E] hover:bg-[#D68A6E]/10 rounded transition-colors cursor-pointer"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#6B7280]">
                    No fee receipts match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Quick Select in Table */}
        <div className="bg-[#F2F4F2] px-4 py-2.5 border-t border-[#E2E8E2] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
          <div className="flex items-center gap-3">
            <span>Showing {filteredReceipts.length} of {receipts.length} receipts</span>
            {filteredReceipts.length > 0 && (
              <button
                onClick={toggleSelectAllFiltered}
                className="text-[#4F6D7A] hover:underline font-semibold cursor-pointer"
              >
                {allFilteredSelected ? 'Deselect All Filtered' : `Select All Filtered (${filteredReceipts.length})`}
              </button>
            )}
            {selectedReceiptIds.length > 0 && (
              <button
                onClick={handleClearSelection}
                className="text-[#D68A6E] hover:underline font-semibold cursor-pointer"
              >
                Clear Selection ({selectedReceiptIds.length})
              </button>
            )}
          </div>

          <div className="font-medium text-[#2D312E]">
            {selectedReceiptIds.length > 0 ? (
              <span>Selected: <strong className="text-[#89A894] font-mono">{formatCurrency(selectedTotal)}</strong> ({selectedReceiptIds.length} records)</span>
            ) : (
              <span>Tip: Check the boxes on the left to select and generate a combined PDF of receipts</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Receipt Modal */}
      {receiptToEdit && (
        <EditReceiptModal
          receipt={receiptToEdit}
          onClose={() => setReceiptToEdit(null)}
          onViewSlip={onViewReceipt}
        />
      )}

      {/* Consolidated Receipts Print & PDF Export Modal */}
      {showConsolidatedModal && selectedReceipts.length > 0 && (
        <ConsolidatedReceiptsPrintModal
          receipts={selectedReceipts}
          onClose={() => setShowConsolidatedModal(false)}
        />
      )}

    </div>
  );
};

