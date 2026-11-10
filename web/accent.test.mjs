import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCENTS, ON_ACCENT, AccentPicker, accentOf, shade } from "./accent.js";

// WCAG 2 contrast ratio of two #rrggbb colors
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("text on every accent is readable", () => {
  for (const accent of ACCENTS) assert.ok(contrast(accent.color, ON_ACCENT) >= 4.5, `${accent.id} is too dark`);
});

test("every accent shows against the dark page", () => {
  for (const accent of ACCENTS) assert.ok(contrast(accent.color, "#1c1c1c") >= 3, `${accent.id} is too dim`);
});

test("the panel's labels stay readable on every body", () => {
  const SILK = "#c9c6bd";                     // (upstream panel.rs: the labels' color)
  for (const accent of ACCENTS) assert.ok(contrast(accent.body[0], SILK) >= 3, `${accent.id} body is too light`);
});

test("a body is its color darkened", () => {
  assert.equal(shade("#ff8000", 0.5), "#804000");
  assert.deepEqual(accentOf("teal").body, [shade("#2dd4bf", 0.5), shade("#2dd4bf", 0.4)]);
});

test("an unknown color gives graphite, the panel's own gray", () => {
  assert.equal(accentOf("nope").id, "graphite");
  assert.equal(accentOf(null).id, "graphite");
  assert.deepEqual(accentOf("graphite").body, ["#5e6166", "#4a4d52"]);
});

function fakeDocument() {
  const props = {};
  const page = { dataset: {}, style: { setProperty: (k, v) => { props[k] = v; } } };
  return { props, page, events: [], documentElement: page, querySelectorAll: () => [],
    dispatchEvent(event) { this.events.push(event.type); } };
}
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test("a chosen accent is set on the page and kept for the next visit", () => {
  const storage = memory();
  const doc = fakeDocument();
  new AccentPicker(doc, storage).choose("teal");
  assert.equal(doc.props["--accent"], "#2dd4bf");
  assert.equal(doc.page.dataset.body, accentOf("teal").body.map((hex) => hex.slice(1)).join(","));
  assert.deepEqual(doc.events, ["bodycolor"]);
  assert.equal(new AccentPicker(fakeDocument(), storage).current.id, "teal");
});

test("the picker works without storage", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const picker = new AccentPicker(fakeDocument(), blocked);
  assert.equal(picker.current.id, "graphite");
  picker.choose("pink");
  assert.equal(picker.current.id, "pink");
});
