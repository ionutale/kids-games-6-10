/**
 * Frost Breaker campaign: ten worlds of five levels each. Worlds open in
 * order, but every level inside an open world is free to pick.
 */
export const WORLD_COUNT = 10;
export const LEVELS_PER_WORLD = 5;
export const MAX_FROST_LEVEL = WORLD_COUNT * LEVELS_PER_WORLD;

const SCALES = [1, 1, 0.96, 1.03, 1.05];

const WORLD_BLUEPRINTS = [
  {
    id: 1,
    nameKey: 'world1',
    accent: '#5eead4',
    loop: 'garden',
    shapes: ['star', 'fairy'],
  },
  {
    id: 2,
    nameKey: 'world2',
    accent: '#fb7185',
    loop: 'garden',
    shapes: ['fish', 'mermaid'],
  },
  {
    id: 3,
    nameKey: 'world3',
    accent: '#86efac',
    loop: 'garden',
    shapes: ['cat', 'unicorn'],
  },
  {
    id: 4,
    nameKey: 'world4',
    accent: '#67e8f9',
    loop: 'frost',
    shapes: ['rocket', 'robot'],
  },
  {
    id: 5,
    nameKey: 'world5',
    accent: '#fbbf24',
    loop: 'frost',
    shapes: ['castle', 'dragon'],
  },
  {
    id: 6,
    nameKey: 'world6',
    accent: '#bae6fd',
    loop: 'frost',
    shapes: ['snowman', 'yeti'],
  },
  {
    id: 7,
    nameKey: 'world7',
    accent: '#bef264',
    loop: 'royal',
    shapes: ['dinosaur', 'mammoth'],
  },
  {
    id: 8,
    nameKey: 'world8',
    accent: '#fb923c',
    loop: 'royal',
    shapes: ['butterfly', 'phoenix'],
  },
  {
    id: 9,
    nameKey: 'world9',
    accent: '#818cf8',
    loop: 'royal',
    shapes: ['lighthouse', 'kraken'],
  },
  {
    id: 10,
    nameKey: 'world10',
    accent: '#facc15',
    loop: 'royal',
    shapes: ['crown', 'genie'],
  },
];

/** Active core count for slots 1–5, one row per world. */
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

/** Total ammunition for slots 1–5, one row per world. */
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

/** Two-bumper kit per world; each level picks 0, 1, or 2 of them. */
const BUMPER_KITS = [
  [
    { x: 150, y: 820, w: 80, h: 80 },
    { x: 490, y: 820, w: 80, h: 80 },
  ],
  [
    { x: 120, y: 800, w: 100, h: 60 },
    { x: 500, y: 800, w: 100, h: 60 },
  ],
  [
    { x: 130, y: 800, w: 60, h: 100 },
    { x: 530, y: 800, w: 60, h: 100 },
  ],
  [
    { x: 120, y: 850, w: 120, h: 50 },
    { x: 480, y: 850, w: 120, h: 50 },
  ],
  [
    { x: 160, y: 800, w: 70, h: 100 },
    { x: 490, y: 800, w: 70, h: 100 },
  ],
  [
    { x: 140, y: 810, w: 90, h: 70 },
    { x: 490, y: 810, w: 90, h: 70 },
  ],
  [
    { x: 200, y: 840, w: 80, h: 80 },
    { x: 440, y: 840, w: 80, h: 80 },
  ],
  [
    { x: 140, y: 800, w: 70, h: 100 },
    { x: 510, y: 800, w: 70, h: 100 },
  ],
  [
    { x: 90, y: 800, w: 50, h: 130 },
    { x: 580, y: 800, w: 50, h: 130 },
  ],
  [
    { x: 180, y: 820, w: 60, h: 100 },
    { x: 480, y: 820, w: 60, h: 100 },
  ],
];

/** Kit indexes used by slots 1–5, one row per world. */
const BUMPER_PATTERNS = [
  [[], [], [0], [1], [0, 1]],
  [[], [0], [1], [0, 1], [0, 1]],
  [[0], [1], [0, 1], [0, 1], [0, 1]],
  [[0], [1], [0, 1], [0, 1], [0, 1]],
  [[], [0], [1], [0, 1], [0, 1]],
  [[0], [1], [0, 1], [0, 1], [0, 1]],
  [[], [0], [1], [0, 1], [0, 1]],
  [[0], [1], [0, 1], [0, 1], [0, 1]],
  [[0], [0, 1], [0, 1], [0, 1], [0, 1]],
  [
    [0, 1],
    [0, 1],
    [0, 1],
    [0, 1],
    [0, 1],
  ],
];

export function podsFor(total) {
  const key = Math.max(5, Math.min(14, Math.round(Number(total) || 5)));
  return { ...POD_TABLE[key] };
}

function buildLevel(blueprint, worldIndex, slot) {
  const kit = BUMPER_KITS[worldIndex];
  const bumperIndexes = BUMPER_PATTERNS[worldIndex][slot - 1];
  return {
    level: (blueprint.id - 1) * LEVELS_PER_WORLD + slot,
    world: blueprint.id,
    slot,
    shape: blueprint.shapes[(slot - 1) % blueprint.shapes.length],
    scale: SCALES[slot - 1],
    coreCount: CORE_COUNTS[worldIndex][slot - 1],
    pods: podsFor(POD_TOTALS[worldIndex][slot - 1]),
    bumpers: bumperIndexes.map((index) => ({ ...kit[index] })),
    accent: blueprint.accent,
    loop: blueprint.loop,
    nameKey: blueprint.nameKey,
  };
}

export const WORLDS = WORLD_BLUEPRINTS.map((blueprint, worldIndex) => {
  const levels = Array.from({ length: LEVELS_PER_WORLD }, (_, index) =>
    buildLevel(blueprint, worldIndex, index + 1),
  );
  return {
    id: blueprint.id,
    nameKey: blueprint.nameKey,
    accent: blueprint.accent,
    loop: blueprint.loop,
    shapes: [...blueprint.shapes],
    levels,
  };
});

export const LEVELS = WORLDS.flatMap((world) => world.levels);

export function clampFrostLevel(n) {
  const parsed = parseInt(n, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_FROST_LEVEL, Math.max(1, parsed));
}

export function getLevel(n) {
  return LEVELS[clampFrostLevel(n) - 1];
}

export function levelToWorld(n) {
  return Math.ceil(clampFrostLevel(n) / LEVELS_PER_WORLD);
}

export function getWorld(n) {
  return WORLDS[levelToWorld(n) - 1];
}

export function worldLevels(world) {
  const index = Math.min(WORLD_COUNT, Math.max(1, parseInt(world, 10) || 1)) - 1;
  return WORLDS[index].levels;
}
