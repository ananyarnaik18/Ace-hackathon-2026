// Invoice logic. Every function is pure: it returns new data and never mutates its input.
import { STATUS, PAYMENT_METHOD, deriveStatus } from './model.js';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86400000;

export function balanceOf(invoice) {
  return invoice.amount - invoice.amountPaid;
}

// Returns 0 unless the invoice is overdue on 'today' ('YYYY-MM-DD').
export function daysOverdue(invoice, today) {
  if (deriveStatus(invoice, today) !== STATUS.OVERDUE) return 0;
  return Math.round((Date.parse(today) - Date.parse(invoice.dueDate)) / MS_PER_DAY);
}

export function createInvoice(data, { studentId, month, amount }) {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) throw new Error('Student not found');
  if (!MONTH_RE.test(month)) throw new Error('Month must be YYYY-MM');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a whole rupee amount above 0');
  }
  const duplicate = data.invoices.some((inv) => inv.studentId === studentId && inv.month === month);
  if (duplicate) throw new Error('An invoice for this student and month already exists');

  const invoice = {
    id: `inv-${studentId}-${month}`,
    studentId,
    month,
    amount,
    issueDate: `${month}-01`,
    dueDate: `${month}-${String(student.dueDay).padStart(2, '0')}`,
    status: STATUS.DRAFT,
    amountPaid: 0,
  };
  return { ...data, invoices: [...data.invoices, invoice] };
}

// Creates a draft at monthlyFee for every student without an invoice for 'month'.
export function generateMonthInvoices(data, month) {
  if (!MONTH_RE.test(month)) throw new Error('Month must be YYYY-MM');
  let newData = data;
  let created = 0;
  for (const student of data.students) {
    const exists = newData.invoices.some((inv) => inv.studentId === student.id && inv.month === month);
    if (exists) continue;
    newData = createInvoice(newData, { studentId: student.id, month, amount: student.monthlyFee });
    created += 1;
  }
  return { data: newData, created };
}

export function markSent(data, invoiceId) {
  const target = data.invoices.find((inv) => inv.id === invoiceId);
  if (!target) throw new Error('Invoice not found');
  if (target.status !== STATUS.DRAFT) return { ...data };
  return {
    ...data,
    invoices: data.invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: STATUS.SENT } : inv
    ),
  };
}

export function recordPayment(data, invoiceId, { amount, date, method }) {
  const target = data.invoices.find((inv) => inv.id === invoiceId);
  if (!target) throw new Error('Invoice not found');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Payment must be a whole rupee amount above 0');
  }
  if (amount > balanceOf(target)) throw new Error('Payment is more than the balance due');
  if (!Object.values(PAYMENT_METHOD).includes(method)) throw new Error('Choose UPI or cash');
  if (!DATE_RE.test(date)) throw new Error('Enter a valid date');

  const payment = {
    id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    invoiceId,
    amount,
    date,
    method,
  };

  const amountPaid = target.amountPaid + amount;
  const newBalance = target.amount - amountPaid;
  let status = target.status;
  if (newBalance === 0) status = STATUS.PAID;
  else if (target.status === STATUS.DRAFT) status = STATUS.SENT;

  return {
    ...data,
    payments: [...data.payments, payment],
    invoices: data.invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, amountPaid, status } : inv
    ),
  };
}
