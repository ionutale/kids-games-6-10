import { describe, it, expect } from 'vitest';
import {
  WALLS,
  wallIntersection,
  rectIntersection,
  reflectDirection,
  reflectVelocity,
  bumperCollision,
  traceWallPath,
} from '$lib/frost-breaker/walls.js';

const BUMPER = { x: 100, y: 400, w: 80, h: 100 };

describe('frosted rails', () => {
  it('finds the nearest outer rail and never the open bottom', () => {
    expect(wallIntersection(360, 960, 0, -1)).toEqual({ t: 750, side: 'top' });
    expect(wallIntersection(360, 960, -1, 0)).toEqual({ t: 312, side: 'left' });
    expect(wallIntersection(360, 960, 1, 0)).toEqual({ t: 312, side: 'right' });
    expect(wallIntersection(360, 960, 0, 1)).toBeNull();
    expect(wallIntersection(360, 960, 0.6, -0.8)?.side).toBe('right');
  });

  it('uses an interior bumper when it is closer than a rail', () => {
    const bumper = { x: 320, y: 600, w: 80, h: 100 };
    expect(wallIntersection(360, 960, 0, -1, 1500, [bumper])).toEqual({
      t: 260,
      side: 'bottom',
    });
  });

  it('reflects direction without losing speed', () => {
    expect(reflectDirection(1, 0, 'left')).toEqual({ x: -1, y: 0 });
    expect(reflectDirection(-1, 0, 'right')).toEqual({ x: 1, y: 0 });
    expect(reflectDirection(0, -1, 'top')).toEqual({ x: 0, y: 1 });
    expect(reflectDirection(0, 1, 'bottom')).toEqual({ x: 0, y: -1 });
  });

  it('damps a live velocity off each face', () => {
    const r = 0.5;
    expect(reflectVelocity(-100, 50, 'left', r)).toEqual({ x: 50, y: 48 });
    expect(reflectVelocity(100, 50, 'right', r)).toEqual({ x: -50, y: 48 });
    expect(reflectVelocity(50, -100, 'top', r)).toEqual({ x: 48, y: 50 });
    expect(reflectVelocity(50, 100, 'bottom', r)).toEqual({ x: 48, y: -50 });
  });
});

describe('interior bumpers', () => {
  it('finds the entry face of an axis-aligned rectangle', () => {
    const overhead = { x: 320, y: 400, w: 80, h: 100 };
    expect(rectIntersection(360, 960, 0, -1, overhead)).toEqual({ t: 460, side: 'bottom' });
    expect(rectIntersection(360, 450, -1, 0, BUMPER)).toEqual({ t: 180, side: 'right' });
    expect(rectIntersection(360, 450, 1, 0, BUMPER)).toBeNull();
  });

  it('pushes a circle out of a bumper and names the face', () => {
    expect(bumperCollision(95, 450, 10, BUMPER)).toMatchObject({ side: 'left', y: 450 });
    expect(bumperCollision(140, 390, 10, BUMPER)).toMatchObject({ side: 'top', x: 140 });
    expect(bumperCollision(140, 510, 10, BUMPER)).toMatchObject({ side: 'bottom', x: 140 });
    expect(bumperCollision(90, 450, 5, BUMPER)).toBeNull();
  });
});

describe('aim path', () => {
  it('traces a ceiling bounce and the remaining length', () => {
    const path = traceWallPath(360, 960, 0, -1, { maxLen: 1100, maxBounces: 3 });
    expect(path.bounces).toBe(1);
    expect(path.points).toEqual([
      { x: 360, y: 960 },
      { x: 360, y: WALLS.top },
      { x: 360, y: WALLS.top + 350 },
    ]);
  });

  it('stops after the requested number of bounces', () => {
    const path = traceWallPath(360, 960, 0, -1, { maxLen: 1100, maxBounces: 0 });
    expect(path.bounces).toBe(0);
    expect(path.points).toEqual([
      { x: 360, y: 960 },
      { x: 360, y: -140 },
    ]);
  });
});
