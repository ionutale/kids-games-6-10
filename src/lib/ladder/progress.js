// Shared 10-level ladder contract for every game in the hub.
export const MAX_LEVEL = 10;

function camel(gameId) {
  return gameId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function levelKey(gameId) {
  return `${camel(gameId)}Level`;
}

function masteryKey(gameId) {
  return `${camel(gameId)}Mastered`;
}

export function clampLevel(n) {
  const parsed = parseInt(n, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_LEVEL, Math.max(1, parsed));
}

export function loadLevel(gameId) {
  if (typeof localStorage === 'undefined') return 1;
  const n = parseInt(localStorage.getItem(levelKey(gameId)), 10);
  return Number.isFinite(n) ? clampLevel(n) : 1;
}

export function saveLevel(gameId, n) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(levelKey(gameId), String(clampLevel(n)));
}

export function loadMastered(gameId) {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(masteryKey(gameId)) === '1';
}

export function saveMastered(gameId) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(masteryKey(gameId), '1');
}

/**
 * Completing a level moves the "current level" forward, never backward.
 * Finishing level 10 marks the game mastered.
 */
export function advanceLevel(gameId, completedLevel) {
  const completed = clampLevel(completedLevel);
  if (completed >= MAX_LEVEL) {
    saveMastered(gameId);
    return;
  }
  const next = completed + 1;
  if (next > loadLevel(gameId)) saveLevel(gameId, next);
}
