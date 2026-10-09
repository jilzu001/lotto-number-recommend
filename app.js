'use strict';
const $=s=>document.querySelector(s);
const KEY='lotto-recommend-daily-v1';
const HISTORY_KEY='lotto-recommend-history-v1';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const day=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
let busy=false,run=0;
function valid(r){return r&&typeof r.day==='string'&&Array.isArray(r.numbers)&&r.numbers.length===6&&new Set(r.numbers).size===6&&r.numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=45);}
function readHistory(){const saved=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');if(!Array.isArray(saved))throw Error('Invalid history');const latest=JSON.parse(localStorage.getItem(KEY)||'null');const records=[...(valid(latest)?[latest]:[]),...saved.filter(valid)];return [...new Map(records.map(r=>[r.day,r])).values()].sort((a,b)=>b.day.localeCompare(a.day)).slice(0,7);}
function saveHistory(record){const records=[record,...readHistory().filter(r=>r.day!==record.day)].sort((a,b)=>b.day.localeCompare(a.day)).slice(0,7);localStorage.setItem(HISTORY_KEY,JSON.stringify(records));}
function readToday(){const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r&&r.day===day()&&!valid(r))throw Error('Invalid saved result');return valid(r)&&r.day===day()?r:readHistory().find(record=>record.day===day())||null;}
function randomBelow(n){const limit=4294967296-(4294967296%n);let value;do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=limit);return value%n;}
// Irregular weighted sampling without replacement. These weights do not improve winning odds.
function weightFor(number,date,salt,step=0){let hash=2166136261;for(const c of `${date}|${salt}|${step}|${number}`)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b);hash^=hash>>>16;return .35+((hash>>>0)/4294967296)*1.5;}
function generate(date=day(),salt=Date.now()+'-'+crypto.getRandomValues(new Uint32Array(2)).join('-')){
 const pool=Array.from({length:45},(_,i)=>i+1),result=[];
 for(let step=0;step<6;step++){
  // Fresh cryptographic noise changes every remaining weight after each selection.
  const noise=crypto.getRandomValues(new Uint32Array(pool.length));
  const weights=pool.map((n,i)=>weightFor(n,date,salt+'-'+noise[i],step));
  let target=randomBelow(16777216)/16777216*weights.reduce((sum,w)=>sum+w,0),index=0;
  while(index<pool.length-1&&target>=weights[index]){target-=weights[index];index++;}
  result.push(pool.splice(index,1)[0]);
 }
 return result;
}
function refresh(){let r=null,ok=true;try{r=readToday();localStorage.setItem(KEY+'-check','1');localStorage.removeItem(KEY+'-check');}catch{ok=false;}$('#recommend').disabled=busy||!ok;$('#today').hidden=!r;$('#today').disabled=busy;$('#status').textContent=!ok?'추천을 저장하려면 브라우저 저장을 허용해 주세요.':r?'오늘 추천 완료 · 한국시간 자정에 새 추천':'한국시간 자정에 새 추천';}
async function claim(){const commit=()=>{const prior=readToday();if(prior)return {record:prior,replay:true};const date=day(),record={day:date,method:'irregular-weighted-v1',numbers:generate(date)};saveHistory(record);localStorage.setItem(KEY,JSON.stringify(record));return {record,replay:false};};if(navigator.locks)return navigator.locks.request(KEY,commit);throw Error('Storage lock unavailable');}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function show(record,replay=false){const token=++run;const dialog=$('#result');dialog.className=replay?'':'gathering';$('#result-date').textContent=record.day+' · 오늘의 흐름';$('.confetti').replaceChildren();$('#confirm').disabled=!replay;$('#reveal-status').textContent=replay?'저장된 오늘 추천번호':'오늘의 흐름을 담는 중…';$('#balls').replaceChildren(...record.numbers.map(()=>{const el=document.createElement('span');el.className='ball pending';el.textContent='?';return el;}));dialog.showModal();if(!replay){await pause(reduced.matches?40:700);if(token!==run||!dialog.open)return;dialog.className='';}for(let i=0;i<6;i++){if(!replay)await pause(reduced.matches?40:i===0?350:460);if(token!==run||!dialog.open)return;const ball=$('#balls').children[i];ball.className='ball'+(replay?'':' revealed');ball.dataset.color=['yellow','blue','coral','green','yellow','blue'][i];ball.textContent=record.numbers[i];$('#reveal-status').textContent=replay?'저장된 오늘 추천번호':`${i+1} / 6 공개`;}dialog.className='complete';$('#reveal-status').textContent=replay?'저장된 오늘 추천번호':'오늘의 여섯 번호, 공개 완료!';if(!replay&&!reduced.matches){$('.confetti').replaceChildren(...Array.from({length:20},(_,i)=>{const e=document.createElement('i'),a=i*Math.PI/10;e.style.setProperty('--x',Math.cos(a)*180+'px');e.style.setProperty('--y',Math.sin(a)*200+'px');e.style.setProperty('--color',['#ffe34a','#5275d4','#f08a76','#a9d881'][i%4]);return e;}));}$('#confirm').disabled=false;$('#confirm').focus({preventScroll:true});}
$('#recommend').addEventListener('click',async()=>{if(busy||$('#recommend').disabled)return;busy=true;refresh();try{const {record,replay}=await claim();if(replay){busy=false;refresh();$('#already').showModal();$('#already-confirm').focus({preventScroll:true});}else await show(record);}catch{busy=false;refresh();$('#status').textContent='추천을 저장하지 못했습니다. 브라우저 저장 설정을 확인해 주세요.';}});
$('#today').addEventListener('click',()=>{if(busy)return;try{const r=readToday();if(r){busy=true;refresh();show(r,true);}else refresh();}catch{refresh();}});
$('#confirm').addEventListener('click',()=>$('#result').close());
$('#already-confirm').addEventListener('click',()=>$('#already').close());
$('#already-today').addEventListener('click',()=>{$('#already').close();$('#today').click();});
$('#already').addEventListener('close',refresh);
function showHistory(){try{const records=readHistory();$('#history-list').replaceChildren(...records.map(record=>{const row=document.createElement('li'),date=document.createElement('time'),numbers=document.createElement('div');date.dateTime=record.day;date.textContent=record.day+(record.day===day()?' · 오늘':'');numbers.className='history-numbers';record.numbers.forEach(n=>{const el=document.createElement('span');el.textContent=n;numbers.append(el);});row.append(date,numbers);return row;}));$('#history-empty').hidden=records.length>0;$('#history').showModal();$('#history-title').focus({preventScroll:true});$('#history').scrollTop=0;}catch{$('#status').textContent='추천 기록을 불러오지 못했습니다. 브라우저 저장 설정을 확인해 주세요.';}}
$('#history-open').addEventListener('click',()=>{if(!busy)showHistory();});
$('#history-confirm').addEventListener('click',()=>$('#history').close());
$('#result').addEventListener('close',()=>{++run;busy=false;$('.confetti').replaceChildren();refresh();});
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===HISTORY_KEY||e.key===null)refresh();});window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});setInterval(refresh,1000);refresh();
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(error=>console.warn('홈 화면 실행 설정을 등록하지 못했습니다.',error));});}
