// Shot 3 · 98 = 98？ — the "1" falls away, the two zeros become two identical
// windows. A walks on; B walks on, stops, turns back and offers a hand. Both score 98.
// (Drawn directly in UI space: the camera is already inside the monitor.)

const WA = { x: 120, y: 140, w: 780, h: 560 }, WB = { x: 1020, y: 140, w: 780, h: 560 };
const pathY = x => 470 - 60 * (x + 20) / 820;
const COMP_X = 430;

function walkerX(t, b) {
  const a = x => lerp(-40, 880, tw(x, 2.6, 10.6, E.inOutSine));
  if (!b || t < 6.6) return a(t);
  const xs = a(6.6) + (a(7.3) - a(6.6)) * 0.55;
  if (t < 8.2) return lerp(a(6.6), xs, E.outCubic(clamp((t - 6.6) / 0.6)));
  return lerp(xs, 552, tw(t, 8.2, 9.2, E.inOutSine));
}

// one window's simulation at shot-3 time t
function simWindow(ctx, win, t, isB, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(win.x, win.y);
  rrect(ctx, 0, 0, win.w, win.h, 18); ctx.fillStyle = C.ink2; ctx.fill(); ctx.clip();
  for (let gx = 60; gx < win.w; gx += 60) line(ctx, [[gx, 0], [gx, win.h]], { w: 1, col: C.paper, alpha: 0.04 });
  for (let gy = 60; gy < win.h; gy += 60) line(ctx, [[0, gy], [win.w, gy]], { w: 1, col: C.paper, alpha: 0.04 });
  line(ctx, ridge(-20, win.w + 20, 290, 90, 5, 10, 0.006), { w: 2, col: C.paper, alpha: 0.22 });
  line(ctx, ridge(-20, win.w + 20, 360, 60, 9, 10, 0.008), { w: 2, col: C.paper, alpha: 0.14 });
  line(ctx, [[-20, pathY(-20)], [win.w + 20, pathY(win.w + 20)]], { w: 3, col: C.paper, alpha: 0.6 });
  // the tired companion, sitting by the path
  const rise = isB ? tw(t, 10.9, 11.6, E.inOutCubic) : 0;
  figure(ctx, COMP_X, pathY(COMP_X), 2.5, { sit: 1 - rise, slump: 1 - rise, reach: isB ? tw(t, 9.8, 10.3) * 0.8 : 0, turn: 1, lift: 0.6 }, C.paper2);
  // the walker
  const x = walkerX(t, isB);
  const moving = isB ? (t > 2.6 && t < 7.0) || (t > 8.2 && t < 9.2) : t > 2.6 && t < 10.6;
  const back = isB && t > 8.0;
  figure(ctx, x, pathY(x), 2.5, {
    walk: moving ? x * 0.11 * (back ? -1 : 1) : null,
    turn: back ? -1 : 1,
    reach: isB ? tw(t, 9.2, 9.9, E.outCubic) * 0.9 : 0, lift: 0.2,
  }, C.paper);
  ctx.restore();
  // frame + label
  ctx.save(); ctx.globalAlpha *= alpha;
  rrect(ctx, win.x, win.y, win.w, win.h, 18); ctx.strokeStyle = C.paper; ctx.globalAlpha *= 0.5; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  label(ctx, isB ? 'B' : 'A', win.x + 28, win.y + 40, { t, t0: 2.3, size: 36, weight: 700, col: C.paper, alpha });
}

// the whole shot-3 picture (reused by shot 4 and the shot-9 flashback)
function s03Scene(ctx, t) {
  const morph = tw(t, 0.6, 2.2, E.inOutQuart);
  // ring + header fading away
  if (t < 1) {
    ctx.save(); ctx.globalAlpha = 1 - tw(t, 0, 0.8);
    indexUI(ctx, { t: 99, header: -10, ringIn: 1, spinAlpha: 0, fill: 1, score: 100, scoreAlpha: 0, barsIn: [0, 0, 0, 0, 0], bars: [0, 0, 0, 0, 0] });
    ctx.restore();
  }
  ctx.save(); ctx.font = `700 210px ${MONO}`; const adv = ctx.measureText('0').width; ctx.restore();
  // the falling "1"
  if (t < 1.6) {
    const tip = 0.25 + tw(t, 0, 1.2, E.inCubic) * 1.6;
    ctx.save(); ctx.font = `700 210px ${MONO}`; ctx.fillStyle = C.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(RING.x - adv, RING.y + 10);
    ctx.translate(-adv * 0.3, 100); ctx.rotate(-tip); ctx.translate(adv * 0.3, -100 + tip * tip * 900);
    ctx.fillText('1', 0, 0); ctx.restore();
  }
  // zeros → windows
  [[WA, 0], [WB, 1]].forEach(([win, k]) => {
    const gx = RING.x + k * adv, gy = RING.y + 10;
    const cx = lerp(gx, win.x + win.w / 2, morph), cy = lerp(gy, win.y + win.h / 2, morph);
    const w = lerp(adv * 0.82, win.w, morph), h = lerp(150, win.h, morph);
    if (morph < 1) {
      ctx.save(); ctx.globalAlpha = 1 - tw(t, 0.6, 1.2);
      ctx.font = `700 210px ${MONO}`; ctx.fillStyle = C.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('0', gx, gy); ctx.restore();
      ctx.save(); ctx.globalAlpha = tw(t, 0.6, 0.9);
      rrect(ctx, cx - w / 2, cy - h / 2, w, h, lerp(40, 18, morph)); ctx.strokeStyle = C.paper; ctx.lineWidth = lerp(18, 2, morph); ctx.stroke();
      ctx.restore();
    } else simWindow(ctx, win, t, k === 1, 1);
  });
  // the scores: 98 under each window, then "=", then "?"
  const sc = (x, t0, str, col = C.paper) => {
    const s = spring(t, t0, { freq: 2.2, damp: 0.45 });
    if (s <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(s * 2); ctx.translate(x, 812); ctx.scale(lerp(0.6, 1, s), lerp(0.6, 1, s));
    ctx.font = `700 150px ${MONO}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(str, 0, 0); ctx.restore();
  };
  sc(WA.x + WA.w / 2, 12.3, '98'); sc(WB.x + WB.w / 2, 12.3, '98');
  sc(960, 13.4, '=', C.paper2); sc(WB.x + WB.w / 2 + 220, 16.7, '?', C.red);
}

const S03_HAND = { x: WB.x + 552 - 40, y: WB.y + pathY(552) - 70 };
const S03_END = { x: S03_HAND.x, y: S03_HAND.y, z: 2.2 };

SHOTS.s03 = (ctx, t) => {
  let cam = camLerp({ x: 760, y: 560, z: 1.12 }, { x: 960, y: 540, z: 1 }, tw(t, 0.4, 2.2, E.inOutCubic));
  if (t > 17.2) cam = camLerp(cam, S03_END, tw(t, 17.2, 20, E.inOutCubic));
  withCam(ctx, cam, () => s03Scene(ctx, t));
  vignette(ctx, 0.5);
};
