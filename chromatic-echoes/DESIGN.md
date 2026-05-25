# Chromatic Echoes — Design Guide

This document captures the *style choices* that should be applied to every new
screen, control, and content addition in this project. It is the source of
truth for typography, colour, and visual tone — favour these tokens and patterns
over inventing new ones.

It is also the prompt-style guidance I (Claude / future contributors) should
consult before adding new UI. If a new requirement clashes with anything here,
update *this file first*, then change the code.

---

## 1. Tone

The experience is a museum walkthrough into an anechoic chamber. The feel
should be **quiet, contemplative, slightly austere** — visitors are about to
listen to silence. The interface gets out of the way; the room and the players
are the colour.

- The **entrance screens** (Landing, Waiting Room, Threshold, Archive) are
  *posters* — sparse, generous whitespace, one clear action.
- The **Dead Room HUD** is where colour and motion belong. There, particles
  and player bars do most of the talking; the chrome stays minimal.
- Avoid: rainbow gradients on titles, decorative emoji, bouncy animations,
  competing colour fills. We did this in early iterations; it read as a party
  app, not a museum.

---

## 2. Typography

Three families, loaded from Google Fonts in `index.html`. **Do not add a
fourth without a strong reason — every new family is a network cost and a
visual inconsistency.**

| Family                | CSS variable      | Used for |
|-----------------------|-------------------|----------|
| **Plus Jakarta Sans** | `--font-body`     | Body copy, UI controls, buttons, captions. Default for everything not specified. |
| **Space Grotesk**     | `--font-display`  | Titles, screen headers, stage tags. Distinct character at large sizes. |
| **Newsreader** italic | `--font-italic`   | Reflective/quote moments only — e.g. the reflection prompt on the Archive screen. Italic-only. |

### Type scale

| Element                | Family   | Weight | Size | Tracking |
|------------------------|----------|--------|------|----------|
| `.title` (Landing)     | display  | 300    | `clamp(2.4rem, 6.5vw, 4.6rem)` | `0.18em` |
| `.screen-title`        | display  | 300    | `clamp(1.6rem, 4.5vw, 2.6rem)` | `0.08em` |
| `.subtitle`            | body     | 300    | `1.05rem` | `0.04em` |
| `.walkthrough-body p`  | body     | 300    | `1rem`    | normal   |
| `.hint` / captions     | body     | 300    | `0.85rem` | `0.05em` |
| `.stage-tag` / kind tag| body     | 500    | `0.7rem`  | `0.18em uppercase` |
| `.reflection em`       | italic   | 400    | `1.1rem`  | normal   |

Rules:
- Headlines use **weight 300**. Heavier weights look shouty against the dark
  background and lose the museum-poster feel.
- Body copy uses **weight 300–400**, lighter than typical web text.
- Tracking (`letter-spacing`) on uppercase elements is at least `0.15em`.
- All-caps is reserved for very short labels (`STAGE 1 / 4`, `SOLO ECHO`).
- Avoid mixing colour and weight on the same element — pick one axis to vary.

---

## 3. Colour — OKLCH

We use the **OKLCH** colour space for everything new. OKLCH is perceptually
uniform: equal `L` values look equally bright across all hues, so design
tokens like "surface" and "surface-hover" can be one variable derived from
another. Modern browsers (Chrome 111+, Firefox 113+, Safari 15.4+, all 2022+)
support `oklch()` natively.

### Tokens

