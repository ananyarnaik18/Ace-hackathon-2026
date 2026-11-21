import { STATUS, deriveStatus } from './model.js';
import { balanceOf } from './invoices.js';
import { addDaysIso } from '../utils/date.js';
import { clampCollectionDays } from './forecastSettings.js';

export const HORIZONS = [30, 60, 90];

function push(map, key, item) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(item);
}

// arrivalShift: optional { [invoiceId]: extraDays }. Used only by what-if late payments. Default {} = no change.
export function buildForecast(data, { today, horizon = 30, openingBalance = 0, collectionDays = 7, arrivalShift = {} }) {
  const dates = [];
  for (let i = 0; i < horizon; i++) dates.push(addDaysIso(today, i));
  const dateSet = new Set(dates);
  const collectDate = addDaysIso(today, clampCollectionDays(collectionDays));

  const inBy = new Map();
  const outBy = new Map();

  for (const inv of data.invoices) {
    if (inv.status === STATUS.DRAFT) continue;
    const bal = balanceOf(inv);
    if (bal <= 0) continue;
    const base = deriveStatus(inv, today) === STATUS.OVERDUE ? collectDate : inv.dueDate;
    const extra = Number(arrivalShift[inv.id]) || 0;
    const arrival = extra > 0 ? addDaysIso(base, extra) : base;
    if (!dateSet.has(arrival)) continue;
    const student = data.students.find((s) => s.id === inv.studentId);
    push(inBy, arrival, { label: student ? student.name : '', amount: bal, invoiceId: inv.id });
  }

  for (const bill of data.recurringBills) {
    for (const date of dates) {
      if (Number(date.slice(8, 10)) === bill.dueDay) {
        push(outBy, date, { label: bill.name, amount: bill.amount, billId: bill.id });
      }
    }
  }

  const entries = [];
  let balance = openingBalance;
  for (const date of dates) {
    const inItems = inBy.get(date) || [];
    const outItems = outBy.get(date) || [];
    const moneyIn = inItems.reduce((sum, x) => sum + x.amount, 0);
    const moneyOut = outItems.reduce((sum, x) => sum + x.amount, 0);
    balance = balance + moneyIn - moneyOut;
    entries.push({ date, moneyIn, moneyOut, inItems, outItems, balance });
  }

  const totalIn = entries.reduce((sum, e) => sum + e.moneyIn, 0);
  const totalOut = entries.reduce((sum, e) => sum + e.moneyOut, 0);

  let lowest = null;
  for (const e of entries) {
    if (lowest === null || e.balance < lowest.balance) lowest = e;
  }
  const firstNeg = entries.find((e) => e.balance < 0);

  return {
    days: entries,
    totalIn,
    totalOut,
    lowest: lowest ? { date: lowest.date, balance: lowest.balance } : { date: today, balance: openingBalance },
    firstNegativeDate: firstNeg ? firstNeg.date : null,
    endBalance: entries.length ? entries[entries.length - 1].balance : openingBalance,
    horizon,
    openingBalance,
    collectionDate: collectDate,
  };
}
