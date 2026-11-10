// ../haptick-src/src/presets.ts
var MAX_IOS_TICKS = 4;
var PRESETS = {
  selection: { vibrate: 6, iosTicks: 1 },
  tick: { vibrate: 8, iosTicks: 1 },
  // Many Android motors blur pulses under ~15ms together, so the tap weights
  // are spread far enough apart to feel different on most phones.
  light: { vibrate: 15, iosTicks: 1 },
  medium: { vibrate: 35, iosTicks: 1 },
  heavy: { vibrate: 60, iosTicks: 2 },
  success: { vibrate: [12, 60, 24], iosTicks: 2 },
  warning: { vibrate: [24, 80, 24], iosTicks: 2 },
  error: { vibrate: [30, 50, 30, 50, 30], iosTicks: 3 },
  // Three rising pulses: the strongest preset, for a drag's big payoff.
  burst: { vibrate: [14, 40, 18, 40, 34], iosTicks: 3 }
};
function resolveHaptic(haptic) {
  if (typeof haptic === "string") return PRESETS[haptic] ?? PRESETS.light;
  const ticks = Math.round(haptic.iosTicks ?? 1);
  return { vibrate: haptic.vibrate, iosTicks: Math.min(MAX_IOS_TICKS, Math.max(1, ticks)) };
}

