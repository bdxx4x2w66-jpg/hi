// Shot 10 · 真正的满分 — "无法评分", pull out of the screen, the desk edge becomes
// the horizon of an ordinary morning road; three small everyday choices; he walks on.

const ROAD = { top: 862, bot: 948 };
const SIL = '#0B0C0E'; // people at dawn are dark silhouettes
const RIM = 'rgba(237,220,190,0.55)';
const V1 = 2350, V2 = 3250, V3 = 4150, WALKER0 = 4380;

function sky(ctx, dawn, camX) {
  // subtle dawn: ink at the top, pale warm grey down at the horizon (screen space)
  const g = ctx.createLinearGradient(0, 0, 0, 780);
  g.addColorStop(0, C.ink);
  g.addColorStop(0.55, `rgba(58,56,54,${dawn})`);
  g.addColorStop(1, `rgba(196,184,164,${dawn})`);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 780);
}

function farHills(ctx, camX, dawn) {
  // the Laoshanjie ridge echoes faintly on the horizon (strong parallax)
  const off = -(camX - 960) * 0.08;
  const pts = ridge(-200, 2200, DESK_Y, 90, 23, 14).map(p => [p[0] + off, p[1]]);
  ctx.save(); ctx.globalAlpha = 0.5 * dawn; fillRidge(ctx, pts, DESK_Y + 2, '#8E8578'); ctx.restore();
  const pts2 = ridge(-200, 2200, DESK_Y, 50, 41, 14).map(p => [p[0] + off * 1.6, p[1]]);
  ctx.save(); ctx.globalAlpha = 0.6 * dawn; fillRidge(ctx, pts2, DESK_Y + 2, '#6F685F'); ctx.restore();
}

function bike(ctx, x, y, up, s = 1) {
  // up: 0 lying flat on the ground (seen edge-on), 1 standing; it rotates about the ground line
  const k = lerp(0.16, 1, up);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s * k);
  const col = SIL;
  ctx.translate(0, -34);
  arc(ctx, -52, 0, 32, 0, 7, { w: 5, col });
  arc(ctx, 52, 0, 32, 0, 7, { w: 5, col });
  line(ctx, [[-52, 0], [-6, 0], [-22, -46], [36, -46], [52, 0]], { w: 6, col });
  line(ctx, [[-6, 0], [36, -46]], { w: 6, col });
  line(ctx, [[-22, -46], [-26, -58]], { w: 6, col });
  line(ctx, [[-38, -60], [-14, -60]], { w: 7, col });
  line(ctx, [[36, -46], [30, -70], [44, -72]], { w: 5, col });
  // shared-bike basket in the accent colour
  ctx.fillStyle = C.red; ctx.fillRect(40, -84, 30, 18);
  ctx.restore();
}

function papers(ctx, x, y, n, s = 1) {
  ctx.fillStyle = C.paper;
  for (let i = 0; i < n; i++) ctx.fillRect(x - 22 * s, y - (i + 1) * 7 * s, 44 * s, 5 * s);
}