| Variable          | Value                            | Meaning |
|-------------------|----------------------------------|---------|
| `--c-bg`          | `oklch(11% 0.012 60)`            | Deep warm near-black — the page base. |
| `--c-surface`     | `oklch(100% 0 0 / 0.04)`         | Faint translucent glass; default card/pill background. |
| `--c-surface-h`   | `oklch(100% 0 0 / 0.08)`         | Hover state for the above. |
| `--c-text`        | `oklch(96% 0.01 60)`             | Warm off-white. Primary text. |
| `--c-text-dim`    | `oklch(82% 0.012 60)`            | Subdued captions and emphasis. Solid alpha — stays legible over photo backgrounds. |
| `--c-text-soft`   | `oklch(70% 0.012 60 / 0.85)`     | Very quiet hint text (e.g. `.hint` under buttons). |
| `--c-border`      | `oklch(100% 0 0 / 0.08)`         | Pill/card outlines. |
| `--c-red`         | `oklch(65% 0.22 25)`             | Player Red. Use only for player identity. |
| `--c-green`       | `oklch(85% 0.20 155)`            | Player Green. Same rule. |
| `--c-blue`        | `oklch(65% 0.18 250)`            | Player Blue. Same rule. |
| `--glass-bg`      | `oklch(8% 0.005 60 / 0.7)`       | Background for the "glass pill" pattern. |
| `--glass-border`  | `oklch(100% 0 0 / 0.06)`         | Border for glass pills. |

### Rules

- **New colours**: write them as `oklch(L C H)` (or `oklch(L C H / alpha)`).
  Don't introduce hex or hsl values without a reason — list them as new
  tokens here.
- **Player identity** colours (`--c-red/green/blue`) are reserved for actual
  player UI (lobby slots, source positions, volume bars). They should not
  appear on entrance screens.
- **Adjusting brightness**: change only `L`. Don't compensate by also
  shifting `C` or `H` — that's what OKLCH frees you from.
- **Translucency**: use `/ alpha` syntax — `oklch(100% 0 0 / 0.08)`.
- **Canvas exception**: the particle render code in `app.js` (`drawSourceCloud`,
  `Particle.draw`) writes `rgba(...)` strings directly. Canvas 2D `fillStyle`
  does not yet take `oklch()` in all browsers, so leave those rgb constants
  alone for now. CSS is the only OKLCH zone.

---

## 4. Patterns

### Glass pill
Used for: `.stage-tag`, `.round-instruction`, `.stage-toolbar`, `.round-kind-tag`.

```css
background: var(--glass-bg);
border: 1px solid var(--glass-border);
backdrop-filter: var(--glass-blur);
border-radius: 999px;
```

Pair with quiet text and a short, single-line message. Glass pills sit *over*
content; they should never be the primary action.

### Screen layout
- One `<div class="screen">` per museum stage. Use `class="screen active"`
  on the visible one; the routing in `app.js` toggles this.
- Inside, one `<div class="screen-content">` (max-width 640px, centred).
- Order: optional `.stage-tag` → `.screen-title` → `.subtitle` →
  `.walkthrough-body` (body copy) → host controls → `.hint`.
- Big background photos use the layered `background:` stack —
  overlay-gradient + `url(...)` + fallback colour, in that order. See
  `#screenLanding` / `#screenWaitingRoom` for the canonical example.

### Photo-backed screens and their images

Four menu screens and the live playground use Dead Room photographs:

| Element | Image (in `assets/`) | Use |
|---|---|---|
| `#screenLanding` | `DeadRoom-63.png` | The entrance/landing. |
| `#screenWaitingRoom` | `DeadRoom-63.png` | Visual continuity with Landing — same photo. |
| `#screenThreshold` | `stage2.png` | The doorway photo — visitors are about to step inside. |
| `#screenRoles` | `player.png` | The chamber-with-people photo — players are choosing what they'll be in that room. |
| `#playgroundFloor` | `Top view of the deadroom.png` | The live playground itself — the top-down anechoic-chamber photo on which all particles/ripples render. **Replaces the previously painted foam-wedge boundary**; the photo's own wooden wedges are now the visible frame. |

The playground floor uses a different recipe to the menu screens because
it sits *under* the live canvas, not behind static UI:

- Sized to match `getMapBounds()` in `app.js` via `calc(min(78vw, 78vh)
  * ROOM_ASPECT)` where `ROOM_ASPECT = 1.0784` (1073/995, the photo's
  intrinsic aspect). Keep CSS + JS in sync if you swap the photo.
