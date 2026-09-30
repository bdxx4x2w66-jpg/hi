"""Synthesise each character's lines as ONE continuous take, then cut it
into cues using the TTS engine's sentence boundaries.

Output: build/voice/<who>.wav (full take) and build/voice/cues.json
        [{shot, idx, who, text, start(in take), dur}]
"""
import asyncio, json, os, re, subprocess
import numpy as np
import edge_tts, imageio_ffmpeg
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "voice")
SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()

norm = lambda s: re.sub(r"[\s，。？、：！,.?!:…]", "", s)


async def take(text, cfg):
    c = edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"],
                             boundary="SentenceBoundary")
    audio, marks = b"", []
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "SentenceBoundary":
            marks.append((ch["offset"] / 1e7, ch["duration"] / 1e7, ch["text"]))
    return audio, marks


def decode(mp3, wav):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), wav], check=True)
    return wavfile.read(wav)[1].astype(np.float32) / 32768


def main():
    os.makedirs(OUT, exist_ok=True)
    story = json.load(open(os.path.join(ROOT, "story.json")))
    cues = [dict(shot=s["id"], idx=i, **c) for s in story["shots"] for i, c in enumerate(s["cues"])]
    result = []
    for who, cfg in story["voices"].items():
        mine = [c for c in cues if c["who"] == who]
        script = "\n".join(c["text"] for c in mine)
        audio, marks = asyncio.run(take(script, cfg))
        mp3 = os.path.join(OUT, f"{who}.mp3")
        open(mp3, "wb").write(audio)
        x = decode(mp3, os.path.join(OUT, f"{who}.wav"))
        # walk sentence marks, consuming them cue by cue
        k = 0
        for c in mine:
            want, got, first = norm(c["text"]), "", None
            while norm(got) != want:
                if k >= len(marks):
                    raise SystemExit(f"boundary mismatch at {c['text']!r} (got {got!r})")
                off, d, txt = marks[k]
                first = off if first is None else first
                end = off + d
                got += txt
                k += 1
            # trim to the audible speech inside the boundary span
            seg = x[int(first * SR):int(end * SR) + int(0.05 * SR)]
            env = np.convolve(np.abs(seg), np.ones(480) / 480, mode="same")
            on = np.where(env > 10 ** (-42 / 20))[0]
            a, b = (on[0], on[-1]) if len(on) else (0, len(seg))
            a = max(0, a - int(0.03 * SR)); b = min(len(seg), b + int(0.08 * SR))
            wavfile.write(os.path.join(OUT, f"{c['shot']}_{c['idx']}.wav"), SR, (seg[a:b] * 32767).astype(np.int16))
            result.append(dict(c, start=round(first + a / SR, 3), dur=round((b - a) / SR, 3)))
        print(who, "take", round(len(x) / SR, 2), "s,", len(mine), "cues")
    json.dump(result, open(os.path.join(OUT, "cues.json"), "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