// everything on the road, in world space
function roadWorld(ctx, t) {
  const S = 2.9, gy = ROAD.top + 42;
  // road strip
  ctx.fillStyle = '#1D1F22'; ctx.fillRect(-2000, ROAD.top, 9000, ROAD.bot - ROAD.top);
  line(ctx, [[-2000, ROAD.top], [7000, ROAD.top]], { w: 2, col: C.paper, alpha: 0.35 });
  for (let x = -2000; x < 7000; x += 180) line(ctx, [[x, (ROAD.top + ROAD.bot) / 2], [x + 80, (ROAD.top + ROAD.bot) / 2]], { w: 3, col: C.paper, alpha: 0.18 });

  // V1 · turns back to help a classmate carry the stack of papers
  ctx.save(); ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.strokeRect(V1 - 300, gy - 250, 130, 250); ctx.restore();
  label(ctx, '教室', V1 - 290, gy - 272, { t, t0: 0, size: 22, col: C.paper2 });
  const a1 = tw(t, 9.4, 10.6, E.inOutSine), back1 = tw(t, 10.9, 11.9, E.inOutCubic);
  const ax = V1 - 60 + a1 * 150 - back1 * 170;
  const facing1 = t < 10.8 ? 1 : -1;
  const walking1 = (t > 9.4 && t < 10.6) || (t > 10.9 && t < 11.9);
  figure(ctx, V1 - 180, gy, S, { sit: 0, slump: 0.6, reach: 0.4, turn: 1 }, SIL, RIM);
  papers(ctx, V1 - 140, gy - 70, t > 12.2 ? 3 : 6, 1.4);
  figure(ctx, ax, gy, S, { walk: walking1 ? t * 9 : null, turn: facing1, reach: t > 12.2 ? 0.5 : 0 }, SIL, RIM);
  if (t > 12.2) papers(ctx, ax - 40, gy - 72, 3, 1.4);

  // V2 · on a bench: deletes the wrong citation and rewrites it
  line(ctx, [[V2 - 90, gy - 44], [V2 + 90, gy - 44]], { w: 8, col: C.ink3 });
  line(ctx, [[V2 - 80, gy - 44], [V2 - 80, gy]], { w: 6, col: C.ink3 });
  line(ctx, [[V2 + 80, gy - 44], [V2 + 80, gy]], { w: 6, col: C.ink3 });
  figure(ctx, V2 - 20, gy - 10, S, { sit: 1, reach: 0.7, turn: 1 }, SIL, RIM);
  const panel = { x: V2 + 40, y: gy - 330, w: 280, h: 190 };
  ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.globalAlpha = 0.55; ctx.strokeRect(panel.x, panel.y, panel.w, panel.h); ctx.restore();
  line(ctx, [[V2 + 40, gy - 76], [V2 + 20, gy - 140]], { w: 1.5, col: C.paper, alpha: 0.3 });
  for (let i = 0; i < 6; i++) {
    const yy = panel.y + 30 + i * 26, bad = i === 3;
    let w = [220, 190, 230, 200, 160, 210][i];
    let col = C.paper, a = 0.55;
    if (bad) {
      const sel = tw(t, 12.4, 12.8), del = tw(t, 13.2, 13.6), re = tw(t, 13.9, 14.8);
      col = sel > 0 && del < 1 ? C.red : C.paper; a = sel > 0 && del < 1 ? 1 : 0.55;
      w = del < 1 ? w * (1 - del) : 150 * re;
    }
    if (w > 1) line(ctx, [[panel.x + 22, yy], [panel.x + 22 + w, yy]], { w: bad ? 8 : 6, col, alpha: a });
  }

  // V3 · walks past a fallen shared bike, comes back, stands it up
  const w3 = tw(t, 12.6, 13.9, E.inOutSine), back3 = tw(t, 14.2, 14.9, E.inOutCubic);
  const bx3 = V3 - 250 + w3 * 330 - back3 * 150;
  const up = tw(t, 15.2, 16.1, E.outBack);
  bike(ctx, V3, gy, up, 1.25);
  const walking3 = (t > 12.6 && t < 13.9) || (t > 14.2 && t < 14.9);
  figure(ctx, bx3, gy, S, { walk: walking3 ? t * 9 : null, turn: t < 14.1 ? 1 : -1, reach: t > 14.9 ? 0.7 : 0 }, SIL, RIM);

  // the protagonist, hood down, walking on toward the sun
  const wx = WALKER0 + Math.max(0, t - 14.4) * 118;
  figure(ctx, wx, gy, S * 1.05, { walk: t > 14.4 ? t * 8.4 : null, hood: true, turn: 1 }, SIL, RIM);
}

