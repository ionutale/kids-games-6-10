import { writable, derived } from 'svelte/store';
import { MESSAGES, LOCALES } from '$lib/i18n/messages.js';

const STORAGE_KEY = 'kids-games-5-8-locale';
const SUPPORTED = new Set(LOCALES.map((l) => l.id));

function detect() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.has(saved)) return saved;
  }
  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const short = String(tag).slice(0, 2).toLowerCase();
      if (SUPPORTED.has(short)) return short;
    }
  }
  return 'en';
}

export const locale = writable(detect());

export const t = derived(locale, ($locale) => {
  const dict = MESSAGES[$locale] ?? MESSAGES.en;
  return (key, vars = {}) => {
    let text = dict[key] ?? MESSAGES.en[key] ?? key;
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
});

export function setLocale(id) {
  if (!SUPPORTED.has(id)) return;
  locale.set(id);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
}

export { LOCALES };
