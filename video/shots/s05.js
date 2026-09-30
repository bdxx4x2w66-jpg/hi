// Shot 5 · 坚持，也一定对吗？ — the arrow to "high score" runs on and becomes a road.
// At a fork the goal is up the left branch; a walker takes the other one and keeps going.
// Persistence and score climb with the distance from the goal — until the logic breaks.

const FORK = { x: 2600, y: ARROW_Y };
const GOAL = { x: 2980, y: 330 };
const FREEZE = 15.0;
const roadW = x => FORK.y + (x - FORK.x) * 0.035;

function walkerAt(t) {
  const u = Math.max(0, Math.min(t, FREEZE) - 3.6);
  return FORK.x + 20 + 150 * u + 34 * u * u;
}

function s05World(ctx, t, camX) {
  const tf = Math.min(t, FREEZE);
  // the arrow line continues as the road
  line(ctx, [[1780, ARROW_Y], [FORK.x, FORK.y]], { w: 5, col: C.red, alpha: 1 - tw(t, 0.8, 2.4) });
  line(ctx, [[1780, ARROW_Y], [FORK.x, FORK.y]], { w: 3, col: C.paper, alpha: 0.6 * tw(t, 0.8, 2.4) });
  // background ridges, drawn around the camera with parallax
  const par = camX * 0.6;
  line(ctx, ridge(camX - 1800, camX + 1800, 520, 120, 7, 16, 0.0016).map(p => [p[0], p[1]]), { w: 2, col: C.paper, alpha: 0.12 });
  line(ctx, ridge(camX - 1800 - par, camX + 1800 - par, 600, 90, 13, 16, 0.002).map(p => [p[0] + par, p[1]]), { w: 2, col: C.paper, alpha: 0.2 });
  // goal branch (up) and wrong branch (right)
  const gIn = tw(t, 0.9, 2.0, E.outCubic);
  line(ctx, partial([[FORK.x, FORK.y], [FORK.x + 140, FORK.y - 160], [GOAL.x, GOAL.y + 40]], gIn), { w: 3, col: C.paper, alpha: 0.6 });
  line(ctx, partial([[FORK.x, FORK.y], [FORK.x + 12000, roadW(FORK.x + 12000)]], gIn), { w: 3, col: C.paper, alpha: 0.6 });
  // goal star
  const gs = spring(t, 1.6, { freq: 2, damp: 0.5 });
  if (gs > 0) {
    ctx.save(); ctx.translate(GOAL.x, GOAL.y); ctx.scale(gs, gs); ctx.fillStyle = C.red; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 16 : 40, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.fill(); ctx.restore();
    label(ctx, '目标  GOAL', GOAL.x + 60, GOAL.y, { t, t0: 1.9, size: 28, col: C.red, weight: 700 });
  }
  // distance markers along the wrong road
  for (let k = 1; k < 40; k++) {
    const mx = FORK.x + k * 420; if (Math.abs(mx - camX) > 1400) continue;
    line(ctx, [[mx, roadW(mx) - 14], [mx, roadW(mx) + 14]], { w: 2, col: C.paper, alpha: 0.35 * gIn });
    label(ctx, `${k * 3} km`, mx, roadW(mx) + 42, { t, t0: 0, size: 20, col: C.paper2, align: 'center', alpha: 0.7 * gIn });
  }
  // walker: appears at the fork, checks a map, then goes the wrong way
  const wx = walkerAt(t);
  const fin = spring(t, 1.5, { freq: 1.8, damp: 0.6 });
  if (fin > 0) {
    // dashed tether back to the goal: it only gets longer
    if (t > 3.6) line(ctx, [[wx, roadW(wx) - 120], [GOAL.x, GOAL.y]], { w: 2, col: C.red, dash: [10, 12], alpha: 0.7 });
    const moving = t > 3.6 && t < FREEZE;
    figure(ctx, wx, roadW(wx), 2.4, { walk: moving ? wx * 0.028 : null, reach: t < 3.6 ? 0.55 : 0, alpha: clamp(fin * 2), turn: 1 }, C.paper);
    if (t < 3.7) { ctx.fillStyle = C.paper2; ctx.fillRect(wx + 40, roadW(wx) - 130, 34, 26); } // the map
  }
}

