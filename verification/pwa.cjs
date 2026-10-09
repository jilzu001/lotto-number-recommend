const {chromium}=require('C:/Users/jilzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lotto-pwa-check-'));
 const browser=await chromium.launchPersistentContext(profile,{channel:'msedge'}),context=browser,p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.argv[2]||'http://localhost:8771/');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const manifest=await p.evaluate(async()=>{const url=document.querySelector('link[rel=manifest]').href;return {url,data:await (await fetch(url)).json()};});assert.equal(manifest.data.display,'standalone');assert.equal(manifest.data.name,'로또 번호 추천');
 const scope=await p.evaluate(()=>navigator.serviceWorker.controller.scriptURL);assert(scope.startsWith(new URL('./',manifest.url).href));
 for(const icon of manifest.data.icons){const size=await p.evaluate(async url=>{const img=new Image();img.src=url;await img.decode();return [img.naturalWidth,img.naturalHeight];},new URL(icon.src,manifest.url).href);assert.deepEqual(size,icon.sizes.split('x').map(Number));}
 const session=await context.newCDPSession(p);const installability=await session.send('Page.getInstallabilityErrors');assert.deepEqual(installability.installabilityErrors,[]);console.log('Chromium installability: no errors; standalone manifest and 192/512 icons verified');
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#recommend').click();await p.waitForFunction(()=>document.querySelector('#result').open&&!document.querySelector('#confirm').disabled);const numbers=await p.locator('.ball').allTextContents();await p.locator('#confirm').click();
 await context.setOffline(true);await p.reload();assert.equal(await p.title(),'로또 번호 추천');await p.locator('#today').click();assert.deepEqual(await p.locator('.ball').allTextContents(),numbers);await p.locator('#confirm').click();await p.locator('#history-open').click();assert.equal(await p.locator('#history-list li').count(),1);await p.locator('#history-confirm').click();await p.locator('#recommend').click();await p.waitForFunction(()=>document.querySelector('#already').open);assert.deepEqual(errors,[]);console.log('Offline app load, saved-number replay, recent history and repeat notice passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
