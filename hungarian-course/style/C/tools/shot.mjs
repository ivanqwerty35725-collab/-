import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const [html,out,w,h]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w||1280,height:+h||720}});
await p.goto('file://'+html);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:out});await b.close();
