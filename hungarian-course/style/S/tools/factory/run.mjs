// node run.mjs kirill,objects  -> writes PNGs into proj/assets/img
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs'; import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const proj = path.resolve(here, '../../proj');
const groups = (process.argv[2] || 'kirill').split(',');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 600 } });
p.on('console', (m) => console.log('console:', m.text())); p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.goto('file://' + here + '/index.html');
const t0 = Date.now();
const out = await p.evaluate((g) => window.__export(g), groups);
console.log('painted in', Date.now() - t0, 'ms');
const w = (dir, name, url) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), Buffer.from(url.split(',')[1], 'base64')); };
if (out.kirill) {
  const man = {};
  for (const [k, v] of Object.entries(out.kirill)) { w(proj + '/assets/img/kirill', k + '.png', v.png); const { png, ...rest } = v; man[k] = rest; }
  fs.writeFileSync(proj + '/assets/js/kirill-manifest.js', 'window.KIRILL_MANIFEST=' + JSON.stringify(man) + ';\n');
  console.log('kirill parts', Object.keys(man).length);
}
if (out.objects) {
  const man = {};
  for (const [k, v] of Object.entries(out.objects)) { w(proj + '/assets/img', k + (v.jpg ? '.jpg' : '.png'), v.png); man[k] = { ...v.meta, w: v.w, h: v.h }; }
  fs.writeFileSync(proj + '/assets/js/objects-manifest.js', 'window.OBJ_MANIFEST=' + JSON.stringify(man) + ';\n');
  console.log('objects', Object.keys(man).join(' '));
}
await b.close();
