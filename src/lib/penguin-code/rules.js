/** Penguin Code: movement, win/lose rules, and the minimum-command solver. */

export const COMMANDS = ['U', 'D', 'L', 'R'];

const DELTAS = {
  U: { dr: -1, dc: 0 },
  D: { dr: 1, dc: 0 },
  L: { dr: 0, dc: -1 },
  R: { dr: 0, dc: 1 },
};

export function cellKey(r, c) {
  return `${r}-${c}`;
}

function cellSet(cells) {
  return new Set(cells || []);
}

function inBounds(size, r, c) {
  return r >= 0 && c >= 0 && r < size && c < size;
}

export function simulateProgram(level, commands) {
  const size = level.size;
  const walls = cellSet(level.walls);
  const holes = cellSet(level.holes);
  const fish = cellSet(level.fish);
  const collected = [];
  const path = [{ r: level.start.r, c: level.start.c }];
  let current = { r: level.start.r, c: level.start.c };
  let status = 'incomplete';
  let reason = null;

  for (const command of commands || []) {
    const delta = DELTAS[command];
    if (!delta) {
      path.push({ r: current.r, c: current.c });
      continue;
    }

    const next = { r: current.r + delta.dr, c: current.c + delta.dc };
    if (!inBounds(size, next.r, next.c)) {
      status = 'fail';
      reason = 'out';
      break;
    }

    if (walls.has(cellKey(next.r, next.c))) {
      // Walls stop the penguin but do not end the program.
      path.push({ r: current.r, c: current.c });
      continue;
    }

    current = next;
    path.push({ r: current.r, c: current.c });

    if (holes.has(cellKey(current.r, current.c))) {
      status = 'fail';
      reason = 'splash';
      break;
    }

    const key = cellKey(current.r, current.c);
    if (fish.has(key) && !collected.includes(key)) collected.push(key);

    if (collected.length === fish.size && current.r === level.goal.r && current.c === level.goal.c) {
      status = 'win';
      break;
    }
  }

  return { status, reason, path, collected };
}

export function solveLevel(level) {
  const size = level.size;
  const walls = cellSet(level.walls);
  const holes = cellSet(level.holes);
  const fishKeys = (level.fish || []).map((key) => key);
  const fishIndex = new Map(fishKeys.map((key, index) => [key, index]));
  const allCollected = (1 << fishKeys.length) - 1;
  const startFish = fishIndex.get(cellKey(level.start.r, level.start.c));
  const startMask = startFish === undefined ? 0 : 1 << startFish;

  const start = { r: level.start.r, c: level.start.c, mask: startMask };
  if (start.r === level.goal.r && start.c === level.goal.c && startMask === allCollected) {
    return { solvable: true, par: 0 };
  }

  let frontier = [start];
  const seen = new Set([`${start.r}-${start.c}-${start.mask}`]);
  let distance = 0;

  while (frontier.length) {
    distance += 1;
    const nextFrontier = [];

    for (const state of frontier) {
      for (const command of COMMANDS) {
        const delta = DELTAS[command];
        const r = state.r + delta.dr;
        const c = state.c + delta.dc;
        if (!inBounds(size, r, c)) continue;

        const key = cellKey(r, c);
        if (walls.has(key) || holes.has(key)) continue;

        const index = fishIndex.get(key);
        const mask = index === undefined ? state.mask : state.mask | (1 << index);
        if (mask === allCollected && r === level.goal.r && c === level.goal.c) {
          return { solvable: true, par: distance };
        }

        const stateKey = `${r}-${c}-${mask}`;
        if (seen.has(stateKey)) continue;
        seen.add(stateKey);
        nextFrontier.push({ r, c, mask });
      }
    }

    frontier = nextFrontier;
  }

  return { solvable: false, par: null };
}

export function starsForPenguinCommands(commands, par) {
  const moves = Array.isArray(commands) ? commands.length : Number(commands) || 0;
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}
