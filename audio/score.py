"""Synthesise the score + sound design from scratch (numpy/scipy) and mix the voices.

Every sound effect is keyed to the moment its visual happens (shot id + shot time,
copied from the shot scripts). Output: build/audio/mix.wav (48 kHz stereo) and a
waveform plot build/audio/waveform.png for clipping checks.
"""
import json, os
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "audio")
SR = 48000
STORY = json.load(open(os.path.join(ROOT, "story.json")))
START, acc = {}, 0.0
for s in STORY["shots"]:
    START[s["id"]] = acc; acc += s["dur"]
TOTAL = acc
N = int(TOTAL * SR) + SR
BEAT = 60 / STORY["bpm"]; BAR = BEAT * 4
RNG = np.random.default_rng(1934)

music = np.zeros((N, 2)); sfx = np.zeros((N, 2)); voice = np.zeros((N, 2))


def at(shot, t):
    return START[shot] + t


def place(buf, x, t, gain=1.0, pan=0.0):
    """add mono (or stereo) x at time t with constant-power pan (-1..1)"""
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * np.sqrt(2), x * r * np.sqrt(2)], 1)
    a, b = max(i, 0), min(i + len(x), N)
    buf[a:b] += x[a - i:b - i] * gain


def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.005, r=None, curve=4.0):
    t = tt(d); r = d - a if r is None else r
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(r, 1e-4))
    return e
def adsr(d, a, rel):
    t = tt(d); e = np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / rel)); return e
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def noise(d): return RNG.standard_normal(int(d * SR))
def hz(n): return 440 * 2 ** ((n - 69) / 12)   # midi → Hz


# ---------------- instruments ----------------
def pluck(f, d=1.6, bright=1.0):
    t = tt(d); x = np.zeros_like(t)
    for k in range(1, 9):
        x += (0.6 ** (k - 1)) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + k * 1.6 / bright))
    return x * np.minimum(1, t / 0.003) * 0.35

def pad(freqs, d, a=1.2, rel=1.5, bright=4):
    t = tt(d); x = np.zeros_like(t)
    for f in freqs:
        for det in (-0.004, 0, 0.0045):
            for k in range(1, bright + 1):
                x += np.sin(2 * np.pi * f * (1 + det) * k * t + RNG.uniform(0, 6.28)) / (k ** 1.6)
    x *= adsr(d, a, rel) / (len(freqs) * 3)
    return x * (1 + 0.08 * np.sin(2 * np.pi * 0.2 * t))

def kick(g=1.0):
    t = tt(0.45); f = 45 + 80 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * g

def hat(g=1.0, d=0.06): return hp(noise(d), 7000) * env(d, 0.001, curve=6) * 0.25 * g
def clap(g=1.0):
    x = bp(noise(0.25), 900, 2600) * env(0.25, 0.002, curve=9)
    return x * 0.5 * g
def tick(f=3200, g=1.0): return bp(noise(0.03), f * 0.7, f * 1.3) * env(0.03, 0.0005, curve=8) * 0.9 * g
def click(g=1.0):
    return (bp(noise(0.02), 1500, 5000) * env(0.02, 0.0005, curve=10) + 0.3 * tick(900)[:960]) * g
def thud(f=70, d=0.35, g=1.0):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + lp(noise(d), 300) * 0.2 * np.exp(-t * 20)) * g
def boom(g=1.0, d=3.0):
    t = tt(d); f = 42 + 30 * np.exp(-t * 3)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) + lp(noise(d), 200) * 0.3 * np.exp(-t * 3)) * g
def ding(f=1318.5, d=2.4, g=1.0):
    t = tt(d); x = np.zeros_like(t)
    for m, a, dec in [(1, 1, 1.4), (2.0, 0.4, 2.2), (2.76, 0.25, 3.0), (5.4, 0.1, 5)]:
        x += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * dec)
    return x * np.minimum(1, t / 0.002) * 0.3 * g
def whoosh(d=0.8, lo=300, hi=3000, g=1.0, rise=True):
    x = noise(d); t = tt(d)
    a = bp(x, lo, lo * 2.5); b = bp(x, hi / 2.5, hi)
    m = t / d if rise else 1 - t / d
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return (a * (1 - m) + b * m) * e * 0.5 * g
def sweep(f0, f1, d, g=1.0):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.3 * g
def cloth(d, g=1.0):
    x = bp(noise(d), 400, 2200); t = tt(d)
    return x * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 5 * t))) * adsr(d, 0.08, 0.2) * 0.35 * g
