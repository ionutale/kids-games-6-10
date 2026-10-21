import { describe, it, expect } from 'vitest';
import {
  WORLD_COUNT,
  LEVELS_PER_WORLD,
  MAX_FROST_LEVEL,
  WORLDS,
  LEVELS,
  clampFrostLevel,
  getLevel,
  getWorld,
  levelToWorld,
  worldLevels,
  podsFor,
} from '$lib/frost-breaker/levels.js';
import { SHAPES } from '$lib/frost-breaker/shapes.js';
import { buildCells } from '$lib/frost-breaker/grid.js';
import { WALLS } from '$lib/frost-breaker/walls.js';

const WORLD_SHAPES = [
  ['star', 'fairy'],
  ['fish', 'mermaid'],
  ['cat', 'unicorn'],
  ['rocket', 'robot'],
  ['castle', 'dragon'],
  ['snowman', 'yeti'],
  ['dinosaur', 'mammoth'],
  ['butterfly', 'phoenix'],
  ['lighthouse', 'kraken'],
  ['crown', 'genie'],
];

const CORE_COUNTS = [
  [1, 1, 2, 2, 3],
  [1, 1, 2, 2, 3],
  [1, 2, 2, 3, 3],
  [1, 2, 2, 3, 3],
  [2, 2, 3, 3, 3],
  [2, 2, 3, 3, 3],
  [2, 3, 3, 3, 3],
  [2, 3, 3, 3, 3],
  [2, 3, 3, 3, 3],
  [2, 3, 3, 3, 3],
];

const POD_TOTALS = [
  [5, 5, 6, 6, 7],
  [6, 6, 7, 7, 8],
  [7, 7, 8, 8, 9],
  [8, 8, 9, 9, 10],
  [9, 9, 10, 10, 11],
  [10, 10, 11, 11, 12],
  [10, 11, 11, 12, 12],
  [11, 11, 12, 12, 13],
  [12, 12, 13, 13, 14],
  [12, 13, 13, 14, 14],
];

const POD_TABLE = {
  5: { spike: 2, ghost: 1, copter: 1, split: 1 },
  6: { spike: 3, ghost: 1, copter: 1, split: 1 },
  7: { spike: 3, ghost: 1, copter: 1, split: 2 },
  8: { spike: 3, ghost: 2, copter: 1, split: 2 },
  9: { spike: 4, ghost: 2, copter: 1, split: 2 },
  10: { spike: 4, ghost: 2, copter: 2, split: 2 },
  11: { spike: 4, ghost: 2, copter: 2, split: 3 },
  12: { spike: 5, ghost: 3, copter: 2, split: 2 },
  13: { spike: 5, ghost: 3, copter: 2, split: 3 },
  14: { spike: 5, ghost: 3, copter: 3, split: 3 },
};

const SCALES = [1, 1, 0.96, 1.03, 1.05];
const POD_IDS = ['spike', 'ghost', 'copter', 'split'];
const totalPods = (pods) => POD_IDS.reduce((sum, id) => sum + pods[id], 0);

