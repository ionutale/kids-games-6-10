import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  SAVE_KEY,
  emptyProgress,
  normalizeProgress,
  loadProgress,
  saveProgress,
  mergeProgress,
  recordProgress,
  mergeStars,
  loadStars,
  recordStars,
  isWorldUnlocked,
  isWorldComplete,
  nextLevel,
  worldStars,
  isCampaignMastered,
} from '$lib/frost-breaker/progress.js';

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

function completeWorld(world, stars = 1) {
  let progress = emptyProgress();
  const start = (world - 1) * 5;
  for (let slot = 0; slot < 5; slot++) {
    progress = mergeProgress(progress, start + slot + 1, stars);
  }
  return progress;
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe('fresh v2 progress', () => {
  it('starts with fifty zero stars and no completions', () => {
    const progress = emptyProgress();
    expect(progress.version).toBe(2);
    expect(progress.stars).toHaveLength(50);
    expect(progress.completed).toHaveLength(50);
    expect(progress.stars.every((stars) => stars === 0)).toBe(true);
    expect(progress.completed.every((done) => done === false)).toBe(true);
  });

  it('ignores the old frostBreakerStars key entirely', () => {
    localStorage.setItem('frostBreakerStars', JSON.stringify([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]));
    expect(loadProgress()).toEqual(emptyProgress());
    expect(loadStars()).toEqual(Array(50).fill(0));
  });

  it('treats malformed or old payload shapes as empty', () => {
    expect(normalizeProgress(null)).toEqual(emptyProgress());
    expect(normalizeProgress([1, 2, 3])).toEqual(emptyProgress());
    expect(normalizeProgress({})).toEqual(emptyProgress());
    expect(normalizeProgress({ version: 1, stars: [3] })).toEqual(emptyProgress());

    localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadProgress()).toEqual(emptyProgress());
    localStorage.setItem(SAVE_KEY, JSON.stringify({ stars: 'nope' }));
    expect(loadProgress()).toEqual(emptyProgress());
  });

  it('clamps stored stars and derives completed from them', () => {
    const normalized = normalizeProgress({
      version: 2,
      stars: [9, -1, 2, '3'],
      completed: [false, false, false, false],
    });
    expect(normalized.stars.slice(0, 4)).toEqual([3, 0, 2, 3]);
    expect(normalized.completed.slice(0, 4)).toEqual([true, false, true, true]);
    expect(normalized.stars).toHaveLength(50);
    expect(normalized.completed).toHaveLength(50);
  });

  it('never trusts a stored completed flag without a earned star', () => {
    const normalized = normalizeProgress({ version: 2, stars: [0], completed: [true] });
    expect(normalized.completed[0]).toBe(false);
    expect(isWorldUnlocked(normalized, 2)).toBe(false);
  });
});

describe('best-star persistence', () => {
  it('keeps the best result and never lowers it', () => {
    const first = mergeProgress(emptyProgress(), 7, 2);
    expect(first.stars[6]).toBe(2);
    const better = mergeProgress(first, 7, 3);
    expect(better.stars[6]).toBe(3);
    const worse = mergeProgress(better, 7, 1);
    expect(worse.stars[6]).toBe(3);
    expect(first.stars[6]).toBe(2);
    expect(better.stars[6]).toBe(3);
  });

  it('does not complete on zero stars but does on one or more', () => {
    const failed = mergeProgress(emptyProgress(), 4, 0);
    expect(failed.completed[3]).toBe(false);
    const passed = mergeProgress(failed, 4, 1);
    expect(passed.completed[3]).toBe(true);
  });

  it('records through localStorage under the v2 key', () => {
    const recorded = recordProgress(12, 2);
    expect(recorded.stars[11]).toBe(2);
    expect(loadProgress()).toEqual(recorded);
    expect(localStorage.getItem(SAVE_KEY)).toBe(JSON.stringify(recorded));
  });

  it('round-trips a saved progress object', () => {
    const progress = mergeProgress(emptyProgress(), 50, 3);
    saveProgress(progress);
    expect(loadProgress()).toEqual(progress);
  });

  it('keeps the fifty-length mergeStars compatibility helper', () => {
    const merged = mergeStars([], 3, 2);
    expect(merged).toHaveLength(50);
    expect(merged[2]).toBe(2);
    expect(mergeStars(merged, 3, 1)[2]).toBe(2);
    expect(recordStars(3, 3)).toHaveLength(50);
  });
});

describe('sequential worlds', () => {
  it('locks world 2 until all five world 1 levels are complete', () => {
    let progress = emptyProgress();
    for (let level = 1; level <= 4; level++) {
      progress = mergeProgress(progress, level, 1);
    }
    expect(isWorldComplete(progress, 1)).toBe(false);
    expect(isWorldUnlocked(progress, 2)).toBe(false);
    expect(nextLevel(progress)).toBe(5);

    progress = mergeProgress(progress, 5, 1);
    expect(isWorldComplete(progress, 1)).toBe(true);
    expect(isWorldUnlocked(progress, 2)).toBe(true);
    expect(nextLevel(progress)).toBe(6);
  });

  it('always opens world 1 and keeps later worlds shut', () => {
    const fresh = emptyProgress();
    expect(isWorldUnlocked(fresh, 1)).toBe(true);
    expect(isWorldUnlocked(fresh, 2)).toBe(false);
    expect(isWorldUnlocked(fresh, 10)).toBe(false);
  });

  it('free-picks inside an open world and returns the first hole', () => {
    let progress = mergeProgress(emptyProgress(), 1, 1);
    progress = mergeProgress(progress, 3, 1);
    expect(nextLevel(progress)).toBe(2);

    progress = completeWorld(1);
    progress = mergeProgress(progress, 6, 1);
    progress = mergeProgress(progress, 8, 1);
    expect(isWorldUnlocked(progress, 2)).toBe(true);
    expect(nextLevel(progress)).toBe(7);
  });

  it('returns 50 when every world is complete', () => {
    let progress = emptyProgress();
    for (let level = 1; level <= 50; level++) {
      progress = mergeProgress(progress, level, 1);
    }
    expect(nextLevel(progress)).toBe(50);
  });

  it('reports the five stars for a single world', () => {
    let progress = mergeProgress(emptyProgress(), 6, 3);
    progress = mergeProgress(progress, 9, 2);
    expect(worldStars(progress, 2)).toEqual([3, 0, 0, 2, 0]);
    expect(worldStars(progress, 1)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('campaign mastery', () => {
  it('requires three stars on all fifty levels', () => {
    expect(isCampaignMastered(emptyProgress())).toBe(false);
    expect(isCampaignMastered(completeWorld(1, 3))).toBe(false);

    let progress = emptyProgress();
    for (let level = 1; level <= 50; level++) {
      progress = mergeProgress(progress, level, 3);
    }
    expect(isCampaignMastered(progress)).toBe(true);
    expect(isCampaignMastered(mergeProgress(progress, 20, 2))).toBe(true);
    const weaker = { ...progress, stars: progress.stars.map((stars, i) => (i === 19 ? 2 : stars)) };
    expect(isCampaignMastered(weaker)).toBe(false);
  });
});
