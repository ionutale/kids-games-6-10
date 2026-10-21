import { writable } from 'svelte/store';
import { setMuted } from '$lib/frost-breaker/audio.js';

const STORAGE_KEY = 'kids-games-5-8-settings';

function load() {
  if (typeof localStorage === 'undefined') return { soundEnabled: true };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return { soundEnabled: raw?.soundEnabled ?? true };
  } catch {
    return { soundEnabled: true };
  }
}

const initial = load();
setMuted(!initial.soundEnabled);

function createSettings() {
  const { subscribe, update } = writable(initial);

  return {
    subscribe,
    toggleSound() {
      update((s) => {
        const next = { ...s, soundEnabled: !s.soundEnabled };
        setMuted(!next.soundEnabled);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
  };
}

export const settings = createSettings();
