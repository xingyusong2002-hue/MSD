# Technical Risks — Chromatic Echoes

A register of the technical risks that *shape the MVP design*. For each
risk: what it is, why it matters, what we do about it today, and what the
fallback is if it bites us on demo day.

Risk levels:
- **🔴 Demo-stopper** — would prevent the experience running at all.
- **🟠 Degrades experience** — experience still runs but loses a piece.
- **🟡 Annoyance** — visible but doesn't break the walkthrough.

---

## 1. Mobile microphone permission / HTTPS context  🔴

**The problem.** Browsers refuse `navigator.mediaDevices.getUserMedia()`
on any non-`localhost` origin that isn't served over **HTTPS**. A phone
opening `http://192.168.x.y:8080` is *not* a secure context, so the mic
permission dialog never even appears — the call silently rejects. This
is the single biggest "the demo doesn't work" risk.

**Why it matters.** The whole experience depends on capturing phone
microphones. Without it: a working app, dead silence.

**Mitigation today.** Documented in
[`chromatic-echoes/README.md`](../chromatic-echoes/README.md). Three
options for the venue, ranked by ease:

1. **HTTPS tunnel** (`cloudflared tunnel --url http://localhost:8080` or
   `ngrok http 8080`). Needs internet at the venue. Cleanest answer.
2. **Local HTTPS with a self-signed cert**. Works fully offline but
   needs the cert trusted on each phone the first time.
3. **Chrome's "insecure origins treated as secure" flag** (`chrome://flags`).
   Per-device test setup only. Not a public-facing answer.

**Fallback for demo day.** If tunnels/cert all fail at the venue,
short-circuit the missing mic by **switching round flow** to host-driven
manual cues: the host calls "now red, now louder" and uses the existing
mode where the host can simulate inputs from the lobby controls. Less
participatory, but still demoable.

---

## 2. Browser vibration support varies  🟠

**The problem.** `navigator.vibrate()` is widely supported on Android but
**not available on iOS Safari at all** (any iOS browser, including
Chrome/Firefox, because they all use WebKit). On supporting browsers,
behaviour also varies (some block vibrations on inactive tabs).

**Why it matters.** Haptic feedback is intended as an accessible,
multi-sensory channel — visitors who are deaf or hard-of-hearing get the
beat through their hand. iOS users won't get this from the web app.

**Mitigation today.** Phase 6's `Haptics` abstraction feature-detects
once and silently no-ops on unsupported devices. The visual + audio
experience is unchanged when vibration is absent.

**Fallback for demo day.** Use Android-only loaner phones, OR design the
visual cues so they are sufficient on their own (the match-progress bar,
the round-end success animation). Haptics is *an enhancement*, never
load-bearing.

---

## 3. Indoor GPS / positioning is not reliable at room scale  🔴

**The problem.** Browser `Geolocation` and consumer GPS chips have ~3–10 m
accuracy outdoors and far worse indoors (often "no fix" inside metal /
foam structures like an anechoic chamber). Even Bluetooth-beacon or
Wi-Fi-trilateration approaches require dedicated infrastructure and
weeks of calibration. **Room-scale positioning is not solvable with
generic web APIs.**

**Why it matters.** Move Echo (Phase 5) requires knowing roughly which
quadrant of the room a visitor is in. If we relied on GPS, the colour
would jitter wildly or never appear in the right place.

**Mitigation today.** **Manual zone selection.** Visitor taps a button
labelled `Zone A` / `Zone B` / `Zone C` / `Center`. This is part of the
brief: do *not* implement GPS-based positioning. The trade-off is
"visitor has to tap" vs "always-wrong colour position" — the tap wins.

**Fallback for demo day.** N/A — manual zones *are* the solution.

---

## 4. Too many LED devices may be hard to wire / debug  🟠

**The problem.** If the future ESP32 wristbands ship with multiple
addressable LEDs each, a group of six visitors means thirty-plus LEDs
that have to (a) be powered, (b) be addressed correctly per role, (c)
not drift in colour calibration, (d) survive being worn for an hour by
a teenager. Each added LED multiplies the failure surface.

**Why it matters.** A flicker, a dead LED, or a power dropout during the
experience pulls visitors out of the room and into "this thing is
broken". Hardware reliability != software reliability.

**Mitigation today.** **Wristbands are out of MVP scope.** MVP uses
coloured wristbands as passive identity markers — pure fabric, no
electronics. The interface for future wristbands (Phase 8) is a software
adapter only; no hardware is required to ship the museum experience.

**Fallback for demo day.** N/A — there is no hardware in MVP.

---

## 5. Apple Watch / native wearable requires native development  🟠

**The problem.** Anything that runs on an Apple Watch needs a paired
iPhone, Xcode, an Apple developer account, App Store review (or a TestFlight
beta channel), and bespoke Swift code — none of which is a web project. The
same is true for Wear OS to a lesser extent.

