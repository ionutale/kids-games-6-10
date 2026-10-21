// Frost Breaker audio: locally generated samples from the Studio app
// (Stable Audio 3) with procedural WebAudio as the offline/first-load fallback.
// No third-party sample packs, no network at runtime beyond the app's own files.

const SOUND_FILES = {
  tap: '/audio/tap.mp3',
  launch: '/audio/launch.mp3',
  stick: '/audio/stick.mp3',
  crack: '/audio/crack.mp3',
  crystal: '/audio/crystal.mp3',
  bounce: '/audio/bounce.mp3',
  split: '/audio/split.mp3',
  core: '/audio/core.mp3',
  win: '/audio/win.mp3',
  softfail: '/audio/softfail.mp3',
};

const MUSIC_FILES = {
  garden: '/audio/garden-loop.mp3',
  frost: '/audio/frost-loop.mp3',
  royal: '/audio/royal-loop.mp3',
};

/** Used when a world's loop has not decoded yet (or its file is missing). */
const MUSIC_FALLBACK = 'frost';
const MUSIC_FADE = 0.7;

let muted = false;
let ctx = null;
let master = null;
let musicBus = null;
let musicWanted = false;
let musicTrack = MUSIC_FALLBACK;
let musicSource = null;
let loadStarted = false;
const musicBuffers = new Map();
const samples = new Map();

function ensureGraph() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.22;
    musicBus.connect(master);
  }
  return ctx;
}

export function setMuted(value) {
  muted = Boolean(value);
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.06);
  }
}

export function isMuted() {
  return muted;
}

export function unlockAudio() {
  const a = ensureGraph();
  if (!a) return null;
  if (a.state === 'suspended') {
    a.resume()
      .then(() => {
        maybeStartMusic();
      })
      .catch(() => {});
  }
  loadAudio();
  maybeStartMusic();
  return a;
}

function loadAudio() {
  if (loadStarted || !ctx) return;
  loadStarted = true;

  for (const [name, url] of Object.entries(SOUND_FILES)) {
    fetch(url)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((data) => (data ? ctx.decodeAudioData(data) : null))
      .then((buffer) => {
        if (buffer) samples.set(name, buffer);
      })
      .catch(() => {});
  }

  for (const [name, url] of Object.entries(MUSIC_FILES)) {
    fetch(url)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((data) => (data ? ctx.decodeAudioData(data) : null))
      .then((buffer) => {
        if (!buffer) return;
        musicBuffers.set(name, buffer);
        maybeStartMusic();
      })
      .catch(() => {});
  }
}

/** Decoded buffer for a track, falling back to the frost loop while others load. */
function resolveTrack(track) {
  const direct = musicBuffers.get(track);
  if (direct) return { key: track, buffer: direct };
  const fallback = musicBuffers.get(MUSIC_FALLBACK);
  if (fallback) return { key: MUSIC_FALLBACK, buffer: fallback };
  return null;
}

function fadeOutMusic({ source, gain }) {
  if (!ctx) return;
  try {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    source.stop(ctx.currentTime + MUSIC_FADE);
  } catch {
    // already stopped
  }
}

function maybeStartMusic() {
  if (!musicWanted || !ctx || ctx.state !== 'running') return;
  const track = resolveTrack(musicTrack);
  if (!track) return;
  if (musicSource && musicSource.key === track.key) return;

  if (musicSource) {
    fadeOutMusic(musicSource);
    musicSource = null;
  }

  const source = ctx.createBufferSource();
  source.buffer = track.buffer;
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(musicBus);
  source.start();
  gain.gain.setTargetAtTime(1, ctx.currentTime, 0.9);
  musicSource = { key: track.key, source, gain };
}

export function startMusic(track = MUSIC_FALLBACK) {
  musicTrack = MUSIC_FILES[track] ? track : MUSIC_FALLBACK;
  musicWanted = true;
  unlockAudio();
  maybeStartMusic();
}

export function stopMusic() {
  musicWanted = false;
  if (!musicSource || !ctx) return;
  const current = musicSource;
  musicSource = null;
  fadeOutMusic(current);
}

