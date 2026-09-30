// Render stills: node tools/still.mjs out_dir t1 t2 ...
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [out, ...times] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
page.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto('file://' + path.join(root, 'video/index.html'));
await page.evaluate(() => window.ready);
for (const t of times) {
  const b64 = await page.evaluate(t => { render(+t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
  const f = path.join(out, `t${(+t).toFixed(2).padStart(7, '0')}.png`);
  fs.writeFileSync(f, Buffer.from(b64, 'base64'));
  console.log(f);
}
await browser.close();
