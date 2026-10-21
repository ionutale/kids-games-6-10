export const PASS_PCT = 0.9;
export const TWO_STAR_PCT = 0.95;
export const POD_IDS = ['spike', 'ghost', 'copter', 'split'];

export function percentage(cleared, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(1, cleared / total));
}

export function passes(cleared, total) {
  return percentage(cleared, total) >= PASS_PCT;
}

export function starsFor(cleared, total) {
  if (!total || cleared >= total) return total ? 3 : 0;
  const pct = percentage(cleared, total);
  if (pct >= TWO_STAR_PCT) return 2;
  if (pct >= PASS_PCT) return 1;
  return 0;
}

/** HUD number: never show 100 until every cell is actually gone. */
export function shownPct(cleared, total) {
  if (!total) return 0;
  if (cleared >= total) return 100;
  return Math.min(99, Math.floor(percentage(cleared, total) * 100));
}

export function allPodsUsed(pods) {
  return POD_IDS.every((id) => Number(pods?.[id] ?? 0) <= 0);
}
