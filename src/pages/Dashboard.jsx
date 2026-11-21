import { useState } from 'react';
import { summarize, owedRows, buildAlerts, visibleAlerts, ALERT_LIMIT } from '../data/dashboard.js';
import { todayIso } from '../utils/date.js';
import { formatRupees } from '../utils/format.js';
import AlertCard from '../components/AlertCard.jsx';
import OwedTable from '../components/OwedTable.jsx';

export default function Dashboard({ data, setData }) {
  const today = todayIso();
  const [showAll, setShowAll] = useState(false);
  const summary = summarize(data, today);
  const rows = owedRows(data, today);
  const alerts = buildAlerts(data, today);
  const shown = visibleAlerts(alerts, showAll);

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
      </div>

      <h2 className="section-title">Alerts</h2>
      {alerts.length === 0 && <p className="hint">No alerts right now.</p>}
      {shown.map((alert) => (
        <AlertCard key={alert.key} alert={alert} data={data} setData={setData} today={today} />
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