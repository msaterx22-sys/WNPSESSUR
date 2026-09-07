import React, { useState, useMemo, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SchoolExpense, ExpenseCategory, PaymentMode } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  Wallet, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Calendar, 
  Filter, 
  Tag, 
  FileText, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  Eye, 
  TrendingDown, 
  Receipt,
  Download,
  Building2,
  Bus,
  Users,
  Edit,
  Check
} from 'lucide-react';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Staff Salary & Wages',
  'Van Fuel & Maintenance',
  'Electricity & Utilities',
  'Stationery, Books & Printing',
  'Sports & Cultural Events',
  'Building & Maintenance',
  'RTE & Govt Documentation',
  'Refreshments & Food',
  'Other / Miscellaneous',
];

const PAYMENT_MODES: PaymentMode[] = [
  'Cash',
  'GPay / UPI',
  'Bank Transfer',
  'Cheque'
];

export const ExpensesView: React.FC = () => {
  const { 
    expenses, 
    addExpense, 
    updateExpense,
    deleteExpense, 
    schoolInfo, 
    stats 
  } = useSchool();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all'); // 'all', 'this-month', 'last-month'

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SchoolExpense | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<SchoolExpense | null>(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Staff Salary & Wages');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file for the bill / receipt.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResetForm = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('Staff Salary & Wages');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Cash');
    setPaidTo('');
    setReceiptImage(undefined);
    setNotes('');
  };

  const handleOpenEditExpense = (expense: SchoolExpense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setCategory(expense.category);
    setAmount(expense.amount);
    setDate(expense.date);
    setPaymentMode(expense.paymentMode);
    setPaidTo(expense.paidTo);
    setReceiptImage(expense.receiptImage);
    setNotes(expense.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0 || !paidTo.trim()) {
      alert('Please fill in title, amount, and recipient name.');
      return;
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: title.trim(),
        category,
        amount: Number(amount),
        date,
        paymentMode,
        paidTo: paidTo.trim(),
        receiptImage,
        notes: notes.trim() || undefined,
      });
    } else {
      addExpense({
        title: title.trim(),
        category,
        amount: Number(amount),
        date,
        paymentMode,
        paidTo: paidTo.trim(),
        receiptImage,
        notes: notes.trim() || undefined,
      });
    }

    handleResetForm();
    setIsAddModalOpen(false);
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    return expenses.filter(exp => {
      const matchesSearch = 
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
      const matchesMode = selectedPaymentMode === 'all' || exp.paymentMode === selectedPaymentMode;

      let matchesDate = true;
      if (dateRange === 'this-month') {
        matchesDate = exp.date.startsWith(currentMonth);
      } else if (dateRange === 'last-month') {
        matchesDate = exp.date.startsWith(prevMonth);
      }

      return matchesSearch && matchesCat && matchesMode && matchesDate;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMode, dateRange]);

  // Totals
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalAllExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netCashFlow = stats.totalCollected - totalAllExpenses;

  const handlePrintVoucher = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Stats */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E2]/70 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#4F6D7A]" />
              School Expense & Expenditure Register
            </h2>
            <p className="text-xs text-[#6B7280]">
              Track staff salaries, van diesel, electricity, repairs, and bill receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleResetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Expense</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-3">
            <span className="text-[11px] text-[#6B7280] font-medium block flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#D68A6E]" />
              Total Expenses
            </span>
            <strong className="text-base font-mono font-black text-[#D68A6E]">
              {formatCurrency(totalAllExpenses)}
            </strong>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">
              {expenses.length} vouchers recorded
            </span>
          </div>

          <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-3">
            <span className="text-[11px] text-[#6B7280] font-medium block flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-[#89A894]" />
              Fee Collected
            </span>
            <strong className="text-base font-mono font-black text-[#4F6D7A]">
              {formatCurrency(stats.totalCollected)}
            </strong>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">
              Total revenue from fees
            </span>
          </div>

          <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-3">
            <span className="text-[11px] text-[#6B7280] font-medium block flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-[#4F6D7A]" />
              Net School Balance
            </span>
            <strong className={`text-base font-mono font-black ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(netCashFlow)}
            </strong>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">
              Fee Collections minus Expenses
            </span>
          </div>

          <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-3">
            <span className="text-[11px] text-[#6B7280] font-medium block flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-[#D68A6E]" />
              Van Fuel & Care
            </span>
            <strong className="text-base font-mono font-black text-[#2D312E]">
              {formatCurrency(
                expenses
                  .filter(e => e.category === 'Van Fuel & Maintenance')
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </strong>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">
              Transport operations
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search title, paid to, voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden text-xs"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Expense Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="w-full py-2 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Payment Modes</option>
              {PAYMENT_MODES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full py-2 px-3 border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] outline-hidden text-xs cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
          <span>Showing <strong>{filteredExpenses.length}</strong> vouchers</span>
          <span>Filtered Total: <strong className="font-mono text-[#D68A6E] font-bold">{formatCurrency(totalFilteredAmount)}</strong></span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F2F4F2] border-b border-[#E2E8E2] text-[#2D312E] font-bold">
              <tr>
                <th className="p-3">Voucher No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Expense Title & Details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Paid To</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Receipt</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]/70 text-[#2D312E]">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-[#FDFDFB] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#4F6D7A]">
                      {expense.voucherNo}
                    </td>
                    <td className="p-3 text-[#6B7280]">
                      {expense.date}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#2D312E]">{expense.title}</div>
                      {expense.notes && (
                        <div className="text-[10px] text-[#6B7280] truncate max-w-xs">{expense.notes}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#4F6D7A]/10 text-[#4F6D7A] font-semibold px-2 py-0.5 rounded text-[11px]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      {expense.paidTo}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#F2F4F2] text-[#2D312E] px-2 py-0.5 rounded text-[11px] border border-[#E2E8E2]">
                        {expense.paymentMode}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-[#D68A6E]">
                      ₹{formatNumber(expense.amount)}
                    </td>
                    <td className="p-3 text-center">
                      {expense.receiptImage ? (
                        <button
                          onClick={() => setViewingReceiptImage(expense.receiptImage || null)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#4F6D7A] hover:text-[#33464F] font-semibold underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#6B7280] italic">None</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveVoucher(expense)}
                          className="p-1.5 hover:bg-[#F2F4F2] text-[#4F6D7A] rounded-md transition-colors cursor-pointer"
                          title="Print official payment voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditExpense(expense)}
                          className="p-1.5 hover:bg-[#F2F4F2] text-[#6B7280] hover:text-[#4F6D7A] rounded-md transition-colors cursor-pointer"
                          title="Edit expense voucher details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete voucher ${expense.voucherNo} (${expense.title} - ₹${formatNumber(expense.amount)})?`)) {
                              deleteExpense(expense.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Delete expense voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#6B7280] italic">
                    No expense records matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record or Edit Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8E2] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <h3 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
                {editingExpense ? (
                  <>
                    <Edit className="w-5 h-5 text-[#4F6D7A]" />
                    <span>Edit School Expense ({editingExpense.voucherNo})</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#4F6D7A]" />
                    <span>Record New School Expense</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  handleResetForm();
                  setIsAddModalOpen(false);
                }}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              
              {/* Expense Title */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">
                  Expense Title / Purpose *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Van Diesel & Engine Oil, Teacher July Salary, Annual Day Banners"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-semibold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                  required
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894] cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 4500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    min="1"
                    className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#D68A6E] font-mono font-bold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                    required
                  />
                </div>
              </div>

              {/* Paid To & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">
                    Paid To / Vendor / Person *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Balaji Fuels, R. Murugan (Driver)"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-semibold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894] cursor-pointer"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">
                  Voucher / Payment Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] font-semibold outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                  required
                />
              </div>

              {/* Bill / Receipt Image Upload */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">
                  Bill / Voucher Receipt Image (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {receiptImage ? (
                  <div className="relative inline-block mt-1">
                    <img
                      src={receiptImage}
                      alt="Receipt preview"
                      className="w-24 h-24 object-cover rounded-lg border border-[#E2E8E2] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(undefined)}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#89A894] rounded-lg p-3 bg-[#F2F4F2]/50 hover:bg-[#F2F4F2] text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-[#4F6D7A]" />
                    <span className="font-semibold text-[#4F6D7A]">Upload Bill or Voucher Photo</span>
                    <span className="text-[10px] text-[#6B7280]">Supports JPG, PNG, WebP bills</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional bill reference number, check details, or remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#E2E8E2] rounded-lg p-2.5 bg-[#FDFDFB] text-[#2D312E] outline-hidden focus:bg-white focus:ring-2 focus:ring-[#89A894]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2E8E2]">
                {editingExpense ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete voucher ${editingExpense.voucherNo} (${editingExpense.title})?`)) {
                        deleteExpense(editingExpense.id);
                        handleResetForm();
                        setIsAddModalOpen(false);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg font-bold transition-colors cursor-pointer border border-rose-200"
                    title="Delete this expense voucher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Voucher</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetForm();
                      setIsAddModalOpen(false);
                    }}
                    className="px-4 py-2 border border-[#E2E8E2] rounded-lg text-[#6B7280] hover:bg-[#F2F4F2] font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingExpense ? 'Save Changes' : 'Save Voucher'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable Official Expense Voucher */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="no-print flex items-center justify-between border-b border-[#E2E8E2] pb-3">
              <span className="text-xs font-bold text-[#4F6D7A]">
                Voucher #{activeVoucher.voucherNo}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintVoucher}
                  className="flex items-center gap-1.5 bg-[#4F6D7A] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#415A65] cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setActiveVoucher(null)}
                  className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="printable-document border-2 border-[#2D312E] rounded-xl p-6 bg-white text-[#2D312E] space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#2D312E] pb-3">
                <img
                  src={schoolInfo.logoUrl || '/school_logo.jpg'}
                  alt="Wisdom School"
                  className="w-14 h-14 rounded-full border-2 border-amber-600 object-cover shrink-0"
                />
                <div className="text-center flex-1 px-2">
                  <h1 className="text-base font-black uppercase tracking-wide font-serif text-[#2D312E]">
                    {schoolInfo.name}
                  </h1>
                  <p className="text-[11px] font-bold text-amber-800">
                    {schoolInfo.address}
                  </p>
                  <p className="text-[10px] text-[#6B7280]">
                    Ph: {schoolInfo.phone} • Admin: {schoolInfo.adminName}
                  </p>
                  <div className="mt-1">
                    <span className="bg-[#2D312E] text-white text-[10px] font-bold px-3 py-0.5 rounded tracking-widest uppercase">
                      OFFICIAL PAYMENT & DEBIT VOUCHER
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="font-bold text-[#4F6D7A]">{activeVoucher.voucherNo}</div>
                  <div className="text-[10px] text-[#6B7280]">Date: {activeVoucher.date}</div>
                </div>
              </div>

              {/* Voucher Details */}
              <table className="w-full text-xs border border-[#E2E8E2] text-left">
                <tbody>
                  <tr className="border-b border-[#E2E8E2]">
                    <th className="p-2.5 bg-[#F2F4F2] w-32 font-bold">Paid To (Vendor/Person)</th>
                    <td className="p-2.5 font-bold text-sm text-[#2D312E]">{activeVoucher.paidTo}</td>
                  </tr>
                  <tr className="border-b border-[#E2E8E2]">
                    <th className="p-2.5 bg-[#F2F4F2] font-bold">Expense Head / Category</th>
                    <td className="p-2.5 font-semibold text-[#4F6D7A]">{activeVoucher.category}</td>
                  </tr>
                  <tr className="border-b border-[#E2E8E2]">
                    <th className="p-2.5 bg-[#F2F4F2] font-bold">Purpose / Particulars</th>
                    <td className="p-2.5 font-bold">{activeVoucher.title}</td>
                  </tr>
                  <tr className="border-b border-[#E2E8E2]">
                    <th className="p-2.5 bg-[#F2F4F2] font-bold">Payment Mode</th>
                    <td className="p-2.5">{activeVoucher.paymentMode}</td>
                  </tr>
                  {activeVoucher.notes && (
                    <tr className="border-b border-[#E2E8E2]">
                      <th className="p-2.5 bg-[#F2F4F2] font-bold">Notes / Ref</th>
                      <td className="p-2.5 text-[#6B7280]">{activeVoucher.notes}</td>
                    </tr>
                  )}
                  <tr className="bg-[#F2F4F2]/70">
                    <th className="p-2.5 font-black text-sm">TOTAL AMOUNT PAID</th>
                    <td className="p-2.5 font-mono font-black text-base text-[#D68A6E]">
                      {formatCurrency(activeVoucher.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Receipt Image Thumbnail if exists */}
              {activeVoucher.receiptImage && (
                <div className="border border-[#E2E8E2] rounded-lg p-2">
                  <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Attached Bill / Receipt:</span>
                  <img
                    src={activeVoucher.receiptImage}
                    alt="Receipt Bill"
                    className="max-h-40 object-contain rounded border border-[#E2E8E2]"
                  />
                </div>
              )}

              {/* Signatures */}
              <div className="flex items-center justify-between border-t-2 border-[#2D312E] pt-4 text-xs">
                <div className="text-left">
                  <span className="text-[10px] text-[#6B7280] block">Receiver's Signature</span>
                  <div className="h-6"></div>
                  <strong className="text-[11px] text-[#2D312E]">{activeVoucher.paidTo}</strong>
                </div>

                <div className="text-right">
                  <span className="font-serif italic font-bold text-slate-900 block text-xs underline">
                    R. Saravanan
                  </span>
                  <strong className="text-slate-900 block text-[11px]">{schoolInfo.adminName}</strong>
                  <span className="text-[10px] text-slate-500">School Admin / Authorised Signatory</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Full Receipt Image */}
      {viewingReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8E2] pb-2">
              <h4 className="font-bold text-xs text-[#2D312E]">Attached Bill / Voucher Photo</h4>
              <button
                onClick={() => setViewingReceiptImage(null)}
                className="p-1 text-[#6B7280] hover:text-[#2D312E] rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center max-h-[75vh] overflow-auto">
              <img
                src={viewingReceiptImage}
                alt="Bill Receipt"
                className="max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