SHOTS.s05 = (ctx, t) => {
  const tf = Math.min(t, FREEZE);
  const wx = walkerAt(t);
  // camera: slide along the arrow to the fork, then track the walker
  let cam = camLerp(S04_END, { x: FORK.x + 120, y: 600, z: 1.1 }, tw(t, 0, 2.6, E.inOutCubic));
  if (t > 3.2) cam = camLerp(cam, { x: wx + 260, y: 640, z: 1.1 }, tw(t, 3.2, 4.8, E.inOutCubic));
  const collapse = tw(t, 15.3, 16.0, E.inCubic);

  ctx.save(); ctx.globalAlpha = 1 - collapse;
  withCam(ctx, cam, () => {
    if (t < 2.6) { ctx.save(); ctx.globalAlpha *= 1 - tw(t, 0.6, 2.2); label(ctx, 'MODEL 2.0', 150, 250, { t: 99, size: 30, col: C.red, weight: 700 }); model2(ctx, 99); ctx.restore(); }
    s05World(ctx, t, cam.x);
  });
  ctx.restore();

  // HUD: the numbers that keep rewarding the wrong road
  const u = Math.max(0, tf - 3.6);
  const persist = 60 + 39.9 * (1 - Math.exp(-u / 3.2));
  const index = 96 + 3.9 * (1 - Math.exp(-u / 3.5));
  const km = Math.max(0, (wx - FORK.x) / 140);
  const hud = [['坚持 PERSISTENCE', persist.toFixed(1)], ['精神指数 INDEX', index.toFixed(1)], ['离目标 FROM GOAL', `${km.toFixed(0)} km`]];
  const hin = tw(t, 3.8, 4.4);
  hud.forEach(([k, v], i) => {
    const y = 130 + i * 70, a = hin * (1 - tw(t, 15.3 + i * 0.1, 15.7 + i * 0.1));
    label(ctx, k, 1260, y, { t: 99, size: 24, col: C.paper2, alpha: a });
    label(ctx, v, 1800, y, { t: 99, size: 40, col: i === 2 ? C.red : C.paper, align: 'right', weight: 700, alpha: a });
    line(ctx, [[1260, y + 30], [1800, y + 30]], { w: 1, col: C.paper, alpha: 0.15 * a });
  });

  // the question
  text(ctx, '错误的方向，', 140, 190, { size: 92, align: 'left', t, t0: 11.0, stagger: 0.06, out: 15.3 });
  text(ctx, '坚持越久，越伟大？', 140, 310, { size: 92, align: 'left', t, t0: 12.2, stagger: 0.06, out: 15.4 });
  en(ctx, 'The wrong way — and the longer you persist, the greater you are?', 146, 400, { t, t0: 12.8, size: 30, out: 15.4 });

  // logic conflict: red floods out from the centre
  const flood = tw(t, 15.9, 16.6, E.outQuart);
  if (flood > 0) {
    const w = W * flood, h = H * flood;
    ctx.fillStyle = C.red; ctx.fillRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
    const out = 19.4;
    text(ctx, '逻辑冲突', 140, 470, { size: 190, col: C.ink, align: 'left', t, t0: 16.3, stagger: 0.08, out });
    en(ctx, 'LOGIC CONFLICT', 146, 640, { t, t0: 16.7, size: 72, col: C.ink, font: MONO, weight: 700, spacing: 6, out });
    label(ctx, 'PERSISTENCE ↑   DIRECTION ✕   →   SCORE ?', 150, 740, { t, t0: 17.3, size: 26, col: C.ink, alpha: 1 - tw(t, out, out + 0.4) });
  }
  vignette(ctx, flood > 0 ? 0.25 : 0.5);
};