**Why it matters.** A "watch tells visitors when to clap" idea sounds
appealing but introduces an enormous build/distribute pipeline orthogonal
to the rest of the project. It would dominate the engineering schedule.

**Mitigation today.** **Apple Watch is explicitly not an MVP dependency.**
The phone is the wearable for MVP. If a watch-style tactile cue is wanted
later, the ESP32 wristband is the path (see Phase 8 and Risk #4).

**Fallback for demo day.** N/A.

---

## 6. ESP32 wristbands are a second-stage prototype  🟡

**The problem.** Even with a clear design, a hardware build cycle is
much slower than a web build cycle: PCB layout, soldering, firmware
flashing, battery sourcing, enclosure design, charging logistics. A
realistic ESP32 wristband prototype is *weeks*, not days, and getting six
identical, reliable units is harder again.

**Why it matters.** If wristbands were required for the first museum
demo, the demo would slip behind the hardware cycle.

**Mitigation today.** Adapter-shaped placeholder only (Phase 8). The
game code calls a no-op `wristbandAdapter` so the hardware can subscribe
later without changing game logic. Wristbands become a *second-stage
prototype*, not a launch dependency.

**Fallback for demo day.** N/A — wristbands are optional even in their
own phase.

---

## 7. Local network / phone connection issues at the venue  🔴

**The problem.** The Dead Room is inside a TU Delft building with its
own Wi-Fi. Visitor phones may be on guest Wi-Fi, mobile data, or unable
to connect at all. The lab Wi-Fi may have client-isolation enabled
(common on guest SSIDs) which blocks the host laptop from reaching the
phones over LAN.

**Why it matters.** Even if the app is perfect, a phone that can't reach
`192.168.x.y:8080` is a dead phone.

**Mitigation today.**
- A self-contained Wi-Fi for the demo, hosted from either a portable
  router or the host laptop itself, removes the venue-network dependency.
- The HTTPS tunnel approach (Risk #1) also solves this because phones
  reach a public URL via mobile data, no LAN needed.
- The host laptop displays the LAN URL and a QR code on the lobby screen
  so visitors join with one scan, not by typing.

**Fallback for demo day.** Bring a dedicated travel router (a "demo box")
configured ahead of time. Phones connect to it; the host laptop too.
Internet not required.

---

## 8. Audio latency / noise threshold tuning  🟠

**The problem.** Each phone's microphone has different baseline noise,
different gain, and different audio routing latency. A volume threshold
that triggers nicely on one phone may be too sensitive (picks up HVAC
hum) or too insensitive (misses normal speech) on another.

**Why it matters.** If the room shows particles when nobody is speaking,
or fails to show them when someone is speaking, visitors lose trust in
the experience.

**Mitigation today.**
- `CONFIG.volumeThreshold` and `volumeMax` in
  [`chromatic-echoes/app.js`](../chromatic-echoes/app.js) are tunable
  constants. Tuned conservatively at `0.008` / `0.30` RMS.
- The mic-level meter on the player wait screen (Phase 2c) lets each
  visitor verify their own mic is being heard before the round starts.
- Future: a per-device calibration step that runs three seconds of
  ambient listening at startup and adapts the threshold to the local
  noise floor.

**Fallback for demo day.** If thresholds are wrong, lower
`volumeThreshold` from 0.008 to 0.004 in `app.js`, hard-refresh, restart
the round. Easy on-the-fly tuning.

---

## 9. Demo-day fallback modes  🟡

**The problem.** Live demos go wrong in unpredictable ways. We need a
deliberate "if X breaks, here's plan B" list rather than reacting in the
moment.

**Mitigation today.** Documented fallbacks per risk above. Summary:

| If this breaks | Fall back to |
|---|---|
| Mic permission on phones | host-narrated rounds; visual demo only |
| LAN / phone Wi-Fi | dedicated travel router OR HTTPS tunnel |
| Server wedges | the catch-all handlers in `server.js` log + recover; if not, `taskkill /IM node.exe /F && npm start` from a known-clean folder, 10 s downtime |
| Projector connection drops | the experience continues on the host laptop screen at reduced impact |
| One phone fails | the other phones cover the round; Mix Echo still works with 2 colours; the host can quietly disable the failed slot via `End round` / `Back to lobby` |
| Audio threshold mis-tuned | edit `CONFIG.volumeThreshold` in `app.js`, hard-refresh |

A pre-demo checklist lives in
[`chromatic-echoes/README.md`](../chromatic-echoes/README.md) — *run
through it 30 minutes before the visitors arrive, every time*.

---

## How to use this register

- Before adding a new feature, check whether any risks here apply.
- When adding a new risk, mirror the existing structure (problem → why →
  mitigation today → fallback). Don't just add a name and a colour.
- When a risk is fully retired (e.g. by a hardware decision or a venue
  test), mark it with the date and link to the change that closed it,
  but don't delete it — future readers benefit from the history.
