# Chromatic Echoes

A cooperative sound-and-colour experience for the TU Delft **Multi Sensory Design Studio** —
designed to introduce first-time teenage visitors to the **Dead Room** (anechoic chamber)
through a playful, museum-like walkthrough.

This folder contains the **MVP web app**: a host projection screen + per-visitor phone clients,
all served from a single Node.js process.

---

## What it is right now (working demo)

- A host laptop opens the page and clicks **Start as Host** → it becomes the projection display.
- 1–3 visitors open the same URL on their phones and pick a colour role (Red / Green / Blue).
- Each phone captures microphone volume and streams it to the server over WebSocket.
- Particles in the chosen colour emerge from each player's position on the projection
  and drift toward the centre, where they blend.
- In each round, the group has to **co-create a target colour** within a tolerance window
  and hold it for ~3 seconds to clear the round.
- Two play modes: **Live Mix** (match the live ratio) and **Fill Mode** (accumulate colour over time).

## Where the museum walkthrough is going (in progress)

The MVP is being extended on the branch `feature/chromatic-echoes-museum-mvp` to add the
full Chromatic Echoes walkthrough: **Waiting Room → Threshold → Dead Room → Archive**, with
round types Solo Echo / Move Echo / Mix Echo / Silent Echo, manual zone selection
(Zone A / B / C / Center), optional phone vibration, and a future hook for ESP32 wristbands.
The current single round type ("co-create the target colour") becomes "Mix Echo" inside the
new walkthrough. **No physical wristbands or indoor positioning are required for MVP.**

---

## Run it locally

Requires Node 18+.

```bash
cd chromatic-echoes
npm install
npm start
```

You'll see:

```
🎨 Chromatic Echoes Server
   Local:   http://localhost:8080
   Network: http://<your-LAN-ip>:8080
```

Open the **Local** URL on the projection machine and click **Start as Host**.
Open the **Network** URL on each phone (on the same Wi-Fi) and pick a colour.

> 💡 The projection client and the phone clients run the exact same `index.html`.
> The difference is whether you press **Start as Host** or **Join Game**.

### Testing all four roles from a single laptop

Each browser tab is one client. To simulate a full session by yourself:

1. Open **window 1**, click **Start as Host**, advance through the walkthrough into the Dead Room.
2. Open **window 2** (Ctrl + N for a new window, *not* a new tab in the same window — some browsers throttle background tabs), click **Join Game**, pick **Red**, grant the mic.
3. Open **window 3**, pick **Green**.
4. Open **window 4**, pick **Blue**.

All three player windows share the same physical microphone, so all three colour bars will move together when you speak — useful for testing **layout, particles, round flow, and stage transitions**. To test scenarios where one player is louder than another (Mix Echo), use separate physical devices on the LAN.

If a player window shows their colour bar at 0% while you're speaking:
- the tab was probably opened *before* you granted mic permission — close and reopen it, or click into the address bar and grant permission via the lock icon.
- the OS audio input may have been muted/changed — check the input device in Windows sound settings.

---

## ⚠️ Phones + microphone access (read this before demo day)

Browsers will refuse `getUserMedia` (microphone) on phones that load the app over plain
`http://` from a non-`localhost` address. This is a hard browser-security rule. We have not
chosen the production solution yet — the MVP currently works in **any** of these three ways:

1. **HTTPS tunnel (easiest demo setup).** Run something like:
   ```bash
   npx cloudflared tunnel --url http://localhost:8080
   # or: ngrok http 8080
   ```
   Use the `https://...trycloudflare.com` URL on phones. Needs internet at the venue.

2. **Local HTTPS with a self-signed cert.** Works fully offline but needs a cert and
   trusting it on each phone the first time. Best for a Dead Room with no internet.

3. **Chrome insecure-origin flag on test phones.** In `chrome://flags`, enable
   *"Insecure origins treated as secure"* and add `http://<host-ip>:8080`. Fine for
   rehearsal, not for public demo.

For the upcoming Dead Room demo, decide which one *before* the day so we don't burn
setup time. Default we lean toward today: **option 1 (cloudflared tunnel)** if the venue
has Wi-Fi with internet, else **option 2**.

---

## File map

| File | What it does |
|---|---|
| `server.js` | HTTP static-file server + WebSocket game server (rooms, roles, round loop). |
| `index.html` | All screens (landing / roles / lobby / waiting / HUD / success). |
| `app.js` | Client logic — audio capture, particles, WebSocket protocol, screen flow. |
| `style.css` | All styling, CSS variables, mode-specific tweaks. |
| `package.json` | Single dependency: `ws`. |

## Architecture in one paragraph

The server keeps a single `game` object in memory: which players are connected, their
last reported volumes, the current round target, and which phase the game is in
(`lobby` → `playing` → `success`). At ~30 fps it broadcasts a `frame` message with the
current mix to every client. Each phone's render loop reads its own microphone, computes
RMS volume, and sends a `volume` message back. The host page receives the same frames
and renders the projection canvas. There is no database, no auth, no rooms — one server
process = one game.
