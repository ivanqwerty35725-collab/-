const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
fs.writeFileSync('_t.html','<!doctype html><html><head><meta charset="utf-8"></head><body>'+fs.readFileSync('vengerskiy-do-prisyagi.html','utf8')+'</body></html>');await p.goto('file://'+process.cwd()+'/_t.html');
for(const v of ['today','week','month','plan','train','schemes','video','res']){await p.click(`#nav button[data-v="${v}"]`);await p.waitForTimeout(60)}
await p.click('#nav button[data-v="train"]');for(const s of ['cards','phr','text','pairs','dict','ex','isl','err','listen']){await p.click(`[data-sub="${s}"]`);await p.waitForTimeout(40)}
await p.click('[data-sub="phr"]');await p.fill('#phrin','kívánok');await p.click('#phrchk');await p.waitForTimeout(50);console.log('phr:',await p.textContent('#phrres'));
await p.click('[data-sub="isl"]');await p.click('[data-islhide="0"]');await p.fill('#islin-0','Jó napot kívánok! Babics Kirill vagyok.');await p.click('[data-islchk="0"]');console.log('isl:',(await p.textContent('#islres-0')).slice(-6));
await p.click('#nav button[data-v="schemes"]');for(const s of ['anim','poster','harm','cases','conj','def','past','schemes']){await p.click(`[data-sub="${s}"]`);await p.waitForTimeout(40)}
await p.click('[data-sub="anim"]');await p.click('[data-anim="m+"]');await p.click('[data-anim="m+"]');console.log('morph:',await p.textContent('#morphbox .morph'));
await p.click('[data-anim="case"][data-k="ba"]');await p.waitForTimeout(100);await p.click('[data-anim="hs"][data-k="ház"]');await p.click('[data-anim="hb"][data-k="b"]');console.log('harm:',await p.textContent('#harmnote'));
await p.click('[data-anim="pf"][data-k="1"]');console.log('pref:',await p.textContent('#prefsent'));
const sw=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
await p.screenshot({path:'shot2.png'});console.log('hscroll:',sw,'errors:',errs.slice(0,5));await b.close()})();
