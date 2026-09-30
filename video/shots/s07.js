// Shot 7 · 竹篱 — tilt down from the stars to the hut at night. The AI recommends the
// nearest fence for torches; a hand reaches for it, stops, withdraws. Torches appear far
// off in the bamboo forest instead. The fence stays whole.

const FENCE = { x0: 1040, x1: 1880, top: 700, base: 1000 };
const TORCH_PATH = [[1180, 610], [1330, 575], [1450, 590], [1600, 540], [1760, 520], [1900, 470], [2100, 440]];
const FIRE_RIM = 'rgba(240,150,80,0.75)';

function fence(ctx, { x0, x1, top, base }, rimA = 1) {
  for (let x = x0, i = 0; x < x1; x += 36, i++) {
    const h = (base - top) * (0.92 + rnd(i, 71) * 0.12), y = base - h, w = 24;
    ctx.fillStyle = '#1B1D20';
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, y + 12); ctx.lineTo(x + w / 2, y - 6); ctx.lineTo(x + w, y + 12); ctx.lineTo(x + w, base); ctx.fill();
    // nodes of the bamboo
    for (let k = 1; k < 4; k++) line(ctx, [[x, y + k * h / 4], [x + w, y + k * h / 4]], { w: 2, col: '#0B0C0E' });
    line(ctx, [[x + 1, base], [x + 1, y + 12]], { w: 2, col: FIRE_RIM, alpha: 0.35 * rimA * (1 - (x - x0) / (x1 - x0)) });
  }
  [base - (base - top) * 0.3, base - (base - top) * 0.72].forEach(ry => {
    line(ctx, [[x0 - 20, ry], [x1 + 10, ry + 6]], { w: 12, col: '#141518' });
    for (let x = x0 + 12; x < x1; x += 72) line(ctx, [[x - 6, ry - 10], [x + 6, ry + 10]], { w: 4, col: '#5E5646', alpha: 0.7 });
  });
}

