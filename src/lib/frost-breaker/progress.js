import { LEVELS_PER_WORLD, MAX_FROST_LEVEL, WORLD_COUNT } from './levels.js';

/** Fresh v2 save. Old `frostBreakerStars` data is deliberately ignored. */
export const SAVE_KEY = 'frostBreaker2';

function clampStar(stars) {
  const n = Math.trunc(Number(stars) || 0);
  return Math.max(0, Math.min(3, n));
}

function clampLevel(level) {
  const n = Math.trunc(Number(level) || 1);
  return Math.max(1, Math.min(MAX_FROST_LEVEL, n));
}

export function emptyProgress() {
  return {
    version: 2,
    stars: Array(MAX_FROST_LEVEL).fill(0),
    completed: Array(MAX_FROST_LEVEL).fill(false),
  };
}

/** Clamp any stored payload back to the exact 50-entry v2 shape. */
export function normalizeProgress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyProgress();
  if (raw.version != null && raw.version !== 2) return emptyProgress();
  if (!Array.isArray(raw.stars)) return emptyProgress();

  const progress = emptyProgress();
  for (let i = 0; i < MAX_FROST_LEVEL; i++) {
    const stars = clampStar(raw.stars[i]);
    progress.stars[i] = stars;
    progress.completed[i] = stars >= 1;
  }
  return progress;
}

export function loadProgress() {
  if (typeof localStorage === 'undefined') return emptyProgress();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    return normalizeProgress(raw);
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeProgress(progress)));
}

/** Pure best-star merge; a weaker replay never lowers a saved result. */
export function mergeProgress(progress, level, stars) {
  const next = normalizeProgress(progress);
  const index = clampLevel(level) - 1;
  const result = clampStar(stars);
  next.stars[index] = Math.max(next.stars[index], result);
  if (next.stars[index] >= 1) next.completed[index] = true;
  return next;
}

export function recordProgress(level, stars) {
  const next = mergeProgress(loadProgress(), level, stars);
  saveProgress(next);
  return next;
}

/** 50-length best-star compatibility helper used by the result screen. */
export function mergeStars(existingStars, level, stars) {
  return mergeProgress({ stars: existingStars }, level, stars).stars;
}

export function loadStars() {
  return loadProgress().stars;
}

export function recordStars(level, stars) {
  return recordProgress(level, stars).stars;
}

export function isWorldComplete(progress, world) {
  const w = Math.trunc(Number(world) || 0);
  if (w < 1 || w > WORLD_COUNT) return false;
  const { completed } = normalizeProgress(progress);
  const start = (w - 1) * LEVELS_PER_WORLD;
  return completed.slice(start, start + LEVELS_PER_WORLD).every(Boolean);
}

export function isWorldUnlocked(progress, world) {
  const w = Math.trunc(Number(world) || 0);
  if (w < 1 || w > WORLD_COUNT) return false;
  if (w === 1) return true;
  return isWorldComplete(progress, w - 1);
}

/** First uncompleted level in the first open world; 50 once all are done. */
export function nextLevel(progress) {
  const normalized = normalizeProgress(progress);
  for (let world = 1; world <= WORLD_COUNT; world++) {
    if (!isWorldUnlocked(normalized, world)) break;
    if (isWorldComplete(normalized, world)) continue;
    const start = (world - 1) * LEVELS_PER_WORLD;
    for (let slot = 0; slot < LEVELS_PER_WORLD; slot++) {
      if (!normalized.completed[start + slot]) return start + slot + 1;
    }
  }
  return MAX_FROST_LEVEL;
}

export function worldStars(progress, world) {
  const { stars } = normalizeProgress(progress);
  const w = Math.max(1, Math.min(WORLD_COUNT, Math.trunc(Number(world) || 1)));
  const start = (w - 1) * LEVELS_PER_WORLD;
  return stars.slice(start, start + LEVELS_PER_WORLD);
}

export function isCampaignMastered(progress) {
  return normalizeProgress(progress).stars.every((stars) => stars === 3);
}
