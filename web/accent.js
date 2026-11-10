// The accent color of the page around the synth: a set of colors to choose from, kept in this
// browser. <div id="accents"></div> gets one swatch per color.
export const ACCENTS = [
  { id: "amber", name: "Amber", color: "#f2a33a" },
  { id: "coral", name: "Coral", color: "#ff7a6b" },
  { id: "pink", name: "Pink", color: "#f472b6" },
  { id: "violet", name: "Violet", color: "#a78bfa" },
  { id: "blue", name: "Blue", color: "#60a5fa" },
  { id: "teal", name: "Teal", color: "#2dd4bf" },
  { id: "lime", name: "Lime", color: "#a3e635" },
  { id: "white", name: "White", color: "#ededed" },
];
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
    this.root.documentElement.style.setProperty("--accent", this.current.color);
    this.root.documentElement.style.setProperty("--on-accent", ON_ACCENT);
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
      swatch.style.setProperty("--swatch", accent.color);
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
