import { Fragment, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import ReminderPanel from './ReminderPanel.jsx';
import RecordPaymentForm from './RecordPaymentForm.jsx';
import { recordPayment } from '../data/invoices.js';
import { nextAction } from '../data/dashboard.js';
import { formatRupees, formatDate } from '../utils/format.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(month) {
  const [year, mm] = month.split('-');
  return MONTHS[Number(mm) - 1] + ' ' + year;
}

export default function OwedTable({ rows, data, setData, today }) {
  const [reminderFor, setReminderFor] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);

  if (rows.length === 0) {
    return <p className="hint">Nobody owes money right now.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="owed-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Parent</th>
            <th>Month</th>
            <th>Balance</th>
            <th>Due date</th>
            <th>Days overdue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.invoice.id}>
              <tr>
                <td data-label="Student">{row.student.name}</td>
                <td data-label="Parent">{row.parentName}</td>
                <td data-label="Month">{monthLabel(row.invoice.month)}</td>
                <td data-label="Balance">{formatRupees(row.balance)}</td>
                <td data-label="Due date">{formatDate(row.dueDate)}</td>
                <td data-label="Days overdue">
                  {row.daysOverdue > 0 ? row.daysOverdue : '—'}
                  {nextAction(row.daysOverdue) && <div className="hint">{nextAction(row.daysOverdue)}</div>}
                </td>
                <td data-label="Status">
                  <StatusBadge
                    status={row.displayStatus === 'overdue' ? 'overdue' : (row.partial ? 'partial' : 'sent')}
                  />
                </td>
                <td data-label="Actions">
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() => {
                        setReminderFor(reminderFor === row.invoice.id ? null : row.invoice.id);
                        setPaymentFor(null);
                      }}
                    >
                      Draft reminder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentFor(paymentFor === row.invoice.id ? null : row.invoice.id);
                        setReminderFor(null);
                      }}
                    >
                      Record payment
                    </button>
                  </div>
                </td>
              </tr>
              {(reminderFor === row.invoice.id || paymentFor === row.invoice.id) && (
                <tr className="panel-row">
                  <td colSpan={8}>
                    {reminderFor === row.invoice.id && (
                      <ReminderPanel
                        invoice={row.invoice}
                        student={row.student}
                        today={today}
                        onClose={() => setReminderFor(null)}
                      />
                    )}
                    {paymentFor === row.invoice.id && (
                      <RecordPaymentForm
                        invoice={row.invoice}
                        onSubmit={(p) => {
                          setData(recordPayment(data, row.invoice.id, p));
                          setPaymentFor(null);
                        }}
                        onCancel={() => setPaymentFor(null)}
                      />
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