// ../haptick-src/src/engine.ts
var MUTED_KEY = "haptick:muted";
var engine = null;
var muted = null;
var muteListeners = /* @__PURE__ */ new Set();
function supportsSwitchControl() {
  if (typeof HTMLInputElement === "undefined") return false;
  if ("switch" in HTMLInputElement.prototype) return true;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /MacIntel/.test(navigator.platform);
}
function hasCoarsePointer() {
  try {
    return window.matchMedia("(any-pointer: coarse)").matches;
  } catch {
    return false;
  }
}
function hapticEngine() {
  if (engine) return engine;
  if (typeof window === "undefined" || typeof navigator === "undefined") return "none";
  if (!hasCoarsePointer()) engine = "none";
  else if (typeof navigator.vibrate === "function") engine = "vibrate";
  else if (supportsSwitchControl()) engine = "switch";
  else engine = "none";
  return engine;
}
function readMuted() {
  try {
    return window.localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}
function isMuted() {
  if (muted === null) {
    if (typeof window === "undefined") return false;
    muted = readMuted();
    window.addEventListener("storage", (event) => {
      if (event.key !== MUTED_KEY && event.key !== null) return;
      const next = readMuted();
      if (next !== muted) notifyMuted(muted = next);
    });
  }
  return muted;
}
function setMuted(next) {
  if (isMuted() === next) return;
  muted = next;
  try {
    if (next) window.localStorage.setItem(MUTED_KEY, "1");
    else window.localStorage.removeItem(MUTED_KEY);
  } catch {
  }
  notifyMuted(next);
}
function onMutedChange(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}
function notifyMuted(value) {
  for (const listener of muteListeners) listener(value);
}
function vibrate(haptic) {
  if (hapticEngine() !== "vibrate" || isMuted()) return;
  try {
    navigator.vibrate(resolveHaptic(haptic).vibrate);
  } catch {
  }
}

// ../haptick-src/src/switch.ts
var HAPTIC_SWITCH_SELECTOR = "[data-haptick]";
var INERT_HOST = ":disabled, [aria-disabled='true'], [aria-busy='true']";
var PARK_DISTANCE_PX = 1e4;
var BASE_STYLE = [
  "position:absolute",
  "inset:0",
  "z-index:2",
  "width:100%",
  "height:100%",
  "margin:0",
  "padding:0",
  "border:0",
  "appearance:auto",
  "-webkit-appearance:auto",
  "opacity:0",
  "cursor:inherit",
  "-webkit-tap-highlight-color:transparent"
].join(";");
var SHEET = `${INERT_HOST.split(", ").map((host) => `${host} > ${HAPTIC_SWITCH_SELECTOR}`).join(",")}{pointer-events:none!important}`;
var sheetRoots = /* @__PURE__ */ new WeakSet();
function injectSheet(input) {
  const root = input.getRootNode();
  if (!(root instanceof Document || root instanceof ShadowRoot) || sheetRoots.has(root)) return;
  sheetRoots.add(root);
  const doc = input.ownerDocument;
  try {
    const sheet = new (doc.defaultView ?? window).CSSStyleSheet();
    sheet.replaceSync(SHEET);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  } catch {
    const style = doc.createElement("style");
    style.textContent = SHEET;
    (root instanceof Document ? root.head : root).appendChild(style);
  }
}
var live = /* @__PURE__ */ new Set();
var unwatchMute = null;
function applyPointerEvents(input) {
  input.style.pointerEvents = isMuted() ? "none" : input.dataset.haptickCatch === "" ? "auto" : "";
}
function createSwitch(host, { drag = false, zIndex, catchTouches = false, debug = false } = {}) {
  const input = host.ownerDocument.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.setAttribute("data-haptick", drag ? "drag" : "tap");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  input.style.cssText = BASE_STYLE;
  input.style.touchAction = drag ? "none" : "manipulation";
  if (zIndex !== void 0) input.style.zIndex = String(zIndex);
  if (catchTouches) input.dataset.haptickCatch = "";
  if (debug) input.style.opacity = "0.6";
  applyPointerEvents(input);
  live.add(input);
  unwatchMute ?? (unwatchMute = onMutedChange(() => live.forEach(applyPointerEvents)));
  return input;
}
function removeSwitch(input) {
  live.delete(input);
  input.remove();
  if (live.size === 0) {
    unwatchMute?.();
    unwatchMute = null;
  }
}
function ensurePositioned(host) {
  const view = host.ownerDocument.defaultView ?? window;
  if (view.getComputedStyle(host).position === "static") host.style.position = "relative";
}
function viewOf(input) {
  return input.ownerDocument.defaultView ?? window;
}
function isRtl(input) {
  return input.closest("[dir]")?.getAttribute("dir") === "rtl";
}
function park(input, placement) {
  const x = placement === "left-of-finger" ? -PARK_DISTANCE_PX : PARK_DISTANCE_PX;
  input.style.transform = `translateX(${x}px)`;
}
function on(target, type, listener, options) {
  const handler = listener;
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}
function watchTouch(view, guard, pointerId, onSwipe, onEnd, onMove) {
  const unbinds = [
    on(
      view,
      "pointermove",
      (e) => {
        if (e.pointerId !== pointerId) return;
        onMove?.(e.clientX, e.clientY);
        if (guard.move(e.clientX, e.clientY)) onSwipe();
      },
      { capture: true, passive: true }
    ),
    on(
      view,
      "pointerup",
      (e) => {
        if (e.pointerId === pointerId) onEnd();
      },
      { capture: true }
    ),
    on(
      view,
      "pointercancel",
      (e) => {
        if (e.pointerId !== pointerId) return;
        guard.cancel();
        onEnd();
      },
      { capture: true }
    )
  ];
  return () => unbinds.forEach((unbind) => unbind());
}
function forwardTap(input, x, y) {
  const before = input.style.pointerEvents;
  input.style.pointerEvents = "none";
  const target = input.ownerDocument.elementFromPoint(x, y);
  input.style.pointerEvents = before;
  target?.dispatchEvent(
    new (viewOf(input)).MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y })
  );
}

// ../haptick-src/src/tap-guard.ts
var TAP_SLOP_PX = 10;
var TapGuard = class {
  constructor() {
    this.origin = null;
    this.swiped = false;
  }
  down(x, y) {
    this.origin = { x, y };
    this.swiped = false;
  }
  /** True the first time the touch strays past the slop. */
  move(x, y) {
    if (!this.origin || this.swiped) return false;
    if (Math.hypot(x - this.origin.x, y - this.origin.y) <= TAP_SLOP_PX) return false;
    this.swiped = true;
    return true;
  }
  /** A scroll took the touch over. True if it wasn't already a swipe. */
  cancel() {
    const wasTap = !this.swiped;
    this.swiped = true;
    return wasTap;
  }
  /** Whether the click that ends this touch is a real tap; resets the guard. */
  acceptClick() {
    const tap = !this.swiped;
    this.origin = null;
    this.swiped = false;
    return tap;
  }
};

