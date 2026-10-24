import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initialMirrorDirs, reflect, solveLevel, traceBeam } from '$lib/aurora/beam.js';
import {
  AURORA_LEVELS,
  AURORA_LEVEL_COUNT,
  getAuroraLevel,
  isAuroraPerfect,
  starsForAuroraMoves,
} from '$lib/aurora/levels.js';
import {
  AURORA_PROGRESS_KEY,
  auroraStarsTotal,
  emptyAuroraProgress,
  isAuroraComplete,
  isAuroraLevelComplete,
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
  it('ships five handcrafted levels', () => {
    expect(AURORA_LEVEL_COUNT).toBe(5);
    expect(AURORA_LEVELS).toHaveLength(5);
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
    expect(getAuroraLevel(99).id).toBe(5);
    expect(starsForAuroraMoves(2, 2)).toBe(3);
    expect(starsForAuroraMoves(4, 2)).toBe(2);
    expect(starsForAuroraMoves(5, 2)).toBe(1);
  });
});

describe('Aurora progress', () => {
  it('starts empty and loads parsing failures as empty', () => {
    expect(emptyAuroraProgress().stars).toEqual([0, 0, 0, 0, 0]);
    expect(loadAuroraProgress()).toEqual(emptyAuroraProgress());
    localStorage.setItem(AURORA_PROGRESS_KEY, '{not json');
    expect(loadAuroraProgress()).toEqual(emptyAuroraProgress());
  });

  it('keeps the best stars and normalizes stored values', () => {
    saveAuroraStars(2, 2);
    saveAuroraStars(2, 1);
    expect(loadAuroraProgress().stars[1]).toBe(2);
    expect(auroraStarsTotal(loadAuroraProgress())).toBe(2);
    expect(isAuroraLevelComplete(loadAuroraProgress(), 2)).toBe(true);
  });

  it('finds the next unfinished level and detects a complete run', () => {
    expect(nextAuroraLevel(emptyAuroraProgress())).toBe(1);
    for (let level = 1; level <= 5; level++) saveAuroraStars(level, 3);
    const complete = loadAuroraProgress();
    expect(auroraStarsTotal(complete)).toBe(15);
    expect(isAuroraComplete(complete)).toBe(true);
    expect(isAuroraPerfect(complete.stars)).toBe(true);
    expect(nextAuroraLevel(complete)).toBe(5);
  });

  it('saves calls and survives no storage', () => {
    expect(() => saveAuroraProgress(emptyAuroraProgress())).not.toThrow();
    delete globalThis.localStorage;
    expect(loadAuroraProgress()).toEqual(emptyAuroraProgress());
    expect(() => saveAuroraStars(1, 3)).not.toThrow();
  });
});
