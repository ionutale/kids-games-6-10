import { describe, it, expect } from 'vitest';
import { SHAPES, getShape } from '$lib/frost-breaker/shapes.js';
import { buildCells } from '$lib/frost-breaker/grid.js';

const ANCHORS = [
  'star',
  'fish',
  'cat',
  'rocket',
  'castle',
  'snowman',
  'dinosaur',
  'butterfly',
  'lighthouse',
  'crown',
];
const CREATURES = [
  'fairy',
  'mermaid',
  'unicorn',
  'robot',
  'dragon',
  'yeti',
  'mammoth',
  'phoenix',
  'kraken',
  'genie',
];
const ALL = [...ANCHORS, ...CREATURES];

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

describe('storybook sculpture set', () => {
  it('defines ten anchors and ten creatures', () => {
    expect(Object.keys(SHAPES).sort()).toEqual([...ALL].sort());
    for (const id of CREATURES) {
      expect(getShape(id).label, id).toBeTruthy();
    }
  });

  it('authors three core targets on every sculpture', () => {
    for (const id of ALL) {
      expect(getShape(id).cores, id).toHaveLength(3);
    }
  });

  it('keeps every sculpture as one connected mass', () => {
    for (const id of ALL) {
      const built = buildCells(id);
      expect(largestComponentSize(built), id).toBe(built.total);
    }
  });
});
