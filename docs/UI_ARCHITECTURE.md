# UI Architecture — Chromatic Echoes MVP

Four interfaces, one codebase. This doc proposes the *exact* shape of the
visitor / projection / host / archive UIs and the data model that ties them
together, so implementation can proceed without re-deriving these decisions
in every commit.

For project intent see [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md), for the
8-phase roadmap see [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

---

## 0. Audit of the existing app

What's already in [`chromatic-echoes/`](../chromatic-echoes/) vs what the new
spec requires. Status: ✅ done · 🟡 partial · ❌ missing.

### A. Visitor phone
| Spec item | Status | Notes |
|---|---|---|
| Join session | ✅ | "Join Game" on Landing |
| Enter name | ❌ | New |
| Colour pick R / G / B | ✅ | screenRoles |
| Colour: **Purple** | ❌ | New |
| Sound role (Voice / Hum / Clap / Whisper / Micro-sound) | ❌ | New |
| Mic permission | ✅ | `getUserMedia` |
| Live volume meter | ✅ | Added in commit `b0047fd` (mic-meter pill) |
| Manual zone (A / B / C / Center) | ❌ | New — replaces hard-coded colour-corner |
| Current round instruction | ✅ | `.round-instruction` strip |
| Haptics on/off toggle | ❌ | Out of scope this step (Phase 6 in IMPLEMENTATION_PLAN) |
| Vibration-support indicator | ❌ | Out of scope |
| Fallback if unsupported | ❌ | Out of scope |

### B. Main projection
| Spec item | Status | Notes |
|---|---|---|
| Dark museum style | ✅ | OKLCH tokens, DESIGN.md |
| 2D map of Dead Room | 🟡 | Currently three fixed corners; needs a visible quadrant map |
| Coloured player dots | ✅ | Labelled source clouds since `3362f79` |
| Particles from player position | ✅ | Particle pools per colour |
| Particle size/brightness ↔ loudness | ✅ | `vol` drives both |
| Particle amount/trail ↔ duration | 🟡 | Decay handles this; can tune |
| Rhythm/onset ↔ pulse/flicker | ❌ | Out of scope this step |
| Drift to centre | ✅ | Particles aim at `mixCenter` |
| Centre mixing area | ✅ | `mixingBox` + glow |
| Target colour challenge | ✅ | `targetDisplay` |
| Live contribution % per player | 🟡 | Player-bar widths show local volume; no normalised "share of mix" panel |
| Round timer | ❌ | Out of scope this step |
| Current round name | ✅ | `roundKindTag` + instruction |

### C. Host control
Phase 4 in the roadmap. This step only adds the data model + minimal
controls; full host dashboard comes later. Already shipped: start round,
end round, next round, back to lobby, set stage, set mode, restart.

### D. Archive
Phase 7. Screen exists with placeholder copy. Final colour + dominant
player + screenshot export are deferred.

---

## 1. Route / page structure

The app is a single page with screens (no real routing — `showScreen()`
toggles `.active` on `<div class="screen">` blocks). Same `index.html` is
served to every client; role decides which screens activate.

### Visitor phone flow
```
Landing
   │ click "Join Game"
   ▼
Player Setup   ← NEW
   │  • name input (optional, blank = "Player <colour>")
   │  • sound-role buttons (Voice / Hum / Clap / Whisper / Micro-sound)
   │  click "Continue"
   ▼
Choose Colour (Roles)
   │  • Red / Green / Blue / Purple
   │  click → triggers initAudio() + mic permission
   ▼
Player Wait
   │  • "You are <colour>"
   │  • live mic meter (already shipped)
   │  • zone picker (NEW): A / B / C / Center
   │  • waiting-for-host message
   │  follows host
   ▼
Dead Room HUD (compact for player)
   │  • current round instruction
   │  • own contribution %
   │  • zone re-picker (small, top of screen)
   │  • leave button
   ▼
Archive (group reflection)
```

### Projection / host flow
```
Landing → click "Start as Host"
   ▼
Waiting Room  (host briefing screen, advances stages)
   ▼
Threshold
   ▼
Dead Room
   │  • 2D map of Dead Room (NEW)
   │  • player dots at their zone (NEW: derived from each player's zone)
   │  • particles drift to centre
   │  • central mixing area + target swatch
   │  • per-player contribution %  (NEW)
   │  • host controls overlay (start / end / next / back-to-lobby / exit)
   │  • stage toolbar
   ▼
Archive
```

---

## 2. Components / modules

The codebase is plain JS — there are no "components" in a framework sense.
This list maps each conceptual component to its concrete DOM id +
JS function or block.

### Visitor screens (in `index.html`, controlled by `app.js`)
- `screenLanding` — entry, Start as Host / Join Game.
- `screenPlayerSetup` *(NEW)* — name field + sound-role buttons + Continue.
- `screenRoles` — colour picker (R / G / B / **P**).
- `screenPlayerWait` — confirmed colour + mic meter + zone picker.
- `gameHud` *(visitor compact view)* — instruction strip, own bar, zone re-picker.

### Projection elements (overlaid on `gameHud`)
- `gameHud[data-kind="…"]` — root container, switches per-kind visibility.
- `deadRoomMap` *(NEW)* — full-screen SVG/CSS quadrant overlay showing
  Zone A / B / C / Center labels and faint dividing lines.
- per-player `playerDot` — anchored to source position (driven by zone).
- `mixingBox` — centre area (existing).
- `targetDisplay` — top-centre target swatch (existing, Mix Echo only).
- `contributionPanel` *(NEW)* — per-player share of mix as a normalised %.
- `roundInstruction` — instruction pill (existing).
- `stageToolbar` — host-only stage nav (existing).

### Host overlays
- `hostHudControls` — existing buttons (Start / End / Next / Back / Exit).
- *(Phase 4)* Override panel, threshold sliders, archive export.

### Archive
- `archiveTracePlaceholder` *(turns into a real visualisation in Phase 7)*.
- `reflectionPrompt`.
- Save-as-image (Phase 7).

---

## 3. Data model

### Server-side `game` object

```js
{
  experienceStage: 'waiting-room' | 'threshold' | 'dead-room' | 'archive',
  phase: 'lobby' | 'playing' | 'success',     // inner cycle inside dead-room
  mode: 'live' | 'accumulate',
  host: WebSocket | null,

  // Per-role state. Same flat shape it has today, plus 'purple'.
  players: { red, green, blue, purple: WebSocket | null },
  names:   { red, green, blue, purple: string },         // NEW
  roles:   { red, green, blue, purple: SoundRole },      // NEW — see below
  zones:   { red, green, blue, purple: Zone },           // NEW
  volumes: { red, green, blue, purple: number 0–1 },
  accumulated: { red, green, blue, purple: number },

  matchTimer: number,
  roundIndex: number,
  rounds: Round[]
}
```

### Type vocabulary

```ts
type Role       = 'red' | 'green' | 'blue' | 'purple';
type SoundRole  = 'voice' | 'hum' | 'clap' | 'whisper' | 'micro-sound';
type Zone       = 'A' | 'B' | 'C' | 'Center';
type RoundKind  = 'solo' | 'move' | 'mix' | 'silent';
```

### Player descriptor sent to clients

```js
{
  role: Role,
  name: string,                     // empty allowed; UI falls back to "<colour> player"
  soundRole: SoundRole | null,
  zone: Zone,                       // default 'Center'
  volume: number,                   // 0–1, current
  connected: boolean
}
```

### Sound event (`frame` broadcast)

```js
{
  type: 'frame',
  kind: RoundKind,
  mode: 'live' | 'accumulate',
  volumes:     { red, green, blue, purple: number },
  accumulated: { red, green, blue, purple: number },
  currentMix:  { r, g, b, total },  // RGB only — Purple contributes 0.5R + 0.5B
  matchTimer:  number,
  matchRequired: number
}
```

### Round state (already typed since `c413add`)

```js
{
  id: string,            // 'solo-1', 'mix-1', ...
  kind: RoundKind,
  title: string,
  instruction: string,
  target?: { name, r, g, b }    // only for kind === 'mix'
}
```

### Haptic event (Phase 6 — *defined here, not implemented yet*)

```js
{
  type: 'haptic',
  pattern: 'pulse' | 'success' | 'match-progress',
  role: Role,                       // who should feel it
  intensity?: number 0–1            // hint to duration / strength
}
```

### Archive record (Phase 7 — defined now for forward compatibility)

```js
{
  sessionStart: number,            // ms timestamp
  samples: [{ t, role, volume }],  // ring buffer, ~10 Hz, bounded length
  rounds:  [{ roundId, durationMs, success: boolean }],
  finalMix: { r, g, b, p },
  dominantRole: Role,
  quietestT: number,               // sample t with lowest total volume
  mostBalancedT: number            // t closest to currentMix == target (mix rounds only)
}
```

### Purple's contribution to the mix

Purple is treated as a "blender" channel — it never changes the target
challenge (targets stay RGB), but it contributes to the centre's mix
equally to R and B:

```js
// On the server:
rv = volumes.red    + 0.5 * volumes.purple;
gv = volumes.green;
bv = volumes.blue   + 0.5 * volumes.purple;
// then mix = normalised(rv, gv, bv) as before
```

This means a Purple player whose voice is louder boosts both the warm
(R) and cool (B) ends, helping the group reach reddish-blue targets
faster while having no direct effect on greens.

### Zone → screen-position mapping

Pure function from `(zone, screenSize)` → `(x, y)`:

```js
function getZonePosition(zone, w, h) {
  const m = Math.min(w, h) * 0.20;
  switch (zone) {
    case 'A':       return { x: m,         y: m         };   // top-left
    case 'B':       return { x: w - m,     y: m         };   // top-right
    case 'C':       return { x: w / 2,     y: h - m     };   // bottom-centre
    case 'Center':
    default:        return { x: w / 2,     y: h / 2     };
  }
}
```

Source positions on every client are recomputed from
`zones[role]` whenever the state broadcast arrives. No GPS, no IMU, no
camera — just visitor-declared position.

---

## 4. Files likely to change

| File | What changes |
|---|---|
| `chromatic-echoes/server.js` | Add Purple to every R/G/B map; add `names`, `roles`, `zones`; new message handlers `set_meta`, `set_zone`; update `computeLiveMix` / `computeAccumulatedMix` to include Purple's 0.5/0.5 contribution; broadcast the new fields. |
| `chromatic-echoes/app.js` | Add Purple to `COLORS` / `particlePools` / source rendering; new state `myZone`, `myName`, `mySoundRole`; new screen wiring for `screenPlayerSetup`; zone picker logic; recompute `sourcePositions` from broadcast zones; new contribution-panel render. |
| `chromatic-echoes/index.html` | Add `screenPlayerSetup` with name + sound-role inputs; add Purple role card; add zone picker block on `screenPlayerWait` and a smaller one inside `gameHud`; add `deadRoomMap` quadrant overlay; add `contributionPanel`. |
| `chromatic-echoes/style.css` | Tokens / layout for Purple, zone picker, 2D map, contribution panel; minimal, additive — append blocks per `DESIGN.md` workflow rule. |
| `chromatic-echoes/DESIGN.md` | Document the zone-picker pattern + the 2D-map pattern + the contribution-panel pattern. |

---

## 5. Assumptions to verify in existing code

These are claims this design depends on. Each is *checked* (✓) below
against current `chromatic-echoes/` source.

1. **Particle pools are keyed by colour** (so adding `'purple'` means
   adding one pool). ✓ — `particlePools = { red: [], green: [], blue: [] }`
   in `app.js`.
2. **`computePositions()` maps role → screen position.** ✓ — refactor target
   is one function in `app.js`. The whole render loop already reads from
   `sourcePositions[color]`, so swapping in zone-driven positions is a
   single-source-of-truth change.
3. **`computeLiveMix` / `computeAccumulatedMix` sum RGB volumes.** ✓ —
   `server.js` lines ~74–101; Purple's 0.5/0.5 split slots in cleanly.
4. **Match-check (`checkMatch`) reads `currentMix.r/g/b`.** ✓ — RGB-only
   targets are preserved.
5. **State broadcast has `volumes.red/green/blue`.** ✓ — needs `purple`
   added in three places (broadcast + initial-state + frame).
6. **Existing R/G/B-only helpers (`getAvailableRoles`,
   `getConnectedPlayers`) iterate a hard-coded array.** ✓ — small
   refactor: declare `const ROLES = ['red','green','blue','purple']`
   once and iterate over it.
7. **No existing storage of name / sound-role / zone.** ✓ — clean
   greenfield on the data model side.
8. **Match-progress timer assumes mix kinds only.** ✓ — already gated
   on `kind === 'mix'` since `c413add`.
9. **No assumption that exactly three particle pools exist outside
   `app.js` render loop.** ✓ — server doesn't render particles.

No surprises. The largest refactor is to `app.js`'s render loop, which
should become: *for each connected role, look up that role's zone, derive
position, draw source + particles*. Reads as natural prose.
