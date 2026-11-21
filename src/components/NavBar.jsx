const ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Students' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'bills', label: 'Bills' },
  { key: 'forecast', label: 'Forecast' },
];

export default function NavBar({ current, onChange }) {
  return (
    <nav className="navbar">
      {ITEMS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={current === key ? 'active' : ''}
          aria-current={current === key ? 'page' : undefined}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
