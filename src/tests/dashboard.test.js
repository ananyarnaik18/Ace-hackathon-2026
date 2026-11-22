import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  owedRows,
  summarize,
  dueSoonInvoices,
  draftInvoices,
  buildAlerts,
  visibleAlerts,
  paysForItself,
  PLAN_PRICE,
  ALERT_LIMIT,
  CASH_HORIZON,
} from '../data/dashboard.js';

const TODAY = '2024-05-15';

const student = {
  id: 's1',
  name: 'Asha',
  parentName: 'Ravi',
  parentPhone: '9000000001',
  batch: 'Class 9 Maths & Science',
  monthlyFee: 1000,
  dueDay: 5,
};

function dataWith({ invoices = [], payments = [] } = {}) {
  return { students: [student], invoices, payments };
}

describe('dashboard summarize', () => {
  test('sums only payments made in the current month', () => {
    const data = dataWith({
      payments: [
        { id: 'p1', invoiceId: 'i1', amount: 400, date: '2024-05-02', method: 'upi' },
        { id: 'p2', invoiceId: 'i1', amount: 250, date: '2024-05-14', method: 'cash' },
        // Previous month: must be excluded from collectedThisMonth.
        { id: 'p3', invoiceId: 'i1', amount: 1000, date: '2024-04-30', method: 'upi' },
      ],
    });
    const s = summarize(data, TODAY);
    assert.equal(s.collectedThisMonth, 650);
  });

  test('outstanding and overdue totals for a sent, partly paid invoice', () => {
    const data = dataWith({
      invoices: [
        {
          id: 'i1',
          studentId: 's1',
          month: '2024-05',
          amount: 1000,
          issueDate: '2024-05-01',
          dueDate: '2024-05-05',
          status: 'sent',
          amountPaid: 200,
        },
      ],
    });
    const s = summarize(data, TODAY);
    assert.equal(s.outstanding, 800);
    assert.equal(s.overdueTotal, 800);
    assert.equal(s.overdueCount, 1);
    assert.equal(s.studentsOwing, 1);
  });
});

describe('dashboard owedRows', () => {
  test('returns an open, overdue invoice with its balance and days late', () => {
    const inv = {
      id: 'i1',
      studentId: 's1',
      month: '2024-05',
      amount: 1000,
      issueDate: '2024-05-01',
      dueDate: '2024-05-05',
      status: 'sent',
      amountPaid: 200,
    };
    const rows = owedRows(dataWith({ invoices: [inv] }), TODAY);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].balance, 800);
    assert.equal(rows[0].daysOverdue, 10);
    assert.equal(rows[0].partial, true);
    assert.equal(rows[0].displayStatus, 'overdue');
  });
});

describe('dashboard paysForItself', () => {
  test('PLAN_PRICE is 299', () => {
    assert.equal(PLAN_PRICE, 299);
  });

  test('nothing collected this month', () => {
    const r = paysForItself(dataWith(), TODAY);
    assert.equal(r.collectedThisMonth, 0);
    assert.equal(r.planPrice, 299);
    assert.equal(r.comparison, 'One recovered fee covers the ₹299 monthly plan.');
  });

  test('collected below the plan price', () => {
    const data = dataWith({
      payments: [{ id: 'p1', invoiceId: 'i1', amount: 150, date: '2024-05-03', method: 'cash' }],
    });
    const r = paysForItself(data, TODAY);
    assert.equal(r.collectedThisMonth, 150);
    assert.equal(r.comparison, 'Recovering just one fee covers the ₹299 plan.');
  });

  test('collected above the plan price', () => {
    const data = dataWith({
      payments: [{ id: 'p1', invoiceId: 'i1', amount: 598, date: '2024-05-03', method: 'upi' }],
    });
    const r = paysForItself(data, TODAY);
    assert.equal(r.collectedThisMonth, 598);
    assert.equal(
      r.comparison,
      'You collected ₹598 this month, which is about 2 times the ₹299 plan.',
    );
  });
});

describe('dashboard visibleAlerts', () => {
  const alerts = Array.from({ length: 7 }, (_, i) => ({ kind: 'draft', key: 'k' + i }));

  test('ALERT_LIMIT is 5 and visibleAlerts caps the list at it', () => {
    assert.equal(ALERT_LIMIT, 5);
    assert.equal(visibleAlerts(alerts, false).length, 5);
    assert.equal(visibleAlerts(alerts).length, 5);
  });

  test('showAll returns every alert', () => {
    assert.equal(visibleAlerts(alerts, true).length, 7);
    assert.equal(CASH_HORIZON, 30);
  });
});
