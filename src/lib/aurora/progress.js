import { AURORA_LEVEL_COUNT } from './levels.js';

export const AURORA_PROGRESS_KEY = 'auroraMirrors1';

export function emptyAuroraProgress() {
  return { stars: Array(AURORA_LEVEL_COUNT).fill(0) };
}

function normalizeStars(raw) {
  const stars = Array.isArray(raw?.stars) ? raw.stars : [];
  return Array.from({ length: AURORA_LEVEL_COUNT }, (_, index) => {
    const value = Number(stars[index]);
    return Number.isInteger(value) ? Math.min(3, Math.max(0, value)) : 0;
  });
}

export function loadAuroraProgress() {
  if (typeof localStorage === 'undefined') return emptyAuroraProgress();
  try {
    const raw = JSON.parse(localStorage.getItem(AURORA_PROGRESS_KEY) || 'null');
    return { stars: normalizeStars(raw) };
  } catch {
    return emptyAuroraProgress();
  }
}

export function saveAuroraProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(AURORA_PROGRESS_KEY, JSON.stringify({ stars: normalizeStars(progress) }));
  } catch {
    // A full or blocked storage should never stop the game.
  }
}

export function saveAuroraStars(levelId, stars) {
  const progress = loadAuroraProgress();
  const index = Math.max(0, Math.min(AURORA_LEVEL_COUNT - 1, Number(levelId) - 1 || 0));
  progress.stars[index] = Math.max(progress.stars[index], Math.min(3, Math.max(0, stars)));
  saveAuroraProgress(progress);
  return progress;
}

export function auroraStarsTotal(progress) {
  return normalizeStars(progress).reduce((total, stars) => total + stars, 0);
}

export function isAuroraLevelComplete(progress, levelId) {
  return normalizeStars(progress)[Number(levelId) - 1] > 0;
}

export function isAuroraComplete(progress) {
  return normalizeStars(progress).every((stars) => stars > 0);
}

export function nextAuroraLevel(progress) {
  const stars = normalizeStars(progress);
  const index = stars.findIndex((value) => value === 0);
  return index < 0 ? AURORA_LEVEL_COUNT : index + 1;
}
