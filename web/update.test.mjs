import { test } from "node:test";
import assert from "node:assert/strict";
import { updateAction, latestVersion, keepCurrent } from "./update.js";

test("the same version, or no answer, does nothing", () => {
  assert.equal(updateAction({ loaded: "a1", latest: "a1", isPlaying: false }), "none");
  assert.equal(updateAction({ loaded: "a1", latest: null, isPlaying: false }), "none");
  assert.equal(updateAction({ loaded: null, latest: "b2", isPlaying: false }), "none");
});

test("a new version reloads a page that is not playing", () => {
  assert.equal(updateAction({ loaded: "a1", latest: "b2", isPlaying: false }), "reload");
});

test("a new version asks first while the synth plays", () => {
  assert.equal(updateAction({ loaded: "a1", latest: "b2", isPlaying: true }), "ask");
});

test("the version check bypasses the HTTP cache and survives no network", async () => {
  let options;
  const site = async (url, opts) => { options = opts; return { ok: true, json: async () => ({ version: "a1" }) }; };
  assert.equal(await latestVersion(site), "a1");
  assert.equal(options.cache, "no-store");
  assert.equal(await latestVersion(async () => { throw new TypeError("offline"); }), null);
  assert.equal(await latestVersion(async () => ({ ok: false })), null);
});

function fakePage({ playing, versions }) {
  const listeners = {}, elements = { update: { hidden: true }, "update-reload": { addEventListener() {} } };
  const page = {
    reloads: 0, intervals: [], registered: [],
    navigator: { serviceWorker: { register: (url) => page.registered.push(url) } },
    fetch: async () => ({ ok: true, json: async () => ({ version: versions.shift() }) }),
    location: { reload: () => { page.reloads++; } },
    setInterval: (fn, ms) => page.intervals.push(ms),
    document: {
      visibilityState: "visible",
      documentElement: { dataset: playing ? { playing: "" } : {} },
      addEventListener: (type, fn) => { listeners[type] = fn; },
      getElementById: (id) => elements[id],
    },
  };
  return { page, elements };
}

test("a deploy reloads an idle page, and checks run every half hour", async () => {
  const { page } = fakePage({ playing: false, versions: ["a1", "b2"] });
  const check = await keepCurrent(page);
  assert.deepEqual(page.registered, ["sw.js"]);
  assert.deepEqual(page.intervals, [30 * 60 * 1000]);
  await check();
  assert.equal(page.reloads, 1);
});

test("a deploy shows the banner while playing", async () => {
  const { page, elements } = fakePage({ playing: true, versions: ["a1", "b2"] });
  const check = await keepCurrent(page);
  await check();
  assert.equal(elements.update.hidden, false);
  assert.equal(page.reloads, 0);
});
