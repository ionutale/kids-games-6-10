import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  MUSIC_KEY,
  SFX_KEY,
  clampVolume,
  loadVolumes,
  saveVolumes,
} from '$lib/frost-breaker/volume.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
});

afterEach(() => {
  delete globalThis.localStorage;
});

describe('volume defaults', () => {
  it('exposes the documented defaults and storage keys', () => {
    expect(DEFAULT_MUSIC_VOLUME).toBe(0.6);
    expect(DEFAULT_SFX_VOLUME).toBe(0.85);
    expect(MUSIC_KEY).toBe('kids-games-music-volume');
    expect(SFX_KEY).toBe('kids-games-sfx-volume');
  });

  it('loads defaults when nothing has been saved', () => {
    expect(loadVolumes()).toEqual({ music: DEFAULT_MUSIC_VOLUME, sfx: DEFAULT_SFX_VOLUME });
  });
});

describe('clampVolume', () => {
  it('passes through finite values inside 0..1', () => {
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(0.37)).toBe(0.37);
    expect(clampVolume(1)).toBe(1);
    expect(clampVolume('0.5')).toBe(0.5);
  });

  it('clamps finite values outside the range', () => {
    expect(clampVolume(-2)).toBe(0);
    expect(clampVolume(4)).toBe(1);
    expect(clampVolume(-0.0001)).toBe(0);
  });

  it('returns the fallback for non-finite input', () => {
    expect(clampVolume(NaN)).toBe(0);
    expect(clampVolume(Infinity)).toBe(0);
    expect(clampVolume(-Infinity, 0.4)).toBe(0.4);
    expect(clampVolume('loud', 0.25)).toBe(0.25);
    expect(clampVolume(undefined, 0.85)).toBe(0.85);
  });
});

describe('persistence', () => {
  it('round-trips both volumes through storage', () => {
    saveVolumes({ music: 0.25, sfx: 0.5 });
    expect(loadVolumes()).toEqual({ music: 0.25, sfx: 0.5 });
  });

  it('writes plain numbers under the documented keys', () => {
    saveVolumes({ music: 0.3, sfx: 0.9 });
    expect(localStorage.getItem(MUSIC_KEY)).toBe('0.3');
    expect(localStorage.getItem(SFX_KEY)).toBe('0.9');
  });

  it('clamps values before saving', () => {
    saveVolumes({ music: 5, sfx: -3 });
    expect(loadVolumes()).toEqual({ music: 1, sfx: 0 });
  });

  it('falls back per key for missing, blank, or malformed values', () => {
    saveVolumes({ music: 0.4, sfx: 0.7 });

    localStorage.setItem(MUSIC_KEY, '{not json');
    expect(loadVolumes().music).toBe(DEFAULT_MUSIC_VOLUME);

    localStorage.setItem(MUSIC_KEY, '');
    expect(loadVolumes().music).toBe(DEFAULT_MUSIC_VOLUME);

    localStorage.setItem(MUSIC_KEY, JSON.stringify({ value: 0.3 }));
    expect(loadVolumes().music).toBe(DEFAULT_MUSIC_VOLUME);

    localStorage.setItem(SFX_KEY, 'NaN');
    expect(loadVolumes().sfx).toBe(DEFAULT_SFX_VOLUME);
  });

  it('accepts JSON-quoted strings and plain numbers', () => {
    localStorage.setItem(MUSIC_KEY, JSON.stringify('0.42'));
    localStorage.setItem(SFX_KEY, '0.31');
    expect(loadVolumes()).toEqual({ music: 0.42, sfx: 0.31 });
  });

  it('clamps stored values that are out of range', () => {
    localStorage.setItem(MUSIC_KEY, '2');
    localStorage.setItem(SFX_KEY, '-1');
    expect(loadVolumes()).toEqual({ music: 1, sfx: 0 });
  });
});

describe('no localStorage', () => {
  it('loads defaults and saves without throwing', () => {
    delete globalThis.localStorage;
    expect(loadVolumes()).toEqual({ music: DEFAULT_MUSIC_VOLUME, sfx: DEFAULT_SFX_VOLUME });
    expect(() => saveVolumes({ music: 0.2, sfx: 0.3 })).not.toThrow();
  });

  it('survives throwing storage access', () => {
    globalThis.localStorage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(loadVolumes()).toEqual({ music: DEFAULT_MUSIC_VOLUME, sfx: DEFAULT_SFX_VOLUME });
    expect(() => saveVolumes({ music: 0.2, sfx: 0.3 })).not.toThrow();
  });
});
