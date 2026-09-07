import React, { useState } from 'react';
import { PaymentReceipt, PaymentMode, FeeCategory } from '../types';
import { useSchool } from '../context/SchoolContext';
import { formatCurrency } from '../utils/formatters';
import { 
  X, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Trash2, 
  Printer, 
  Check, 
  AlertCircle, 
  User,
  QrCode,
  Banknote
} from 'lucide-react';

interface EditReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
  onViewSlip?: (receipt: PaymentReceipt) => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  receipt,
  onClose,
  onViewSlip,
}) => {
  const { updateReceipt, deleteReceipt, schoolInfo } = useSchool();

  const [date, setDate] = useState<string>(receipt.date);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(receipt.paymentMode);
  const [transactionReference, setTransactionReference] = useState<string>(receipt.transactionReference || '');
  const [category, setCategory] = useState<FeeCategory>(receipt.category || 'Tuition');
  
  // Breakdown
  const [tuition, setTuition] = useState<number>(receipt.breakdown?.tuition || 0);
  const [van, setVan] = useState<number>(receipt.breakdown?.van || 0);
  const [sports, setSports] = useState<number>(receipt.breakdown?.sports || 0);
  const [lateFee, setLateFee] = useState<number>(receipt.breakdown?.lateFee || 0);
  const [other, setOther] = useState<number>(receipt.breakdown?.other || 0);

  const [notes, setNotes] = useState<string>(receipt.notes || '');
  const [collectedBy, setCollectedBy] = useState<string>(receipt.collectedBy || `${schoolInfo.adminName} - Admin`);

  // Calculated total amount
  const computedTotal = tuition + van + sports + lateFee + other;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (computedTotal <= 0) {
      alert('Total receipt fee payment must be greater than ₹0.');
      return;
    }

    const updatedReceipt: PaymentReceipt = {
      ...receipt,
      date,
      paymentMode,
      transactionReference: transactionReference.trim() || undefined,
      category,
      breakdown: {
        tuition,
        van,
        sports,
        lateFee,
        other,
      },
      amountPaid: computedTotal,
      notes: notes.trim() || undefined,
      collectedBy: collectedBy.trim() || receipt.collectedBy,
    };

    updateReceipt(receipt.id, updatedReceipt);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to permanently delete receipt ${receipt.receiptNumber} (${formatCurrency(receipt.amountPaid)}) for ${receipt.studentName}?\n\nThis will re-add this amount to the student's pending dues balance.`)) {
      deleteReceipt(receipt.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E2E8E2] space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#89A894]/20 text-[#4F6D7A] rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
                Edit Payment Receipt
                <span className="font-mono text-xs text-[#4F6D7A] bg-[#F2F4F2] px-2 py-0.5 rounded border border-[#E2E8E2]">
                  {receipt.receiptNumber}
                </span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                Modify payment breakdown, date, payment mode, or reference number
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Summary Banner */}
        <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E2E8E2] flex items-center justify-center font-bold text-[#4F6D7A]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[#2D312E] text-sm">{receipt.studentName}</div>
              <div className="text-[#6B7280] text-[11px] flex items-center gap-2">
                <span>Adm: <strong className="font-mono text-[#2D312E]">{receipt.admissionNo}</strong></span>
                <span>•</span>
                <span>Class: <strong className="text-[#4F6D7A]">{receipt.standard}-{receipt.section}</strong></span>
                <span>•</span>
                <span>Parent: <strong>{receipt.parentName}</strong></span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#6B7280] block uppercase font-bold">Original Amount</span>
            <span className="font-mono font-bold text-[#4F6D7A] text-sm">
              {formatCurrency(receipt.amountPaid)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Date & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Receipt Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894] cursor-pointer"
              >
                <option value="GPay / UPI">GPay / UPI (PhonePe / Paytm)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Transaction Reference & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Transaction / UTR Reference
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. UPI Ref # 421839210082"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-mono outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Fee Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeeCategory)}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894] cursor-pointer"
              >
                <option value="Tuition">Tuition Fee</option>
                <option value="Van">Van Transport Fee</option>
                <option value="Sports">Sports & Activity Fee</option>
                <option value="Mixed">Combined / Mixed Fee</option>
                <option value="Other">Other / Admission / Misc</option>
              </select>
            </div>
          </div>

          {/* Fee Itemization Breakdown */}
          <div className="bg-[#FDFDFB] border border-[#E2E8E2] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-2">
              <span className="font-bold text-[#2D312E] uppercase text-[11px] tracking-wider">
                Fee Component Breakdown (₹)
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Amounts allocated to this receipt
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                  Tuition Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={tuition}
                  onChange={(e) => setTuition(Number(e.target.value) || 0)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-white font-mono font-bold text-[#2D312E] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                  Van Transport Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={van}
                  onChange={(e) => setVan(Number(e.target.value) || 0)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-white font-mono font-bold text-[#4F6D7A] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                  Sports / Activity
                </label>
                <input
                  type="number"
                  min="0"
                  value={sports}
                  onChange={(e) => setSports(Number(e.target.value) || 0)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-white font-mono font-bold text-[#4F6D7A] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                  Late Fine / Arrear
                </label>
                <input
                  type="number"
                  min="0"
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value) || 0)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-white font-mono font-bold text-[#D68A6E] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B7280] font-semibold mb-1">
                  Other / Misc Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={other}
                  onChange={(e) => setOther(Number(e.target.value) || 0)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2 bg-white font-mono font-bold text-[#2D312E] outline-hidden focus:ring-1 focus:ring-[#89A894]"
                />
              </div>

              <div className="bg-[#89A894]/10 border border-[#89A894]/30 rounded-lg p-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-[#4F6D7A]">
                  New Total Amount
                </span>
                <span className="font-mono font-black text-base text-[#4F6D7A]">
                  {formatCurrency(computedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Collected By & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Cashier / Collected By
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#2D312E] mb-1">
                Receipt Remarks / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Term 1 partial payment"
                className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8E2]">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition-colors cursor-pointer border border-rose-200"
              title="Delete this payment receipt"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Receipt</span>
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              {onViewSlip && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewSlip(receipt);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] font-semibold rounded-lg transition-colors border border-[#E2E8E2] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E2E8E2] rounded-lg text-[#6B7280] hover:bg-[#F2F4F2] font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
