const {chromium}=require('C:/Users/jilzu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'}),p=await b.newPage();await p.goto(process.argv[2]||'http://localhost:8771/');
 for(const saved of [false,true]){
  await p.evaluate(saved=>{localStorage.clear();if(saved)localStorage.setItem(KEY,JSON.stringify({day:day(),numbers:[1,8,17,26,34,45]}));refresh();},saved);
  for(const [width,height] of [[320,480],[320,568],[360,560],[360,640],[393,650],[393,760],[390,844],[430,932],[667,375],[844,390]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const fit=await p.evaluate(()=>({h:document.documentElement.scrollHeight,w:document.documentElement.scrollWidth,note:document.querySelector('.disclaimer').getBoundingClientRect().bottom,buttons:[...document.querySelectorAll('.history-actions button')].filter(e=>!e.hidden).every(e=>e.getBoundingClientRect().bottom<=innerHeight)}));assert(fit.h<=height&&fit.w<=width&&fit.note<=height&&fit.buttons,JSON.stringify({width,height,saved,fit}));
   if(width===320&&height===480)await p.screenshot({path:`verification/mobile-fit-${saved?'saved':'new'}.png`});
  }
 }
 await p.setViewportSize({width:320,height:480});await p.locator('#today').click();assert(await p.locator('#result').evaluate(e=>e.scrollHeight<=e.clientHeight));assert(await p.locator('#confirm').isVisible());await p.locator('#confirm').click();
 await p.addStyleTag({content:'main{padding-top:34px!important;padding-bottom:44px!important}'});await p.evaluate(()=>{lastFit='';fitScreen();});assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.querySelector('.disclaimer').getBoundingClientRect().bottom<=innerHeight));
 console.log('10 phone viewport sizes × new/completed state: no page scrolling, all buttons and disclaimer visible; 320×480 result fits; simulated top/bottom safe-area padding fits');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
