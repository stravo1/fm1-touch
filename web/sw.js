// Offline support: this site's own files, network first so an update arrives at once, the cached
// copy when there is no network. Firmware downloads are other sites' and pass through: the page
// keeps each firmware it played in IndexedDB (persistence.js).
// build.sh stamps VERSION with the commit, so every deploy is a new service worker with a cache
// of its own; the old cache goes on activate. update.js finds the deploy and reloads the page.
const VERSION = "dev";
const CACHE = `fm1-touch-${VERSION}`;
const SHELL = ["./", "index.html", "style.css", "main.js", "touch.js", "icons.js", "accent.js", "combobox.js", "update.js", "fwsc.js",
  "persistence.js", "tryout.js", "worklet.js", "jit.js", "firmwares.json", "fm1_web.wasm", "manifest.webmanifest",
  "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
  // (cache: "reload": past the HTTP cache, so the new version does not cache old files)
  const fresh = SHELL.map((url) => new Request(url, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(fromNetwork(event.request));
});

async function fromNetwork(request) {
  const cache = await caches.open(CACHE);
  try {
    // (no-cache: ask the server every time, so a deploy shows at once, not after the HTTP cache expires)
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}
