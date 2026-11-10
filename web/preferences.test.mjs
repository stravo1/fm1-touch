import { test } from "node:test";
import assert from "node:assert/strict";
import { Preference } from "./preferences.js";

const memory = () => { const m = new Map(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test("a preference starts at its fallback and keeps what is set", () => {
  const storage = memory();
  const sensitivity = new Preference("knob-sensitivity", 1, storage);
  assert.equal(sensitivity.value, 1);
  sensitivity.set(1.5);
  assert.equal(new Preference("knob-sensitivity", 1, storage).value, 1.5);
  assert.equal(storage.m.get("fm1-touch.knob-sensitivity"), "1.5");
});

test("false is kept, not taken for missing", () => {
  const storage = memory();
  new Preference("haptics", true, storage).set(false);
  assert.equal(new Preference("haptics", true, storage).value, false);
});

test("blocked storage or a broken value gives the fallback", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const haptics = new Preference("haptics", true, blocked);
  assert.equal(haptics.value, true);
  haptics.set(false);
  assert.equal(haptics.value, false);
  const broken = memory();
  broken.setItem("fm1-touch.haptics", "{not json");
  assert.equal(new Preference("haptics", true, broken).value, true);
});

test("listeners hear each change", () => {
  const heard = [];
  const preference = new Preference("haptics", true, null);
  preference.onChange((value) => heard.push(value));
  preference.set(false);
  assert.deepEqual(heard, [false]);
});
