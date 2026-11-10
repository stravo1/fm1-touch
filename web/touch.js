// Touch helpers for the panel: a forgiving hit test for fingers, and knob drags measured in
// screen pixels so a knob turns at the same rate on a phone and on a desktop.

export const KNOB_STEP = 8;        // CSS px of finger travel per encoder click
export const POT_PER_PX = 5;       // MASTER pot units (0..1023) per CSS px
export const TOUCH_SLOP = 18;      // CSS px around a finger that still finds a control

const DIRECTIONS = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];

// The control under (x, y), or the first one found on two rings around it. `hit` returns -1 for nothing.
export function hitNear(hit, x, y, radius) {
  const direct = hit(x, y);
  if (direct >= 0 || radius <= 0) return direct;
  for (const ring of [radius / 2, radius]) {
    for (const [dx, dy] of DIRECTIONS) {
      const found = hit(x + dx * ring, y + dy * ring);
      if (found >= 0) return found;
    }
  }
  return -1;
}

// Finger travel on a knob: up or right turns it clockwise.
export const knobTravel = (dx, dy) => dx - dy;

export class KnobDrag {
  constructor(step = KNOB_STEP) {
    this.step = step;
    this.remainder = 0;
  }

  // Whole encoder clicks for this move; the rest carries over to the next one.
  clicks(dx, dy) {
    this.remainder += knobTravel(dx, dy);
    const clicks = Math.trunc(this.remainder / this.step) || 0;   // (0, not -0)
    this.remainder -= clicks * this.step;
    return clicks;
  }
}
