// Shot 2 · 越苦，分越高 — the AI names its parameters; the student drags them up for
// himself and the score follows; "then you got it wrong"; title card; the "1" starts to fall.

const SPOKEN = [[0, 0.5], [1, 1.2], [3, 1.9], [2, 2.6], [4, 3.9]]; // bar index, time highlighted
const YOU0 = [0.2, 0.26, 0.14, 0.1, 0.3];
const YOU1 = [0.95, 0.95, 0.97, 0.9, 0.99];
const DRAG = [[6.6, 7.4], [7.6, 8.4], [8.6, 9.3], [9.5, 10.0], [10.2, 10.7]];
const FULL = [0.94, 0.9, 0.97, 0.88, 0.99];

function s02Bars(t) {
  return FULL.map((v, i) => {
    const reset = tw(t, 5.6 + i * 0.07, 6.3 + i * 0.07, E.inOutCubic);
    const drag = tw(t, DRAG[i][0], DRAG[i][1], E.inOutCubic);
    const retract = tw(t, 14.6 + i * 0.09, 15.3 + i * 0.09, E.inOutQuart);
    return lerp(lerp(v, YOU0[i], reset) + (YOU1[i] - YOU0[i]) * drag, 0, retract);
  });
}

SHOTS.s02 = (ctx, t) => {
  const bars = s02Bars(t);
  const inSim = t > 5.6 && t < 14.6;
  const avg = bars.reduce((a, b) => a + b, 0) / 5;
  const score = t < 5.6 ? 100 : t < 14.6 ? Math.min(100, (avg / 0.952) * 100) : 100;

  // highlight each parameter as the AI names it
  const hot = SPOKEN.reduce((h, [i, at]) => (t > at && t < at + 0.7 ? i : h), -1);

  const st = {
    t, header: -10, ringIn: 1, spin: 0, spinAlpha: 0,
    fill: score / 100, score, scoreAlpha: 1,
    pop: t > 11.4 ? Math.exp(-(t - 11.4) * 5) * Math.cos((t - 11.4) * 14) : 0,
    barsIn: FULL.map((_, i) => 1 - tw(t, 14.6 + i * 0.09, 15.3 + i * 0.09, E.inOutQuart)), bars,
    knobs: tw(t, 6.0, 6.5) * (1 - tw(t, 14.4, 14.8)),
    hotIdx: hot, showVals: inSim,
  };

  const draw = c => {
    indexUI(c, st);
    // parameter highlight (drawn over the bar)
    if (hot >= 0) {
      const by = BARS.y0 + hot * BARS.dy;
      line(c, [[BARS.x, by], [BARS.x + (BARS.x1 - BARS.x) * bars[hot], by]], { w: 10, col: C.red, cap: 'butt' });
    }
    // "you" tag over the sliders during the simulation
    if (inSim) {
      label(c, 'SIMULATION  ·  你 YOU', 1800, 112, { t, t0: 5.8, size: 26, col: C.red, align: 'right' });
    }
    // cursor dragging each slider
    const di = DRAG.findIndex(([a, b]) => t > a - 0.35 && t < b + 0.25);
    if (di >= 0) {
      const by = BARS.y0 + di * BARS.dy, x = BARS.x + (BARS.x1 - BARS.x) * bars[di];
      c.save(); c.translate(x + 6, by + 8); c.fillStyle = C.paper; c.strokeStyle = C.ink; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 44); c.lineTo(11, 33); c.lineTo(20, 52); c.lineTo(28, 48); c.lineTo(19, 30); c.lineTo(34, 30); c.closePath();
      c.stroke(); c.fill(); c.restore();
    }
    // the question, big, above the sliders
    text(c, '越苦，分越高？', BARS.x - 210, 200, { size: 84, align: 'left', t, t0: 8.2, stagger: 0.06, out: 14.4 });
    en(c, 'The harder it gets, the higher the score?', BARS.x - 206, 272, { t, t0: 8.8, size: 30, out: 14.4 });
    // title card where the sliders were
    text(c, '满分', BARS.x - 200, 540, { size: 230, align: 'left', t, t0: 15.6, stagger: 0.16, out: 19.1, spacing: 20 });
    en(c, 'F U L L   M A R K S', BARS.x - 190, 700, { t, t0: 16.3, size: 34, col: C.red, out: 19.1, font: MONO, weight: 700 });
  };

  // camera: near the sliders → whole screen for the simulation → settle on the score for the hand-off
  let cam;
  if (t < 5.2) cam = camLerp(S01_END, uiCam(1240, 560, 1.12), tw(t, 0, 5.2, E.inOutSine));
  else if (t < 14.5) cam = camLerp(uiCam(1240, 560, 1.12), uiCam(960, 540, 1), tw(t, 5.2, 6.4, E.inOutCubic));
  else if (t < 19) cam = camLerp(uiCam(960, 540, 1), uiCam(1000, 545, 1.04), tw(t, 14.5, 19, E.inOutSine));
  else cam = camLerp(uiCam(1000, 545, 1.04), S02_END, tw(t, 19, 20, E.inOutCubic));

  // the "1" of 100 begins to tip over in the last second (continues in shot 3)
  st.oneTip = tw(t, 19.3, 20, E.inCubic) * 0.25;
  withCam(ctx, cam, () => room(ctx, draw, { student: 1 }));
  vignette(ctx, 0.5);
};
const S02_END = uiCam(760, 560, 1.12);
