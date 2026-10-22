import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const F='/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/C/proj/assets/fonts/';
const [size,wght,...strs]=process.argv.slice(2);
const css=`@font-face{font-family:V;font-weight:200 900;src:url('${F}SS4var-roman-latin.woff2')}
@font-face{font-family:V;font-weight:200 900;src:url('${F}SS4var-roman-latinext.woff2');unicode-range:U+0100-02FF}
@font-face{font-family:I;font-style:italic;font-weight:200 900;src:url('${F}SS4var-italic-latin.woff2')}
@font-face{font-family:I;font-style:italic;font-weight:200 900;src:url('${F}SS4var-italic-cyrillic.woff2');unicode-range:U+0400-045F}`;
const html=`<!doctype html><meta charset=utf-8><style>${css} span{position:absolute;white-space:pre;font-family:V;font-size:${size}px;font-weight:${wght};line-height:1}</style>`+strs.map((s,i)=>`<span id=s${i}>${s}</span>`).join('');
fs.writeFileSync('/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/C/tools/_m.html',html);
const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/style/C/tools/_m.html');
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
const r=await p.evaluate((n)=>{const o=[];for(let i=0;i<n;i++){const e=document.getElementById('s'+i);const t=e.firstChild;const xs=[];for(let k=0;k<t.length;k++){const rg=document.createRange();rg.setStart(t,k);rg.setEnd(t,k+1);const bb=rg.getBoundingClientRect();xs.push([t.data[k],+bb.left.toFixed(1),+bb.width.toFixed(1)]);}o.push({s:t.data,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,xs})}return o},strs.length);
console.log(JSON.stringify(r));
console.log(await p.evaluate(()=>document.fonts.check("700 100px V")));
await b.close();
