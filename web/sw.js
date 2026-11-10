// Offline support: this site's own files, network first so an update arrives at once, the cached
// copy when there is no network. Firmware downloads are other sites' and pass through: the page
// keeps each firmware it played in IndexedDB (persistence.js).
const CACHE = "fm1-touch";
const SHELL = ["./", "index.html", "style.css", "main.js", "touch.js", "fwsc.js", "persistence.js", "tryout.js",
  "worklet.js", "jit.js", "firmwares.json", "fm1_web.wasm", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(fromNetwork(event.request));
});

async function fromNetwork(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}
