import { buildSeed } from './seed.js';

const KEY = 'tuitiondesk.v1';

function hasStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function loadData() {
  if (hasStorage()) {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        /* fall through to reseed */
      }
    }
  }
  const data = buildSeed();
  saveData(data);
  return data;
}

export function saveData(data) {
  if (hasStorage()) window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function resetToSeed() {
  const data = buildSeed();
  saveData(data);
  return data;
}
