# FM-1 Touch

A touch-first page for [fm1-emu](https://github.com/joakimeriksson/fm1-emu), the M-VAVE FM-1 emulator by
Joakim Eriksson. Play it at **https://stravo1.github.io/fm1-touch/**.

The synth fills the screen. Pick a firmware, press Start, and play. All other controls are in the
settings sheet behind the gear button.

## Touch controls

- Hold a button or key with a long press. The browser menu does not open.
- Drag a knob up or right to turn it clockwise. The rate is the same on every screen size.
  Set **Knob sensitivity** in settings, from 0.5× to 2×.
- Each knob click and each button or key press gives a short haptic tap. On Android, the page uses the
  Vibration API. On iPhone, Safari has no Vibration API, and since iOS 26.5 only a real finger on a switch
  control ticks. So an invisible switch covers the synth: a knob tick lands on the finger's next movement,
  and a press ticks when the finger lifts. Turn **Haptics** off in settings.
- A finger near a control, but not exactly on it, still finds it.
- Play with many fingers at the same time.
- Hold the device in landscape. In portrait, the page asks you to turn the device.
- On a touch device, Start goes full screen.

## Keyboard controls

Each note key, button and knob has a key on the computer keyboard. The label on each control shows
its key. Turn **Key labels** off or on in settings. A mouse or trackpad turns them on by default.

- The note keys are one piano run. The A row (A to Enter) plays the white keys from F3 to C5. The
  Q row plays the black keys above them. Hold Shift to play the same keys one octave up, to G5.
  A#4 is Shift+R, because `[` turns knobs.
- The number keys 1 to 8 choose a knob. The Z row plays FX to SEQ.
- The arrow keys are OCT- and OCT+. Space is PLAY, and `\` is REC.
- To turn a knob, press its key, then press `[` or `]`. A ring shows the chosen knob.
  A drag also chooses a knob. MASTER moves one notch for each press.
- The keys stay in the same place on every keyboard layout.

## Install it as an app

The page is a progressive web app (PWA). Install it to get a full-screen app without the browser bar:

- Android (Chrome): open the menu, then select **Install app**.
- iPhone and iPad (Safari): select **Share**, then **Add to Home Screen**.

After you play a firmware once, the app also works offline. The browser keeps each firmware that you played.

The installed app updates itself. When it comes back to the screen, it checks for a new version. If you
have not pressed Start, it reloads. If you are playing, it shows a **Reload** banner.

## Colors

Settings has a row of colors. A color changes the body of the synth and the accent of the page.
**Graphite** is the original gray body. The browser keeps your choice.

Links keep a setup, for example `?fw=mono2k&mhz=100`.

## How it is built

The `upstream/` folder is the emulator, pinned as a git submodule. This repository keeps only the page:

- `web/index.html` and `web/style.css`: the page, styled with the Frappe UI Espresso tokens (dark mode).
- `web/icons.js`: the Lucide icons that the page uses, inline so they work offline.
- `web/accent.js`: the color picker in settings. A color sets the synth body and the page accent.
- `web/combobox.js`: the searchable firmware picker, in the style of the Frappe UI Autocomplete.
- `web/update.js`: the update check for the installed app.
- `web/haptics.js`: the haptic taps, through [haptick](https://github.com/jcruzfff/haptick) (MIT),
  bundled from its source in `web/vendor/haptick/` (see `SOURCE.txt`). `web/preferences.js`: the settings that the browser keeps.
- `patches/`: changes to upstream that the build applies, and then removes. `panel-body-color.patch` lets
  the page set the body color of the panel.
- `web/main.js`: a fork of `upstream/web/main.js`, with the touch input and without the upstream page sections.
- `web/touch.js`: the hit test and knob drag for fingers.
- `web/keyboard.js`: the computer keyboard keys for each control, and the key labels over the panel.
- `web/sw.js`, `web/manifest.webmanifest`: the service worker and manifest that make the page an installable app.

```sh
git submodule update --init
./test.sh                      # this repository's tests, and upstream's page tests against web/main.js
./build.sh                     # needs Rust with the wasm32-unknown-unknown target
cd _site && python3 -m http.server 8642
```

To update the emulator, move the submodule to a newer commit. Then compare `upstream/web/main.js` with
`web/main.js`, and copy the changes you want.

## License

MIT, the same as fm1-emu. Each firmware is the work of its author, under its own license. The page
downloads each firmware from the site of its author. Not affiliated with M-VAVE.