describe('50-level campaign shape', () => {
  it('has ten worlds of five levels and fifty flat levels', () => {
    expect(WORLD_COUNT).toBe(10);
    expect(LEVELS_PER_WORLD).toBe(5);
    expect(MAX_FROST_LEVEL).toBe(50);
    expect(WORLDS).toHaveLength(10);
    expect(LEVELS).toHaveLength(50);
    for (const world of WORLDS) {
      expect(world.levels).toHaveLength(5);
      expect(worldLevels(world.id)).toBe(world.levels);
    }
    expect(LEVELS.map((level) => level.level)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  it('numbers worlds 1–10 and uses anchor/creature/anchor/creature/anchor', () => {
    expect(WORLDS.map((world) => world.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const [index, world] of WORLDS.entries()) {
      const [anchor, creature] = WORLD_SHAPES[index];
      expect(world.shapes).toEqual([anchor, creature]);
      expect(world.nameKey).toBe(`world${world.id}`);
      expect(world.levels.map((level) => level.slot)).toEqual([1, 2, 3, 4, 5]);
      expect(world.levels.map((level) => level.shape)).toEqual([anchor, creature, anchor, creature, anchor]);
      expect(world.levels.every((level) => level.world === world.id)).toBe(true);
      expect(world.levels.every((level) => level.accent === world.accent)).toBe(true);
      expect(world.levels.every((level) => level.loop === world.loop)).toBe(true);
      expect(world.levels.every((level) => level.nameKey === world.nameKey)).toBe(true);
    }
  });

  it('uses all twenty authored shapes exactly across the campaign', () => {
    const expected = WORLD_SHAPES.flat();
    expect(Object.keys(SHAPES).sort()).toEqual([...expected].sort());
    expect(new Set(LEVELS.map((level) => level.shape)).size).toBe(20);
    expect([...new Set(LEVELS.map((level) => level.shape))].sort()).toEqual([...expected].sort());
  });
});

describe('level recipes', () => {
  it('gives every level all four pods and the exact total', () => {
    for (const world of WORLDS) {
      for (const [slot, level] of world.levels.entries()) {
        for (const pod of POD_IDS) expect(level.pods[pod], `${level.level}:${pod}`).toBeGreaterThan(0);
        expect(totalPods(level.pods), level.level).toBe(POD_TOTALS[world.id - 1][slot]);
      }
    }
  });

  it('splits every supported total into the authored pod table', () => {
    for (const [total, expected] of Object.entries(POD_TABLE)) {
      expect(podsFor(Number(total))).toEqual(expected);
    }
  });

  it('matches authored core counts and scales', () => {
    for (const world of WORLDS) {
      for (const [slot, level] of world.levels.entries()) {
        expect(level.coreCount, level.level).toBe(CORE_COUNTS[world.id - 1][slot]);
        expect(SCALES).toContain(level.scale);
        expect(level.scale, level.level).toBe(SCALES[slot]);
      }
    }
  });

  it('keeps zero to two bumpers inside the rails and below the sculpture grid', () => {
    for (const level of LEVELS) {
      expect(level.bumpers.length).toBeGreaterThanOrEqual(0);
      expect(level.bumpers.length).toBeLessThanOrEqual(2);
      for (const bumper of level.bumpers) {
        expect(bumper.x, level.level).toBeGreaterThanOrEqual(WALLS.left);
        expect(bumper.x + bumper.w, level.level).toBeLessThanOrEqual(WALLS.right);
        expect(bumper.y, level.level).toBeGreaterThanOrEqual(780);
        expect(bumper.w, level.level).toBeGreaterThan(0);
        expect(bumper.h, level.level).toBeGreaterThan(0);
      }
    }
  });
});

describe('level lookups', () => {
  it('clamps levels to 1–50', () => {
    expect(clampFrostLevel(0)).toBe(1);
    expect(clampFrostLevel(1)).toBe(1);
    expect(clampFrostLevel(50)).toBe(50);
    expect(clampFrostLevel(99)).toBe(50);
    expect(clampFrostLevel('7')).toBe(7);
    expect(clampFrostLevel('nope')).toBe(1);

    expect(getLevel(0).level).toBe(1);
    expect(getLevel(99).level).toBe(50);
    expect(getLevel(99).shape).toBe('crown');
  });

  it('maps levels to worlds and back', () => {
    expect(levelToWorld(1)).toBe(1);
    expect(levelToWorld(5)).toBe(1);
    expect(levelToWorld(6)).toBe(2);
    expect(levelToWorld(50)).toBe(10);
    expect(getWorld(1).id).toBe(1);
    expect(getWorld(50).id).toBe(10);
    expect(getWorld(0).id).toBe(1);
  });
});

describe('campaign ice grids', () => {
  it('builds more than fifteen cells and exactly coreCount cores for all fifty levels', () => {
    for (const level of LEVELS) {
      const built = buildCells(level.shape, { scale: level.scale, coreCount: level.coreCount });
      expect(built.total, `level ${level.level} ${level.shape}`).toBeGreaterThan(15);
      expect(built.cores.length, `level ${level.level} ${level.shape}`).toBe(level.coreCount);
      expect(built.cells.every((cell) => Number.isFinite(cell.x) && Number.isFinite(cell.y))).toBe(true);
    }
  });
});
