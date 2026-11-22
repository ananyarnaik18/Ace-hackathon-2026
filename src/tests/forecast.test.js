import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildForecast } from '../data/forecast.js';

// Fixed fixture. Nothing here reads the real clock.
// today = 2025-03-10, horizon = 30 days => dates 2025-03-10 .. 2025-04-08.
const TODAY = '2025-03-10';

const data = {
  students: [
    { id: 's1', name: 'Asha' },
    { id: 's2', name: 'Ravi' },
  ],
  invoices: [
    // Sent, unpaid, due 2025-03-05 (before today) => overdue => collected on today + 7 = 2025-03-17
    { id: 'inv-overdue', studentId: 's1', month: '2025-03', amount: 1000, issueDate: '2025-03-01', dueDate: '2025-03-05', status: 'sent', amountPaid: 0 },
    // Sent, unpaid, due 2025-03-20 (after today) => arrives on its dueDate
    { id: 'inv-future', studentId: 's2', month: '2025-03', amount: 1500, issueDate: '2025-03-01', dueDate: '2025-03-20', status: 'sent', amountPaid: 0 },
    // Draft => must contribute nothing
    { id: 'inv-draft', studentId: 's2', month: '2025-04', amount: 800, issueDate: '2025-04-01', dueDate: '2025-03-12', status: 'draft', amountPaid: 0 },
  ],
  recurringBills: [
    // dueDay 15 => 2025-03-15 is inside the horizon
    { id: 'bill-rent', name: 'Rent', amount: 500, dueDay: 15 },
    // dueDay 5 => 2025-04-05 is inside the horizon
    { id: 'bill-internet', name: 'Internet', amount: 200, dueDay: 5 },
  ],
};

function dayOf(result, date) {
  return result.days.find((d) => d.date === date);
}

describe('buildForecast', () => {
  test('overdue invoice lands on the collection date (today + collectionDays)', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 7 });

    assert.equal(result.collectionDate, '2025-03-17');
    const day = dayOf(result, '2025-03-17');
    assert.equal(day.moneyIn, 1000);
    assert.deepEqual(day.inItems.map((i) => i.invoiceId), ['inv-overdue']);
    // It must not appear on its original (past) due date, which is outside the horizon anyway.
    assert.equal(result.days.some((d) => d.inItems.some((i) => i.invoiceId === 'inv-overdue') && d.date !== '2025-03-17'), false);
  });

  test('collectionDays override moves the overdue arrival date', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 3 });

    assert.equal(result.collectionDate, '2025-03-13');
    assert.deepEqual(dayOf(result, '2025-03-13').inItems.map((i) => i.invoiceId), ['inv-overdue']);
  });

  test('not-yet-due invoice lands on its dueDate', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 7 });

    const day = dayOf(result, '2025-03-20');
    assert.equal(day.moneyIn, 1500);
    assert.deepEqual(day.inItems.map((i) => i.invoiceId), ['inv-future']);
    assert.equal(day.inItems[0].label, 'Ravi');
  });

  test('recurring bills land on each in-horizon date whose day-of-month equals dueDay', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 7 });

    const rent = dayOf(result, '2025-03-15');
    assert.equal(rent.moneyOut, 500);
    assert.deepEqual(rent.outItems.map((o) => o.billId), ['bill-rent']);

    const internet = dayOf(result, '2025-04-05');
    assert.equal(internet.moneyOut, 200);
    assert.deepEqual(internet.outItems.map((o) => o.billId), ['bill-internet']);

    assert.equal(result.totalOut, 700);
  });

  test('draft invoice contributes nothing to the forecast', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 7 });

    const draftHits = result.days.flatMap((d) => d.inItems).filter((i) => i.invoiceId === 'inv-draft');
    assert.equal(draftHits.length, 0);
    // Only the two sent invoices count toward money in.
    assert.equal(result.totalIn, 2500);
  });

  test('endBalance equals openingBalance + incoming - outgoing for the fixture', () => {
    const result = buildForecast(data, { today: TODAY, horizon: 30, openingBalance: 2000, collectionDays: 7 });

    // 2000 opening + (1000 overdue + 1500 future) - (500 rent + 200 internet) = 3800
    assert.equal(result.openingBalance, 2000);
    assert.equal(result.endBalance, 2000 + 2500 - 700);
    assert.equal(result.endBalance, 3800);
  });
});
