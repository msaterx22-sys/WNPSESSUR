import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useSchool } from '../context/SchoolContext';
import { Student, StandardClass } from '../types';
import { 
  formatCurrency, 
  buildWhatsAppPendingNotice, 
  cleanPhoneNumber 
} from '../utils/formatters';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Edit, 
  Trash2, 
  Bus, 
  Trophy, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  Printer,
  FileSpreadsheet,
  Download
} from 'lucide-react';

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/^\uFEFF/, '').replace(/[^a-z0-9]/g, '');

const readCell = (row: Record<string, unknown>, aliases: string[]): string => {
  const key = Object.keys(row).find(candidate => aliases.includes(normalizeHeader(candidate)));
  return key ? String(row[key] ?? '').trim() : '';
};

const readNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readBoolean = (value: string) => ['true', 'yes', 'y', '1', 'on'].includes(value.toLowerCase());

const readGender = (value: string): 'Boy' | 'Girl' => (
  ['girl', 'female', 'f'].includes(value.trim().toLowerCase()) ? 'Girl' : 'Boy'
);

const importHeaderAliases = {
  name: ['name', 'studentname', 'student', 'studentfullname'],
  admissionNo: ['admissionno', 'admissionnumber', 'admno', 'admissionid', 'admissioncode'],
  parentPhone: ['parentphone', 'parentmobile', 'phone', 'phoneno', 'mobileno', 'mobile', 'contactnumber'],
  fatherName: ['fathername', 'father', 'parentname', 'guardianname'],
  dateOfBirth: ['dateofbirth', 'dob', 'birthdate'],
};

const findImportHeaderRow = (sheet: XLSX.WorkSheet) => {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  const headerRow = rows.findIndex(row => {
    const headers = row.map(cell => normalizeHeader(String(cell ?? '')));
    return Object.values(importHeaderAliases).filter(aliases => headers.some(header => aliases.includes(header))).length >= 2;
  });
  return headerRow >= 0 ? headerRow : 0;
};

const today = () => new Date().toISOString().split('T')[0];
type SampleFormat = 'xlsx' | 'xls' | 'csv' | 'numbers';

