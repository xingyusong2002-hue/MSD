# Implementation Plan — Chromatic Echoes

Eight phases, ordered so each one lands a working improvement on top of the
previous one. Each phase has a clear goal, the files most likely to change,
and acceptance criteria so we can tell when it's done.

Status legend: ✅ done · 🟡 in progress · ⬜ not started.

For the project's intent and learning goals, see
[`PROJECT_BRIEF.md`](PROJECT_BRIEF.md). For risks shaping each phase, see
[`TECHNICAL_RISKS.md`](TECHNICAL_RISKS.md).

---

## Phase 1 — Audit and stabilise the existing demo

**Status:** ✅ done (Steps 0 + parts of "polish" commits on the
`feature/chromatic-echoes-museum-mvp` branch).

**Goal.** Establish a clean baseline: the demo from the initial commit runs
reliably end-to-end, the repo is hygienic, and we know exactly where the
seams are.

**Work.**
- Add a real `package.json` with `npm start`.
- `.gitignore` covering `node_modules/`, OS files, future `sessions/`.
- Untrack the committed `node_modules/`.
- README documenting how to run, the multi-tab testing technique, and the
  three options for mic-permission-over-LAN.
- Capture the file map and the existing-feature locations so further phases
  can refer back to known seams.

**Files involved.** `chromatic-echoes/package.json`,
`chromatic-echoes/.gitignore`, `chromatic-echoes/README.md`,
`chromatic-echoes/node_modules/` (untracked).

**Acceptance.** `git clone ⟶ npm install ⟶ npm start ⟶ host one tab,
join in another` produces a working round end-to-end on a clean machine.

---

## Phase 2 — Phone visitor interface

**Status:** ✅ Phase 2a (museum walkthrough scaffolding) and 2b (typed round
library) shipped (commits `539d4a3`, `c413add`). 2c (mic feedback + back
navigation) shipped in `b0047fd` and `350585d`.

**Goal.** Give each visitor a phone interface they can actually use:
join, see they are heard, follow the host through the walkthrough, and
leave at any time.

**Work.**
- Outer museum stage machine: `waiting-room → threshold → dead-room → archive`.
- Three new walkthrough screens with role-aware copy.
- Typed round library: Solo / Move / Mix / Silent.
- Live microphone level meter on the wait screen (diagnostic + reassurance).
- Back / Leave buttons on every screen so visitors are never trapped.
- WebSocket connection-status indicator + outgoing message queue so a
  click can't silently fail when the WS isn't ready.

**Files involved.** `chromatic-echoes/index.html`, `chromatic-echoes/app.js`,
`chromatic-echoes/style.css`, `chromatic-echoes/server.js`.

**Acceptance.** On a phone, a visitor can: see the mic meter respond to
their voice, see "you are Red", be carried by the host through Waiting →
Threshold → Dead Room, and tap "Leave" at any time to return to Landing.

---

## Phase 3 — Main projection interface

**Status:** 🟡 partially shipped (commit `3362f79` made the Dead Room
visibly alive with labelled source positions, brighter clouds, and the
empty-room hint card).

**Goal.** The shared projection screen reads cleanly across the room:
visitors a few metres away can see who is making sound and where colours
are blending, without needing to look at any phone.

**Remaining work.**
- Tune particle density and cloud opacity for the actual projector's
  brightness (currently tuned for a typical laptop screen).
- Larger type for source labels — current "RED · speak now" is sized for a
  laptop; the projection wants ~3× the size, with subtle drop-shadow for
  legibility on the projector's softer black.
- Visible round timer or progress affordance for Solo / Silent (currently
  no on-screen cue that the round is in progress beyond the instruction
  pill).
- Optional: a quiet, persistent watermark that names the current round
  (already partly served by the instruction pill).

**Files involved.** `chromatic-echoes/app.js` (render loop), `style.css`,
`index.html` (additional HUD elements if needed).

**Acceptance.** Stood 4 m from the projection, an observer can name the
current round, the connected players, who is making sound, and roughly
where in the room each colour is anchored.

---

## Phase 4 — Host control interface

**Status:** 🟡 base controls shipped (commits `c413add`, `b0047fd`); needs
polishing into a dedicated host dashboard layout.

**Goal.** The host operator runs the walkthrough confidently: starts /
ends rounds, switches mode, sees who is connected and who is silent, and
recovers gracefully from any stuck state.

**Work shipped.**
- Stage toolbar to jump between Waiting / Threshold / Dead Room / Archive.
- Lobby with Live Mix / Fill Mode selector.
- `End round` for non-mix kinds, `Back to lobby` for resetting mid-round,
  `Exit to start` for fully resetting the session.
- Empty-room hint when a round is playing with no players connected.

**Remaining work.**
- Consolidated host dashboard view (single layout combining round list,
  connected-players panel, mode selector, and the "what's next" preview).
- Visual feedback for silent rounds — the host needs to *know* when to
  click `End round`. A simple "duration so far" counter is enough.
- One-button **Skip / Repeat** for the current round.
- "Are you sure?" guard on destructive controls (Exit, Restart) so a host
  doesn't accidentally cancel mid-experience.

**Files involved.** Same four web files. No new server-side primitives
needed beyond the existing `set_stage`, `start_round`, `end_round`,
`next_round`, `back_to_lobby`, `restart` messages.

**Acceptance.** A host who's never seen the system before can run a
complete walkthrough from a quick demo + the on-screen prompts, without
needing a written cheat-sheet.

