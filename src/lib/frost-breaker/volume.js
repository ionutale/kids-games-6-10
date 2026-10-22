// Persisted music/SFX volume preferences, shared by the settings UI and the
// Frost Breaker audio graph. Values are always stored as plain numbers (0..1);
// reads stay tolerant of JSON-quoted numbers and older hand-edited values.

export const DEFAULT_MUSIC_VOLUME = 0.6;
export const DEFAULT_SFX_VOLUME = 0.85;
export const MUSIC_KEY = 'kids-games-music-volume';
export const SFX_KEY = 'kids-games-sfx-volume';

/** Finite numbers clamped to 0..1; anything else returns `fallback`. */
export function clampVolume(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

/** localStorage can be absent (SSR/tests) or throw (private mode); never assume it. */
function storage() {
  if (typeof localStorage === 'undefined' || !localStorage) return null;
  return localStorage;
}

function readStored(key, fallback) {
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw == null || String(raw).trim() === '') return fallback;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    if (parsed == null) return fallback;
    if (typeof parsed === 'string' && parsed.trim() === '') return fallback;
    return clampVolume(parsed, fallback);
  } catch {
    return fallback;
  }
}

/** Current preferences; defaults whenever storage is missing or malformed. */
export function loadVolumes() {
  return {
    music: readStored(MUSIC_KEY, DEFAULT_MUSIC_VOLUME),
    sfx: readStored(SFX_KEY, DEFAULT_SFX_VOLUME),
  };
}

/** Clamp and write both keys; silently no-ops without usable storage. */
export function saveVolumes({ music, sfx } = {}) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(MUSIC_KEY, String(clampVolume(music, DEFAULT_MUSIC_VOLUME)));
    store.setItem(SFX_KEY, String(clampVolume(sfx, DEFAULT_SFX_VOLUME)));
  } catch {
    // Quota or blocked storage: keep the in-memory value, skip persistence.
  }
}
