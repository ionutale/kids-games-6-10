# Kids Games 6–10

Big-kid games for ages 6–10. First game: **Frost Breaker**.

Aim ice poppers at a frozen sculpture, chain the glowing crystal cores, and clear 90% before the pods run out. The shipped campaign runs 10 worlds of 5 levels each: 20 hand-built silhouettes and 30 remixes, four pod behaviours, 90/95/100 star thresholds, a gentle “so close” retry, and no lost progress.

## Status

Playable production campaign: hub + Frost Breaker + 50 levels across 10 worlds, six locales, PWA offline, generated audio.

The throwaway one-sculpture feel test is preserved on the `prototype/frost-breaker` branch and in `prototype/frost-breaker.html`.

## Quick start

```bash
pnpm install
pnpm dev
```

| Command        | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `pnpm dev`     | Vite dev server                                                   |
| `pnpm check`   | SvelteKit sync + svelte-check                                     |
| `pnpm test`    | Vitest rules, levels, progress, stars, walls, locale parity tests |
| `pnpm build`   | Static PWA build into `build/`                                    |
| `pnpm preview` | Preview the production build                                      |
| `pnpm lint`    | Prettier check                                                    |
| `pnpm format`  | Prettier write                                                    |

Requires Node 20+ and pnpm. Deploy the static build to Cloudflare Workers with `pnpm deploy`; `wrangler.jsonc` serves `build/` with SPA fallback. The custom domain is `kids-games-6-10.aiu-media.com` once attached.

## What is in the box

- **Hub** (`/`) — frosted-aurora game launcher, campaign progress, and a link to settings.
- **Settings** (`/settings`) — persisted music and sound-effects volume, mute, and a six-language picker.
- **World map** (`/games/frost-breaker`) — ten world cards with best stars and “how to play” cards. Worlds open in order; each open world shows its five levels.
- **World page** (`/games/frost-breaker/world/[1–10]`) — five level nodes, free to pick in any order inside an open world.
- **Game** (`/games/frost-breaker/play/[1–50]`) — 720×1280 playfield, drag-back slingshot, dotted bank-shot aim preview, live 90% HUD, pod tray, soft-fail and star result overlays.
- **Campaign** (`src/lib/frost-breaker/levels.js`) — 10 worlds × 5 levels. 20 unique silhouettes, with the other 30 levels remixing them through scale, core count and bumpers. Pod totals climb 5→14; crystal cores run 1→3.
- **Rules** (`src/lib/frost-breaker/rules.js`) — 90% clears, 95% is two stars, 100% is three; no 100% display until every cell is gone.
- **Progress** (`src/lib/frost-breaker/progress.js`) — fresh `frostBreaker2` save key; older star data is deliberately ignored. Completing all five levels of a world at 90% or better opens the next world.
- **Engine** (`src/lib/frost-breaker/engine.js`, `walls.js`) — deterministic cell fracture, connected-mass collapse, spike/ghost/copter/split behaviours, outer side rails and ceiling with an open bottom, 0–2 interior bumpers per level, bank-shot aim preview, and a short-fuse split pod that fans into three. Particles and screen shake.
- **Audio** (`src/lib/frost-breaker/audio.js`, `static/audio/`) — Studio-generated SFX and three seamless Studio music loops: garden, frost, royal, with a procedural WebAudio fallback. See [docs/audio.md](docs/audio.md).
- **Locales** — en, it, ro, de, fr, zh; every key is parity-tested.
- **PWA** — static adapter, service worker precache, manifest, offline deep links.

## Layout

```
src/
  app.css                     design tokens + frosted-aurora shell
  lib/
    components/               SoundToggle, GameShell, FrostGame, ShapePreview, WinOverlay
    frost-breaker/            audio, engine, grid, levels, progress, rules, shapes, walls
    i18n/messages.js          six-locale catalogs
    stores/                   locale + settings
  routes/
    +page.svelte              hub
    games/frost-breaker/      world map
    games/frost-breaker/world/[n]/   world page
    games/frost-breaker/play/[level]/ game
static/audio/                 generated SFX + three music loops
static/icons/                 app icon
tests/unit/                   rules, levels, progress, stars, walls, locale parity
docs/audio.md                 sound provenance + prompts
prototype/frost-breaker.html  throwaway feel test
```

## Locked design decisions

- Faithful Amazing Breaker adaptation: four pods, 90% clear, 1–3 stars, soft fail + retry.
- Friendly ice poppers; no fire, smoke, or war imagery.
- All four pods available from level 1, limited counts per level (5→14 across the campaign).
- Drag-back slingshot, dotted bank-shot aim line.
- Spike · Ghost (swipe-steer) · Copter (drop trail) · Split (short fuse, three).
- 1–3 crystal cores per sculpture; hitting one chain-shatters a radius.
- Ten worlds of five levels; sequential worlds, free-pick inside an open world.
- Frosted side rails and ceiling, 0–2 interior bumpers, hand-rolled AABB + destructible cell grid.
- Frosted-aurora art direction; fresh SvelteKit app with deliberate ports from the 2–5 hub (PWA, shell, audio patterns).

## Naming

The display name is **Kids Games 6–10**. The repository directory and package name stay `kids-games-5-8` for continuity with the project’s original home.

## Next

- Owner playtest with a 6–10 year old; tune pod counts and core placement from notes.
- Final ice-sculpture art pass (the current silhouettes are deliberately blocky cell mosaics).
- Attach `kids-games-6-10.aiu-media.com` to the Worker.
- End-to-end browser coverage for hub → world map → world → game → result → next level.
