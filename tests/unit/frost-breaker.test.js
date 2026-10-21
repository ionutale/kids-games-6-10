import { describe, it, expect } from 'vitest';
import { allPodsUsed, passes, percentage, shownPct, starsFor } from '$lib/frost-breaker/rules.js';
import { buildCells } from '$lib/frost-breaker/grid.js';
import { LEVELS, getLevel, clampFrostLevel } from '$lib/frost-breaker/levels.js';
import { mergeStars } from '$lib/frost-breaker/progress.js';
import { MESSAGES, LOCALES } from '$lib/i18n/messages.js';

function largestComponentSize(built) {
  const seen = new Set();
  let largest = 0;
  for (const start of built.cells) {
    if (seen.has(start)) continue;
    const stack = [start];
    seen.add(start);
    let size = 0;
    while (stack.length) {
      const cell = stack.pop();
      size++;
      for (const [dc, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const rr = cell.row + dr;
        const cc = cell.col + dc;
        if (rr < 0 || rr >= built.rows || cc < 0 || cc >= built.cols) continue;
        const next = built.grid[rr][cc];
        if (next && next.alive && !seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

describe('90% / star rules', () => {
  it('uses 90, 95 and 100 as the three thresholds', () => {
    expect(starsFor(0, 100)).toBe(0);
    expect(starsFor(89, 100)).toBe(0);
    expect(starsFor(90, 100)).toBe(1);
    expect(starsFor(94, 100)).toBe(1);
    expect(starsFor(95, 100)).toBe(2);
    expect(starsFor(99, 100)).toBe(2);
    expect(starsFor(100, 100)).toBe(3);
  });

  it('never shows 100 before the last cell is gone', () => {
    expect(shownPct(0, 100)).toBe(0);
    expect(shownPct(89, 100)).toBe(89);
    expect(shownPct(99, 100)).toBe(99);
    expect(shownPct(100, 100)).toBe(100);
  });

  it('passes exactly at 90%', () => {
    expect(passes(89, 100)).toBe(false);
    expect(passes(90, 100)).toBe(true);
    expect(percentage(45, 90)).toBe(0.5);
  });

  it('knows when every pod is spent', () => {
    expect(allPodsUsed({ spike: 0, ghost: 0, copter: 0, split: 0 })).toBe(true);
    expect(allPodsUsed({ spike: 1, ghost: 0, copter: 0, split: 0 })).toBe(false);
  });
});

describe('fifty sculptures', () => {
  it('has fifty levels across twenty distinct shapes with all four pods available', () => {
    expect(LEVELS).toHaveLength(50);
    expect(new Set(LEVELS.map((l) => l.shape)).size).toBe(20);
    for (const level of LEVELS) {
      for (const pod of ['spike', 'ghost', 'copter', 'split']) {
        expect(level.pods[pod]).toBeGreaterThan(0);
      }
    }
  });

  it('fills every sculpture with ice cells and 1–3 cores', () => {
    for (const level of LEVELS) {
      const built = buildCells(level.shape);
      expect(built.total, level.shape).toBeGreaterThan(15);
      expect(built.cores.length, level.shape).toBeGreaterThanOrEqual(1);
      expect(built.cores.length, level.shape).toBeLessThanOrEqual(3);
      expect(built.cells.every((cell) => Number.isFinite(cell.x) && Number.isFinite(cell.y))).toBe(true);
    }
  });

  it('keeps almost every sculpture as one connected mass', () => {
    for (const level of LEVELS) {
      const built = buildCells(level.shape);
      expect(largestComponentSize(built) / built.total, level.shape).toBeGreaterThan(0.9);
    }
  });

  it('clamps out-of-range levels to the campaign', () => {
    expect(getLevel(1).shape).toBe('star');
    expect(getLevel(10).shape).toBe('fish');
    expect(getLevel(50).shape).toBe('crown');
    expect(getLevel(0).shape).toBe('star');
    expect(getLevel(99).shape).toBe('crown');
    expect(clampFrostLevel('5')).toBe(5);
    expect(clampFrostLevel('nope')).toBe(1);
  });
});

describe('six-locale message catalogs', () => {
  it('has every English key in every locale', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    for (const { id } of LOCALES) {
      expect(Object.keys(MESSAGES[id]).sort(), id).toEqual(keys);
    }
  });
});

describe('best-star persistence shape', () => {
  it('keeps the best result per level and never lowers it', () => {
    const first = mergeStars([], 3, 2);
    expect(first[2]).toBe(2);
    const better = mergeStars(first, 3, 3);
    expect(better[2]).toBe(3);
    const worse = mergeStars(better, 3, 1);
    expect(worse[2]).toBe(3);
    expect(worse).toHaveLength(50);
  });
});
