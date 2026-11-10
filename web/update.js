// Keeps an installed app current. An installed app often stays open for days, so it never
// reloads by itself. The page asks for version.json (build.sh writes it on every deploy) when the
// app comes back to the screen and every half hour. On a new version it reloads: sw.js answers
// from the network first, so the reload gets every new file. While the synth plays, it asks first.
const CHECK_EVERY_MS = 30 * 60 * 1000;

// What to do after a check: the version this page loaded with, and the one the site has now.
export function updateAction({ loaded, latest, isPlaying }) {
  if (!loaded || !latest || latest === loaded) return "none";   // (offline, or nothing new)
  return isPlaying ? "ask" : "reload";
}

export async function latestVersion(fetchFn) {
  try {
    const response = await fetchFn("version.json", { cache: "no-store" });
    return response.ok ? (await response.json()).version : null;
  } catch {
    return null;                             // (offline: try again next time)
  }
}

export async function keepCurrent(page) {
  page.navigator.serviceWorker?.register("sw.js");
  const loaded = await latestVersion(page.fetch);
  const banner = page.document.getElementById("update");
  const check = async () => {
    const action = updateAction({ loaded, latest: await latestVersion(page.fetch),
      isPlaying: "playing" in page.document.documentElement.dataset });
    if (action === "reload") page.location.reload();
    if (action === "ask") banner.hidden = false;
  };
  page.document.addEventListener("visibilitychange", () => {
    if (page.document.visibilityState === "visible") check();
  });
  page.setInterval(check, CHECK_EVERY_MS);
  page.document.getElementById("update-reload").addEventListener("click", () => page.location.reload());
  return check;
}

if (typeof window !== "undefined") keepCurrent(window);