def crackle(d, dens=18, g=1.0):
    x = lp(noise(d), 900) * 0.05
    for _ in range(int(d * dens)):
        c = bp(noise(0.012), 1500, 6000) * env(0.012, 0.0003, curve=8) * RNG.uniform(0.2, 1)
        i = RNG.integers(0, len(x) - len(c)); x[i:i + len(c)] += c
    return x * g
def wind(d, g=1.0):
    t = tt(d); x = lp(np.cumsum(noise(d)) * 0.02, 700)
    x = x - lp(x, 60)
    return x / (np.abs(x).max() + 1e-9) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t)) * adsr(d, 1.5, 1.5) * 0.25 * g
def drone(freqs, d, g=1.0, a=2.0, rel=2.0):
    t = tt(d); x = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    return x / len(freqs) * adsr(d, a, rel) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * t)) * 0.3 * g
def hum(f, d, g=1.0):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * f * 3 * t)) * adsr(d, 0.05, 0.1) * 0.12 * g
def step(g=1.0):
    x = thud(110, 0.12, 0.25 * g); n = bp(noise(0.05), 300, 1500) * env(0.05, 0.001, curve=9) * 0.15 * g
    x[:len(n)] += n; return x


# ---------------- chords ----------------
Dm = [62, 65, 69, 72]; Bb = [58, 62, 65, 70]; F = [60, 65, 69, 72]; Cc = [60, 64, 67, 72]
PROG_B = [Dm, Bb, F, Cc]
D_ = [62, 66, 69, 74]; Bm = [59, 62, 66, 71]; G_ = [55, 59, 62, 67]; A_ = [57, 61, 64, 69]
PENTA = [62, 65, 67, 69, 72, 74, 77]

def music_score():
    # A · 0 – 32.5  cool pulse under the index
    place(music, pad([hz(n) for n in [50, 62, 65, 69, 72, 76]], 32.5, a=3, rel=2.5, bright=3), 0, 0.5)
    for k in range(int(5.0 / BEAT), int(30.0 / BEAT)):
        tb = k * BEAT
        place(music, thud(hz(38), 0.5, 0.55), tb, 1)
        if k % 2: place(music, hat(0.5), tb, 1, 0.3)
    # B · 32.5 – 82.5  the puzzle: arpeggios, then drums, then bass
    b0 = at("s03", 0); b1 = at("s05", 15.0)
    nb = int((b1 - b0) / BAR) + 1
    for bar in range(nb):
        chord = PROG_B[bar % 4]; tb = b0 + bar * BAR
        place(music, pad([hz(n - 12) for n in chord], BAR + 0.6, a=0.6, rel=0.6, bright=3), tb, 0.35)
        for s16 in range(16):
            t16 = tb + s16 * BEAT / 4
            if t16 >= b1: break
            n = chord[[0, 1, 2, 3, 2, 1][s16 % 6]] + (12 if s16 % 8 >= 4 else 0)
            place(music, pluck(hz(n), 0.8, 1.2), t16, 0.22 + 0.08 * (bar / nb), pan=0.35 * np.sin(s16))
        for bt in range(4):
            tbe = tb + bt * BEAT
            if tbe >= b1: break
            if tbe >= at("s04", 0) and bt in (0, 2): place(music, kick(0.9), tbe, 1)
            if tbe >= at("s04", 0): place(music, hat(0.8), tbe + BEAT / 2, 1, 0.4)
            if tbe >= at("s05", 0) and bt in (1, 3): place(music, clap(0.8), tbe, 1)
            if tbe >= at("s05", 0): place(music, pluck(hz(chord[0] - 24), 0.5, 0.6) * 1.6, tbe, 1)
            if tbe >= at("s05", 0): place(music, pluck(hz(chord[0] - 24), 0.3, 0.6) * 1.2, tbe + BEAT / 2, 1)
    # freeze → silence; the red: dissonant drone
    place(music, drone([110, 116.5, 55], 4.2, 1.2, a=0.3, rel=1.2), at("s05", 15.9), 1)
    # C · 87.5 – 127.5  history: drone + sparse pentatonic plucks
    place(music, drone([hz(38), hz(45), hz(50)], 40, 0.9, a=3, rel=3), at("s06", 3), 1)
    k = 0; tcur = at("s06", 4.0)
    while tcur < at("s07", 19):
        if not (at("s07", 11.3) < tcur < at("s07", 13.2)):      # silence while the hand hesitates
            n = PENTA[RNG.integers(0, len(PENTA))] - (12 if tcur > at("s07", 0) else 0)
            place(music, pluck(hz(n), 2.2, 0.7), tcur, 0.28, pan=RNG.uniform(-0.5, 0.5))
        tcur += BEAT * RNG.choice([2, 2, 3, 4]); k += 1
    # D · 127.5 – 147.5  interrogation: steady tick + low pulse, pad swell under the key line
    for k in range(int(at("s08", 0.2) / BEAT), int(at("s08", 14.2) / BEAT)):
        place(music, thud(hz(38), 0.3, 0.4), k * BEAT, 1)
    place(music, pad([hz(n) for n in [50, 57, 62, 65, 69]], 6.5, a=2.0, rel=2.5, bright=3), at("s08", 14.0), 0.55)
    # E · 147.5 – 165  almost nothing: a thin high tone
    place(music, drone([hz(81), hz(86)], 17, 0.35, a=3, rel=3), at("s09", 0.5), 1)
    # F · 165 – 185  warm resolution in D major
    prog = [(D_, 4 * BAR / 4), (Bm, BAR), (G_, BAR), (D_, BAR), (A_, BAR), (G_, BAR), (D_, 2.2 * BAR)]
    tcur = at("s10", 2.4)
    for ch, d in prog:
        place(music, pad([hz(n) for n in ch] + [hz(ch[0] - 12)], d + 1.2, a=0.9, rel=1.4, bright=4), tcur, 0.55)
        tcur += d
    mel = [(74, 0), (73, 1), (69, 2), (71, 3.5), (69, 4), (66, 5), (67, 6.5), (69, 7), (74, 8), (73, 10), (74, 12)]
    for n, b in mel:
        place(music, pluck(hz(n), 3.0, 0.8), at("s10", 7.6) + b * BEAT * 1.0, 0.26, pan=0.15)


