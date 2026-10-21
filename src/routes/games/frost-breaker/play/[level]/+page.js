import { redirect } from '@sveltejs/kit';
import { clampFrostLevel, levelToWorld } from '$lib/frost-breaker/levels.js';
import { isWorldUnlocked, loadProgress } from '$lib/frost-breaker/progress.js';

export const prerender = false;
export const ssr = false;

/** Client-only world gate: deep links into sealed worlds bounce back to the map. */
export function load({ params }) {
  const level = clampFrostLevel(params.level);
  if (!isWorldUnlocked(loadProgress(), levelToWorld(level))) {
    throw redirect(307, '/games/frost-breaker');
  }
  return {};
}
