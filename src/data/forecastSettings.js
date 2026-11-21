export const FORECAST_KEY = 'tuitiondesk.forecast.v1';
export const DEFAULT_SETTINGS = { openingBalance: 3000, collectionDays: 7 };

export function clampCollectionDays(n) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function hasStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadForecastSettings() {
  if (!hasStorage()) return { ...DEFAULT_SETTINGS };
  const raw = window.localStorage.getItem(FORECAST_KEY);
  if (raw === null) return { ...DEFAULT_SETTINGS };
  let s;
  try {
    s = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    openingBalance: Number.isFinite(Number(s.openingBalance))
      ? Math.round(Number(s.openingBalance))
      : DEFAULT_SETTINGS.openingBalance,
    collectionDays: clampCollectionDays(s.collectionDays ?? DEFAULT_SETTINGS.collectionDays),
  };
}

export function saveForecastSettings(settings) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(FORECAST_KEY, JSON.stringify(settings));
  } catch {
    /* ignore storage errors */
  }
}
