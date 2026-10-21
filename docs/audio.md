# Frost Breaker — audio

All audio is generated locally with the **Studio** app (`~/developer-playground/music-sfx-voice-studio`, `http://127.0.0.1:7910`) using Stable Audio 3 (`sm-sfx` for effects, `medium` for music). No third-party sample packs and no runtime network calls: the MP3s live in `static/audio/` and are precached by the service worker.

## Files

| File             | Use                         | Source                                                                     |
| ---------------- | --------------------------- | -------------------------------------------------------------------------- |
| `tap.mp3`        | Pod selection / UI tick     | Procedural `/sfx` preset `click` (take `7b13061731344fc5896d9fee40a1e362`) |
| `launch.mp3`     | Slingshot release           | `/sfx/text` take `17bd1971744c41a4ae67d8c1fd7d1648`                        |
| `stick.mp3`      | Spike attaches to ice       | `/sfx/text` take `606de8af1c2942af99b710d542949f34`                        |
| `crack.mp3`      | Ice shatter                 | `/sfx/text` take `edef47c836d2480a9b1acdfcda3e4ef7`                        |
| `crystal.mp3`    | Copter crystal pop          | `/sfx/text` take `def0e757c0c7489fa0fe29171245b37a`                        |
| `split.mp3`      | Split pod breaks into three | `/sfx/text` take `2d4fa4fd511643ad957ffa0fd2fa9f29`                        |
| `core.mp3`       | Crystal-core chain blast    | `/sfx/text` take `b770bbfecd154ea78dd979223af4036b`                        |
| `win.mp3`        | Level result / fanfare      | `/sfx/text` take `1d0cef24d0ad4c1ea26f30e86e986a87`                        |
| `softfail.mp3`   | “So close!” result          | `/sfx/text` take `893b5f9ba250489abc3b6ee3d3c4e0bd`                        |
| `frost-loop.mp3` | Background music loop       | `/music` take `4aaaa9b9bc1b48038b7fcbeab7ce103c`                           |

## Prompts

- **launch** — “short icy whoosh, a snowball launched from a slingshot, crisp winter air, playful, no music”
- **stick** — “soft icy thud, a snowball sticking to a frozen sculpture, short, satisfying, no music”
- **crack** — “sharp cracking ice, glassy shatter, short, crisp, magical, no music”
- **crystal** — “bright crystal chime, tiny glass bells, magical sparkle, short, no music”
- **split** — “three quick icy pops, a snowball splitting into three, playful, short, no music”
- **core** — “deep magical ice burst, glassy boom with a warm chime, powerful but not scary, no music”
- **win** — “short playful victory fanfare, icy bells and warm marimba, joyful, no vocals”
- **softfail** — “gentle soft chime, almost there, warm and encouraging, no sadness, no music”
- **frost-loop** — “calm playful winter arcade music loop, soft marimba, glass bells, warm bass, gentle pulse, snowy night, no vocals, seamless loop”

## Processing

- Effects: leading/trailing silence removed, trimmed to 0.12–1.7 s, 80 ms fade-out, loudness-normalised to about −18 LUFS, mono 128 kbps MP3.
- Music: trimmed to 19.2 s, 1 s equal-power crossfade from the end into the start for a seamless loop, 18.2 s, stereo 160 kbps MP3, about −20 LUFS.
- Runtime: Web Audio buffers (`decodeAudioData`) with a procedural WebAudio fallback if a file is missing or the browser is still locked. Background music starts after the first user gesture (iOS-safe). A compressor/limiter sits before the destination so overlapping ice hits do not clip.

## Regenerating

Start the Studio (`cd ~/developer-playground/music-sfx-voice-studio && .venv/bin/python -m studio`), read `data/token`, and POST to `/sfx/text` or `/music` as documented in `agent.md`. Keep the prompts in this file in sync so the set stays coherent.
