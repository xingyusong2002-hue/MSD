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
    drop-shadow(0 0 24px oklch(96% 0.01 60 / 0.28))     /* tight halo */
    drop-shadow(0 0 64px oklch(96% 0.01 60 / 0.14))     /* wide halo */
    drop-shadow(0 6px 20px oklch(0% 0 0 / 0.55));        /* depth */
animation: titleBreathe 6s ease-in-out infinite;
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
