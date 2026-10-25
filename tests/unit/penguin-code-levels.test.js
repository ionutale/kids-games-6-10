import { describe, expect, it } from 'vitest';
import { COMMANDS, simulateProgram, solveLevel, starsForPenguinCommands } from '$lib/penguin-code/rules.js';
import {
  PENGUIN_LEVELS,
  PENGUIN_LEVEL_COUNT,
  PENGUIN_LEVELS_PER_WORLD,
  PENGUIN_WORLDS,
  PENGUIN_WORLD_COUNT,
  getPenguinLevel,
  getPenguinWorld,
  worldLevels,
} from '$lib/penguin-code/levels.js';

const WORLD_RULES = [
  { par: [3, 6], fish: [1, 2], walls: [0, 2], holes: [0, 0] },
  { par: [6, 8], fish: [2, 2], walls: [2, 3], holes: [0, 0] },
  { par: [8, 10], fish: [2, 3], walls: [2, 4], holes: [0, 1] },
  { par: [10, 12], fish: [3, 3], walls: [3, 4], holes: [1, 2] },
  { par: [12, 15], fish: [3, 4], walls: [3, 5], holes: [1, 3] },
  { par: [14, 18], fish: [4, 4], walls: [4, 6], holes: [2, 3] },
];

function key(cell) {
  return `${cell.r}-${cell.c}`;
}

describe('penguin level data', () => {
  it('has six worlds of five levels with sequential ids', () => {
    expect(PENGUIN_WORLD_COUNT).toBe(6);
    expect(PENGUIN_LEVELS_PER_WORLD).toBe(5);
    expect(PENGUIN_LEVEL_COUNT).toBe(30);
    expect(PENGUIN_WORLDS).toHaveLength(6);
    expect(PENGUIN_LEVELS).toHaveLength(PENGUIN_LEVEL_COUNT);

    PENGUIN_LEVELS.forEach((level, index) => {
      expect(level.id).toBe(index + 1);
      expect(level.world).toBe(Math.floor(index / PENGUIN_LEVELS_PER_WORLD) + 1);
      expect(level.slot).toBe((index % PENGUIN_LEVELS_PER_WORLD) + 1);
      expect(level.size).toBe(7);
    });
  });

  it('uses the expected world names and accents', () => {
    const accents = ['#5eead4', '#bae6fd', '#f0abfc', '#fbbf24', '#86efac', '#c4b5fd'];
    PENGUIN_WORLDS.forEach((world, index) => {
      expect(world.id).toBe(index + 1);
      expect(world.nameKey).toBe(`penguinCodeWorld${index + 1}`);
      expect(world.accent).toBe(accents[index]);
    });
  });

  it('keeps every cell inside the board and places each thing once', () => {
    for (const level of PENGUIN_LEVELS) {
      const fish = new Set(level.fish);
      const walls = new Set(level.walls);
      const holes = new Set(level.holes);
      const start = key(level.start);
      const goal = key(level.goal);
      const all = [start, goal, ...level.fish, ...level.walls, ...level.holes];

      expect(new Set(all).size).toBe(all.length);
      expect(fish.size).toBe(level.fish.length);
      expect(walls.size).toBe(level.walls.length);
      expect(holes.size).toBe(level.holes.length);
      expect(fish.has(start)).toBe(false);
      expect(fish.has(goal)).toBe(false);
      expect(walls.has(start)).toBe(false);
      expect(walls.has(goal)).toBe(false);
      expect(holes.has(start)).toBe(false);
      expect(holes.has(goal)).toBe(false);

      for (const cell of all) {
        const [r, c] = cell.split('-').map(Number);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(level.size);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(level.size);
      }
    }
  });

  it('matches the content budget of each world', () => {
    for (const level of PENGUIN_LEVELS) {
      const rules = WORLD_RULES[level.world - 1];
      expect(level.fish.length).toBeGreaterThanOrEqual(rules.fish[0]);
      expect(level.fish.length).toBeLessThanOrEqual(rules.fish[1]);
      expect(level.walls.length).toBeGreaterThanOrEqual(rules.walls[0]);
      expect(level.walls.length).toBeLessThanOrEqual(rules.walls[1]);
      expect(level.holes.length).toBeGreaterThanOrEqual(rules.holes[0]);
      expect(level.holes.length).toBeLessThanOrEqual(rules.holes[1]);
      expect(level.par).toBeGreaterThanOrEqual(rules.par[0]);
      expect(level.par).toBeLessThanOrEqual(rules.par[1]);
    }
  });

  it('starts every level unsolved', () => {
    for (const level of PENGUIN_LEVELS) {
      expect(key(level.start)).not.toBe(key(level.goal));
      expect(level.fish.length).toBeGreaterThan(0);
      expect(simulateProgram(level, []).status).toBe('incomplete');
    }
  });

  it('is solvable at exactly its par with four spare commands', () => {
    for (const level of PENGUIN_LEVELS) {
      const solved = solveLevel(level);
      expect(solved.solvable).toBe(true);
      expect(solved.par).toBe(level.par);
      expect(level.maxCommands).toBe(level.par + 4);
    }
  });
});

