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
 * always land on real ice.
 */
export function buildCells(shapeId) {
  const shape = getShape(shapeId);
  const originX = GRID_CX - (COLS * CELL) / 2;
  const originY = GRID_CY - (ROWS * CELL) / 2;
  const cells = [];
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = originX + col * CELL + CELL / 2;
      const y = originY + row * CELL + CELL / 2;
      if (!pointInAny(x, y, shape.polygons)) continue;
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

  const cores = [];
  for (const target of shape.cores ?? []) {
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
