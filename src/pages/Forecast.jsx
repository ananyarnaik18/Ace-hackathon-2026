import { useState } from 'react';
import { buildWhatIf } from '../data/whatif.js';
import { HORIZONS } from '../data/forecast.js';
import { loadForecastSettings, saveForecastSettings, clampCollectionDays } from '../data/forecastSettings.js';
import { todayIso } from '../utils/date.js';
import { formatRupees, formatDate } from '../utils/format.js';
import ForecastChart from '../components/ForecastChart.jsx';
import WhatIfPanel from '../components/WhatIfPanel.jsx';

export default function Forecast({ data }) {
  const [settings, setSettings] = useState(() => loadForecastSettings());
  const [horizon, setHorizon] = useState(30);
  const [scenario, setScenario] = useState(null);
  const today = todayIso();

  const result = buildWhatIf(
    data,
    { today, horizon, openingBalance: settings.openingBalance, collectionDays: settings.collectionDays },
    scenario
  );
  const fc = result.baseline;
  const wf = result.whatIf;
  const cmp = result.comparison;

  function updateSettings(next) {
    setSettings(next);
    saveForecastSettings(next);
  }

  const activeDays = fc.days.filter((d) => d.moneyIn > 0 || d.moneyOut > 0);

  return (
    <section className="forecast">
      <div className="form-card">
        <label>
          Opening balance (₹)
          <input
            type="number"
            step="1"
            inputMode="numeric"
            value={settings.openingBalance}
            onChange={(e) => {
              const v = Math.round(Number(e.target.value));
              updateSettings({ ...settings, openingBalance: Number.isFinite(v) ? v : 0 });
            }}
          />
        </label>
        <label>
          Overdue invoices expected to be paid (days from today)
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={settings.collectionDays}
            onChange={(e) => updateSettings({ ...settings, collectionDays: clampCollectionDays(e.target.value) })}
          />
        </label>
        <p className="hint">
          Assumes every unpaid invoice is paid in full: sent invoices on their due date, overdue ones on {formatDate(fc.collectionDate)}.
        </p>
      </div>

      <WhatIfPanel
        data={data}
        today={today}
        onRun={(s) => setScenario(s)}
        onReset={() => setScenario(null)}
      />

      <div className="filters">
        {HORIZONS.map((h) => (
          <button key={h} type="button" className={h === horizon ? 'active' : ''} onClick={() => setHorizon(h)}>
            {h} days
          </button>
        ))}
      </div>

      {cmp && (
        <>
          <p className="whatif-sentence" role="status">{result.sentence}</p>
          <div className="summary-cards compare-cards">
            <div className="summary-card">
              <span className="summary-label">Lowest balance</span>
              <span className="summary-value">
                {formatRupees(cmp.lowestBaseline.balance)} → {formatRupees(cmp.lowestWhatIf.balance)}
              </span>
              <span className="summary-sub">baseline → what-if</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Cash goes negative</span>
              <span className="summary-value">
                {cmp.firstNegBaseline ? formatDate(cmp.firstNegBaseline) : 'Not in ' + horizon + ' days'} →{' '}
                {cmp.firstNegWhatIf ? formatDate(cmp.firstNegWhatIf) : 'Not in ' + horizon + ' days'}
              </span>
              <span className="summary-sub">baseline → what-if</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Money in</span>
              <span className="summary-value">
                {formatRupees(cmp.moneyInBaseline)} → {formatRupees(cmp.moneyInWhatIf)}
              </span>
              <span className="summary-sub">baseline → what-if</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Scenario</span>
              <button type="button" className="reset-scenario" onClick={() => setScenario(null)}>Reset scenario</button>
            </div>
          </div>
        </>
      )}

      <div className="summary-cards">
        <div className="summary-card summary-collected">
          <span className="summary-label">Money in</span>
          <span className="summary-value">{formatRupees(fc.totalIn)}</span>
        </div>
        <div className="summary-card summary-overdue">
          <span className="summary-label">Money out</span>
          <span className="summary-value">{formatRupees(fc.totalOut)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Lowest balance</span>
          <span className="summary-value">{formatRupees(fc.lowest.balance)}</span>
          <span className="summary-sub">on {formatDate(fc.lowest.date)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Cash goes negative</span>
          <span className="summary-value">
            {fc.firstNegativeDate ? formatDate(fc.firstNegativeDate) : 'Not in ' + horizon + ' days'}
          </span>
        </div>
      </div>

      <h2 className="section-title">Running balance</h2>
      <ForecastChart days={fc.days} compareDays={wf ? wf.days : null} />

      <h2 className="section-title">Upcoming money in and out</h2>
      {activeDays.length === 0 ? (
        <p className="hint">Nothing due in this period.</p>
      ) : (
        <div className="table-wrap">
          <table className="owed-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Money in</th>
                <th>Money out</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {activeDays.map((d) => (
                <tr key={d.date}>
                  <td data-label="Date">{formatDate(d.date)}</td>
                  <td data-label="Money in">
                    {d.moneyIn > 0 ? formatRupees(d.moneyIn) : '—'}
                    <small>{d.inItems.map((i) => i.label).join(', ')}</small>
                  </td>
                  <td data-label="Money out">
                    {d.moneyOut > 0 ? formatRupees(d.moneyOut) : '—'}
                    <small>{d.outItems.map((i) => i.label).join(', ')}</small>
                  </td>
                  <td data-label="Balance">{formatRupees(d.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
