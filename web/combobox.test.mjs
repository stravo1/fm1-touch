import { test } from "node:test";
import assert from "node:assert/strict";
import { readGroups, filterGroups, nextIndex } from "./combobox.js";

const option = (value, text) => ({ tagName: "OPTION", value, text });
const select = {
  children: [
    option("felucca", "Felucca 1.8.2-beta"),
    option("mono2k", "MONO2K 1.9.1"),
    option("monohull", "Monohull 0.2.0"),
    { tagName: "OPTGROUP", label: "New on the Hub, not yet run here", children: [option("newone", "Mono Fresh 0.1")] },
  ],
};

test("the select's options and optgroups become groups", () => {
  const groups = readGroups(select);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, null);
  assert.deepEqual(groups[0].options.map((o) => o.value), ["felucca", "mono2k", "monohull"]);
  assert.equal(groups[1].label, "New on the Hub, not yet run here");
});

test("a search matches every word, in any case, across groups", () => {
  const found = filterGroups(readGroups(select), "  MONO ");
  assert.deepEqual(found.flatMap((g) => g.options.map((o) => o.value)), ["mono2k", "monohull", "newone"]);
  assert.deepEqual(filterGroups(readGroups(select), "mono 1.9").flatMap((g) => g.options.map((o) => o.value)), ["mono2k"]);
});

test("a group with no match goes, and an empty search keeps all", () => {
  assert.equal(filterGroups(readGroups(select), "felucca").length, 1);
  assert.equal(filterGroups(readGroups(select), "zzz").length, 0);
  assert.equal(filterGroups(readGroups(select), "").flatMap((g) => g.options).length, 4);
});

test("arrow keys wrap around the ends", () => {
  assert.equal(nextIndex(2, 1, 3), 0);
  assert.equal(nextIndex(0, -1, 3), 2);
  assert.equal(nextIndex(0, 1, 0), -1);
});

test("before the catalog comes, the picker says it is loading and does not open", async () => {
  const { triggerState } = await import("./combobox.js");
  assert.deepEqual(triggerState(0, undefined), { text: "Loading firmwares…", isLoading: true });
  assert.deepEqual(triggerState(70, "MONO2K 1.9.1"), { text: "MONO2K 1.9.1", isLoading: false });
});