// ../haptick-src/src/ticker.ts
var SWITCH_TRACKING_ARM_MS = 260;
var SWITCH_BURST_MOVE_GAP = 2;
function thumbIsLeft(visuallyOn, rtl) {
  return rtl ? visuallyOn : !visuallyOn;
}
function switchFlipPlacement(visuallyOn, rtl = false) {
  return thumbIsLeft(visuallyOn, rtl) ? "left-of-finger" : "right-of-finger";
}
function switchHoldPlacement(visuallyOn, rtl = false) {
  return thumbIsLeft(visuallyOn, rtl) ? "right-of-finger" : "left-of-finger";
}
var SwitchDragTicker = class {
  constructor({ rtl = false, moveGap = SWITCH_BURST_MOVE_GAP } = {}) {
    this.active = false;
    this.visuallyOn = false;
    this.armedAt = 0;
    this.queued = 0;
    this.movesSincePlace = Number.POSITIVE_INFINITY;
    this.parked = false;
    this.rtl = rtl;
    this.moveGap = Math.max(1, moveGap);
  }
  begin(now, checked) {
    this.active = true;
    this.visuallyOn = checked;
    this.armedAt = now + SWITCH_TRACKING_ARM_MS;
    this.queued = 0;
    this.movesSincePlace = Number.POSITIVE_INFINITY;
    this.parked = false;
  }
  /** Queues `count` ticks; returns the leapfrog to apply now, if any.
   *  Single ticks never stack: a fast drag drops the ones iOS can't keep up
   *  with rather than trailing behind the finger. A burst replaces whatever
   *  is waiting, so it lands the moment it happens. */
  request(now, count = 1) {
    if (!this.active) return { kind: "none" };
    this.queued = count > 1 ? Math.min(MAX_IOS_TICKS, count) : Math.max(this.queued, Math.min(1, count));
    return this.release(now);
  }
  /** Call once per finger move, before the move's handlers run. Once
   *  tracking arms, the switch box sits under the finger and a drag across
   *  its midline would flip it; the first armed move with nothing to play
   *  parks it out of reach instead. */
  move(now) {
    if (!this.active) return { kind: "none" };
    this.movesSincePlace += 1;
    const step = this.release(now);
    if (step.kind !== "none" || this.parked || now < this.armedAt) return step;
    this.parked = true;
    return { kind: "park", placement: switchHoldPlacement(this.visuallyOn, this.rtl) };
  }
  end() {
    this.active = false;
    this.queued = 0;
  }
  release(now) {
    if (this.queued === 0 || now < this.armedAt || this.movesSincePlace < this.moveGap) {
      return { kind: "none" };
    }
    this.queued -= 1;
    this.movesSincePlace = 0;
    this.parked = true;
    const placement = switchFlipPlacement(this.visuallyOn, this.rtl);
    this.visuallyOn = !this.visuallyOn;
    return { kind: "place", placement };
  }
};

// ../haptick-src/src/tap.ts
var noop = () => void 0;
var attached = /* @__PURE__ */ new WeakSet();
function attachTap(host, { haptic = "light", debug = false } = {}) {
  const engine2 = hapticEngine();
  if (engine2 === "none" || attached.has(host)) return noop;
  attached.add(host);
  if (engine2 === "vibrate") {
    const off = on(host, "click", () => {
      if (!host.matches(INERT_HOST)) vibrate(haptic);
    });
    return () => {
      off();
      attached.delete(host);
    };
  }
  ensurePositioned(host);
  const input = createSwitch(host, { debug });
  const guard = new TapGuard();
  let unwatch = null;
  const hold = () => park(input, switchHoldPlacement(input.checked, isRtl(input)));
  const finish = () => {
    unwatch?.();
    unwatch = null;
    input.style.transform = "";
  };
  const unbinds = [
    on(input, "pointerdown", (e) => {
      finish();
      guard.down(e.clientX, e.clientY);
      unwatch = watchTouch(viewOf(input), guard, e.pointerId, hold, finish);
    }),
    // WebKit clicks the switch when the touch ends or a scroll cancels it.
    // Only a real tap reaches the host; preventDefault also undoes the toggle.
    on(input, "click", (e) => {
      finish();
      if (guard.acceptClick()) return;
      e.preventDefault();
      e.stopPropagation();
    })
  ];
  host.appendChild(input);
  injectSheet(input);
  return () => {
    finish();
    unbinds.forEach((unbind) => unbind());
    removeSwitch(input);
    attached.delete(host);
  };
}

