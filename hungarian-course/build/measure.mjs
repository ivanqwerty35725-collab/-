// usage: node measure.mjs '[{"t":"meg","f":"Source Serif 4","s":72,"w":600},...]'
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const items = JSON.parse(process.argv[2]);
const fontsDir = '/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/fonts';
const css = fs.readFileSync(fontsDir + '/fontface.css', 'utf8').replaceAll("assets/fonts/", "");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${items.map((it,i)=>`<span id="m${i}" style="font-family:'${it.f}';font-size:${it.s}px;font-weight:${it.w};white-space:pre;position:absolute">${it.t}</span>`).join('')}</body></html>`;
fs.writeFileSync(fontsDir + '/_measure.html', html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + fontsDir + '/_measure.html');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const ok = await page.evaluate(() => document.fonts.check("600 72px 'Source Serif 4'"));
if (!ok) { console.error('FONT NOT LOADED'); process.exit(2); }
const out = await page.evaluate((n) => Array.from({length:n},(_,i)=>document.getElementById('m'+i).getBoundingClientRect().width), items.length);
console.log(JSON.stringify(out));
await browser.close();
