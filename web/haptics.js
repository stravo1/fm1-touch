// A short tap of feedback for a knob click or a button press, through web-haptics
// (vendor/web-haptics): the Vibration API on Android, and on iPhone, where Safari has no
// Vibration API, the system tick of a hidden switch control.
import { WebHaptics } from "./vendor/web-haptics/index.mjs";
import { Preference } from "./preferences.js";

// (full intensity: on Android web-haptics drives a lower one as on/off pulses, too short to feel here)
export const PULSES = { press: [{ duration: 12, intensity: 1 }], knob: [{ duration: 5, intensity: 1 }] };
const KNOB_GAP_MS = 30;                    // (a fast turn: one tap per this, not one per click)

export class Haptics {
  constructor(preference, { trigger, isAvailable, now = () => performance.now() }) {
    this.preference = preference;
    this.trigger = trigger;
    this.isAvailable = isAvailable;
    this.now = now;
    this.lastKnob = -Infinity;
  }

  press() { this.pulse(PULSES.press); }

  knob() {
    const now = this.now();
    if (now - this.lastKnob < KNOB_GAP_MS) return;
    this.lastKnob = now;
    this.pulse(PULSES.knob);
  }

  pulse(pattern) {
    if (this.isAvailable && this.preference.value) this.trigger(pattern);
  }
}

function browserHaptics() {
  if (typeof document === "undefined") return new Haptics(new Preference("haptics", false, null), { trigger() {}, isAvailable: false });
  const engine = new WebHaptics();
  // (no Vibration API and no touch screen, such as a desktop Mac: nothing to feel)
  const isAvailable = WebHaptics.isSupported || matchMedia("(pointer: coarse)").matches;
  return new Haptics(new Preference("haptics", true), { trigger: (pattern) => engine.trigger(pattern), isAvailable });
}

export const haptics = browserHaptics();

// the switch in settings; hidden where this device has no haptics
if (typeof document !== "undefined") {
  const toggle = document.getElementById("haptics");
  toggle.checked = haptics.preference.value;
  toggle.addEventListener("change", () => haptics.preference.set(toggle.checked));
  toggle.closest(".control").hidden = !haptics.isAvailable;
}
