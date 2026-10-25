import { PENGUIN_LEVEL_COUNT, getPenguinWorld, worldLevels } from './levels.js';

export const PENGUIN_PROGRESS_KEY = 'penguinCode1';

export function emptyPenguinProgress() {
  return { stars: Array(PENGUIN_LEVEL_COUNT).fill(0) };
}

function normalizeStars(raw) {
  const stars = Array.isArray(raw?.stars) ? raw.stars : [];
  return Array.from({ length: PENGUIN_LEVEL_COUNT }, (_, index) => {
    const value = Number(stars[index]);
    return Number.isInteger(value) ? Math.min(3, Math.max(0, value)) : 0;
  });
}

export function loadPenguinProgress() {
  if (typeof localStorage === 'undefined') return emptyPenguinProgress();
  try {
    const raw = JSON.parse(localStorage.getItem(PENGUIN_PROGRESS_KEY) || 'null');
    return { stars: normalizeStars(raw) };
  } catch {
    return emptyPenguinProgress();
  }
}

export function savePenguinProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PENGUIN_PROGRESS_KEY, JSON.stringify({ stars: normalizeStars(progress) }));
  } catch {
    // A full or blocked storage should never stop the game.
  }
}

export function savePenguinStars(levelId, stars) {
  const progress = loadPenguinProgress();
  const index = Math.max(0, Math.min(PENGUIN_LEVEL_COUNT - 1, Number(levelId) - 1 || 0));
  progress.stars[index] = Math.max(progress.stars[index], Math.min(3, Math.max(0, stars)));
  savePenguinProgress(progress);
  return progress;
}

export function penguinStarsTotal(progress) {
  return normalizeStars(progress).reduce((total, stars) => total + stars, 0);
}

export function isPenguinLevelComplete(progress, levelId) {
  return normalizeStars(progress)[Number(levelId) - 1] > 0;
}

export function isPenguinComplete(progress) {
  return normalizeStars(progress).every((stars) => stars > 0);
}

export function nextPenguinLevel(progress) {
  const stars = normalizeStars(progress);
  const index = stars.findIndex((value) => value === 0);
  return index < 0 ? PENGUIN_LEVEL_COUNT : index + 1;
}

function worldIdOf(worldId) {
  return getPenguinWorld(worldId).id;
}

export function penguinWorldStars(progress, worldId) {
  const stars = normalizeStars(progress);
  return worldLevels(worldId).reduce((total, level) => total + stars[level.id - 1], 0);
}

export function isPenguinWorldComplete(progress, worldId) {
  const stars = normalizeStars(progress);
  return worldLevels(worldId).every((level) => stars[level.id - 1] > 0);
}

export function isPenguinWorldUnlocked(progress, worldId) {
  const id = worldIdOf(worldId);
  if (id === 1) return true;
  return isPenguinWorldComplete(progress, id - 1);
}
