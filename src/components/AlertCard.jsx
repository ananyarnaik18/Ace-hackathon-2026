import { useState } from 'react';
import ReminderPanel from './ReminderPanel.jsx';
import { markSent } from '../data/invoices.js';

export default function AlertCard({ alert, data, setData, today, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  if (alert.kind === 'cash') {
    return (
      <article className="alert-card alert-cash">
        <h3>{alert.title}</h3>
        <p className="alert-detail">{alert.detail}</p>
        <div className="actions">
          <button type="button" onClick={() => { if (onNavigate) onNavigate('forecast'); }}>
            {alert.actionLabel}
          </button>
        </div>
      </article>
    );
  }

  const invoice = data.invoices.find((i) => i.id === alert.invoiceId);
  const student = invoice ? data.students.find((s) => s.id === invoice.studentId) : undefined;
  if (!invoice || !student) return null;

  return (
    <article className={'alert-card alert-' + alert.kind}>
      <h3>{alert.title}</h3>
      <p className="alert-detail">{alert.detail}</p>
      <div className="actions">
        {alert.kind === 'draft' ? (
          <button
            type="button"
            onClick={() => {
              try {
                setData(markSent(data, alert.invoiceId));
                setError('');
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            {alert.actionLabel}
          </button>
        ) : (
          <button type="button" onClick={() => setOpen(!open)}>
            {alert.actionLabel}
          </button>
        )}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {open && alert.kind !== 'draft' && (
        <ReminderPanel invoice={invoice} student={student} today={today} onClose={() => setOpen(false)} />
      )}
    </article>
  );
}
