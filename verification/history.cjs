const {chromium}=require('C:/Users/jilzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge'}),p=await b.newPage();await p.clock.install({time:new Date('2026-10-01T03:00:00Z')});await p.goto(process.argv[2]||'http://localhost:8766');
 await p.locator('#history-open').click();assert(await p.locator('#history-empty').isVisible());await p.locator('#history-confirm').click();
 for(const [width,height] of [[320,568],[390,844],[1440,900],[844,390]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),`initial ${width}`);}
 await p.evaluate(()=>localStorage.setItem(KEY,JSON.stringify({day:'2026-09-30',numbers:[1,2,3,4,5,6]})));assert.equal(await p.evaluate(()=>readHistory().length),1);
 for(let i=1;i<=8;i++){await p.clock.setSystemTime(new Date(`2026-10-${String(i).padStart(2,'0')}T03:00:00Z`));const r=await p.evaluate(()=>claim());assert(!r.replay);assert.equal(r.record.day,`2026-10-${String(i).padStart(2,'0')}`);}
 const history=await p.evaluate(()=>readHistory());assert.equal(history.length,7);assert.equal(history[0].day,'2026-10-08');assert.equal(history[6].day,'2026-10-02');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(HISTORY_KEY)).length),7);
 const before=await p.evaluate(()=>localStorage.getItem(HISTORY_KEY));assert((await p.evaluate(()=>claim())).replay);assert.equal(await p.evaluate(()=>localStorage.getItem(HISTORY_KEY)),before);
 await p.reload();await p.locator('#history-open').click();assert.equal(await p.locator('#history-list li').count(),7);assert.deepEqual(await p.locator('.history-numbers').first().locator('span').allTextContents(),history[0].numbers.map(String));
 await p.setViewportSize({width:320,height:568});assert(await p.evaluate(()=>document.querySelector('#history').scrollWidth<=document.querySelector('#history').clientWidth));await p.screenshot({path:'verification/history-320.png'});await p.locator('#history-confirm').click();
 for(const [width,height] of [[320,568],[390,844],[1440,900],[844,390]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),`saved ${width}`);}
 console.log('Empty list, legacy record inclusion, 8 actual daily claims retain latest 7, newest first, no duplicate on retry, reload persistence, 320px list and responsive first-screen fit passed');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
