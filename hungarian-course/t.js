const {chromium}=require(process.argv[2]||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const fs=require('fs');const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync('vengerskiy-do-prisyagi.html','utf8')+'</body></html>';
fs.writeFileSync('_t.html',html);await p.goto('file://'+process.cwd()+'/_t.html');
for(const v of ['today','week','month','plan','train','schemes','res']){await p.click(`#nav button[data-v="${v}"]`);await p.waitForTimeout(100);}
await p.click('#nav button[data-v="train"]');for(const s of ['cards','dict','ex','listen']){await p.click(`[data-sub="${s}"]`);await p.waitForTimeout(50)}
await p.click('[data-sub="ex"]');await p.click('#exstart');await p.click('.opt');await p.click('#exnext');
await p.click('[data-sub="dict"]');await p.fill('#dict-0','Jo napot kivanok');await p.click('[data-dchk="0"]');console.log('diff:',await p.textContent('#dres-0'));
await p.click('[data-sub="cards"]');await p.click('#fcshow');await p.click('#fcok');console.log('card ls:',await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('cards/')).length));
await p.click('#nav button[data-v="schemes"]');for(const s of ['harm','cases','conj','def','past']){await p.click(`[data-sub="${s}"]`)}
await p.click('#nav button[data-v="today"]');await p.click('input[type=checkbox]');
const sw=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
console.log('hscroll:',sw,'errors:',errs);await p.screenshot({path:'shot.png',fullPage:false});await b.close()})();
