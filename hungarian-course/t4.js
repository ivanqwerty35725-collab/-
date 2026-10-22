const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/_t.html');
await p.click('#nav button[data-v="train"]');await p.waitForTimeout(200);await p.click('[data-sub="text"]');await p.waitForTimeout(200);console.log('text tab:',(await p.textContent('#view')).slice(0,140).replace(/\s+/g,' '));
await p.click('#nav button[data-v="video"]');await p.waitForTimeout(100);console.log('videos:',await p.locator('video').count());
await p.click('#nav button[data-v="month"]');await p.waitForTimeout(100);await p.click('[data-m="4"]');await p.waitForTimeout(100);await p.click('[data-open="100"]');await p.waitForTimeout(100);
await p.click('#nav button[data-v="train"]');await p.waitForTimeout(100);await p.click('[data-sub="text"]');await p.waitForTimeout(100);console.log('day100:',(await p.textContent('#ttext')).slice(0,80));
console.log('audio map',await p.evaluate(()=>Object.keys(P.audio).length),'errors:',errs);await p.screenshot({path:'shot3.png'});await b.close()})();
