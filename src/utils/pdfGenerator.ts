import { jsPDF } from 'jspdf';
import { Student, SchoolInfo, PaymentReceipt } from '../types';
import { MonthlyPayrollRecord } from '../data/reportsData';
import { formatCurrency, formatNumber, numberToIndianWords } from './formatters';

export interface StudentFeeSummary {
  totalFee: number;
  totalPaid: number;
  pendingFee: number;
  receipts: PaymentReceipt[];
}

export interface ReceiptPdfOptions {
  layout?: 'single' | 'two_per_page';
  includePendingBalance?: boolean;
}

/**
 * Generates a formal Single Student Fee Statement / Demand Slip PDF
 */
export function generateStudentFeeSlipPdf(
  student: Student,
  school: SchoolInfo,
  summary: StudentFeeSummary,
  dueDate: string = 'Within 5 Days'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  renderSingleSlipPage(doc, student, school, summary, dueDate);
  return doc;
}

/**
 * Generates a Multi-Page Bulk Fee Statement PDF for all selected students
 */
export function generateBulkFeeStatementsPdf(
  students: Student[],
  school: SchoolInfo,
  getSummary: (s: Student) => StudentFeeSummary,
  dueDate: string = 'Within 5 Days'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage();
    }
    const summary = getSummary(student);
    renderSingleSlipPage(doc, student, school, summary, dueDate);
  });

  return doc;
}

/**
 * Generates Multi-Page Formal Fee Demand Notices / Overdue Reminders
 */
export function generateBulkDemandNoticesPdf(
  students: Student[],
  school: SchoolInfo,
  getSummary: (s: Student) => StudentFeeSummary,
  dueDate: string = 'Immediate Settlement'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage();
    }
    const summary = getSummary(student);
    renderDemandNoticePage(doc, student, school, summary, dueDate);
  });

  return doc;
}

export type PendingBalancePdfMode = 'all' | 'tuition' | 'van' | 'sports';

export function generatePendingBalancePdf(
  students: Student[],
  school: SchoolInfo,
  getSummary: (s: Student) => StudentFeeSummary,
  mode: PendingBalancePdfMode = 'all',
  dueDate: string = 'Within 5 Days'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const summary = getSummary(student);
    const paidTuition = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.tuition || 0), 0);
    const paidVan = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.van || 0), 0);
    const paidSports = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.sports || 0), 0);
    const tuitionPending = Math.max(0, (student.tuitionFee || 0) - paidTuition);
    const vanPending = student.vanFacility ? Math.max(0, (student.vanFee || 0) - paidVan) : 0;
    const sportsPending = student.sportsFacility ? Math.max(0, (student.sportsFee || 0) - paidSports) : 0;
    const totalPending = Math.max(0, summary.pendingFee);

    const categoryAmount = mode === 'tuition'
      ? tuitionPending
      : mode === 'van'
        ? vanPending
        : mode === 'sports'
          ? sportsPending
          : totalPending;

    renderPendingCategorySlipPage(doc, student, school, summary, dueDate, mode, {
      tuitionPending,
      vanPending,
      sportsPending,
      totalPending,
      categoryAmount,
    });
  });

  return doc;
}

/**
 * Generates Bulk Student ID Cards (4 cards per A4 page)
 */
export function generateBulkIdCardsPdf(
  students: Student[],
  school: SchoolInfo
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsPerPage = 10;
  students.forEach((student, index) => {
    const pageIndex = Math.floor(index / cardsPerPage);
    const cardPositionOnPage = index % cardsPerPage;

    if (index > 0 && cardPositionOnPage === 0) {
      doc.addPage();
    }

    const col = cardPositionOnPage % 2;
    const row = Math.floor(cardPositionOnPage / 2);
    const startX = 12 + col * 94.6;
    const startY = 10 + row * 56.5;

    renderIdCard(doc, student, school, startX, startY);
  });

  return doc;
}

export type StudentCardPdfType = 'idcard' | 'fee' | 'van' | 'sports';

