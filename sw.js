const CACHE='bugbreak-v6-art-audio';
const CORE=['./','./index.html','./style.css','./data.js','./audio.js','./ui.js','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./normal-1.mp3','./normal-2.mp3','./normal-3.mp3','./normal-4.mp3',...Array.from({length:10},(_,i)=>`./boss-${i+1}.mp3`),...['bite','hit','dash','gem','repair','level','boss','special','death'].map(n=>`./sfx-${n}.wav`)];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('./index.html'))))});
