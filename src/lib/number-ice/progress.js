import { NUMBER_ICE_LEVEL_COUNT, getNumberIceWorld, worldLevels } from './levels.js';

export const NUMBER_ICE_PROGRESS_KEY = 'numberIce1';

function normalizeStars(raw) {
  const stars = Array.isArray(raw?.stars) ? raw.stars : [];
  return Array.from({ length: NUMBER_ICE_LEVEL_COUNT }, (_, index) => {
    const value = Number(stars[index]);
    return Number.isInteger(value) ? Math.min(3, Math.max(0, value)) : 0;
  });
}

function worldIdOf(worldId) {
  return getNumberIceWorld(worldId).id;
}

export function emptyNumberIceProgress() {
  return { stars: Array(NUMBER_ICE_LEVEL_COUNT).fill(0) };
}

export function loadNumberIceProgress() {
  if (typeof localStorage === 'undefined') return emptyNumberIceProgress();
  try {
    const raw = JSON.parse(localStorage.getItem(NUMBER_ICE_PROGRESS_KEY) || 'null');
    return { stars: normalizeStars(raw) };
  } catch {
    return emptyNumberIceProgress();
  }
}

export function saveNumberIceProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(NUMBER_ICE_PROGRESS_KEY, JSON.stringify({ stars: normalizeStars(progress) }));
  } catch {
    // Blocked or full storage should never stop the game.
  }
}

export function saveNumberIceStars(levelId, stars) {
  const progress = loadNumberIceProgress();
  const index = Math.max(0, Math.min(NUMBER_ICE_LEVEL_COUNT - 1, Number(levelId) - 1 || 0));
  progress.stars[index] = Math.max(progress.stars[index], Math.min(3, Math.max(0, stars)));
  saveNumberIceProgress(progress);
  return progress;
}

export function numberIceStarsTotal(progress) {
  return normalizeStars(progress).reduce((total, stars) => total + stars, 0);
}

export function isNumberIceLevelComplete(progress, levelId) {
  return normalizeStars(progress)[Number(levelId) - 1] > 0;
}

export function isNumberIceComplete(progress) {
  return normalizeStars(progress).every((stars) => stars > 0);
}

export function nextNumberIceLevel(progress) {
  const stars = normalizeStars(progress);
  const index = stars.findIndex((value) => value === 0);
  return index < 0 ? NUMBER_ICE_LEVEL_COUNT : index + 1;
}

export function numberIceWorldStars(progress, worldId) {
  const stars = normalizeStars(progress);
  return worldLevels(worldId).reduce((total, level) => total + stars[level.id - 1], 0);
}

export function isNumberIceWorldComplete(progress, worldId) {
  const stars = normalizeStars(progress);
  return worldLevels(worldId).every((level) => stars[level.id - 1] > 0);
}

export function isNumberIceWorldUnlocked(progress, worldId) {
  const id = worldIdOf(worldId);
  if (id === 1) return true;
  return isNumberIceWorldComplete(progress, id - 1);
}