- `background-size: contain` (not `cover`) so the photo's wedge frame
  aligns exactly with the canvas clip rectangle.
- Visibility is gated by a `body.in-playground` class set in `app.js`
  when `experienceStage === 'dead-room'` AND `phase === 'playing'`.
  Default opacity is **0**; only when the class is present does the
  photo fade in to `var(--playground-opacity)`. This prevents the
  photo from flashing through during landing → lobby → playing
  transitions — a real problem before the refinement pass.
- A soft radial `mask-image` fades the photo's corners to transparent,
  so the rectangular box doesn't read as "pasted in".
- A warm-brown `box-shadow` halo replaces the previously-painted foam
  frame, preserving the "defined exhibit zone" feel without competing
  with the photo's own wooden wedges.
- The canvas above runs trail-fade in `globalCompositeOperation =
  'destination-out'` mode, ERASING pixels rather than painting dark
  over them. This is what lets the photo stay visible through the
  particle layer; the older "fill semi-transparent dark each frame"
  approach would have buried the photo within ~1 second.
- The procedural foam-wedge boundary (`drawAcousticFoamBoundary` in
  `app.js`) is gated behind `DRAW_PAINTED_FOAM_BOUNDARY` (default
  `false`) — the photo's wedges + CSS halo replace it. Flip the flag
  true if you ever swap back to a photo-less playground.

### Three-layer integration (refinement pass v2)

The playground is no longer a single background-image rule. It's split
into three CSS layers tuned independently:

```
#playgroundFloor          ← container: geometry, mask, halo, fade-in gate
  ├─ ::before             ← the photo + filter(brightness/contrast/saturate)
  └─ ::after              ← warm tint + inset radial vignette (edge dissolve)
```

Why split: a single rule's `filter` would also filter the box-shadow halo
and mask, which we explicitly need *unfiltered*. The pseudo-elements
keep the filter scoped to the photo only. The mask on the container
masks both pseudos together as one unit, so the edge dissolve stays
visually consistent.

### Tuning knobs (CSS custom properties on `:root`)

The refinement pass exposes nine `--playground-*` variables so feel can
be tuned without touching rule bodies:

| Variable | Default | What it controls |
|---|---|---|
| `--playground-opacity` | `0.62` | Final container opacity when visible. Brief asked for 0.45-0.70. |
| `--playground-fade-in` | `0.9s` | How long the photo takes to appear after entering Dead Room. |
| `--playground-mask-soft` | `0.66` | Inner radius of the corner-fade mask (0..1). Higher = harder edges. |
| `--playground-halo-rgba` | `95, 70, 42` | RGB of the warm box-shadow halo. |
| `--playground-photo-brightness` | `0.55` | CSS filter on the photo. Lower = darker. |
| `--playground-photo-contrast`   | `0.85` | CSS filter on the photo. Lower = softer mid-tones. |
| `--playground-photo-saturate`   | `0.82` | CSS filter on the photo. Lower = less colour competition with sound dots. |
| `--playground-tint-rgba` | `28, 14, 8` | Warm tint RGB applied on top of the filtered photo. |
| `--playground-tint-alpha` | `0.32` | Warm tint opacity. |
| `--playground-edge-vignette` | `0.55` | Alpha of the inset corner vignette in ::after. |

### Painted foam boundary (v3: ring-clear + atmospheric halo)

The refinement pass v3 restructured the painted boundary because v2's
strokes accumulated to saturation (drawn outside the canvas clip, no
trail-fade reached them — they piled up and read as a static thick
line). The fix has three parts:

1. **Per-frame ring-clear.** Before drawing the new boundary, an
   even-odd-filled `destination-out` operation erases the previous
   frame's pixels in the *ring* between the room path and the room
   bounding box + buffer. In-room pixels (particles, trail-fade
   content) are untouched because the even-odd rule subtracts them.
