/**
 * Frosted playfield rails and interior bumpers. The inner faces are the
 * collision planes: left/right vertical rails and a ceiling. There is no
 * floor — a missed shot falls past the slingshot and leaves the round.
 */
export const WALLS = {
  left: 48,
  right: 672,
  top: 210,
  bottom: 1150,
  thickness: 20,
  restitution: 0.78,
  maxBounces: 5,
};

const EPS = 0.0001;

/** First outer rail the ray meets, or null. Bottom is deliberately open. */
export function wallIntersection(x, y, dx, dy, maxT = 1500, bumpers = []) {
  let best = null;
  const consider = (t, side) => {
    if (t > EPS && t < maxT && (!best || t < best.t)) best = { t, side };
  };

  if (dx < -EPS) consider((WALLS.left - x) / dx, 'left');
  if (dx > EPS) consider((WALLS.right - x) / dx, 'right');
  if (dy < -EPS) consider((WALLS.top - y) / dy, 'top');

  for (const bumper of bumpers) {
    const hit = rectIntersection(x, y, dx, dy, bumper, maxT);
    if (hit && (!best || hit.t < best.t)) best = hit;
  }
  return best;
}

/**
 * Ray vs axis-aligned rectangle. Returns the entry distance and the face
 * the ray enters through, e.g. a shot travelling up enters a floating
 * bumper through its bottom face.
 */
export function rectIntersection(x, y, dx, dy, rect, maxT = 1500) {
  let tmin = 0;
  let tmax = maxT;
  let side = null;

  if (Math.abs(dx) < EPS) {
    if (x < rect.x || x > rect.x + rect.w) return null;
  } else {
    let t1 = (rect.x - x) / dx;
    let t2 = (rect.x + rect.w - x) / dx;
    let s1 = 'left';
    let s2 = 'right';
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      [s1, s2] = [s2, s1];
    }
    if (t1 > tmin) {
      tmin = t1;
      side = s1;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dy) < EPS) {
    if (y < rect.y || y > rect.y + rect.h) return null;
  } else {
    let t1 = (rect.y - y) / dy;
    let t2 = (rect.y + rect.h - y) / dy;
    let s1 = 'top';
    let s2 = 'bottom';
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      [s1, s2] = [s2, s1];
    }
    if (t1 > tmin) {
      tmin = t1;
      side = s1;
    }
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (!side || tmin <= EPS || tmin > maxT) return null;
  return { t: tmin, side };
}

/** Geometric reflection for the aim preview: direction only, no speed loss. */
export function reflectDirection(dx, dy, side) {
  if (side === 'left' || side === 'right') return { x: -dx, y: dy };
  if (side === 'top' || side === 'bottom') return { x: dx, y: -dy };
  return { x: dx, y: dy };
}

/** Physical reflection for a live projectile. */
export function reflectVelocity(vx, vy, side, restitution = WALLS.restitution) {
  if (side === 'left' || side === 'right') {
    return { x: -vx * restitution, y: vy * 0.96 };
  }
  if (side === 'top' || side === 'bottom') {
    return { x: vx * 0.96, y: -vy * restitution };
  }
  return { x: vx, y: vy };
}

/**
 * Circle-vs-bumper resolution. Returns the face and the corrected center,
 * pushed just outside the bumper. A circle only touching the surface is
 * treated as a hit; anything farther out is free.
 */
export function bumperCollision(x, y, r, rect) {
  const right = rect.x + rect.w;
  const bottom = rect.y + rect.h;
  const nx = Math.max(rect.x, Math.min(x, right));
  const ny = Math.max(rect.y, Math.min(y, bottom));
  const inside = x >= rect.x && x <= right && y >= rect.y && y <= bottom;
  const dx = x - nx;
  const dy = y - ny;
  if (!inside && dx * dx + dy * dy > r * r) return null;

  let side;
  if (inside) {
    const left = x - rect.x;
    const rightGap = right - x;
    const top = y - rect.y;
    const bottomGap = bottom - y;
    const nearest = Math.min(left, rightGap, top, bottomGap);
    side = nearest === left ? 'left' : nearest === rightGap ? 'right' : nearest === top ? 'top' : 'bottom';
  } else {
    const outX = x < rect.x ? rect.x - x : x > right ? x - right : 0;
    const outY = y < rect.y ? rect.y - y : y > bottom ? y - bottom : 0;
    if (outX > 0 && outY > 0) {
      side = outX >= outY ? (x < rect.x ? 'left' : 'right') : y < rect.y ? 'top' : 'bottom';
    } else if (outX > 0) {
      side = x < rect.x ? 'left' : 'right';
    } else {
      side = y < rect.y ? 'top' : 'bottom';
    }
  }

  const pad = 0.01;
  let px = x;
  let py = y;
  if (side === 'left') px = rect.x - r - pad;
  else if (side === 'right') px = right + r + pad;
  else if (side === 'top') py = rect.y - r - pad;
  else py = bottom + r + pad;
  return { side, x: px, y: py };
}

/**
 * Trace a normalized aim ray through rails and bumpers for the dotted
 * preview. `maxLen` is the total path budget, shared across bounces.
 */
export function traceWallPath(x, y, dx, dy, { maxLen = 1100, maxBounces = 3, bumpers = [] } = {}) {
  const points = [{ x, y }];
  let remaining = maxLen;
  let bounces = 0;

  while (bounces < maxBounces) {
    const hit = wallIntersection(x, y, dx, dy, remaining, bumpers);
    if (!hit) break;
    const hx = x + dx * hit.t;
    const hy = y + dy * hit.t;
    points.push({ x: hx, y: hy });
    remaining -= hit.t;
    const next = reflectDirection(dx, dy, hit.side);
    dx = next.x;
    dy = next.y;
    x = hx;
    y = hy;
    bounces += 1;
  }

  points.push({ x: x + dx * remaining, y: y + dy * remaining });
  return { points, bounces };
}