describe('penguin simulation', () => {
  it('walks one cell per command and collects fish in order', () => {
    const level = PENGUIN_LEVELS[0];
    const run = simulateProgram(level, ['D', 'D', 'R']);

    expect(run.status).toBe('incomplete');
    expect(run.reason).toBe(null);
    expect(run.collected).toEqual(['4-6']);
    expect(run.path).toEqual([
      { r: 2, c: 5 },
      { r: 3, c: 5 },
      { r: 4, c: 5 },
      { r: 4, c: 6 },
    ]);
  });

  it('lets walls block movement without ending the program', () => {
    const level = {
      size: 3,
      start: { r: 0, c: 0 },
      goal: { r: 2, c: 2 },
      fish: ['0-2'],
      walls: ['0-1'],
      holes: [],
    };
    const run = simulateProgram(level, ['R', 'D', 'U']);

    expect(run.status).toBe('incomplete');
    expect(run.path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: 0 },
    ]);
  });

  it('fails with a splash when stepping into a hole', () => {
    const level = {
      size: 3,
      start: { r: 0, c: 0 },
      goal: { r: 2, c: 2 },
      fish: ['0-2'],
      walls: [],
      holes: ['0-1'],
    };
    const run = simulateProgram(level, ['R']);

    expect(run.status).toBe('fail');
    expect(run.reason).toBe('splash');
    expect(run.path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
    ]);
    expect(run.collected).toEqual([]);
  });

  it('fails with out when a command leaves the board', () => {
    const level = {
      size: 3,
      start: { r: 0, c: 0 },
      goal: { r: 2, c: 2 },
      fish: ['2-2'],
      walls: [],
      holes: [],
    };
    const run = simulateProgram(level, ['U']);

    expect(run.status).toBe('fail');
    expect(run.reason).toBe('out');
    expect(run.path).toEqual([{ r: 0, c: 0 }]);
  });

  it('does not win on the goal until every fish is collected', () => {
    const level = {
      size: 3,
      start: { r: 1, c: 1 },
      goal: { r: 1, c: 2 },
      fish: ['0-1'],
      walls: [],
      holes: [],
    };
    const early = simulateProgram(level, ['R']);
    expect(early.status).toBe('incomplete');
    expect(early.collected).toEqual([]);

    const win = simulateProgram(level, ['U', 'R', 'D']);
    expect(win.status).toBe('win');
    expect(win.reason).toBe(null);
    expect(win.collected).toEqual(['0-1']);
    expect(win.path).toEqual([
      { r: 1, c: 1 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 1, c: 2 },
    ]);
  });

  it('wins level 1 with its shortest program', () => {
    const level = PENGUIN_LEVELS[0];
    const shortest = ['D', 'D', 'R', 'D'];
    const run = simulateProgram(level, shortest);

    expect(run.status).toBe('win');
    expect(run.reason).toBe(null);
    expect(run.path.at(-1)).toEqual(level.goal);
    expect(run.collected).toHaveLength(1);
    expect(run.collected).toEqual(['4-6']);
    expect(solveLevel(level)).toEqual({ solvable: true, par: 4 });
    expect(shortest).toHaveLength(solveLevel(level).par);
    expect(level.maxCommands).toBe(level.par + 4);
    expect(COMMANDS).toContain('U');
    expect(COMMANDS).toContain('D');
    expect(COMMANDS).toContain('L');
    expect(COMMANDS).toContain('R');
  });

  it('ends incomplete when the program runs out before the goal', () => {
    const run = simulateProgram(PENGUIN_LEVELS[0], ['D', 'D', 'R']);
    expect(run.status).toBe('incomplete');
    expect(run.reason).toBe(null);
    expect(run.collected).toEqual(['4-6']);
  });
});

describe('penguin scoring', () => {
  it('awards three stars at or under par', () => {
    expect(starsForPenguinCommands(8, 10)).toBe(3);
    expect(starsForPenguinCommands(10, 10)).toBe(3);
    expect(starsForPenguinCommands(['U', 'D'], 2)).toBe(3);
  });

  it('awards two stars up to two commands over par', () => {
    expect(starsForPenguinCommands(11, 10)).toBe(2);
    expect(starsForPenguinCommands(12, 10)).toBe(2);
  });

  it('awards one star above that', () => {
    expect(starsForPenguinCommands(13, 10)).toBe(1);
    expect(starsForPenguinCommands(40, 10)).toBe(1);
  });
});

describe('penguin level helpers', () => {
  it('clamps level lookups to 1..30', () => {
    expect(getPenguinLevel(0)).toBe(PENGUIN_LEVELS[0]);
    expect(getPenguinLevel(1)).toBe(PENGUIN_LEVELS[0]);
    expect(getPenguinLevel(15)).toBe(PENGUIN_LEVELS[14]);
    expect(getPenguinLevel(30)).toBe(PENGUIN_LEVELS[29]);
    expect(getPenguinLevel(31)).toBe(PENGUIN_LEVELS[29]);
    expect(getPenguinLevel('nope')).toBe(PENGUIN_LEVELS[0]);
  });

  it('clamps world lookups to 1..6', () => {
    expect(getPenguinWorld(0)).toBe(PENGUIN_WORLDS[0]);
    expect(getPenguinWorld(3)).toBe(PENGUIN_WORLDS[2]);
    expect(getPenguinWorld(6)).toBe(PENGUIN_WORLDS[5]);
    expect(getPenguinWorld(99)).toBe(PENGUIN_WORLDS[5]);
  });

  it('returns exactly the five levels of a world', () => {
    for (let world = 1; world <= PENGUIN_WORLD_COUNT; world++) {
      const levels = worldLevels(world);
      expect(levels).toHaveLength(5);
      expect(levels.map((level) => level.id)).toEqual([
        (world - 1) * 5 + 1,
        (world - 1) * 5 + 2,
        (world - 1) * 5 + 3,
        (world - 1) * 5 + 4,
        (world - 1) * 5 + 5,
      ]);
      expect(levels.every((level) => level.world === world)).toBe(true);
      expect(levels.every((level) => level.slot === levels.indexOf(level) + 1)).toBe(true);
    }
    expect(worldLevels(0)[0].world).toBe(1);
    expect(worldLevels(7)[0].world).toBe(6);
  });
});
