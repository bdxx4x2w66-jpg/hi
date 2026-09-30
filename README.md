# 满分 · Full Marks

A 3-minute bilingual (中文 / English) motion-graphics short, drawn entirely in code.
An AI scores the "Long March spirit" at 100; a student questions it until it admits
some things cannot be scored.

Everything — picture, music, sound effects, subtitles — is generated; no external images or footage.

## Pipeline

| step | command | output |
|---|---|---|
| voices (one continuous take per character, cut at sentence boundaries) | `python3 audio/voice.py` | `build/voice/` |
| timeline + font subset | `python3 tools/build.py` | `build/story.js`, `build/fonts/` |
| stills for checking | `node tools/still.mjs <dir> <t>...` or `tools/check.sh <name> <t>...` | PNGs + contact sheet |
| music + SFX + mix (numpy/scipy), waveform plot | `python3 audio/score.py` | `build/audio/mix.wav`, `waveform.png` |
| frames → video (Playwright calls `window.render(t)`, PNG → ffmpeg) | `FFMPEG=… node tools/render.mjs 3` | `build/render/part*.mp4` |
| mux | `tools/finalize.sh` | `build/manfen.mp4` |

Requirements: Python 3 with `numpy scipy edge-tts imageio-ffmpeg matplotlib pillow`, Node with Playwright.
`node` scripts need `NODE_PATH` pointing at the global `node_modules` if Playwright is installed globally.

## Structure

- `story.json` — the single source: shots, durations, dialogue (zh + en), voice settings.
- `video/index.html` — canvas page exposing `window.render(t)`; every frame is a pure function of `t`.
- `video/lib.js` — palette, easing/springs, seeded noise, camera, text, figure, room, AI lock-on box, subtitles.
- `video/shots/s01.js … s10.js` — one file per shot.
- `audio/score.py` — synthesised score (96 BPM, 2.5 s bars; cuts land on bar lines) and every sound effect keyed to its on-screen moment.
