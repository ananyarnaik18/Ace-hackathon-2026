const LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status];
  return <span className={'badge badge-' + status}>{label}</span>;
}