---

## Phase 5 — Manual zone positioning

**Status:** ⬜ not started.

**Goal.** Each visitor's colour source on the projection moves to match
where they physically are in the Dead Room, so Move Echo and Mix Echo
feel directional. **No GPS** — visitors tap a zone on their phone.

**Work.**
- New per-player field `zone: 'A' | 'B' | 'C' | 'Center'` on the server
  state, default `Center`.
- Four big tap buttons on the player's wait screen (and a smaller version
  inside the game HUD so they can move mid-round).
- Broadcast zones to all clients in the state message.
- Replace the hard-coded `sourcePositions` in `computePositions()` in
  `app.js` with a function of `(zone, screenSize)` — e.g. Zone A → top-left
  quadrant centre, Zone B → top-right, etc.
- Smooth interpolation when a player changes zones so the colour drifts
  rather than teleports (200–400 ms ease).

**Files involved.** `chromatic-echoes/server.js`, `app.js`, `index.html`,
`style.css`.

**Acceptance.** With three phones in three corners of the chamber tapping
A/B/C respectively, the three colour anchors on the projection visibly
sit in the three corresponding quadrants and follow when a phone changes
zone.

---

## Phase 6 — Haptic feedback abstraction

**Status:** ⬜ not started.

**Goal.** Each visitor's phone vibrates in time with key moments — a
match-progress pulse, a round-end confirm, a "your voice is loud right
now" tick. Implemented as an **abstraction** so an ESP32 wristband can
later subscribe to the same events.

**Work.**
- Single `Haptics.pulse({pattern, role})` API on the client, internally
  routed through `navigator.vibrate` where supported, no-op otherwise.
- Feature-detect once at startup; cache the result; never call again
  on unsupported browsers.
- Subscribe to a small list of event types: `volume-loud`,
  `match-progress`, `round-end`, `success`.
- Vibration patterns tuned to be perceptible without being annoying —
  short bursts (40–120 ms) rather than long buzzes.
- Server emits a separate `haptic` message type alongside `frame` so the
  same events can later drive ESP32 hardware over a different transport.

**Files involved.** New `chromatic-echoes/haptics.js` (or inline section
of `app.js`), `server.js` (haptic event emission), `app.js` (subscriber).

**Acceptance.** On a phone that supports vibration, a visitor feels a
short pulse on match progress in Mix Echo and on round-end. On a phone
that doesn't (or with vibration disabled in OS settings), the experience
is identical except for the missing pulse — no errors, no warnings.

---

## Phase 7 — Archive / reflection screen

**Status:** ⬜ scaffolded only (the screen exists with placeholder copy
since Step 1, commit `539d4a3`).

**Goal.** A quiet exit moment: a low-fidelity visual summary of the
group's voices through the walkthrough, plus one reflective prompt.
*Not* a leaderboard. *Not* persistent. Designed to be looked at for ten
seconds and then walked away from.

**Work.**
- Server keeps a small in-memory ring buffer of `(t, role, volume)`
  samples for the session — bounded size (a few thousand entries).
- On `set_stage: archive`, server snapshots the buffer to the broadcast.
- Client renders an SVG sparkline / area chart: four channels (R, G, B
  + their mix), normalised time on the x-axis.
- Reflection prompt cycles through 3–5 written prompts (random pick per
  session) so repeat visitors get a different question.
- Optional "save image" button — downloads the SVG so the visitor can
  share the trace if they want. No server-side persistence.

**Files involved.** `chromatic-echoes/server.js` (ring buffer + snapshot),
`app.js` (SVG render on Archive screen), `style.css`, `index.html`.

**Acceptance.** After running a full walkthrough, the Archive screen
shows a sparkline that visibly reflects who was loud when, plus a
prompt the visitor reads silently for ~10 seconds before leaving.

---

## Phase 8 — Optional future: ESP32 wristbands

**Status:** ⬜ deferred — *interface stub only* in MVP.

**Goal.** Add interactive wristbands without disturbing any of the
existing code paths. Phones remain the primary input device; wristbands
add a tactile / luminous layer for visitors who choose to wear one.

**Work (when prioritised).**
- Add a single `chromatic-echoes/wristbandAdapter.js` on the server:
  no-op functions `onLightCommand(role, color)`, `onHapticCommand(role,
  pattern)`, plus a transport-agnostic event subscriber. In MVP these
  log to console and do nothing else.
- Game code calls the adapter at the same points it emits client haptic
  messages; the adapter is the single integration seam for future
  hardware.
- Later: a separate ESP32 firmware project subscribes to the adapter
  (via MQTT, WebSocket, or BLE — to be decided when the hardware
  prototype is in hand).

**Files involved.** `chromatic-echoes/wristbandAdapter.js` (new),
`chromatic-echoes/server.js` (call sites).

**Acceptance.** A hardware engineer can implement the wristband-side
firmware without touching any of the game / web code beyond the
adapter file.

---

## Cross-phase rules

- Each phase MUST keep the working demo behaviour from earlier phases intact.
- Each phase lands in **multiple small commits** under one feature branch.
  Avoid mega-commits.
- After every phase: confirm the smoke test (`npm start` → host → join →
  full walkthrough) still passes on a fresh checkout.
- A phase is "done" only when its acceptance criteria pass *in the actual
  chamber on a projector*, not just on a laptop. Plan a venue test before
  marking 3, 4, or 5 done.
