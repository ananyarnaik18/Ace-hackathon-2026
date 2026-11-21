import { useState } from 'react';
import ReminderPanel from './ReminderPanel.jsx';
import { markSent } from '../data/invoices.js';

export default function AlertCard({ alert, data, setData, today }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const invoice = data.invoices.find((i) => i.id === alert.invoiceId);
  const student = invoice ? data.students.find((s) => s.id === invoice.studentId) : undefined;
  if (!invoice || !student) return null;

  function handleMarkSent() {
    try {
      setData(markSent(data, alert.invoiceId));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <article className={'alert-card alert-' + alert.kind}>
      <h3>{alert.title}</h3>
      <p className="alert-detail">{alert.detail}</p>
      <div className="actions">
        {(alert.kind === 'overdue' || alert.kind === 'due-soon') && (
          <button type="button" onClick={() => setOpen(!open)}>
            {alert.actionLabel}
          </button>
        )}
        {alert.kind === 'draft' && (
          <button type="button" onClick={handleMarkSent}>
            {alert.actionLabel}
          </button>
        )}
      </div>
      {open && (alert.kind === 'overdue' || alert.kind === 'due-soon') && (
        <ReminderPanel
          invoice={invoice}
          student={student}
          today={today}
          onClose={() => setOpen(false)}
        />
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}
