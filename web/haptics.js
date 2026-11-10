// A short tap of feedback for a knob click or a button press, through haptick
// (vendor/haptick). Android: the Vibration API. iPhone: since iOS 26.5 only a real finger on a
// native switch control ticks, so haptick lays an invisible switch over the synth and, during a
// touch, moves it so the finger's next movement flips it. On iPhone a tick therefore lands on the
// finger's next movement, and on the lift.
import { attachDrag, hapticEngine, isMuted, setMuted } from "./vendor/haptick/haptick.js";

export const PULSES = { press: "light", knob: "selection" };
const KNOB_GAP_MS = 30;                    // (a fast turn: one tick per this, not one per click)

export class Haptics {
  constructor(surface, { isAvailable, now = () => performance.now() }) {
    this.surface = surface;                // haptick's drag: tick(preset)
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

  pulse(preset) {
    if (this.isAvailable) this.surface.tick(preset);   // (haptick skips it when muted)
  }
}

function browserHaptics() {
  if (typeof document === "undefined") return new Haptics({ tick() {} }, { isAvailable: false });
  const stage = document.querySelector(".stage");
  return new Haptics(attachDrag(stage), { isAvailable: hapticEngine() !== "none" });
}

export const haptics = browserHaptics();

// the switch in settings: haptick's own mute setting, the one place it is kept
if (typeof document !== "undefined") {
  const toggle = document.getElementById("haptics");
  toggle.checked = !isMuted();
  toggle.addEventListener("change", () => setMuted(!toggle.checked));
  toggle.closest(".control").hidden = !haptics.isAvailable;
}
