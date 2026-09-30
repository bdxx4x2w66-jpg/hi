// Shot 9 · 选择 = — the model has failed; he types the new rules, stops at "choice =",
// sees the moments again, and deletes it all, character by character.

const LINES = [
  { zh: '苦难 ≠ 精神', en: 'HARDSHIP  ≠  SPIRIT', type: [4.3, 5.4], del: [12.8, 13.5] },
  { zh: '坚持 ≠ 精神', en: 'PERSISTENCE  ≠  SPIRIT', type: [5.9, 7.0], del: [12.0, 12.7] },
  { zh: '选择 = ', en: 'CHOICE  =', type: [7.6, 8.3], del: [11.4, 11.9] },
];
const LINE_Y = [380, 550, 720], LX = 250;
const FLASH = [[10.1, 's06', 15.2], [10.4, 's07', 12.2], [10.7, 's03', 19.0], [11.0, 's05', 9.5]];

function typed(str, t, [a, b], [d0, d1]) {
  const chars = [...str];
  let n = Math.round(clamp((t - a) / (b - a)) * chars.length);
  n -= Math.round(clamp((t - d0) / (d1 - d0)) * chars.length);
  return chars.slice(0, Math.max(0, n)).join('');
}

SHOTS.s09 = (ctx, t) => {
  // flashback cuts: the moments that don't fit a formula
  const fb = FLASH.find(([a]) => t >= a && t < a + 0.3);
  if (fb) {
    SHOTS[fb[1]](ctx, fb[2]);
    ctx.fillStyle = 'rgba(15,17,20,0.25)'; ctx.fillRect(0, 0, W, H);
    return;
  }
  let cam = camLerp({ x: 960, y: 540, z: 1 }, { x: 640, y: 640, z: 1.32 }, tw(t, 8.0, 10.1, E.inOutCubic));
  if (t > 11.3) cam = camLerp({ x: 640, y: 640, z: 1.32 }, { x: 960, y: 540, z: 1 }, tw(t, 11.3, 13.8, E.inOutCubic));

  withCam(ctx, cam, () => {
    // the failure
    label(ctx, 'ERROR  ·  NO ANSWER', 146, 360, { t, t0: 0.1, size: 26, col: C.red, weight: 700, alpha: 1 - tw(t, 2.1, 2.4) });
    text(ctx, '精神指数模型失效', 140, 470, { size: 116, align: 'left', t, t0: 0.05, stagger: 0.05, out: 2.1 });
    en(ctx, 'SPIRIT INDEX MODEL FAILED', 146, 590, { t, t0: 0.4, size: 40, col: C.red, font: MONO, weight: 700, spacing: 4, out: 2.1 });

    // rebuild prompt
    const pa = 1 - tw(t, 13.4, 14.0);
    label(ctx, '重新建立评分模型？   REBUILD SCORING MODEL?', 146, 170, { t, t0: 2.7, size: 26, col: C.paper2, alpha: pa });
    label(ctx, '[ Y ]  N', 146, 214, { t, t0: 3.6, size: 26, col: C.red, weight: 700, alpha: pa });

    // editor gutter
    const ga = tw(t, 3.8, 4.3) * (1 - tw(t, 14.2, 15.2));
    line(ctx, [[210, 300], [210, 800]], { w: 2, col: C.red, alpha: 0.6 * ga });
    LINE_Y.forEach((y, i) => label(ctx, `0${i + 1}`, 150, y, { t: 99, size: 24, col: C.line, alpha: ga }));

    // typed lines
    let cur = [LX, LINE_Y[0]];
    LINES.forEach((L, i) => {
      const s = typed(L.zh, t, L.type, L.del);
      ctx.save(); ctx.font = `900 112px ${SERIF}`; ctx.fillStyle = i === 2 ? C.red : C.paper; ctx.textBaseline = 'middle';
      ctx.fillText(s, LX, LINE_Y[i]);
      const w = ctx.measureText(s).width; ctx.restore();
      if (s.length) {
        en(ctx, L.en, LX + 4, LINE_Y[i] + 78, { t, t0: L.type[1] - 0.2, size: 26, font: MONO, weight: 700, spacing: 3, out: L.del[0] - 0.2 });
      }
      const active = (t >= L.type[0] && t < L.del[1]) || (i === 0 && t >= L.del[1]);
      if (active) cur = [LX + w + 8, LINE_Y[i]];
    });
    // cursor: steady while typing, blinking while he hesitates
    if (t > 3.9) {
      const typing = LINES.some(L => (t > L.type[0] && t < L.type[1]) || (t > L.del[0] && t < L.del[1]));
      if (typing || Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = C.paper; ctx.fillRect(cur[0], cur[1] - 60, 6, 120); }
    }
  });
  vignette(ctx, 0.5);
};
