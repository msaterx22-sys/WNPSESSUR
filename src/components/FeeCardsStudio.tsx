import React, { useState, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  Printer, 
  Bus, 
  Trophy, 
  CreditCard, 
  Search, 
  Camera, 
  Upload, 
  ShieldCheck, 
  Contact, 
  QrCode,
  CheckCircle2,
  Trash2,
  Layers
} from 'lucide-react';

export const FeeCardsStudio: React.FC = () => {
  const { 
    students, 
    schoolInfo, 
    classList, 
    updateStudent,
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending, 
    getStudentReceipts,
    setActiveTab
  } = useSchool();
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [cardType, setCardType] = useState<'idcard' | 'fee' | 'van' | 'sports'>('idcard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('all');

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery);
    const matchesClass = filterClass === 'all' || s.standard === filterClass;
    return matchesSearch && matchesClass;
  });

  const currentStudent = students.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0];

  const handlePrint = () => {
    window.print();
  };

  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStudent) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateStudent(currentStudent.id, { photoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!currentStudent) return;
    updateStudent(currentStudent.id, { photoUrl: undefined });
  };

  if (!currentStudent) {
    return <div className="p-8 text-center text-slate-500">No students available.</div>;
  }

  const totalFee = getStudentTotalFee(currentStudent);
  const totalPaid = getStudentTotalPaid(currentStudent.id);
  const pending = getStudentPending(currentStudent);
  const receipts = getStudentReceipts(currentStudent.id);

  return (
    <div className="space-y-6">
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={photoFileInputRef}
        accept="image/*"
        onChange={handleQuickPhotoUpload}
        className="hidden"
      />

      {/* Control panel (hidden on print) */}
      <div className="no-print bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#2D312E] flex items-center gap-2">
              <Contact className="w-5 h-5 text-[#4F6D7A]" />
              Official ID Card & Van Pass Studio
            </h2>
            <p className="text-xs text-[#6B7280]">
              Generate, customize student photographs, and print official Student ID Cards, Van Passes, and Fee Records
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Photo Upload Button */}
            <button
              onClick={() => photoFileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#2D312E] border border-[#E2E8E2] px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Upload photo for selected student"
            >
              <Camera className="w-4 h-4 text-[#4F6D7A]" />
              <span>{currentStudent.photoUrl ? 'Change Photo' : 'Upload Student Photo'}</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className="flex items-center gap-1.5 bg-[#2D312E] hover:bg-[#1F2220] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Open Bulk PDF & Print Studio to print or download all student cards at once"
            >
              <Layers className="w-4 h-4 text-[#89A894]" />
              <span>Bulk Print / Download All (PDF)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#4F6D7A] hover:bg-[#415A65] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Card</span>
            </button>
          </div>
        </div>

        {/* Card Type Selector */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8E2]/70">
          <button
            onClick={() => setCardType('idcard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cardType === 'idcard'
                ? 'bg-[#4F6D7A] text-white shadow-xs'
                : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Contact className="w-4 h-4" />
            <span>Student Identity Card (CR80)</span>
          </button>

          <button
            onClick={() => setCardType('van')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cardType === 'van'
                ? 'bg-[#D68A6E] text-white shadow-xs'
                : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>School Van Transport Card</span>
          </button>

          <button
            onClick={() => setCardType('fee')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cardType === 'fee'
                ? 'bg-[#89A894] text-white shadow-xs'
                : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Annual Student Fee Card</span>
          </button>

          <button
            onClick={() => setCardType('sports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              cardType === 'sports'
                ? 'bg-[#2D312E] text-white shadow-xs'
                : 'bg-[#F2F4F2] text-[#2D312E] hover:bg-[#E2E8E2]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Sports & Activities Card</span>
          </button>
        </div>

        {/* Student Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search student by name / admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] focus:bg-white focus:ring-2 focus:ring-[#89A894] outline-hidden"
            />
          </div>

          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] outline-hidden"
            >
              <option value="all">All Standards ({classList.join(', ')})</option>
              {classList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full py-2 px-3 text-xs font-bold text-[#4F6D7A] border border-[#4F6D7A]/30 rounded-lg bg-[#4F6D7A]/10 outline-hidden"
            >
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.standard} - Sec {s.section}) {s.isRte ? '⭐ [RTE]' : ''} | {s.admissionNo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Card Area */}
      <div className="flex justify-center p-2">
        
        {/* TYPE 0: OFFICIAL STUDENT IDENTITY CARD (ID CARD) */}
        {cardType === 'idcard' && (
          <div className="printable-document bg-white border-2 border-[#4F6D7A] rounded-2xl max-w-md w-full p-5 text-slate-900 shadow-lg relative overflow-hidden">
            {/* Top Bar with School Header */}
            <div className="bg-[#4F6D7A] text-white -m-5 mb-4 p-4 text-center relative border-b-2 border-[#D68A6E]">
              <div className="flex items-center justify-center gap-3">
                <img 
                  src={schoolInfo.logoUrl || '/school_logo.jpg'}
                  alt="Wisdom School" 
                  className="w-13 h-13 rounded-full border-2 border-white object-cover shadow-xs shrink-0" 
                />
                <div className="text-left">
                  <h1 className="text-sm font-black tracking-wide uppercase font-serif leading-tight text-white">
                    {schoolInfo.name}
                  </h1>
                  <p className="text-[10px] text-[#F2F4F2]/90 font-medium">
                    {schoolInfo.address}
                  </p>
                  <p className="text-[9px] text-white/80">
                    Ph: {schoolInfo.phone} • {schoolInfo.email}
                  </p>
                </div>
              </div>
              <div className="mt-2 inline-block bg-[#D68A6E] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest shadow-2xs">
                STUDENT IDENTITY CARD • {schoolInfo.academicYear}
              </div>
            </div>

            {/* Photo & Primary Bio */}
            <div className="flex items-start gap-4 mb-4">
              {/* Student Photo */}
              <div className="relative group shrink-0">
                {currentStudent.photoUrl ? (
                  <div className="relative">
                    <img
                      src={currentStudent.photoUrl}
                      alt={currentStudent.name}
                      className="w-24 h-28 object-cover rounded-lg border-2 border-[#4F6D7A] shadow-xs"
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="no-print absolute -top-1.5 -right-1.5 bg-[#D68A6E] text-white p-1 rounded-full shadow hover:bg-[#C07055] transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-24 h-28 border-2 border-dashed border-[#89A894] rounded-lg bg-[#F2F4F2] flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#89A894]/15 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-[#89A894] mb-1" />
                    <span className="text-[10px] font-bold text-[#4F6D7A] leading-tight">
                      Upload Photo
                    </span>
                    <span className="text-[8px] text-[#6B7280]">Click to add</span>
                  </div>
                )}
                {currentStudent.isRte && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#4F6D7A] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                    RTE QUOTA
                  </span>
                )}
              </div>

              {/* Student Details */}
              <div className="flex-1 space-y-1 text-xs">
                <h2 className="text-base font-black text-[#2D312E] leading-tight">
                  {currentStudent.name}
                </h2>
                
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="bg-[#4F6D7A]/10 text-[#4F6D7A] font-bold px-2 py-0.5 rounded text-xs border border-[#4F6D7A]/20">
                    Class: {currentStudent.standard} - {currentStudent.section}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Roll: <strong>{currentStudent.rollNo}</strong>
                  </span>
                </div>

                <div className="pt-1.5 space-y-1 text-[11px] text-[#2D312E]">
                  <div>
                    <span className="text-[#6B7280]">Admission No:</span>{' '}
                    <strong className="font-mono text-[#4F6D7A]">{currentStudent.admissionNo}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Parent / Guardian:</span>{' '}
                    <strong>{currentStudent.parentName}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Contact Mobile:</span>{' '}
                    <strong className="font-mono">{currentStudent.parentPhone}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Blood Group:</span>{' '}
                    <strong className="font-mono text-rose-700 bg-rose-50 px-1 rounded">{currentStudent.bloodGroup || 'B+'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RTE Banner if applicable */}
            {currentStudent.isRte && (
              <div className="bg-[#89A894]/20 border border-[#89A894] rounded-lg p-2 mb-3 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[#2D312E]">
                  <ShieldCheck className="w-4 h-4 text-[#4F6D7A]" />
                  <span>Right to Education (RTE) Scheme</span>
                </div>
                <span className="font-mono text-[10px] text-[#4F6D7A] font-bold">
                  {currentStudent.rteApplicationNo || 'Govt 25% Free Seat'}
                </span>
              </div>
            )}

            {/* Address & Emergency Info */}
            <div className="bg-[#F2F4F2] border border-[#E2E8E2] rounded-lg p-2.5 mb-4 text-[10px] space-y-1 text-[#2D312E]">
              <div>
                <span className="text-[#6B7280]">Address:</span> {currentStudent.address}
              </div>
              {currentStudent.vanFacility && (
                <div className="flex items-center gap-1 text-[#D68A6E] font-semibold">
                  <Bus className="w-3 h-3" />
                  <span>School Van Route: {currentStudent.vanRoute || 'Essur Main Route'}</span>
                </div>
              )}
            </div>

            {/* Signatures & Barcode/QR footer */}
            <div className="flex items-end justify-between border-t border-[#E2E8E2] pt-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-[#6B7280]">
                <QrCode className="w-8 h-8 text-[#4F6D7A]" />
                <div className="font-mono text-[8px] leading-tight">
                  <div>WISDOM-{currentStudent.admissionNo}</div>
                  <div>VALID {schoolInfo.academicYear}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-serif italic font-bold text-slate-900 block text-xs underline">
                  {schoolInfo.adminName}
                </span>
                <strong className="text-slate-900 block text-[11px]">{schoolInfo.adminName}</strong>
                <span className="text-[9px] text-slate-500">Correspondent / Head</span>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 1: ANNUAL STUDENT FEE CARD */}
        {cardType === 'fee' && (
          <div className="printable-document bg-white border-2 border-slate-900 rounded-xl max-w-2xl w-full p-6 text-slate-900 shadow-md relative overflow-hidden">
            {/* Header with logo */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <img 
                src={schoolInfo.logoUrl || '/school_logo.jpg'}
                alt="Wisdom School" 
                className="w-16 h-16 rounded-full border-2 border-amber-600 object-cover shrink-0" 
              />
              <div className="text-center flex-1 px-2">
                <h1 className="text-base font-black uppercase tracking-tight font-serif text-slate-900">
                  {schoolInfo.name}
                </h1>
                <p className="text-[11px] font-bold text-amber-800">
                  {schoolInfo.address}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Admin: <strong>{schoolInfo.adminName}</strong> • Ph: {schoolInfo.phone} • UPI: {schoolInfo.upiId}
                </p>
                <div className="mt-1">
                  <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded tracking-widest uppercase">
                    STUDENT FEE RECORD CARD ({schoolInfo.academicYear})
                  </span>
                </div>
              </div>

              {/* Photo Area */}
              <div className="relative group shrink-0">
                {currentStudent.photoUrl ? (
                  <img
                    src={currentStudent.photoUrl}
                    alt={currentStudent.name}
                    className="w-16 h-20 object-cover rounded border border-slate-900 shadow-2xs"
                  />
                ) : (
                  <div 
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-16 h-20 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-center p-1 text-[9px] text-slate-400 shrink-0 bg-slate-50 cursor-pointer hover:bg-slate-100"
                    title="Click to upload photo"
                  >
                    <Camera className="w-4 h-4 mb-0.5 text-slate-400" />
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Metadata Table */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-4">
              <div>
                <span className="text-slate-500">Student Name:</span> <strong>{currentStudent.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Class & Sec:</span> <strong className="text-blue-900">{currentStudent.standard} - {currentStudent.section}</strong>
              </div>
              <div>
                <span className="text-slate-500">Admission No:</span> <strong className="font-mono">{currentStudent.admissionNo}</strong>
              </div>
              <div>
                <span className="text-slate-500">Roll No:</span> <strong>{currentStudent.rollNo}</strong>
              </div>
              <div>
                <span className="text-slate-500">Parent / Guardian:</span> <strong>{currentStudent.parentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Parent Mobile:</span> <strong>{currentStudent.parentPhone}</strong>
              </div>
              {currentStudent.isRte && (
                <div className="col-span-2 bg-[#89A894]/20 p-1 rounded font-bold text-[#4F6D7A] flex items-center justify-between">
                  <span>⭐ Right to Education (RTE 25% Seat)</span>
                  <span>Reg: {currentStudent.rteApplicationNo || 'TN-GOVT-RTE'}</span>
                </div>
              )}
            </div>

            {/* Fee Breakdown Summary */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2">Fee Head</th>
                    <th className="p-2 text-right">Applicable (₹)</th>
                    <th className="p-2 text-right">Paid (₹)</th>
                    <th className="p-2 text-right">Pending Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium">
                      Annual Tuition Fee {currentStudent.isRte ? '(RTE Quota Waived)' : ''}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {currentStudent.isRte ? '₹0' : formatNumber(currentStudent.tuitionFee)}
                    </td>
                    <td className="p-2 text-right font-mono text-emerald-700">
                      {formatNumber(receipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0))}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {currentStudent.isRte ? '₹0' : formatNumber(Math.max(0, currentStudent.tuitionFee - receipts.reduce((sum, r) => sum + (r.breakdown.tuition || 0), 0)))}
                    </td>
                  </tr>
                  {currentStudent.vanFacility && (
                    <tr>
                      <td className="p-2 font-medium">School Van Facility ({currentStudent.vanRoute})</td>
                      <td className="p-2 text-right font-mono">{formatNumber(currentStudent.vanFee)}</td>
                      <td className="p-2 text-right font-mono text-emerald-700">
                        {formatNumber(receipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0))}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatNumber(Math.max(0, currentStudent.vanFee - receipts.reduce((sum, r) => sum + (r.breakdown.van || 0), 0)))}
                      </td>
                    </tr>
                  )}
                  {currentStudent.sportsFacility && (
                    <tr>
                      <td className="p-2 font-medium">Sports & Physical Activities</td>
                      <td className="p-2 text-right font-mono">{formatNumber(currentStudent.sportsFee)}</td>
                      <td className="p-2 text-right font-mono text-emerald-700">
                        {formatNumber(receipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0))}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatNumber(Math.max(0, currentStudent.sportsFee - receipts.reduce((sum, r) => sum + (r.breakdown.sports || 0), 0)))}
                      </td>
                    </tr>
                  )}
                  {currentStudent.discount > 0 && (
                    <tr className="text-amber-700">
                      <td className="p-2 font-medium">Management Concession / Discount</td>
                      <td className="p-2 text-right font-mono">- {formatNumber(currentStudent.discount)}</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="p-2">NET TOTAL</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totalFee)}</td>
                    <td className="p-2 text-right font-mono text-emerald-700">{formatCurrency(totalPaid)}</td>
                    <td className="p-2 text-right font-mono text-rose-700 font-black">{formatCurrency(pending)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Installment History / Payment Entries */}
            <div className="mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Official Payment Entries & Office Seal
              </h4>
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-1.5 border-r border-slate-300">Rcpt No</th>
                    <th className="p-1.5 border-r border-slate-300">Date</th>
                    <th className="p-1.5 border-r border-slate-300">Category</th>
                    <th className="p-1.5 border-r border-slate-300">Mode</th>
                    <th className="p-1.5 text-right border-r border-slate-300">Paid (₹)</th>
                    <th className="p-1.5 text-center">Admin Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {receipts.length > 0 ? (
                    receipts.map(r => (
                      <tr key={r.id}>
                        <td className="p-1.5 font-mono text-[10px] border-r border-slate-200">{r.receiptNumber}</td>
                        <td className="p-1.5 border-r border-slate-200">{r.date}</td>
                        <td className="p-1.5 border-r border-slate-200">{r.category}</td>
                        <td className="p-1.5 border-r border-slate-200">{r.paymentMode}</td>
                        <td className="p-1.5 text-right font-mono font-bold text-emerald-700 border-r border-slate-200">
                          {formatNumber(r.amountPaid)}
                        </td>
                        <td className="p-1.5 text-center font-serif text-[10px] text-blue-900 font-bold">
                          [ WISDOM VERIFIED ]
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                        No payments recorded yet for {schoolInfo.academicYear}.
                      </td>
                    </tr>
                  )}
                  {Array.from({ length: Math.max(0, 3 - receipts.length) }).map((_, idx) => (
                    <tr key={`blank-${idx}`} className="h-6">
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td className="border-r border-slate-200"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card Signatures & Seal */}
            <div className="flex items-center justify-between border-t-2 border-slate-900 pt-3 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-500">Parent / Guardian Signature</span>
                <div className="h-6"></div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 border-2 border-amber-800 rounded-full flex items-center justify-center mx-auto text-[9px] font-bold text-amber-900 uppercase text-center p-1 leading-tight">
                  OFFICIAL SCHOOL SEAL
                </div>
              </div>

              <div className="text-right">
                <span className="font-serif italic font-bold text-slate-900 block text-xs underline">
                  {schoolInfo.adminName}
                </span>
                <strong className="text-slate-900 block text-xs">{schoolInfo.adminName}</strong>
                <span className="text-[10px] text-slate-500">School Admin / Correspondent</span>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 2: SCHOOL VAN TRANSPORT CARD */}
        {cardType === 'van' && (
          <div className="printable-document bg-white border-2 border-amber-800 rounded-xl max-w-xl w-full p-6 text-slate-900 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-amber-700 pb-3 mb-4">
              <img 
                src={schoolInfo.logoUrl || '/school_logo.jpg'}
                alt="Wisdom School" 
                className="w-16 h-16 rounded-full border-2 border-amber-600 object-cover shrink-0" 
              />
              <div className="text-center flex-1 px-2">
                <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
                  {schoolInfo.name}
                </h1>
                <p className="text-[11px] font-bold text-amber-800">
                  {schoolInfo.address}
                </p>
                <div className="mt-1">
                  <span className="bg-amber-600 text-white text-[11px] font-bold px-3 py-0.5 rounded tracking-widest uppercase inline-flex items-center gap-1">
                    <Bus className="w-3 h-3" /> OFFICIAL SCHOOL VAN PASS / VAN FEE CARD
                  </span>
                </div>
              </div>

              {/* Photo Area */}
              <div className="relative group shrink-0">
                {currentStudent.photoUrl ? (
                  <img
                    src={currentStudent.photoUrl}
                    alt={currentStudent.name}
                    className="w-16 h-20 object-cover rounded border border-amber-800 shadow-2xs"
                  />
                ) : (
                  <div 
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-16 h-20 border border-dashed border-amber-400 rounded flex flex-col items-center justify-center text-center p-1 text-[9px] text-amber-700 shrink-0 bg-amber-50 cursor-pointer hover:bg-amber-100"
                    title="Click to upload photo"
                  >
                    <Camera className="w-4 h-4 mb-0.5 text-amber-600" />
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Van Student Info */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-xs space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Student:</span> <strong>{currentStudent.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class:</span> <strong className="text-blue-900">{currentStudent.standard} - {currentStudent.section}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Admission No:</span> <strong className="font-mono">{currentStudent.admissionNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Parent Mobile:</span> <strong>{currentStudent.parentPhone}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Assigned Van Route:</span>{' '}
                  <strong className="text-amber-900">{currentStudent.vanRoute || 'Essur Main Road Route'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Annual Van Fee:</span>{' '}
                  <strong className="font-mono text-emerald-800">{formatCurrency(currentStudent.vanFee || 4000)}</strong>
                </div>
              </div>
            </div>

            {/* Monthly Van Pass Stamps (10 Months: June to March) */}
            <div className="mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                Monthly Van Fee Validation Stamps (June - March)
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                {['June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((month, idx) => {
                  const hasVanFee = currentStudent.vanFacility;
                  const isPaid = hasVanFee && totalPaid >= ((idx + 1) * ((currentStudent.vanFee || 4000) / 10));
                  return (
                    <div key={month} className={`border rounded p-2 ${isPaid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                      <div className="font-bold">{month}</div>
                      <div className="h-6 flex items-center justify-center font-mono text-[9px] mt-1">
                        {isPaid ? '✓ PAID' : 'PENDING'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Van Rules & Emergency Contact */}
            <div className="text-[10px] text-slate-600 border-t border-dashed border-slate-300 pt-2 mb-4 space-y-1">
              <p>• Student must board and alight only at the designated pickup stop.</p>
              <p>• Van Pass must be carried daily and shown upon driver/attendant request.</p>
              <p>• Emergency Van Contact / School Office Admin: <strong>{schoolInfo.adminName} ({schoolInfo.phone})</strong></p>
            </div>

            {/* Signatures */}
            <div className="flex items-center justify-between border-t-2 border-amber-800 pt-2 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-500">Driver / Attendant Sign</span>
                <div className="h-6"></div>
              </div>
              <div className="text-right">
                <span className="font-serif italic font-bold text-slate-900 block text-xs underline">
                  R. Saravanan
                </span>
                <strong className="text-slate-900 block text-xs">{schoolInfo.adminName}</strong>
                <span className="text-[10px] text-slate-500">School Admin, Essur</span>
              </div>
            </div>
          </div>
        )}

        {/* TYPE 3: SPORTS & PHYSICAL ACTIVITIES CARD */}
        {cardType === 'sports' && (
          <div className="printable-document bg-white border-2 border-purple-900 rounded-xl max-w-xl w-full p-6 text-slate-900 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-purple-800 pb-3 mb-4">
              <img 
                src={schoolInfo.logoUrl || '/school_logo.jpg'}
                alt="Wisdom School" 
                className="w-16 h-16 rounded-full border-2 border-purple-600 object-cover shrink-0" 
              />
              <div className="text-center flex-1 px-2">
                <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
                  {schoolInfo.name}
                </h1>
                <p className="text-[11px] font-bold text-purple-900">
                  {schoolInfo.address}
                </p>
                <div className="mt-1">
                  <span className="bg-purple-800 text-white text-[11px] font-bold px-3 py-0.5 rounded tracking-widest uppercase inline-flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-300" /> ANNUAL SPORTS & PHYSICAL EDUCATION CARD
                  </span>
                </div>
              </div>

              {/* Photo Area */}
              <div className="relative group shrink-0">
                {currentStudent.photoUrl ? (
                  <img
                    src={currentStudent.photoUrl}
                    alt={currentStudent.name}
                    className="w-16 h-20 object-cover rounded border border-purple-900 shadow-2xs"
                  />
                ) : (
                  <div 
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-16 h-20 border border-dashed border-purple-400 rounded flex flex-col items-center justify-center text-center p-1 text-[9px] text-purple-700 shrink-0 bg-purple-50 cursor-pointer hover:bg-purple-100"
                    title="Click to upload photo"
                  >
                    <Camera className="w-4 h-4 mb-0.5 text-purple-600" />
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Student Sports Bio */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3 text-xs space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Student Name:</span> <strong>{currentStudent.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Standard:</span> <strong className="text-purple-900">{currentStudent.standard} - {currentStudent.section}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Admission No:</span> <strong className="font-mono">{currentStudent.admissionNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Blood Group:</span> <strong className="font-mono text-rose-700">{currentStudent.bloodGroup || 'B+'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sports Fee:</span> <strong className="font-mono text-emerald-800">₹{formatNumber(currentStudent.sportsFee || 1200)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">School House:</span> <strong className="text-amber-800">Wisdom Blue House</strong>
                </div>
              </div>
            </div>

            {/* Sports Events Checklist */}
            <div className="mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2">
                Physical Education & Annual Sports Meet Records
              </h4>
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead>
                  <tr className="bg-purple-100/70 font-bold border-b border-purple-300 text-purple-950">
                    <th className="p-2 border-r border-slate-300">Activity / Discipline</th>
                    <th className="p-2 border-r border-slate-300">Status</th>
                    <th className="p-2 border-r border-slate-300">Kit Issued</th>
                    <th className="p-2 text-center">Master Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-200">Daily Drill & Yoga</td>
                    <td className="p-2 text-emerald-700 font-semibold border-r border-slate-200">Enrolled</td>
                    <td className="p-2 border-r border-slate-200">Yes (Trackwear)</td>
                    <td className="p-2 text-center text-slate-400">✓</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-200">Running / Sprint (50m/100m)</td>
                    <td className="p-2 text-emerald-700 font-semibold border-r border-slate-200">Eligible</td>
                    <td className="p-2 border-r border-slate-200">Chest Badge</td>
                    <td className="p-2 text-center text-slate-400">✓</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-200">Annual Sports Day Participation</td>
                    <td className="p-2 text-purple-700 font-semibold border-r border-slate-200">Confirmed</td>
                    <td className="p-2 border-r border-slate-200">Certificate & Medal</td>
                    <td className="p-2 text-center text-slate-400">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="flex items-center justify-between border-t-2 border-purple-900 pt-3 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-500">Physical Education Teacher</span>
                <p className="font-semibold text-slate-700 text-[11px]">Wisdom Sports Dept</p>
              </div>

              <div className="text-right">
                <span className="font-serif italic font-bold text-slate-900 block text-xs underline">
                  R. Saravanan
                </span>
                <strong className="text-slate-900 block text-xs">{schoolInfo.adminName}</strong>
                <span className="text-[10px] text-slate-500">School Admin, Essur</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
