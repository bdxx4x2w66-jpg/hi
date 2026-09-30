// Shot 1 · 100分 — wide room, push into the screen, the index lands on 100.

// camera expressed in UI space (1920x1080 inside the monitor)
const uiCam = (ux, uy, zUI) => ({ x: SCREEN.x + ux * 0.4, y: SCREEN.y + uy * 0.4, z: zUI * 2.5 });

const PARAMS = ['饥饿', '疲劳', '距离', '危险', '坚持'];
const RING = { x: 700, y: 560, r: 300 };
const BARS = { x: 1290, x1: 1720, y0: 380, dy: 88 };

// The index screen, shared by shots 1 and 2.
// st: {t, spin, fill, score, pop, bars[5], barVals[5]?, barsIn[5], header, prompt, promptT0, showVals}
function indexUI(ctx, st) {
  const { t } = st;
  // header
  label(ctx, 'SPIRIT INDEX  ·  长征精神指数', 120, 112, { t, t0: st.header ?? 0, size: 28, col: C.paper2 });
  line(ctx, [[120, 150], [lerp(120, 1800, tw(t, st.header ?? 0, (st.header ?? 0) + 1.2, E.outQuart)), 150]], { w: 1.5, col: C.paper, alpha: 0.25 });

  // ring: faint track + 100 tick marks that fill with the score
  const { x, y, r } = RING;
  arc(ctx, x, y, r, 0, Math.PI * 2, { w: 2, col: C.paper, alpha: 0.12 * (st.ringIn ?? 1) });
  const ticks = 100;
  for (let i = 0; i < ticks; i++) {
    const a = -Math.PI / 2 + (i / ticks) * Math.PI * 2;
    const on = i < st.fill * ticks;
    const len = on ? 26 : 12;
    const a0 = on ? 1 : 0.18;
    const ap = clamp((st.ringIn ?? 1) * ticks - i * 0.4) ;
    if (ap <= 0) continue;
    line(ctx, [[x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14)], [x + Math.cos(a) * (r - 14 - len), y + Math.sin(a) * (r - 14 - len)]],
      { w: on ? 4 : 2, col: on ? C.red : C.paper, alpha: a0 * ap });
  }
  // spinning loader arc
  if (st.spinAlpha > 0) {
    arc(ctx, x, y, r + 26, st.spin, st.spin + 1.1, { w: 4, col: C.paper, alpha: st.spinAlpha });
  }
  // score
  if (st.scoreAlpha > 0) {
    const k = 1 + 0.12 * (st.pop ?? 0);
    ctx.save(); ctx.globalAlpha *= st.scoreAlpha; ctx.translate(x, y + 10); ctx.scale(k, k);
    ctx.font = `700 ${st.score >= 100 ? 210 : 240}px ${MONO}`; ctx.fillStyle = st.score >= 100 ? C.paper : C.paper;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(st.score)), 0, 0);
    ctx.restore();
    label(ctx, '/ 100', x, y + 150, { t, t0: 0, size: 30, col: C.paper2, align: 'center', alpha: st.scoreAlpha * 0.8 });
  }

  // parameter bars
  PARAMS.forEach((p, i) => {
    const inn = st.barsIn[i];
    if (inn <= 0) return;
    const by = BARS.y0 + i * BARS.dy;
    ctx.save(); ctx.globalAlpha *= clamp(inn * 1.5);
    ctx.font = `600 40px ${SERIF}`; ctx.fillStyle = C.paper; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    ctx.fillText(p, BARS.x - 36, by + (1 - inn) * 20);
    ctx.restore();
    const len = (BARS.x1 - BARS.x) * st.bars[i] * inn;
    line(ctx, [[BARS.x, by], [BARS.x1, by]], { w: 2, col: C.paper, alpha: 0.15 * inn });
    line(ctx, [[BARS.x, by], [BARS.x + len, by]], { w: 10, col: i === 4 && st.hotLast ? C.red : C.paper, cap: 'butt', alpha: 0.9 });
    if (st.knobs) dot(ctx, BARS.x + len, by, 16 * st.knobs, C.paper);
    if (st.showVals) label(ctx, String(Math.round(st.bars[i] * 100)).padStart(2, '0'), BARS.x1 + 40, by, { t, t0: 0, size: 30, col: C.paper2, alpha: inn });
  });

  // student prompt line
  if (st.prompt) {
    label(ctx, '›', 120, 960, { t, t0: st.promptT0 - 0.3, size: 48, col: C.red });
    const n = Math.floor(clamp((t - st.promptT0) * 9, 0, [...st.prompt].length));
    ctx.save(); ctx.font = `900 64px ${SERIF}`; ctx.fillStyle = C.paper; ctx.textBaseline = 'middle';
    const s = [...st.prompt].slice(0, n).join('');
    ctx.fillText(s, 170, 962);
    const cw = ctx.measureText(s).width;
    if (Math.floor(t * 2.4) % 2 === 0) ctx.fillRect(176 + cw, 930, 4, 64);
    ctx.restore();
  }
}

function s01State(t) {
  const land = 5.0;
  const count = tw(t, 3.3, land, E.outExpo);
  return {
    t, header: 3.2,
    ringIn: tw(t, 0.4, 3.0, E.outCubic),
    spin: t * 4.2 + (t * t) * 0.1,
    spinAlpha: 1 - tw(t, land - 0.2, land + 0.3),
    fill: count, score: count * 100, scoreAlpha: tw(t, 3.3, 3.6),
    pop: t > land ? Math.exp(-(t - land) * 5) * Math.cos((t - land) * 14) : 0,
    barsIn: PARAMS.map((_, i) => spring(t, 3.5 + i * 0.16, { freq: 2, damp: 0.55 })),
    bars: [0.94, 0.9, 0.97, 0.88, 0.99].map((v, i) => v * clamp(spring(t, 3.6 + i * 0.16, { freq: 1.6, damp: 0.5 }), 0, 1.2)),
    prompt: t > 9.9 ? '为什么？' : null, promptT0: 10.2,
  };
}

SHOTS.s01 = (ctx, t) => {
  // camera: slow drift on the wide, then push into the screen, then creep toward the score
  let cam;
  if (t < 3) cam = camLerp(CAM_WIDE, { x: 950, y: 500, z: 1.12 }, tw(t, 0, 3, E.inOutSine));
  else if (t < 5.4) cam = camLerp({ x: 950, y: 500, z: 1.12 }, uiCam(960, 560, 1.0), tw(t, 3, 5.4, E.inOutQuart));
  else if (t < 11.2) cam = camLerp(uiCam(960, 560, 1.0), uiCam(820, 560, 1.1), tw(t, 5.4, 11.2, E.inOutSine));
  else cam = camLerp(uiCam(820, 560, 1.1), S01_END, tw(t, 11.2, 12.5, E.inCubic));

  const st = s01State(t);
  withCam(ctx, cam, () => {
    room(ctx, c => indexUI(c, st), { screenOn: tw(t, 0.2, 1.2), student: 1 });
  });
  // fade up from black
  if (t < 0.8) { ctx.fillStyle = `rgba(15,17,20,${1 - tw(t, 0, 0.8)})`; ctx.fillRect(0, 0, W, H); }
  vignette(ctx, 0.5);
};
const S01_END = uiCam(1300, 560, 1.18);
