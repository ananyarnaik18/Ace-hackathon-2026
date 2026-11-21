import { useState } from 'react';
import {
  balanceOf,
  daysOverdue,
  createInvoice,
  generateMonthInvoices,
  markSent,
  recordPayment,
} from '../data/invoices.js';
import { STATUS, deriveStatus } from '../data/model.js';
import StatusBadge from '../components/StatusBadge.jsx';
import RecordPaymentForm from '../components/RecordPaymentForm.jsx';
import ReminderPanel from '../components/ReminderPanel.jsx';
import { formatRupees, formatDate } from '../utils/format.js';
import { todayIso, currentMonth } from '../utils/date.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(month) {
  const [year, mm] = month.split('-');
  return `${MONTHS[Number(mm) - 1]} ${year}`;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

export default function Invoices({ data, setData }) {
  const today = todayIso();

  const [filter, setFilter] = useState('all');
  const [paymentFor, setPaymentFor] = useState(null);
  const [reminderFor, setReminderFor] = useState(null);
  const [form, setForm] = useState({ studentId: '', month: currentMonth(), amount: '' });
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  const studentById = (id) => data.students.find((s) => s.id === id);

  const withStatus = data.invoices.map((inv) => ({
    inv,
    displayStatus: deriveStatus(inv, today),
  }));

  const filtered = withStatus.filter(({ displayStatus }) => {
    if (filter === 'unpaid') return displayStatus !== STATUS.PAID;
    if (filter === 'overdue') return displayStatus === STATUS.OVERDUE;
    if (filter === 'paid') return displayStatus === STATUS.PAID;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.inv.month !== b.inv.month) return a.inv.month < b.inv.month ? 1 : -1;
    const nameA = studentById(a.inv.studentId)?.name ?? '';
    const nameB = studentById(b.inv.studentId)?.name ?? '';
    return nameA.localeCompare(nameB);
  });

  function handleStudentChange(e) {
    const studentId = e.target.value;
    const student = studentById(studentId);
    setForm({ ...form, studentId, amount: student ? String(student.monthlyFee) : '' });
  }

  function handleCreate(e) {
    e.preventDefault();
    try {
      const next = createInvoice(data, {
        studentId: form.studentId,
        month: form.month,
        amount: Number(form.amount),
      });
      setData(next);
      setFormError('');
      setForm({ ...form, amount: '' });
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleGenerate() {
    try {
      const result = generateMonthInvoices(data, currentMonth());
      setData(result.data);
      setNotice(`${result.created} draft invoice(s) created for ${currentMonth()}`);
      setActionError('');
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section>
      <h2>Invoices</h2>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? 'active' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="count">{sorted.length} invoices</p>

      <form className="form-card" onSubmit={handleCreate}>
        <label>
          Student
          <select value={form.studentId} onChange={handleStudentChange}>
            <option value="">Choose a student</option>
            {data.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Month
          <input
            type="month"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />
        </label>
        <label>
          Amount (₹)
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <button type="submit">Create draft invoice</button>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
      </form>

      <button type="button" className="button-primary" onClick={handleGenerate}>
        Generate this month's invoices
      </button>
      {notice && <p className="hint">{notice}</p>}
      {actionError && (
        <p className="error" role="alert">
          {actionError}
        </p>
      )}

      {sorted.length === 0 && <p className="hint">No invoices to show.</p>}

      {sorted.map(({ inv, displayStatus }) => {
        const student = studentById(inv.studentId);
        const days = displayStatus === STATUS.OVERDUE ? daysOverdue(inv, today) : 0;
        return (
          <article className="invoice-card" key={inv.id}>
            <header>
              <h3>{student?.name}</h3>
              <StatusBadge status={displayStatus} />
            </header>
            <dl>
              <dt>Month</dt>
              <dd>{formatMonth(inv.month)}</dd>
              <dt>Amount</dt>
              <dd>{formatRupees(inv.amount)}</dd>
              <dt>Paid</dt>
              <dd>{formatRupees(inv.amountPaid)}</dd>
              <dt>Balance</dt>
              <dd>{formatRupees(balanceOf(inv))}</dd>
              <dt>Due date</dt>
              <dd>{formatDate(inv.dueDate)}</dd>
            </dl>
            {displayStatus === STATUS.OVERDUE && (
              <p className="overdue-days">
                {days} {days === 1 ? 'day' : 'days'} overdue
              </p>
            )}
            <div className="actions">
              {inv.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      setData(markSent(data, inv.id));
                      setActionError('');
                    } catch (err) {
                      setActionError(err.message);
                    }
                  }}
                >
                  Mark sent
                </button>
              )}
              {displayStatus !== STATUS.PAID && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentFor(paymentFor === inv.id ? null : inv.id);
                    setReminderFor(null);
                  }}
                >
                  Record payment
                </button>
              )}
              {displayStatus !== STATUS.PAID && (
                <button
                  type="button"
                  onClick={() => {
                    setReminderFor(reminderFor === inv.id ? null : inv.id);
                    setPaymentFor(null);
                  }}
                >
                  Draft reminder
                </button>
              )}
            </div>
            {paymentFor === inv.id && (
              <RecordPaymentForm
                invoice={inv}
                onSubmit={(p) => {
                  setData(recordPayment(data, inv.id, p));
                  setPaymentFor(null);
                  setActionError('');
                }}
                onCancel={() => setPaymentFor(null)}
              />
            )}
            {reminderFor === inv.id && (
              <ReminderPanel
                invoice={inv}
                student={student}
                today={today}
                onClose={() => setReminderFor(null)}
              />
            )}
          </article>
        );
      })}
    </section>
  );
}