function playSample(name, volume = 0.6, rate = 1) {
  if (muted || !ctx || ctx.state !== 'running') return false;
  const buffer = samples.get(name);
  if (!buffer) return false;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(master);
  source.start();
  return true;
}

// ---------- procedural fallback ----------

function toneAt(freq, dur, type = 'sine', vol = 0.04, delay = 0, slide = 0) {
  if (muted) return;
  const a = ensureGraph();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(32, freq + slide), t + dur);
  gain.gain.setValueAtTime(Math.max(0.0001, vol), t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

function noiseAt(dur = 0.14, vol = 0.035, freq = 1200, delay = 0) {
  if (muted) return;
  const a = ensureGraph();
  if (!a) return;
  const t = a.currentTime + delay;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buffer = a.createBuffer(1, len, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 0.8;
  const gain = a.createGain();
  gain.gain.setValueAtTime(Math.max(0.0001, vol), t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + dur);
}

function fallbackTap() {
  toneAt(620, 0.05, 'triangle', 0.02);
}

function fallbackLaunch() {
  noiseAt(0.16, 0.028, 1900);
  toneAt(430, 0.16, 'triangle', 0.025, 0, -220);
}

function fallbackStick() {
  toneAt(760, 0.045, 'square', 0.018);
}

function fallbackCrack() {
  noiseAt(0.12, 0.035, 2500);
  toneAt(980, 0.1, 'sine', 0.02, 0, -260);
}

function fallbackCrystal() {
  toneAt(1320, 0.09, 'sine', 0.018, 0, -420);
}

function fallbackBounce() {
  noiseAt(0.08, 0.02, 2000);
  toneAt(520, 0.08, 'triangle', 0.022, 0, -180);
}

function fallbackSplit() {
  toneAt(540, 0.08, 'triangle', 0.025, 0, 280);
  toneAt(760, 0.08, 'triangle', 0.02, 0.06, 220);
}

function fallbackCore() {
  toneAt(110, 0.5, 'sine', 0.06, 0, -38);
  noiseAt(0.38, 0.045, 520);
  toneAt(880, 0.18, 'sine', 0.025, 0.02, 260);
}

function fallbackWin(stars = 1) {
  const notes =
    stars >= 3 ? [523, 659, 784, 1046, 1318] : stars === 2 ? [523, 659, 784, 1046] : [523, 659, 784];
  notes.forEach((n, i) => toneAt(n, 0.28, 'triangle', 0.035, i * 0.12));
}

function fallbackSoftFail() {
  toneAt(392, 0.28, 'sine', 0.025);
  toneAt(330, 0.36, 'sine', 0.022, 0.16);
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__frostAudio = {
    get state() {
      return ctx?.state ?? null;
    },
    get loaded() {
      return [...samples.keys()];
    },
    get musicBuffer() {
      return musicBuffers.has(musicTrack);
    },
    get musicTracks() {
      return [...musicBuffers.keys()];
    },
    get musicTrack() {
      return musicTrack;
    },
    get musicPlaying() {
      return musicSource ? musicSource.key : null;
    },
    get muted() {
      return muted;
    },
  };
}

export const sfx = {
  tap() {
    if (!playSample('tap', 0.45)) fallbackTap();
  },
  launch() {
    if (!playSample('launch', 0.65)) fallbackLaunch();
  },
  stick() {
    if (!playSample('stick', 0.55)) fallbackStick();
  },
  crack() {
    if (!playSample('crack', 0.62)) fallbackCrack();
  },
  crystal() {
    if (!playSample('crystal', 0.55)) fallbackCrystal();
  },
  bounce() {
    if (!playSample('bounce', 0.5)) fallbackBounce();
  },
  split() {
    if (!playSample('split', 0.62)) fallbackSplit();
  },
  core() {
    if (!playSample('core', 0.82)) fallbackCore();
  },
  win(stars = 1) {
    if (!playSample('win', 0.8)) fallbackWin(stars);
  },
  softFail() {
    if (!playSample('softfail', 0.55)) fallbackSoftFail();
  },
};
