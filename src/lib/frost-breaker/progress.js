import { MAX_LEVEL } from '../ladder/progress.js';

const STARS_KEY = 'frostBreakerStars';

/** Pure merge so the result screen can be tested without localStorage. */
export function mergeStars(existing, level, stars) {
  const next = Array.from({ length: MAX_LEVEL }, (_, i) => Number(existing?.[i] ?? 0));
  const index = Math.max(0, Math.min(MAX_LEVEL - 1, Number(level) - 1));
  next[index] = Math.max(next[index], Math.max(0, Math.min(3, Number(stars) || 0)));
  return next;
}

export function loadStars() {
  if (typeof localStorage === 'undefined') return Array(MAX_LEVEL).fill(0);
  try {
    const raw = JSON.parse(localStorage.getItem(STARS_KEY) || '[]');
    return Array.from({ length: MAX_LEVEL }, (_, i) => Math.max(0, Math.min(3, Number(raw?.[i] ?? 0))));
  } catch {
    return Array(MAX_LEVEL).fill(0);
  }
}

export function saveStars(stars) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STARS_KEY, JSON.stringify(stars));
}

export function recordStars(level, stars) {
  const next = mergeStars(loadStars(), level, stars);
  saveStars(next);
  return next;
}
