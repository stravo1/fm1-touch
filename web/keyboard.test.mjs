import { test } from "node:test";
import assert from "node:assert/strict";
import { FM1_KEYS, TURN_CODES, Keymap, controlBoxes, keyName } from "./keyboard.js";

const CODES = [...FM1_KEYS.buttonCodes, ...FM1_KEYS.noteCodes.filter(Boolean), ...FM1_KEYS.knobCodes, ...Object.keys(TURN_CODES)];

test("no key does two things", () => {
  assert.equal(new Set(CODES).size, CODES.length);
});

test("every FM-1 button and note key plays from a key, some with Shift", () => {
  const played = new Set(CODES.flatMap((code) => [FM1_KEYS.keyId(code), FM1_KEYS.keyId(code, true)]));
  for (let id = 0; id <= 40; id++) assert.ok(played.has(id), `matrix id ${id}`);
});

test("the A row and the Q row play one piano run from F3 to C5", () => {
  const run = ["KeyA", "KeyW", "KeyS", "KeyE", "KeyD", "KeyR", "KeyF", "KeyG", "KeyY", "KeyH", "KeyU", "KeyJ",
    "KeyK", "KeyO", "KeyL", "KeyP", "Semicolon"];
  assert.deepEqual(run.map((code) => FM1_KEYS.keyId(code)), run.map((_, i) => 14 + i));
  assert.equal(FM1_KEYS.keyId("Quote"), 32);
  assert.equal(FM1_KEYS.keyId("Enter"), 33);
});

test("Shift plays an octave up, and nothing above G5", () => {
  assert.equal(FM1_KEYS.keyId("KeyR", true), 31);   // A#4
  assert.equal(FM1_KEYS.keyId("KeyL", true), 40);   // G5
  assert.equal(FM1_KEYS.keyId("KeyP", true), -1);
  assert.equal(FM1_KEYS.keyId("Space", true), 12);  // a button ignores Shift
});

test("each control is labeled with its key", () => {
  assert.equal(FM1_KEYS.labelForHit(7), "1");         // MASTER
  assert.equal(FM1_KEYS.labelForHit(100 + 12), "␣");  // PLAY
  assert.equal(FM1_KEYS.labelForHit(100 + 14), "A");  // F3
  assert.equal(FM1_KEYS.labelForHit(100 + 31), "⇧R"); // A#4
  assert.equal(FM1_KEYS.labelForHit(100 + 40), "⇧L"); // G5
});

test("an unmapped key finds nothing", () => {
  assert.equal(FM1_KEYS.keyId("F5"), -1);
  assert.equal(FM1_KEYS.knob("KeyZ"), -1);
});

test("key names are what the key shows", () => {
  assert.deepEqual(["KeyA", "Digit7", "Semicolon", "ArrowLeft", "Space"].map(keyName), ["A", "7", ";", "←", "␣"]);
});

test("controlBoxes finds the extent of each control", () => {
  const hit = (x, y) => (x >= 10 && x < 30 && y >= 20 && y < 40 ? 3 : -1);
  assert.deepEqual(controlBoxes(hit, 50, 50, 2).get(3), { left: 10, top: 20, right: 28, bottom: 38 });
  assert.equal(new Keymap([], [], []).keyId("KeyA"), -1);
});
