// A short tap of feedback for a knob click or a button press. Android: the Vibration API.
// iPhone (Safari 18 and later): Safari has no Vibration API, but switching an <input switch>
// gives the system's tick, so a hidden one is switched.
import { Preference } from "./preferences.js";

const PULSE_MS = { press: 12, knob: 5 };
const KNOB_GAP_MS = 30;                    // (a fast turn: one tick per this, not one per click)

export class Haptics {
  constructor(preference, { vibrate, tick, now = () => performance.now() }) {
    this.preference = preference;
    this.vibrate = vibrate;
    this.tick = tick;
    this.now = now;
    this.lastKnob = -Infinity;
  }

  get isAvailable() { return Boolean(this.vibrate || this.tick); }

  press() { this.pulse(PULSE_MS.press); }

  knob() {
    const now = this.now();
    if (now - this.lastKnob < KNOB_GAP_MS) return;
    this.lastKnob = now;
    this.pulse(PULSE_MS.knob);
  }

  pulse(ms) {
    if (!this.preference.value) return;
    if (this.vibrate) this.vibrate(ms);
    else this.tick?.();
  }
}

// Safari's switch: a hidden <label><input type="checkbox" switch></label>, clicked to tick
function switchTick(document) {
  const label = document.createElement("label");
  const input = Object.assign(document.createElement("input"), { type: "checkbox" });
  input.setAttribute("switch", "");
  label.append(input);
  label.style.display = "none";
  document.body.append(label);
  return () => label.click();
}

function browserHaptics() {
  if (typeof document === "undefined") return new Haptics(new Preference("haptics", false, null), {});
  const vibrate = typeof navigator.vibrate === "function" ? (ms) => navigator.vibrate(ms) : null;
  const isApple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
  return new Haptics(new Preference("haptics", true), { vibrate, tick: !vibrate && isApple ? switchTick(document) : null });
}

export const haptics = browserHaptics();

// the switch in settings; hidden where this device has no haptics
if (typeof document !== "undefined") {
  const toggle = document.getElementById("haptics");
  toggle.checked = haptics.preference.value;
  toggle.addEventListener("change", () => haptics.preference.set(toggle.checked));
  toggle.closest(".control").hidden = !haptics.isAvailable;
}
