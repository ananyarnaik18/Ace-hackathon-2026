import { useState } from 'react';
import { formatRupees } from '../utils/format.js';
import { BATCHES } from '../data/model.js';
import { buildSeed } from '../data/seed.js';
import { validateStudent, addStudent, updateStudent, deleteStudent } from '../data/students.js';

const EMPTY_FORM = {
  name: '',
  parentName: '',
  parentPhone: '',
  batch: BATCHES[0],
  monthlyFee: '',
  dueDay: '',
  createInvoice: true,
};

export default function Students({ data, setData }) {
  const [query, setQuery] = useState('');
  const [batch, setBatch] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const q = query.trim().toLowerCase();

  const rows = data.students.filter((s) => {
    if (batch !== 'all' && s.batch !== batch) return false;
    if (!q) return true;
    return [s.name, s.parentName, s.parentPhone].some((v) => String(v).toLowerCase().includes(q));
  });

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  }

  function startEdit(s) {
    setEditingId(s.id);
    setErrors({});
    setForm({
      name: s.name,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      batch: s.batch,
      monthlyFee: String(s.monthlyFee),
      dueDay: String(s.dueDay),
      createInvoice: false,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const input = { ...form };
    const found = validateStudent(input);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    if (editingId) {
      setData((prev) => updateStudent(prev, editingId, input));
    } else {
      const today = new Date();
      setData((prev) => addStudent(prev, input, { createDraftInvoice: input.createInvoice, today }));
    }
    resetForm();
  }

  function handleDelete(s) {
    if (!window.confirm('Delete this student? Their invoices and payments will also be removed.')) return;
    setData((prev) => deleteStudent(prev, s.id));
    if (editingId === s.id) resetForm();
  }

  function handleReset() {
    if (!window.confirm('This replaces all your current data with the sample data. Continue?')) return;
    setData(buildSeed(new Date()));
    resetForm();
  }

  return (
    <section className="students">
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, parent or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search students"
        />
        <select value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Filter by batch">
          <option value="all">All batches</option>
          {BATCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <button type="button" className="button-primary" onClick={handleReset}>Reset demo data</button>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <h3>{editingId ? 'Edit student' : 'Add student'}</h3>
        <label>
          Name
          <input value={form.name} onChange={setField('name')} aria-invalid={!!errors.name} />
          {errors.name && <span className="error">{errors.name}</span>}
        </label>
        <label>
          Parent name
          <input value={form.parentName} onChange={setField('parentName')} aria-invalid={!!errors.parentName} />
          {errors.parentName && <span className="error">{errors.parentName}</span>}
        </label>
        <label>
          Parent phone
          <input
            type="tel"
            inputMode="numeric"
            value={form.parentPhone}
            onChange={setField('parentPhone')}
            aria-invalid={!!errors.parentPhone}
          />
          {errors.parentPhone && <span className="error">{errors.parentPhone}</span>}
        </label>
        <label>
          Batch
          <select value={form.batch} onChange={setField('batch')} aria-invalid={!!errors.batch}>
            {BATCHES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {errors.batch && <span className="error">{errors.batch}</span>}
        </label>
        <label>
          Monthly fee (₹)
          <input
            type="number"
            min="1"
            step="1"
            value={form.monthlyFee}
            onChange={setField('monthlyFee')}
            aria-invalid={!!errors.monthlyFee}
          />
          {errors.monthlyFee && <span className="error">{errors.monthlyFee}</span>}
        </label>
        <label>
          Due day (1-28)
          <input
            type="number"
            min="1"
            max="28"
            step="1"
            value={form.dueDay}
            onChange={setField('dueDay')}
            aria-invalid={!!errors.dueDay}
          />
          {errors.dueDay && <span className="error">{errors.dueDay}</span>}
        </label>
        {!editingId && (
          <label>
            <input
              type="checkbox"
              checked={form.createInvoice}
              onChange={(e) => setForm((f) => ({ ...f, createInvoice: e.target.checked }))}
            />{' '}
            Create this month's invoice as a draft
          </label>
        )}
        <div className="actions">
          <button type="submit" className="button-primary">{editingId ? 'Save changes' : 'Add student'}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>

      <p className="count">Showing {rows.length} of {data.students.length} students</p>
      {rows.length === 0 ? (
        <p className="empty-state">No students match. Try another name, or set the batch back to All batches.</p>
      ) : (
        <div className="table-wrap">
          <table className="owed-table students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent</th>
                <th>Phone</th>
                <th>Batch</th>
                <th className="num">Monthly fee</th>
                <th className="num">Due day</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td data-label="Name">{s.name}</td>
                  <td data-label="Parent">{s.parentName}</td>
                  <td data-label="Phone">{s.parentPhone}</td>
                  <td data-label="Batch">{s.batch}</td>
                  <td data-label="Monthly fee" className="num">{formatRupees(s.monthlyFee)}</td>
                  <td data-label="Due day" className="num">{s.dueDay}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button type="button" onClick={() => startEdit(s)}>Edit</button>
                      <button type="button" onClick={() => handleDelete(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
