import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCENTS, ON_ACCENT, AccentPicker, accentOf } from "./accent.js";

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

test("an unknown accent gives the first one", () => {
  assert.equal(accentOf("nope").id, "amber");
  assert.equal(accentOf(null).id, "amber");
});

function fakeDocument() {
  const props = {};
  return { props, documentElement: { style: { setProperty: (k, v) => { props[k] = v; } } }, querySelectorAll: () => [] };
}
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test("a chosen accent is set on the page and kept for the next visit", () => {
  const storage = memory();
  const doc = fakeDocument();
  new AccentPicker(doc, storage).choose("teal");
  assert.equal(doc.props["--accent"], "#2dd4bf");
  assert.equal(new AccentPicker(fakeDocument(), storage).current.id, "teal");
});

test("the picker works without storage", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const picker = new AccentPicker(fakeDocument(), blocked);
  assert.equal(picker.current.id, "amber");
  picker.choose("pink");
  assert.equal(picker.current.id, "pink");
});
