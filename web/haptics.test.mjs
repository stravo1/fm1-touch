import { test } from "node:test";
import assert from "node:assert/strict";
import { Haptics, PULSES } from "./haptics.js";
import { Preference } from "./preferences.js";
import { WebHaptics } from "./vendor/web-haptics/index.mjs";

function setup({ on = true, isAvailable = true } = {}) {
  const sent = [];
  let time = 0;
  const haptics = new Haptics(new Preference("haptics", on, null), { trigger: (pattern) => sent.push(pattern), isAvailable, now: () => time });
  return { haptics, sent, advance: (ms) => { time += ms; } };
}

test("a button press is a longer pulse than a knob click", () => {
  const { haptics, sent } = setup();
  haptics.press();
  haptics.knob();
  assert.deepEqual(sent, [PULSES.press, PULSES.knob]);
  assert.ok(PULSES.press[0].duration > PULSES.knob[0].duration);
});

test("a fast knob turn gives one pulse per 30 ms, not one per click", () => {
  const { haptics, sent, advance } = setup();
  haptics.knob();
  advance(10);
  haptics.knob();
  advance(25);
  haptics.knob();
  assert.equal(sent.length, 2);
});

test("off in settings, or no haptics on the device, nothing pulses", () => {
  for (const options of [{ on: false }, { isAvailable: false }]) {
    const { haptics, sent } = setup(options);
    haptics.press();
    haptics.knob();
    assert.deepEqual(sent, []);
  }
});

test("on Android, web-haptics sends the pulse to the Vibration API at full length", async () => {
  const vibrations = [];
  const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const supportedBefore = WebHaptics.isSupported;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { vibrate: (p) => vibrations.push(p) } });
  WebHaptics.isSupported = true;            // (the library reads this once, when it loads)
  try {
    await new WebHaptics().trigger(PULSES.press);
    await new WebHaptics().trigger(PULSES.knob);
    assert.deepEqual(vibrations, [[12], [5]]);
  } finally {
    WebHaptics.isSupported = supportedBefore;
    Object.defineProperty(globalThis, "navigator", navigatorBefore);
  }
});
