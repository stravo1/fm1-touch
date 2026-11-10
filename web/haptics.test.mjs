import { test } from "node:test";
import assert from "node:assert/strict";
import { Haptics, PULSES } from "./haptics.js";
import { PRESETS, resolveHaptic } from "./vendor/haptick/haptick.js";

function setup({ isAvailable = true } = {}) {
  const sent = [];
  let time = 0;
  const haptics = new Haptics({ tick: (preset) => sent.push(preset) }, { isAvailable, now: () => time });
  return { haptics, sent, advance: (ms) => { time += ms; } };
}

test("a button press is a stronger pulse than a knob click", () => {
  const { haptics, sent } = setup();
  haptics.press();
  haptics.knob();
  assert.deepEqual(sent, [PULSES.press, PULSES.knob]);
  assert.ok(resolveHaptic(PULSES.press).vibrate > resolveHaptic(PULSES.knob).vibrate);
});

test("both pulses are haptick presets", () => {
  for (const preset of Object.values(PULSES)) assert.ok(PRESETS[preset], preset);
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

test("a device with no haptics sends nothing", () => {
  const { haptics, sent } = setup({ isAvailable: false });
  haptics.press();
  haptics.knob();
  assert.deepEqual(sent, []);
});
