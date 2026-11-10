import { test } from "node:test";
import assert from "node:assert/strict";
import { hitNear, KnobDrag, knobTravel } from "./touch.js";

// A panel with one control: a 10x10 square at (100, 100).
const square = (x, y) => (x >= 100 && x < 110 && y >= 100 && y < 110 ? 7 : -1);

test("a direct hit wins", () => {
  assert.equal(hitNear(square, 105, 105, 20), 7);
});

test("a finger near a control still finds it", () => {
  assert.equal(hitNear(square, 105, 120, 20), 7);
  assert.equal(hitNear(square, 90, 95, 20), 7);
});

test("a finger far from every control finds nothing", () => {
  assert.equal(hitNear(square, 200, 200, 20), -1);
  assert.equal(hitNear(square, 105, 120, 0), -1);
});

test("up and right turn a knob clockwise", () => {
  assert.equal(knobTravel(0, -10), 10);
  assert.equal(knobTravel(10, 0), 10);
  assert.equal(knobTravel(0, 10), -10);
});

test("a knob drag gives whole clicks and keeps the remainder", () => {
  const drag = new KnobDrag(8);
  assert.equal(drag.clicks(0, -5), 0);
  assert.equal(drag.clicks(0, -5), 1);
  assert.equal(drag.clicks(0, -14), 2);
  assert.equal(drag.clicks(0, 4), 0);
  assert.equal(drag.clicks(0, 10), -1);
});

test("a higher knob sensitivity needs less finger travel per click", async () => {
  const { knobStep, potPerPx, KNOB_STEP, POT_PER_PX } = await import("./touch.js");
  assert.equal(knobStep(1), KNOB_STEP);
  assert.equal(knobStep(2), KNOB_STEP / 2);
  assert.equal(knobStep(0.5), KNOB_STEP * 2);
  assert.equal(potPerPx(2), POT_PER_PX * 2);
  const fast = new KnobDrag(knobStep(2));
  assert.equal(fast.clicks(0, -8), 2);
});
