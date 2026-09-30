// Shot 6 · 一袋米 — search the real record, the map's contour lines grow into
// 1934 Laoshanjie, into the hut, and the rice bag is pushed across to the host.

// ---------- Laoshanjie landscape (shared with shot 7) ----------
const HILLS = [
  { base: 520, amp: 200, seed: 11, col: '#2B3037', par: 0.25 },
  { base: 610, amp: 230, seed: 23, col: '#23272D', par: 0.45 },
  { base: 700, amp: 210, seed: 37, col: '#1B1F24', par: 0.65 },
  { base: 800, amp: 180, seed: 41, col: '#15181C', par: 0.85 },
];
const HUT = { x: 1240, y: 742 };

function hut(ctx, x, y, s, doorGlow = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#0E1013';
  ctx.fillRect(-90, -90, 180, 90);
  ctx.beginPath(); ctx.moveTo(-120, -88); ctx.lineTo(0, -160); ctx.lineTo(120, -88); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(237,230,216,0.22)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-120, -88); ctx.lineTo(0, -160); ctx.lineTo(120, -88); ctx.stroke();
  for (let i = -80; i <= 80; i += 16) line(ctx, [[i, -86], [i, 0]], { w: 1.5, col: C.paper, alpha: 0.07 });
  // door, lit from the fire inside
  const g = ctx.createRadialGradient(10, -30, 4, 10, -30, 120);
  g.addColorStop(0, `rgba(240,138,60,${0.35 * doorGlow})`); g.addColorStop(1, 'rgba(240,138,60,0)');
  ctx.fillStyle = g; ctx.fillRect(-120, -140, 260, 160);
  ctx.fillStyle = `rgba(240,150,80,${0.95 * doorGlow})`; ctx.fillRect(-6, -58, 32, 58);
  ctx.restore();
}

function bamboo(ctx, x0, x1, yBase, seed, h = 520, alpha = 1) {
  for (let i = 0; i < 26; i++) {
    const x = lerp(x0, x1, rnd(i, seed)), hh = h * lerp(0.6, 1, rnd(i, seed + 1)), lean = (rnd(i, seed + 2) - 0.5) * 0.12;
    const top = [x + lean * hh, yBase - hh];
    line(ctx, [[x, yBase], top], { w: 5, col: '#101215', alpha });
    for (let k = 1; k < 6; k++) {
      const p = mix2([x, yBase], top, k / 6);
      line(ctx, [[p[0] - 4, p[1]], [p[0] + 4, p[1]]], { w: 2, col: '#101215', alpha });
      if (rnd(i * 7 + k, seed) > 0.45) {
        const d = rnd(i * 3 + k, seed) > 0.5 ? 1 : -1;
        line(ctx, [p, [p[0] + d * 34, p[1] + 8], [p[0] + d * 54, p[1] + 20]], { w: 6, col: '#101215', alpha });
      }
    }
  }
}

