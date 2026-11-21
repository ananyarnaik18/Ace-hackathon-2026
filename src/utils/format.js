export function formatRupees(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function formatDate(iso) { const [y, m, d] = iso.split('-'); return `${d} ${MONTHS[Number(m) - 1]} ${y}`; }
