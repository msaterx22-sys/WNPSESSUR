import { PaymentReceipt, Student, SchoolInfo } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount || 0);
}

const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(num: number): string {
  let result = '';
  if (num >= 100) {
    result += singleDigits[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 10 && num <= 19) {
    result += twoDigits[num - 10] + ' ';
  } else if (num >= 20) {
    result += tens[Math.floor(num / 10)] + ' ' + singleDigits[num % 10] + ' ';
  } else if (num > 0) {
    result += singleDigits[num] + ' ';
  }
  return result.trim();
}

export function numberToIndianWords(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remaining = num;

  let words = '';
  if (crore > 0) words += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) words += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) words += convertLessThanThousand(thousand) + ' Thousand ';
  if (remaining > 0) words += convertLessThanThousand(remaining) + ' ';

  return words.trim() + ' Rupees Only';
}

export function generateUpiUrl(schoolInfo: SchoolInfo, amount: number, studentName: string, receiptNo?: string): string {
  const note = `Fee - ${studentName}${receiptNo ? ` Ref:${receiptNo}` : ''}`;
  const params = new URLSearchParams({
    pa: schoolInfo.upiId,
    pn: `${schoolInfo.name} - ${schoolInfo.adminName}`,
    am: amount > 0 ? amount.toString() : '',
    cu: 'INR',
    tn: note.substring(0, 30),
  });
  return `upi://pay?${params.toString()}`;
}

export function buildWhatsAppReceiptMessage(
  receipt: PaymentReceipt,
  school: SchoolInfo,
  studentTotalFee: number,
  studentTotalPaid: number
): string {
  const pending = Math.max(0, studentTotalFee - studentTotalPaid);
  const text = 
`🏫 *${school.name.toUpperCase()}*
📍 ${school.address}
📞 Admin: ${school.adminName} (${school.phone})
-----------------------------------------
📄 *FEE PAYMENT ACKNOWLEDGEMENT*
-----------------------------------------
*Receipt No:* ${receipt.receiptNumber}
*Date:* ${receipt.date}
*Student:* ${receipt.studentName} (${receipt.standard} - Sec ${receipt.section})
*Admission No:* ${receipt.admissionNo}
*Parent:* ${receipt.parentName}

💰 *Amount Paid:* ₹${formatNumber(receipt.amountPaid)}
💳 *Payment Mode:* ${receipt.paymentMode}${receipt.transactionReference ? ` (Ref: ${receipt.transactionReference})` : ''}
📦 *Category:* ${receipt.category}

*Fee Breakdown:*
- Tuition Fee: ₹${formatNumber(receipt.breakdown.tuition)}
${receipt.breakdown.van > 0 ? `- Van Fee: ₹${formatNumber(receipt.breakdown.van)}\n` : ''}${receipt.breakdown.sports > 0 ? `- Sports Fee: ₹${formatNumber(receipt.breakdown.sports)}\n` : ''}${receipt.breakdown.lateFee > 0 ? `- Late Fee: ₹${formatNumber(receipt.breakdown.lateFee)}\n` : ''}
📊 *Current Balance Due:* ₹${formatNumber(pending)}

-----------------------------------------
Thank you for your timely payment.
For any queries, contact Office Admin: ${school.adminName} (${school.phone})
UPI GPay: ${school.upiId}`;

  return encodeURIComponent(text);
}

export function buildWhatsAppPendingNotice(
  student: Student,
  school: SchoolInfo,
  totalFee: number,
  totalPaid: number,
  pendingAmount: number
): string {
  const text = 
`🏫 *${school.name.toUpperCase()}*
📍 ${school.address}
📞 Office Admin: ${school.adminName} (${school.phone})
-----------------------------------------
⚠️ *SCHOOL FEE PAYMENT REMINDER*
-----------------------------------------
Dear Parent (${student.parentName}),
This is a gentle reminder regarding the school fee for your child:

*Student Name:* ${student.name}
*Class & Sec:* ${student.standard} - ${student.section}
*Admission No:* ${student.admissionNo}

📊 *Total Annual Fee:* ₹${formatNumber(totalFee)}
✅ *Total Paid Till Date:* ₹${formatNumber(totalPaid)}
🔴 *Pending Due Amount:* *₹${formatNumber(pendingAmount)}*

Kindly clear the balance fees at the school office or via Google Pay / UPI:
*UPI ID:* ${school.upiId}
*GPay Mobile:* ${school.gpayPhone}
(Please share transaction screenshot after payment)

Office Admin: ${school.adminName}
Phone: ${school.phone}`;

  return encodeURIComponent(text);
}

export function cleanPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned;
  return cleaned;
}
