import { useState } from 'react';
import { balanceOf, daysOverdue } from '../data/invoices';
import { buildReminder, whatsappLink, REMINDER_LANGUAGES } from '../data/reminder';

export default function ReminderPanel({ invoice, student, today, onClose }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lang, setLang] = useState('en');

  const days = daysOverdue(invoice, today);
  const text = buildReminder({
    parentName: student.parentName,
    studentName: student.name,
    amount: balanceOf(invoice),
    daysOverdue: days,
    lang,
  });

  function handleCopy() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => setCopied(true))
        .catch(() => setFailed(true));
    } else {
      setFailed(true);
    }
  }

  let link = null;
  let linkError = false;
  try {
    link = whatsappLink(student.parentPhone, text);
  } catch (err) {
    linkError = true;
  }

  return (
    <div className="reminder-panel">
      <h4>Draft reminder</h4>
      <div>
        {REMINDER_LANGUAGES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={lang === option.value}
            onClick={() => setLang(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <textarea readOnly rows={6} value={text} />
      <button type="button" onClick={handleCopy}>Copy</button>
      {copied && <span> Copied</span>}
      {failed && <p className="hint">Select the text above and copy it by hand.</p>}
      {linkError ? (
        <p className="error">Parent phone number is missing or invalid, so WhatsApp cannot be opened.</p>
      ) : (
        <a className="button" href={link} target="_blank" rel="noopener noreferrer">
          Open in WhatsApp
        </a>
      )}
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}
