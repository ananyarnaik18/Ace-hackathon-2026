import { useState } from 'react';
import { summarize, owedRows, buildAlerts, visibleAlerts, ALERT_LIMIT, paysForItself, PLAN_PRICE, lowestBalanceWithin } from '../data/dashboard.js';
import { todayIso } from '../utils/date.js';
import { formatRupees, formatDate } from '../utils/format.js';
import { loadForecastSettings } from '../data/forecastSettings.js';
import { buildForecast } from '../data/forecast.js';
import AlertCard from '../components/AlertCard.jsx';
import OwedTable from '../components/OwedTable.jsx';

export default function Dashboard({ data, setData, onNavigate, onOpenBadDay }) {
  const today = todayIso();
  const [showAll, setShowAll] = useState(false);
  const summary = summarize(data, today);
  const payback = paysForItself(data, today);
  const rows = owedRows(data, today);
  const settings = loadForecastSettings();
  const alerts = buildAlerts(data, today, settings);
  const shown = visibleAlerts(alerts, showAll);
  const forecast = buildForecast(data, { today, horizon: 30 });
  const lowest = lowestBalanceWithin(forecast, today, 30);

  return (
    <section className="dashboard">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total outstanding</span>
          <span className="summary-value">{formatRupees(summary.outstanding)}</span>
        </div>
        <div className="summary-card summary-overdue">
          <span className="summary-label">Overdue</span>
          <span className="summary-value">{formatRupees(summary.overdueTotal)}</span>
          <span className="summary-sub">{summary.overdueCount} invoice{summary.overdueCount === 1 ? '' : 's'}</span>
        </div>
        <div className="summary-card summary-collected">
          <span className="summary-label">Collected this month</span>
          <span className="summary-value">{formatRupees(summary.collectedThisMonth)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Students who owe</span>
          <span className="summary-value">{summary.studentsOwing}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Why TuitionDesk pays for itself</span>
          <span className="summary-value">{formatRupees(payback.collectedThisMonth)}</span>
          <span className="summary-sub">{formatRupees(PLAN_PRICE)}/month</span>
          <span className="summary-sub">{payback.comparison}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Cash outlook</span>
          <span className="summary-sub">
            Lowest balance in next 30 days: <span className={lowest.balance < 0 ? 'negative' : undefined}>{formatRupees(lowest.balance)}</span>
            {' on '}{lowest.date ? formatDate(lowest.date) : 'no dates'}
          </span>
          <button className="show-all" type="button" onClick={() => onOpenBadDay && onOpenBadDay()}>
            See what happens if everyone pays 15 days late
          </button>
        </div>
      </div>

      <h2 className="section-title">Alerts</h2>
      {alerts.length === 0 && <p className="hint">No alerts right now.</p>}
      {shown.map((alert) => (
        <AlertCard key={alert.key} alert={alert} data={data} setData={setData} today={today} onNavigate={onNavigate} />
      ))}
      {alerts.length > ALERT_LIMIT && (
        <button type="button" className="show-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer' : 'Show all ' + alerts.length + ' alerts'}
        </button>
      )}

      <h2 className="section-title">Who owes what</h2>
      <OwedTable rows={rows} data={data} setData={setData} today={today} />
    </section>
  );
}
