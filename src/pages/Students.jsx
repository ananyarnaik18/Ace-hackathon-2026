import { useState } from 'react';
import { formatRupees } from '../utils/format.js';
import { BATCHES } from '../data/model.js';

export default function Students({ data }) {
  const [query, setQuery] = useState('');
  const [batch, setBatch] = useState('all');
  const q = query.trim().toLowerCase();

  const rows = data.students.filter((s) => {
    if (batch !== 'all' && s.batch !== batch) return false;
    if (!q) return true;
    return [s.name, s.parentName, s.parentPhone].some((v) => String(v).toLowerCase().includes(q));
  });

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
      </div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
