import { buildCells, CELL } from './grid.js';
import { getLevel } from './levels.js';
import { allPodsUsed, percentage, shownPct, starsFor, POD_IDS, PASS_PCT } from './rules.js';
import { sfx, unlockAudio, startMusic, stopMusic } from './audio.js';
import { WALLS, bumperCollision, reflectVelocity, traceWallPath } from './walls.js';

const W = 720;
const H = 1280;
const SLING = { x: 360, y: 1008, spawnY: 960 };
const MAX_PULL = 240;
const MIN_PULL = 38;
const ICONS = { spike: '❄️', ghost: '👻', copter: '🚁', split: '💠' };

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** `#rrggbb` (or `#rgb`) to an rgba string; falls back to the frost blue. */
function hexToRgba(hex, alpha = 1) {
  const raw = String(hex ?? '').replace('#', '');
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(125, 211, 252, ${alpha})`;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function circleRect(x, y, r, rx, ry, rw, rh) {
  const nx = clamp(x, rx, rx + rw);
  const ny = clamp(y, ry, ry + rh);
  return (x - nx) * (x - nx) + (y - ny) * (y - ny) <= r * r;
}

function pickIce() {
  const palette = ['#d9f7ff', '#bff3ff', '#a5e8ff', '#7dd3fc', '#eafcff'];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function createFrostEngine(canvas, { level, onState, onResult }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const config = getLevel(level);
  const bumpers = config.bumpers ?? [];
  const accent = config.accent ?? '#7dd3fc';
  const auroraTints = [hexToRgba(accent, 0.13), hexToRgba(accent, 0.075), 'rgba(56, 189, 248, 0.06)'];
  const floorTint = hexToRgba(accent, 0.11);
  const floorClear = hexToRgba(accent, 0);
  let built = buildCells(config.shape, { scale: config.scale, coreCount: config.coreCount });
  let cells = built.cells;
  let grid = built.grid;
  let totalCells = built.total;

  let pods = { ...config.pods };
  let selectedPod = 'spike';
  let projectiles = [];
  let crystals = [];
  let explosions = [];
  let pending = [];
  let particles = [];
  let ambient = [];

  let phase = 'aiming';
  let drag = { active: false, pointerId: null, x: 0, y: 0 };
  let ghostSteer = { active: false, pointerId: null, targetY: 0 };
  let shake = 0;
  let time = 0;
  let shotsFired = 0;
  let clearedCells = 0;
  let hudDirty = true;
  let running = false;
  let raf = 0;
  let last = 0;

  function emit() {
    hudDirty = false;
    onState?.({
      level,
      pct: shownPct(clearedCells, totalCells),
      cleared: clearedCells,
      total: totalCells,
      pods: { ...pods },
      selected: selectedPod,
      phase,
      shotsFired,
      ghostInFlight: projectiles.some((p) => p.type === 'ghost' && !p.dead),
      stars: starsFor(clearedCells, totalCells),
    });
  }

  // ---------- level setup ----------

  function reset() {
    built = buildCells(config.shape, { scale: config.scale, coreCount: config.coreCount });
    cells = built.cells;
    grid = built.grid;
    totalCells = built.total;
    pods = { ...config.pods };
    selectedPod = 'spike';
    projectiles = [];
    crystals = [];
    explosions = [];
    pending = [];
    particles = [];
    phase = 'aiming';
    drag.active = false;
    drag.pointerId = null;
    ghostSteer.active = false;
    ghostSteer.pointerId = null;
    shake = 0;
    shotsFired = 0;
    clearedCells = 0;
    hudDirty = true;
    emit();
  }

  function selectPod(id) {
    if (phase !== 'aiming' || !POD_IDS.includes(id) || pods[id] <= 0) return;
    selectedPod = id;
    sfx.tap();
    hudDirty = true;
    emit();
  }

  // ---------- collision / destruction ----------

  function hitCell(x, y, r) {
    const col = Math.floor((x - built.originX) / CELL);
    const row = Math.floor((y - built.originY) / CELL);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = row + dr;
        const cc = col + dc;
        if (rr < 0 || rr >= built.rows || cc < 0 || cc >= built.cols) continue;
        const cell = grid[rr][cc];
        if (!cell || !cell.alive) continue;
        if (circleRect(x, y, r, cell.x - CELL / 2, cell.y - CELL / 2, CELL, CELL)) return cell;
      }
    }
    return null;
  }

  function raycast(x, y, dx, dy, maxLen) {
    for (let d = 0; d < maxLen; d += 8) {
      if (hitCell(x + dx * d, y + dy * d, 4)) return d;
    }
    return null;
  }

  function spawnWallSpark(x, y, side) {
    const inward =
      side === 'left'
        ? { x: 1, y: 0 }
        : side === 'right'
          ? { x: -1, y: 0 }
          : side === 'top'
            ? { x: 0, y: 1 }
            : { x: 0, y: -1 };
    for (let i = 0; i < 8; i++) {
      particles.push({
        kind: 'spark',
        x,
        y,
        vx: inward.x * rand(40, 190) + rand(-55, 55),
        vy: inward.y * rand(40, 190) + rand(-55, 55),
        gravity: 30,
        life: rand(0.18, 0.4),
        maxLife: 0.4,
        size: rand(1.4, 3.4),
        color: '#bff3ff',
      });
    }
  }

  /**
   * Reflect a live projectile off the frosted rails and interior bumpers.
   * The ceiling counts; the bottom is open so a miss can fall past the
   * slingshot. Ghosts are intentionally not sent through this path.
   */
  function bounceWalls(p) {
    if (p.bounces >= WALLS.maxBounces) return false;
    const sides = [];

    if (p.x - p.r < WALLS.left) {
      p.x = WALLS.left + p.r;
      if (p.vx < 0) sides.push('left');
    } else if (p.x + p.r > WALLS.right) {
      p.x = WALLS.right - p.r;
      if (p.vx > 0) sides.push('right');
    }

    if (p.y - p.r < WALLS.top) {
      p.y = WALLS.top + p.r;
      if (p.vy < 0) sides.push('top');
    }

    for (const bumper of bumpers) {
      const hit = bumperCollision(p.x, p.y, p.r, bumper);
      if (!hit) continue;
      p.x = hit.x;
      p.y = hit.y;
      const outward =
        hit.side === 'left'
          ? p.vx > 0
          : hit.side === 'right'
            ? p.vx < 0
            : hit.side === 'top'
              ? p.vy > 0
              : p.vy < 0;
      if (outward) sides.push(hit.side);
    }

    if (!sides.length) return false;
    for (const side of sides) {
      const next = reflectVelocity(p.vx, p.vy, side);
      p.vx = next.x;
      p.vy = next.y;
    }
    p.bounces += 1;
    spawnWallSpark(p.x, p.y, sides[0]);
    shake = Math.max(shake, 3);
    sfx.bounce();
    return true;
  }

  function destroyCell(cell) {
    if (!cell.alive) return;
    cell.alive = false;
    clearedCells++;
    hudDirty = true;
    spawnShards(cell.x, cell.y, cell.core ? 8 : 4);
    if (cell.core && !cell.coreTriggered) {
      cell.coreTriggered = true;
      pending.push({ x: cell.x, y: cell.y, radius: CELL * 5.1, delay: 0.18, kind: 'core' });
    }
  }

  function spawnFallingCell(cell) {
    particles.push({
      kind: 'cell',
      x: cell.x,
      y: cell.y,
      vx: rand(-30, 30),
      vy: rand(-30, 50),
      gravity: 1000,
      life: 1.55,
      maxLife: 1.55,
      rot: rand(-0.25, 0.25),
      vr: rand(-3.2, 3.2),
      size: CELL * 0.78,
      color: '#bff3ff',
    });
  }

  function collapseUnsupported() {
    const alive = cells.filter((c) => c.alive);
    if (alive.length < 2) return;

    const seen = new Set();
    const components = [];
    for (const start of alive) {
      if (seen.has(start)) continue;
      const component = [];
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const cell = stack.pop();
        component.push(cell);
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const rr = cell.row + dr;
          const cc = cell.col + dc;
          if (rr < 0 || rr >= built.rows || cc < 0 || cc >= built.cols) continue;
          const next = grid[rr][cc];
          if (next && next.alive && !seen.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
      components.push(component);
    }

    if (components.length <= 1) return;
    components.sort((a, b) => b.length - a.length);
    for (const component of components.slice(1)) {
      for (const cell of component) {
        if (!cell.alive) continue;
        spawnFallingCell(cell);
        destroyCell(cell);
      }
    }
  }

  function explode(x, y, radius, kind = 'ice') {
    const hit = [];
    for (const cell of cells) {
      if (!cell.alive) continue;
      if (Math.hypot(cell.x - x, cell.y - y) <= radius + rand(-3, 3)) hit.push(cell);
    }
    for (const cell of hit) destroyCell(cell);
    collapseUnsupported();

    explosions.push({ x, y, maxR: radius, life: 0.42, maxLife: 0.42, kind });
    const power = kind === 'core' ? 18 : kind === 'crystal' ? 5 : 9;
    shake = Math.max(shake, power);
    spawnSparkles(x, y, kind === 'core' ? 22 : kind === 'crystal' ? 6 : 12, kind === 'core');
    if (kind === 'core') sfx.core();
    else if (kind === 'crystal') sfx.crystal();
    else sfx.crack();
  }

  // ---------- projectiles ----------

  function makeProjectile(type, x, y, vx, vy, power = 0.7, child = false) {
    return {
      type,
      x,
      y,
      vx,
      vy,
      r: type === 'ghost' ? 12 : child ? 8 : 10,
      power,
      life: type === 'ghost' ? 0.95 : type === 'copter' ? 1.15 : 2.2,
      dropTimer: 0.06,
      dropsLeft: 6,
      trail: [],
      state: 'fly',
      timer: 0,
      splitDone: false,
      bounces: 0,
      dead: false,
    };
  }

  function speedFor(type, power) {
    if (type === 'ghost') return 620;
    if (type === 'split') return 760 + 420 * power;
    return 1120 + 760 * power;
  }

  function splitProjectile(parent) {
    const angle = Math.atan2(parent.vy, parent.vx);
    const childSpeed = 520;
    for (const offset of [-0.42, 0, 0.42]) {
      const a = angle + offset;
      projectiles.push(
        makeProjectile(
          'split-child',
          parent.x,
          parent.y,
          Math.cos(a) * childSpeed,
          Math.sin(a) * childSpeed,
          parent.power,
          true,
        ),
      );
    }
    sfx.split();
  }

  function dropCrystal(x, y) {
    crystals.push({ x, y, vx: rand(-28, 28), vy: rand(30, 70), r: 6, life: 2.4, dead: false });
  }

  function updateProjectiles(dt) {
    const snapshot = projectiles.slice();
    for (const p of snapshot) {
      if (p.dead) continue;
      if (p.state === 'stuck') {
        p.timer -= dt;
        if (p.timer <= 0) {
          explode(p.x, p.y, CELL * 2.3, 'spike');
          p.dead = true;
        }
        continue;
      }

      if (p.type === 'ghost') {
        if (ghostSteer.active) {
          const maxStep = 660 * dt;
          p.y += clamp(ghostSteer.targetY - p.y, -maxStep, maxStep);
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = clamp(p.x, WALLS.left + p.r, WALLS.right - p.r);
        p.y = Math.max(p.y, WALLS.top + p.r);
        p.life -= dt;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 14) p.trail.shift();
        if (p.life <= 0 || p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) {
          if (p.x > -30 && p.x < W + 30 && p.y > -30 && p.y < H + 30) {
            explode(p.x, p.y, CELL * 3.2, 'ghost');
          }
          p.dead = true;
        }
        continue;
      }

      if (p.type === 'copter') {
        const steps = Math.max(1, Math.ceil((Math.hypot(p.vx, p.vy) * dt) / 12));
        for (let i = 0; i < steps; i++) {
          p.x += (p.vx * dt) / steps;
          p.y += (p.vy * dt) / steps;
          p.dropTimer -= dt / steps;
          if (p.dropTimer <= 0 && p.dropsLeft > 0) {
            dropCrystal(p.x, p.y);
            p.dropsLeft--;
            p.dropTimer = 0.12;
          }
          bounceWalls(p);
        }
        p.life -= dt;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 14) p.trail.shift();
        if (p.life <= 0 || p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) p.dead = true;
        continue;
      }

      const steps = Math.max(1, Math.ceil((Math.hypot(p.vx, p.vy) * dt) / 8));
      for (let i = 0; i < steps; i++) {
        p.x += (p.vx * dt) / steps;
        p.y += (p.vy * dt) / steps;
        const cell = hitCell(p.x, p.y, p.r);
        if (cell) {
          if (p.type === 'spike') {
            p.state = 'stuck';
            p.timer = 0.35;
            p.vx = 0;
            p.vy = 0;
            sfx.stick();
            break;
          }
          if (p.type === 'split' && !p.splitDone) {
            p.splitDone = true;
            splitProjectile(p);
            p.dead = true;
            break;
          }
          explode(p.x, p.y, CELL * 1.7, 'split');
          p.dead = true;
          break;
        }
        if (p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) {
          p.dead = true;
          break;
        }
        bounceWalls(p);
      }
      p.life -= dt;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 14) p.trail.shift();
      if (p.life <= 0) p.dead = true;
    }
    projectiles = projectiles.filter((p) => !p.dead);
  }

  function updateCrystals(dt) {
    for (const c of crystals) {
      if (c.dead) continue;
      c.vy += 680 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      if (hitCell(c.x, c.y, c.r)) {
        explode(c.x, c.y, CELL * 1.55, 'crystal');
        c.dead = true;
        continue;
      }
      if (c.y > H + 30 || c.x < -30 || c.x > W + 30 || c.life <= 0) c.dead = true;
    }
    crystals = crystals.filter((c) => !c.dead);
  }

  function updatePending(dt) {
    for (const p of pending) {
      p.delay -= dt;
      if (p.delay <= 0) {
        explode(p.x, p.y, p.radius, p.kind);
        p.dead = true;
      }
    }
    pending = pending.filter((p) => !p.dead);
  }

  function updateExplosions(dt) {
    for (const e of explosions) e.life -= dt;
    explosions = explosions.filter((e) => e.life > 0);
  }

  // ---------- particles ----------

  function spawnShards(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(50, 280);
      particles.push({
        kind: 'shard',
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - rand(0, 140),
        gravity: 620,
        life: rand(0.45, 0.95),
        maxLife: 0.95,
        rot: rand(0, Math.PI * 2),
        vr: rand(-9, 9),
        size: rand(3, 8),
        color: pickIce(),
      });
    }
    capParticles();
  }

  function spawnSparkles(x, y, n, core = false) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = rand(30, core ? 320 : 200);
      particles.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        gravity: 40,
        life: rand(0.25, core ? 0.8 : 0.55),
        maxLife: core ? 0.8 : 0.55,
        size: rand(1.5, core ? 5 : 3.5),
        color: core ? (Math.random() < 0.55 ? '#fde68a' : '#a5f3fc') : '#bff3ff',
      });
    }
    capParticles();
  }

  function capParticles() {
    if (particles.length > 600) particles.splice(0, particles.length - 600);
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      if (p.kind === 'shard' || p.kind === 'cell') p.rot += p.vr * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function updateAmbient(dt) {
    for (const s of ambient) {
      if (s.kind === 'snow') {
        s.y += s.speed * dt;
        s.x += Math.sin(time * 0.4 + s.phase) * 4 * dt;
        if (s.y > H + 10) {
          s.y = -10;
          s.x = rand(0, W);
        }
      }
    }
  }

  // ---------- aiming ----------

  function getPull() {
    let px = drag.x - SLING.x;
    let py = drag.y - SLING.y;
    const len = Math.hypot(px, py);
    if (len > MAX_PULL) {
      px = (px / len) * MAX_PULL;
      py = (py / len) * MAX_PULL;
    }
    return { px, py, len: Math.min(len, MAX_PULL) };
  }

  function validAim() {
    if (!drag.active || phase !== 'aiming' || pods[selectedPod] <= 0) return false;
    const pull = getPull();
    if (pull.len < MIN_PULL) return false;
    const len = Math.hypot(pull.px, pull.py) || 1;
    return -pull.py / len < -0.12;
  }

  function launch() {
    if (!validAim()) return;
    const pull = getPull();
    const len = Math.hypot(pull.px, pull.py) || 1;
    const dir = { x: -pull.px / len, y: -pull.py / len };
    const power = clamp(pull.len / MAX_PULL, 0, 1);
    const speed = speedFor(selectedPod, power);
    projectiles.push(makeProjectile(selectedPod, SLING.x, SLING.spawnY, dir.x * speed, dir.y * speed, power));
    pods[selectedPod]--;
    shotsFired++;
    phase = 'flying';
    hudDirty = true;
    shake = Math.max(shake, 4);
    sfx.launch();
    emit();
  }

  function firstAvailablePod() {
    for (const id of POD_IDS) if (pods[id] > 0) return id;
    return null;
  }

  function showResult(win) {
    if (phase === 'result') return;
    phase = 'result';
    const stars = win ? starsFor(clearedCells, totalCells) : 0;
    hudDirty = true;
    emit();
    if (win) sfx.win(stars);
    else sfx.softFail();
    onResult?.({
      win,
      pct: shownPct(clearedCells, totalCells),
      stars,
      cleared: clearedCells,
      total: totalCells,
      level,
    });
  }

  function checkSettle() {
    if (phase !== 'flying') return;
    if (projectiles.length || crystals.length || pending.length || explosions.length) return;
    if (particles.some((p) => p.kind === 'cell')) return;

    const pct = percentage(clearedCells, totalCells);
    if (clearedCells >= totalCells) {
      showResult(true);
      return;
    }
    if (allPodsUsed(pods)) {
      showResult(pct >= PASS_PCT);
      return;
    }

    phase = 'aiming';
    if (pods[selectedPod] <= 0) {
      const next = firstAvailablePod();
      if (next) selectedPod = next;
    }
    hudDirty = true;
    emit();
  }

  // ---------- input ----------

  function toWorld(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    unlockAudio();
    const p = toWorld(e);

    if (phase === 'flying' && projectiles.some((q) => q.type === 'ghost' && !q.dead)) {
      ghostSteer.active = true;
      ghostSteer.pointerId = e.pointerId;
      ghostSteer.targetY = p.y;
      e.preventDefault();
      return;
    }

    if (phase !== 'aiming') return;
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.x = p.x;
    drag.y = p.y;
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (ghostSteer.active && e.pointerId === ghostSteer.pointerId) {
      const p = toWorld(e);
      ghostSteer.targetY = p.y;
      e.preventDefault();
      return;
    }
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    const p = toWorld(e);
    drag.x = p.x;
    drag.y = p.y;
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (ghostSteer.active && e.pointerId === ghostSteer.pointerId) {
      ghostSteer.active = false;
      ghostSteer.pointerId = null;
    }
    if (drag.active && e.pointerId === drag.pointerId) {
      if (validAim()) launch();
      drag.active = false;
      drag.pointerId = null;
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  // ---------- drawing ----------

  function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04101f');
    bg.addColorStop(0.55, '#07243a');
    bg.addColorStop(1, '#020a13');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 20) {
        const y = 175 + i * 92 + Math.sin(x * 0.008 + time * 0.24 + i * 1.7) * 36;
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = auroraTints[i];
      ctx.lineWidth = 96;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();

    const floor = ctx.createRadialGradient(360, 1110, 20, 360, 1110, 390);
    floor.addColorStop(0, floorTint);
    floor.addColorStop(1, floorClear);
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.ellipse(360, 1110, 390, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const s of ambient) {
      if (s.kind === 'star') {
        ctx.globalAlpha = 0.18 + 0.3 * (0.5 + 0.5 * Math.sin(time * 0.8 + s.phase));
        ctx.fillStyle = '#d9f7ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#c7f0ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSculptureOutline() {
    const glow = ctx.createRadialGradient(360, 500, 30, 360, 500, 320);
    glow.addColorStop(0, 'rgba(125, 211, 252, 0.12)');
    glow.addColorStop(0.6, 'rgba(125, 211, 252, 0.05)');
    glow.addColorStop(1, 'rgba(125, 211, 252, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(30, 180, 660, 660);

    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.22)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(125, 211, 252, 0.5)';
    ctx.shadowBlur = 22;
    for (const poly of built.polygons) {
      ctx.beginPath();
      poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCells() {
    for (const cell of cells) {
      if (!cell.alive) continue;
      const x = cell.x - CELL / 2 + 1;
      const y = cell.y - CELL / 2 + 1;
      const w = CELL - 2;
      const h = CELL - 2;
      const base = ['#d9f7ff', '#c7f0ff', '#b3e8ff', '#a5e2ff', '#cff6ff'][cell.shade];
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#f4fdff');
      g.addColorStop(0.45, base);
      g.addColorStop(1, '#6fc9ea');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, w, h, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 4, y + 5);
      ctx.lineTo(x + w - 5, y + 5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.stroke();

      if ((cell.col + cell.row) % 7 === 0) {
        ctx.beginPath();
        ctx.moveTo(x + 5, y + h - 6);
        ctx.lineTo(x + w - 7, y + 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.stroke();
      }
    }
  }

  function drawCores() {
    for (const cell of cells) {
      if (!cell.alive || !cell.core) continue;
      const pulse = 0.5 + 0.5 * Math.sin(time * 3.2 + cell.col * 0.7);
      const r = 13 + pulse * 3;
      const g = ctx.createRadialGradient(cell.x, cell.y, 1, cell.x, cell.y, r * 2.4);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      g.addColorStop(0.22, 'rgba(251, 191, 36, 0.92)');
      g.addColorStop(0.58, 'rgba(56, 189, 248, 0.38)');
      g.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(time * 0.45);
      ctx.fillStyle = '#fff7d6';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? 4.5 : 10.5;
        const a = (i * Math.PI) / 4;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWalls() {
    const rail = (x, y, w, h) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, 'rgba(157, 228, 255, 0.30)');
      g.addColorStop(0.45, 'rgba(56, 189, 248, 0.14)');
      g.addColorStop(1, 'rgba(2, 14, 24, 0.58)');
      ctx.fillStyle = g;
      roundRect(ctx, x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 6);
      ctx.lineTo(x + w - 6, y + 6);
      ctx.stroke();
    };

    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;

    rail(WALLS.left - WALLS.thickness, 190, WALLS.thickness, 1000);
    rail(WALLS.right, 190, WALLS.thickness, 1000);
    rail(
      WALLS.left - WALLS.thickness,
      WALLS.top - WALLS.thickness,
      WALLS.right - WALLS.left + WALLS.thickness * 2,
      WALLS.thickness,
    );

    for (const bumper of bumpers) {
      const g = ctx.createLinearGradient(bumper.x, bumper.y, bumper.x + bumper.w, bumper.y + bumper.h);
      g.addColorStop(0, 'rgba(207, 246, 255, 0.26)');
      g.addColorStop(0.48, 'rgba(32, 112, 156, 0.42)');
      g.addColorStop(1, 'rgba(3, 20, 34, 0.86)');
      ctx.fillStyle = g;
      roundRect(ctx, bumper.x, bumper.y, bumper.w, bumper.h, 12);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.62;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bumper.x + 9, bumper.y + 9);
      ctx.lineTo(bumper.x + bumper.w - 9, bumper.y + 9);
      ctx.stroke();

      ctx.fillStyle = 'rgba(217, 247, 255, 0.55)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(bumper.x + bumper.w * (0.28 + i * 0.22), bumper.y + bumper.h - 13, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16;
    }
    ctx.restore();
  }

  function drawSlingshot() {
    const pull = drag.active && phase === 'aiming' ? getPull() : { px: 0, py: -62 };
    const pouchX = clamp(SLING.x + pull.px, 58, W - 58);
    const pouchY = Math.min(1136, SLING.y + pull.py);

    const glow = ctx.createRadialGradient(SLING.x, SLING.y + 30, 10, SLING.x, SLING.y + 30, 130);
    glow.addColorStop(0, 'rgba(94, 234, 212, 0.12)');
    glow.addColorStop(1, 'rgba(94, 234, 212, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(SLING.x, SLING.y + 30, 130, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c4d63';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y + 36);
    ctx.lineTo(SLING.x, SLING.y - 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y - 14);
    ctx.quadraticCurveTo(326, 976, 318, 944);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y - 14);
    ctx.quadraticCurveTo(394, 976, 402, 944);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(191, 243, 255, 0.72)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y + 34);
    ctx.lineTo(SLING.x, SLING.y - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y - 12);
    ctx.quadraticCurveTo(326, 976, 318, 944);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(SLING.x, SLING.y - 12);
    ctx.quadraticCurveTo(394, 976, 402, 944);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(318, 944);
    ctx.lineTo(pouchX, pouchY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(402, 944);
    ctx.lineTo(pouchX, pouchY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pouchX, pouchY, 27, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5, 20, 34, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(157, 228, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '30px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ICONS[selectedPod] || ICONS.spike, pouchX, pouchY + 1);
    ctx.restore();
  }

  function traceAimPath(dir) {
    const trace = traceWallPath(SLING.x, SLING.spawnY, dir.x, dir.y, {
      maxLen: 1100,
      maxBounces: 3,
      bumpers,
    });
    const points = [trace.points[0]];
    for (let i = 1; i < trace.points.length; i++) {
      const a = points[points.length - 1];
      const b = trace.points[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen < 1) continue;
      const d = raycast(a.x, a.y, dx / segLen, dy / segLen, segLen);
      if (d !== null) {
        points.push({ x: a.x + (dx / segLen) * d, y: a.y + (dy / segLen) * d });
        return { points, hitCell: true };
      }
      points.push(b);
    }
    return { points, hitCell: false };
  }

  function drawAim() {
    if (!drag.active || phase !== 'aiming' || pods[selectedPod] <= 0) return;
    const pull = getPull();
    const len = Math.hypot(pull.px, pull.py);
    if (len < MIN_PULL) return;
    const dir = { x: -pull.px / len, y: -pull.py / len };
    if (dir.y > -0.12) return;

    const path =
      selectedPod === 'ghost'
        ? {
            points: [
              { x: SLING.x, y: SLING.spawnY },
              { x: SLING.x + dir.x * 1100, y: SLING.spawnY + dir.y * 1100 },
            ],
            hitCell: false,
          }
        : traceAimPath(dir);
    const maxLen = 1100;
    let travelled = 0;

    for (let i = 1; i < path.points.length; i++) {
      const a = path.points[i - 1];
      const b = path.points[i];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (segLen < 1) continue;
      const steps = Math.max(1, Math.ceil(segLen / 24));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const alpha = 0.55 * (1 - (travelled + segLen * t) / maxLen) + 0.08;
        ctx.globalAlpha = Math.max(0.08, alpha);
        ctx.fillStyle = selectedPod === 'ghost' ? '#c4b5fd' : accent;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      travelled += segLen;
    }
    ctx.globalAlpha = 1;

    if (path.hitCell) {
      const end = path.points[path.points.length - 1];
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(end.x, end.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const a = (i / Math.max(1, p.trail.length)) * 0.3;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.type === 'ghost' ? '#c4b5fd' : p.type === 'split-child' ? '#fda4af' : '#bff3ff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (p.type === 'spike') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(time * 8);
        ctx.fillStyle = '#f4fdff';
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const rr = i % 2 ? 6 : 16;
          const a = (i * Math.PI) / 4;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (p.state === 'stuck') {
          ctx.strokeStyle = `rgba(255, 230, 163, ${0.45 + 0.35 * Math.sin(time * 22)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 22 + Math.sin(time * 18) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (p.type === 'ghost') {
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 22);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        g.addColorStop(0.5, 'rgba(196, 181, 253, 0.7)');
        g.addColorStop(1, 'rgba(196, 181, 253, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3b2a63';
        ctx.beginPath();
        ctx.arc(p.x - 5, p.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(p.x + 5, p.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'copter') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#d9f7ff';
        ctx.beginPath();
        ctx.arc(0, 5, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 3;
        const a = time * 18;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 18, -8 + Math.sin(a) * 4);
        ctx.lineTo(-Math.cos(a) * 18, -8 - Math.sin(a) * 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -18);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'split') {
        ctx.fillStyle = '#ffe4f0';
        for (const off of [-8, 0, 8]) {
          ctx.beginPath();
          ctx.arc(p.x + off, p.y + (off === 0 ? -5 : 4), 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#ffe4f0';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCrystals() {
    for (const c of crystals) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(time * 4 + c.x * 0.01);
      ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#d9f7ff';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawExplosions() {
    for (const e of explosions) {
      const t = 1 - e.life / e.maxLife;
      const r = e.maxR * (1 - Math.pow(1 - t, 2.2));
      ctx.globalAlpha = Math.max(0, 1 - t);
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(1, r));
      if (e.kind === 'core') {
        g.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
        g.addColorStop(0.3, 'rgba(251, 191, 36, 0.58)');
        g.addColorStop(1, 'rgba(251, 191, 36, 0)');
      } else {
        g.addColorStop(0, 'rgba(255, 255, 255, 0.82)');
        g.addColorStop(0.35, 'rgba(125, 211, 252, 0.42)');
        g.addColorStop(1, 'rgba(125, 211, 252, 0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = e.kind === 'core' ? 'rgba(255, 214, 102, 0.92)' : 'rgba(191, 243, 255, 0.82)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(1, r * 0.9), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      if (p.kind === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.7, p.size * 0.7);
        ctx.lineTo(-p.size * 0.7, p.size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'cell') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const g = ctx.createLinearGradient(-p.size / 2, -p.size / 2, p.size / 2, p.size / 2);
        g.addColorStop(0, '#f4fdff');
        g.addColorStop(0.5, p.color);
        g.addColorStop(1, '#6fc9ea');
        ctx.fillStyle = g;
        roundRect(ctx, -p.size / 2, -p.size / 2, p.size, p.size, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    ctx.save();
    if (shake > 0.2) ctx.translate(rand(-shake, shake), rand(-shake, shake));
    drawSculptureOutline();
    drawCells();
    drawCores();
    drawWalls();
    drawSlingshot();
    drawAim();
    drawProjectiles();
    drawCrystals();
    drawExplosions();
    drawParticles();
    ctx.restore();

    drawVignette();
  }

  function update(dt) {
    time += dt;
    updateAmbient(dt);
    updateProjectiles(dt);
    updateCrystals(dt);
    updatePending(dt);
    updateExplosions(dt);
    updateParticles(dt);
    if (shake > 0) shake = Math.max(0, shake - 70 * dt);
    if (phase === 'flying') checkSettle();
    if (hudDirty) emit();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function buildAmbient() {
    ambient = [];
    for (let i = 0; i < 46; i++) {
      ambient.push({
        kind: 'star',
        x: rand(0, W),
        y: rand(0, 900),
        size: rand(0.6, 2.1),
        phase: rand(0, Math.PI * 2),
      });
    }
    for (let i = 0; i < 34; i++) {
      ambient.push({
        kind: 'snow',
        x: rand(0, W),
        y: rand(0, H),
        size: rand(1.1, 2.7),
        speed: rand(8, 28),
        alpha: rand(0.12, 0.34),
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  buildAmbient();
  reset();

  return {
    level,
    start() {
      if (running) return;
      running = true;
      startMusic(config.loop);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    destroy() {
      running = false;
      stopMusic();
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    },
    reset,
    selectPod,
  };
}
