// The computer keyboard on the FM-1: each note key, button and knob has its own key. The page
// reads KeyboardEvent.code, so a key stays in the same place on every keyboard layout. A knob's key
// chooses that knob, and [ and ] turn the chosen knob.
import { Preference } from "./preferences.js";

// matrix ids 0..13: OCT- OCT+ FX SCL ENV LFO EDIT GLO HOME SAVE ARP SEQ PLAY REC
const BUTTON_CODES = ["ArrowLeft", "ArrowRight", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN",
  "KeyM", "Comma", "Period", "Slash", "Space", "Backslash"];
// the note keys from F3 (matrix id 14): one piano run, the A row white and the Q row black. With
// Shift, the same keys play an octave up, up to G5 (matrix id 40). A#4 is Shift+R: [ turns knobs.
const NOTE_CODES = ["KeyA", "KeyW", "KeyS", "KeyE", "KeyD", "KeyR", "KeyF", "KeyG", "KeyY", "KeyH", "KeyU",
  "KeyJ", "KeyK", "KeyO", "KeyL", "KeyP", "Semicolon", null, "Quote", "Enter"];
const FIRST_NOTE = 14, LAST_NOTE = 40, OCTAVE = 12;
// the panel's knobs: SELECT PRESETS ALGORITHM KNOB1..4, then MASTER (the pot)
const KNOB_CODES = ["Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit1"];
export const TURN_CODES = { BracketLeft: -1, BracketRight: 1 };

const SYMBOLS = { ArrowLeft: "←", ArrowRight: "→", Comma: ",", Period: ".", Slash: "/", Semicolon: ";",
  Quote: "'", Backslash: "\\", Space: "␣", Enter: "↵" };
export const keyName = (code) => SYMBOLS[code] ?? code.replace(/^(Key|Digit)/, "");

export class Keymap {
  constructor(buttonCodes, noteCodes, knobCodes) {
    this.buttonCodes = buttonCodes;
    this.noteCodes = noteCodes;
    this.knobCodes = knobCodes;
  }

  // the matrix id that a key plays, or -1
  keyId(code, isShifted = false) {
    const button = this.buttonCodes.indexOf(code);
    if (button >= 0) return button;
    const note = this.noteCodes.indexOf(code);
    const id = FIRST_NOTE + note + (isShifted ? OCTAVE : 0);
    return note < 0 || id > LAST_NOTE ? -1 : id;
  }

  knob(code) { return this.knobCodes.indexOf(code); }

  // the label for a panel_hit result: 0..7 a knob, 100 + id a button or key
  labelForHit(hit) {
    if (hit < 100) return keyName(this.knobCodes[hit]);
    const id = hit - 100;
    if (id < FIRST_NOTE) return keyName(this.buttonCodes[id]);
    const code = this.noteCodes[id - FIRST_NOTE];
    return code ? keyName(code) : "⇧" + keyName(this.noteCodes[id - FIRST_NOTE - OCTAVE]);
  }
}

export const FM1_KEYS = new Keymap(BUTTON_CODES, NOTE_CODES, KNOB_CODES);

export const keyLabels = new Preference("key-labels", typeof matchMedia !== "undefined" && matchMedia("(pointer: fine)").matches);

// The bounding box of each control on the panel, found through its hit test.
export function controlBoxes(hit, width, height, stride = 4) {
  const boxes = new Map();
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const found = hit(x, y);
      if (found < 0) continue;
      const box = boxes.get(found) ?? { left: x, top: y, right: x, bottom: y };
      boxes.set(found, { left: Math.min(box.left, x), top: Math.min(box.top, y),
        right: Math.max(box.right, x), bottom: Math.max(box.bottom, y) });
    }
  }
  return boxes;
}

// The key labels drawn over the panel, and a ring around the chosen knob.
export class KeyLabelLayer {
  constructor(keymap, boxes) {
    this.keymap = keymap;
    this.boxes = boxes;
  }

  draw(context, chosenKnob, accent) {
    context.save();
    context.font = "600 15px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const [hit, box] of this.boxes) this.drawBadge(context, this.keymap.labelForHit(hit), box, hit < 100);
    this.drawRing(context, this.boxes.get(chosenKnob), accent);
    context.restore();
  }

  // knobs and buttons: the top-right corner; note keys: the bottom middle
  drawBadge(context, text, box, isKnob) {
    const width = Math.max(22, context.measureText(text).width + 10);
    const isNote = !isKnob && box.bottom - box.top > 80;
    const x = isNote ? (box.left + box.right) / 2 : box.right - width / 2;
    const y = isNote ? box.bottom - 18 : box.top + 11;
    context.fillStyle = "rgba(15, 15, 15, .72)";
    context.beginPath();
    context.roundRect(x - width / 2, y - 11, width, 22, 6);
    context.fill();
    context.fillStyle = "#ededed";
    context.fillText(text, x, y + 1);
  }

  drawRing(context, box, accent) {
    if (!box) return;
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.beginPath();
    context.arc((box.left + box.right) / 2, (box.top + box.bottom) / 2, (box.right - box.left) / 2 + 2, 0, Math.PI * 2);
    context.stroke();
  }
}

// the switch in settings
if (typeof document !== "undefined") {
  const toggle = document.getElementById("key-labels");
  toggle.checked = keyLabels.value;
  toggle.addEventListener("change", () => keyLabels.set(toggle.checked));
}
