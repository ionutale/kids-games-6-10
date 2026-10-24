/** Aurora Mirrors: a five-level opening world, built to grow into six worlds. */
export const AURORA_LEVEL_COUNT = 5;
export const AURORA_WORLD = { id: 1, nameKey: 'auroraWorld1', accent: '#5eead4' };

export const AURORA_LEVELS = [
  {
    id: 1,
    slot: 1,
    nameKey: 'auroraL1',
    size: 7,
    source: { r: 3, c: -1, dr: 0, dc: 1 },
    targets: ['0-3'],
    mirrors: [{ r: 3, c: 3, dir: '\\' }],
    walls: [],
    par: 1,
  },
  {
    id: 2,
    slot: 2,
    nameKey: 'auroraL2',
    size: 7,
    source: { r: 3, c: -1, dr: 0, dc: 1 },
    targets: ['1-5'],
    mirrors: [
      { r: 3, c: 2, dir: '\\' },
      { r: 1, c: 2, dir: '\\' },
    ],
    walls: [],
    par: 2,
  },
  {
    id: 3,
    slot: 3,
    nameKey: 'auroraL3',
    size: 7,
    source: { r: 3, c: -1, dr: 0, dc: 1 },
    targets: ['1-4', '1-6'],
    mirrors: [
      { r: 3, c: 2, dir: '\\' },
      { r: 1, c: 2, dir: '\\' },
    ],
    walls: ['2-4'],
    par: 2,
  },
  {
    id: 4,
    slot: 4,
    nameKey: 'auroraL4',
    size: 7,
    source: { r: 3, c: -1, dr: 0, dc: 1 },
    targets: ['3-6'],
    mirrors: [
      { r: 3, c: 1, dir: '\\' },
      { r: 1, c: 1, dir: '\\' },
      { r: 1, c: 2, dir: '/' },
      { r: 3, c: 2, dir: '/' },
    ],
    walls: ['1-3', '2-3'],
    par: 4,
  },
  {
    id: 5,
    slot: 5,
    nameKey: 'auroraL5',
    size: 7,
    source: { r: 3, c: -1, dr: 0, dc: 1 },
    targets: ['1-2', '3-5', '5-2'],
    mirrors: [
      { r: 3, c: 1, dir: '\\' },
      { r: 1, c: 1, dir: '\\' },
      { r: 1, c: 5, dir: '/' },
      { r: 5, c: 5, dir: '\\' },
    ],
    walls: ['4-3'],
    par: 4,
  },
];

export function getAuroraLevel(level) {
  const index = Math.max(0, Math.min(AURORA_LEVEL_COUNT - 1, Number(level) - 1 || 0));
  return AURORA_LEVELS[index];
}

export function starsForAuroraMoves(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}

export function isAuroraPerfect(stars) {
  return stars.length === AURORA_LEVEL_COUNT && stars.every((value) => value === 3);
}
