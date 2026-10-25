# Project rules

## Penguin Code: no emoji

Penguin Code must not use emoji anywhere in its UI, game art, assets, or shared shell elements that appear on Penguin Code screens.

Use original inline SVG or CSS shapes as the replacement:

- `src/lib/penguin-code/PenguinArt.svelte` for game art
- `src/lib/components/UiIcon.svelte` for interface icons

Shared shell files covered by the rule:

- `src/lib/components/GameShell.svelte`
- `src/lib/components/SoundToggle.svelte`

## Guard test

Run before merging any Penguin Code change:

```sh
pnpm vitest run tests/unit/penguin-code-no-emoji.test.js
```

The test scans every `.svelte` and `.js` file under `src/lib/penguin-code`, every `.svelte` file under `src/routes/games/penguin-code`, and the two shared shell files above. It fails with a file path and 1-based line number when it finds a Unicode `Extended_Pictographic` character or a variation selector, joiner, or keycap component (U+FE0E, U+FE0F, U+200D, U+20E3).

Plain text symbols such as `★`, `←`, `↑`, `↓`, `→` are allowed. There is no allowlist that weakens the emoji check.

`pnpm test` runs this guard with the rest of the unit suite, and `pnpm lint` checks formatting.
