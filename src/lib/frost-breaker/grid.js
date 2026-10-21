import { getShape } from './shapes.js';

export const CELL = 26;
export const COLS = 21;
export const ROWS = 21;
export const GRID_CX = 360;
export const GRID_CY = 500;

export function pointInPoly(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInAny(x, y, polygons) {
  return polygons.some((poly) => pointInPoly(x, y, poly));
}

/**
 * Fill the fixed cell grid with every cell whose center lies inside the
 * sculpture. Core targets snap to the nearest cell so authored weak points
 * always land on real ice. Levels can scale a shape and choose how many of
 * its three authored cores are active.
 */
export function buildCells(shapeId, { scale = 1, coreCount, coreIndexes } = {}) {
  const shape = getShape(shapeId);
  const originX = GRID_CX - (COLS * CELL) / 2;
  const originY = GRID_CY - (ROWS * CELL) / 2;
  const transform = (point) => ({
    x: GRID_CX + (point.x - GRID_CX) * scale,
    y: GRID_CY + (point.y - GRID_CY) * scale,
  });
  const polygons = shape.polygons.map((poly) => poly.map(transform));
  const cells = [];
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = originX + col * CELL + CELL / 2;
      const y = originY + row * CELL + CELL / 2;
      if (!pointInAny(x, y, polygons)) continue;
      const cell = {
        col,
        row,
        x,
        y,
        alive: true,
        core: false,
        coreTriggered: false,
        shade: (col * 7 + row * 13) % 5,
      };
      cells.push(cell);
      grid[row][col] = cell;
    }
  }

  let targets = shape.cores.map(transform);
  if (Array.isArray(coreIndexes)) {
    targets = coreIndexes.map((i) => targets[i]).filter(Boolean);
  } else if (Number.isFinite(coreCount)) {
    const count = Math.max(0, Math.min(targets.length, Math.round(coreCount)));
    if (count === 0) targets = [];
    else if (count === 1) targets = [targets[Math.floor(targets.length / 2)]];
    else if (count === 2) targets = [targets[0], targets[targets.length - 1]];
    else targets = targets.slice(0, count);
  }

  const cores = [];
  for (const target of targets) {
    let best = null;
    let bestD = Infinity;
    for (const cell of cells) {
      if (cell.core) continue;
      const d = (cell.x - target.x) ** 2 + (cell.y - target.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = cell;
      }
    }
    if (best) {
      best.core = true;
      cores.push(best);
    }
  }

  return {
    shapeId,
    shape,
    polygons,
    cells,
    grid,
    cols: COLS,
    rows: ROWS,
    originX,
    originY,
    total: cells.length,
    cores,
  };
}
