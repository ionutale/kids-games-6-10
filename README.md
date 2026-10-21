# Kids Games 5–8

The older-sibling hub for ages 6–10. First game: **Frost Breaker**.

## Status: prototype

This repository currently contains a **throwaway playable prototype**, not production code.

Open:

```sh
open prototype/frost-breaker.html
```

No build step, no dependencies, no persistence. The prototype answers one question: **is the launch-and-shatter loop fun for 6–10 year olds?**

## What to try

- Pick a pod from the bottom tray.
- Drag down/back from the slingshot, then release.
- Aim for the glowing crystal cores — they chain through the ice.
- Clear 90% to finish; 95% is two stars; 100% is a perfect shatter.
- Below 90% with no pods left = gentle retry card, no punishment.
- `D` toggles the debug readout. `R` resets the sculpture.

## Locked design decisions (from the grill)

- Faithful Amazing Breaker adaptation: four pods, 90% clear, 1–3 stars, soft fail + retry.
- Friendly ice poppers: no fire, smoke, or war imagery.
- All four pods available from the start, with limited counts.
- Drag-back slingshot, dotted aim line, straight flight.
- Pods: Spike, Ghost (swipe-steer), Copter (drop trail), Split (three).
- 1–3 crystal cores per sculpture.
- 10 recognizable silhouettes on the shared 10-level ladder.
- Frosted-aurora art direction; hand-rolled AABB + destructible cell grid.
- Locales at launch: en / it / ro / de / fr / zh.
- Fresh SvelteKit app with deliberate ports from the 2–5 hub (PWA, audio, ladder, shell, tests).

## Prototype success bar

A 6-year-old clears the Star with 4–6 pods, uses at least two pod types, understands the 90% card, and asks to play again. Plus 60fps on an iPad and deterministic physics tests.

## Next step

If the prototype feels right, scaffold the SvelteKit app and build the 10-level game.
