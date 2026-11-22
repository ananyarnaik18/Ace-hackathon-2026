import { useEffect, useState } from 'react';
import { SCENARIO_TYPES, DEFAULT_LATE_DAYS, validateScenario, biggestLatePayer } from '../data/whatif.js';

// Controls only. The parent (Forecast page) owns the scenario state.
// onRun(scenario) sets the active scenario; onReset() clears it.
export default function WhatIfPanel({ data, today, onRun, onReset, initialPreset }) {
  const [type, setType] = useState(SCENARIO_TYPES.ALL_LATE);
  const [studentId, setStudentId] = useState(data.students[0] ? data.students[0].id : '');
  const [days, setDays] = useState(String(DEFAULT_LATE_DAYS));
  const [billId, setBillId] = useState(data.recurringBills[0] ? data.recurringBills[0].id : '');
  const [increase, setIncrease] = useState('500');
  const [error, setError] = useState('');

  function run(scenario) {
    try {
      validateScenario(data, scenario);
      setError('');
      onRun(scenario);
    } catch (err) {
      setError(err.message);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (type === SCENARIO_TYPES.BILL) {
      run({ type, billId, increase: Number(increase) });
    } else if (type === SCENARIO_TYPES.ALL_LATE) {
      run({ type, days: Number(days) });
    } else if (type === SCENARIO_TYPES.LATE) {
      run({ type, studentId, days: Number(days) });
    } else {
      run({ type, studentId });
    }
  }

  function badDayPreset() {
    run({ type: SCENARIO_TYPES.ALL_LATE, days: DEFAULT_LATE_DAYS });
  }

  // Runs the Bad day preset once on mount when opened from the dashboard deep link.
  useEffect(() => {
    if (initialPreset === 'badDay') badDayPreset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function latePayerPreset() {
    const id = biggestLatePayer(data, today);
    if (!id) {
      setError('No overdue invoices, so there is no late payer to test.');
      return;
    }
    run({ type: SCENARIO_TYPES.LATE, studentId: id, days: DEFAULT_LATE_DAYS });
  }

  function reset() {
    setError('');
    onReset();
  }

  return (
    <div className="form-card whatif-panel">
      <h3>What if?</h3>
      <form onSubmit={submit}>
        <label>
          Scenario
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value={SCENARIO_TYPES.ALL_LATE}>All unpaid invoices are paid late</option>
            <option value={SCENARIO_TYPES.LATE}>One student's parent pays late</option>
            <option value={SCENARIO_TYPES.REMOVE}>A student is removed for the month</option>
            <option value={SCENARIO_TYPES.BILL}>A bill increases</option>
          </select>
        </label>

        {(type === SCENARIO_TYPES.LATE || type === SCENARIO_TYPES.REMOVE) && (
          <label>
            Student
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        )}

        {(type === SCENARIO_TYPES.LATE || type === SCENARIO_TYPES.ALL_LATE) && (
          <label>
            Days late
            <input type="number" min="1" step="1" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
          </label>
        )}

        {type === SCENARIO_TYPES.BILL && (
          <>
            <label>
              Bill
              <select value={billId} onChange={(e) => setBillId(e.target.value)}>
                {data.recurringBills.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <label>
              Increase by (₹)
              <input type="number" min="1" step="1" inputMode="numeric" value={increase} onChange={(e) => setIncrease(e.target.value)} />
            </label>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button-primary">Run what-if</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      </form>
      <div className="actions">
        <button type="button" onClick={badDayPreset}>Bad day: everyone pays {DEFAULT_LATE_DAYS} days late</button>
        <button type="button" onClick={latePayerPreset}>Biggest late payer pays {DEFAULT_LATE_DAYS} days late</button>
      </div>
      <p className="hint">The what-if works on a copy. Your saved invoices and payments are not changed.</p>
    </div>
  );
}