2. **Multi-layer atmospheric halo.** Four progressively wider, fainter
   strokes ring the room, each breathing with a slightly different
   phase. This is what makes the boundary read as "atmosphere" instead
   of "stroke". Phases (0, 0.7, 1.4, 2.1) aren't multiples of 2π so
   layers shimmer subtly out of sync.
3. **Inner strokes drawn over the halo.** Outer dark warm + thin beige
   inner strokes give crisp definition without the halo dominating.

Config object `PAINTED_FOAM_BOUNDARY_OPTS` (v3 values):

```js
enabled: true, drawStrokes: true, drawBumps: false,
alphaMul: 1.0,                  // was 0.55
breathBase: 0.32, breathAmp: 0.14,  // was 0.18 / 0.08
breathFreq: 0.5,
haloEnabled: true, haloLayers: 4,
haloBaseWidth: 10, haloWidthStep: 8,
haloMaxAlpha: 0.42, haloPhaseStep: 0.7,
haloRGB: '140, 92, 50',
ringClearBuffer: 60,            // px of ring cleared each frame
```

`drawBumps: false` is important — the bezier bumps would double-up
with the photo's own bumps.

### Ambient brown background (`#ambientBackground`, v3)

Replaces the previously-flat `var(--color-bg)` feel with a clearly-
visible warm-brown atmospheric layer — visible everywhere the body
shows through (border around the playground, behind partially-
transparent menus). v3 changes from v2:

