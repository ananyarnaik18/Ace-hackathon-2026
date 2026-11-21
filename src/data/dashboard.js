import { STATUS, deriveStatus } from './model.js';
import { balanceOf, daysOverdue } from './invoices.js';
import { addDaysIso } from '../utils/date.js';
import { formatRupees, formatDate } from '../utils/format.js';
import { buildForecast } from './forecast.js';

export const DUE_SOON_DAYS = 3;
export const ALERT_LIMIT = 5;
export const CASH_HORIZON = 30;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function findStudent(data, id) { return data.students.find((s) => s.id === id); }
function isOpen(inv) { return inv.status !== STATUS.DRAFT && balanceOf(inv) > 0; }
function monthLabel(ym) { return MONTHS[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4); }

export function owedRows(data, today) {
  const rows = [];
  for (const inv of data.invoices) {
    if (!isOpen(inv)) continue;
    const student = findStudent(data, inv.studentId);
    if (!student) continue;
    rows.push({
      invoice: inv,
      student,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      balance: balanceOf(inv),
      dueDate: inv.dueDate,
      daysOverdue: daysOverdue(inv, today),
      displayStatus: deriveStatus(inv, today),
      partial: inv.amountPaid > 0,
    });
  }
  rows.sort((a, b) =>
    b.daysOverdue - a.daysOverdue ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.student.name.localeCompare(b.student.name));
  return rows;
}

export function summarize(data, today) {
  const rows = owedRows(data, today);
  const month = today.slice(0, 7);
  const overdueRows = rows.filter((r) => r.displayStatus === STATUS.OVERDUE);
  return {
    outstanding: rows.reduce((sum, r) => sum + r.balance, 0),
    overdueTotal: overdueRows.reduce((sum, r) => sum + r.balance, 0),
    overdueCount: overdueRows.length,
    collectedThisMonth: data.payments
      .filter((p) => p.date.slice(0, 7) === month)
      .reduce((sum, p) => sum + p.amount, 0),
    studentsOwing: new Set(rows.map((r) => r.invoice.studentId)).size,
  };
}

export function dueSoonInvoices(data, today) {
  const last = addDaysIso(today, DUE_SOON_DAYS);
  const out = [];
  for (const inv of data.invoices) {
    if (!isOpen(inv)) continue;
    if (deriveStatus(inv, today) !== STATUS.SENT) continue;
    if (inv.dueDate < today || inv.dueDate > last) continue;
    const student = findStudent(data, inv.studentId);
    if (!student) continue;
    out.push({ invoice: inv, student, balance: balanceOf(inv), dueDate: inv.dueDate });
  }
  out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return out;
}

export function draftInvoices(data) {
  const out = [];
  for (const inv of data.invoices) {
    if (inv.status !== STATUS.DRAFT) continue;
    const student = findStudent(data, inv.studentId);
    if (!student) continue;
    out.push({ invoice: inv, student });
  }
  out.sort((a, b) =>
    a.invoice.month.localeCompare(b.invoice.month) ||
    a.student.name.localeCompare(b.student.name));
  return out;
}

export function buildAlerts(data, today, settings = null) {
  const overdueAlerts = owedRows(data, today)
    .filter((r) => r.displayStatus === STATUS.OVERDUE)
    .map((r) => ({
      kind: 'overdue',
      key: 'overdue-' + r.invoice.id,
      invoiceId: r.invoice.id,
      studentName: r.student.name,
      title: "Chase " + r.student.name + "'s parent today",
      detail: formatRupees(r.balance) + ' · ' + r.daysOverdue + (r.daysOverdue === 1 ? ' day' : ' days') + ' late',
      actionLabel: 'Chase parent today',
    }));

  const dueSoonAlerts = dueSoonInvoices(data, today).map((d) => ({
    kind: 'due-soon',
    key: 'due-' + d.invoice.id,
    invoiceId: d.invoice.id,
    studentName: d.student.name,
    title: 'Invoice due in the next ' + DUE_SOON_DAYS + ' days',
    detail: d.student.name + ' · ' + formatRupees(d.balance) + ' · due ' + formatDate(d.dueDate),
    actionLabel: 'Draft reminder',
  }));

  const draftAlerts = draftInvoices(data).map((d) => ({
    kind: 'draft',
    key: 'draft-' + d.invoice.id,
    invoiceId: d.invoice.id,
    studentName: d.student.name,
    title: 'Draft invoice not sent yet',
    detail: d.student.name + ' · ' + monthLabel(d.invoice.month) + ' · ' + formatRupees(d.invoice.amount),
    actionLabel: 'Mark sent',
  }));

  // Cash-shortfall alert: top priority when the 30-day forecast goes negative.
  // Only built when forecast settings are supplied.
  const cashAlerts = [];
  if (settings) {
    const fc = buildForecast(data, {
      today,
      horizon: CASH_HORIZON,
      openingBalance: settings.openingBalance,
      collectionDays: settings.collectionDays,
    });
    if (fc.firstNegativeDate) {
      cashAlerts.push({
        kind: 'cash',
        key: 'cash-negative',
        invoiceId: null,
        studentName: '',
        title: 'Cash goes negative on ' + formatDate(fc.firstNegativeDate),
        detail: 'Lowest balance ' + formatRupees(fc.lowest.balance) + ' on ' + formatDate(fc.lowest.date),
        actionLabel: 'View forecast',
      });
    }
  }

  return [...cashAlerts, ...overdueAlerts, ...dueSoonAlerts, ...draftAlerts];
}

export function visibleAlerts(alerts, showAll) {
  return showAll ? alerts : alerts.slice(0, ALERT_LIMIT);
}
