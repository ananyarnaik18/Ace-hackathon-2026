// Date helpers. Both use LOCAL date parts, so the result matches the user's calendar day.
const pad = (n) => String(n).padStart(2, '0');

// Returns 'YYYY-MM-DD' for the given date (defaults to now).
export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Returns 'YYYY-MM' for the given date (defaults to now).
export function currentMonth(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}
