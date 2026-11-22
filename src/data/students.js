// Student logic. Every function is pure: it returns new data and never mutates its input.
import { BATCHES } from './model.js';
import { createInvoice } from './invoices.js';

// 'today' may be a Date or a 'YYYY-MM-DD' string; returns the current 'YYYY-MM'.
function toMonth(today = new Date()) {
  if (typeof today === 'string') return today.slice(0, 7);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

export function validateStudent(input = {}) {
  const errors = {};

  const name = String(input.name ?? '').trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Name must be 2-60 characters';

  const parentName = String(input.parentName ?? '').trim();
  if (!parentName) errors.parentName = 'Parent name is required';

  const phone = String(input.parentPhone ?? '').replace(/\s+/g, '');
  if (!/^\d{10}$/.test(phone)) errors.parentPhone = 'Phone must be exactly 10 digits';

  if (!BATCHES.includes(input.batch)) errors.batch = 'Choose a batch';

  const fee = Number(input.monthlyFee);
  if (String(input.monthlyFee ?? '').trim() === '' || !Number.isInteger(fee) || fee <= 0) {
    errors.monthlyFee = 'Fee must be a whole rupee amount above 0';
  }

  const due = Number(input.dueDay);
  if (String(input.dueDay ?? '').trim() === '' || !Number.isInteger(due) || due < 1 || due > 28) {
    errors.dueDay = 'Due day must be a whole number from 1 to 28';
  }

  return errors;
}

function normalize(input) {
  return {
    name: String(input.name).trim(),
    parentName: String(input.parentName).trim(),
    parentPhone: String(input.parentPhone).replace(/\s+/g, ''),
    batch: input.batch,
    monthlyFee: Number(input.monthlyFee),
    dueDay: Number(input.dueDay),
  };
}

// Seed style: 's1', 's2', ... New id is one above the highest existing numeric suffix.
function nextStudentId(students) {
  const max = students.reduce((m, s) => {
    const n = Number(String(s.id).replace(/^s/, ''));
    return Number.isInteger(n) && n > m ? n : m;
  }, 0);
  let n = max + 1;
  while (students.some((s) => s.id === `s${n}`)) n += 1;
  return `s${n}`;
}

export function addStudent(data, input, { createDraftInvoice = true, today } = {}) {
  const errors = validateStudent(input);
  if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0]);

  const student = { id: nextStudentId(data.students), ...normalize(input) };
  let newData = { ...data, students: [...data.students, student] };

  if (createDraftInvoice) {
    const month = toMonth(today);
    const exists = newData.invoices.some((inv) => inv.studentId === student.id && inv.month === month);
    if (!exists) {
      newData = createInvoice(newData, { studentId: student.id, month, amount: student.monthlyFee });
    }
  }
  return newData;
}

export function updateStudent(data, id, input) {
  const errors = validateStudent(input);
  if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0]);
  if (!data.students.some((s) => s.id === id)) throw new Error('Student not found');

  return {
    ...data,
    students: data.students.map((s) => (s.id === id ? { ...s, ...normalize(input), id } : s)),
  };
}

export function deleteStudent(data, id) {
  const removedInvoiceIds = new Set(
    data.invoices.filter((inv) => inv.studentId === id).map((inv) => inv.id)
  );
  return {
    ...data,
    students: data.students.filter((s) => s.id !== id),
    invoices: data.invoices.filter((inv) => inv.studentId !== id),
    payments: data.payments.filter((p) => !removedInvoiceIds.has(p.invoiceId)),
  };
}
