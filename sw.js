// Offline support: the app and answers are fetched fresh when online and served from cache when offline.
const CACHE="tvib-v17";
const CORE=["./","index.html","answers.json","logo-art2.png","buddha-hd.jpg","icon-192.png","icon-512.png","manifest.webmanifest"];
// fonts and the PDF libraries are fetched up front too, so everything (PDF included) works offline after the first visit
const EXTRA=["https://fonts.googleapis.com/css2?family=Noto+Serif+Sinhala:wght@400;600;700;800&family=Noto+Sans+Sinhala:wght@400;600;700;800&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"];
async function warmFonts(c){try{const r=await fetch(EXTRA[0]);if(!r.ok)return;await c.put(EXTRA[0],r.clone());const css=await r.text();
  const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]);await Promise.all(urls.map(u=>fetch(u).then(x=>x.ok&&c.put(u,x)).catch(()=>{})))}catch(e){}}
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(async c=>{await c.addAll(CORE);
  await Promise.all(EXTRA.slice(1).map(u=>c.add(u).catch(()=>{})));await warmFonts(c)}).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  const same=u.origin===location.origin;
  if(same){ // network first, fall back to cache
    e.respondWith(fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(ca=>ca.put(r,c))}return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("index.html"))));
  }else if(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host)){ // cache first for fonts and libraries
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(r,c));return res})));
  }});
