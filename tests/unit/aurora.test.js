import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialMirrorDirs, reflect, solveLevel, traceBeam } from '$lib/aurora/beam.js';
import {
  AURORA_LEVELS,
  AURORA_LEVEL_COUNT,
  AURORA_LEVELS_PER_WORLD,
  AURORA_WORLDS,
  AURORA_WORLD_COUNT,
  getAuroraLevel,
  isAuroraPerfect,
  starsForAuroraMoves,
  worldLevels,
} from '$lib/aurora/levels.js';
import {
  AURORA_PROGRESS_KEY,
  auroraStarsTotal,
  auroraWorldStars,
  emptyAuroraProgress,
  isAuroraComplete,
  isAuroraLevelComplete,
  isAuroraWorldComplete,
  isAuroraWorldUnlocked,
  loadAuroraProgress,
  nextAuroraLevel,
  saveAuroraProgress,
  saveAuroraStars,
} from '$lib/aurora/progress.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

function progressWith(levels, stars = 1) {
  const progress = emptyAuroraProgress();
  for (const level of levels) progress.stars[level - 1] = stars;
  return progress;
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe('beam reflection', () => {
  it('reflects in four directions for both mirror orientations', () => {
    expect(reflect(0, 1, '/')).toEqual([-1, 0]);
    expect(reflect(-1, 0, '/')).toEqual([0, 1]);
    expect(reflect(0, 1, '\\')).toEqual([1, 0]);
    expect(reflect(1, 0, '\\')).toEqual([0, 1]);
  });

  it('lights a target only when the beam crosses it', () => {
    const level = AURORA_LEVELS[0];
    const initial = traceBeam({
      size: level.size,
      source: level.source,
      mirrorDirs: initialMirrorDirs(level),
      walls: level.walls,
      targets: level.targets,
    });
    expect(initial.lit).toBe(false);

    const solved = traceBeam({
      size: level.size,
      source: level.source,
      mirrorDirs: { '3-3': '/' },
      walls: level.walls,
      targets: level.targets,
    });
    expect(solved.lit).toBe(true);
    expect(solved.hits).toContain('0-3');
  });

  it('stops at a wall', () => {
    const beam = traceBeam({
      size: 5,
      source: { r: 2, c: -1, dr: 0, dc: 1 },
      mirrorDirs: {},
      walls: ['2-2'],
      targets: ['2-4'],
    });
    expect(beam.lit).toBe(false);
    expect(beam.points.at(-1)).toEqual({ x: 1.5, y: 2.5 });
  });
});

describe('Aurora Mirrors levels', () => {
  it('ships thirty unique levels across six worlds of five', () => {
    expect(AURORA_LEVEL_COUNT).toBe(30);
    expect(AURORA_WORLD_COUNT).toBe(6);
    expect(AURORA_LEVELS_PER_WORLD).toBe(5);
    expect(AURORA_LEVELS).toHaveLength(30);
    expect(new Set(AURORA_LEVELS.map((level) => level.id)).size).toBe(30);
    expect(AURORA_WORLDS).toHaveLength(6);

    for (const world of AURORA_WORLDS) {
      const levels = worldLevels(world.id);
      expect(levels).toHaveLength(5);
      expect(levels.every((level) => level.world === world.id)).toBe(true);
    }
  });

  it('every level starts unsolved and is solvable at the documented par', () => {
    for (const level of AURORA_LEVELS) {
      const initial = traceBeam({
        size: level.size,
        source: level.source,
        mirrorDirs: initialMirrorDirs(level),
        walls: level.walls,
        targets: level.targets,
      });
      expect(initial.lit).toBe(false);

      const result = solveLevel(level);
      expect(result.solvable).toBe(true);
      expect(result.par).toBe(level.par);
      expect(result.par).toBeGreaterThan(0);
    }
  });

  it('clamps level routes and awards stars by move count', () => {
    expect(getAuroraLevel(0).id).toBe(1);
    expect(getAuroraLevel(99).id).toBe(30);
    expect(starsForAuroraMoves(2, 2)).toBe(3);
    expect(starsForAuroraMoves(4, 2)).toBe(2);
    expect(starsForAuroraMoves(5, 2)).toBe(1);
  });
});

describe('Aurora progress', () => {
  it('starts with thirty empty stars and loads malformed storage as empty', () => {
    const empty = emptyAuroraProgress();
    expect(empty.stars).toHaveLength(30);
    expect(empty.stars.every((stars) => stars === 0)).toBe(true);
    expect(loadAuroraProgress()).toEqual(empty);

    localStorage.setItem(AURORA_PROGRESS_KEY, '{not json');
    expect(loadAuroraProgress()).toEqual(empty);

    localStorage.setItem(AURORA_PROGRESS_KEY, JSON.stringify({ stars: 'not an array' }));
    expect(loadAuroraProgress()).toEqual(empty);
  });

  it('migrates a five-star save into thirty stars', () => {
    localStorage.setItem(AURORA_PROGRESS_KEY, JSON.stringify({ stars: [3, 2, 1, 0, 1] }));

    const migrated = loadAuroraProgress();
    expect(migrated.stars).toHaveLength(30);
    expect(migrated.stars.slice(0, 5)).toEqual([3, 2, 1, 0, 1]);
    expect(migrated.stars.slice(5).every((stars) => stars === 0)).toBe(true);
    expect(auroraStarsTotal(migrated)).toBe(7);
  });

  it('keeps the best stars and normalizes stored values', () => {
    saveAuroraStars(2, 2);
    saveAuroraStars(2, 1);
    expect(loadAuroraProgress().stars[1]).toBe(2);
    expect(auroraStarsTotal(loadAuroraProgress())).toBe(2);
    expect(isAuroraLevelComplete(loadAuroraProgress(), 2)).toBe(true);
    expect(isAuroraLevelComplete(loadAuroraProgress(), 3)).toBe(false);

    saveAuroraStars(30, 3);
    expect(loadAuroraProgress().stars[29]).toBe(3);
    expect(auroraStarsTotal(loadAuroraProgress())).toBe(5);
  });

  it('sums the five levels of a world and completes it', () => {
    const progress = progressWith([1], 3);
    progress.stars[1] = 2;

    expect(auroraWorldStars(progress, 1)).toBe(5);
    expect(auroraWorldStars(progress, 2)).toBe(0);
    expect(isAuroraWorldComplete(progress, 1)).toBe(false);

    for (let level = 1; level <= 5; level++) progress.stars[level - 1] = 1;
    expect(isAuroraWorldComplete(progress, 1)).toBe(true);
    expect(isAuroraWorldComplete(progress, 2)).toBe(false);
    expect(auroraWorldStars(progress, 1)).toBe(5);
  });

  it('unlocks worlds one at a time and clamps world ids', () => {
    const progress = emptyAuroraProgress();
    expect(isAuroraWorldUnlocked(progress, 1)).toBe(true);
    expect(isAuroraWorldUnlocked(progress, 2)).toBe(false);
    expect(isAuroraWorldUnlocked(progress, 6)).toBe(false);

    for (let level = 1; level <= 4; level++) progress.stars[level - 1] = 1;
    expect(isAuroraWorldUnlocked(progress, 2)).toBe(false);
    progress.stars[4] = 1;
    expect(isAuroraWorldUnlocked(progress, 2)).toBe(true);
    expect(isAuroraWorldUnlocked(progress, 3)).toBe(false);

    for (let level = 6; level <= 10; level++) progress.stars[level - 1] = 1;
    expect(isAuroraWorldUnlocked(progress, 3)).toBe(true);
    expect(isAuroraWorldUnlocked(progress, 4)).toBe(false);

    for (let level = 11; level <= 25; level++) progress.stars[level - 1] = 1;
    expect(isAuroraWorldUnlocked(progress, 6)).toBe(true);

    expect(isAuroraWorldUnlocked(progress, 0)).toBe(true);
    expect(isAuroraWorldUnlocked(progress, 7)).toBe(isAuroraWorldUnlocked(progress, 6));
    expect(isAuroraWorldUnlocked(progress, 99)).toBe(isAuroraWorldUnlocked(progress, 6));
  });

  it('finds the next unfinished level and detects a complete run', () => {
    expect(nextAuroraLevel(emptyAuroraProgress())).toBe(1);

    const partial = progressWith([1, 2], 3);
    partial.stars[2] = 2;
    expect(nextAuroraLevel(partial)).toBe(4);

    const almost = progressWith(
      Array.from({ length: 30 }, (_, index) => index + 1),
      3,
    );
    almost.stars[4] = 0;
    expect(nextAuroraLevel(almost)).toBe(5);
    expect(isAuroraComplete(almost)).toBe(false);

    for (let level = 1; level <= 30; level++) saveAuroraStars(level, 3);
    const complete = loadAuroraProgress();
    expect(auroraStarsTotal(complete)).toBe(90);
    expect(isAuroraComplete(complete)).toBe(true);
    expect(isAuroraPerfect(complete.stars)).toBe(true);
    expect(nextAuroraLevel(complete)).toBe(30);

    expect(isAuroraPerfect(Array(5).fill(3))).toBe(false);
  });

  it('saves calls and survives no storage', () => {
    expect(() => saveAuroraProgress(emptyAuroraProgress())).not.toThrow();
    delete globalThis.localStorage;
    expect(loadAuroraProgress()).toEqual(emptyAuroraProgress());
    expect(() => saveAuroraStars(1, 3)).not.toThrow();
    expect(() => saveAuroraProgress(emptyAuroraProgress())).not.toThrow();
  });
});
