import { useState } from 'react';
import { balanceOf } from '../data/invoices';
import { PAYMENT_METHOD } from '../data/model';
import { todayIso } from '../utils/date';

export default function RecordPaymentForm({ invoice, onSubmit, onCancel }) {
  const [amount, setAmount] = useState(String(balanceOf(invoice)));
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState(PAYMENT_METHOD.UPI);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    try {
      onSubmit({ amount: Number(amount), date, method });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label>
        Amount (₹)
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Method
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
        </select>
      </label>
      <button type="submit">Save payment</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
