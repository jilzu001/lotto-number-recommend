'use strict';
const CACHE='lotto-recommend-pwa-__VERSION__';
const HOME=new URL('index.html',self.registration.scope).href;
const FILES=['index.html','about.html','privacy.html','info.css','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/icon-32.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lotto-recommend-pwa-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate'){
  const url=new URL(event.request.url);url.search='';url.hash='';const page=url.href===self.registration.scope?HOME:url.href;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(page,copy)));}return response;}).catch(async()=>await caches.match(page)||await caches.match(HOME)));
 }else{event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));}
});
