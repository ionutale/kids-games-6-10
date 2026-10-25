import { describe, it, expect } from 'vitest';
import {
  createRng,
  createBoard,
  sumSelection,
  findSelection,
  ensureSelection,
  dropAndRefill,
  starsForNumberIceMoves,
} from '$lib/number-ice/board.js';
import {
  NUMBER_ICE_WORLD_COUNT,
  NUMBER_ICE_LEVELS_PER_WORLD,
  NUMBER_ICE_LEVEL_COUNT,
  NUMBER_ICE_WORLDS,
  NUMBER_ICE_LEVELS,
  getNumberIceLevel,
  getNumberIceWorld,
  worldLevels,
} from '$lib/number-ice/levels.js';

const isIceValue = (value) => Number.isInteger(value) && value >= 1 && value <= 9;

/** Play a level the way a simple player would: find, melt, refill, repeat. */
function playLevel(level, moveBudget = level.moves) {
  const rng = createRng(level.seed);
  let board = createBoard(level.size, rng);
  let cleared = 0;
  let moves = 0;

  while (cleared < level.goal && moves < moveBudget) {
    let selection = findSelection(board, level.target);
    if (!selection) {
      board = ensureSelection(board, level.target, rng);
      selection = findSelection(board, level.target);
    }
    expect(selection).not.toBeNull();
    expect(selection.length).toBeGreaterThanOrEqual(2);
    expect(selection.length).toBeLessThanOrEqual(4);
    expect(sumSelection(board, selection)).toBe(level.target);

    cleared += selection.length;
    board = dropAndRefill(board, selection, level.size, rng);
    moves++;
  }

  return { cleared, moves, board };
}

describe('Number Ice PRNG and boards', () => {
  it('creates a deterministic generator that only emits floats in [0, 1)', () => {
    const a = createRng(1234);
    const b = createRng(1234);
    for (let i = 0; i < 50; i++) {
      const value = a();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(value).toBe(b());
    }
    expect(createRng(99)()).not.toBe(createRng(100)());
  });

  it('creates a size * size board of values 1-9 deterministically', () => {
    const first = createBoard(7, createRng(4242));
    const second = createBoard(7, createRng(4242));
    expect(first).toHaveLength(49);
    expect(first).toEqual(second);
    expect(first.every(isIceValue)).toBe(true);
    expect(createBoard(5, createRng(4243))).not.toEqual(first.slice(0, 25));
  });

  it('sums only the selected values', () => {
    expect(sumSelection([1, 2, 3, 4, 5], [0, 2, 4])).toBe(9);
    expect(sumSelection([1, 2, 3], [])).toBe(0);
    expect(sumSelection([1, 2, 3], [1, 1])).toBe(4);
  });
});

describe('Number Ice selections', () => {
  it('finds a 2-4 block selection that sums to the target', () => {
    const board = [4, 6, 1, 9, 2];
    for (const target of [10, 7, 13]) {
      const selection = findSelection(board, target);
      expect(selection).not.toBeNull();
      expect(new Set(selection).size).toBe(selection.length);
      expect(selection.length).toBeGreaterThanOrEqual(2);
      expect(selection.length).toBeLessThanOrEqual(4);
      expect(sumSelection(board, selection)).toBe(target);
    }
  });

  it('returns null when no 2-4 block sum exists', () => {
    expect(findSelection([9, 9, 9, 9], 10)).toBeNull();
    expect(findSelection([9, 9, 9, 9], 100)).toBeNull();
    expect(findSelection([], 10)).toBeNull();
  });

  it('leaves a board with a legal move untouched', () => {
    const board = [1, 2, 3, 4, 5];
    const rng = createRng(7);
    const next = ensureSelection(board, 7, rng);
    expect(next).toBe(board);
    expect(findSelection(next, 7)).not.toBeNull();
  });

  it('plants a legal move when none exists', () => {
    const board = new Array(25).fill(9);
    const target = 10;
    const before = board.slice();
    const next = ensureSelection(board, target, createRng(31));

    expect(next).not.toBe(board);
    expect(board).toEqual(before);
    expect(next).toHaveLength(board.length);
    expect(next.every(isIceValue)).toBe(true);

    const selection = findSelection(next, target);
    expect(selection).not.toBeNull();
    expect(sumSelection(next, selection)).toBe(target);

    const changed = next.filter((value, index) => value !== before[index]).length;
    expect(changed).toBeGreaterThanOrEqual(2);
    expect(changed).toBeLessThanOrEqual(4);
  });
});

