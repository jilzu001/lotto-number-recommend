const {chromium}=require('C:/Users/jilzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 for(const [width,height] of [[390,844],[1440,900]]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const response=await p.goto(process.argv[2]||'https://jilzu001.github.io/lotto-number-recommend/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await p.locator('#recommend').click();await p.waitForFunction(()=>document.querySelector('#result').open);await p.waitForFunction(()=>!document.querySelector('#confirm').disabled);await p.waitForTimeout(500);
  const numbers=await p.locator('.ball').allTextContents();assert.equal(new Set(numbers).size,6);assert(numbers.every(n=>+n>=1&&+n<=45));
  await p.screenshot({path:`verification/live-result-${width}.png`});await p.locator('#confirm').click();
  const fits=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight);assert(fits);
  assert.deepEqual(await p.locator('.slots span').allTextContents(),numbers);
  await p.setViewportSize({width:320,height:568});assert(await p.locator('.slots').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`verification/saved-slots-${width}.png`});await p.setViewportSize({width,height});
  await p.reload();assert.deepEqual(await p.locator('.slots span').allTextContents(),numbers);
  await p.reload();assert(await p.locator('#recommend').isEnabled());const saved=await p.evaluate(()=>localStorage.getItem(KEY));await p.evaluate(()=>{crypto.getRandomValues=()=>{throw Error('Repeat must not generate')}});await p.locator('#recommend').click();await p.waitForFunction(()=>document.querySelector('#already').open);assert.equal(await p.locator('#already-title').textContent(),'오늘은 이미 추천받았습니다');await p.waitForTimeout(1100);assert(await p.locator('#already').evaluate(e=>e.open));assert.equal(await p.evaluate(()=>localStorage.getItem(KEY)),saved);await p.locator('#already-confirm').click();await p.locator('#recommend').click();await p.waitForFunction(()=>document.querySelector('#already').open);await p.locator('#already-today').click();assert.deepEqual(await p.locator('.ball').allTextContents(),numbers);assert.deepEqual(errors,[]);
  console.log(`Published ${width}×${height}: HTTP 200, reveal, 6 unique valid numbers, repeat notice without RNG or overwrite, notice confirm, identical replay, no overflow or JS errors`);await p.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
