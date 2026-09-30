// Shot 8 · 连续追问 — one torch becomes a status light; the questions stack up.
// Facts get an instant YES; every "why" gets a spinner that runs slower and slower.

const QS = [
  ['他们饿吗？', 'Were they hungry?', 0.3, { yes: 1.6 }],
  ['前面缺粮吗？', 'Was food short ahead?', 2.3, { yes: 3.8 }],
  ['拆篱笆是不是更快？', 'Would taking the fence be faster?', 4.5, { yes: 6.5 }],
  ['那为什么把米留下？', 'Then why leave the rice behind?', 7.3, { spin: [8.1, 9.9, 7] }],
  ['为什么不拆？', 'Why not take the fence?', 10.0, { spin: [10.6, 12.1, 3.6] }],
  ['如果没人知道呢？', 'What if no one would ever know?', 12.2, { spin: [12.9, 14.4, 1.2] }],
];
const TORCH_SCR = [1485, 525];

SHOTS.s08 = (ctx, t) => {
  // hand-off: push into one distant torch of the previous shot
  if (t < 0.9) {
    const z = Math.exp(tw(t, 0, 0.9, E.inCubic) * Math.log(9));
    ctx.save(); ctx.globalAlpha = 1 - tw(t, 0.35, 0.85);
    ctx.translate(TORCH_SCR[0], TORCH_SCR[1]); ctx.scale(z, z); ctx.translate(-TORCH_SCR[0], -TORCH_SCR[1]);
    SHOTS.s07(ctx, 19.99);
    ctx.restore();
  }
  const cam = camLerp({ x: 960, y: 540, z: 1.04 }, { x: 960, y: 540, z: 1 }, tw(t, 0.4, 14, E.outCubic));
  const rowsOut = 14.2;
  withCam(ctx, cam, () => {
    // the torch becomes the status light of the query log
    const m = tw(t, 0.2, 1.0, E.inOutCubic);
    const lx = lerp(TORCH_SCR[0], 146, m), ly = lerp(TORCH_SCR[1], 112, m);
    const la = 1 - tw(t, 19.2, 19.8);
    torch(ctx, lx, ly, t, 3, la);
    label(ctx, 'QUERY LOG  ·  追问', 176, 112, { t, t0: 0.9, size: 26, col: C.paper2, alpha: la });
    line(ctx, [[140, 150], [lerp(140, 1800, tw(t, 0.9, 1.9, E.outQuart)), 150]], { w: 1.5, col: C.paper, alpha: 0.2 * la });

    QS.forEach(([zh, e, t0, ans], i) => {
      const y = 230 + i * 112;
      const out = rowsOut + i * 0.06;
      text(ctx, zh, 140, y, { size: 54, align: 'left', t, t0, stagger: 0.035, out });
      en(ctx, e, 142, y + 44, { t, t0: t0 + 0.3, size: 22, out });
      const ax = 1560;
      if (ans.yes) {
        text(ctx, '是', ax, y, { size: 58, col: C.red, align: 'left', t, t0: ans.yes, out });
        en(ctx, 'YES', ax + 76, y + 4, { t, t0: ans.yes + 0.05, size: 26, col: C.red, font: MONO, weight: 700, out });
      } else {
        const [s0, s1, speed] = ans.spin;
        const oa = 1 - tw(t, out, out + 0.4);
        if (t > s0 && t < s1) {
          const a0 = (t - s0) * speed;
          arc(ctx, ax + 26, y, 22, a0, a0 + 1.4, { w: 4, col: C.paper, alpha: 0.9 * oa });
          arc(ctx, ax + 26, y, 22, 0, 7, { w: 1.5, col: C.paper, alpha: 0.15 * oa });
        }
        if (t >= s1) {
          label(ctx, '无法计算', ax, y - 4, { t, t0: s1, size: 30, col: C.paper2, weight: 700, alpha: oa, cps: 20 });
          label(ctx, 'CANNOT COMPUTE', ax, y + 34, { t, t0: s1 + 0.2, size: 18, col: C.line, alpha: oa });
        }
      }
    });

    // the line the whole film turns on
    text(ctx, '你能算他们受了多少苦，', 140, 420, { size: 96, align: 'left', t, t0: 14.8, stagger: 0.07, out: 18.7 });
    text(ctx, '却算不出，他们为什么这样做。', 140, 560, { size: 96, align: 'left', t, t0: 16.4, stagger: 0.07, out: 18.8 });
    en(ctx, 'You can calculate how much they suffered — but not why they did it.', 144, 670, { t, t0: 17.0, size: 32, out: 18.8 });
  });
  vignette(ctx, 0.5);
};
