import { buildForecast } from './forecast.js';
import { STATUS, deriveStatus } from './model.js';
import { balanceOf } from './invoices.js';
import { formatRupees, formatDate } from '../utils/format.js';

export const SCENARIO_TYPES = { LATE: 'late', ALL_LATE: 'allLate', REMOVE: 'remove', BILL: 'bill' };
export const DEFAULT_LATE_DAYS = 15;

function copyOf(data) {
  return JSON.parse(JSON.stringify(data));
}

function openInvoicesOf(data, studentId) {
  return data.invoices.filter(
    (inv) => inv.studentId === studentId && inv.status !== STATUS.DRAFT && balanceOf(inv) > 0
  );
}

function allOpenInvoices(data) {
  return data.invoices.filter((inv) => inv.status !== STATUS.DRAFT && balanceOf(inv) > 0);
}

function studentName(data, studentId) {
  const s = data.students.find((x) => x.id === studentId);
  return s ? s.name : 'this student';
}

export function validateScenario(data, scenario) {
  if (!scenario || !Object.values(SCENARIO_TYPES).includes(scenario.type)) {
    throw new Error('Choose a what-if scenario');
  }
  if (scenario.type === SCENARIO_TYPES.BILL) {
    if (!data.recurringBills.some((b) => b.id === scenario.billId)) throw new Error('Choose a bill');
    if (!Number.isInteger(scenario.increase) || scenario.increase <= 0) {
      throw new Error('Increase must be a whole rupee amount above 0');
    }
    return;
  }
  if (scenario.type === SCENARIO_TYPES.ALL_LATE) {
    if (!Number.isInteger(scenario.days) || scenario.days <= 0) {
      throw new Error('Days late must be a whole number above 0');
    }
    return;
  }
  if (!data.students.some((s) => s.id === scenario.studentId)) throw new Error('Choose a student');
  if (scenario.type === SCENARIO_TYPES.LATE && (!Number.isInteger(scenario.days) || scenario.days <= 0)) {
    throw new Error('Days late must be a whole number above 0');
  }
}

// Returns a NEW copy of data with the scenario applied, plus invoice arrival shifts. Never mutates the input.
export function applyScenario(data, scenario) {
  const copy = copyOf(data);
  const arrivalShift = {};
  if (scenario.type === SCENARIO_TYPES.LATE) {
    for (const inv of openInvoicesOf(copy, scenario.studentId)) arrivalShift[inv.id] = scenario.days;
  } else if (scenario.type === SCENARIO_TYPES.ALL_LATE) {
    for (const inv of allOpenInvoices(copy)) arrivalShift[inv.id] = scenario.days;
  } else if (scenario.type === SCENARIO_TYPES.REMOVE) {
    const drop = new Set(openInvoicesOf(copy, scenario.studentId).map((i) => i.id));
    copy.invoices = copy.invoices.filter((i) => !drop.has(i.id));
  } else if (scenario.type === SCENARIO_TYPES.BILL) {
    copy.recurringBills = copy.recurringBills.map((b) =>
      b.id === scenario.billId ? { ...b, amount: b.amount + scenario.increase } : b
    );
  }
  return { data: copy, arrivalShift };
}

function outcomeText(fc) {
  const low = fc.lowest;
  return low.balance < 0
    ? 'cash drops to ' + formatRupees(low.balance) + ' on ' + formatDate(low.date)
    : 'cash stays above zero, with a low of ' + formatRupees(low.balance) + ' on ' + formatDate(low.date);
}

export function describeScenario(data, scenario, whatIfFc) {
  if (scenario.type === SCENARIO_TYPES.ALL_LATE) {
    return 'If everyone pays ' + scenario.days + ' days late, ' + outcomeText(whatIfFc) + '.';
  }
  if (scenario.type === SCENARIO_TYPES.LATE) {
    return 'If ' + studentName(data, scenario.studentId) + "'s parent pays " + scenario.days + ' days late, ' + outcomeText(whatIfFc) + '.';
  }
  if (scenario.type === SCENARIO_TYPES.REMOVE) {
    return 'If ' + studentName(data, scenario.studentId) + ' is removed for the month, ' + outcomeText(whatIfFc) + '.';
  }
  const bill = data.recurringBills.find((b) => b.id === scenario.billId);
  return 'If the ' + (bill ? bill.name : 'chosen') + ' bill rises by ' + formatRupees(scenario.increase) + ', ' + outcomeText(whatIfFc) + '.';
}

// Students with the largest total overdue balance. Ties go to the earlier student. Returns null if nothing is overdue.
export function biggestLatePayer(data, today) {
  const totals = new Map();
  for (const inv of data.invoices) {
    if (deriveStatus(inv, today) !== STATUS.OVERDUE) continue;
    totals.set(inv.studentId, (totals.get(inv.studentId) || 0) + balanceOf(inv));
  }
  let best = null;
  let bestAmount = 0;
  for (const [studentId, amount] of totals) {
    if (amount > bestAmount) {
      best = studentId;
      bestAmount = amount;
    }
  }
  return best;
}

// opts: same as buildForecast ({ today, horizon, openingBalance, collectionDays }).
// scenario: null (baseline only) or { type, studentId?, days?, billId?, increase? }.
export function buildWhatIf(data, opts, scenario) {
  const baseline = buildForecast(data, opts);
  if (!scenario) return { baseline, whatIf: null, sentence: '', comparison: null };
  validateScenario(data, scenario);
  const { data: copy, arrivalShift } = applyScenario(data, scenario);
  const whatIf = buildForecast(copy, { ...opts, arrivalShift });
  return {
    baseline,
    whatIf,
    sentence: describeScenario(data, scenario, whatIf),
    comparison: {
      lowestBaseline: baseline.lowest,
      lowestWhatIf: whatIf.lowest,
      firstNegBaseline: baseline.firstNegativeDate,
      firstNegWhatIf: whatIf.firstNegativeDate,
      moneyInBaseline: baseline.totalIn,
      moneyInWhatIf: whatIf.totalIn,
    },
  };
}
