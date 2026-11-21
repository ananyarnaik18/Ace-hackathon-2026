const LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
  partial: 'Partly paid',
  'due-soon': 'Due soon',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status];
  return <span className={'badge badge-' + status}>{label}</span>;
}
