/**
 * Number Ice board rules.
 *
 * The board is a flat, row-major array of `size * size` ice blocks. Each block
 * holds an integer from 1 to 9. A move selects 2-4 blocks whose values sum to
 * the level target; those blocks melt, everything above falls down and fresh
 * numbers refill the top of each column.
 *
 * Every random decision goes through a seeded PRNG so a level always starts
 * from the same board.
 */

const MIN_VALUE = 1;
const MAX_VALUE = 9;
const MIN_SELECTION = 2;
const MAX_SELECTION = 4;

/** Small, fast deterministic PRNG (mulberry32). Returns floats in [0, 1). */
export function createRng(seed) {
  let state = Number(seed) >>> 0;
  return function rng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomValue(rng) {
  return MIN_VALUE + Math.floor(rng() * (MAX_VALUE - MIN_VALUE + 1));
}

/** Fresh board of `size * size` values in 1-9. */
export function createBoard(size, rng) {
  const count = Math.max(0, Math.floor(size) * Math.floor(size));
  const board = new Array(count);
  for (let i = 0; i < count; i++) board[i] = randomValue(rng);
  return board;
}

/** Sum the values at the given indices. Invalid indices contribute 0. */
export function sumSelection(board, selected) {
  let sum = 0;
  for (const index of selected ?? []) {
    const value = board[index];
    if (Number.isFinite(value)) sum += value;
  }
  return sum;
}

function isValidIndex(board, index) {
  return Number.isInteger(index) && index >= 0 && index < board.length;
}

function findFour(board, target) {
  const length = board.length;
  for (let a = 0; a < length - 3; a++) {
    for (let b = a + 1; b < length - 2; b++) {
      for (let c = b + 1; c < length - 1; c++) {
        const needed = target - board[a] - board[b] - board[c];
        if (needed < MIN_VALUE || needed > MAX_VALUE) continue;
        for (let d = c + 1; d < length; d++) {
          if (board[d] === needed) return [a, b, c, d];
        }
      }
    }
  }
  return null;
}

function findThree(board, target) {
  const length = board.length;
  for (let a = 0; a < length - 2; a++) {
    for (let b = a + 1; b < length - 1; b++) {
      const needed = target - board[a] - board[b];
      if (needed < MIN_VALUE || needed > MAX_VALUE) continue;
      for (let c = b + 1; c < length; c++) {
        if (board[c] === needed) return [a, b, c];
      }
    }
  }
  return null;
}

function findTwo(board, target) {
  const length = board.length;
  for (let a = 0; a < length - 1; a++) {
    const needed = target - board[a];
    if (needed < MIN_VALUE || needed > MAX_VALUE) continue;
    for (let b = a + 1; b < length; b++) {
      if (board[b] === needed) return [a, b];
    }
  }
  return null;
}

/**
 * Deterministically find one legal selection for `target`.
 * Prefers the largest group (4, then 3, then 2) so a move melts as much ice as
 * possible. Returns `null` when no 2-4 block sum exists.
 */
export function findSelection(board, target) {
  if (!Array.isArray(board) || !Number.isFinite(target)) return null;
  return findFour(board, target) ?? findThree(board, target) ?? findTwo(board, target);
}

function selectionSizeFor(target) {
  for (let size = MAX_SELECTION; size >= MIN_SELECTION; size--) {
    if (target >= size * MIN_VALUE && target <= size * MAX_VALUE) return size;
  }
  return null;
}

/** Build `count` values in 1-9 that sum exactly to `target`. */
function valuesForTarget(count, target, rng) {
  const values = [];
  let remaining = target;
  for (let i = 0; i < count; i++) {
    const left = count - i - 1;
    const low = Math.max(MIN_VALUE, remaining - MAX_VALUE * left);
    const high = Math.min(MAX_VALUE, remaining - MIN_VALUE * left);
    const value = low + Math.floor(rng() * (high - low + 1));
    values.push(value);
    remaining -= value;
  }
  return values;
}

function distinctIndices(count, boardLength, rng) {
  const indices = [];
  const used = new Set();
  // The board always has at least 25 cells, so this terminates quickly.
  while (indices.length < count) {
    const index = Math.floor(rng() * boardLength);
    if (used.has(index)) continue;
    used.add(index);
    indices.push(index);
  }
  return indices;
}

/**
 * Guarantee that a legal move exists. When one is already present the same
 * board reference is returned untouched; otherwise a small group of cells is
 * replaced with values that add up to `target`.
 */
export function ensureSelection(board, target, rng) {
  if (findSelection(board, target)) return board;
  const count = selectionSizeFor(target);
  if (count === null || board.length < count) return board;

  const next = board.slice();
  const values = valuesForTarget(count, target, rng);
  const indices = distinctIndices(count, next.length, rng);
  indices.forEach((index, i) => {
    next[index] = values[i];
  });
  return next;
}

/**
 * Melt the selected blocks, drop the survivors down each column and refill the
 * emptied top cells with fresh values. Returns a new board; the input is never
 * mutated.
 */
export function dropAndRefill(board, selected, size, rng) {
  const next = board.slice();
  const melted = new Set((selected ?? []).filter((index) => isValidIndex(board, index)));
  const width = Math.max(0, Math.floor(size));
  const height = Math.max(0, Math.floor(size));

  for (let col = 0; col < width; col++) {
    const survivors = [];
    for (let row = height - 1; row >= 0; row--) {
      const index = row * width + col;
      if (!melted.has(index)) survivors.push(board[index]);
    }
    for (let row = height - 1; row >= 0; row--) {
      const index = row * width + col;
      next[index] = row >= height - survivors.length ? survivors[height - row - 1] : randomValue(rng);
    }
  }

  return next;
}

/** Three stars at par, two within two extra moves, otherwise one. */
export function starsForNumberIceMoves(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + 2) return 2;
  return 1;
}
