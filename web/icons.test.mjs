import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ICONS, iconSvg } from "./icons.js";

test("every icon the page names exists", () => {
  const page = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const names = [...page.matchAll(/data-icon="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(names.length > 0);
  for (const name of names) assert.ok(ICONS[name], `missing icon ${name}`);
});

test("an icon is a sized Lucide svg", () => {
  const svg = iconSvg("x", 20);
  assert.match(svg, /width="20" height="20" viewBox="0 0 24 24"/);
  assert.match(svg, /stroke-width="2"/);
});

test("an unknown icon fails loudly", () => {
  assert.throws(() => iconSvg("nope"), /no icon named nope/);
});