// ../haptick-src/src/drag.ts
var attached2 = /* @__PURE__ */ new WeakMap();
function attachDrag(surface, {
  passTaps = false,
  zIndex,
  catchTouches = false,
  moveGap,
  autoBegin = true,
  debug = false
} = {}) {
  const existing = attached2.get(surface);
  if (existing) return existing;
  if (hapticEngine() !== "switch") {
    return {
      element: null,
      begin: () => void 0,
      tick: (haptic = "tick") => vibrate(haptic),
      end: () => void 0,
      destroy: () => void 0
    };
  }
  ensurePositioned(surface);
  const input = createSwitch(surface, { drag: true, zIndex, catchTouches, debug });
  const view = viewOf(input);
  let ticker = null;
  let unbindDrag = null;
  const leapfrog = (step) => {
    if (step.kind !== "none") park(input, step.placement);
  };
  const end = () => {
    unbindDrag?.();
    unbindDrag = null;
    ticker?.end();
    ticker = null;
    input.style.transform = "";
  };
  const begin = () => {
    end();
    if (isMuted()) return;
    const t = new SwitchDragTicker({ rtl: isRtl(input), moveGap });
    t.begin(performance.now(), input.checked);
    ticker = t;
    const unbinds2 = [
      // Capture phase, so surfaces that stop propagation still count moves,
      // and before the surface's own handlers so their ticks join this move.
      on(view, "pointermove", () => leapfrog(t.move(performance.now())), {
        capture: true,
        passive: true
      }),
      // End on the lift too, so a surface that misses its own pointerup
      // can't leave the switch parked out of reach.
      on(view, "pointerup", end, { capture: true }),
      on(view, "pointercancel", end, { capture: true })
    ];
    unbindDrag = () => unbinds2.forEach((unbind) => unbind());
  };
  const guard = new TapGuard();
  const last = { x: 0, y: 0 };
  let unwatch = null;
  const finishTap = () => {
    unwatch?.();
    unwatch = null;
  };
  const unbinds = [
    on(input, "pointerdown", (e) => {
      if (autoBegin) begin();
      if (!passTaps) return;
      finishTap();
      guard.down(e.clientX, e.clientY);
      last.x = e.clientX;
      last.y = e.clientY;
      unwatch = watchTouch(view, guard, e.pointerId, () => void 0, finishTap, (x, y) => {
        last.x = x;
        last.y = y;
      });
    }),
    // WebKit clicks the switch at the end of every drag that started on it;
    // the surface's ancestors must not read that as a tap.
    on(input, "click", (e) => {
      e.stopPropagation();
      if (!passTaps) return;
      finishTap();
      if (guard.acceptClick()) forwardTap(input, last.x, last.y);
    })
  ];
  surface.appendChild(input);
  injectSheet(input);
  const drag = {
    element: input,
    begin,
    tick(haptic = "tick") {
      if (ticker) leapfrog(ticker.request(performance.now(), resolveHaptic(haptic).iosTicks));
    },
    end,
    destroy() {
      end();
      finishTap();
      unbinds.forEach((unbind) => unbind());
      removeSwitch(input);
      attached2.delete(surface);
    }
  };
  attached2.set(surface, drag);
  return drag;
}

// ../haptick-src/src/swipe-back.ts
var SWIPE_BACK_GUARD_MOVES = 3;
function preventSwipeBack(element, { moves = SWIPE_BACK_GUARD_MOVES } = {}) {
  let cancelled = 0;
  const start = () => {
    cancelled = 0;
  };
  const move = (event) => {
    if (cancelled >= moves || !event.cancelable) return;
    event.preventDefault();
    cancelled += 1;
  };
  element.addEventListener("touchstart", start, { passive: true });
  element.addEventListener("touchmove", move, { passive: false });
  return () => {
    element.removeEventListener("touchstart", start);
    element.removeEventListener("touchmove", move);
  };
}
export {
  HAPTIC_SWITCH_SELECTOR,
  PRESETS,
  SWIPE_BACK_GUARD_MOVES,
  SWITCH_TRACKING_ARM_MS,
  SwitchDragTicker,
  TAP_SLOP_PX,
  TapGuard,
  attachDrag,
  attachTap,
  hapticEngine,
  isMuted,
  onMutedChange,
  preventSwipeBack,
  resolveHaptic,
  setMuted,
  switchFlipPlacement,
  switchHoldPlacement,
  vibrate
};
