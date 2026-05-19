# CLAUDE.md — guidance for Claude Code on this repo

Concise operating notes for any Claude session working in this repository.
For the longer narrative, see [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md),
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md), and
[`docs/TECHNICAL_RISKS.md`](docs/TECHNICAL_RISKS.md).

---

## Project

**Chromatic Echoes** is a cooperative sound-and-colour installation for the
TU Delft **Multi Sensory Design Studio**, designed to introduce first-time
teenage visitors to the **Dead Room** (anechoic chamber) through a playful,
museum-like walkthrough.

The repository's active codebase is the web MVP in
[`chromatic-echoes/`](chromatic-echoes/) — a Node.js + WebSocket server with a
vanilla HTML/CSS/JS client (no framework, no bundler, one runtime dependency:
`ws`).

## Design concept (one paragraph)

Visitors enter the Dead Room with their phones. Each visitor becomes a
**coloured player** (Red, Green, Blue). They use voice, claps, whispers, or
micro-sounds. The system captures each phone's microphone, translates the
volume into coloured particles on a main projection screen, and lets the
group co-create blended colours, notice silence, and explore directionality.
The web app is a *museum walkthrough*: **Waiting Room → Threshold → Dead
Room rounds → Exit / Archive**.

## MVP scope (what's in)

- Web app served from a single Node.js process (host display + phone clients
  on the same LAN).
- Four round kinds: **Solo Echo**, **Move Echo**, **Mix Echo**, **Silent Echo**.
- Manual zone selection (Zone A / B / C / Center) on each phone — visitor taps
  to declare where they are in the room.
- Optional phone vibration where the browser supports `navigator.vibrate`.
- An archive / reflection screen at exit.
- A stable, demoable experience that survives a live walkthrough.

## MVP scope (what's out)

- **GPS / indoor positioning** — browser geolocation is not accurate enough
  for room-scale tracking. Use manual zone selection.
- **Physical wristbands required** — coloured wristbands are identity markers
  only for the MVP. ESP32 wristbands stay a *future* interface; build a
  software stub so they can be added later without refactoring.
- **Native iOS / watchOS / Android apps** — web only.
- **Persistence** — no database, no auth, no accounts. State is per-session,
  in-memory.

---

## Workflow rules

1. **Never commit directly to `main`.** Use feature branches
   (e.g. `feature/chromatic-echoes-museum-mvp`). PRs must be **draft first**
   until explicitly approved for merge.
2. **Preserve the existing working demo.** New work wraps the existing
   gameplay; it does not rewrite it. If a change risks the working flow,
   gate it behind a feature switch or stage check.
3. **Small, incremental, reviewable commits.** One concern per commit. A
   working subject + body explaining *why* and *what changed*.
4. **Document changed files** in the commit body — the table of files +
   what changed pattern used in commits like `b0047fd` is the template.
5. **Run available checks before committing.** At minimum:
   - `node -c chromatic-echoes/server.js && node -c chromatic-echoes/app.js`
   - CSS brace-balance check (`{` count == `}` count)
   - For protocol changes: a quick WS probe (see commits `c413add`, `b0047fd`).
   - Confirm `http://localhost:8080/` still returns HTTP 200 after restart.
6. **Update [`chromatic-echoes/DESIGN.md`](chromatic-echoes/DESIGN.md) BEFORE
   changing visual code** if the design intent is shifting. The doc is the
   source of truth for typography, OKLCH colour, and UI patterns.
7. **Do not add runtime dependencies casually.** Today there is exactly one
   (`ws`). New deps need an explicit justification in the PR description.
8. **No emojis in code or commits unless the user explicitly asks.** Plain
   prose. ASCII arrows like `→` are fine where they aid clarity.

## Constraints (explicit "do not")

- **Do not implement GPS-based indoor positioning.** See
  [`docs/TECHNICAL_RISKS.md`](docs/TECHNICAL_RISKS.md) — browser geolocation
  is not reliable at room scale. Manual zone selection (`A` / `B` / `C` /
  `Center`) is the agreed UX.
- **Do not make physical wristbands required.** Wristbands are wearable
  identity markers in MVP — the experience must run with zero hardware
  beyond phones.
- **Keep phone vibration and mock-wearable behaviour as fallbacks**, not as
  required features. `navigator.vibrate` support varies by browser/OS and
  must degrade gracefully to "no vibration".
- **Do not merge to `main` without the user's explicit go-ahead.** Draft
  PRs only until approved.

## Per-change checklist

Before sending a change for review, confirm:

- [ ] On a feature branch, not on `main`.
- [ ] The existing demo flow (Landing → Host → Dead Room → round → success)
      still works end-to-end.
- [ ] Syntax checks pass (`node -c ...`, CSS brace balance).
- [ ] If the change touches the WebSocket protocol, a probe verifies both
      ends still agree.
- [ ] If the change touches CSS, [`chromatic-echoes/DESIGN.md`](chromatic-echoes/DESIGN.md)
      has been updated when the *intent* changed (not just to log the pixel
      diff).
- [ ] Commit body lists each touched file with a one-line "what changed".
- [ ] No `node_modules/` or binary build artefacts staged.
- [ ] No secrets, no `.env`, no API tokens in the diff.

## Repo map

```
MSD/
├── CLAUDE.md                      ← this file
├── docs/
│   ├── PROJECT_BRIEF.md           ← the museum experience in narrative form
│   ├── IMPLEMENTATION_PLAN.md     ← 8-phase roadmap
│   └── TECHNICAL_RISKS.md         ← known risks and fallbacks
├── chromatic-echoes/              ← the web MVP
│   ├── server.js                  ← Node.js HTTP + WebSocket server
│   ├── app.js                     ← client logic (single IIFE)
│   ├── index.html                 ← all screens as sibling .screen divs
│   ├── style.css                  ← OKLCH tokens + Plus Jakarta Sans / Space Grotesk
│   ├── package.json
│   ├── DESIGN.md                  ← style guide (typography, OKLCH, patterns)
│   ├── README.md                  ← run instructions
│   └── assets/                    ← photos + future media
└── main.py, pyproject.toml        ← inherited Python stub (unused)
```

## Run / test

```bash
cd chromatic-echoes
npm install
npm start
# Server on http://localhost:8080 (LAN: http://<your-ip>:8080)
```

Open the URL on a laptop, click **Start as Host**, walk through the
museum stages, then open additional browser windows to **Join Game** as
Red / Green / Blue. See [`chromatic-echoes/README.md`](chromatic-echoes/README.md)
for the multi-window testing technique and the three options for getting
microphone permission on phones (HTTPS tunnel / self-signed cert / Chrome flag).
