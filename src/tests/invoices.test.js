import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInvoice,
  recordPayment,
  balanceOf,
  daysOverdue,
  markSent,
  generateMonthInvoices,
} from '../data/invoices.js';
import { STATUS, PAYMENT_METHOD, deriveStatus } from '../data/model.js';

// Small hand-built fixtures. Dates are fixed strings so results never depend on the clock.
function makeData() {
  return {
    students: [
      { id: 's1', name: 'Asha', parentName: 'Ravi', parentPhone: '9000000001', batch: 'Class 8 Maths', monthlyFee: 1500, dueDay: 5 },
      { id: 's2', name: 'Bilal', parentName: 'Sana', parentPhone: '9000000002', batch: 'Class 10 Science', monthlyFee: 2000, dueDay: 12 },
    ],
    invoices: [],
    payments: [],
  };
}

function sentInvoice(overrides = {}) {
  return {
    id: 'inv-s1-2025-03',
    studentId: 's1',
    month: '2025-03',
    amount: 1500,
    issueDate: '2025-03-01',
    dueDate: '2025-03-05',
    status: STATUS.SENT,
    amountPaid: 0,
    ...overrides,
  };
}

describe('balanceOf', () => {
  test('returns amount minus amountPaid', () => {
    assert.equal(balanceOf(sentInvoice({ amount: 1500, amountPaid: 500 })), 1000);
    assert.equal(balanceOf(sentInvoice({ amount: 1500, amountPaid: 0 })), 1500);
  });
});

describe('createInvoice', () => {
  test('builds a draft invoice with derived id, dates and zero paid', () => {
    const data = makeData();
    const next = createInvoice(data, { studentId: 's1', month: '2025-03', amount: 1500 });
    assert.equal(next.invoices.length, 1);
    const inv = next.invoices[0];
    assert.equal(inv.id, 'inv-s1-2025-03');
    assert.equal(inv.studentId, 's1');
    assert.equal(inv.month, '2025-03');
    assert.equal(inv.amount, 1500);
    assert.equal(inv.issueDate, '2025-03-01');
    assert.equal(inv.dueDate, '2025-03-05');
    assert.equal(inv.status, STATUS.DRAFT);
    assert.equal(inv.amountPaid, 0);
  });

  test('does not mutate the input data', () => {
    const data = makeData();
    createInvoice(data, { studentId: 's1', month: '2025-03', amount: 1500 });
    assert.equal(data.invoices.length, 0);
  });

  test('throws on a non-integer or non-positive amount', () => {
    const data = makeData();
    assert.throws(() => createInvoice(data, { studentId: 's1', month: '2025-03', amount: 1500.5 }), /whole rupee/);
    assert.throws(() => createInvoice(data, { studentId: 's1', month: '2025-03', amount: 0 }), /whole rupee/);
    assert.throws(() => createInvoice(data, { studentId: 's1', month: '2025-03', amount: -100 }), /whole rupee/);
  });

  test('throws on a duplicate student and month', () => {
    const data = makeData();
    const once = createInvoice(data, { studentId: 's1', month: '2025-03', amount: 1500 });
    assert.throws(
      () => createInvoice(once, { studentId: 's1', month: '2025-03', amount: 1500 }),
      /already exists/
    );
  });
});

describe('generateMonthInvoices', () => {
  test('creates one draft per student at monthlyFee and skips existing ones', () => {
    const data = makeData();
    const first = generateMonthInvoices(data, '2025-03');
    assert.equal(first.created, 2);
    assert.equal(first.data.invoices.length, 2);
    const second = generateMonthInvoices(first.data, '2025-03');
    assert.equal(second.created, 0);
    assert.equal(second.data.invoices.length, 2);
  });
});

describe('markSent', () => {
  test('moves a draft to sent', () => {
    const data = createInvoice(makeData(), { studentId: 's1', month: '2025-03', amount: 1500 });
    const next = markSent(data, 'inv-s1-2025-03');
    assert.equal(next.invoices[0].status, STATUS.SENT);
  });
});

describe('recordPayment', () => {
  test('partial payment keeps a balance and moves draft to sent', () => {
    const data = createInvoice(makeData(), { studentId: 's1', month: '2025-03', amount: 1500 });
    const next = recordPayment(data, 'inv-s1-2025-03', { amount: 500, date: '2025-03-04', method: PAYMENT_METHOD.UPI });
    const inv = next.invoices[0];
    assert.equal(inv.amountPaid, 500);
    assert.equal(inv.status, STATUS.SENT);
    assert.equal(balanceOf(inv), 1000);
    assert.equal(next.payments.length, 1);
    assert.equal(next.payments[0].invoiceId, 'inv-s1-2025-03');
    assert.equal(next.payments[0].amount, 500);
    assert.equal(next.payments[0].date, '2025-03-04');
    assert.equal(next.payments[0].method, PAYMENT_METHOD.UPI);
  });

  test('paying the full balance marks the invoice PAID with zero balance', () => {
    const base = createInvoice(makeData(), { studentId: 's1', month: '2025-03', amount: 1500 });
    const partial = recordPayment(base, 'inv-s1-2025-03', { amount: 500, date: '2025-03-04', method: PAYMENT_METHOD.CASH });
    const full = recordPayment(partial, 'inv-s1-2025-03', { amount: 1000, date: '2025-03-06', method: PAYMENT_METHOD.UPI });
    const inv = full.invoices[0];
    assert.equal(inv.amountPaid, 1500);
    assert.equal(inv.status, STATUS.PAID);
    assert.equal(balanceOf(inv), 0);
    assert.equal(full.payments.length, 2);
  });

  test('throws when the payment is more than the balance due', () => {
    const data = createInvoice(makeData(), { studentId: 's1', month: '2025-03', amount: 1500 });
    assert.throws(
      () => recordPayment(data, 'inv-s1-2025-03', { amount: 1501, date: '2025-03-04', method: PAYMENT_METHOD.CASH }),
      /more than the balance/
    );
  });
});

describe('deriveStatus', () => {
  test('a draft stays draft even past its due date', () => {
    const inv = sentInvoice({ status: STATUS.DRAFT });
    assert.equal(deriveStatus(inv, '2025-03-20'), STATUS.DRAFT);
  });

  test('a sent invoice past its due date with a balance is overdue', () => {
    assert.equal(deriveStatus(sentInvoice(), '2025-03-10'), STATUS.OVERDUE);
  });

  test('a sent invoice on or before its due date is not overdue', () => {
    assert.equal(deriveStatus(sentInvoice(), '2025-03-05'), STATUS.SENT);
    assert.equal(deriveStatus(sentInvoice(), '2025-03-01'), STATUS.SENT);
  });

  test('a fully paid invoice is paid even past its due date', () => {
    const inv = sentInvoice({ amountPaid: 1500 });
    assert.equal(deriveStatus(inv, '2025-04-01'), STATUS.PAID);
  });
});

describe('daysOverdue', () => {
  test('returns 0 when the invoice is not overdue', () => {
    assert.equal(daysOverdue(sentInvoice(), '2025-03-05'), 0);
    assert.equal(daysOverdue(sentInvoice(), '2025-03-01'), 0);
    assert.equal(daysOverdue(sentInvoice({ amountPaid: 1500 }), '2025-04-01'), 0);
  });

  test('returns the number of days past the due date when overdue', () => {
    assert.equal(daysOverdue(sentInvoice(), '2025-03-10'), 5);
  });
});