describe('Number Ice dropping and refilling', () => {
  it('melts the selection, drops survivors and refills with 1-9 without mutating the input', () => {
    // 3x3 board: [1 2 3 / 4 5 6 / 7 8 9], melt 1 and 5.
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const before = board.slice();
    const next = dropAndRefill(board, [0, 4], 3, createRng(77));

    expect(next).not.toBe(board);
    expect(board).toEqual(before);
    expect(next).toHaveLength(9);
    expect(next.every(isIceValue)).toBe(true);

    // Column 0 keeps 7 then 4 at the bottom; column 1 drops 8 to the bottom.
    expect(next[6]).toBe(7);
    expect(next[3]).toBe(4);
    expect(next[7]).toBe(8);
    // Column 2 had nothing melted.
    expect(next[2]).toBe(3);
    expect(next[5]).toBe(6);
    expect(next[8]).toBe(9);
  });

  it('is deterministic for a given seed', () => {
    const board = [2, 4, 6, 8, 1, 3, 5, 7, 9];
    const first = dropAndRefill(board, [0, 8], 3, createRng(9));
    const second = dropAndRefill(board, [0, 8], 3, createRng(9));
    expect(first).toEqual(second);
  });

  it('refills a whole empty column from the top', () => {
    const board = [1, 2, 3, 4, 5, 6];
    const next = dropAndRefill(board, [0, 1], 2, createRng(11));
    expect(next).toHaveLength(6);
    expect(next.every(isIceValue)).toBe(true);
    expect([next[2], next[3], next[4], next[5]]).toEqual([3, 4, 5, 6]);
  });
});

describe('Number Ice stars', () => {
  it('awards three stars at par, two within par + 2, otherwise one', () => {
    expect(starsForNumberIceMoves(4, 4)).toBe(3);
    expect(starsForNumberIceMoves(3, 4)).toBe(3);
    expect(starsForNumberIceMoves(5, 4)).toBe(2);
    expect(starsForNumberIceMoves(6, 4)).toBe(2);
    expect(starsForNumberIceMoves(7, 4)).toBe(1);
    expect(starsForNumberIceMoves(12, 8)).toBe(1);
  });
});

describe('30-level campaign shape', () => {
  it('exposes six worlds of five levels', () => {
    expect(NUMBER_ICE_WORLD_COUNT).toBe(6);
    expect(NUMBER_ICE_LEVELS_PER_WORLD).toBe(5);
    expect(NUMBER_ICE_LEVEL_COUNT).toBe(30);
    expect(NUMBER_ICE_WORLDS).toHaveLength(6);
    expect(NUMBER_ICE_LEVELS).toHaveLength(30);
  });

  it('defines the six world identities in order', () => {
    const accents = ['#5eead4', '#bae6fd', '#f0abfc', '#fbbf24', '#86efac', '#c4b5fd'];
    NUMBER_ICE_WORLDS.forEach((world, index) => {
      expect(world.id).toBe(index + 1);
      expect(world.nameKey).toBe(`numberIceWorld${index + 1}`);
      expect(world.accent).toBe(accents[index]);
    });
  });

  it('has valid, uniquely seeded levels in campaign order', () => {
    const seeds = new Set();
    NUMBER_ICE_LEVELS.forEach((level, index) => {
      expect(level.id).toBe(index + 1);
      expect(level.world).toBe(Math.floor(index / NUMBER_ICE_LEVELS_PER_WORLD) + 1);
      expect(level.slot).toBe((index % NUMBER_ICE_LEVELS_PER_WORLD) + 1);
      expect(level.size).toBeGreaterThanOrEqual(5);
      expect(level.size).toBeLessThanOrEqual(7);
      expect(level.target).toBeGreaterThanOrEqual(10);
      expect(level.target).toBeLessThanOrEqual(20);
      expect(level.goal).toBeGreaterThanOrEqual(12);
      expect(level.goal).toBeLessThanOrEqual(32);
      expect(level.par).toBeGreaterThanOrEqual(4);
      expect(level.par).toBeLessThanOrEqual(9);
      expect(level.moves).toBe(level.par + 4);
      expect(Number.isInteger(level.seed)).toBe(true);
      expect(level.seed).toBeGreaterThan(0);
      expect(seeds.has(level.seed)).toBe(false);
      seeds.add(level.seed);
    });
    expect(seeds.size).toBe(30);
  });

  it('gets harder across worlds in size, target and goal', () => {
    const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const worlds = NUMBER_ICE_WORLDS.map((world) => worldLevels(world.id));
    const sizes = worlds.map((levels) => average(levels.map((level) => level.size)));
    const targets = worlds.map((levels) => average(levels.map((level) => level.target)));
    const goals = worlds.map((levels) => average(levels.map((level) => level.goal)));

    for (let i = 1; i < worlds.length; i++) {
      expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
      expect(targets[i]).toBeGreaterThan(targets[i - 1]);
      expect(goals[i]).toBeGreaterThan(goals[i - 1]);
      const previous = worlds[i - 1];
      const current = worlds[i];
      for (const level of current) {
        expect(level.goal).toBeGreaterThanOrEqual(previous[0].goal);
        expect(level.target).toBeGreaterThanOrEqual(previous[0].target);
        expect(level.size).toBeGreaterThanOrEqual(previous[0].size);
      }
    }

    for (const levels of worlds) {
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].goal).toBeGreaterThanOrEqual(levels[i - 1].goal);
        expect(levels[i].target).toBeGreaterThanOrEqual(levels[i - 1].target);
      }
    }
  });

  it('starts every level with a deterministic board that has a legal move', () => {
    for (const level of NUMBER_ICE_LEVELS) {
      const first = createBoard(level.size, createRng(level.seed));
      const second = createBoard(level.size, createRng(level.seed));
      expect(first).toEqual(second);
      expect(first).toHaveLength(level.size * level.size);
      expect(first.every(isIceValue)).toBe(true);
      expect(findSelection(first, level.target)).not.toBeNull();
    }
  });
});

