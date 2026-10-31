# Kids Games 6–10

Big-kid games for ages 6–10. Frost Breaker, Aurora Mirrors, Penguin Code, and Number Ice.

Frost Breaker: aim ice poppers at a frozen sculpture, chain the glowing crystal cores, and clear 90% before the pods run out. The shipped campaign runs 10 worlds of 5 levels each: 20 hand-built silhouettes and 30 remixes, four pod behaviours, 90/95/100 star thresholds, a gentle “so close” retry, and no lost progress.

Aurora Mirrors: rotate mirrors to bend a light beam through an ice grid and wake every crystal. The campaign runs six worlds of five handcrafted levels, with par-move three-star goals, sequential world unlocks, and its own save file.

Penguin Code: build a short sequence of arrow commands and guide a penguin around walls and water to every fish and the igloo. Six worlds of five levels, a command limit, stars for shorter programs, original SVG art, a spatial D-pad, and a live route preview.

Number Ice: tap 2–4 numbers that add up to the target, melt them, and let the ice fall and refill. Six worlds of five levels, par-move stars, and its own save file.

## Status

Playable production games: hub + Frost Breaker (50 levels) + Aurora Mirrors (30 levels) + Penguin Code (30 levels) + Number Ice (30 levels), six locales, PWA offline, generated audio.

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

Requires Node 20+ and pnpm. Deploy the static build to Cloudflare Workers with `pnpm deploy`; `wrangler.jsonc` serves `build/` with SPA fallback. The custom domain is `kids-games-6-10.aiu-media.com`.

## What is in the box

- **Hub** (`/`) — frosted-aurora game launcher, campaign progress, and a link to settings.
- **Settings** (`/settings`) — persisted music and sound-effects volume, mute, and a six-language picker.
- **Penguin Code** (`/games/penguin-code`) — six-world command-programming game with its own `penguinCode1` save.
- **Penguin Code world** (`/games/penguin-code/world/[1–6]`) — five level nodes, command limits, stars, and sequential world locks.
- **Penguin Code game** (`/games/penguin-code/play/[1–30]`) — 7×7 grid, spatial D-pad, live dashed route preview, arrow program builder, step-by-step penguin run, fish and water rules, undo/reset, and a star result.
- **Number Ice** (`/games/number-ice`) — six-world number-matching puzzle with sequential unlocks, par-move stars, and its own `numberIce1` save.
- **Number Ice world** (`/games/number-ice/world/[1–6]`) — five level nodes with target sums, move budgets, stars, and world unlock state.
- **Number Ice game** (`/games/number-ice/play/[1–30]`) — 5×5 to 7×7 ice grid, tap 2–4 tiles that sum to the target, melt/fall/refill, and a star result.
- **Number Ice rules** (`src/lib/number-ice/board.js`, `levels.js`) — seeded boards, deterministic 2–4 tile selection search, guaranteed legal moves after refills, and 30 validated levels.
- **Number Ice progress** (`src/lib/number-ice/progress.js`) — fresh `numberIce1` save key, best stars, and sequential world unlocks.
- **Aurora Mirrors** (`/games/aurora-mirrors`) — six-world map with sequential unlocks, par-move stars, and its own `auroraMirrors1` save.
- **Aurora world** (`/games/aurora-mirrors/world/[1–6]`) — five level nodes, stars, par, and world unlock state.
- **Aurora game** (`/games/aurora-mirrors/play/[1–30]`) — 7×7 beam puzzle with tap-rotate mirrors, undo/reset, live crystals, all-edge emitters, and a best-score result card.
- **Frost Breaker world map** (`/games/frost-breaker`) — ten world cards with best stars and “how to play” cards. Worlds open in order; each open world shows its five levels.
- **World page** (`/games/frost-breaker/world/[1–10]`) — five level nodes, free to pick in any order inside an open world.
- **Game** (`/games/frost-breaker/play/[1–50]`) — 720×1280 playfield, drag-back slingshot, dotted bank-shot aim preview, live 90% HUD, pod tray, soft-fail and star result overlays.
- **Pod guide** (`/games/frost-breaker/guide`) — four illustrated projectile cards explaining Spike, Ghost, Copter, and Split, with best-use tips and a current-level play link.
- **Campaign** (`src/lib/frost-breaker/levels.js`) — 10 worlds × 5 levels. 20 unique silhouettes, with the other 30 levels remixing them through scale, core count and bumpers. Pod totals climb 5→14; crystal cores run 1→3.
- **Rules** (`src/lib/frost-breaker/rules.js`) — 90% clears, 95% is two stars, 100% is three; no 100% display until every cell is gone.
- **Progress** (`src/lib/frost-breaker/progress.js`) — fresh `frostBreaker2` save key; older star data is deliberately ignored. Completing all five levels of a world at 90% or better opens the next world.
- **Engine** (`src/lib/frost-breaker/engine.js`, `walls.js`) — deterministic cell fracture, connected-mass collapse, spike/ghost/copter/split behaviours, outer side rails and ceiling with an open bottom, 0–2 interior bumpers per level, bank-shot aim preview, and a short-fuse split pod that fans into three. Particles and screen shake.
- **Aurora rules** (`src/lib/aurora/beam.js`, `levels.js`) — pure beam reflection, wall blocking, 30 validated levels, a full-orientation solver, sequential world unlocks, and par-move star thresholds.
- **Penguin Code rules** (`src/lib/penguin-code/rules.js`, `levels.js`) — step simulator, BFS command solver, wall/water/fish rules, and 30 validated levels.
- **Audio** (`src/lib/frost-breaker/audio.js`, `static/audio/`) — Studio-generated SFX and three seamless Studio music loops: garden, frost, royal, with a procedural WebAudio fallback. See [docs/audio.md](docs/audio.md).
- **Locales** — en, it, ro, de, fr, zh; every key is parity-tested.
- **PWA** — static adapter, build-versioned service worker precache, network-only navigation with a precached shell for offline deep links, and automatic stale-build recovery plus a one-tap repair.