def sound_design():
    S = lambda shot, t, x, g=1.0, pan=0.0: place(sfx, x, at(shot, t), g, pan)
    # s01
    S("s01", 0.2, whoosh(1.2, 120, 900, 0.4))
    for i in range(5): S("s01", 3.5 + i * 0.16, tick(2400 + i * 300, 0.5), 1, 0.4)
    S("s01", 5.0, ding(1318.5), 0.8); S("s01", 5.0, thud(55, 0.8, 0.5))
    for i in range(4): S("s01", 10.2 + i / 9, click(0.7))
    # s02
    for tt_ in [0.5, 1.2, 1.9, 2.6, 3.9]: S("s02", tt_, tick(1800, 0.6), 1, 0.4)
    S("s02", 5.6, whoosh(0.7, 200, 1200, 0.5, rise=False))
    for a_, b_ in [[6.6, 7.4], [7.6, 8.4], [8.6, 9.3], [9.5, 10.0], [10.2, 10.7]]:
        S("s02", a_, cloth(b_ - a_, 0.3), 1, 0.3); S("s02", b_, click(0.9), 1, 0.3)
    S("s02", 11.4, ding(1318.5, 1.6, 0.6))
    S("s02", 14.6, whoosh(0.8, 300, 2000, 0.5, rise=False))
    S("s02", 15.6, boom(0.7, 3.5)); S("s02", 15.6, ding(659.3, 3.0, 0.5))
    S("s02", 19.3, whoosh(1.0, 150, 800, 0.5))
    # s03
    S("s03", 1.0, thud(60, 0.4, 0.7), 1, -0.3)
    S("s03", 0.7, whoosh(1.4, 200, 1800, 0.5))
    for side, pan, stop in [(0, -0.6, 10.6), (1, 0.6, 7.0)]:
        tcur = 2.8
        while tcur < stop: S("s03", tcur, step(0.8), 1, pan); tcur += 0.46
    for tcur in np.arange(8.3, 9.2, 0.46): S("s03", tcur, step(0.8), 1, 0.6)
    S("s03", 12.3, ding(987.8, 1.2, 0.5), 1, -0.4); S("s03", 12.3, ding(987.8, 1.2, 0.5), 1, 0.4)
    S("s03", 13.4, tick(1200, 0.8)); S("s03", 16.7, thud(90, 0.6, 0.8)); S("s03", 16.7, ding(622.3, 2, 0.4))
    # s04
    S("s04", 0.4, tick(2600, 0.8))
    for ti in [2.3, 2.9, 3.7, 4.5]: S("s04", ti, tick(2000, 0.7), 1, 0.4)
    for ti in [3.3, 3.9, 4.9, 5.5]: S("s04", ti, thud(98, 0.4, 0.6), 1, 0.4)
    S("s04", 7.6, whoosh(0.8, 300, 2400, 0.4))
    S("s04", 8.4, sweep(1800, 60, 0.6, 1.0)); S("s04", 9.3, sweep(80, 1600, 0.6, 0.8))
    for i in range(5): S("s04", 10.2 + i * 0.22, tick(1500 + 200 * i, 0.6))
    S("s04", 11.6, whoosh(1.0, 400, 3000, 0.35))
    # s05
    S("s05", 1.6, ding(1760, 1.4, 0.35), 1, 0.3)
    tcur = 3.8
    while tcur < 15.0:
        S("s05", tcur, step(0.7), 1, 0.1); tcur += max(0.22, 0.46 - (tcur - 3.8) * 0.02)
    S("s05", 15.0, sweep(600, 40, 0.5, 0.8))               # tape-stop freeze
    S("s05", 15.9, boom(0.55, 3.5))
    # s06
    S("s06", 0.0, whoosh(0.8, 200, 1200, 0.5, rise=False))
    for i in range(14): S("s06", 1.0 + i / 8, click(0.6))
    S("s06", 2.5, whoosh(1.0, 150, 1500, 0.4))
    S("s06", 3.4, wind(6.5, 1.0))
    S("s06", 9.3, whoosh(0.8, 300, 2500, 0.5))
    S("s06", 10.0, crackle(7.5, 16, 0.6), 1, -0.4)
    S("s06", 10.2, thud(65, 0.5, 0.9))
    S("s06", 10.5, tick(2600, 0.7))
    S("s06", 12.8, cloth(1.1, 0.8)); S("s06", 14.6, cloth(1.8, 0.8))
    S("s06", 15.2, sweep(3000, 3200, 0.7, 0.25))            # box strains
    S("s06", 15.9, bp(noise(0.5), 1500, 7000) * env(0.5, 0.001, curve=7) * 0.5)   # crack
    for i in range(12): S("s06", 16.1 + i * 0.25, ding(2000 + 150 * i, 1.0, 0.12), 1, RNG.uniform(-0.6, 0.6))
    # s07
    night = np.zeros(int(20 * SR))
    for i in range(60):
        c = np.sin(2 * np.pi * 4200 * tt(0.05)) * np.sin(2 * np.pi * 30 * tt(0.05)) ** 2 * 0.03
        j = RNG.integers(0, len(night) - len(c)); night[j:j + len(c)] += c
    S("s07", 0, night * adsr(20, 2, 2), 1, 0.3)
    S("s07", 6.8, tick(2600, 0.8))
    S("s07", 10.0, whoosh(0.5, 300, 2000, 0.4))
    S("s07", 10.2, cloth(1.2, 0.5)); S("s07", 12.8, cloth(1.1, 0.4))
    for i in range(6): S("s07", 15.0 + i * 0.5, whoosh(0.4, 400, 2500, 0.3) + crackle(0.6, 20, 0.5)[:int(0.4 * SR)], 1, 0.5)
    # s08
    S("s08", 0.0, whoosh(0.9, 300, 3000, 0.5))
    for ti in [1.6, 3.8, 6.5]: S("s08", ti, tick(3600, 1.0)); S("s08", ti, ding(1760, 0.5, 0.25))
    for (s0, s1, f) in [(8.1, 9.9, 220), (10.6, 12.1, 180), (12.9, 14.4, 140)]:
        S("s08", s0, hum(f, s1 - s0, 1.0)); S("s08", s1, thud(80, 0.3, 0.5))
    # s09
    S("s09", 0.05, sweep(400, 200, 0.5, 0.5))
    for L in [(4.3, 5.4, 6), (5.9, 7.0, 6), (7.6, 8.3, 4)]:
        for i in range(L[2]): S("s09", L[0] + i * (L[1] - L[0]) / L[2], click(0.8))
    for ti in [10.1, 10.4, 10.7, 11.0]: S("s09", ti, whoosh(0.25, 800, 4000, 0.5))
    for L in [(11.4, 11.9, 4), (12.0, 12.7, 6), (12.8, 13.5, 6)]:
        for i in range(L[2]): S("s09", L[0] + i * (L[1] - L[0]) / L[2], click(0.6))
    # s10
    S("s10", 2.6, ding(880, 3, 0.45))
    S("s10", 4.6, whoosh(2.5, 100, 700, 0.3))
    S("s10", 8.8, wind(10, 0.5))
    S("s10", 12.2, tick(1000, 0.4), 1, -0.5)
    S("s10", 13.2, click(0.4), 1, 0.1)
    S("s10", 16.0, thud(120, 0.3, 0.5), 1, 0.4)


