import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateScenario,
  applyScenario,
  buildWhatIf,
  describeScenario,
  DEFAULT_LATE_DAYS,
  SCENARIO_TYPES,
} from '../data/whatif.js';

// Hand-built fixture. Fixed dates only (no new Date()).
// today = 2025-03-10, horizon = 30 days -> window 2025-03-10 .. 2025-04-08.
// Rent bill (1000) is due on the 12th -> outflow on 2025-03-12 (inside the window).
// Asha's invoice (500, sent, due 2025-03-20, nothing paid) is not overdue -> inflow on 2025-03-20.
const TODAY = '2025-03-10';
const OPTS = { today: TODAY, horizon: 30, openingBalance: 0, collectionDays: 7 };

function makeData() {
  return {
    students: [
      { id: 's1', name: 'Asha', parentName: 'Parent', parentPhone: '9000000001', batch: 'Class 9 Maths & Science', monthlyFee: 500, dueDay: 5 },
    ],
    invoices: [
      { id: 'i1', studentId: 's1', month: '2025-03', amount: 500, issueDate: '2025-03-01', dueDate: '2025-03-20', status: 'sent', amountPaid: 0 },
    ],
    payments: [],
    recurringBills: [{ id: 'b1', name: 'Rent', amount: 1000, dueDay: 12 }],
  };
}

describe('validateScenario', () => {
  test('throws for an unknown scenario type', () => {
    const data = makeData();
    assert.throws(() => validateScenario(data, { type: 'nope' }), /Choose a what-if scenario/);
    assert.throws(() => validateScenario(data, null), /Choose a what-if scenario/);
  });

  test('throws for non-positive or non-integer days', () => {
    const data = makeData();
    assert.throws(
      () => validateScenario(data, { type: SCENARIO_TYPES.ALL_LATE, days: 0 }),
      /Days late must be a whole number above 0/
    );
    assert.throws(
      () => validateScenario(data, { type: SCENARIO_TYPES.LATE, studentId: 's1', days: -3 }),
      /Days late must be a whole number above 0/
    );
    assert.throws(
      () => validateScenario(data, { type: SCENARIO_TYPES.LATE, studentId: 's1', days: 1.5 }),
      /Days late must be a whole number above 0/
    );
  });
});

describe('applyScenario', () => {
  test('returns a copy and never mutates the input', () => {
    const data = makeData();
    const snapshot = JSON.parse(JSON.stringify(data));
    const scenario = { type: SCENARIO_TYPES.BILL, billId: 'b1', increase: 200 };

    const result = applyScenario(data, scenario);

    assert.deepEqual(data, snapshot);
    assert.notEqual(result.data, data);
    assert.equal(result.data.recurringBills[0].amount, 1200);
    assert.equal(data.recurringBills[0].amount, 1000);
  });

  test('LATE records an arrival shift for the student open invoice', () => {
    const data = makeData();
    const result = applyScenario(data, { type: SCENARIO_TYPES.LATE, studentId: 's1', days: 15 });
    assert.deepEqual(result.arrivalShift, { i1: 15 });
    assert.deepEqual(data.invoices[0].dueDate, '2025-03-20');
  });
});

describe('buildWhatIf', () => {
  test('with no scenario returns the baseline only', () => {
    const result = buildWhatIf(makeData(), OPTS, null);
    assert.equal(result.whatIf, null);
    assert.equal(result.sentence, '');
    assert.equal(result.comparison, null);
    assert.equal(result.baseline.totalIn, 500);
    assert.equal(result.baseline.totalOut, 1000);
    assert.deepEqual(result.baseline.lowest, { date: '2025-03-12', balance: -1000 });
  });

  test('BILL increase returns baseline and what-if lowest balances', () => {
    const result = buildWhatIf(makeData(), OPTS, { type: SCENARIO_TYPES.BILL, billId: 'b1', increase: 200 });
    assert.deepEqual(result.baseline.lowest, { date: '2025-03-12', balance: -1000 });
    assert.deepEqual(result.whatIf.lowest, { date: '2025-03-12', balance: -1200 });
    assert.equal(result.whatIf.totalOut, 1200);
    assert.equal(result.comparison.lowestBaseline.balance, -1000);
    assert.equal(result.comparison.lowestWhatIf.balance, -1200);
    assert.equal(result.comparison.firstNegWhatIf, '2025-03-12');
    assert.match(result.sentence, /If the Rent bill rises by/);
  });

  test('LATE moves the invoice inflow from 2025-03-20 to 2025-04-04 (15 days)', () => {
    const result = buildWhatIf(makeData(), OPTS, { type: SCENARIO_TYPES.LATE, studentId: 's1', days: 15 });
    const baseDay = result.baseline.days.find((d) => d.date === '2025-03-20');
    const lateDay = result.whatIf.days.find((d) => d.date === '2025-03-20');
    const shiftedDay = result.whatIf.days.find((d) => d.date === '2025-04-04');
    assert.equal(baseDay.moneyIn, 500);
    assert.equal(lateDay.moneyIn, 0);
    assert.equal(shiftedDay.moneyIn, 500);
    assert.match(result.sentence, /Asha's parent pays 15 days late/);
  });

  test('DEFAULT_LATE_DAYS is 15', () => {
    assert.equal(DEFAULT_LATE_DAYS, 15);
  });
});
