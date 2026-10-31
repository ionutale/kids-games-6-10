# Playtest plan: ages 6–10

Use this for one 20–30 minute session per child. The goal is to find friction and tuning data, not to test the child. Observe first; coach only after a real stall.

## Before the session

- Use a phone in portrait. Repeat later on a tablet if available.
- Test Safari on iOS and Chrome on Android at least once each.
- Use a fresh browser profile or clear site data if you need level 1. Do not clear a child's existing stars without asking.
- Record the device, browser, age band (6–7, 8–9, 10), and prior puzzle-game experience.
- Say: "You can stop anytime. I am watching how the game feels, not testing you."
- Do not record photos or video without consent.

## Session shape (25 minutes)

1. **Hub, 3 minutes.** Ask: "Which game looks fun? What do you think you do here?"
2. **First game, 15 minutes.** Start at world 1, level 1. Then jump to one later world. Do not coach unless the child is stuck for 20–30 seconds. If stuck, ask "What have you tried?" and give the smallest possible hint.
3. **Second game, 5 minutes.** First level only, to check whether the hub and controls make sense without help.
4. **Close, 2 minutes.** Ask: "What was fair? What was annoying? Which level was too hard or too easy?"

## What to watch

- Time to first action: does the child know what to tap?
- Wrong mental model: for example, expecting an arrow to move the penguin immediately instead of adding a command.
- Retry behavior: does the child retry, ask for help, or quit? Count failures before quitting.
- Reading: does the child read the goal and instructions? Are labels large enough?
- Difficulty curve: compare level 1, 5, 10, and the first level of a later world.
- Delight and frustration: note the exact level, screen, and quote.

## Per-game focus

| Game           | Sample levels                    | Watch for                                             | Tuning knob                                   | File                                                              |
| -------------- | -------------------------------- | ----------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Frost Breaker  | 1, 5, 10, 15, 20, 25, 30, 40, 50 | Aim clarity, pod count, core placement, retry fatigue | Pod totals, core count, bumpers, level layout | `src/lib/frost-breaker/levels.js`                                 |
| Aurora Mirrors | 1, 5, 10, 15, 20, 25, 30         | Mirror density, beam readability, par fairness        | Mirror count and placement, par moves         | `src/lib/aurora/levels.js`, `src/lib/aurora/beam.js`              |
| Penguin Code   | 1, 5, 10, 15, 20, 25, 30         | Command limit, water density, route-preview clarity   | `maxCommands`, `par`, walls, holes            | `src/lib/penguin-code/levels.js`, `src/lib/penguin-code/rules.js` |
| Number Ice     | 1, 5, 10, 15, 20, 25, 30         | Target clarity, legal moves, move budget, par         | Target, goals, move budget, board size        | `src/lib/number-ice/levels.js`, `src/lib/number-ice/board.js`     |

## Scorecard

Copy this table for each session.

| Game | Level | Result | Stars | Time | Fails | Friction or quote | Action |
| ---- | ----- | ------ | ----- | ---- | ----- | ----------------- | ------ |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |
|      |       |        |       |      |       |                   |        |

## Decision rules

- If three of four children fail the same level twice, lower difficulty: add par or commands, remove water or mirrors, or add a pod.
- If a child clears a level first try with three stars and says "too easy," raise difficulty or move the concept earlier.
- If a child cannot tell what to do within 10 seconds on level 1, fix onboarding and visual hierarchy before tuning numbers.
- Never tune from one session alone. Mark findings as hypotheses until at least three children show the same pattern.
- Change one variable per level so the next session can tell what helped.

## After the session

- Record the top three friction points and the top three delight points.
- Pick one change per game for the next build, with the exact level ID.
- Add a dated notes section below, or copy the scorecard into the issue tracker.
- Re-run the changed levels with the same child only after the fix ships; do not burn the session on retries.

## Campaign pass

The child session samples the curve. Separately, an adult should complete every level in all four campaigns to catch blockers, softlocks, and impossible pars. Record the level ID and the shortest solution found. This is verification, not tuning.