describe('every Number Ice level is completable', () => {
  it('reaches its goal within the move budget with a greedy solver', () => {
    for (const level of NUMBER_ICE_LEVELS) {
      const result = playLevel(level);
      expect(
        result.cleared,
        `level ${level.id} cleared ${result.cleared}/${level.goal}`,
      ).toBeGreaterThanOrEqual(level.goal);
      expect(result.moves, `level ${level.id} used ${result.moves}/${level.moves} moves`).toBeLessThanOrEqual(
        level.moves,
      );
      expect(result.moves).toBeGreaterThan(0);
    }
  });

  it('can finish within par, so three stars is reachable', () => {
    for (const level of NUMBER_ICE_LEVELS) {
      const result = playLevel(level, level.par);
      expect(
        result.cleared,
        `level ${level.id} cleared ${result.cleared}/${level.goal} within par ${level.par}`,
      ).toBeGreaterThanOrEqual(level.goal);
      expect(result.moves).toBeLessThanOrEqual(level.par);
    }
  });

  it('keeps par inside the move budget and leaves four spare moves', () => {
    for (const level of NUMBER_ICE_LEVELS) {
      expect(level.par).toBeLessThanOrEqual(level.moves - 4);
      expect(level.moves - level.par).toBe(4);
    }
  });
});

describe('Number Ice level helpers', () => {
  it('gets levels by number and clamps out-of-range values', () => {
    expect(getNumberIceLevel(1)).toBe(NUMBER_ICE_LEVELS[0]);
    expect(getNumberIceLevel(30)).toBe(NUMBER_ICE_LEVELS[29]);
    expect(getNumberIceLevel(0)).toBe(NUMBER_ICE_LEVELS[0]);
    expect(getNumberIceLevel(999)).toBe(NUMBER_ICE_LEVELS[29]);
    expect(getNumberIceLevel(undefined)).toBe(NUMBER_ICE_LEVELS[0]);
    expect(getNumberIceLevel('12')).toBe(NUMBER_ICE_LEVELS[11]);
  });

  it('gets worlds by number and clamps out-of-range values', () => {
    expect(getNumberIceWorld(1)).toBe(NUMBER_ICE_WORLDS[0]);
    expect(getNumberIceWorld(6)).toBe(NUMBER_ICE_WORLDS[5]);
    expect(getNumberIceWorld(-3)).toBe(NUMBER_ICE_WORLDS[0]);
    expect(getNumberIceWorld(99)).toBe(NUMBER_ICE_WORLDS[5]);
  });

  it('lists the five levels of a world', () => {
    for (let world = 1; world <= NUMBER_ICE_WORLD_COUNT; world++) {
      const levels = worldLevels(world);
      expect(levels).toHaveLength(5);
      expect(levels.every((level) => level.world === world)).toBe(true);
      expect(levels.map((level) => level.slot)).toEqual([1, 2, 3, 4, 5]);
    }
    expect(worldLevels(0)).toEqual(worldLevels(1));
    expect(worldLevels(99)).toEqual(worldLevels(6));
  });
});
