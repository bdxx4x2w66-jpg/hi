// Shot 4 · 加一项 — B's hand becomes a candidate variable; every human variable fails
// to quantify; the system shuts, reboots as MODEL 2.0 with "persistence" in red.

const VARS = [['回头', 'TURNING BACK'], ['帮助同伴', 'HELPING OTHERS'], ['多承担', 'TAKING ON MORE'], ['责任', 'RESPONSIBILITY']];
const VAR_IN = [2.3, 2.9, 3.7, 4.5], VAR_FAIL = [3.3, 3.9, 4.9, 5.5];
const VBOX = { x: 1140, y0: 250, dy: 140, w: 640, h: 108 };
const ARROW_Y = 790, ARROW_X1 = 1780;

// MODEL 2.0 formula; returns token geometry so the camera can find "坚持"
function model2(ctx, t, t0 = 10.2, dry = false) {
  const toks = [['苦难', C.paper], ['+', C.paper2], ['坚持', C.red], ['=', C.paper2], ['精神', C.paper]];
  ctx.save(); ctx.font = `900 124px ${SERIF}`;
  const ws = toks.map(([s]) => ctx.measureText(s).width); ctx.restore();
  const gap = 44; let x = 150; const y = 520; const geo = [];
  if (dry) { toks.forEach((_, i) => { geo.push({ x, w: ws[i] }); x += ws[i] + gap; }); return { k: geo[2], y, ax: geo[2].x + geo[2].w / 2 }; }
  toks.forEach(([s, col], i) => {
    text(ctx, s, x, y, { size: 124, align: 'left', col, t, t0: t0 + i * 0.22, stagger: 0.07 });
    geo.push({ x, w: ws[i] }); x += ws[i] + gap;
  });
  const k = geo[2];
  // box around 坚持
  const bs = spring(t, t0 + 0.9, { freq: 2.2, damp: 0.5 });
  if (bs > 0) { ctx.save(); ctx.globalAlpha = clamp(bs * 2); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.strokeRect(k.x - 18, y - 88 - (1 - bs) * 20, k.w + 36, 176 + (1 - bs) * 40); ctx.restore(); }
  en(ctx, 'HARDSHIP  +  PERSISTENCE  =  SPIRIT', 154, 650, { t, t0: t0 + 1.1, size: 32, font: MONO, weight: 700, spacing: 3 });
  // arrow: from under 坚持 down and away to "high score"
  const ax = k.x + k.w / 2;
  const pts = [[ax, y + 172], [ax, ARROW_Y], [ARROW_X1, ARROW_Y]];
  const p = tw(t, t0 + 1.4, t0 + 2.4, E.inOutCubic);
  if (p > 0) {
    line(ctx, partial(pts, p), { w: 5, col: C.red });
    if (p > 0.98) {
      line(ctx, [[ARROW_X1 - 26, ARROW_Y - 16], [ARROW_X1, ARROW_Y], [ARROW_X1 - 26, ARROW_Y + 16]], { w: 5, col: C.red });
      label(ctx, '高分  HIGH SCORE', ARROW_X1, ARROW_Y - 40, { t, t0: t0 + 2.4, size: 28, col: C.red, align: 'right', weight: 700 });
    }
  }
  return { k, y, ax };
}

