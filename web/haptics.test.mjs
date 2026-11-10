import { test } from "node:test";
import assert from "node:assert/strict";
import { Haptics } from "./haptics.js";
import { Preference } from "./preferences.js";

function setup({ on = true, vibrate = true, tick = false } = {}) {
  const pulses = [], ticks = [];
  let time = 0;
  const haptics = new Haptics(new Preference("haptics", on, null), {
    vibrate: vibrate ? (ms) => pulses.push(ms) : null,
    tick: tick ? () => ticks.push(time) : null,
    now: () => time,
  });
  return { haptics, pulses, ticks, advance: (ms) => { time += ms; } };
}

test("a button press is a longer pulse than a knob click", () => {
  const { haptics, pulses } = setup();
  haptics.press();
  haptics.knob();
  assert.deepEqual(pulses, [12, 5]);
});

test("a fast knob turn gives one pulse per 30 ms, not one per click", () => {
  const { haptics, pulses, advance } = setup();
  haptics.knob();
  advance(10);
  haptics.knob();
  advance(25);
  haptics.knob();
  assert.equal(pulses.length, 2);
});

test("off in settings, nothing pulses", () => {
  const { haptics, pulses } = setup({ on: false });
  haptics.press();
  haptics.knob();
  assert.deepEqual(pulses, []);
});

test("without the Vibration API, the switch tick stands in", () => {
  const { haptics, ticks } = setup({ vibrate: false, tick: true });
  haptics.press();
  assert.equal(ticks.length, 1);
  assert.equal(haptics.isAvailable, true);
});

test("a device with neither has no haptics to offer", () => {
  assert.equal(setup({ vibrate: false, tick: false }).haptics.isAvailable, false);
});