function torch(ctx, x, y, t, i, a = 1) {
  const fl = 0.8 + 0.2 * noise1(t * 8 + i * 3, 90 + i);
  const g = ctx.createRadialGradient(x, y, 1, x, y, 38 * fl);
  g.addColorStop(0, `rgba(240,138,60,${0.5 * a})`); g.addColorStop(1, 'rgba(240,138,60,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 45, y - 45, 90, 90);
  dot(ctx, x, y, 4 * fl, C.fire, a); dot(ctx, x, y + 0.5, 2, '#FFE2B8', a);
}

function nightWorld(ctx, t, figX, figTurn, figWalk, torchT0 = 15.0) {
  // far ridges + forest
  fillRidge(ctx, ridge(-400, 2400, 560, 170, 11, 14), 1400, '#16191D');
  fillRidge(ctx, ridge(-400, 2400, 660, 140, 23, 14), 1400, '#111316');
  bamboo(ctx, 1450, 2300, 720, 17, 420, 0.9);
  // ground
  ctx.fillStyle = '#0C0D0F'; ctx.fillRect(-400, 760, 2800, 800);
  line(ctx, [[-400, 760], [2400, 760]], { w: 2, col: C.paper, alpha: 0.12 });
  hut(ctx, 430, 760, 1.25, 1);
  // warm pool from the door on the ground
  const g = ctx.createRadialGradient(470, 790, 10, 470, 790, 700);
  g.addColorStop(0, 'rgba(240,138,60,0.18)'); g.addColorStop(1, 'rgba(240,138,60,0)');
  ctx.fillStyle = g; ctx.fillRect(-1000, -600, 3600, 2600);
  // torches along the far path, lit one by one, drifting uphill
  for (let i = 0; i < 6; i++) {
    const t0 = torchT0 + i * 0.5; if (t < t0) continue;
    const p = clamp(0.04 + i * 0.1 + rnd(i, 55) * 0.05 + (t - t0) * 0.01);
    const pos = partial(TORCH_PATH, p).slice(-1)[0];
    torch(ctx, pos[0], pos[1], t, i, clamp((t - t0) / 0.4) * lerp(1, 0.7, i / 6));
  }
  // the person (dark silhouette, rim-lit by the fire)
  if (figX != null) figure(ctx, figX, 900, 2.7, { walk: figWalk, turn: figTurn }, '#08090A', FIRE_RIM);
  fence(ctx, FENCE);
}

SHOTS.s07 = (ctx, t) => {
  const closeUp = t >= 10.0 && t < 14.0;
  if (!closeUp) {
    // wide: tilt down from the stars, later a slow pull back
    const tilt = tw(t, 0.2, 3.4, E.inOutCubic);
    let cam = { x: 960, y: lerp(-200, 600, tilt), z: 1.06 };
    if (t >= 14) cam = camLerp({ x: 1000, y: 600, z: 1.1 }, { x: 1000, y: 580, z: 1.0 }, tw(t, 14, 20, E.inOutSine));
    // who is where
    let figX = null, turn = 1, walk = null;
    if (t > 7.4 && t < 10) { const p = tw(t, 7.6, 9.9, E.inOutSine); figX = lerp(470, 980, p); walk = p > 0 && p < 1 ? figX * 0.03 : null; }
    if (t >= 14) { const p = tw(t, 14.4, 19.5, E.inOutSine); figX = lerp(980, 1520, p); walk = p > 0 && p < 1 ? figX * 0.03 : null; }
    withCam(ctx, cam, () => {
      STARS.forEach(([x, y, s, a]) => dot(ctx, x, y - 740, s, C.paper, a));
      nightWorld(ctx, t, figX, turn, walk);
      // AI: nearest fence = lowest cost
      if (t > 6.6) {
        const grey = t >= 14 ? 1 : 0;
        aiBox(ctx, FENCE.x0 - 20, FENCE.top - 30, FENCE.x1 - FENCE.x0 + 30, FENCE.base - FENCE.top + 40, t, 6.8,
          { labelTxt: grey ? '✕ 未执行  NOT TAKEN' : '推荐 RECOMMENDED · 距离最近 NEAREST · 成本最低 LOWEST COST', col: grey ? C.line : C.red, dashOff: t * 30, labelSize: 24, alpha: 1 - tw(t, 15.5, 16.5) });
      }
    });
    // prediction mismatch readout, top-left
    const a = 1 - tw(t, 5.6, 6.2);
    label(ctx, '预测 PREDICTION   保留 KEEP', 140, 120, { t, t0: 0.6, size: 26, col: C.paper2, alpha: a });
    label(ctx, '实际 ACTUAL       留下 GIVEN   ✕', 140, 162, { t, t0: 1.4, size: 26, col: C.red, alpha: a, weight: 700 });
  } else {
    // close-up: three slats, a grey sleeve reaching in — and stopping
    const u = t;
    bg(ctx, '#0B0C0E');
    const g = ctx.createRadialGradient(200, 500, 10, 200, 500, 900);
    g.addColorStop(0, 'rgba(240,138,60,0.22)'); g.addColorStop(1, 'rgba(240,138,60,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const cam = camLerp({ x: 960, y: 540, z: 1 }, { x: 1000, y: 540, z: 1.08 }, tw(u, 10, 14, E.inOutSine));
    withCam(ctx, cam, () => {
      [1100, 1290, 1480, 1670].forEach((x, i) => {
        ctx.fillStyle = '#1F2124'; ctx.fillRect(x, -100, 150, 1300);
        for (let k = 0; k < 4; k++) { const y = 80 + k * 300 + i * 40; line(ctx, [[x, y], [x + 150, y]], { w: 6, col: '#0E0F11' }); }
        line(ctx, [[x + 3, -100], [x + 3, 1200]], { w: 4, col: FIRE_RIM, alpha: 0.45 - i * 0.1 });
      });
      [300, 760].forEach(ry => { line(ctx, [[1060, ry], [1900, ry + 10]], { w: 34, col: '#151618' }); });
      const reach = tw(u, 10.2, 11.4, E.outCubic), back = tw(u, 12.8, 13.9, E.inOutCubic);
      const wx = lerp(-260, 820, reach) - back * 1100;
      const curl = tw(u, 12.1, 12.6) * 0.5 * (1 - back);
      ctx.save(); ctx.translate(wx, 560); ctx.scale(1.45, 1.45);
      line(ctx, [[-700, 90], [0, 0]], { w: 92, col: '#3A3D38', cap: 'butt' });
      ctx.save(); ctx.translate(-330, 44); ctx.rotate(-0.12); ctx.fillStyle = '#4A4C45'; ctx.fillRect(-26, -20, 44, 34); ctx.restore();
      hand(ctx, 0, 0, -0.12, curl, true);
      ctx.restore();
      aiBox(ctx, 1080, 120, 780, 820, u, 10.1, { labelTxt: u > 13.0 ? '✕ 未执行  NOT TAKEN' : '拆除  TAKE DOWN', col: u > 13.0 ? C.line : C.red, dashOff: u * 30, labelSize: 26 });
    });
  }
  vignette(ctx, 0.6);
};