SHOTS.s04 = (ctx, t) => {
  const pull = tw(t, 1.2, 3.0, E.inOutCubic);
  let cam = camLerp(S03_END, { x: 960, y: 540, z: 1 }, pull);

  // after the reboot: push to 坚持, then slide along the arrow (continues in shot 5)
  let geo = null;
  const reboot = t > 9.1;
  if (reboot) {
    geo = model2(ctx, 99, 10.2, true);
    const kx = geo.k.x + geo.k.w / 2;
    const c1 = { x: kx + 80, y: 600, z: 1.45 };
    cam = camLerp({ x: 960, y: 540, z: 1 }, c1, tw(t, 12.9, 14.2, E.inOutCubic));
    cam = camLerp(cam, S04_END, tw(t, 14.1, 15, E.inCubic));
  }

  withCam(ctx, cam, () => {
    if (t < 2.6) { ctx.save(); ctx.globalAlpha = 1 - tw(t, 1.5, 2.5); s03Scene(ctx, 20); ctx.restore(); }
    if (!reboot) {
      // model 1.0 on the left
      const out = 7.6;
      label(ctx, 'MODEL 1.0', 150, 250, { t, t0: 2.2, size: 28, col: C.paper2, alpha: 1 - tw(t, out, out + 0.4) });
      text(ctx, '精神 = 苦难', 146, 430, { size: 120, align: 'left', t, t0: 2.3, stagger: 0.07, out });
      en(ctx, 'SPIRIT  =  HARDSHIP', 150, 540, { t, t0: 2.8, size: 32, font: MONO, weight: 700, spacing: 3, out });
      // candidate variables on the right
      VARS.forEach(([zh, e], i) => {
        const tin = VAR_IN[i], fail = tw(t, VAR_FAIL[i], VAR_FAIL[i] + 0.3);
        const s = spring(t, tin, { freq: 2.2, damp: 0.55 });
        const gone = tw(t, 7.6 + i * 0.08, 8.2 + i * 0.08, E.inCubic);
        if (s <= 0 || gone >= 1) return;
        let x = VBOX.x + gone * 300, y = VBOX.y0 + i * VBOX.dy, w = VBOX.w, h = VBOX.h;
        // the first box flies in from B's hand
        if (i === 0) {
          const f = tw(t, 0.3, 2.3, E.inOutCubic);
          x = lerp(S03_HAND.x - 90, x, f); y = lerp(S03_HAND.y - 70, y, f); w = lerp(180, w, f); h = lerp(140, h, f);
        }
        ctx.save(); ctx.globalAlpha = clamp(s * 2) * (1 - gone);
        ctx.strokeStyle = fail > 0.5 ? C.line : C.red; ctx.lineWidth = 3; ctx.setLineDash(fail > 0.5 ? [10, 8] : []);
        ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
        ctx.globalAlpha *= lerp(1, 0.4, fail);
        ctx.font = `900 48px ${SERIF}`; ctx.fillStyle = C.paper; ctx.textBaseline = 'middle';
        if (i > 0 || t > 2.2) {
          ctx.fillText(zh, x + 30, y + h / 2 - 12);
          ctx.font = `400 21px ${MONO}`; ctx.fillStyle = C.paper2; ctx.letterSpacing = '2px'; ctx.fillText(e, x + 32, y + h / 2 + 28);
        }
        ctx.restore();
        if (i === 0 && t < 2.3) label(ctx, '新变量  NEW VARIABLE', x, y - 22, { t, t0: 0.4, size: 22, col: C.red, weight: 700 });
        if (fail > 0) {
          ctx.save(); ctx.globalAlpha = fail * (1 - gone);
          ctx.font = `700 30px ${MONO}`; ctx.fillStyle = C.red; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText('✕  N/A', x + w - 28, y + h / 2); ctx.restore();
        }
      });
    } else {
      label(ctx, 'MODEL 2.0', 150, 250, { t, t0: 9.4, size: 30, col: C.red, weight: 700 });
      model2(ctx, t);
    }
  });

  // reboot: CRT-style collapse to a line and back
  if (t > 8.4 && t < 9.8) {
    const c1 = tw(t, 8.4, 8.7, E.inCubic), c2 = tw(t, 8.7, 8.95, E.inCubic), o1 = tw(t, 9.3, 9.8, E.outCubic);
    ctx.fillStyle = C.ink;
    if (t < 9.3) {
      const h = lerp(H, 3, c1), w = lerp(W, 0, c2);
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.paper; ctx.globalAlpha = 0.9 * (1 - c2 * 0.5); ctx.fillRect(W / 2 - w / 2, H / 2 - h / 2, w, h * (c1 < 1 ? 0.04 : 1)); ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 1 - o1; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
  }
  vignette(ctx, 0.5);
};
const S04_END = { x: 1320, y: ARROW_Y, z: 1.45 };
