// Shared drawing kit: palette, easing, springs, seeded noise, camera, text, figures.
// Everything is a pure function of its inputs — no state carried between frames.

const W = 1920, H = 1080;
const C = {
  ink: '#0F1114',
  ink2: '#171A1F',
  ink3: '#22262D',
  line: '#3A3F48',
  paper: '#EDE6D8',
  paper2: '#B9B2A5',
  dim: 'rgba(237,230,216,0.38)',
  red: '#D63A25',
  redDim: 'rgba(214,58,37,0.35)',
  fire: '#F08A3C',
};
const SERIF = '"Noto Serif SC"';
const MONO = '"JetBrains Mono", "Noto Serif SC"';

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const mix2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

const E = {
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inOutQuart: t => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};

// progress of an eased tween between times a..b
const tw = (t, a, b, ease = E.inOutCubic) => ease(inv(a, b, t));

// Critically-under-damped spring from 0 to 1, starting at time t0 (seconds).
function spring(t, t0, { freq = 2.2, damp = 0.45 } = {}) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + (damp * w / wd) * Math.sin(wd * x));
}

// ---------- deterministic randomness ----------
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = Math.imul(n, 9); n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}
const rnd = (i, seed = 1) => hash((i * 7919 + seed * 104729) | 0);
function noise1(x, seed = 1) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rnd(i, seed), rnd(i + 1, seed), u) * 2 - 1;
}
function fbm(x, seed = 1, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let k = 0; k < oct; k++) { v += a * noise1(x * f, seed + k * 13); f *= 2; a *= 0.5; }
  return v;
}

// ---------- canvas helpers ----------
function withCam(ctx, cam, fn) {
  // cam: {x, y, z, r} — world point (x,y) lands at screen centre, zoomed by z
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(cam.r || 0);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  fn();
  ctx.restore();
}
function camLerp(a, b, t) {
  // zoom interpolates geometrically so push-ins feel even
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)), r: lerp(a.r || 0, b.r || 0, t) };
}

function bg(ctx, col = C.ink) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }

function line(ctx, pts, { w = 2, col = C.paper, cap = 'round', dash = null, alpha = 1 } = {}) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = cap; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke(); ctx.restore();
}

// polyline revealed from 0..p of its length
function partial(pts, p) {
  if (p >= 1) return pts;
  if (p <= 0) return [pts[0]];
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let want = L * p; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (want <= seg[i - 1]) { out.push(mix2(pts[i - 1], pts[i], want / seg[i - 1])); return out; }
    want -= seg[i - 1]; out.push(pts[i]);
  }
  return out;
}