def voices():
    cues = json.load(open(os.path.join(ROOT, "build", "voice", "cues.json")))
    story_at = {(s["id"], i): c["at"] for s in STORY["shots"] for i, c in enumerate(s["cues"])}
    env_v = np.zeros(N)
    for c in cues:
        sr, x = wavfile.read(os.path.join(ROOT, "build", "voice", f"{c['shot']}_{c['idx']}.wav"))
        x = x.astype(np.float64) / 32768
        if c["who"] == "ai":   # the system voice: band-limited, a touch of short slapback
            x = lp(hp(x, 180), 6500)
            x = x + 0.18 * np.concatenate([np.zeros(int(0.028 * SR)), x])[:len(x)]
        t0 = START[c["shot"]] + story_at[(c["shot"], c["idx"])]
        place(voice, x * 0.95, t0, 1.0, 0.0)
        i = int(t0 * SR); env_v[i:i + len(x)] = 1
    return env_v


def main():
    os.makedirs(OUT, exist_ok=True)
    music_score(); sound_design(); env_v = voices()
    # duck music + sfx under dialogue (smoothed)
    k = int(0.25 * SR); env_s = np.convolve(env_v, np.ones(k) / k, mode="same")
    duck = 1 - 0.62 * env_s
    # the half-beat drop when B stops (shot 3, t=7.0)
    i0 = int(at("s03", 7.0) * SR); i1 = int(at("s03", 7.35) * SR)
    duck[i0:i1] *= 0.15
    # hard silence at the freeze until the red
    duck[int(at("s05", 15.0) * SR):int(at("s05", 15.9) * SR)] *= 0.0
    # room tone under everything so there is never digital silence
    room = lp(np.cumsum(RNG.standard_normal(N)) * 0.002, 400); room = room - lp(room, 30)
    room = room / np.abs(room).max() * 0.01
    mus = music * 0.5 * duck[:, None]; fx = sfx * 0.7 * (1 - 0.25 * env_s)[:, None]
    act = env_v > 0.5
    db = lambda x: 20 * np.log10(np.sqrt((x[act] ** 2).mean()) + 1e-9)
    print(f"during dialogue: voice {db(voice):.1f} dB  music {db(mus):.1f} dB  sfx {db(fx):.1f} dB")
    m = mus + fx + voice + room[:, None]
    # gentle bus limiter: soft-clip above -3 dBFS, then normalise to -1 dBFS peak
    m = np.tanh(m / 0.75) * 0.75
    m = m[: int(TOTAL * SR)]
    fade = int(1.0 * SR); m[-fade:] *= np.linspace(1, 0, fade)[:, None]
    m *= 10 ** (-1 / 20) / np.abs(m).max()
    wavfile.write(os.path.join(OUT, "mix.wav"), SR, (m * 32767).astype(np.int16))
    # report
    peak = 20 * np.log10(np.abs(m).max()); rms = 20 * np.log10(np.sqrt((m ** 2).mean()))
    clip = int((np.abs(m) >= 0.999).sum())
    print(f"mix: {len(m) / SR:.1f}s  peak {peak:.2f} dBFS  rms {rms:.1f} dBFS  clipped samples {clip}")
    plot(m)


