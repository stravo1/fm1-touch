// A searchable select in the style of Frappe UI's Autocomplete. It stands in for a
// <select data-combobox>, which stays the one owner of the options and the value: main.js fills
// and reads the select as before, and a pick here sets it and fires its "change".
import { iconSvg } from "./icons.js";

// The select's options as groups: [{ label, options: [{ value, text }] }] (label null: no optgroup).
export function readGroups(select) {
  const groups = [{ label: null, options: [] }];
  for (const child of select.children) {
    if (child.tagName === "OPTGROUP") groups.push({ label: child.label, options: [...child.children].map(optionOf) });
    else groups[0].options.push(optionOf(child));
  }
  return groups.filter((group) => group.options.length);
}
const optionOf = (option) => ({ value: option.value, text: option.text });

export function filterGroups(groups, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (option) => words.every((word) => option.text.toLowerCase().includes(word));
  return groups.map((group) => ({ ...group, options: group.options.filter(matches) }))
    .filter((group) => group.options.length);
}

// The trigger's text, and whether it opens: main.js fills the select only once the catalog has come.
export function triggerState(optionCount, selectedText) {
  if (!optionCount) return { text: "Loading firmwares…", isLoading: true };
  return { text: selectedText || "Choose a firmware", isLoading: false };
}

// The highlighted row after an arrow key: it wraps around the ends.
export const nextIndex = (index, step, count) => (count ? (index + step + count) % count : -1);

export class Combobox {
  constructor(select) {
    this.select = select;
    this.trigger = Object.assign(document.createElement("button"), { type: "button", className: "input combobox-trigger" });
    this.trigger.setAttribute("aria-haspopup", "listbox");
    this.panel = Object.assign(document.createElement("div"), { className: "combobox-panel", hidden: true });
    this.search = Object.assign(document.createElement("input"), { type: "search", className: "input combobox-search", placeholder: "Search" });
    this.list = Object.assign(document.createElement("div"), { className: "combobox-list" });
    this.list.setAttribute("role", "listbox");
    this.panel.append(this.search, this.list);
    select.hidden = true;
    select.after(this.trigger, this.panel);
    this.listen();
    this.refresh();
  }

  listen() {
    this.trigger.addEventListener("click", () => (this.panel.hidden ? this.open() : this.close()));
    this.search.addEventListener("input", () => this.renderList());
    this.search.addEventListener("keydown", (event) => this.onKey(event));
    document.addEventListener("pointerdown", (event) => {
      if (!this.panel.hidden && !this.panel.contains(event.target) && !this.trigger.contains(event.target)) this.close();
    });
    new MutationObserver(() => this.refresh()).observe(this.select, { childList: true, subtree: true, characterData: true });
    this.select.addEventListener("change", () => this.refresh());
  }

  refresh() {
    const { text, isLoading } = triggerState(this.select.options.length, this.select.selectedOptions[0]?.text);
    this.trigger.disabled = isLoading;
    this.trigger.setAttribute("aria-busy", String(isLoading));
    this.trigger.innerHTML = `<span class="combobox-value"></span>${iconSvg("chevron-down")}`;
    this.trigger.firstChild.textContent = text;
  }

  open() {
    this.search.value = "";
    this.renderList();
    this.panel.hidden = false;
    this.place();
    this.list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    // (a phone's keyboard would cover the list: there the search field waits for a tap)
    if (!matchMedia("(pointer: coarse)").matches) this.search.focus();
  }

  close() {
    this.panel.hidden = true;
    this.trigger.focus({ preventScroll: true });
  }

  // below the trigger, or above it when there is more room there; never past the screen's edge
  place() {
    const box = this.trigger.getBoundingClientRect();
    const roomBelow = innerHeight - box.bottom - 12, roomAbove = box.top - 12;
    const below = roomBelow >= Math.min(280, roomAbove);
    Object.assign(this.panel.style, { left: `${box.left}px`, width: `${box.width}px`,
      maxHeight: `${Math.min(320, below ? roomBelow : roomAbove)}px`,
      top: below ? `${box.bottom + 4}px` : "", bottom: below ? "" : `${innerHeight - box.top + 4}px` });
  }

  renderList() {
    const groups = filterGroups(readGroups(this.select), this.search.value);
    this.rows = [];
    this.list.replaceChildren();
    for (const group of groups) {
      if (group.label) this.list.append(Object.assign(document.createElement("div"), { className: "combobox-group", textContent: group.label }));
      for (const option of group.options) this.list.append(this.row(option));
    }
    if (!this.rows.length) this.list.append(Object.assign(document.createElement("div"), { className: "combobox-empty", textContent: "No results found" }));
    this.highlight(Math.max(0, this.rows.findIndex((row) => row.dataset.value === this.select.value)));
  }

  row(option) {
    const row = Object.assign(document.createElement("div"), { className: "combobox-option" });
    row.dataset.value = option.value;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(option.value === this.select.value));
    row.innerHTML = `<span></span>${option.value === this.select.value ? iconSvg("check") : ""}`;
    row.firstChild.textContent = option.text;
    row.addEventListener("click", () => this.choose(option.value));
    row.addEventListener("pointermove", () => this.highlight(this.rows.indexOf(row)));
    this.rows.push(row);
    return row;
  }

  highlight(index) {
    this.active = index;
    this.rows.forEach((row, i) => row.classList.toggle("active", i === index));
    this.rows[index]?.scrollIntoView({ block: "nearest" });
  }

  onKey(event) {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step) this.highlight(nextIndex(this.active, step, this.rows.length));
    else if (event.key === "Enter" && this.rows[this.active]) this.choose(this.rows[this.active].dataset.value);
    else if (event.key === "Escape") this.close();
    else return;
    event.preventDefault();
  }

  choose(value) {
    this.close();
    if (value === this.select.value) return;
    this.select.value = value;
    this.select.dispatchEvent(new Event("change"));
  }
}

if (typeof document !== "undefined") for (const select of document.querySelectorAll("select[data-combobox]")) new Combobox(select);