interface StudentsViewProps {
  onAddNewStudent: () => void;
  onEditStudent: (student: Student) => void;
  onCollectPayment: (student: Student) => void;
  onViewFeeCard: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onAddNewStudent,
  onEditStudent,
  onCollectPayment,
  onViewFeeCard,
}) => {
  const { 
    students, 
    schoolInfo, 
    classList,
    getStudentTotalFee, 
    getStudentTotalPaid, 
    getStudentPending, 
    deleteStudent,
    setActiveTab,
    importStudents,
    feeStructure
  } = useSchool();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'pending' | 'paid' | 'van' | 'sports'>('all');
  const [sampleFormat, setSampleFormat] = useState<SampleFormat>('xlsx');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadImportSample = () => {
    const sampleRows = [
      ['Admission Number', 'Name', 'Class', 'PARENTPHONE', 'Father Name', 'Mother Name', 'Date of Birth', 'Gender', 'Address', 'Pin code', 'Blood Group', 'Section', 'Van Facility', 'Van Route', 'Van Fee', 'Sports Facility', 'Sports Fee', 'Tuition Fee', 'Other Fee', 'Discount', 'Late Fee', 'Admission Date', 'WhatsApp Number', 'Is RTE', 'RTE Application No', 'Notes'],
      ['ADM-2026-001', 'Sample Student', classList[0] || 'LKG', '9876543210', 'Sample Father', 'Sample Mother', '2019-06-15', 'Boy', 'Essur - 603301', '603301', 'O+', 'A', 'No', '', '0', 'No', '0', '', '0', '0', '0', today(), '9876543210', 'No', '', 'Delete this sample row before importing.'],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleRows);
    worksheet['!cols'] = sampleRows[0].map(() => ({ wch: 18 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Import Template');
    const isCsv = sampleFormat === 'csv' || sampleFormat === 'numbers';
    const extension = isCsv ? 'csv' : sampleFormat;
    const filename = `Wisdom_School_Student_Import_Sample${sampleFormat === 'numbers' ? '_Numbers' : ''}.${extension}`;
    XLSX.writeFile(workbook, filename, { bookType: isCsv ? 'csv' : sampleFormat });
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const headerRow = findImportHeaderRow(sheet);
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false, range: headerRow });
      const records = rows.flatMap((row, index) => {
        const name = readCell(row, importHeaderAliases.name);
        const admissionNo = readCell(row, importHeaderAliases.admissionNo);
        const parentPhone = readCell(row, importHeaderAliases.parentPhone);
        if (!name || !admissionNo || !parentPhone) return [];

        const standard = (readCell(row, ['standard', 'class', 'grade']) || classList[0] || 'LKG').toUpperCase() as StandardClass;
        const vanFacility = readBoolean(readCell(row, ['vanfacility', 'van', 'transport']));
        const sportsFacility = readBoolean(readCell(row, ['sportsfacility', 'sports']));
        const isRte = readBoolean(readCell(row, ['isrte', 'rte', 'rtequota']));

        return [{
          admissionNo,
          rollNo: readCell(row, ['rollno', 'rollnumber', 'roll']) || String(index + 1).padStart(2, '0'),
          name,
          standard,
          section: readCell(row, ['section', 'sec']) || 'A',
          gender: readGender(readCell(row, ['gender', 'sex'])),
          parentName: readCell(row, importHeaderAliases.fatherName) || 'Parent',
          parentPhone,
          whatsappNumber: readCell(row, ['whatsappnumber', 'whatsapp', 'whatsappno']) || parentPhone,
          address: readCell(row, ['address']) || 'Essur - 603301',
          dateOfBirth: readCell(row, importHeaderAliases.dateOfBirth),
          isRte,
          rteApplicationNo: readCell(row, ['rteapplicationno', 'rteapplication']),
          rteGovtReimbursed: readBoolean(readCell(row, ['rtegovtreimbursed', 'reimbursed'])),
          vanFacility,
          vanRoute: readCell(row, ['vanroute', 'route']),
          vanFee: vanFacility ? readNumber(readCell(row, ['vanfee', 'transportfee']), 4000) : 0,
          sportsFacility,
          sportsFee: sportsFacility ? readNumber(readCell(row, ['sportsfee']), 1200) : 0,
          tuitionFee: readNumber(readCell(row, ['tuitionfee', 'tuition']), isRte ? 0 : (feeStructure[standard] ?? 0)),
          otherFee: readNumber(readCell(row, ['otherfee', 'other'])),
          discount: readNumber(readCell(row, ['discount'])),
          lateFee: readNumber(readCell(row, ['latefee', 'fine'])),
          admissionDate: readCell(row, ['admissiondate', 'date']) || today(),
          bloodGroup: readCell(row, ['bloodgroup', 'blood']),
          notes: readCell(row, ['notes', 'remarks']),
        }];
      });

      if (records.length === 0) {
        alert('No valid rows found. Required columns are Name, Admission No, and Parent Phone.');
        return;
      }

      const result = importStudents(records);
      alert(`Imported ${result.imported} student${result.imported === 1 ? '' : 's'}. ${result.skipped} duplicate or invalid row${result.skipped === 1 ? '' : 's'} skipped.`);
    } catch (error) {
      console.error('Student import failed:', error);
      const detail = error instanceof Error ? ` Details: ${error.message}` : '';
      alert(`Could not read this file. CSV, XLS, and XLSX files are supported.${detail}`);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentPhone.includes(searchQuery) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.standard === selectedClass;

    const pending = getStudentPending(student);
    let matchesStatus = true;
    if (feeStatusFilter === 'pending') matchesStatus = pending > 0;
    if (feeStatusFilter === 'paid') matchesStatus = pending === 0;
    if (feeStatusFilter === 'van') matchesStatus = student.vanFacility;
    if (feeStatusFilter === 'sports') matchesStatus = student.sportsFacility;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleDelete = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete student "${student.name}" (Adm: ${student.admissionNo})? All associated fee receipts will also be removed.`)) {
      deleteStudent(student.id);
    }
  };

  const handleSendWhatsApp = (student: Student) => {
    const total = getStudentTotalFee(student);
    const paid = getStudentTotalPaid(student.id);
    const pending = getStudentPending(student);
    const encoded = buildWhatsAppPendingNotice(student, schoolInfo, total, paid, pending);
    const phone = cleanPhoneNumber(student.whatsappNumber || student.parentPhone);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5">
      
      {/* Search and Filters Header */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#2D312E]">
              Student Records & Fee Management ({filteredStudents.length})
            </h2>
            <p className="text-xs text-[#6B7280]">
              Manage admission records, track fees, van cards, edit fees, or phone call parents
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.numbers,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.apple.numbers"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F2F4F2] text-[#4F6D7A] border border-[#E2E8E2] font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              title="Import students from an Excel spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#89A894]" />
              <span>Import Excel</span>
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={sampleFormat}
                onChange={(event) => setSampleFormat(event.target.value as SampleFormat)}
                aria-label="Sample import file format"
                className="py-2 px-2 text-xs border border-[#E2E8E2] rounded-lg bg-white text-[#4F6D7A] font-bold outline-hidden cursor-pointer"
              >
                <option value="xlsx">XLSX</option>
                <option value="xls">XLS</option>
                <option value="csv">CSV</option>
                <option value="numbers">Numbers / CSV</option>
              </select>
              <button
                onClick={handleDownloadImportSample}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F2F4F2] text-[#4F6D7A] border border-[#E2E8E2] font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                title="Download a sample student import file"
              >
                <Download className="w-4 h-4 text-[#89A894]" />
                <span>Download Sample</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('bulk')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2D312E] hover:bg-[#1F2220] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              title="Open Bulk PDF Print, Download and WhatsApp Dispatch Hub"
            >
              <Printer className="w-4 h-4 text-[#89A894]" />
              <span>Bulk PDF & WhatsApp</span>
            </button>

            <button
              onClick={onAddNewStudent}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#89A894] hover:bg-[#789683] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Student</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8E2]/70">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by student name, admission no, phone..."
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
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs border border-[#E2E8E2] rounded-lg bg-[#FDFDFB] text-[#2D312E] font-medium outline-hidden"
            >
              <option value="all">All Fee Statuses</option>
              <option value="pending">Pending Dues Only</option>
              <option value="paid">Fully Paid Only</option>
              <option value="van">Van Facility Enrolled</option>
              <option value="sports">Sports Enrolled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F4F2] text-[#4F6D7A] font-bold border-b border-[#E2E8E2] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Parent Details</th>
                <th className="py-3 px-4">Transport / Sports</th>
                <th className="py-3 px-4 text-right">Total Fee</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Pending</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]/60">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const total = getStudentTotalFee(student);
                  const paid = getStudentTotalPaid(student.id);
                  const pending = getStudentPending(student);

                  return (
                    <tr key={student.id} className="hover:bg-[#F7F8F6]/80 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#2D312E] text-sm">{student.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[#6B7280]">
                          <span className="font-mono text-[11px] bg-[#F2F4F2] text-[#2D312E] px-1.5 py-0.2 rounded border border-[#E2E8E2]">
                            {student.admissionNo}
                          </span>
                          <span className="font-bold text-[#4F6D7A]">
                            {student.standard} - {student.section}
                          </span>
                          <span>(Roll: {student.rollNo})</span>
                        </div>
                      </td>

                      {/* Parent details with 1-click Call and WhatsApp */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#2D312E]">{student.parentName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[#6B7280]">{student.parentPhone}</span>
                          <a
                            href={`tel:${student.parentPhone}`}
                            title="Call Parent directly"
                            className="p-1 bg-[#F2F4F2] text-[#4F6D7A] hover:bg-[#E2E8E2] rounded border border-[#E2E8E2] transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleSendWhatsApp(student)}
                            title="Send WhatsApp notice"
                            className="p-1 bg-[#89A894]/15 text-[#4F6D7A] hover:bg-[#89A894]/25 rounded border border-[#89A894]/30 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Facilities */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {student.vanFacility ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F6D7A] bg-[#89A894]/15 px-2 py-0.5 rounded border border-[#89A894]/30 w-fit">
                              <Bus className="w-3 h-3" /> Van: ₹{student.vanFee}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#6B7280]">No Van</span>
                          )}

                          {student.sportsFacility && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F6D7A] bg-[#4F6D7A]/10 px-2 py-0.5 rounded border border-[#4F6D7A]/20 w-fit">
                              <Trophy className="w-3 h-3" /> Sports: ₹{student.sportsFee}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Fee */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[#2D312E]">
                        {formatCurrency(total)}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#89A894]">
                        {formatCurrency(paid)}
                      </td>

                      {/* Pending */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono font-bold text-xs ${
                          pending > 0 ? 'text-[#D68A6E]' : 'text-[#89A894]'
                        }`}>
                          {pending > 0 ? formatCurrency(pending) : 'CLEARED'}
                        </span>
                        {student.lateFee > 0 && (
                          <div className="text-[10px] text-[#D68A6E] font-medium">
                            +{formatCurrency(student.lateFee)} fine
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onCollectPayment(student)}
                            className="px-2.5 py-1 bg-[#4F6D7A] hover:bg-[#415A65] text-white font-bold rounded text-[11px] transition-colors shadow-2xs"
                            title="Collect payment & generate receipt slip"
                          >
                            Pay Fee
                          </button>

                          <button
                            onClick={() => onViewFeeCard(student)}
                            className="p-1.5 text-[#4F6D7A] hover:bg-[#F2F4F2] rounded transition-colors"
                            title="Print Fee Card / Van Pass / Sports Card"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 bg-[#F2F4F2] hover:bg-[#E2E8E2] text-[#4F6D7A] rounded border border-[#E2E8E2] transition-colors cursor-pointer"
                            title="Edit Student Information, Fees & Concessions"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(student)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Student Record"
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
                    No student records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
