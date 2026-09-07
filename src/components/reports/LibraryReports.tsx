import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  INITIAL_LIBRARY_CATALOG, 
  INITIAL_BOOK_ISSUES, 
  LibraryBook, 
  BookIssueRecord 
} from '../../data/reportsData';
import { formatCurrency } from '../../utils/formatters';
import { generateReportTablePdf } from '../../utils/pdfGenerator';
import { 
  BookOpen, 
  Clock, 
  AlertCircle, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Layers, 
  Bookmark, 
  BookCopy,
  PlusCircle,
  X,
  RotateCcw,
  Check,
  Edit2,
  Trash2,
  Plus,
  Save
} from 'lucide-react';
import { cleanPhoneNumber } from '../../utils/formatters';

interface LibraryReportsProps {
  onExportCsv: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

export const LibraryReports: React.FC<LibraryReportsProps> = ({ onExportCsv }) => {
  const { students, schoolInfo } = useSchool();

  const [subTab, setSubTab] = useState<'issues' | 'overdue' | 'catalog'>('issues');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [issuesStatusFilter, setIssuesStatusFilter] = useState<string>('all');
  const [catalog, setCatalog] = useState<LibraryBook[]>(INITIAL_LIBRARY_CATALOG);
  const [issueRecords, setIssueRecords] = useState<BookIssueRecord[]>(INITIAL_BOOK_ISSUES);

  // Issue Book Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [selectedBookAccNo, setSelectedBookAccNo] = useState<string>(INITIAL_LIBRARY_CATALOG[0]?.accessionNo || '');
  const [borrowerType, setBorrowerType] = useState<'Student' | 'Staff'>('Student');
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [borrowerClassOrDept, setBorrowerClassOrDept] = useState<string>('3STD');
  const [borrowerPhone, setBorrowerPhone] = useState<string>('');
  const [dueDateDays, setDueDateDays] = useState<number>(14);

  // Edit Issue State
  const [editingIssue, setEditingIssue] = useState<BookIssueRecord | null>(null);

  // Add / Edit Book Catalog State
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [isAddingBook, setIsAddingBook] = useState<boolean>(false);

  // Quick helper to autofill borrower when student is selected
  const handleStudentSelect = (studentId: string) => {
    const s = students.find(item => item.id === studentId);
    if (s) {
      setBorrowerName(s.name);
      setBorrowerClassOrDept(s.standard);
      setBorrowerPhone(s.parentPhone || schoolInfo.phone);
    }
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const book = catalog.find(b => b.accessionNo === selectedBookAccNo);
    if (!book) return;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + Number(dueDateDays));
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const matchedStudent = students.find(s => s.name.toLowerCase() === borrowerName.trim().toLowerCase());
    const borrowerId = borrowerType === 'Student' 
      ? (matchedStudent ? matchedStudent.id : `std-${Date.now().toString().slice(-4)}`)
      : 'stf-001';

    const newIssue: BookIssueRecord = {
      issueId: `ISS-2024-${100 + issueRecords.length + 1}`,
      accessionNo: book.accessionNo,
      bookTitle: book.title,
      borrowerType,
      borrowerId,
      borrowerName: borrowerName.trim() || 'Student Borrower',
      borrowerClassOrDept: borrowerClassOrDept.trim() || '1STD',
      borrowerPhone: borrowerPhone.trim() || schoolInfo.phone,
      issueDate,
      dueDate,
      status: 'Issued',
      fineAmount: 0,
    };

    setIssueRecords(prev => [newIssue, ...prev]);
    // Decrement available copies
    setCatalog(prev => prev.map(b => b.accessionNo === book.accessionNo ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b));
    setIsIssueModalOpen(false);
    setBorrowerName('');
    setBorrowerPhone('');
  };

