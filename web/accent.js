// The synth's color: its body, and the accent of the page around it. A set of colors to choose
// from, kept in this browser. <div id="accents"></div> gets one swatch per color. main.js paints
// the body when the "bodycolor" event fires on the document.
const GRAPHITE_BODY = ["#5e6166", "#4a4d52"];    // (the upstream panel's own gray)

// A colored body: the color darkened, so the panel's light labels stay readable on it.
export const shade = (hex, factor) => `#${[1, 3, 5]
  .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * factor).toString(16).padStart(2, "0")).join("")}`;
const bodyOf = (color) => [shade(color, 0.5), shade(color, 0.4)];

export const ACCENTS = [
  { id: "graphite", name: "Graphite", color: "#f2a33a", body: GRAPHITE_BODY },
  { id: "amber", name: "Amber", color: "#f2a33a" },
  { id: "coral", name: "Coral", color: "#ff7a6b" },
  { id: "pink", name: "Pink", color: "#f472b6" },
  { id: "violet", name: "Violet", color: "#a78bfa" },
  { id: "blue", name: "Blue", color: "#60a5fa" },
  { id: "teal", name: "Teal", color: "#2dd4bf" },
  { id: "lime", name: "Lime", color: "#a3e635" },
].map((accent) => ({ body: bodyOf(accent.color), ...accent }));
export const ON_ACCENT = "#171717";
const KEY = "fm1-touch.accent";

export const accentOf = (id) => ACCENTS.find((a) => a.id === id) || ACCENTS[0];

export class AccentPicker {
  constructor(root, storage) {
    this.root = root;
    this.storage = storage;
    this.current = accentOf(this.read());
  }

  read() {
    try { return this.storage?.getItem(KEY); } catch { return null; }   // (private mode)
  }

  choose(id) {
    this.current = accentOf(id);
    try { this.storage?.setItem(KEY, this.current.id); } catch { /* private mode: this visit only */ }
    this.apply();
  }

  apply() {
    const page = this.root.documentElement;
    page.style.setProperty("--accent", this.current.color);
    page.style.setProperty("--on-accent", ON_ACCENT);
    page.dataset.body = this.current.body.map((hex) => hex.slice(1)).join(",");
    this.root.dispatchEvent?.(new Event("bodycolor"));
    for (const swatch of this.root.querySelectorAll("[data-accent]"))
      swatch.setAttribute("aria-checked", String(swatch.dataset.accent === this.current.id));
  }

  render(list) {
    for (const accent of ACCENTS) {
      const swatch = this.root.createElement("button");
      Object.assign(swatch, { type: "button", title: accent.name });
      swatch.className = "swatch";
      swatch.dataset.accent = accent.id;
      swatch.setAttribute("role", "radio");
      swatch.setAttribute("aria-label", accent.name);
      swatch.style.setProperty("--swatch", accent.body[0]);
      swatch.style.setProperty("--swatch-accent", accent.color);
      swatch.addEventListener("click", () => this.choose(accent.id));
      list.append(swatch);
    }
    this.apply();
  }
}

if (typeof document !== "undefined") {
  const storage = (() => { try { return localStorage; } catch { return null; } })();
  new AccentPicker(document, storage).render(document.getElementById("accents"));
}
