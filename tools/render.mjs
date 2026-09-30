// Full render: node tools/render.mjs [workers=3] [from_s] [to_s]
// Each worker drives its own page, calls render(t) per frame and pipes PNGs into ffmpeg.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const story = JSON.parse(fs.readFileSync(path.join(root, 'story.json'), 'utf8'));
const FPS = story.fps;
const total = story.shots.reduce((a, s) => a + s.dur, 0);
const workers = +(process.argv[2] || 3);
const from = +(process.argv[3] || 0), to = +(process.argv[4] || total);
const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
const FF = process.env.FFMPEG;
const outDir = path.join(root, 'build', 'render'); fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const per = Math.ceil((F1 - F0) / workers);
const t0 = Date.now(); let done = 0;
const parts = [];
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const a = F0 + w * per, b = Math.min(F1, a + per);
  if (a >= b) return;
  const part = path.join(outDir, `part${w}.mp4`); parts[w] = part;
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(root, 'video/index.html'));
  await page.evaluate(() => window.ready);
  for (let f = a; f < b; f++) {
    const b64 = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, f / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (++done % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${F1 - F0} frames  ${(done / el).toFixed(1)} fps  eta ${((F1 - F0 - done) / (done / el) / 60).toFixed(1)} min`);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}));
await browser.close();
fs.writeFileSync(path.join(outDir, 'parts.txt'), parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
console.log('frames done in', ((Date.now() - t0) / 60000).toFixed(1), 'min');