function fog(ctx, y, h, t, a = 0.07, seed = 1) {
  for (let k = 0; k < 3; k++) {
    const off = (t * (8 + k * 5) + rnd(k, seed) * 900) % 900;
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, 'rgba(237,230,216,0)'); g.addColorStop(0.5, `rgba(237,230,216,${a})`); g.addColorStop(1, 'rgba(237,230,216,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-400 + off + k * 900, y, 900, h, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// contour: 0 = map (lines only), 1 = landscape (filled, fog, parallax)
function landscape(ctx, t, contour, camX = 960, { night = 0, hutGlow = 1 } = {}) {
  HILLS.forEach((L, i) => {
    const shift = (camX - 960) * (1 - L.par) * contour;
    const spread = lerp(0.35, 1, contour);           // map: ridges packed close like contours
    const base = lerp(560 + i * 40, L.base, contour);
    const pts = ridge(-600 + shift, 2600 + shift, base, L.amp * spread, L.seed).map(p => [p[0] - shift * 0, p[1]]);
    if (contour > 0) {
      ctx.save(); ctx.globalAlpha = contour; fillRidge(ctx, pts, 1400, L.col); ctx.restore();
    }
    line(ctx, pts, { w: 2, col: C.paper, alpha: lerp(0.55, 0.12, contour) });
    // extra contour rings, only on the map
    if (contour < 1) for (let k = 1; k <= 3; k++) {
      const c = pts.map(p => [p[0], p[1] + k * 26 * (1 - contour) + (p[1] - base) * -0.18 * k]);
      line(ctx, c, { w: 1.5, col: C.paper, alpha: 0.3 * (1 - contour) });
    }
    if (contour > 0.3 && i < 3) fog(ctx, base + 20, 60, t, 0.06 * contour * (1 - night * 0.6), i + 3);
    if (i === 2 && contour > 0) {
      ctx.save(); ctx.globalAlpha = contour; hut(ctx, HUT.x, HUT.y, 1, hutGlow); ctx.restore();
    }
    if (i === 3 && contour > 0) {
      ctx.save(); ctx.globalAlpha = contour; bamboo(ctx, 1500, 2300, 1000, 5, 700); bamboo(ctx, -400, 250, 1000, 9, 640); ctx.restore();
    }
  });
}

// ---------- close-up props ----------
const TABLE_Y = 730;

function riceBag(ctx, x, y, s = 1, sway = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(sway);
  const p = new Path2D();
  p.moveTo(-150, 0);
  p.bezierCurveTo(-178, -60, -170, -190, -104, -238);
  p.bezierCurveTo(-70, -262, -40, -270, -26, -290);
  p.lineTo(26, -290);
  p.bezierCurveTo(40, -270, 70, -262, 104, -238);
  p.bezierCurveTo(170, -190, 178, -60, 150, 0);
  p.closePath();
  ctx.fillStyle = '#B9AE98'; ctx.fill(p);
  ctx.save(); ctx.clip(p);
  // weave texture
  for (let yy = -290; yy < 0; yy += 9) line(ctx, [[-180, yy], [180, yy + 3]], { w: 1.5, col: '#8E846F', alpha: 0.35 });
  for (let xx = -180; xx < 180; xx += 11) line(ctx, [[xx, -300], [xx + 4, 0]], { w: 1, col: '#8E846F', alpha: 0.2 });
  // shade + patch
  ctx.fillStyle = 'rgba(15,17,20,0.35)'; ctx.beginPath(); ctx.ellipse(120, -90, 90, 180, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#A39880'; ctx.fillRect(-90, -130, 62, 52);
  line(ctx, [[-90, -130], [-28, -130], [-28, -78], [-90, -78], [-90, -130]], { w: 2, col: '#6F6756', dash: [5, 5] });
  ctx.restore();
  // gathered neck + tie
  ctx.fillStyle = '#A99E86';
  ctx.beginPath(); ctx.moveTo(-26, -290); ctx.lineTo(-44, -330); ctx.lineTo(-10, -318); ctx.lineTo(0, -338); ctx.lineTo(12, -318); ctx.lineTo(46, -332); ctx.lineTo(26, -290); ctx.closePath(); ctx.fill();
  line(ctx, [[-32, -292], [32, -292]], { w: 8, col: '#5E5646' });
  line(ctx, [[20, -292], [52, -270], [60, -246]], { w: 4, col: '#5E5646' });
  ctx.restore();
}

// A forearm + hand. From shoulder point `from` to wrist `to`; the hand points along `ang`.
// cuff: 'plain' (Red Army, worn grey) or 'yao' (host, embroidered band)
function arm(ctx, from, to, ang, { cuff = 'plain', open = 0, flip = false } = {}) {
  const sleeve = cuff === 'yao' ? '#1C1E26' : '#3A3D38';
  line(ctx, [from, to], { w: 92, col: sleeve, cap: 'butt' });
  if (cuff === 'yao') {
    const d = [to[0] - from[0], to[1] - from[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L];
    const c0 = [to[0] - u[0] * 70, to[1] - u[1] * 70], c1 = [to[0] - u[0] * 30, to[1] - u[1] * 30];
    line(ctx, [c0, c1], { w: 98, col: C.red, cap: 'butt' });
    // tiny geometric embroidery
    ctx.save(); ctx.translate(...mix2(c0, c1, 0.5)); ctx.rotate(Math.atan2(u[1], u[0]));
    ctx.fillStyle = C.paper;
    for (let k = -3; k <= 3; k++) { ctx.save(); ctx.translate(0, k * 13); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
    ctx.restore();
  } else {
    // worn patch on the grey sleeve
    const m = mix2(from, to, 0.55);
    ctx.save(); ctx.translate(...m); ctx.rotate(0.2); ctx.fillStyle = '#4A4C45'; ctx.fillRect(-26, -20, 44, 34); ctx.restore();
  }
  hand(ctx, to[0], to[1], ang, open, flip);
}

// Flat hand, drawn pointing along +x in local space: palm, four fingers, thumb.
// curl: 0 flat .. 1 cupped (fingers shorten), flip mirrors the thumb side.
function hand(ctx, x, y, ang, curl = 0, flip = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (flip) ctx.scale(1, -1);
  const skin = '#C8B69B', crease = '#9C8A70';
  ctx.fillStyle = skin;
  // palm
  ctx.beginPath();
  ctx.moveTo(-14, -30); ctx.lineTo(58, -34); ctx.quadraticCurveTo(70, -2, 58, 34); ctx.lineTo(-14, 30); ctx.closePath(); ctx.fill();
  // fingers (index at the thumb side)
  const fl = [70, 78, 74, 60].map(l => l * (1 - curl * 0.35));
  [-25, -8, 9, 25].forEach((fy, i) => {
    ctx.save(); ctx.translate(52, fy * 0.95); ctx.rotate((i - 1.5) * 0.035);
    ctx.fillStyle = skin; rrect(ctx, 0, -8.5, fl[i], 17, 8.5); ctx.fill();
    line(ctx, [[fl[i] * 0.5, -5], [fl[i] * 0.5, 5]], { w: 1.5, col: crease, alpha: 0.5 });
    ctx.restore();
  });
  [-16.5, 0.5, 17].forEach(fy => line(ctx, [[58, fy * 0.95], [100, fy * 0.95]], { w: 1.5, col: crease, alpha: 0.7 }));
  // thumb
  ctx.save(); ctx.translate(10, -30); ctx.rotate(-0.55);
  ctx.fillStyle = skin; rrect(ctx, 0, -10, 58, 20, 10); ctx.fill(); ctx.restore();
  line(ctx, [[8, -22], [40, -12]], { w: 1.5, col: crease, alpha: 0.6 });
  ctx.restore();
}

function steam(ctx, x, y, t, h = 220, a = 0.35) {
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const q = i / 30, yy = y - q * h;
      pts.push([x + (k - 1) * 22 + noise1(q * 3 - t * 0.9, 50 + k) * 26 * q, yy]);
    }
    line(ctx, pts, { w: 4, col: C.paper, alpha: a * (1 - k * 0.2) });
  }
}

function interior(ctx, t, fireA = 1) {
  // plank wall
  ctx.fillStyle = '#16181B'; ctx.fillRect(-500, -500, 3000, TABLE_Y + 500);
  for (let i = -500; i < 2500; i += 96) line(ctx, [[i + noise1(i, 3) * 6, -500], [i, TABLE_Y]], { w: 3, col: '#0C0D0F' });
  // fire light from the left
  const g = ctx.createRadialGradient(80, TABLE_Y - 40, 20, 80, TABLE_Y - 40, 1100);
  const flick = 0.85 + 0.15 * noise1(t * 6, 77);
  g.addColorStop(0, `rgba(240,138,60,${0.35 * fireA * flick})`); g.addColorStop(1, 'rgba(240,138,60,0)');
  ctx.fillStyle = g; ctx.fillRect(-500, -500, 3000, 2000);
  // table
  ctx.fillStyle = '#211C17'; ctx.fillRect(-500, TABLE_Y, 3000, 600);
  line(ctx, [[-500, TABLE_Y], [2500, TABLE_Y]], { w: 3, col: C.paper, alpha: 0.35 });
  for (let k = 0; k < 6; k++) line(ctx, ridge(-500, 2500, TABLE_Y + 60 + k * 58, 6, 90 + k, 40, 0.004), { w: 2, col: '#0F0D0B', alpha: 0.6 });
  // small pot with a little rice and steam
  const px = 250;
  ctx.fillStyle = '#0A0B0C';
  ctx.beginPath(); ctx.moveTo(px - 120, TABLE_Y - 110); ctx.bezierCurveTo(px - 120, TABLE_Y + 10, px + 120, TABLE_Y + 10, px + 120, TABLE_Y - 110); ctx.fill();
  ctx.fillStyle = '#26221D'; ctx.beginPath(); ctx.ellipse(px, TABLE_Y - 110, 122, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3A342C'; ctx.beginPath(); ctx.ellipse(px, TABLE_Y - 106, 100, 14, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 9; i++) dot(ctx, px - 40 + rnd(i, 4) * 80, TABLE_Y - 108 + rnd(i, 5) * 8, 3, C.paper, 0.8);
  steam(ctx, px, TABLE_Y - 124, t);
}

SHOTS.s06 = (ctx, t) => {
  // --- A: close the red window, search the real record (0–3.2) ---
  if (t < 3.4) {
    const shrink = tw(t, 0, 0.8, E.inOutQuart);
    if (shrink < 1) {
      const w = lerp(W, 160, shrink), h = lerp(H, 90, shrink);
      ctx.fillStyle = C.red; ctx.globalAlpha = 1 - tw(t, 0.6, 0.85);
      ctx.fillRect(lerp(0, 1620, shrink), lerp(0, 80, shrink), w, h); ctx.globalAlpha = 1;
    }
    const sIn = spring(t, 0.7, { freq: 1.8, damp: 0.6 });
    const cardGrow = tw(t, 2.5, 3.4, E.inOutQuart);
    ctx.save(); ctx.globalAlpha = clamp(sIn * 1.5) * (1 - cardGrow);
    line(ctx, [[360, 420], [lerp(360, 1560, sIn), 420]], { w: 2, col: C.paper, alpha: 0.5 });
    label(ctx, 'SEARCH  ·  史料', 364, 232, { t, t0: 0.8, size: 26 });
    const q = '1934  广西  老山界';
    const n = Math.floor(clamp((t - 1.0) * 8, 0, [...q].length));
    ctx.font = `900 120px ${SERIF}`; ctx.fillStyle = C.paper; ctx.textBaseline = 'alphabetic';
    ctx.fillText([...q].slice(0, n).join(''), 360, 390);
    ctx.restore();
    // result thumbnail: a small contour map card that becomes the full frame
    const cIn = spring(t, 2.0, { freq: 2, damp: 0.6 });
    if (cIn > 0) {
      const x = lerp(360, 0, cardGrow), y = lerp(500, 0, cardGrow), w = lerp(420, W, cardGrow), h = lerp(236, H, cardGrow);
      ctx.save(); ctx.globalAlpha = clamp(cIn * 1.4);
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.translate(x, y); ctx.scale(w / W, h / H);
      bg(ctx, C.ink2); landscape(ctx, t, 0);
      ctx.restore();
      ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.4 * (1 - cardGrow); ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.globalAlpha = 1;
    }
    if (t < 3.4) return;
  }

  // --- B/C: contour map grows into the landscape, push to the hut door (3.4–10) ---
  if (t < 10) {
    const grow = tw(t, 4.2, 7.0, E.inOutCubic);
    const push = tw(t, 6.8, 9.9, E.inOutQuart);
    const cam = camLerp({ x: 960, y: 540, z: 1 }, { x: HUT.x + 10, y: HUT.y - 30, z: 14 }, push);
    const camA = camLerp({ x: 960, y: 540, z: 1 }, { x: 1000, y: 560, z: 1.08 }, tw(t, 3.4, 7, E.inOutSine));
    const useCam = push > 0 ? camLerp(camA, { x: HUT.x + 10, y: HUT.y - 30, z: 14 }, push) : camA;
    bg(ctx, lerp(0, 1, grow) > 0.5 ? C.ink : C.ink2);
    withCam(ctx, useCam, () => {
      ctx.fillStyle = C.ink2; ctx.globalAlpha = 1 - grow; ctx.fillRect(-2000, -2000, 6000, 6000); ctx.globalAlpha = 1;
      // map grid fades as the map becomes a place
      for (let gx = 0; gx <= W; gx += 120) line(ctx, [[gx, 0], [gx, H]], { w: 1, col: C.paper, alpha: 0.05 * (1 - grow) });
      for (let gy = 0; gy <= H; gy += 120) line(ctx, [[0, gy], [W, gy]], { w: 1, col: C.paper, alpha: 0.05 * (1 - grow) });
      landscape(ctx, t, grow, useCam.x);
      // map marker on the hut
      const m = spring(t, 3.8, { freq: 2, damp: 0.5 }) * (1 - grow);
      if (m > 0.01) { dot(ctx, HUT.x, HUT.y - 60, 12 * m, C.red); arc(ctx, HUT.x, HUT.y - 60, 30 + 10 * Math.sin(t * 4), 0, 7, { w: 2, col: C.red, alpha: m * 0.6 }); }
    });
    // caption
    text(ctx, '1934', 140, 190, { size: 120, font: MONO, weight: 700, align: 'left', t, t0: 3.7, stagger: 0.06, out: 7.4 });
    text(ctx, '广西 · 老山界', 146, 320, { size: 96, align: 'left', t, t0: 4.1, stagger: 0.08, out: 7.5 });
    label(ctx, 'LAOSHANJIE, GUANGXI  ·  WINTER', 150, 410, { t, t0: 4.6, size: 24, alpha: 1 - tw(t, 7.3, 7.8) });
    // door light swallows the frame → inside the hut
    const flood = tw(t, 9.3, 10, E.inCubic);
    if (flood > 0) { ctx.fillStyle = `rgba(240,150,80,${flood})`; ctx.fillRect(0, 0, W, H); }
    vignette(ctx, 0.5);
    return;
  }

  // --- D/E: the table, the bag, the hands (10–17.2) ---
  const warm = 1 - tw(t, 10, 10.8);
  const push = tw(t, 10, 17, E.inOutSine);
  const cam = camLerp({ x: 900, y: 560, z: 1 }, { x: 1010, y: 590, z: 1.12 }, push);
  // bag: set down at 10.3, pushed across 12.8–16.4 with a pause at 14
  const drop = spring(t, 10.2, { freq: 1.8, damp: 0.5 });
  const move = 0.45 * tw(t, 12.8, 13.9, E.inOutCubic) + 0.55 * tw(t, 14.6, 16.4, E.inOutCubic);
  const bx = lerp(780, 1180, move);
  const by = TABLE_Y + (1 - drop) * -220;
  const nightFade = tw(t, 17.2, 19.4, E.inOutCubic);

  withCam(ctx, cam, () => {
    ctx.globalAlpha = 1 - nightFade;
    interior(ctx, t, 1);
    // receiver's hands: approach, hesitate, then rest on the far side of the bag
    const reach = tw(t, 12.4, 13.4, E.outCubic) * 0.55 + tw(t, 14.4, 15.6, E.inOutCubic) * 0.45;
    const rx = lerp(1900, bx + 285, reach);
    riceBag(ctx, bx, by, 1, (1 - drop) * 0.1 + Math.sin(t * 3) * 0.004 * move);
    arm(ctx, [rx + 520, 980], [rx, 690], Math.PI + 0.05, { cuff: 'yao', flip: false });
    arm(ctx, [rx + 560, 800], [rx - 10, 590], Math.PI - 0.1, { cuff: 'yao', flip: true });
    // giver's hands flat against the near side of the bag, fingers up and forward
    const gIn = tw(t, 11.2, 12.4, E.outCubic);
    const gx = lerp(-340, bx - 265, gIn);
    arm(ctx, [gx - 470, 1000], [gx, 600], -0.62, { cuff: 'plain', flip: true });
    arm(ctx, [gx - 470, 1130], [gx + 8, 694], -0.42, { cuff: 'plain', flip: true });
    ctx.globalAlpha = 1;
  });

  // AI lock-on: anchored where the bag first sat, breaks when the bag leaves it
  const breakT = 15.9;
  const boxR = { x: 780 - 200, y: TABLE_Y - 360, w: 400, h: 370 };
  withCam(ctx, cam, () => {
    if (t < breakT) {
      const jitter = t > 15.2 ? (rnd(Math.floor(t * 30), 3) - 0.5) * 10 : 0;
      aiBox(ctx, boxR.x + jitter, boxR.y, boxR.w, boxR.h, t, 10.5, { labelTxt: '剩余粮食 ≈ 3 日  ·  FOOD LEFT ≈ 3 DAYS', dashOff: t * 30, labelSize: 26 });
      if (t > 11.9) {
        const k = spring(t, 12, { freq: 2, damp: 0.6 });
        ctx.save(); ctx.globalAlpha = clamp(k * 2);
        ctx.fillStyle = C.red; ctx.font = `900 64px ${SERIF}`; ctx.textBaseline = 'top';
        ctx.fillText('最优策略：保留', boxR.x, boxR.y - 190 + (1 - k) * 30);
        ctx.restore();
        en(ctx, 'OPTIMAL STRATEGY: KEEP IT', boxR.x + 2, boxR.y - 84, { t, t0: 12.3, size: 24, col: C.red, font: MONO, weight: 700, spacing: 2 });
      }
    }
  });
  // fragments of the broken box drift up and settle as the stars of the next shot
  if (t >= breakT) {
    const n = 64;
    for (let i = 0; i < n; i++) {
      const per = 2 * (boxR.w + boxR.h), d = (i / n) * per;
      let sx, sy;
      if (d < boxR.w) { sx = boxR.x + d; sy = boxR.y; }
      else if (d < boxR.w + boxR.h) { sx = boxR.x + boxR.w; sy = boxR.y + d - boxR.w; }
      else if (d < 2 * boxR.w + boxR.h) { sx = boxR.x + boxR.w - (d - boxR.w - boxR.h); sy = boxR.y + boxR.h; }
      else { sx = boxR.x; sy = boxR.y + boxR.h - (d - 2 * boxR.w - boxR.h); }
      // world → screen through the same camera
      const scr = [(sx - cam.x) * cam.z + W / 2, (sy - cam.y) * cam.z + H / 2];
      const star = STARS[i];
      const p = tw(t, breakT + rnd(i, 8) * 0.4, 19.4 + rnd(i, 9) * 0.3, E.inOutCubic);
      const pos = mix2(scr, [star[0] + noise1(p * 2, i) * 60 * (1 - p), star[1]], p);
      const len = lerp(14, 0, p), ang = rnd(i, 10) * 6 + p * 4;
      ctx.save(); ctx.translate(...pos); ctx.rotate(ang);
      ctx.fillStyle = p < 0.6 ? C.red : C.paper; ctx.globalAlpha = lerp(1, star[3], p);
      ctx.fillRect(-len / 2 - star[2] * p, -1.5 - star[2] * p * 0.5, len + star[2] * 2 * p, 3 + star[2] * p);
      ctx.restore();
    }
  }
  if (warm > 0) { ctx.fillStyle = `rgba(240,150,80,${warm})`; ctx.fillRect(0, 0, W, H); }
  vignette(ctx, 0.55);
};

// night sky star field used by the end of shot 6 and shot 7: [x, y, size, alpha]
const STARS = Array.from({ length: 64 }, (_, i) => [rnd(i, 101) * W, 40 + rnd(i, 102) * 380, 0.6 + rnd(i, 103) * 1.6, 0.35 + rnd(i, 104) * 0.6]);