  const handleDeleteIssue = (issueId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete issue record ${issueId} for "${title}"?`)) {
      setIssueRecords(prev => prev.filter(i => i.issueId !== issueId));
    }
  };

  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue) return;
    setIssueRecords(prev => prev.map(i => i.issueId === editingIssue.issueId ? editingIssue : i));
    setEditingIssue(null);
  };

  const handleDeleteBook = (accNo: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" (Acc #${accNo}) from the catalog?`)) {
      setCatalog(prev => prev.filter(b => b.accessionNo !== accNo));
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    if (isAddingBook) {
      setCatalog(prev => [editingBook, ...prev]);
    } else {
      setCatalog(prev => prev.map(b => b.accessionNo === editingBook.accessionNo ? editingBook : b));
    }
    setEditingBook(null);
    setIsAddingBook(false);
  };

  // PDF Export
  const handleExportPdf = () => {
    if (subTab === 'issues') {
      const headers = ['Issue #', 'Acc #', 'Book Title', 'Borrower Name', 'Class/Dept', 'Issue Date', 'Due Date', 'Status'];
      const rows = filteredIssues.map(i => [
        i.issueId,
        i.accessionNo,
        i.bookTitle,
        i.borrowerName,
        i.borrowerClassOrDept,
        i.issueDate,
        i.dueDate,
        i.status,
      ]);
      const doc = generateReportTablePdf('Library Book Issues & Circulation Report', `Status: ${issuesStatusFilter === 'all' ? 'All Circulation Records' : issuesStatusFilter}`, headers, rows, schoolInfo);
      doc.save('Library_Book_Issues_Report.pdf');
    } else if (subTab === 'overdue') {
      const headers = ['Issue #', 'Acc #', 'Book Title', 'Borrower Name', 'Class/Dept', 'Due Date', 'Contact Phone', 'Fine Accrued'];
      const rows = overdueIssues.map(i => [
        i.issueId,
        i.accessionNo,
        i.bookTitle,
        i.borrowerName,
        i.borrowerClassOrDept,
        i.dueDate,
        i.borrowerPhone,
        formatCurrency(i.fineAmount),
      ]);
      rows.push(['Total Overdue Fines', '', '', '', '', '', '', formatCurrency(totalFinesAccrued)]);
      const doc = generateReportTablePdf('Library Overdue Books & Fine Accrual Ledger', `Penalty Rate: ₹2.00 / day`, headers, rows, schoolInfo);
      doc.save('Library_Overdue_Books_Report.pdf');
    } else {
      const headers = ['Acc #', 'Book Title', 'Author', 'Category', 'Total Copies', 'Available', 'Shelf Location', 'Price'];
      const rows = filteredCatalog.map(b => [
        b.accessionNo,
        b.title,
        b.author,
        b.category,
        b.totalCopies,
        b.availableCopies,
        b.shelfLocation,
        formatCurrency(b.price),
      ]);
      const doc = generateReportTablePdf('Library Books Catalog Register', `Category: ${catalogCategory === 'all' ? 'All Categories' : catalogCategory}`, headers, rows, schoolInfo);
      doc.save('Library_Books_Catalog_Report.pdf');
    }
  };

  const handleReturnBook = (issueId: string) => {
    const target = issueRecords.find(i => i.issueId === issueId);
    if (!target) return;

    const returnDate = new Date().toISOString().split('T')[0];
    setIssueRecords(prev => prev.map(i => i.issueId === issueId ? { ...i, status: 'Returned', returnDate } : i));
    // Increment available copies
    setCatalog(prev => prev.map(b => b.accessionNo === target.accessionNo ? { ...b, availableCopies: b.availableCopies + 1 } : b));
  };

  // Statistics
  const totalBooksCount = catalog.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalTitlesCount = catalog.length;
  const activeIssues = issueRecords.filter(i => i.status === 'Issued' || i.status === 'Overdue');
  const overdueIssues = issueRecords.filter(i => i.status === 'Overdue');
  const totalFinesAccrued = overdueIssues.reduce((sum, i) => sum + i.fineAmount, 0);

  // Filtered Issues
  const filteredIssues = issueRecords.filter(i => {
    return issuesStatusFilter === 'all' || i.status === issuesStatusFilter;
  });

  // Filtered Catalog
  const filteredCatalog = catalog.filter(b => {
    const matchesCategory = catalogCategory === 'all' || b.category === catalogCategory;
    const matchesSearch = 
      b.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.accessionNo.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRemindOverdueWhatsApp = (record: BookIssueRecord) => {
    const text = `Dear Student/Parent, Greetings from Wisdom Nursery & Primary School Library. The library book "${record.bookTitle}" (Acc #${record.accessionNo}) borrowed by ${record.borrowerName} (${record.borrowerClassOrDept}) was due on ${record.dueDate}. Overdue fine: ₹${record.fineAmount}. Kindly return the book promptly to the library counter. Contact: ${schoolInfo.phone}.`;
    const url = `https://wa.me/91${cleanPhoneNumber(record.borrowerPhone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleExport = () => {
    if (subTab === 'issues') {
      const headers = ['Issue ID', 'Accession No', 'Book Title', 'Borrower Type', 'Borrower Name', 'Class/Dept', 'Phone', 'Issue Date', 'Due Date', 'Status', 'Fine'];
      const rows = filteredIssues.map(i => [
        i.issueId,
        i.accessionNo,
        `"${i.bookTitle}"`,
        i.borrowerType,
        `"${i.borrowerName}"`,
        i.borrowerClassOrDept,
        i.borrowerPhone,
        i.issueDate,
        i.dueDate,
        i.status,
        i.fineAmount,
      ]);
      onExportCsv('Library_Book_Issues_Report', headers, rows);
    } else if (subTab === 'overdue') {
      const headers = ['Issue ID', 'Accession No', 'Book Title', 'Borrower Name', 'Class/Dept', 'Phone', 'Due Date', 'Fine Amount'];
      const rows = overdueIssues.map(i => [
        i.issueId,
        i.accessionNo,
        `"${i.bookTitle}"`,
        `"${i.borrowerName}"`,
        i.borrowerClassOrDept,
        i.borrowerPhone,
        i.dueDate,
        i.fineAmount,
      ]);
      onExportCsv('Library_Overdue_Books_Report', headers, rows);
    } else {
      const headers = ['Accession No', 'Book Title', 'Author', 'Category', 'Language', 'Total Copies', 'Available', 'Shelf Location', 'Price'];
      const rows = filteredCatalog.map(b => [
        b.accessionNo,
        `"${b.title}"`,
        `"${b.author}"`,
        `"${b.category}"`,
        b.language,
        b.totalCopies,
        b.availableCopies,
        `"${b.shelfLocation}"`,
        b.price,
      ]);
      onExportCsv('Library_Book_Catalog_Report', headers, rows);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs Selector & Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-[#F2F4F2] p-2 rounded-xl border border-[#E2E8E2]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubTab('issues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'issues' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Book Issues Report ({activeIssues.length})</span>
          </button>
          <button
            onClick={() => setSubTab('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'overdue' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue Books ({overdueIssues.length})</span>
          </button>
          <button
            onClick={() => setSubTab('catalog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'catalog' ? 'bg-[#4F6D7A] text-white shadow-xs' : 'text-[#2D312E] hover:bg-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Book Catalog ({totalTitlesCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* New Interactive Feature: Issue Book Modal Trigger */}
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Book</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89A894] hover:bg-[#789683] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8E2] hover:bg-gray-50 text-[#2D312E] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4F6D7A]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Total Library Volumes</span>
          <span className="text-base font-extrabold text-[#4F6D7A] font-mono mt-0.5 block">{totalBooksCount} Books</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">{totalTitlesCount} Unique Catalog Titles</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Currently In Circulation</span>
          <span className="text-base font-extrabold text-[#89A894] font-mono mt-0.5 block">{activeIssues.length} Issued</span>
          <span className="text-[10px] text-[#89A894] font-semibold mt-1 block">Active Student & Staff Borrows</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Overdue Borrows</span>
          <span className="text-base font-extrabold text-[#D68A6E] font-mono mt-0.5 block">{overdueIssues.length} Overdue</span>
          <span className="text-[10px] text-[#D68A6E] font-semibold mt-1 block">Fines: {formatCurrency(totalFinesAccrued)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs">
          <span className="text-[#6B7280] font-medium block">Average Lending Period</span>
          <span className="text-base font-extrabold text-[#2D312E] font-mono mt-0.5 block">14 Days</span>
          <span className="text-[10px] text-[#6B7280] mt-1 block">₹2.00 / day penalty rule</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BOOK ISSUES TAB                                                        */}
      {/* ========================================================================= */}
      {subTab === 'issues' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#6B7280] font-semibold">Circulation Status:</span>
              <select
                value={issuesStatusFilter}
                onChange={(e) => setIssuesStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
              >
                <option value="all">All Circulation Records</option>
                <option value="Issued">Active (Issued)</option>
                <option value="Overdue">Overdue</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="px-3 py-1 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Issue New Book</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Acc #</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Borrower Name</th>
                    <th className="py-2.5 px-3">Class / Dept</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredIssues.map((i) => (
                    <tr key={i.issueId} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{i.issueId}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{i.accessionNo}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{i.bookTitle}</td>
                      <td className="py-2.5 px-3 font-medium text-[#2D312E]">{i.borrowerName}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{i.borrowerClassOrDept}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{i.issueDate}</td>
                      <td className="py-2.5 px-3 font-mono text-[#2D312E] font-semibold">{i.dueDate}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          i.status === 'Returned'
                            ? 'bg-[#89A894]/20 text-[#2D312E]'
                            : i.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {i.status === 'Returned' && <CheckCircle2 className="w-3 h-3 text-[#89A894]" />}
                          {i.status === 'Overdue' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {i.status === 'Issued' && <Clock className="w-3 h-3 text-blue-600" />}
                          {i.status}
                        </span>
                      </td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {i.status !== 'Returned' && (
                            <button
                              onClick={() => handleReturnBook(i.issueId)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Mark Returned"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Return</span>
                            </button>
                          )}
                          {i.status === 'Overdue' && (
                            <button
                              onClick={() => handleRemindOverdueWhatsApp(i)}
                              className="p-1 bg-[#89A894]/20 hover:bg-[#89A894]/30 text-[#4F6D7A] rounded cursor-pointer"
                              title="Send Overdue WhatsApp Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingIssue({ ...i })}
                            className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(i.issueId, i.bookTitle)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERDUE BOOKS TAB                                                      */}
      {/* ========================================================================= */}
      {subTab === 'overdue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F2F4F2] border-b border-[#E2E8E2] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D68A6E]" />
                  Overdue Books & Fine Accrual Ledger
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Books past due date with daily penalty calculation (@ ₹2.00 / day)
                </p>
              </div>
              <span className="text-xs font-bold text-[#D68A6E] bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                Total Accrued Fines: {formatCurrency(totalFinesAccrued)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F8F6] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Issue #</th>
                    <th className="py-2.5 px-3">Acc #</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Borrower Name</th>
                    <th className="py-2.5 px-3">Class / Role</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Parent / Contact</th>
                    <th className="py-2.5 px-3 text-right font-black text-[#D68A6E]">Fine Accrued</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {overdueIssues.map((i) => (
                    <tr key={i.issueId} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{i.issueId}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{i.accessionNo}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{i.bookTitle}</td>
                      <td className="py-2.5 px-3 font-medium text-[#2D312E]">{i.borrowerName}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#4F6D7A]">{i.borrowerClassOrDept}</td>
                      <td className="py-2.5 px-3 font-mono text-[#D68A6E] font-bold">{i.dueDate}</td>
                      <td className="py-2.5 px-3">
                        <a href={`tel:${i.borrowerPhone}`} className="text-[#4F6D7A] hover:underline flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-[#89A894]" />
                          {i.borrowerPhone}
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-[#D68A6E] text-sm">
                        {formatCurrency(i.fineAmount)}
                      </td>
                      <td className="no-print py-2.5 px-3 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleReturnBook(i.issueId)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Return
                        </button>
                        <button
                          onClick={() => handleRemindOverdueWhatsApp(i)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#89A894]/20 hover:bg-[#89A894]/30 text-[#4F6D7A] font-bold rounded text-[11px] transition-colors cursor-pointer"
                          title="Send Overdue WhatsApp Reminder"
                        >
                          <MessageSquare className="w-3 h-3 text-[#89A894]" />
                          <span>Remind</span>
                        </button>
                        <button
                          onClick={() => setEditingIssue({ ...i })}
                          className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                          title="Edit Overdue Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(i.issueId, i.bookTitle)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BOOK CATALOG TAB                                                       */}
      {/* ========================================================================= */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          <div className="no-print bg-white p-3.5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search book title, author, accession..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg text-xs focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6B7280] font-semibold">Category:</span>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="px-3 py-1.5 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-bold text-[#4F6D7A]"
              >
                <option value="all">All Categories</option>
                <option value="Tamil Literature">Tamil Literature</option>
                <option value="English Reader">English Reader</option>
                <option value="Moral Science">Moral Science</option>
                <option value="General Science">General Science</option>
                <option value="General Knowledge">General Knowledge</option>
                <option value="Mathematics">Mathematics</option>
              </select>

              <button
                onClick={() => {
                  setEditingBook({
                    accessionNo: `BK-${200 + catalog.length + 1}`,
                    title: '',
                    author: '',
                    category: 'General Knowledge',
                    language: 'English',
                    totalCopies: 1,
                    availableCopies: 1,
                    shelfLocation: 'Rack A1',
                    price: 150
                  });
                  setIsAddingBook(true);
                }}
                className="px-3 py-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Book</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F2F4F2] text-[#2D312E] uppercase tracking-wider font-bold border-b border-[#E2E8E2]">
                    <th className="py-2.5 px-3">Acc #</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Author</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3 text-center">Total Copies</th>
                    <th className="py-2.5 px-3 text-center text-[#89A894]">Available</th>
                    <th className="py-2.5 px-3">Shelf</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="no-print py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]/60">
                  {filteredCatalog.map((b) => (
                    <tr key={b.accessionNo} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#4F6D7A]">{b.accessionNo}</td>
                      <td className="py-2.5 px-3 font-bold text-[#2D312E]">{b.title}</td>
                      <td className="py-2.5 px-3 text-[#6B7280]">{b.author}</td>
                      <td className="py-2.5 px-3 font-medium text-[#4F6D7A]">{b.category}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{b.language}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{b.totalCopies}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#89A894]">{b.availableCopies}</td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">{b.shelfLocation}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatCurrency(b.price)}</td>
                      <td className="no-print py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingBook({ ...b });
                              setIsAddingBook(false);
                            }}
                            className="p-1 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors cursor-pointer"
                            title="Edit Book"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(b.accessionNo, b.title)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ISSUE BOOK MODAL                                                          */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#4F6D7A]" />
                  Issue Library Book
                </h3>
                <p className="text-xs text-[#6B7280]">Wisdom Primary School Library Counter</p>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-5 space-y-4 text-xs">
              {/* Select Book */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Select Book from Catalog:</label>
                <select
                  value={selectedBookAccNo}
                  onChange={(e) => setSelectedBookAccNo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                >
                  {catalog.map(b => (
                    <option key={b.accessionNo} value={b.accessionNo}>
                      [{b.accessionNo}] {b.title} - ({b.availableCopies} available)
                    </option>
                  ))}
                </select>
              </div>

              {/* Borrower Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Borrower Type:</label>
                  <select
                    value={borrowerType}
                    onChange={(e) => setBorrowerType(e.target.value as 'Student' | 'Staff')}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Class / Department:</label>
                  <input
                    type="text"
                    value={borrowerClassOrDept}
                    onChange={(e) => setBorrowerClassOrDept(e.target.value)}
                    placeholder="e.g. 3STD or Primary Teaching"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              {/* Autofill from student list if student */}
              {borrowerType === 'Student' && students.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#6B7280] mb-1">Quick-Select Student:</label>
                  <select
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FDFDFB] border border-[#E2E8E2] rounded-lg text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pick enrolled student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.standard} - {s.admissionNo})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Borrower Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Borrower Name:</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Enter student or teacher name"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              {/* Loan Period */}
              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Loan Period (Days):</label>
                <select
                  value={dueDateDays}
                  onChange={(e) => setDueDateDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (Standard 2 Weeks)</option>
                  <option value={21}>21 Days (3 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Issue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* EDIT ISSUE MODAL                                                          */}
      {/* ========================================================================= */}
      {editingIssue && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#4F6D7A]" />
                  Edit Circulation Record ({editingIssue.issueId})
                </h3>
                <p className="text-xs text-[#6B7280]">Book: {editingIssue.bookTitle} (Acc #{editingIssue.accessionNo})</p>
              </div>
              <button
                onClick={() => setEditingIssue(null)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIssue} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Borrower Name:</label>
                  <input
                    type="text"
                    value={editingIssue.borrowerName}
                    onChange={(e) => setEditingIssue({ ...editingIssue, borrowerName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Class / Department:</label>
                  <input
                    type="text"
                    value={editingIssue.borrowerClassOrDept}
                    onChange={(e) => setEditingIssue({ ...editingIssue, borrowerClassOrDept: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={editingIssue.borrowerPhone}
                    onChange={(e) => setEditingIssue({ ...editingIssue, borrowerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={editingIssue.dueDate}
                    onChange={(e) => setEditingIssue({ ...editingIssue, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Status:</label>
                  <select
                    value={editingIssue.status}
                    onChange={(e) => setEditingIssue({ ...editingIssue, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  >
                    <option value="Issued">Issued</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Fine Accrued (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingIssue.fineAmount}
                    onChange={(e) => setEditingIssue({ ...editingIssue, fineAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT BOOK MODAL                                                     */}
      {/* ========================================================================= */}
      {editingBook && (
        <div className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-[#E2E8E2] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F2F4F2]">
              <div>
                <h3 className="font-bold text-sm text-[#2D312E] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#4F6D7A]" />
                  {isAddingBook ? 'Add New Catalog Book' : `Edit Book (${editingBook.accessionNo})`}
                </h3>
                <p className="text-xs text-[#6B7280]">Library Catalog Entry</p>
              </div>
              <button
                onClick={() => { setEditingBook(null); setIsAddingBook(false); }}
                className="p-1.5 hover:bg-gray-200 rounded-full text-[#6B7280] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Accession No:</label>
                  <input
                    type="text"
                    value={editingBook.accessionNo}
                    onChange={(e) => setEditingBook({ ...editingBook, accessionNo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-mono font-bold text-[#4F6D7A]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Category:</label>
                  <select
                    value={editingBook.category}
                    onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  >
                    <option value="Tamil Literature">Tamil Literature</option>
                    <option value="English Reader">English Reader</option>
                    <option value="Moral Science">Moral Science</option>
                    <option value="General Science">General Science</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Book Title:</label>
                <input
                  type="text"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  placeholder="Full title of the book"
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Author:</label>
                  <input
                    type="text"
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Language:</label>
                  <input
                    type="text"
                    value={editingBook.language}
                    onChange={(e) => setEditingBook({ ...editingBook, language: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Total Copies:</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBook.totalCopies}
                    onChange={(e) => setEditingBook({ ...editingBook, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Available Copies:</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBook.availableCopies}
                    onChange={(e) => setEditingBook({ ...editingBook, availableCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D312E] mb-1">Price (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBook.price}
                    onChange={(e) => setEditingBook({ ...editingBook, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D312E] mb-1">Shelf Location:</label>
                <input
                  type="text"
                  value={editingBook.shelfLocation}
                  onChange={(e) => setEditingBook({ ...editingBook, shelfLocation: e.target.value })}
                  placeholder="e.g. Rack B2 / Section 3"
                  className="w-full px-3 py-2 bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg font-medium text-[#2D312E]"
                  required
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8E2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setEditingBook(null); setIsAddingBook(false); }}
                  className="px-4 py-2 border border-[#E2E8E2] bg-white hover:bg-gray-100 text-[#2D312E] rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F6D7A] hover:bg-[#415A65] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAddingBook ? 'Add to Catalog' : 'Save Book'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
