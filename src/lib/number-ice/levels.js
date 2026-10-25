/** Number Ice: six worlds, five levels each. */
export const NUMBER_ICE_WORLD_COUNT = 6;
export const NUMBER_ICE_LEVELS_PER_WORLD = 5;
export const NUMBER_ICE_LEVEL_COUNT = NUMBER_ICE_WORLD_COUNT * NUMBER_ICE_LEVELS_PER_WORLD;

export const NUMBER_ICE_WORLDS = [
  { id: 1, nameKey: 'numberIceWorld1', accent: '#5eead4' },
  { id: 2, nameKey: 'numberIceWorld2', accent: '#bae6fd' },
  { id: 3, nameKey: 'numberIceWorld3', accent: '#f0abfc' },
  { id: 4, nameKey: 'numberIceWorld4', accent: '#fbbf24' },
  { id: 5, nameKey: 'numberIceWorld5', accent: '#86efac' },
  { id: 6, nameKey: 'numberIceWorld6', accent: '#c4b5fd' },
];

/**
 * Every level is deterministic: `seed` reproduces the exact starting board.
 * `par` was tuned against a greedy `findSelection` solver (it clears the goal
 * in par moves or fewer), and `moves` always leaves four extra selections.
 */
export const NUMBER_ICE_LEVELS = [
  { id: 1, world: 1, slot: 1, size: 5, target: 10, goal: 12, moves: 8, par: 4, seed: 100035 },
  { id: 2, world: 1, slot: 2, size: 5, target: 10, goal: 13, moves: 8, par: 4, seed: 200039 },
  { id: 3, world: 1, slot: 3, size: 5, target: 11, goal: 14, moves: 8, par: 4, seed: 300043 },
  { id: 4, world: 1, slot: 4, size: 5, target: 11, goal: 15, moves: 9, par: 5, seed: 400047 },
  { id: 5, world: 1, slot: 5, size: 5, target: 12, goal: 16, moves: 9, par: 5, seed: 500051 },
  { id: 6, world: 2, slot: 1, size: 5, target: 11, goal: 16, moves: 9, par: 5, seed: 600081 },
  { id: 7, world: 2, slot: 2, size: 5, target: 12, goal: 17, moves: 9, par: 5, seed: 700085 },
  { id: 8, world: 2, slot: 3, size: 5, target: 12, goal: 18, moves: 9, par: 5, seed: 800089 },
  { id: 9, world: 2, slot: 4, size: 5, target: 13, goal: 18, moves: 9, par: 5, seed: 900093 },
  { id: 10, world: 2, slot: 5, size: 5, target: 13, goal: 20, moves: 10, par: 6, seed: 1000097 },
  { id: 11, world: 3, slot: 1, size: 6, target: 13, goal: 20, moves: 9, par: 5, seed: 1100127 },
  { id: 12, world: 3, slot: 2, size: 6, target: 14, goal: 21, moves: 10, par: 6, seed: 1200131 },
  { id: 13, world: 3, slot: 3, size: 6, target: 14, goal: 22, moves: 10, par: 6, seed: 1300135 },
  { id: 14, world: 3, slot: 4, size: 6, target: 15, goal: 22, moves: 10, par: 6, seed: 1400139 },
  { id: 15, world: 3, slot: 5, size: 6, target: 15, goal: 24, moves: 10, par: 6, seed: 1500143 },
  { id: 16, world: 4, slot: 1, size: 6, target: 15, goal: 24, moves: 10, par: 6, seed: 1600173 },
  { id: 17, world: 4, slot: 2, size: 6, target: 16, goal: 25, moves: 11, par: 7, seed: 1700177 },
  { id: 18, world: 4, slot: 3, size: 6, target: 16, goal: 26, moves: 11, par: 7, seed: 1800181 },
  { id: 19, world: 4, slot: 4, size: 6, target: 17, goal: 26, moves: 11, par: 7, seed: 1900185 },
  { id: 20, world: 4, slot: 5, size: 6, target: 17, goal: 28, moves: 11, par: 7, seed: 2000189 },
  { id: 21, world: 5, slot: 1, size: 7, target: 17, goal: 26, moves: 11, par: 7, seed: 2100219 },
  { id: 22, world: 5, slot: 2, size: 7, target: 18, goal: 27, moves: 11, par: 7, seed: 2200223 },
  { id: 23, world: 5, slot: 3, size: 7, target: 18, goal: 28, moves: 11, par: 7, seed: 2300227 },
  { id: 24, world: 5, slot: 4, size: 7, target: 19, goal: 30, moves: 12, par: 8, seed: 2400231 },
  { id: 25, world: 5, slot: 5, size: 7, target: 19, goal: 30, moves: 12, par: 8, seed: 2500235 },
  { id: 26, world: 6, slot: 1, size: 7, target: 18, goal: 30, moves: 12, par: 8, seed: 2600265 },
  { id: 27, world: 6, slot: 2, size: 7, target: 19, goal: 30, moves: 12, par: 8, seed: 2700269 },
  { id: 28, world: 6, slot: 3, size: 7, target: 19, goal: 32, moves: 12, par: 8, seed: 2800273 },
  { id: 29, world: 6, slot: 4, size: 7, target: 20, goal: 32, moves: 12, par: 8, seed: 2900277 },
  { id: 30, world: 6, slot: 5, size: 7, target: 20, goal: 32, moves: 12, par: 8, seed: 3000281 },
];

export function getNumberIceLevel(level) {
  const index = Math.max(0, Math.min(NUMBER_ICE_LEVEL_COUNT - 1, Number(level) - 1 || 0));
  return NUMBER_ICE_LEVELS[index];
}

export function getNumberIceWorld(world) {
  const index = Math.max(0, Math.min(NUMBER_ICE_WORLD_COUNT - 1, Number(world) - 1 || 0));
  return NUMBER_ICE_WORLDS[index];
}

export function worldLevels(world) {
  const { id } = getNumberIceWorld(world);
  return NUMBER_ICE_LEVELS.filter((level) => level.world === id);
}