def plot(m):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, axes = plt.subplots(3, 1, figsize=(20, 8), sharex=True)
    t = np.arange(len(m)) / SR
    step_ = 200
    axes[0].plot(t[::step_], m[::step_, 0], lw=0.4, color="#D63A25"); axes[0].set_ylabel("L")
    axes[1].plot(t[::step_], m[::step_, 1], lw=0.4, color="#333"); axes[1].set_ylabel("R")
    for ax in axes[:2]:
        ax.axhline(0.999, color="k", ls=":", lw=0.6); ax.axhline(-0.999, color="k", ls=":", lw=0.6); ax.set_ylim(-1.05, 1.05)
    win = int(0.1 * SR); r = np.sqrt(np.convolve((m ** 2).mean(1), np.ones(win) / win, mode="same"))
    axes[2].plot(t[::step_], 20 * np.log10(r[::step_] + 1e-6), lw=0.6); axes[2].set_ylabel("RMS dB"); axes[2].set_ylim(-60, 0)
    for ax in axes:
        for sid, s0 in START.items():
            ax.axvline(s0, color="#999", lw=0.5)
    for sid, s0 in START.items(): axes[0].text(s0 + 0.3, 0.9, sid, fontsize=8)
    axes[2].set_xlabel("seconds")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "waveform.png"), dpi=90)


if __name__ == "__main__":
    main()