- Base lifted from `oklch(14% 0.024 50)` → `oklch(19% 0.034 45)`
  (≈ #2a140d). The 14% level was perceptually too close to black at
  projection distance; 19-21% crosses the threshold where the eye
  registers warm brown rather than near-black.
- Now **four** radial gradients (was three): two corner blobs, one
  wide off-centre bronze accent, one large central halo. All use
  higher chroma (0.04-0.05 vs previous 0.024-0.04) so the brown
  reads as brown.
- `ambientDrift` animation amplitude doubled (was 4-8%, now 6-12%
  position swing) so motion is genuinely perceivable.
- `ambientBreath` opacity range widened 0.94..1.00 → 0.90..1.00 for
  a more noticeable inhale.

Animations run at 28s (drift) + 22s (breath) — non-aligning periods
so the visual cycle never repeats. GPU-composited, zero JS cost.
`z-index: -1` keeps it behind everything.

All four share the same vignette recipe:
```css
background:
    radial-gradient(ellipse 80% 70% at center,
        oklch(6% 0.005 60 / ~0.5) 0%,   /* centre — photo most visible */
        oklch(4% 0.005 60 / ~0.85) 50%,
        oklch(2% 0.003 60 / 1) 92%),     /* edges — fully black */
    url('assets/<file>.png') center/cover no-repeat,
    oklch(20% 0.025 60);                 /* fallback */
```
The ellipse is intentionally *tight* (80% × 70%) and the gradient is *steep*
— centre opacity ~0.5, edges ~1.0. This produces a theatrical-spotlight feel
and consistently dark corners that anchor any UI placed there (back button,
toolbar). Per-screen overlay opacity is tuned ±5% to suit the photo's
brightness.

### Title hierarchy

There are two distinct title patterns. Don't reuse Landing's `.title` style
on inner screens — it dilutes the entrance moment.

| Where | Selector | Font | Treatment |
|---|---|---|---|
| **Landing** (poster) | `.title` | Space Grotesk, uppercase, weight 300, 0.2em tracking | Tri-stop vertical gradient (cool→warm), four-layer drop-shadow halo, **breathing animation** (7s cycle). The biggest type in the project. |
| **Inner stages** (chapters) | `#screenThreshold .screen-title`, `#screenRoles .screen-title` | **Newsreader italic**, weight 400, normal case | Solid `--c-text` colour, three-layer drop-shadow halo, *no* breathing. Smaller scale than Landing. |
| **Other stages** | `.screen-title` (default) | Space Grotesk, weight 300 | No glow filter — these screens (Waiting Room, Archive) have a `.stage-tag` glass pill above them that already provides the "we're inside a numbered moment" framing. |

The Newsreader italic on Threshold/Roles serves as an **editorial voice** —
the entrance is a poster (sans, all-caps, dramatic), the inner chapters are a
journal (serif, italic, lower-case). This is why we don't add a 4th font
family: the italic variant of an already-loaded family carries enough
distinct character.

### Title (Landing) — looming glow
Used for the giant `CHROMATIC ECHOES` headline only.

```css
background: linear-gradient(180deg,
    oklch(99% 0.012 240),    /* cool top */
    oklch(95% 0.008 100),    /* neutral middle */
    oklch(82% 0.018 60));    /* warm bottom */
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
filter:
    drop-shadow(0 0  30px oklch(96% 0.01 60 / 0.42))   /* tight halo */
    drop-shadow(0 0  90px oklch(96% 0.01 60 / 0.26))   /* mid halo */
    drop-shadow(0 0 180px oklch(96% 0.01 60 / 0.12))   /* ultra-wide halo */
    drop-shadow(0 8px 26px oklch(0% 0 0 / 0.65));      /* depth */
animation: titleBreathe 7s ease-in-out infinite;       /* swells to ~+30% at 50% */
```

Notes:
- Use `filter: drop-shadow(...)` *not* `text-shadow`. The text is filled by a
  background-clipped gradient, and `text-shadow` does not draw under
  transparent fills.
- The three drop-shadows are layered intentionally: two outer luminance halos
  (one tight, one wide — together they read as "emerging from darkness") plus
  one black depth shadow underneath.
- `titleBreathe` is a slow ±4% glow oscillation. Subliminal, not animated UI.

### Text over photo backgrounds
Photo screens (`#screenLanding`, `#screenWaitingRoom`) need three legibility
tricks together — none works alone:

1. **Stronger overlay.** The radial gradient runs from ~70% opacity at the
   centre to ~96% at the edges. Centre-heavy because that's where the title
   and body sit.
2. **Solid (no-alpha) text colour.** `--c-text-dim` is solid `oklch(82%)` on
   these screens, not the translucent base. Translucent text over a busy photo
   loses local contrast on bright foam tips.
3. **Per-glyph dark halo.** Body, subtitle, hint, stage tag, italics, and
   strong all carry `text-shadow: 0 1px 2px oklch(0% 0 0 / 0.7), 0 0 12px
   oklch(0% 0 0 / 0.45)`. This re-darkens the photo locally beneath each
   glyph so every letter is readable regardless of what's behind it.

These rules are appended near the photo-background block in `style.css` and
selectively applied via `#screenLanding`/`#screenWaitingRoom` prefixes so
text elsewhere stays clean.

### Back navigation
- Any screen that visitors might want to leave should carry a
  `.screen-back` button (`btn btn-ghost`), top-left, "← Back to start".
- "Back" semantics: drop role, close WS, return to Landing. The server's
  `on('close')` handler cleans up game state.
- Do **not** add back buttons inside the gameplay HUD — round flow is host-
  driven there.

### Host controls vs player view
- Same DOM. Visibility is toggled by `myRole === 'host'` (see
  `toggleHostStageControls()` in `app.js`).
- Hints (`#waitingHint`, `#thresholdHint`, `#archiveHint`) are also
  role-aware — set them in `toggleHostStageControls()` rather than
  hard-coding role-specific text in the markup.

---

## 5. Workflow

When proposing a UI change, in order:

1. **Read this file.** If the change is well-described by an existing
   pattern, use it verbatim.
2. **Identify the tokens.** Always use `--c-*` and `--font-*` variables
   rather than literal values.
3. **Append CSS at the bottom** of `style.css` in a labelled block —
   easier to review, easier to revert. Don't restructure the cascade.
4. **No new dependencies** without an explicit ask. We have one runtime
   dep (`ws`) and three Google Font families. Keep it that way.
5. **Test on the Landing screen first** — it's the largest type, the most
   exposed image, and the cleanest reduction of the visual system. If it
   looks wrong there, it'll look wrong everywhere.
