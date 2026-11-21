import { useState } from 'react';
import { addBill, updateBill, deleteBill } from '../data/bills.js';
import { formatRupees } from '../utils/format.js';

const EMPTY = { name: '', amount: '', dueDay: '' };

export default function Bills({ data, setData }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function startEdit(b) {
    setEditingId(b.id);
    setForm({ name: b.name, amount: String(b.amount), dueDay: String(b.dueDay) });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
  }

  function submit(e) {
    e.preventDefault();
    try {
      const input = { name: form.name, amount: Number(form.amount), dueDay: Number(form.dueDay) };
      setData(editingId ? updateBill(data, editingId, input) : addBill(data, input));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  function remove(b) {
    if (!window.confirm('Delete "' + b.name + '"?')) return;
    try {
      setData(deleteBill(data, b.id));
      if (editingId === b.id) cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="bills">
      <p className="count">{data.recurringBills.length} recurring bills</p>
      {data.recurringBills.map((b) => (
        <article className="invoice-card" key={b.id}>
          <header>
            <h3>{b.name}</h3>
          </header>
          <dl>
            <dt>Amount</dt>
            <dd>{formatRupees(b.amount)}</dd>
            <dt>Due day</dt>
            <dd>{b.dueDay} of every month</dd>
          </dl>
          <div className="actions">
            <button type="button" onClick={() => startEdit(b)}>Edit</button>
            <button type="button" onClick={() => remove(b)}>Delete</button>
          </div>
        </article>
      ))}
      <form className="form-card" onSubmit={submit}>
        <h3>{editingId ? 'Edit bill' : 'Add bill'}</h3>
        <label>
          Name
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <label>
          Due day of month (1–28)
          <input
            type="number"
            min="1"
            max="28"
            step="1"
            inputMode="numeric"
            value={form.dueDay}
            onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button-primary">{editingId ? 'Save changes' : 'Add bill'}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
