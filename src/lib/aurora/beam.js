/**
 * Aurora Mirrors beam rules.
 *
 * A beam starts outside the board and travels one cell at a time. Mirrors
 * reflect it, walls stop it, and crystals are collected when the beam crosses
 * their cell. The same rules power both the live board and the level solver.
 */

export const MIRROR_SLASH = '/';
export const MIRROR_BACKSLASH = '\\';

export function reflect(dr, dc, mirror) {
  if (mirror === MIRROR_SLASH) return [-dc + 0, -dr + 0];
  return [dc + 0, dr + 0];
}

export function keyOf(r, c) {
  return `${r}-${c}`;
}

export function mirrorKey(mirror) {
  return keyOf(mirror.r, mirror.c);
}

export function initialMirrorDirs(level) {
  const dirs = {};
  for (const mirror of level.mirrors) dirs[mirrorKey(mirror)] = mirror.dir;
  return dirs;
}

export function traceBeam({ size, source, mirrorDirs, walls = [], targets = [] }) {
  let r = source.r;
  let c = source.c;
  let dr = source.dr;
  let dc = source.dc;
  const wallSet = new Set(walls);
  const targetSet = new Set(targets);
  const hits = new Set();
  const points = [{ x: c + 0.5, y: r + 0.5 }];
  const seen = new Set();

  for (let step = 0; step < size * size * 4; step++) {
    r += dr;
    c += dc;
    if (r < 0 || r >= size || c < 0 || c >= size) break;
    const cell = keyOf(r, c);
    if (wallSet.has(cell)) break;
    points.push({ x: c + 0.5, y: r + 0.5 });
    if (targetSet.has(cell)) hits.add(cell);

    const mirror = mirrorDirs[cell];
    if (!mirror) continue;
    const signature = `${r},${c},${dr},${dc}`;
    if (seen.has(signature)) break;
    seen.add(signature);
    [dr, dc] = reflect(dr, dc, mirror);
  }

  return {
    points,
    hits: [...hits],
    lit: targets.every((target) => hits.has(target)),
  };
}

export function solveLevel(level) {
  const mirrors = level.mirrors;
  const initial = initialMirrorDirs(level);
  const count = mirrors.length;
  let best = null;

  for (let mask = 0; mask < 1 << count; mask++) {
    const dirs = { ...initial };
    let flips = 0;
    for (let index = 0; index < count; index++) {
      const mirror = mirrors[index];
      const base = initial[mirrorKey(mirror)];
      if ((mask >> index) & 1) {
        dirs[mirrorKey(mirror)] = base === MIRROR_SLASH ? MIRROR_BACKSLASH : MIRROR_SLASH;
        flips += 1;
      }
    }
    const beam = traceBeam({
      size: level.size,
      source: level.source,
      mirrorDirs: dirs,
      walls: level.walls,
      targets: level.targets,
    });
    if (beam.lit && (best === null || flips < best)) best = flips;
  }

  return { solvable: best !== null, par: best };
}
