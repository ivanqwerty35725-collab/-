import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [html, out, w, h] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w || 1280, height: +h || 720 } });
p.on('pageerror', (e) => console.log('pageerror:', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto('file://' + html); await p.waitForFunction(() => document.title === 'done', null, { timeout: 30000 }).catch(() => console.log('timeout'));
await p.waitForTimeout(200); await p.screenshot({ path: out }); await b.close();