SHOTS.s10 = (ctx, t) => {
  // UI verdict inside the monitor
  const verdictUI = c => {
    const spin = tw(t, 0, 2.4);
    if (t < 2.6) arc(c, 960, 540, 46, t * 2.2, t * 2.2 + 0.9 + spin * 0.4, { w: 4, col: C.paper, alpha: 0.8 * (1 - tw(t, 2.2, 2.6)) });
    label(c, 'RESULT', 180, 400, { t, t0: 2.5, size: 30, col: C.paper2 });
    text(c, '无法评分', 170, 540, { size: 200, align: 'left', t, t0: 2.6, stagger: 0.12 });
    const d = spring(t, 3.4, { freq: 2.2, damp: 0.45 });
    if (d > 0) dot(c, 170 + 4 * 200 + 50, 600, 18 * d, C.red);
  };

  // phases: in the screen → pull out to the room → room dissolves into the road
  const pull = tw(t, 4.6, 8.4, E.inOutQuart);
  const truck = tw(t, 8.8, 16.8, E.inOutSine);
  let cam = camLerp(CAM_SCREEN, CAM_WIDE, pull);
  cam = { ...cam, x: lerp(cam.x, 4520, truck), y: lerp(cam.y, 600, truck) };
  const dawn = tw(t, 7.8, 11.5, E.inOutSine);
  const roomA = 1 - tw(t, 8.2, 10.0, E.inOutCubic);

  sky(ctx, dawn, cam.x);
  // sun rises in the accent colour, low on the horizon
  const sunY = lerp(DESK_Y + 90, DESK_Y - 40, tw(t, 8, 20, E.outCubic));
  const sunX = lerp(1520, 1380, truck);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, (DESK_Y - cam.y) * cam.z + H / 2); ctx.clip();
  dot(ctx, sunX, (sunY - cam.y) * cam.z + H / 2, 70 * cam.z, C.red, dawn);
  ctx.restore();
  farHills(ctx, cam.x, dawn);

  withCam(ctx, cam, () => {
    if (roomA > 0) {
      ctx.save(); ctx.globalAlpha = roomA;
      // keep the wall dark while the room is still here
      ctx.fillStyle = `rgba(15,17,20,${1 - dawn})`; ctx.fillRect(-3000, -2000, 9000, 2000 + DESK_Y);
      room(ctx, verdictUI, { screenOn: 1 - tw(t, 7.6, 8.6), lamp: 1 - tw(t, 7.8, 9) });
      ctx.restore();
    }
    // ground: the desk's edge is now the horizon
    ctx.fillStyle = C.ink2; ctx.globalAlpha = 1 - roomA; ctx.fillRect(-3000, DESK_Y, 9000, 3000); ctx.globalAlpha = 1;
    line(ctx, [[-3000, DESK_Y], [7000, DESK_Y]], { w: 2, col: C.paper, alpha: 0.45 });
    ctx.save(); ctx.globalAlpha = tw(t, 8.6, 10); roadWorld(ctx, t); ctx.restore();
  });

  // closing words, upper left over the sky (never centred)
  text(ctx, '苦难只是问题，', 140, 190, { size: 76, align: 'left', t, t0: 11.6, stagger: 0.07, out: 16.4 });
  text(ctx, '人怎样回答，才构成精神。', 140, 300, { size: 76, align: 'left', t, t0: 12.4, stagger: 0.07, out: 16.5 });
  text(ctx, '有些东西无法评分', 140, 230, { size: 104, align: 'left', t, t0: 17.0, stagger: 0.09 });
  text(ctx, '满分', 146, 360, { size: 52, weight: 600, col: C.red, align: 'left', t, t0: 17.9, stagger: 0.12, spacing: 18 });

  // foreground: roadside grass and a lamp post sliding past faster than the road (depth)
  ctx.save(); ctx.globalAlpha = tw(t, 8.8, 10);
  const fx = -(cam.x - 960) * 1.35;
  for (let i = 0; i < 60; i++) {
    const x = ((i * 173 + fx) % 2400 + 2400) % 2400 - 240, h = 30 + rnd(i, 61) * 70;
    line(ctx, [[x, H + 10], [x + (rnd(i, 62) - 0.5) * 40, H - h]], { w: 5, col: '#08090A' });
  }
  const lp = ((1500 + fx) % 3200 + 3200) % 3200 - 400;
  line(ctx, [[lp, H + 20], [lp, 330], [lp + 70, 310]], { w: 16, col: '#08090A' });
  ctx.fillStyle = '#08090A'; ctx.fillRect(lp + 50, 304, 60, 18);
  ctx.restore();

  vignette(ctx, 0.45);
  const end = tw(t, 19.2, 20, E.inCubic);
  if (end > 0) { ctx.fillStyle = `rgba(15,17,20,${end})`; ctx.fillRect(0, 0, W, H); }
};
