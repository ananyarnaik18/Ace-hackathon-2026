// Data model for TuitionDesk. All money is whole rupees. Dates are 'YYYY-MM-DD' strings.
//
// Student:       id, name, parentName, parentPhone, batch, monthlyFee, dueDay (1-28)
// Invoice:       id, studentId, month ('YYYY-MM'), amount, issueDate, dueDate, status (stored: 'draft' | 'sent' | 'paid'), amountPaid
// Payment:       id, invoiceId, amount, date, method ('upi' | 'cash')
// RecurringBill: id, name, amount, dueDay
//
// 'overdue' is never stored; it is derived by deriveStatus().
export const STATUS = { DRAFT: 'draft', SENT: 'sent', OVERDUE: 'overdue', PAID: 'paid' };
export const PAYMENT_METHOD = { UPI: 'upi', CASH: 'cash' };
export const BATCHES = ['Class 8 Maths', 'Class 9 Maths & Science', 'Class 10 Maths', 'Class 10 Science'];
// today: 'YYYY-MM-DD' string
// Drafts are never overdue; overdue applies only to sent invoices with an unpaid balance past the due date.
export function deriveStatus(invoice, today) {
  if (invoice.amountPaid >= invoice.amount) return STATUS.PAID;
  if (invoice.status === STATUS.DRAFT) return STATUS.DRAFT;
  if (invoice.dueDate < today) return STATUS.OVERDUE;
  return invoice.status;
}
