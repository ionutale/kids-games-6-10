import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  NUMBER_ICE_PROGRESS_KEY,
  emptyNumberIceProgress,
  isNumberIceComplete,
  isNumberIceLevelComplete,
  isNumberIceWorldComplete,
  isNumberIceWorldUnlocked,
  loadNumberIceProgress,
  nextNumberIceLevel,
  numberIceStarsTotal,
  numberIceWorldStars,
  saveNumberIceStars,
} from '$lib/number-ice/progress.js';

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

describe('Number Ice progress', () => {
  it('starts with 30 zero stars and survives malformed storage', () => {
    expect(emptyNumberIceProgress().stars).toHaveLength(30);
    expect(emptyNumberIceProgress().stars.every((stars) => stars === 0)).toBe(true);
    expect(loadNumberIceProgress()).toEqual(emptyNumberIceProgress());
    localStorage.setItem(NUMBER_ICE_PROGRESS_KEY, '{not json');
    expect(loadNumberIceProgress()).toEqual(emptyNumberIceProgress());
    localStorage.setItem(NUMBER_ICE_PROGRESS_KEY, JSON.stringify({ stars: 'nope' }));
    expect(loadNumberIceProgress()).toEqual(emptyNumberIceProgress());
  });

  it('keeps the best stars and totals them', () => {
    saveNumberIceStars(1, 2);
    saveNumberIceStars(1, 1);
    saveNumberIceStars(6, 3);
    const progress = loadNumberIceProgress();
    expect(progress.stars[0]).toBe(2);
    expect(progress.stars[5]).toBe(3);
    expect(numberIceStarsTotal(progress)).toBe(5);
    expect(isNumberIceLevelComplete(progress, 1)).toBe(true);
    expect(isNumberIceLevelComplete(progress, 2)).toBe(false);
  });

  it('locks worlds until the previous five are complete', () => {
    const progress = emptyNumberIceProgress();
    expect(isNumberIceWorldUnlocked(progress, 1)).toBe(true);
    expect(isNumberIceWorldUnlocked(progress, 2)).toBe(false);

    for (let level = 1; level <= 5; level++) saveNumberIceStars(level, 1);
    const afterWorldOne = loadNumberIceProgress();
    expect(isNumberIceWorldComplete(afterWorldOne, 1)).toBe(true);
    expect(numberIceWorldStars(afterWorldOne, 1)).toBe(5);
    expect(isNumberIceWorldUnlocked(afterWorldOne, 2)).toBe(true);
    expect(isNumberIceWorldUnlocked(afterWorldOne, 3)).toBe(false);

    for (let level = 6; level <= 10; level++) saveNumberIceStars(level, 1);
    expect(isNumberIceWorldUnlocked(loadNumberIceProgress(), 3)).toBe(true);
  });

  it('finds the first unfinished level and detects completion', () => {
    expect(nextNumberIceLevel(emptyNumberIceProgress())).toBe(1);
    for (let level = 1; level < 10; level++) saveNumberIceStars(level, 3);
    expect(nextNumberIceLevel(loadNumberIceProgress())).toBe(10);

    for (let level = 10; level <= 30; level++) saveNumberIceStars(level, 1);
    const complete = loadNumberIceProgress();
    expect(isNumberIceComplete(complete)).toBe(true);
    expect(nextNumberIceLevel(complete)).toBe(30);
  });

  it('degrades safely without localStorage', () => {
    delete globalThis.localStorage;
    expect(loadNumberIceProgress()).toEqual(emptyNumberIceProgress());
    expect(() => saveNumberIceStars(1, 3)).not.toThrow();
  });
});
