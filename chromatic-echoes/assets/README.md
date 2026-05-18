# Assets

Static media referenced by the Chromatic Echoes client.

## Required files

| File | Used by | Notes |
|---|---|---|
| `DeadRoom-63.png` | Waiting Room screen background (`#screenWaitingRoom`) | A photograph of the TU Delft anechoic chamber interior. Recommended: landscape orientation, ≥ 1600px wide, ≤ ~600 KB after JPEG compression. The page works without it — a dark earthy-brown fallback colour is shown until the file is in place. |

## Adding the Dead Room photo

1. Save the photo as `chromatic-echoes/assets/DeadRoom-63.png` (exact filename, lower-case).
2. Hard-refresh the browser (Ctrl+F5) to bypass cache.
3. The Waiting Room screen will display the photo under a dark overlay for legibility.

There is no build step — files placed here are served directly by `server.js` via its static-file route.
