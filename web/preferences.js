// A setting kept in this browser. It still works, for this visit only, where storage is blocked.
const PREFIX = "fm1-touch.";

export class Preference {
  constructor(name, fallback, storage = browserStorage()) {
    this.key = PREFIX + name;
    this.fallback = fallback;
    this.storage = storage;
    this.listeners = [];
    this.current = this.read();
  }

  read() {
    try {
      const stored = this.storage?.getItem(this.key);
      return stored === null || stored === undefined ? this.fallback : JSON.parse(stored);
    } catch {
      return this.fallback;               // (blocked storage, or a value from an older version)
    }
  }

  get value() { return this.current; }

  set(value) {
    this.current = value;
    try { this.storage?.setItem(this.key, JSON.stringify(value)); } catch { /* this visit only */ }
    for (const listener of this.listeners) listener(value);
  }

  onChange(listener) { this.listeners.push(listener); }
}

function browserStorage() {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}
