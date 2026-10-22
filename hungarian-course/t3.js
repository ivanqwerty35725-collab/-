const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.stack.split('\n').slice(0,3).join(' | ')));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/_t.html');await p.click('#nav button[data-v="train"]');await p.waitForTimeout(200);
console.log('view html head:',(await p.innerHTML('#view')).slice(0,300));console.log('errors:',errs);await b.close()})();
