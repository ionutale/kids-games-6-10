import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PENGUIN_LEVEL_COUNT } from '$lib/penguin-code/levels.js';
import {
  PENGUIN_PROGRESS_KEY,
  emptyPenguinProgress,
  isPenguinComplete,
  isPenguinLevelComplete,
  isPenguinWorldComplete,
  isPenguinWorldUnlocked,
  loadPenguinProgress,
  nextPenguinLevel,
  penguinStarsTotal,
  penguinWorldStars,
  savePenguinProgress,
  savePenguinStars,
} from '$lib/penguin-code/progress.js';

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

function withStars(levelIds, stars = 1) {
  const progress = emptyPenguinProgress();
  for (const levelId of levelIds) {
    progress.stars[levelId - 1] = stars;
  }
  return progress;
}

function completeWorld(world, stars = 1) {
  const first = (world - 1) * 5 + 1;
  return withStars([first, first + 1, first + 2, first + 3, first + 4], stars);
}

function completeAll(stars = 1) {
  return withStars(
    Array.from({ length: PENGUIN_LEVEL_COUNT }, (_, index) => index + 1),
    stars,
  );
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe('penguin progress defaults', () => {
  it('starts with thirty zero stars', () => {
    const progress = emptyPenguinProgress();
    expect(progress.stars).toHaveLength(30);
    expect(progress.stars.every((stars) => stars === 0)).toBe(true);
    expect(penguinStarsTotal(progress)).toBe(0);
    expect(loadPenguinProgress()).toEqual(progress);
  });

  it('treats malformed or partial storage as empty', () => {
    localStorage.setItem(PENGUIN_PROGRESS_KEY, '{not json');
    expect(loadPenguinProgress()).toEqual(emptyPenguinProgress());

    localStorage.setItem(PENGUIN_PROGRESS_KEY, JSON.stringify({ stars: 'nope' }));
    expect(loadPenguinProgress()).toEqual(emptyPenguinProgress());

    localStorage.setItem(PENGUIN_PROGRESS_KEY, JSON.stringify([]));
    expect(loadPenguinProgress()).toEqual(emptyPenguinProgress());

    localStorage.setItem(PENGUIN_PROGRESS_KEY, JSON.stringify({ stars: [1, 2] }));
    const padded = loadPenguinProgress();
    expect(padded.stars).toHaveLength(30);
    expect(padded.stars.slice(0, 3)).toEqual([1, 2, 0]);
  });

  it('clamps stored stars into 0..3', () => {
    localStorage.setItem(PENGUIN_PROGRESS_KEY, JSON.stringify({ stars: [9, -1, 2, '3'] }));
    expect(loadPenguinProgress().stars.slice(0, 5)).toEqual([3, 0, 2, 3, 0]);
  });

  it('works without localStorage', () => {
    delete globalThis.localStorage;
    expect(loadPenguinProgress()).toEqual(emptyPenguinProgress());
    expect(() => savePenguinProgress(completeWorld(1))).not.toThrow();
  });
});

describe('penguin star persistence', () => {
  it('round-trips a saved progress object', () => {
    const progress = withStars([1, 7, 30], 2);
    savePenguinProgress(progress);
    expect(loadPenguinProgress()).toEqual(progress);
    expect(localStorage.getItem(PENGUIN_PROGRESS_KEY)).toBe(JSON.stringify(progress));
  });

  it('keeps the best result and never lowers it', () => {
    const first = savePenguinStars(7, 2);
    expect(first.stars[6]).toBe(2);

    const better = savePenguinStars(7, 3);
    expect(better.stars[6]).toBe(3);

    const worse = savePenguinStars(7, 1);
    expect(worse.stars[6]).toBe(3);
    expect(loadPenguinProgress().stars[6]).toBe(3);
  });

  it('clamps the level id to 1..30 and stars to 0..3', () => {
    const low = savePenguinStars(0, 3);
    expect(low.stars[0]).toBe(3);
    expect(low.stars[1]).toBe(0);

    const high = savePenguinStars(PENGUIN_LEVEL_COUNT + 5, 2);
    expect(high.stars[29]).toBe(2);

    const capped = savePenguinStars(1, 9);
    expect(capped.stars[0]).toBe(3);

    const zero = savePenguinStars(2, 0);
    expect(zero.stars[1]).toBe(0);
    expect(isPenguinLevelComplete(zero, 2)).toBe(false);
  });

  it('totals every earned star across the campaign', () => {
    expect(penguinStarsTotal(completeWorld(1))).toBe(5);
    expect(penguinStarsTotal(completeWorld(2, 3))).toBe(15);
    expect(penguinStarsTotal(completeAll(3))).toBe(90);
  });

  it('reports level and world completion from earned stars', () => {
    const progress = withStars([1, 2, 6], 1);
    expect(isPenguinLevelComplete(progress, 1)).toBe(true);
    expect(isPenguinLevelComplete(progress, 3)).toBe(false);
    expect(isPenguinLevelComplete(progress, 31)).toBe(false);

    expect(penguinWorldStars(progress, 2)).toBe(1);
    expect(penguinWorldStars(progress, 1)).toBe(2);
    expect(isPenguinWorldComplete(progress, 1)).toBe(false);
    expect(isPenguinWorldComplete(progress, 2)).toBe(false);

    const world1 = completeWorld(1);
    expect(isPenguinWorldComplete(world1, 1)).toBe(true);
    expect(isPenguinWorldComplete(world1, 2)).toBe(false);
  });
});

describe('penguin sequential worlds', () => {
  it('always opens world 1 and locks the rest on a fresh save', () => {
    const fresh = emptyPenguinProgress();
    expect(isPenguinWorldUnlocked(fresh, 1)).toBe(true);
    expect(isPenguinWorldUnlocked(fresh, 2)).toBe(false);
    expect(isPenguinWorldUnlocked(fresh, 6)).toBe(false);
  });

  it('locks world 2 until all five world 1 levels have stars', () => {
    const four = withStars([1, 2, 3, 4], 1);
    expect(isPenguinWorldComplete(four, 1)).toBe(false);
    expect(isPenguinWorldUnlocked(four, 2)).toBe(false);
    expect(nextPenguinLevel(four)).toBe(5);

    const full = withStars([1, 2, 3, 4, 5], 1);
    expect(isPenguinWorldComplete(full, 1)).toBe(true);
    expect(isPenguinWorldUnlocked(full, 2)).toBe(true);
    expect(nextPenguinLevel(full)).toBe(6);
  });

  it('opens world 3 only after world 2 is complete', () => {
    const world1 = completeWorld(1);
    expect(isPenguinWorldUnlocked(world1, 2)).toBe(true);
    expect(isPenguinWorldUnlocked(world1, 3)).toBe(false);

    const twoOfWorld2 = { ...world1, stars: [...world1.stars] };
    twoOfWorld2.stars[5] = 1;
    twoOfWorld2.stars[6] = 1;
    expect(isPenguinWorldUnlocked(twoOfWorld2, 3)).toBe(false);

    const bothWorlds = { stars: [...world1.stars] };
    for (let level = 6; level <= 10; level++) bothWorlds.stars[level - 1] = 1;
    expect(isPenguinWorldComplete(bothWorlds, 2)).toBe(true);
    expect(isPenguinWorldUnlocked(bothWorlds, 3)).toBe(true);
    expect(isPenguinWorldUnlocked(bothWorlds, 4)).toBe(false);
  });

  it('clamps world ids to 1..6', () => {
    const fresh = emptyPenguinProgress();
    expect(isPenguinWorldUnlocked(fresh, 0)).toBe(true);
    expect(isPenguinWorldUnlocked(fresh, 99)).toBe(false);

    const all = completeAll();
    expect(isPenguinWorldUnlocked(all, 99)).toBe(true);
  });
});

describe('penguin next level and completion', () => {
  it('returns the first level without stars', () => {
    expect(nextPenguinLevel(emptyPenguinProgress())).toBe(1);

    const partial = withStars([1, 3], 2);
    expect(nextPenguinLevel(partial)).toBe(2);

    const sequential = completeWorld(1);
    expect(nextPenguinLevel(sequential)).toBe(6);
  });

  it('returns 30 when every level is complete', () => {
    expect(nextPenguinLevel(completeAll(1))).toBe(30);
    expect(nextPenguinLevel(completeAll(3))).toBe(30);
  });

  it('is complete only when all thirty levels have stars', () => {
    expect(isPenguinComplete(emptyPenguinProgress())).toBe(false);
    expect(isPenguinComplete(completeWorld(1))).toBe(false);

    const missingLast = completeAll(1);
    missingLast.stars[29] = 0;
    expect(isPenguinComplete(missingLast)).toBe(false);

    expect(isPenguinComplete(completeAll(1))).toBe(true);
    expect(isPenguinComplete(completeAll(3))).toBe(true);
  });
});