function arc(ctx, x, y, r, a0, a1, { w = 3, col = C.paper, alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore();
}
function dot(ctx, x, y, r, col = C.paper, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

// ---------- text ----------
// Characters arrive one after another (stagger), each rising with a spring.
function text(ctx, str, x, y, {
  size = 96, font = SERIF, weight = 900, col = C.paper, align = 'center', base = 'middle',
  t = 99, t0 = 0, stagger = 0.045, out = null, spacing = 0, alpha = 1, rise = 0.35,
} = {}) {
  ctx.save();
  const base0 = ctx.globalAlpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textBaseline = base; ctx.fillStyle = col;
  const chars = [...str];
  const widths = chars.map(c => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  chars.forEach((ch, i) => {
    const s = spring(t, t0 + i * stagger, { freq: 1.6, damp: 0.62 });
    let a = clamp(s * 1.4) * alpha;
    if (out) a *= 1 - tw(t, out + i * stagger * 0.5, out + 0.35 + i * stagger * 0.5, E.inCubic);
    if (a > 0.001) {
      ctx.globalAlpha = base0 * a;
      ctx.fillText(ch, cx, y + (1 - s) * size * rise);
    }
    cx += widths[i];
  });
  ctx.restore();
  return total;
}
function measure(ctx, str, size, font = SERIF, weight = 900) {
  ctx.save(); ctx.font = `${weight} ${size}px ${font}`; const w = ctx.measureText(str).width; ctx.restore(); return w;
}
// small monospace UI label, typed on
function label(ctx, str, x, y, { t = 99, t0 = 0, size = 22, col = C.paper2, align = 'left', cps = 38, alpha = 1, weight = 400, font = MONO } = {}) {
  const n = Math.floor(clamp((t - t0) * cps, 0, str.length));
  if (n <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText([...str].slice(0, n).join(''), x, y); ctx.restore();
}

// ---------- figures ----------
// One figure design for the whole film: a flat silhouette with real proportions.
// pose: {walk: phase | null, reach: 0..1, turn: ±1, sit: 0..1, hood, slump, alpha, stoop}
// col: fill colour; rim: optional rim-light colour on the leading edge.
function figure(ctx, x, y, s, pose = {}, col = C.paper, rim = null) {
  const { walk = null, reach = 0, turn = 1, sit = 0, hood = false, slump = 0, alpha = 1, stoop = 0, lift = 0 } = pose;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.scale(s * (turn < 0 ? -1 : 1), s);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const hipY = lerp(-38, -20, sit);
  const limb = (pts, w0, w1) => {
    // tapered two-segment limb
    ctx.lineWidth = w0; ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.stroke();
    ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.stroke();
  };
  const legs = [];
  if (sit > 0.5) {
    legs.push([[-2, hipY], [17, hipY + 1], [17, 0]], [[3, hipY], [22, hipY + 2], [23, 0]]);
  } else {
    const ph = walk == null ? 0 : walk, sw = walk == null ? 0 : 1;
    for (let k = 0; k < 2; k++) {
      const p = ph + k * Math.PI;
      const fx = Math.sin(p) * 11 * sw, up = Math.max(0, Math.cos(p)) * 5 * sw;
      legs.push([[0, hipY], [fx * 0.55 + 2 * sw + stoop * 3, hipY / 2 - up * 0.5], [fx, -up]]);
    }
  }
  // back leg darker-ish by drawing first
  legs.forEach(l => { limb(l, 8.5, 7); ctx.beginPath(); ctx.ellipse(l[2][0] + 3, l[2][1] - 1.5, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill(); });
  const lean = slump * 10 + stoop * 25 + (walk != null ? 3 : 0);
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * Math.PI / 180);
  // arms (back arm first)
  const swing = walk != null ? Math.sin(walk + Math.PI) : 0;
  const armPts = (k) => {
    const sh = [1, -27];
    const base = k === 0 ? 1.45 - swing * 0.45 : 1.45 + swing * 0.45;
    const ang = lerp(base, lerp(0.15, -0.5, lift), reach);
    const el = [sh[0] + Math.cos(ang) * 13, sh[1] + Math.sin(ang) * 13];
    const ang2 = lerp(ang - 0.2, ang - 0.05, reach);
    return [sh, el, [el[0] + Math.cos(ang2) * 13, el[1] + Math.sin(ang2) * 13]];
  };
  limb(armPts(1), 6, 5);
  // torso: shoulders wider than hips
  ctx.beginPath();
  ctx.moveTo(-8, 1); ctx.lineTo(-10, -22); ctx.quadraticCurveTo(-10, -31, -2, -31);
  ctx.lineTo(4, -31); ctx.quadraticCurveTo(11, -31, 10, -22); ctx.lineTo(8, 1); ctx.closePath(); ctx.fill();
  if (hood) { ctx.beginPath(); ctx.ellipse(-4, -30, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill(); }
  // neck + head
  ctx.beginPath(); ctx.moveTo(-3.5, -30); ctx.lineTo(-2.5, -35.5); ctx.lineTo(4, -35.5); ctx.lineTo(5, -30); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1.4, -40.5, 6.4, 7.2, 0, 0, Math.PI * 2); ctx.fill();
  limb(armPts(0), 6, 5);
  if (rim) {
    ctx.strokeStyle = rim; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(1.4, -40.5, 6.4, 7.2, 0, -1.2, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10.5, -24); ctx.lineTo(8.5, 0); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// flat mountain ridge polyline across [x0,x1]
function ridge(x0, x1, yBase, amp, seed, step = 12, freq = 0.0022) {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) pts.push([x, yBase - (fbm(x * freq, seed, 5) * 0.5 + 0.5) * amp]);
  return pts;
}
function fillRidge(ctx, pts, bottom, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], bottom);
  pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], bottom); ctx.closePath(); ctx.fill();
}

// grain overlay keyed to the frame number so it changes per frame but deterministically
function grain(ctx, t, amt = 0.05) {
  const f = Math.floor(t * 30);
  ctx.save(); ctx.globalAlpha = amt;
  for (let i = 0; i < 900; i++) {
    const x = rnd(i, f + 3) * W, y = rnd(i + 5000, f + 7) * H;
    ctx.fillStyle = rnd(i, f) > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}
function vignette(ctx, amt = 0.55) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${amt})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------- the room (shots 1, 9, 10) ----------
// World layout of the wide desk shot. The monitor's screen is exactly W*0.4 x H*0.4,
// so a camera at SCREEN centre with zoom 2.5 shows UI space full-frame.
const SCREEN = { x: 960 - W * 0.2, y: 430 - H * 0.2, w: W * 0.4, h: H * 0.4, cx: 960, cy: 430 };
const DESK_Y = 772;
const CAM_WIDE = { x: 960, y: 540, z: 1 };
const CAM_SCREEN = { x: SCREEN.cx, y: SCREEN.cy, z: 2.5 };

// drawUI(ctx) draws in 1920x1080 UI space; it's mapped into the monitor.
function room(ctx, drawUI, { screenOn = 1, lamp = 1, student = 1, glow = 1 } = {}) {
  // wall glow from the screen
  ctx.save();
  const g = ctx.createRadialGradient(SCREEN.cx, SCREEN.cy, 80, SCREEN.cx, SCREEN.cy, 900);
  g.addColorStop(0, `rgba(190,205,220,${0.10 * screenOn * glow})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 6000, 6000);
  // lamp pool
  const lg = ctx.createRadialGradient(1560, DESK_Y, 20, 1560, DESK_Y, 520);
  lg.addColorStop(0, `rgba(240,160,90,${0.16 * lamp})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg; ctx.fillRect(-2000, -2000, 6000, 6000);
  ctx.restore();
  // desk
  ctx.fillStyle = C.ink2; ctx.fillRect(-3000, DESK_Y, 8000, 3000);
  line(ctx, [[-3000, DESK_Y], [5000, DESK_Y]], { w: 2, col: C.paper, alpha: 0.45 });
  // monitor stand + bezel
  ctx.fillStyle = C.ink3;
  ctx.beginPath(); ctx.moveTo(930, 650); ctx.lineTo(990, 650); ctx.lineTo(1010, DESK_Y - 8); ctx.lineTo(910, DESK_Y - 8); ctx.fill();
  ctx.fillRect(860, DESK_Y - 10, 200, 10);
  rrect(ctx, SCREEN.x - 16, SCREEN.y - 16, SCREEN.w + 32, SCREEN.h + 32, 12); ctx.fill();
  // screen
  ctx.save();
  rrect(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 3); ctx.clip();
  ctx.fillStyle = C.ink; ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
  if (screenOn > 0 && drawUI) {
    ctx.globalAlpha = screenOn;
    ctx.translate(SCREEN.x, SCREEN.y); ctx.scale(0.4, 0.4);
    drawUI(ctx);
  }
  ctx.restore();
  // mug
  ctx.fillStyle = C.ink3; rrect(ctx, 1290, DESK_Y - 70, 56, 70, 6); ctx.fill();
  arc(ctx, 1346, DESK_Y - 38, 16, -Math.PI / 2, Math.PI / 2, { w: 7, col: C.ink3 });
  line(ctx, [[1296, DESK_Y - 66], [1340, DESK_Y - 66]], { w: 2, col: C.paper, alpha: 0.25 });
  // lamp
  line(ctx, [[1600, DESK_Y - 6], [1640, DESK_Y - 250], [1540, DESK_Y - 360]], { w: 8, col: C.ink3 });
  ctx.fillStyle = C.ink3; ctx.fillRect(1560, DESK_Y - 12, 90, 12);
  ctx.save(); ctx.translate(1540, DESK_Y - 360); ctx.rotate(0.5);
  ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(20, -10); ctx.lineTo(55, 50); ctx.lineTo(-55, 50); ctx.closePath(); ctx.fill();
  if (lamp > 0) { ctx.fillStyle = `rgba(255,200,140,${0.9 * lamp})`; ctx.fillRect(-48, 46, 96, 5); }
  ctx.restore();
  // notebook
  ctx.save(); ctx.translate(560, DESK_Y + 40); ctx.rotate(-0.06);
  ctx.fillStyle = C.ink3; ctx.fillRect(-120, -18, 240, 36);
  line(ctx, [[-110, -8], [60, -8]], { w: 2, col: C.paper, alpha: 0.18 });
  ctx.restore();
  if (student > 0) studentBack(ctx, 720, 1150, 1, student);
}

// The protagonist from behind: short hair, hood down, grey hoodie, rim-lit by the screen.
function studentBack(ctx, x, y, s, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(s, s);
  const rim = 'rgba(210,220,230,0.5)';
  // shoulders / hoodie
  const body = new Path2D();
  body.moveTo(-360, 80);
  body.bezierCurveTo(-350, -120, -250, -190, -120, -205);
  body.lineTo(120, -205);
  body.bezierCurveTo(250, -190, 350, -120, 360, 80);
  body.closePath();
  ctx.fillStyle = '#14171B'; ctx.fill(body);
  ctx.save(); ctx.clip(body);
  ctx.strokeStyle = rim; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(120, -205); ctx.bezierCurveTo(250, -190, 350, -120, 360, 80); ctx.stroke();
  ctx.restore();
  // neck
  ctx.fillStyle = '#0B0C0E'; ctx.fillRect(-46, -290, 92, 100);
  // hood bunched at the back of the neck
  const hood = new Path2D();
  hood.moveTo(-150, -200); hood.bezierCurveTo(-150, -262, -70, -276, 0, -272);
  hood.bezierCurveTo(70, -276, 150, -262, 150, -200); hood.bezierCurveTo(80, -186, -80, -186, -150, -200); hood.closePath();
  ctx.fillStyle = '#1B1F24'; ctx.fill(hood);
  ctx.strokeStyle = 'rgba(237,230,216,0.14)'; ctx.lineWidth = 3; ctx.stroke(hood);
  // head (short black hair)
  const head = new Path2D();
  head.ellipse(0, -370, 92, 108, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#08090A'; ctx.fill(head);
  ctx.save(); ctx.clip(head);
  ctx.strokeStyle = rim; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(0, -370, 92, 108, 0, -1.9, 0.35); ctx.stroke();
  ctx.restore();
  // ears
  ctx.fillStyle = '#08090A';
  ctx.beginPath(); ctx.ellipse(-90, -360, 14, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, -360, 14, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Dashed AI lock-on box with a label tab.
function aiBox(ctx, x, y, w, h, t, t0, { labelTxt = '', col = C.red, dashOff = 0, alpha = 1, labelSize = 22 } = {}) {
  const s = spring(t, t0, { freq: 2.4, damp: 0.5 });
  if (s <= 0) return;
  const k = lerp(1.35, 1, s);
  const cx = x + w / 2, cy = y + h / 2, ww = w * k, hh = h * k;
  ctx.save(); ctx.globalAlpha *= clamp(s * 2) * alpha;
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -dashOff;
  ctx.strokeRect(cx - ww / 2, cy - hh / 2, ww, hh);
  ctx.setLineDash([]);
  // corner brackets
  const b = 26; ctx.lineWidth = 5;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    const px = cx + sx * ww / 2, py = cy + sy * hh / 2;
    ctx.beginPath(); ctx.moveTo(px - sx * b, py); ctx.lineTo(px, py); ctx.lineTo(px, py - sy * b); ctx.stroke();
  });
  ctx.restore();
  if (labelTxt) {
    ctx.save(); ctx.globalAlpha *= clamp(s * 2) * alpha;
    ctx.font = `700 ${labelSize}px ${MONO}`;
    const lw = ctx.measureText(labelTxt).width + 28;
    ctx.fillStyle = col; ctx.fillRect(cx - ww / 2, cy - hh / 2 - labelSize * 1.9, lw, labelSize * 1.6);
    ctx.fillStyle = C.ink; ctx.textBaseline = 'middle';
    ctx.fillText(labelTxt, cx - ww / 2 + 14, cy - hh / 2 - labelSize * 1.1);
    ctx.restore();
  }
}

// English companion line (Latin glyphs of the serif), fades and rises in.
function en(ctx, str, x, y, { t = 99, t0 = 0, size = 26, col = C.paper2, align = 'left', alpha = 1, out = null, weight = 600, spacing = 1.5, font = SERIF } = {}) {
  let a = clamp((t - t0) / 0.5) * alpha;
  if (out != null) a *= 1 - tw(t, out, out + 0.4);
  if (a <= 0.001) return;
  const k = E.outCubic(clamp((t - t0) / 0.6));
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(str, x, y + (1 - k) * size * 0.5);
  ctx.restore();
}

// Bilingual dialogue subtitles for every voiced cue (unless the line is already big on screen).
function subtitles(ctx, T, cues) {
  cues.forEach((c, i) => {
    if (c.sub === false) return;
    const nxt = cues.slice(i + 1).find(n => n.sub !== false);
    const end = Math.min(c.abs + c.dur + 0.7, nxt ? nxt.abs - 0.05 : 1e9);
    if (T < c.abs - 0.05 || T > end) return;
    const a = clamp((T - c.abs + 0.05) / 0.15) * clamp((end - T) / 0.2);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 14;
    ctx.font = `600 40px ${SERIF}`;
    const zh = c.text, zw = ctx.measureText(zh).width;
    ctx.fillStyle = C.paper; ctx.fillText(zh, W / 2, 962);
    if (c.who === 'ai') { ctx.shadowBlur = 0; dot(ctx, W / 2 - zw / 2 - 26, 962, 7, C.red); ctx.shadowBlur = 14; }
    ctx.font = `600 25px ${SERIF}`; ctx.letterSpacing = '1px'; ctx.fillStyle = C.paper2;
    ctx.fillText(c.en, W / 2, 1012);
    ctx.restore();
  });
}