export function generateStudentCardPdf(
  type: StudentCardPdfType,
  student: Student,
  school: SchoolInfo,
  summary: StudentFeeSummary,
): jsPDF {
  if (type === 'idcard') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
    renderIdCard(doc, student, school, 0, 0);
    return doc;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 14;
  const right = pageWidth - margin;
  const paidFor = (key: 'tuition' | 'van' | 'sports') => summary.receipts.reduce(
    (total, receipt) => total + (receipt.breakdown[key] || 0),
    0,
  );
  const lines: Array<{ label: string; applicable: number; paid: number }> = [];
  if (type === 'fee') {
    lines.push({ label: 'Annual Tuition Fee', applicable: student.isRte ? 0 : student.tuitionFee, paid: paidFor('tuition') });
    if (student.vanFacility) {
      lines.push({ label: `School Van Fee${student.vanRoute ? ` - ${student.vanRoute}` : ''}`, applicable: student.vanFee, paid: paidFor('van') });
    }
    if (student.sportsFacility) {
      lines.push({ label: 'Sports & Physical Activities Fee', applicable: student.sportsFee, paid: paidFor('sports') });
    }
    if (student.otherFee > 0) lines.push({ label: 'Other Fees', applicable: student.otherFee, paid: 0 });
    if (student.discount > 0) lines.push({ label: 'Concession / Discount', applicable: -student.discount, paid: 0 });
  } else if (type === 'van') {
    lines.push({ label: `Annual Van Fee${student.vanRoute ? ` - ${student.vanRoute}` : ''}`, applicable: student.vanFacility ? student.vanFee : 0, paid: paidFor('van') });
  } else {
    lines.push({ label: 'Annual Sports Fee', applicable: student.sportsFacility ? student.sportsFee : 0, paid: paidFor('sports') });
  }

  const title = type === 'fee'
    ? 'STUDENT FEE RECORD'
    : type === 'van'
      ? 'VAN FEE CARD'
      : 'SPORTS FEE CARD';
  const accent: [number, number, number] = type === 'van'
    ? [166, 103, 37]
    : type === 'sports'
      ? [93, 65, 130]
      : [79, 109, 122];

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, 13, right - margin, 36, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(45, 49, 46);
  doc.text(school.name, margin + 6, 22, { maxWidth: right - margin - 12 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${school.address} | ${school.phone}`, margin + 6, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text(`${title} - ${school.academicYear}`, margin + 6, 41);

  doc.setFillColor(247, 248, 246);
  doc.setDrawColor(226, 232, 226);
  doc.roundedRect(margin, 56, right - margin, 35, 2, 2, 'FD');
  const studentDetails = [
    [`Student: ${student.name}`, `Class: ${student.standard} - ${student.section}`],
    [`Admission No: ${student.admissionNo}`, `Roll No: ${student.rollNo}`],
    [`Parent / Guardian: ${student.parentName}`, `Contact: ${student.parentPhone}`],
  ];
  studentDetails.forEach((row, index) => {
    const y = 66 + index * 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 49, 46);
    doc.text(row[0], margin + 5, y, { maxWidth: 82 });
    doc.text(row[1], 111, y, { maxWidth: 75 });
  });

  const tableY = 102;
  const col1 = margin + 4;
  const col2 = 120;
  const col3 = 151;
  const col4 = right - 4;
  doc.setFillColor(...accent);
  doc.rect(margin, tableY, right - margin, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Fee Component', col1, tableY + 6);
  doc.text('Applicable', col2, tableY + 6, { align: 'right' });
  doc.text('Paid', col3, tableY + 6, { align: 'right' });
  doc.text('Pending', col4, tableY + 6, { align: 'right' });

  let rowY = tableY + 9;
  lines.forEach((line, index) => {
    const pending = Math.max(0, line.applicable - line.paid);
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 248);
      doc.rect(margin, rowY, right - margin, 10, 'F');
    }
    doc.setDrawColor(226, 232, 226);
    doc.line(margin, rowY + 10, right, rowY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 49, 46);
    doc.text(line.label, col1, rowY + 6.5, { maxWidth: 78 });
    doc.text(`INR ${formatNumber(Math.abs(line.applicable))}${line.applicable < 0 ? ' CR' : ''}`, col2, rowY + 6.5, { align: 'right' });
    doc.text(`INR ${formatNumber(line.paid)}`, col3, rowY + 6.5, { align: 'right' });
    doc.text(`INR ${formatNumber(pending)}`, col4, rowY + 6.5, { align: 'right' });
    rowY += 10;
  });

  const totalLine = type === 'fee'
    ? { applicable: summary.totalFee, paid: summary.totalPaid, pending: summary.pendingFee }
    : type === 'van'
      ? { applicable: student.vanFacility ? student.vanFee : 0, paid: paidFor('van'), pending: Math.max(0, (student.vanFacility ? student.vanFee : 0) - paidFor('van')) }
      : { applicable: student.sportsFacility ? student.sportsFee : 0, paid: paidFor('sports'), pending: Math.max(0, (student.sportsFacility ? student.sportsFee : 0) - paidFor('sports')) };

  doc.setFillColor(242, 244, 242);
  doc.rect(margin, rowY, right - margin, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('TOTAL', col1, rowY + 8);
  doc.text(`INR ${formatNumber(totalLine.applicable)}`, col2, rowY + 8, { align: 'right' });
  doc.text(`INR ${formatNumber(totalLine.paid)}`, col3, rowY + 8, { align: 'right' });
  doc.setTextColor(180, 55, 55);
  doc.text(`INR ${formatNumber(totalLine.pending)}`, col4, rowY + 8, { align: 'right' });

  const signatureY = 230;
  if (school.principalSignatureUrl?.startsWith('data:image/')) {
    const imageFormat = school.principalSignatureUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
    doc.addImage(school.principalSignatureUrl, imageFormat, right - 51, signatureY - 15, 36, 12);
  }
  doc.setDrawColor(150, 150, 150);
  doc.line(right - 58, signatureY, right - 8, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, right - 33, signatureY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Principal / Correspondent', right - 33, signatureY + 10, { align: 'center' });
  doc.setFontSize(7);
  doc.text('This is a computer-generated school record.', pageWidth / 2, 282, { align: 'center' });

  return doc;
}

/**
 * Generates a Consolidated Multi-Page (or 2-per-page) PDF containing all selected payment receipts
 */
export function generateBulkReceiptsPdf(
  receipts: PaymentReceipt[],
  school: SchoolInfo,
  getStudentInfo?: (studentId: string) => { totalFee: number; totalPaid: number; pendingFee: number } | undefined,
  options: ReceiptPdfOptions = { layout: 'single', includePendingBalance: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (options.layout === 'two_per_page') {
    receipts.forEach((receipt, index) => {
      const positionOnPage = index % 2;

      if (index > 0 && positionOnPage === 0) {
        doc.addPage();
      }

      const startY = positionOnPage === 0 ? 8 : 152;
      const studentInfo = getStudentInfo ? getStudentInfo(receipt.studentId) : undefined;
      renderOfficialReceiptSlipHalfPage(doc, receipt, school, startY, studentInfo, options.includePendingBalance ?? true);

      // Draw dashed line between top and bottom slip on the page
      if (positionOnPage === 0 && index < receipts.length - 1) {
        doc.setDrawColor(180, 190, 180);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(8, 148, 202, 148);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(140, 140, 140);
        doc.text('- - - - - - - - - - - - - - - - - - - - [ Cut Here / Perforation ] - - - - - - - - - - - - - - - - - - - -', 105, 147.5, { align: 'center' });
        doc.setLineDashPattern([], 0); // Reset dash
      }
    });
  } else {
    // 1 receipt per A4 page
    receipts.forEach((receipt, index) => {
      if (index > 0) {
        doc.addPage();
      }
      const studentInfo = getStudentInfo ? getStudentInfo(receipt.studentId) : undefined;
      renderOfficialReceiptSlipFullPage(doc, receipt, school, studentInfo, options.includePendingBalance ?? true);
    });
  }

  return doc;
}

/**
 * Generates a Single Official Payment Receipt PDF
 */
export function generateSingleReceiptPdf(
  receipt: PaymentReceipt,
  school: SchoolInfo,
  studentInfo?: { totalFee: number; totalPaid: number; pendingFee: number }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  renderOfficialReceiptSlipFullPage(doc, receipt, school, studentInfo, true);
  return doc;
}

// --------------------------------------------------------------------------
// INTERNAL PDF PAGE RENDERERS
// --------------------------------------------------------------------------

function renderSingleSlipPage(
  doc: jsPDF,
  student: Student,
  school: SchoolInfo,
  summary: StudentFeeSummary,
  dueDate: string
) {
  // Page Border
  doc.setDrawColor(79, 109, 122); // #4F6D7A Slate Blue
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setDrawColor(226, 232, 226);
  doc.setLineWidth(0.3);
  doc.rect(9.5, 9.5, 191, 278);

  // Top Header Banner
  doc.setFillColor(45, 49, 46); // #2D312E Dark Slate
  doc.rect(10, 10, 190, 26, 'F');

  // School Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(school.name.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(214, 138, 110); // #D68A6E Terracotta
  doc.text(`${school.address} | Phone: ${school.phone}`, 105, 24, { align: 'center' });
  doc.setTextColor(200, 200, 200);
  doc.text(`Official Fee Statement & Academic Dues Card | Academic Year ${school.academicYear}`, 105, 30, { align: 'center' });

  // Document Title Bar
  doc.setFillColor(242, 244, 242);
  doc.rect(10, 37, 190, 8, 'F');
  doc.setDrawColor(200, 210, 200);
  doc.line(10, 45, 200, 45);

  doc.setTextColor(79, 109, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('STUDENT CUM ACADEMIC FEE LEDGER', 14, 42.5);

  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Statement Date: ${issueDate}`, 196, 42.5, { align: 'right' });

  // Student Info Box
  doc.setFillColor(253, 253, 251);
  doc.roundedRect(12, 48, 186, 32, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Student Name:', 16, 55);
  doc.text('Admission No:', 16, 62);
  doc.text('Standard & Section:', 16, 69);
  doc.text('Roll Number:', 16, 76);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name.toUpperCase(), 50, 55);
  doc.setFont('courier', 'bold');
  doc.text(student.admissionNo, 50, 62);
  doc.setFont('helvetica', 'bold');
  doc.text(`Class ${student.standard} - Section ${student.section}`, 50, 69);
  doc.text(student.rollNo || 'N/A', 50, 76);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Parent / Guardian:', 110, 55);
  doc.text('Mobile Number:', 110, 62);
  doc.text('Residential Address:', 110, 69);
  doc.text('Student Category:', 110, 76);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(student.parentName, 148, 55);
  doc.text(student.parentPhone, 148, 62);
  doc.setFont('helvetica', 'normal');
  doc.text((student.address || 'Essur').substring(0, 30), 148, 69);
  doc.setFont('helvetica', 'bold');
  if (student.isRte) {
    doc.setTextColor(79, 109, 122);
    doc.text(`RTE 25% Free Quota (${student.rteApplicationNo || 'Govt Approved'})`, 148, 76);
  } else {
    doc.setTextColor(45, 49, 46);
    doc.text('General Admission', 148, 76);
  }

  // 3-Box Financial Summary Tiles
  const boxY = 84;
  // Total Prescribed Fee
  doc.setFillColor(242, 244, 242);
  doc.roundedRect(12, boxY, 58, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL ANNUAL FEE', 41, boxY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(45, 49, 46);
  doc.text(`Rs. ${formatNumber(summary.totalFee)}`, 41, boxY + 13, { align: 'center' });

  // Total Paid
  doc.setFillColor(235, 245, 238);
  doc.roundedRect(76, boxY, 58, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 109, 122);
  doc.text('TOTAL PAID TILL DATE', 105, boxY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 120, 70);
  doc.text(`Rs. ${formatNumber(summary.totalPaid)}`, 105, boxY + 13, { align: 'center' });

  // Current Pending Due
  const pendingColor = summary.pendingFee > 0 ? [214, 60, 60] : [40, 120, 70];
  doc.setFillColor(summary.pendingFee > 0 ? 255 : 235, summary.pendingFee > 0 ? 240 : 245, summary.pendingFee > 0 ? 240 : 238);
  doc.roundedRect(140, boxY, 58, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(summary.pendingFee > 0 ? 180 : 79, summary.pendingFee > 0 ? 40 : 109, summary.pendingFee > 0 ? 40 : 122);
  doc.text('BALANCE PENDING DUE', 169, boxY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(pendingColor[0], pendingColor[1], pendingColor[2]);
  doc.text(`Rs. ${formatNumber(summary.pendingFee)}`, 169, boxY + 13.5, { align: 'center' });

  // Section: Prescribed Fee Breakdown Table
  let currentY = 108;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('1. PRESCRIBED ANNUAL FEE COMPONENT BREAKDOWN', 12, currentY);

  currentY += 3;
  // Table Header
  doc.setFillColor(79, 109, 122);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('Fee Component / Description', 16, currentY + 4.2);
  doc.text('Schedule / Applicable Type', 105, currentY + 4.2);
  doc.text('Amount (INR)', 194, currentY + 4.2, { align: 'right' });

  currentY += 6;
  const breakdownRows = [
    { name: `Annual Base Tuition Fee (Class ${student.standard})`, type: student.isRte ? 'RTE 25% Government Scheme Waiver' : 'Annual Academic Tuition', amt: student.tuitionFee },
    { name: 'School Transport / Van Facility', type: student.vanFacility ? `Route: ${student.vanRoute || 'Essur Route'}` : 'Not Enrolled', amt: student.vanFacility ? student.vanFee : 0 },
    { name: 'Sports, Kits & Physical Training Activities', type: student.sportsFacility ? 'Full Year Sports Subscription' : 'Not Enrolled', amt: student.sportsFacility ? student.sportsFee : 0 },
    { name: 'Special Materials / Activity & Exam Fees', type: 'Annual Materials / Lab & Library', amt: student.otherFee || 0 },
    { name: 'Special Concession / Scholarship Discount', type: student.discount > 0 ? 'Institutional Merit / Concession' : 'None', amt: student.discount > 0 ? -student.discount : 0 },
  ];

  breakdownRows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 253 : 246, i % 2 === 0 ? 253 : 248, i % 2 === 0 ? 251 : 246);
    doc.rect(12, currentY, 186, 5.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 49, 46);
    doc.text(row.name, 16, currentY + 4);
    doc.setTextColor(100, 100, 100);
    doc.text(row.type, 105, currentY + 4);
    doc.setTextColor(row.amt < 0 ? 40 : 45, row.amt < 0 ? 120 : 49, row.amt < 0 ? 70 : 46);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${formatNumber(Math.abs(row.amt))}${row.amt < 0 ? ' (CR)' : ''}`, 194, currentY + 4, { align: 'right' });
    currentY += 5.5;
  });

  // Section: Payment Installment History
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('2. PAYMENT INSTALLMENTS & RECEIPTS ISSUED RECORD', 12, currentY);

  currentY += 3;
  // Receipts Table Header
  doc.setFillColor(79, 109, 122);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('Receipt No', 16, currentY + 4.2);
  doc.text('Date', 52, currentY + 4.2);
  doc.text('Payment Mode', 85, currentY + 4.2);
  doc.text('Reference / Cheque', 125, currentY + 4.2);
  doc.text('Amount Paid (INR)', 194, currentY + 4.2, { align: 'right' });

  currentY += 6;
  if (summary.receipts.length === 0) {
    doc.setFillColor(253, 253, 251);
    doc.rect(12, currentY, 186, 6.5, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('No payments have been recorded for this student yet.', 105, currentY + 4.5, { align: 'center' });
    currentY += 6.5;
  } else {
    summary.receipts.forEach((rc, i) => {
      doc.setFillColor(i % 2 === 0 ? 253 : 246, i % 2 === 0 ? 253 : 248, i % 2 === 0 ? 251 : 246);
      doc.rect(12, currentY, 186, 5.5, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(79, 109, 122);
      doc.text(rc.receiptNumber, 16, currentY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 49, 46);
      doc.text(rc.date, 52, currentY + 4);
      doc.text(rc.paymentMode, 85, currentY + 4);
      doc.setTextColor(100, 100, 100);
      doc.text((rc.transactionReference || 'Cash Voucher').substring(0, 20), 125, currentY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 120, 70);
      doc.text(`Rs. ${formatNumber(rc.amountPaid)}`, 194, currentY + 4, { align: 'right' });
      currentY += 5.5;
    });
  }

  // Payment Options & Bank Box
  currentY += 6;
  doc.setFillColor(242, 244, 242);
  doc.roundedRect(12, currentY, 186, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 109, 122);
  doc.text('OFFICIAL PAYMENT OPTIONS & INSTRUCTIONS', 16, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`1. Google Pay / PhonePe / BHIM UPI: ${school.upiId}`, 16, currentY + 11);
  doc.text(`2. GPay Linked Mobile: ${school.gpayPhone} (Send transaction screenshot to this WhatsApp number)`, 16, currentY + 16);
  doc.text(`3. Cash Payment: Directly at School Office, Essur between 9:00 AM and 4:30 PM`, 16, currentY + 21);
  doc.text(`4. For queries or concessions, please contact Admin: ${school.adminName} (${school.phone})`, 16, currentY + 26);

  // Signatures Area
  currentY += 34;
  doc.setDrawColor(180, 190, 180);
  doc.setLineWidth(0.4);

  // Left Signature: Parent / Guardian
  doc.line(16, currentY + 12, 65, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Parent / Guardian Signature', 40.5, currentY + 16, { align: 'center' });

  // Center: School Seal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 109, 122);
  doc.text('[ SCHOOL SEAL ]', 105, currentY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Wisdom Primary School, Essur', 105, currentY + 16, { align: 'center' });

  // Right Signature: Headmaster / Office In-Charge
  doc.line(145, currentY + 12, 194, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, 169.5, currentY + 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Office Admin / Correspondent', 169.5, currentY + 16, { align: 'center' });

  // Footer Note
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `This is an authentic computer generated fee statement from Wisdom Nursery and Primary School. Document ID: WNS-ST-${student.admissionNo}`,
    105,
    284,
    { align: 'center' }
  );
}

function renderDemandNoticePage(
  doc: jsPDF,
  student: Student,
  school: SchoolInfo,
  summary: StudentFeeSummary,
  dueDate: string
) {
  // Border
  doc.setDrawColor(214, 138, 110);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setDrawColor(226, 232, 226);
  doc.setLineWidth(0.3);
  doc.rect(9.5, 9.5, 191, 278);

  // Letterhead
  doc.setFillColor(45, 49, 46);
  doc.rect(10, 10, 190, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(school.name.toUpperCase(), 105, 19, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(214, 138, 110);
  doc.text(`${school.address} | Tel: ${school.phone} | Email: ${school.email}`, 105, 25, { align: 'center' });
  doc.setTextColor(200, 200, 200);
  doc.text(`Recognized by Government of Tamil Nadu | Office Admin: ${school.adminName}`, 105, 31, { align: 'center' });

  // Notice Bar
  doc.setFillColor(214, 60, 60);
  doc.rect(10, 41, 190, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL DEMAND NOTICE: OUTSTANDING SCHOOL FEE SETTLEMENT', 105, 47, { align: 'center' });

  // Reference and Date
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Ref No: WNS/FEE-NOTICE/${new Date().getFullYear()}/${student.admissionNo}`, 14, 56);
  doc.text(`Date: ${dateStr}`, 196, 56, { align: 'right' });

  // Recipient Block
  let y = 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('To:', 14, y);
  y += 5;
  doc.text(`Thiru / Tmt. ${student.parentName}`, 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Parent of: ${student.name} (Admission No: ${student.admissionNo})`, 14, y);
  y += 4.5;
  doc.text(`Standard: Class ${student.standard} - Sec ${student.section}`, 14, y);
  y += 4.5;
  doc.text(`Address: ${student.address || 'Essur, Tamil Nadu'}`, 14, y);
  y += 4.5;
  doc.text(`Mobile: ${student.parentPhone}`, 14, y);

  // Subject line
  y += 8;
  doc.setFillColor(242, 244, 242);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 109, 122);
  doc.text(`Sub: Settlement of Pending Tuition & Facilities Dues for Academic Year ${school.academicYear} - Reg.`, 16, y + 1.5);

  // Formal Notice Body
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const para1 = `Dear Parent,\n\nWe appreciate your continued partnership in your ward's educational journey at ${school.name}. As per our institutional accounts ledger, there remains an unsettled pending balance against the prescribed fee structure for ${student.name}.`;
  doc.text(para1, 14, y, { maxWidth: 182, lineHeightFactor: 1.4 });

  y += 18;
  // Dues Highlight Callout
  doc.setFillColor(255, 245, 245);
  doc.setDrawColor(214, 60, 60);
  doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 40, 40);
  doc.text('FEE ACCOUNT AUDIT SUMMARY:', 20, y + 7);

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Prescribed Annual Fee: Rs. ${formatNumber(summary.totalFee)}`, 20, y + 14);
  doc.text(`Fee Collected / Paid Till Date: Rs. ${formatNumber(summary.totalPaid)}`, 20, y + 20);

  doc.setFontSize(11);
  doc.setTextColor(214, 40, 40);
  doc.text(`OUTSTANDING BALANCE DUE: Rs. ${formatNumber(summary.pendingFee)}`, 20, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(45, 49, 46);
  doc.text(`Payment Deadline: ${dueDate}`, 120, y + 26);

  y += 36;
  const para2 = `In order to maintain the school's operational commitments, timely faculty salaries, and transportation maintenance, we kindly request you to remit the outstanding sum of Rs. ${formatNumber(summary.pendingFee)} on or before ${dueDate}.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(para2, 14, y, { maxWidth: 182, lineHeightFactor: 1.4 });

  y += 16;
  // Payment instructions
  doc.setFillColor(242, 244, 242);
  doc.roundedRect(14, y, 182, 32, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 109, 122);
  doc.text('MODES OF PAYMENT ACCEPTED:', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`• Google Pay / PhonePe UPI ID: ${school.upiId}`, 18, y + 12);
  doc.text(`• Official GPay Registered Mobile: ${school.gpayPhone}`, 18, y + 17);
  doc.text(`• Office Cash Counter: Wisdom Primary School Office, Essur (Working Hours: 9:00 AM - 4:30 PM)`, 18, y + 22);
  doc.text(`• After remittance, please send UTR / payment screenshot to ${school.phone} for receipt generation.`, 18, y + 27);

  y += 38;
  // Tamil note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'குறிப்பு: தங்களின் குழந்தையின் கல்வி தடையின்றி தொடர பள்ளி கட்டண நிலுவையை குறிப்பிட்ட காலத்திற்குள் செலுத்தி ஒத்துழைக்குமாறு அன்புடன் கேட்டுக்கொள்கிறோம்.',
    14,
    y,
    { maxWidth: 182 }
  );

  // Signatures
  y += 20;
  doc.setDrawColor(180, 190, 180);
  doc.line(14, y + 10, 60, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Office Stamp & Seal', 37, y + 14, { align: 'center' });

  doc.line(135, y + 10, 194, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, 164.5, y + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Headmaster / Office Administrator', 164.5, y + 14, { align: 'center' });
}

function renderPendingCategorySlipPage(
  doc: jsPDF,
  student: Student,
  school: SchoolInfo,
  summary: StudentFeeSummary,
  dueDate: string,
  mode: PendingBalancePdfMode,
  values: {
    tuitionPending: number;
    vanPending: number;
    sportsPending: number;
    totalPending: number;
    categoryAmount: number;
  }
) {
  const categoryTitle = mode === 'tuition'
    ? 'TUITION FEES ONLY - PENDING BALANCE'
    : mode === 'van'
      ? 'VAN FEES ONLY - PENDING BALANCE'
      : mode === 'sports'
        ? 'SPORTS FEES ONLY - PENDING BALANCE'
        : 'TOTAL PENDING BALANCE';

  const tuitionPaid = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.tuition || 0), 0);
  const vanPaid = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.van || 0), 0);
  const sportsPaid = summary.receipts.reduce((sum, receipt) => sum + (receipt.breakdown.sports || 0), 0);

  const titleMap = {
    tuition: { total: student.tuitionFee || 0, paid: tuitionPaid, pending: values.tuitionPending, label: 'Tuition Fee' },
    van: { total: student.vanFacility ? (student.vanFee || 0) : 0, paid: vanPaid, pending: values.vanPending, label: 'Van Transport' },
    sports: { total: student.sportsFacility ? (student.sportsFee || 0) : 0, paid: sportsPaid, pending: values.sportsPending, label: 'Sports Fee' },
    all: { total: summary.totalFee, paid: summary.totalPaid, pending: values.totalPending, label: 'Total Due' },
  } as const;

  const active = titleMap[mode];

  doc.setDrawColor(79, 109, 122);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setDrawColor(226, 232, 226);
  doc.setLineWidth(0.3);
  doc.rect(9.5, 9.5, 191, 278);

  doc.setFillColor(45, 49, 46);
  doc.rect(10, 10, 190, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(school.name.toUpperCase(), 105, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 138, 110);
  doc.text(`${school.address} | Phone: ${school.phone}`, 105, 25, { align: 'center' });

  doc.setFillColor(242, 244, 242);
  doc.rect(10, 35, 190, 12, 'F');
  doc.setTextColor(79, 109, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(categoryTitle, 14, 42.5);

  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Statement Date: ${issueDate}`, 196, 42.5, { align: 'right' });

  doc.setFillColor(253, 253, 251);
  doc.roundedRect(12, 52, 186, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Student Name:', 16, 59);
  doc.text('Class / Section:', 16, 66);
  doc.text('Admission No:', 16, 73);
  doc.text('Parent / Guardian:', 108, 59);
  doc.text('Mobile:', 108, 66);
  doc.text('Due Date:', 108, 73);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name.toUpperCase(), 52, 59);
  doc.text(`${student.standard} - ${student.section}`, 52, 66);
  doc.text(student.admissionNo, 52, 73);
  doc.text(student.parentName, 136, 59);
  doc.text(student.parentPhone, 136, 66);
  doc.text(dueDate, 136, 73);

  const boxY = 86;
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(12, boxY, 186, 24, 2, 2, 'FD');
  doc.setDrawColor(214, 60, 60);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, boxY, 186, 24, 2, 2, 'S');
  doc.setTextColor(180, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${active.label.toUpperCase()} TOTAL`, 18, boxY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Rs. ${formatNumber(active.pending)}`, 170, boxY + 15, { align: 'right' });

  const summaryY = 118;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('PENDING BALANCE BREAKDOWN', 14, summaryY);

  doc.setFillColor(79, 109, 122);
  doc.rect(12, summaryY + 4, 186, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text('Description', 16, summaryY + 9.2);
  doc.text('Amount (INR)', 194, summaryY + 9.2, { align: 'right' });

  let rowY = summaryY + 11;
  const rows = [
    { label: `${active.label} Total`, amount: active.total },
    { label: `${active.label} Paid Till Date`, amount: active.paid },
    { label: 'Outstanding Pending Balance', amount: active.pending },
  ];

  rows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 253 : 246, idx % 2 === 0 ? 253 : 248, idx % 2 === 0 ? 251 : 246);
    doc.rect(12, rowY, 186, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(45, 49, 46);
    doc.text(row.label, 16, rowY + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.amount >= 0 ? 45 : 40, row.amount >= 0 ? 49 : 120, row.amount >= 0 ? 46 : 70);
    doc.text(`Rs. ${formatNumber(row.amount)}`, 194, rowY + 4.8, { align: 'right' });
    rowY += 7;
  });

  rowY += 5;
  doc.setFillColor(242, 244, 242);
  doc.roundedRect(12, rowY, 186, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(79, 109, 122);
  doc.text('OFFICIAL PAYMENT INSTRUCTIONS', 16, rowY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`1. Please clear the pending ${active.label.toLowerCase()} balance of Rs. ${formatNumber(active.pending)} on or before ${dueDate}.`, 16, rowY + 11);
  doc.text(`2. UPI / GPay ID: ${school.upiId}`, 16, rowY + 16);
  doc.text(`3. Mobile: ${school.gpayPhone} | Office Admin: ${school.adminName} (${school.phone})`, 16, rowY + 21);

  const footerY = 205;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This fee statement is issued only for the selected pending category and should be settled at the earliest to avoid service disruption.', 14, footerY, { maxWidth: 182 });

  doc.setDrawColor(180, 190, 180);
  doc.line(14, 250, 70, 250);
  doc.line(140, 250, 196, 250);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Parent / Guardian Signature', 42, 255, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, 168, 249, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Office Admin / Correspondent', 168, 255, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `This is an authentic computer generated pending balance statement from Wisdom Nursery and Primary School. Document ID: WNS-PB-${student.admissionNo}`,
    105,
    272,
    { align: 'center' }
  );
}

function renderIdCard(
  doc: jsPDF,
  student: Student,
  school: SchoolInfo,
  startX: number,
  startY: number
) {
  const width = 85.6;
  const height = 54;
  doc.setDrawColor(79, 109, 122);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX + 0.8, startY + 0.8, width - 1.6, height - 1.6, 2, 2, 'S');

  doc.setFillColor(79, 109, 122);
  doc.roundedRect(startX + 1, startY + 1, width - 2, 12, 1.5, 1.5, 'F');
  doc.rect(startX + 1, startY + 9, width - 2, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(school.name.toUpperCase(), startX + 43, startY + 5.5, { align: 'center', maxWidth: 68 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text(`${school.address} | ${school.phone}`, startX + 43, startY + 9, { align: 'center', maxWidth: 68 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(255, 238, 230);
  doc.text(`STUDENT ID CARD  |  ${school.academicYear}`, startX + 43, startY + 11.5, { align: 'center' });

  const photoX = startX + 3.5;
  const photoY = startY + 16;
  const photoWidth = 15;
  const photoHeight = 19;
  doc.setFillColor(242, 244, 242);
  doc.setDrawColor(137, 168, 148);
  doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, 'FD');
  const imageFormat = student.photoUrl?.startsWith('data:image/png')
    ? 'PNG'
    : student.photoUrl?.startsWith('data:image/jpeg')
      ? 'JPEG'
      : undefined;
  if (student.photoUrl && imageFormat) {
    doc.addImage(student.photoUrl, imageFormat, photoX, photoY, photoWidth, photoHeight);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 100, 100);
    doc.text(student.photoUrl ? 'USE JPG / PNG' : 'PHOTO', photoX + photoWidth / 2, photoY + 10, { align: 'center' });
  }

  const detailsX = startX + 21;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(45, 49, 46);
  doc.text(student.name.toUpperCase(), detailsX, startY + 18, { maxWidth: 60 });
  doc.setFontSize(6.1);
  doc.setTextColor(79, 109, 122);
  doc.text(`${student.standard} - ${student.section}  |  Roll: ${student.rollNo}`, detailsX, startY + 22.5);

  const fields = [
    `Admission: ${student.admissionNo}`,
    `Parent: ${student.parentName}`,
    `Contact: ${student.parentPhone}`,
    `Blood Group: ${student.bloodGroup || 'N/A'}`,
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(45, 49, 46);
  fields.forEach((field, index) => {
    doc.text(field, detailsX, startY + 27 + index * 4.2, { maxWidth: 60 });
  });

  doc.setDrawColor(226, 232, 226);
  doc.line(startX + 3, startY + 38, startX + width - 3, startY + 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.3);
  doc.setTextColor(79, 109, 122);
  doc.text(`WISDOM-${student.admissionNo}`, startX + 4, startY + 43);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Valid: ${school.academicYear}${student.vanFacility ? `  |  Van: ${student.vanRoute || 'Yes'}` : ''}`, startX + 4, startY + 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, startX + width - 4, startY + 43, { align: 'right', maxWidth: 35 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.6);
  doc.setTextColor(100, 100, 100);
  doc.text('Principal / Correspondent', startX + width - 4, startY + 47, { align: 'right' });
}

// --------------------------------------------------------------------------
// OFFICIAL FEE RECEIPT SLIP RENDERERS
// --------------------------------------------------------------------------

function renderOfficialReceiptSlipFullPage(
  doc: jsPDF,
  receipt: PaymentReceipt,
  school: SchoolInfo,
  studentInfo?: { totalFee: number; totalPaid: number; pendingFee: number },
  includePending: boolean = true
) {
  // Page Double Border
  doc.setDrawColor(79, 109, 122); // #4F6D7A Slate Blue
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 194, 281);
  doc.setDrawColor(226, 232, 226);
  doc.setLineWidth(0.3);
  doc.rect(9.5, 9.5, 191, 278);

  // School Header Banner
  doc.setFillColor(45, 49, 46); // #2D312E Dark Slate
  doc.rect(10, 10, 190, 26, 'F');

  // School Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(school.name.toUpperCase(), 105, 18, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(137, 168, 148); // #89A894 Sage
  doc.text(school.tagline || 'Excellence in Primary Education & Character Building', 105, 24, { align: 'center' });
  doc.setTextColor(210, 210, 210);
  doc.text(`${school.address} | Phone: ${school.phone} | Email: ${school.email}`, 105, 30, { align: 'center' });

  // Receipt Document Subheader
  doc.setFillColor(242, 244, 242);
  doc.rect(10, 37, 190, 9, 'F');
  doc.setDrawColor(200, 210, 200);
  doc.line(10, 46, 200, 46);

  doc.setTextColor(79, 109, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('OFFICIAL FEE PAYMENT RECEIPT / PAID SLIP', 14, 43);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(45, 49, 46);
  doc.text(`Receipt No: ${receipt.receiptNumber}`, 196, 43, { align: 'right' });

  // Student & Payment Details Box
  doc.setFillColor(253, 253, 251);
  doc.roundedRect(12, 49, 186, 36, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Student Name:', 16, 56);
  doc.text('Admission No:', 16, 64);
  doc.text('Standard & Section:', 16, 72);
  doc.text('Parent / Guardian:', 16, 80);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.studentName.toUpperCase(), 52, 56);
  doc.setFont('courier', 'bold');
  doc.text(receipt.admissionNo, 52, 64);
  doc.setFont('helvetica', 'bold');
  doc.text(`Class ${receipt.standard} - Section ${receipt.section}`, 52, 72);
  doc.text(receipt.parentName, 52, 80);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Payment Date:', 115, 56);
  doc.text('Payment Mode:', 115, 64);
  doc.text('UTR / Reference:', 115, 72);
  doc.text('Parent Mobile:', 115, 80);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.date, 155, 56);
  doc.text(receipt.paymentMode, 155, 64);
  doc.setFont('courier', 'bold');
  doc.text(receipt.transactionReference || 'Cash Voucher', 155, 72);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.parentPhone || school.phone, 155, 80);

  // Section: Itemized Particulars Table
  let currentY = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('PARTICULARS OF FEE COMPONENT(S) RECEIVED', 12, currentY);

  currentY += 3;
  // Table Header
  doc.setFillColor(79, 109, 122);
  doc.rect(12, currentY, 186, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('#', 16, currentY + 4.8);
  doc.text('Fee Component / Description', 26, currentY + 4.8);
  doc.text('Head / Category', 115, currentY + 4.8);
  doc.text('Amount Received (INR)', 194, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Build rows from breakdown
  const rows: { desc: string; cat: string; amt: number }[] = [];
  if (receipt.breakdown) {
    if (receipt.breakdown.tuition > 0) {
      rows.push({ desc: `Academic Tuition & Course Fee (Class ${receipt.standard})`, cat: 'Tuition Fee', amt: receipt.breakdown.tuition });
    }
    if (receipt.breakdown.van > 0) {
      rows.push({ desc: 'School Van & Transport Facility Fee', cat: 'Van Transport', amt: receipt.breakdown.van });
    }
    if (receipt.breakdown.sports > 0) {
      rows.push({ desc: 'Sports, Physical Training & Activity Subscription', cat: 'Sports & Kit', amt: receipt.breakdown.sports });
    }
    if (receipt.breakdown.lateFee > 0) {
      rows.push({ desc: 'Late Submission Fine / Arrears Fee', cat: 'Late Fine', amt: receipt.breakdown.lateFee });
    }
    if (receipt.breakdown.other > 0) {
      rows.push({ desc: 'Exam Materials, Books & Incidental Charges', cat: 'Other / Misc', amt: receipt.breakdown.other });
    }
  }

  // Fallback if breakdown items are empty or 0
  if (rows.length === 0) {
    rows.push({
      desc: `School Academic Fee Payment (${receipt.category || 'General'})`,
      cat: receipt.category || 'Tuition Fee',
      amt: receipt.amountPaid
    });
  }

  rows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 253 : 246, idx % 2 === 0 ? 253 : 248, idx % 2 === 0 ? 251 : 246);
    doc.rect(12, currentY, 186, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(String(idx + 1), 16, currentY + 4.8);
    doc.setTextColor(45, 49, 46);
    doc.setFont('helvetica', 'bold');
    doc.text(row.desc, 26, currentY + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(row.cat, 115, currentY + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 49, 46);
    doc.text(`Rs. ${formatNumber(row.amt)}`, 194, currentY + 4.8, { align: 'right' });
    currentY += 7;
  });

  // Table Total Row
  doc.setFillColor(242, 244, 242);
  doc.rect(12, currentY, 186, 9, 'F');
  doc.setDrawColor(79, 109, 122);
  doc.setLineWidth(0.5);
  doc.line(12, currentY, 198, currentY);
  doc.line(12, currentY + 9, 198, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('TOTAL AMOUNT RECEIVED', 26, currentY + 6);
  doc.setFontSize(11);
  doc.setTextColor(79, 109, 122);
  doc.text(`Rs. ${formatNumber(receipt.amountPaid)}`, 194, currentY + 6.2, { align: 'right' });

  currentY += 13;

  // Amount In Words Box
  doc.setFillColor(248, 250, 248);
  doc.roundedRect(12, currentY, 186, 12, 1.5, 1.5, 'FD');
  doc.setDrawColor(220, 230, 220);
  doc.roundedRect(12, currentY, 186, 12, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('AMOUNT IN WORDS (INR):', 16, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 49, 46);
  doc.text(numberToIndianWords(receipt.amountPaid), 16, currentY + 9.5);

  currentY += 16;

  // Student Account Balance Summary (if requested)
  if (includePending && studentInfo) {
    const boxWidth = 59;
    // Tile 1: Annual Prescribed
    doc.setFillColor(242, 244, 242);
    doc.roundedRect(12, currentY, boxWidth, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL PRESCRIBED ANNUAL FEE', 12 + boxWidth / 2, currentY + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(45, 49, 46);
    doc.text(`Rs. ${formatNumber(studentInfo.totalFee)}`, 12 + boxWidth / 2, currentY + 11.5, { align: 'center' });

    // Tile 2: Paid Till Date
    doc.setFillColor(235, 245, 238);
    doc.roundedRect(75.5, currentY, boxWidth, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(79, 109, 122);
    doc.text('TOTAL PAID TILL DATE', 75.5 + boxWidth / 2, currentY + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 120, 70);
    doc.text(`Rs. ${formatNumber(studentInfo.totalPaid)}`, 75.5 + boxWidth / 2, currentY + 11.5, { align: 'center' });

    // Tile 3: Pending Balance
    const pending = studentInfo.pendingFee;
    const isPending = pending > 0;
    doc.setFillColor(isPending ? 255 : 235, isPending ? 240 : 245, isPending ? 240 : 238);
    doc.roundedRect(139, currentY, boxWidth, 16, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(isPending ? 180 : 79, isPending ? 40 : 109, isPending ? 40 : 122);
    doc.text('BALANCE PENDING DUE', 139 + boxWidth / 2, currentY + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(isPending ? 214 : 40, isPending ? 60 : 120, isPending ? 60 : 70);
    doc.text(isPending ? `Rs. ${formatNumber(pending)}` : 'NIL (FULLY CLEARED)', 139 + boxWidth / 2, currentY + 11.5, { align: 'center' });

    currentY += 20;
  }

  // Remarks / Notes if present
  if (receipt.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Remarks / Notes: ${receipt.notes}`, 14, currentY);
    currentY += 7;
  }

  // Payment Verification & Cashier Info
  doc.setFillColor(248, 249, 248);
  doc.roundedRect(12, currentY, 186, 16, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Payment Received by: ${receipt.collectedBy || `${school.adminName} - Admin`}`, 16, currentY + 5.5);
  doc.text(`School UPI Verification: ${school.upiId} (GPay: ${school.gpayPhone})`, 16, currentY + 11.5);
  doc.text(`Mode Verified: ${receipt.paymentMode} ${receipt.transactionReference ? `[Ref: ${receipt.transactionReference}]` : ''}`, 115, currentY + 5.5);
  doc.text(`Receipt Generation: Verified Computer System Record`, 115, currentY + 11.5);

  currentY += 24;

  // Signatures Section
  doc.setDrawColor(180, 190, 180);
  doc.setLineWidth(0.4);

  // Left: Cashier / Receiver Signature
  doc.line(16, currentY + 14, 65, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Cashier / Accountant Sign', 40.5, currentY + 18, { align: 'center' });

  // Center: School Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(79, 109, 122);
  doc.text('[ SCHOOL SEAL & STAMP ]', 105, currentY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Wisdom Primary School, Essur', 105, currentY + 18, { align: 'center' });

  // Right: Principal / Headmaster Signature
  doc.line(145, currentY + 14, 194, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 49, 46);
  doc.text(school.adminName, 169.5, currentY + 10, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Headmaster / Authorized Signatory', 169.5, currentY + 18, { align: 'center' });

  // Bottom Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text(`* This is an official computer-generated fee payment receipt issued by ${school.name} Office, ${school.address}.`, 105, 283, { align: 'center' });
}

function renderOfficialReceiptSlipHalfPage(
  doc: jsPDF,
  receipt: PaymentReceipt,
  school: SchoolInfo,
  startY: number,
  studentInfo?: { totalFee: number; totalPaid: number; pendingFee: number },
  includePending: boolean = true
) {
  const h = 136;
  const w = 194;
  const startX = 8;

  // Slip Border
  doc.setDrawColor(79, 109, 122);
  doc.setLineWidth(0.6);
  doc.rect(startX, startY, w, h);
  doc.setDrawColor(226, 232, 226);
  doc.setLineWidth(0.25);
  doc.rect(startX + 1.2, startY + 1.2, w - 2.4, h - 2.4);

  // Header Banner
  doc.setFillColor(45, 49, 46);
  doc.rect(startX + 2, startY + 2, w - 4, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(school.name.toUpperCase(), startX + w / 2, startY + 7.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(137, 168, 148);
  doc.text(`${school.address} | Phone: ${school.phone} | Admin: ${school.adminName}`, startX + w / 2, startY + 13, { align: 'center' });

  // Document Title Bar
  doc.setFillColor(242, 244, 242);
  doc.rect(startX + 2, startY + 19, w - 4, 6, 'F');
  doc.setDrawColor(200, 210, 200);
  doc.line(startX + 2, startY + 25, startX + w - 2, startY + 25);

  doc.setTextColor(79, 109, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', startX + 5, startY + 23.2);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(45, 49, 46);
  doc.text(`Receipt: ${receipt.receiptNumber} | Date: ${receipt.date}`, startX + w - 5, startY + 23.2, { align: 'right' });

  // Student & Payment Details Box
  let currY = startY + 28;
  doc.setFillColor(253, 253, 251);
  doc.roundedRect(startX + 4, currY, w - 8, 22, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Student Name:', startX + 7, currY + 5);
  doc.text('Admission No:', startX + 7, currY + 10.5);
  doc.text('Standard & Section:', startX + 7, currY + 16);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.studentName.toUpperCase(), startX + 38, currY + 5);
  doc.setFont('courier', 'bold');
  doc.text(receipt.admissionNo, startX + 38, currY + 10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Class ${receipt.standard} - Section ${receipt.section}`, startX + 38, currY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Parent / Guardian:', startX + 100, currY + 5);
  doc.text('Payment Mode:', startX + 100, currY + 10.5);
  doc.text('UTR / Ref & Mobile:', startX + 100, currY + 16);

  doc.setTextColor(45, 49, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.parentName, startX + 135, currY + 5);
  doc.text(receipt.paymentMode, startX + 135, currY + 10.5);
  doc.setFont('courier', 'bold');
  doc.text(`${receipt.transactionReference || 'Cash'} (${receipt.parentPhone})`, startX + 135, currY + 16);

  currY += 24;

  // Particulars Breakdown
  doc.setFillColor(79, 109, 122);
  doc.rect(startX + 4, currY, w - 8, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('#', startX + 7, currY + 3.5);
  doc.text('Particulars / Fee Head', startX + 15, currY + 3.5);
  doc.text('Amount Received (INR)', startX + w - 7, currY + 3.5, { align: 'right' });

  currY += 5;

  const rows: { desc: string; amt: number }[] = [];
  if (receipt.breakdown) {
    if (receipt.breakdown.tuition > 0) rows.push({ desc: `Tuition & Academic Term Fee (${receipt.standard})`, amt: receipt.breakdown.tuition });
    if (receipt.breakdown.van > 0) rows.push({ desc: 'Van & Transport Facility Fee', amt: receipt.breakdown.van });
    if (receipt.breakdown.sports > 0) rows.push({ desc: 'Sports & Activity Fee', amt: receipt.breakdown.sports });
    if (receipt.breakdown.lateFee > 0) rows.push({ desc: 'Late Fine / Arrears Fee', amt: receipt.breakdown.lateFee });
    if (receipt.breakdown.other > 0) rows.push({ desc: 'Other / Exam / Materials', amt: receipt.breakdown.other });
  }
  if (rows.length === 0) {
    rows.push({ desc: `School Fee Payment (${receipt.category || 'Tuition'})`, amt: receipt.amountPaid });
  }

  rows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 253 : 246, i % 2 === 0 ? 253 : 248, i % 2 === 0 ? 251 : 246);
    doc.rect(startX + 4, currY, w - 8, 4.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(String(i + 1), startX + 7, currY + 3.2);
    doc.setTextColor(45, 49, 46);
    doc.text(row.desc, startX + 15, currY + 3.2);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${formatNumber(row.amt)}`, startX + w - 7, currY + 3.2, { align: 'right' });
    currY += 4.5;
  });

  // Subtotal Bar
  doc.setFillColor(242, 244, 242);
  doc.rect(startX + 4, currY, w - 8, 6.5, 'F');
  doc.setDrawColor(79, 109, 122);
  doc.setLineWidth(0.4);
  doc.line(startX + 4, currY, startX + w - 4, currY);
  doc.line(startX + 4, currY + 6.5, startX + w - 4, currY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 49, 46);
  doc.text('TOTAL RECEIVED:', startX + 15, currY + 4.5);
  doc.setFontSize(9);
  doc.setTextColor(79, 109, 122);
  doc.text(`Rs. ${formatNumber(receipt.amountPaid)}`, startX + w - 7, currY + 4.8, { align: 'right' });

  currY += 9;

  // Words & Ledger Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`In Words: ${numberToIndianWords(receipt.amountPaid)}`, startX + 6, currY);

  if (includePending && studentInfo) {
    const dueTxt = studentInfo.pendingFee > 0 ? `Pending Due: Rs. ${formatNumber(studentInfo.pendingFee)}` : 'Dues: NIL (Fully Cleared)';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(studentInfo.pendingFee > 0 ? 180 : 40, studentInfo.pendingFee > 0 ? 40 : 120, studentInfo.pendingFee > 0 ? 40 : 70);
    doc.text(dueTxt, startX + w - 7, currY, { align: 'right' });
  }

  currY += 7;

  // Signatures
  doc.setDrawColor(180, 190, 180);
  doc.setLineWidth(0.3);
  doc.line(startX + 10, currY + 8, startX + 50, currY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text('Cashier Signature', startX + 30, currY + 11.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(79, 109, 122);
  doc.text('[ SCHOOL STAMP ]', startX + w / 2, currY + 8, { align: 'center' });

  doc.line(startX + w - 50, currY + 8, startX + w - 10, currY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(45, 49, 46);
  doc.text(`${school.adminName} (Admin)`, startX + w - 30, currY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized Signatory', startX + w - 30, currY + 11.5, { align: 'center' });
}

/**
 * Universal tabular PDF report generator for all school registers
 */
export function generateReportTablePdf(
  reportTitle: string,
  reportSubtitle: string,
  headers: string[],
  rows: (string | number)[][],
  school: SchoolInfo,
  orientation: 'portrait' | 'landscape' = 'landscape'
): jsPDF {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const colCount = headers.length;
  const colWidth = contentWidth / colCount;

  const printHeader = (pageNum: number) => {
    // School Header Box
    doc.setFillColor(242, 244, 242);
    doc.rect(margin, margin, contentWidth, 22, 'F');
    doc.setDrawColor(79, 109, 122);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, contentWidth, 22, 'S');

    // School Name & Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(45, 49, 46);
    doc.text(school.name || 'WISDOM NURSERY & PRIMARY SCHOOL', margin + 6, margin + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${school.address || 'Essur Village, Tindivanam'} | Phone: ${school.phone || '9176593129'} | Affiliation: Dept of Elementary Education`, margin + 6, margin + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 109, 122);
    doc.text(reportTitle.toUpperCase(), margin + 6, margin + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const dateStr = `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    doc.text(`${reportSubtitle}  |  ${dateStr}`, margin + contentWidth - 6, margin + 18, { align: 'right' });
  };

  let currY = margin + 26;
  printHeader(1);

  // Table Headers
  const printTableHead = (y: number) => {
    doc.setFillColor(79, 109, 122);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    headers.forEach((h, idx) => {
      const x = margin + idx * colWidth + 2;
      const cleanH = String(h).replace(/["']/g, '');
      doc.text(cleanH.length > 22 ? cleanH.slice(0, 20) + '..' : cleanH, x, y + 4.8);
    });
    return y + 7;
  };

  currY = printTableHead(currY);

  let pageIndex = 1;

  rows.forEach((row, rowIdx) => {
    // Check if new page needed
    if (currY + 7 > pageHeight - 20) {
      // Footer before page break
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(`Page ${pageIndex}  |  Wisdom School Management Information System`, margin, pageHeight - 8);
      doc.text('Authorized: R. Saravanan (Admin)', margin + contentWidth, pageHeight - 8, { align: 'right' });

      doc.addPage();
      pageIndex++;
      printHeader(pageIndex);
      currY = margin + 26;
      currY = printTableHead(currY);
    }

    // Row background
    doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 249, rowIdx % 2 === 0 ? 255 : 248);
    doc.rect(margin, currY, contentWidth, 6, 'F');

    // Row border
    doc.setDrawColor(226, 232, 226);
    doc.setLineWidth(0.2);
    doc.line(margin, currY + 6, margin + contentWidth, currY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(45, 49, 46);

    row.forEach((cell, cIdx) => {
      const x = margin + cIdx * colWidth + 2;
      const cellText = String(cell ?? '').replace(/["']/g, '');
      doc.text(cellText.length > 24 ? cellText.slice(0, 22) + '..' : cellText, x, currY + 4.2);
    });

    currY += 6;
  });

  // Final Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`Page ${pageIndex}  |  Wisdom School Official Ledger  |  Essur Village`, margin, pageHeight - 8);
  doc.setFont('helvetica', 'bold');
  doc.text('Principal & Correspondent: R. Saravanan', margin + contentWidth, pageHeight - 8, { align: 'right' });

  return doc;
}

export function generateSalarySlipPdf(
  payroll: MonthlyPayrollRecord,
  school: SchoolInfo,
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const salaryAmount = (amount: number) => `INR ${formatNumber(amount)}`;
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const gap = 5;
  const columnWidth = (contentWidth - gap) / 2;
  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setDrawColor(79, 109, 122);
  doc.setFillColor(242, 244, 242);
  doc.roundedRect(margin, 12, contentWidth, 31, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(45, 49, 46);
  doc.text(school.name || 'Wisdom Nursery and Primary School', margin + 5, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${school.address || 'Essur Village & Post - 603301'} | Phone: ${school.phone}`, margin + 5, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 109, 122);
  doc.text(`OFFICIAL SALARY PAY SLIP - ${payroll.month}`, margin + 5, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${generatedOn}`, margin + contentWidth - 5, 34, { align: 'right' });

  const detailsY = 48;
  doc.setDrawColor(226, 232, 226);
  doc.setFillColor(247, 248, 246);
  doc.roundedRect(margin, detailsY, contentWidth, 34, 2, 2, 'FD');
  const details = [
    [`Employee Name: ${payroll.staffName}`, `Employee Code: ${payroll.employeeCode}`],
    [`Designation: ${payroll.designation}`, `Department: ${payroll.department}`],
    [`Bank Account: ${payroll.bankName} - ${payroll.accountNo}`, `IFSC: ${payroll.ifscCode}`],
    [`UAN: ${payroll.uanNumber}`, `PAN: ${payroll.panNumber}`],
  ];
  doc.setFontSize(8);
  details.forEach((row, index) => {
    const y = detailsY + 8 + index * 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(row[0], margin + 4, y, { maxWidth: columnWidth - 5 });
    doc.text(row[1], margin + columnWidth + gap + 4, y, { maxWidth: columnWidth - 5 });
  });

  const tableY = 91;
  const tableHeight = 8;
  const rowHeight = 8;
  const earnings = [
    ['Basic Pay', payroll.basicSalary],
    ['HRA', payroll.hra],
    ['DA', payroll.da],
    ['Conveyance', payroll.conveyance],
    ['Special Allowance', payroll.specialAllowance],
  ] as const;
  const deductions = [
    ['EPF Employee (12%)', payroll.epfEmployee],
    ['ESI Employee (0.75%)', payroll.esiEmployee],
    ['Professional Tax', payroll.professionalTax],
    ['Salary Advance', payroll.advanceOrLoanDeduction],
  ] as const;

  const drawPayColumn = (
    x: number,
    title: string,
    items: ReadonlyArray<readonly [string, number]>,
    totalLabel: string,
    total: number,
    color: [number, number, number],
  ) => {
    doc.setFillColor(...color);
    doc.rect(x, tableY, columnWidth, tableHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, x + 3, tableY + 5.4);

    items.forEach(([label, amount], index) => {
      const y = tableY + tableHeight + index * rowHeight;
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 248);
        doc.rect(x, y, columnWidth, rowHeight, 'F');
      }
      doc.setDrawColor(226, 232, 226);
      doc.line(x, y + rowHeight, x + columnWidth, y + rowHeight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(70, 75, 72);
      doc.text(label, x + 3, y + 5.3, { maxWidth: columnWidth - 32 });
      doc.text(salaryAmount(amount), x + columnWidth - 3, y + 5.3, { align: 'right' });
    });

    const totalY = tableY + tableHeight + items.length * rowHeight;
    doc.setFillColor(242, 244, 242);
    doc.rect(x, totalY, columnWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...color);
    doc.text(totalLabel, x + 3, totalY + 5.3);
    doc.text(salaryAmount(total), x + columnWidth - 3, totalY + 5.3, { align: 'right' });
  };

  drawPayColumn(margin, 'Earnings', earnings, 'Gross Earnings', payroll.grossSalary, [79, 109, 122]);
  drawPayColumn(margin + columnWidth + gap, 'Deductions', deductions, 'Total Deductions', payroll.totalDeductions, [214, 138, 110]);

  const netY = 157;
  doc.setDrawColor(137, 168, 148);
  doc.setFillColor(232, 240, 235);
  doc.roundedRect(margin, netY, contentWidth, 21, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(45, 49, 46);
  doc.text('Net Salary Payable', margin + 5, netY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Payment: ${payroll.paymentMode} | Reference: ${payroll.transactionReference}`, margin + 5, netY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(45, 49, 46);
  doc.text(salaryAmount(payroll.netPayable), margin + contentWidth - 5, netY + 13, { align: 'right' });

  const signatureY = 238;
  doc.setDrawColor(170, 175, 171);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 8, signatureY, margin + 68, signatureY);
  doc.line(margin + contentWidth - 68, signatureY, margin + contentWidth - 8, signatureY);
  doc.setLineDashPattern([], 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Staff Signature', margin + 38, signatureY + 5, { align: 'center' });
  doc.text('Headmaster / Correspondent', margin + contentWidth - 38, signatureY + 5, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`${school.name} | ${school.address}`, pageWidth / 2, 282, { align: 'center' });
  doc.text('This is a computer-generated salary slip.', pageWidth / 2, 287, { align: 'center' });

  return doc;
}