## Layout

```
src/
  app.css                     design tokens + frosted-aurora shell
  lib/
    components/               SoundToggle, GameShell, UiIcon, FrostGame, ShapePreview, WinOverlay
    frost-breaker/            audio, engine, grid, levels, progress, rules, shapes, walls
    number-ice/               board rules, levels, NumberIceGame, progress
    penguin-code/             rules, levels, PenguinCodeGame, PenguinArt, progress
    aurora/                   beam rules, levels, AuroraGame, progress
    i18n/messages.js          six-locale catalogs
    stores/                   locale + settings
  routes/
    +page.svelte              hub
    games/frost-breaker/      world map
    games/frost-breaker/world/[n]/   world page
    games/frost-breaker/play/[level]/ game
    games/number-ice/         number-matching game
    games/number-ice/world/[n]/      world page
    games/number-ice/play/[level]/   game
    games/penguin-code/       command-programming game
    games/penguin-code/world/[n]/    world page
    games/penguin-code/play/[level]/ game
    games/aurora-mirrors/     beam puzzle game
    games/aurora-mirrors/world/[n]/  world page
    games/aurora-mirrors/play/[level]/ game
static/audio/                 generated SFX + three music loops
static/icons/                 app icon
tests/unit/                   rules, levels, progress, stars, walls, locale parity, PWA config
docs/audio.md                 sound provenance + prompts
docs/playtest.md              playtest plan and tuning scorecard
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
- Number Ice uses six worlds of five levels, 5×5 → 7×7 seeded boards, and 2–4 tile selections that sum to the target.
- Number Ice always guarantees a legal move after a refill, and stars follow par moves (3 at par, 2 within two extra moves, else 1).
- Penguin Code is emoji-free: original inline SVG art and icons replace every pictograph, and a unit test guards the rule.
- Frosted-aurora art direction; fresh SvelteKit app with deliberate ports from the 2–5 hub (PWA, shell, audio patterns).

## Naming

The display name is **Kids Games 6–10**. The repository directory and package name stay `kids-games-5-8` for continuity with the project’s original home.

## Next

- Run the [playtest plan](docs/playtest.md) with a 6–10 year old and record notes in the scorecard.
- Tune Frost Breaker pod counts and core placement from playtest notes.
- Tune Aurora Mirrors’ later-world mirror density.
- Tune Penguin Code’s later-world command limits and water density.
- Tune Number Ice’s later-world targets, goals, move budgets, and par.
- Final ice-sculpture art pass (the current silhouettes are deliberately blocky cell mosaics).
- End-to-end browser coverage for hub → world map → world → game → result → next level, plus stale-build recovery and offline launch.
- Physical iOS and Android checks for install, offline launch, audio unlock, safe areas, and touch targets.
