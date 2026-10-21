# Kids Games 6–10

Big-kid games for ages 6–10. First game: **Frost Breaker**.

Aim ice poppers at a frozen sculpture, chain the glowing crystal cores, and clear 90% before the pods run out. Ten hand-built silhouettes, four pod behaviours, 90/95/100 star thresholds, a gentle “so close” retry, and no lost progress.

## Status

Playable production vertical slice: hub + Frost Breaker + 10 levels, six locales, PWA offline, generated audio.

The throwaway one-sculpture feel test is preserved on the `prototype/frost-breaker` branch and in `prototype/frost-breaker.html`.

## Quick start

```bash
pnpm install
pnpm dev
```

| Command        | Description                            |
| -------------- | -------------------------------------- |
| `pnpm dev`     | Vite dev server                        |
| `pnpm check`   | SvelteKit sync + svelte-check          |
| `pnpm test`    | Vitest rules, grid, star, locale tests |
| `pnpm build`   | Static PWA build into `build/`         |
| `pnpm preview` | Preview the production build           |
| `pnpm lint`    | Prettier check                         |
| `pnpm format`  | Prettier write                         |

Requires Node 20+ and pnpm. Deploy the static build to Cloudflare Workers with `pnpm deploy`; `wrangler.jsonc` serves `build/` with SPA fallback.

## What is in the box

- **Hub** (`/`) — frosted-aurora game launcher, current-level mini ladder, sound/language settings.
- **Frost Breaker landing** (`/games/frost-breaker`) — free-pick 10-level grid with best stars, “how to play” cards.
- **Game** (`/games/frost-breaker/play/[1–10]`) — 720×1280 playfield, drag-back slingshot, dotted aim line, live 90% HUD, pod tray, soft-fail and star result overlays.
- **Rules** (`src/lib/frost-breaker/rules.js`) — 90% clears, 95% is two stars, 100% is three; no 100% display until every cell is gone.
- **Sculptures** (`src/lib/frost-breaker/shapes.js`) — star, fish, cat, rocket, castle, snowman, dinosaur, butterfly, lighthouse, crown. Cell-filled at 26 px; 1–3 crystal cores per sculpture.
- **Engine** (`src/lib/frost-breaker/engine.js`) — deterministic cell fracture, connected-mass collapse, spike/ghost/copter/split behaviours, frosted rails, bank-shot aim preview, particles and screen shake. Interior bumpers are supported by `walls.js` and land with the 50-level campaign.
- **Audio** (`src/lib/frost-breaker/audio.js`, `static/audio/`) — Studio-generated SFX and an 18.2 s seamless music loop, with a procedural WebAudio fallback. See [docs/audio.md](docs/audio.md).
- **Locales** — en, it, ro, de, fr, zh; every key is parity-tested.
- **PWA** — static adapter, service worker precache, manifest, offline deep links.

## Layout

```
src/
  app.css                     design tokens + frosted-aurora shell
  lib/
    components/               SoundToggle, GameShell, FrostGame, WinOverlay
    frost-breaker/            audio, engine, grid, levels, rules, shapes, progress
    i18n/messages.js          six-locale catalogs
    ladder/progress.js        shared 10-level ladder contract
    stores/                   locale + settings
  routes/
    +page.svelte              hub
    games/frost-breaker/      landing + play/[level]
static/audio/                 generated SFX + music loop
static/icons/                 app icon
tests/unit/                   rules, grid, stars, locale parity
docs/audio.md                 sound provenance + prompts
prototype/frost-breaker.html  throwaway feel test
```

## Locked design decisions

- Faithful Amazing Breaker adaptation: four pods, 90% clear, 1–3 stars, soft fail + retry.
- Friendly ice poppers; no fire, smoke, or war imagery.
- All four pods available from level 1, limited counts per level.
- Drag-back slingshot, dotted aim line, straight flight.
- Spike · Ghost (swipe-steer) · Copter (drop trail) · Split (three).
- 1–3 crystal cores per sculpture; hitting one chain-shatters a radius.
- Ten recognizable silhouettes on the shared 10-level ladder.
- Frosted-aurora art direction; hand-rolled AABB + destructible cell grid.
- Fresh SvelteKit app with deliberate ports from the 2–5 hub (PWA, ladder, shell, audio patterns).

## Naming

The display name is **Kids Games 6–10**. The repository directory and package name stay `kids-games-5-8` for continuity with the project’s original home.

## Next

- Owner playtest with a 6–10 year old; tune pod counts and core placement from notes.
- Final ice-sculpture art pass (the current silhouettes are deliberately blocky cell mosaics).
- More Studio sound variants and a second music loop.
- End-to-end Playwright coverage for hub → landing → game → result → next level.
- Deploy to Cloudflare Pages (`build/` + `static/_redirects`).
