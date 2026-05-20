/* ============================================
   Chromatic Echoes — Multiplayer Client
   Two modes: Live Mix & Accumulate (Fill)
   ============================================ */
(() => {
    'use strict';

    // ---- DOM ----
    const canvas = document.getElementById('rippleCanvas');
    const ctx = canvas.getContext('2d');
    const screenLanding = document.getElementById('screenLanding');
    const screenRoles = document.getElementById('screenRoles');
    const screenLobby = document.getElementById('screenLobby');
    const screenPlayerWait = document.getElementById('screenPlayerWait');
    const screenSuccess = document.getElementById('screenSuccess');
    const screenWaitingRoom = document.getElementById('screenWaitingRoom');
    const screenThreshold = document.getElementById('screenThreshold');
    const screenArchive = document.getElementById('screenArchive');
    // Zone picker now lives inside the game HUD (#hudZonePicker), used only
    // during Move Echo. The previous Player Setup screen (name + sound role
    // + upfront zone) was removed as part of the museum-flow simplification.
    const hudZonePicker = document.getElementById('hudZonePicker');
    const zoneButtons = document.querySelectorAll('.zone-btn');
    const phoneTouchpad = document.getElementById('phoneTouchpad');
    const touchpadArea  = document.getElementById('touchpadArea');
    const touchpadDot   = document.getElementById('touchpadDot');
    const gameHud = document.getElementById('gameHud');
    const stageToolbar = document.getElementById('stageToolbar');
    const stageToolbarBtns = document.querySelectorAll('.stage-toolbar-btn');
    const hostWaitingControls = document.getElementById('hostWaitingControls');
    const hostThresholdControls = document.getElementById('hostThresholdControls');
    const hostArchiveControls = document.getElementById('hostArchiveControls');
    const btnAdvanceToThreshold = document.getElementById('btnAdvanceToThreshold');
    const btnAdvanceToDeadRoom = document.getElementById('btnAdvanceToDeadRoom');
    const btnBackToWaiting = document.getElementById('btnBackToWaiting');
    const btnArchiveNewSession = document.getElementById('btnArchiveNewSession');
    const btnWaitingBack = document.getElementById('btnWaitingBack');
    const btnHudExit = document.getElementById('btnHudExit');
    const btnBackToLobby = document.getElementById('btnBackToLobby');
    const btnClearFill = document.getElementById('btnClearFill');
    const btnPlayerBack = document.getElementById('btnPlayerBack');
    const hudEmptyHint = document.getElementById('hudEmptyHint');
    const btnHost = document.getElementById('btnHost');
    const btnJoin = document.getElementById('btnJoin');
    const roleCards = document.querySelectorAll('.role-card');
    const btnBackToLanding = document.getElementById('btnBackToLanding');
    const lobbyUrl = document.getElementById('lobbyUrl');
    const lobbyNetworkList = document.getElementById('lobbyNetworkList');
    const lobbyRecommendedUrl  = document.getElementById('lobbyRecommendedUrl');
    const lobbyHealthLink      = document.getElementById('lobbyHealthLink');
    const lobbyConnectTestLink = document.getElementById('lobbyConnectTestLink');
    const btnStartRound = document.getElementById('btnStartRound');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const lobbySlots = {
        red:   document.getElementById('lobbyRed'),
        green: document.getElementById('lobbyGreen'),
        blue:  document.getElementById('lobbyBlue'),
    };
    const playerColorLabel = document.getElementById('playerColorLabel');
    const waitPulse = document.getElementById('waitPulse');
    const playerModeHint = document.getElementById('playerModeHint');
    const modeBadgeIcon = document.getElementById('modeBadgeIcon');
    const modeBadgeName = document.getElementById('modeBadgeName');
    const targetSwatch = document.getElementById('targetSwatch');
    const targetName = document.getElementById('targetName');
    const targetR = document.getElementById('targetR');
    const targetG = document.getElementById('targetG');
    const targetB = document.getElementById('targetB');
    const mixR = document.getElementById('mixR');
    const mixG = document.getElementById('mixG');
    const mixB = document.getElementById('mixB');
    const mixingFill = document.getElementById('mixingFill');
    // HUD mix bar — slim stacked colour bar that replaces the central
    // mixing box's readout. Always visible during play in both modes.
    const hudMixSegR = document.getElementById('hudMixSegR');
    const hudMixSegG = document.getElementById('hudMixSegG');
    const hudMixSegB = document.getElementById('hudMixSegB');
    const hudMatchProgressBar = document.getElementById('hudMatchProgressBar');
    const mixingBox = document.getElementById('mixingBox');
    const matchProgressBar = document.getElementById('matchProgressBar');
    const barRed = document.getElementById('barRed');
    const barGreen = document.getElementById('barGreen');
    const barBlue = document.getElementById('barBlue');
    const barRedVal = document.getElementById('barRedVal');
    const barGreenVal = document.getElementById('barGreenVal');
    const barBlueVal = document.getElementById('barBlueVal');
    // Live-share-of-mix readouts. Per-role normalised contribution.
    const shareEls = {
        red:   document.getElementById('shareRed'),
        green: document.getElementById('shareGreen'),
        blue:  document.getElementById('shareBlue'),
    };
    const roundNum = document.getElementById('roundNum');
    const roundTotal = document.getElementById('roundTotal');
    const roundKindTag = document.getElementById('roundKindTag');
    const roundInstructionText = document.getElementById('roundInstructionText');
    const btnEndRound = document.getElementById('btnEndRound');
    const successColorName = document.getElementById('successColorName');
    const successSwatch = document.getElementById('successSwatch');
    const btnNextRound = document.getElementById('btnNextRound');
    const successHint = document.getElementById('successHint');

    // Three player identities. Purple was added briefly as a 4th blender
    // colour but removed per user request — three is the agreed MVP set.
    const COLORS = {
        red:   { r: 255, g: 51,  b: 85  },
        green: { r: 51,  g: 255, b: 136 },
        blue:  { r: 51,  g: 136, b: 255 },
    };
    const ROLES = ['red', 'green', 'blue'];
    const ZONES = ['A', 'B', 'C', 'Center'];
    const SOUND_ROLES = ['voice', 'hum', 'clap', 'whisper', 'micro-sound'];
    const CONFIG = {
        volumeThreshold: 0.008,        // mic gating threshold (audio side, RMS)
        volumeMax: 0.30,                // mic ceiling
        // trailAlpha lives in MODE_CONFIG now — Live Mix and Fill Mode use
        // different fade rates (the central differentiator between the two).
        // ---- Event-driven particle emitter ----
        volumeThresholdVisual: 0.04,
        particlesPerFramePerVolume: 10,
        // Multiplier applied AFTER volume scaling — tweakable for "feels
        // empty vs feels chaotic" without changing the underlying volume
        // curve. >1 = richer scatter; <1 = sparser.
        particleScatterGain: 2.1,
        // Global cap on simultaneously-alive particles. updateParticles
        // trims oldest entries when this is exceeded so frame rate stays
        // bounded even if three loud players + bursts run at once.
        maxParticlesCap: 360,
        // Angular spread at full volume (radians). Smaller = beam-like;
        // larger = spherical scatter. Quiet volume narrows toward
        // particleSpreadMin so soft sounds feel directional / contained.
        particleSpreadMin: Math.PI * 0.45,   // ±40° at threshold
        particleSpreadMax: Math.PI * 2.0,    // full circle at full volume
        particleMaxSpeed: 3.2,
        particleMinSize: 0.5,
        particleMaxSize: 2.2,
        particleBaseLifetime: 120,     // multiplied by MODE_CONFIG.particleLifeMul
        particleCenterPull: 0.05,      // gated by shouldUseCenterPull(kind)
        particleDamping: 0.985,
        particleAlphaMin: 0.18,
        particleAlphaMax: 0.42,
        // ---- Source aura (small local glow at the player's anchor) ----
        // Was a big 5-layer wall of colour (90-200 px radius, ~0.18-0.48
        // alpha). Tuned WAY down so the ripple/wavefront is the primary
        // visual — the aura is now just a small "this is alive" halo, not
        // a background wash that fights the ripple for attention.
        cloudBaseRadius: 26,
        cloudMaxRadius: 78,
        cloudLayers: 3,
        cloudMinOpacity: 0.05,
        cloudMaxOpacity: 0.20,
        // ---- Source wavefront rings — the PRIMARY visual ----
        // Larger reach, slower expansion, thinner stroke, softer alpha than
        // before: the user asked for rings that "expand further and fade
        // more smoothly" so they feel like sound rather than warnings.
        // Rings are NOT culled at the map boundary — they fade naturally
        // over their own duration so the wavefront stays continuous.
        ringMinCooldownMs: 70,
        ringMaxCooldownMs: 240,
        ringBaseRadius: 18,
        ringTravel: 700,               // was 460 — bigger reach
        ringTravelSec: 2.8,            // was 1.8 — slower, more elegant
        ringStartAlphaMin: 0.16,       // soft at threshold volume
        ringStartAlphaMax: 0.55,       // brighter at loud volume (was 0.45)
        ringLineMin: 0.8,
        ringLineMax: 2.6,              // a touch thicker at loud volume (was 2.2)
        // Volume coefficient for ring max radius: maxRadius = base + travel ×
        // (radiusVolMin + radiusVolGain × volume). Old (0.7 + 0.5×vol) gave
        // only ~1.7× range between silent and loud rings. New (0.20 + 0.90×vol)
        // gives ~5.5× — soft sounds make small ripples, loud ones make big
        // ones. Loudness now genuinely shapes the visual.
        ringRadiusVolMin: 0.20,
        ringRadiusVolGain: 0.90,
        // ---- Manual-tracking lerp ----
        positionLerpRate: 0.14,        // 0 = no smoothing, 1 = instant
    };

    // Per-mode visual differentiation. The user picks Live Mix or Fill Mode
    // from the host lobby; these values change WHAT the visualisation says
    // about that choice, beyond the existing match-math difference.
    //
    // Live Mix — "what you hear right now":
    //   • faster canvas trail fade (room becomes quiet quickly)
    //   • particles + rings die quicker
    //   • no painted field — nothing is preserved across the round
    //
    // Fill Mode — "your sound leaves traces":
    //   • very slow trail fade (paint persists for ~10 s)
    //   • particles + rings live longer
    //   • a low-alpha "paint field" stamp is laid down every frame each
    //     speaking player is at, building up the room with their colour
    const MODE_CONFIG = {
        live: {
            trailAlpha: 0.10,           // strong fade → room clears quickly
            particleLifeMul: 0.70,      // particles die quicker
            ringLifeMul: 0.85,
            paintField: false,
            paintFieldAlpha: 0,
            paintFieldRadius: 0,
        },
        accumulate: {
            trailAlpha: 0.012,          // very slow fade → traces persist
            particleLifeMul: 1.80,      // particles linger
            ringLifeMul: 1.35,          // rings travel further over time
            paintField: true,
            paintFieldAlpha: 0.035,     // very soft so it builds up
            paintFieldRadius: 64,       // blob size at threshold volume
        },
    };
    function getModeConfig() {
        return MODE_CONFIG[gameMode] || MODE_CONFIG.live;
    }

    // Which rounds should pull particles toward the centre mix point?
    // Only Mix Echo — where the *meaning* of the centre is "blend your
    // colours together". Solo, Move, and Silent are about each individual's
    // sound spreading outward through the room; pulling those particles to
    // the centre would feel like the room is sucking the sound away.
    function shouldUseCenterPull(kind) {
        return kind === 'mix';
    }

    // ---- State ----
    let ws = null, myRole = null, gameMode = 'live', experienceStage = 'waiting-room';
    let currentRound = null;
    let currentPhase = 'lobby';  // mirror of server.phase, used by debug panel
    let lastFrameAt = 0;          // performance.now() of the most recent 'frame' from server
    let debugVisible = false;
    let connectedPlayers = [];  // role subset — for source labels
    // Each entry: {role, name, soundRole, zone, connected, volume}.
    // Pulled from the state broadcast; drives label text, zone-based source
    // positions, and the contribution panel.
    let playersInfo = [];
    // Visitor's zone. Empty until they tap the in-HUD Move-Echo picker. Until
    // then the server assigns the role-default (Red→A, Green→B, Blue→C). Name
    // and sound-role state were removed when the Player Setup screen went
    // away — the protocol's `name` and `soundRole` join fields are still
    // accepted server-side but the client no longer sends them.
    let myZone = '';

    // ---- Manual-tracking prototype state ----
    // Normalised positions (0..1) per role. Two layers:
    //   • targetPositions: the latest server-broadcast position (set by
    //     touchpad drags, set_zone, or host_set_position keyboard shortcuts).
    //   • smoothedPositions: lerped each frame toward target so the dot
    //     glides rather than snapping across the room.
    // Defaults match the server's DEFAULT_POSITION_FOR so initial render
    // doesn't have a one-frame snap when the first broadcast arrives.
    const DEFAULT_NORM_POS = {
        red:   { x: 0.30, y: 0.35 },
        green: { x: 0.70, y: 0.35 },
        blue:  { x: 0.50, y: 0.68 },
    };
    function clonePos(p) { return { x: p.x, y: p.y }; }
    const targetPositions   = { red: clonePos(DEFAULT_NORM_POS.red),
                                green: clonePos(DEFAULT_NORM_POS.green),
                                blue: clonePos(DEFAULT_NORM_POS.blue) };
    const smoothedPositions = { red: clonePos(DEFAULT_NORM_POS.red),
                                green: clonePos(DEFAULT_NORM_POS.green),
                                blue: clonePos(DEFAULT_NORM_POS.blue) };
    // ---- Doppler-inspired motion state ----
    // Track the smoothedPositions of the PREVIOUS frame so we can compute
    // a per-role velocity vector. roleVelocityScreen[role] holds velocity
    // in SCREEN px/frame — that's what particle spawn + ring offset use.
    // A second smoothing pass on the velocity itself avoids twitchy
    // direction flips when the user makes a small touchpad correction.
    const prevSmoothedPositions = { red: clonePos(DEFAULT_NORM_POS.red),
                                    green: clonePos(DEFAULT_NORM_POS.green),
                                    blue: clonePos(DEFAULT_NORM_POS.blue) };
    const roleVelocityScreen = { red: { x: 0, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 0, y: 0 } };
    const VELOCITY_SMOOTH = 0.18;          // lerp factor for direction stability
    const VELOCITY_MAX_PX_PER_FRAME = 18;  // safety clamp on huge teleports
    let audioCtx, analyser, timeDomainData;

    // Human-readable labels used on the HUD instruction strip.
    const KIND_LABELS = { solo: 'Solo Echo', move: 'Move Echo', mix: 'Mix Echo', silent: 'Silent Echo' };
    let animationId = null, time = 0;
    let smoothVolumes = { red: 0, green: 0, blue: 0 };
    let sourcePositions = {}, mixCenter = { x: 0, y: 0 };

    // ---- Canvas ----
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        computeMixCenter();
    }
    // Recompute the mix-centre anchor only. Per-role positions used to be
    // baked here from discrete zone names; they're now derived per frame
    // from smoothedPositions (see render loop) so dragging the touchpad
    // produces continuous, lerp-smoothed movement on every projection.
    function computeMixCenter() {
        const w = window.innerWidth, h = window.innerHeight;
        mixCenter = { x: w / 2, y: h / 2 };
    }
    // Convert a normalised (0..1, 0..1) position into screen coordinates,
    // confined to the Dead Room map's drawn rectangle so dots and ripple
    // origins stay inside the visible "room" rather than the whole window.
    function getScreenPositionFromNormalised(p) {
        const b = getMapBounds();
        return {
            x: b.left + Math.max(0, Math.min(1, p.x)) * (b.right - b.left),
            y: b.top  + Math.max(0, Math.min(1, p.y)) * (b.bottom - b.top),
        };
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ---- Map bounds ----
    // The Dead Room "map" is the dashed quadrant box in style.css with
    // inset: 6vh 6vw. Particles must die when they leave it so they don't
    // travel forever across the whole screen.
    // The "Dead Room" map: a centred near-square area on the projection.
    // Previously this was a near-full-screen rectangle, which made the
    // projection feel like an abstract canvas rather than a top-down room.
    // Now: size = 78% of the smaller window dimension; slightly wider than
    // tall (1.08:1) so it still looks like a room, not a perfect tile.
    function getMapBounds() {
        const w = window.innerWidth, h = window.innerHeight;
        const size  = Math.min(w, h) * 0.78;
        const roomW = size * 1.08;
        const roomH = size;
        const cx = w / 2, cy = h / 2;
        return {
            left:   cx - roomW / 2,
            right:  cx + roomW / 2,
            top:    cy - roomH / 2,
            bottom: cy + roomH / 2,
            width:  roomW,
            height: roomH,
            cx, cy,
        };
    }

    // Trace the room rectangle as a path on whichever ctx is passed in.
    // Used both for stroking the boundary AND as the clip path that keeps
    // every visual layer (rings, particles, paint canvas) inside the room.
    function drawRoomPath(c) {
        const b = getMapBounds();
        c.beginPath();
        // Slightly rounded corners so the room reads as architectural,
        // not as a CSS div.
        const r = 14;
        c.moveTo(b.left + r, b.top);
        c.lineTo(b.right - r, b.top);
        c.arcTo(b.right, b.top, b.right, b.top + r, r);
        c.lineTo(b.right, b.bottom - r);
        c.arcTo(b.right, b.bottom, b.right - r, b.bottom, r);
        c.lineTo(b.left + r, b.bottom);
        c.arcTo(b.left, b.bottom, b.left, b.bottom - r, r);
        c.lineTo(b.left, b.top + r);
        c.arcTo(b.left, b.top, b.left + r, b.top, r);
    }

    function isInsideRoom(x, y) {
        const b = getMapBounds();
        return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    }

    // Stylised acoustic-foam border around the room. The TU Delft Dead
    // Room interior is lined with beige/sand-coloured foam wedges; this is
    // a top-down symbolic version of that, NOT a literal drawing. Layered:
    //   1. thick outer dark-warm stroke (the "wall behind the foam")
    //   2. thin beige inner stroke (the foam's facing edge)
    //   3. small triangular wedges along each side, pointing inward
    //   4. a per-wedge sine shimmer so the boundary feels alive
    //   5. one shared breathing alpha across all layers (~9s period)
    // No corner ticks — the wedges themselves give the corners definition.
    // Colours intentionally muted so the boundary doesn't compete with
    // the sound visuals inside the room.
    function drawAcousticFoamBoundary() {
        const b = getMapBounds();
        // Slow alpha breath, period ≈ 9s. Range 0.13..0.37.
        const breath = 0.25 + 0.12 * Math.sin(time * 0.7);
        const tickPhase = time * 1.2;

        ctx.save();

        // 1. Outer dark warm stroke — the "wall behind the foam".
        drawRoomPath(ctx);
        ctx.strokeStyle = `rgba(75, 65, 48, ${(breath * 0.85).toFixed(3)})`;
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Thin beige inner stroke — the foam's lit facing edge.
        drawRoomPath(ctx);
        ctx.strokeStyle = `rgba(190, 170, 130, ${(breath * 0.55).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 3. Repeated triangular wedges inward along each edge.
        // The wedge fill is the mid-tone foam colour. Each wedge's
        // protrusion length shimmers with a per-wedge sine offset so the
        // boundary doesn't look like a rigid sawtooth — small, organic.
        const wedgeBase = 9;          // half-width along the edge
        const wedgeDepth = 10;        // depth toward the room interior
        const wedgeSpacing = 24;      // distance between wedge centres
        ctx.fillStyle = `rgba(120, 105, 80, ${(breath * 1.4).toFixed(3)})`;

        // Top edge — wedges point DOWN into the room
        for (let x = b.left + wedgeSpacing * 0.7; x < b.right - wedgeSpacing * 0.4; x += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + x * 0.045);
            ctx.beginPath();
            ctx.moveTo(x - wedgeBase, b.top);
            ctx.lineTo(x + wedgeBase, b.top);
            ctx.lineTo(x,             b.top + wedgeDepth * shimmer);
            ctx.closePath();
            ctx.fill();
        }
        // Bottom edge — wedges point UP into the room
        for (let x = b.left + wedgeSpacing * 0.7; x < b.right - wedgeSpacing * 0.4; x += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + x * 0.045 + 1.7);
            ctx.beginPath();
            ctx.moveTo(x - wedgeBase, b.bottom);
            ctx.lineTo(x + wedgeBase, b.bottom);
            ctx.lineTo(x,             b.bottom - wedgeDepth * shimmer);
            ctx.closePath();
            ctx.fill();
        }
        // Left edge — wedges point RIGHT into the room
        for (let y = b.top + wedgeSpacing * 0.7; y < b.bottom - wedgeSpacing * 0.4; y += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + y * 0.045 + 2.9);
            ctx.beginPath();
            ctx.moveTo(b.left, y - wedgeBase);
            ctx.lineTo(b.left, y + wedgeBase);
            ctx.lineTo(b.left + wedgeDepth * shimmer, y);
            ctx.closePath();
            ctx.fill();
        }
        // Right edge — wedges point LEFT into the room
        for (let y = b.top + wedgeSpacing * 0.7; y < b.bottom - wedgeSpacing * 0.4; y += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + y * 0.045 + 4.3);
            ctx.beginPath();
            ctx.moveTo(b.right, y - wedgeBase);
            ctx.lineTo(b.right, y + wedgeBase);
            ctx.lineTo(b.right - wedgeDepth * shimmer, y);
            ctx.closePath();
            ctx.fill();
        }

        // 4. A faint outer "shadow" behind the foam, 3px out from the
        // path — adds depth so the foam reads as physical thickness
        // rather than a sticker pasted on the canvas.
        ctx.save();
        ctx.translate(-2, -2);
        drawRoomPath(ctx);
        ctx.strokeStyle = `rgba(20, 17, 13, ${(breath * 0.65).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }

    // Backwards-compatible alias — the old name was used elsewhere.
    function drawRoomBoundary() { drawAcousticFoamBoundary(); }

    // ---- Offscreen "paint canvas" (Fill Mode memory layer) ----
    // A separate canvas where Fill Mode stamps low-alpha colour blobs at each
    // speaking player's current source position. Persists across frames so
    // visitors visibly PAINT the room along their movement path. Live Mix
    // does not stamp here, and applies a soft fade so any leftover paint
    // from a previous Fill Mode round clears within a few seconds.
    //
    // Why a separate canvas, not just lower trail alpha on the main canvas:
    // the main canvas fades rings + particles aggressively. If trail alpha
    // were low enough to keep paint, stale rings would also persist and
    // muddy the picture. Independent layers = independent fade policy.
    const paintCanvas = document.createElement('canvas');
    const paintCtx    = paintCanvas.getContext('2d');
    function resizePaintCanvas() {
        const dpr = window.devicePixelRatio || 1;
        paintCanvas.width  = window.innerWidth  * dpr;
        paintCanvas.height = window.innerHeight * dpr;
        paintCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function clearPaintCanvas() {
        paintCtx.save();
        paintCtx.setTransform(1, 0, 0, 1, 0, 0);
        paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
        paintCtx.restore();
    }
    // Stamp a soft radial blob at (x, y) on the paint canvas, in role colour.
    function stampPaint(x, y, color, volume) {
        const blobR = 70 + volume * 60;
        // Higher alpha than the previous main-canvas stamp because this
        // layer does NOT get the main canvas's trail fade — colour builds.
        const alpha = 0.045 + volume * 0.08;
        const grad = paintCtx.createRadialGradient(x, y, 0, x, y, blobR);
        grad.addColorStop(0,   `rgba(${color.r},${color.g},${color.b},${alpha.toFixed(3)})`);
        grad.addColorStop(0.6, `rgba(${color.r},${color.g},${color.b},${(alpha * 0.4).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(${color.r},${color.g},${color.b},0)`);
        paintCtx.fillStyle = grad;
        paintCtx.beginPath();
        paintCtx.arc(x, y, blobR, 0, Math.PI * 2);
        paintCtx.fill();
    }
    // Slow erase used by Live Mix to clear leftover paint from a previous
    // Fill Mode round. Uses destination-out so it removes colour rather
    // than darkening it. Alpha is small — clears in ~2-3 s.
    function fadePaintCanvas(amount) {
        paintCtx.save();
        paintCtx.globalCompositeOperation = 'destination-out';
        paintCtx.fillStyle = `rgba(0,0,0,${amount})`;
        paintCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        paintCtx.restore();
    }
    resizePaintCanvas();
    window.addEventListener('resize', resizePaintCanvas);

    // ---- Event-driven particle emitter ----
    // Replaces the old pre-allocated pool (which never depleted — particles
    // recycled themselves the moment they died, so the screen always showed
    // ~240 faintly-drawn particles even at silence). The new system:
    //   • spawnSoundParticles() pushes new particles onto activeParticles
    //   • silent roles spawn nothing, so silent = empty
    //   • updateParticles() ages, moves and removes
    //   • drawParticles() iterates the live list
    // Particle shape per task spec:
    //   { role, x, y, vx, vy, size, life, maxLife, alpha, color }
    let activeParticles = [];

    // Simulated per-role volumes for the host's R/G/B keyboard test
    // shortcuts. These are LOCAL ONLY — they never go to the server. They
    // exist purely so the projection can be tested without three phones.
    let simulatedVolumes = { red: 0, green: 0, blue: 0 };
    function simulateBurst(role) {
        if (!ROLES.includes(role)) return;
        simulatedVolumes[role] = 0.85;   // start near full so the ring is obvious
        // Quick attack, slow decay so it looks like a real shout.
        setTimeout(() => { simulatedVolumes[role] = 0.55; }, 200);
        setTimeout(() => { simulatedVolumes[role] = 0.25; }, 600);
        setTimeout(() => { simulatedVolumes[role] = 0.00; }, 1100);
        // The simulation is local-only and must be VISIBLE even if the
        // render loop isn't already running (e.g. host pressed R/G/B
        // before entering the lobby, or before any phase transition).
        // Kick the loop on so the next frame paints something.
        if (!animationId) startRenderLoop();
        if (debugVisible) console.log(`[sim] burst ${role} (LOCAL, not sent to server)`);
    }

    // Effective per-role volume = max(real mic volume, simulated keyboard burst).
    // Used by spawnSoundParticles + pulse rings + source-cloud sizing.
    function effectiveVolume(role) {
        return Math.max(smoothVolumes[role] || 0, simulatedVolumes[role] || 0);
    }

    // Throttle for the debug-gated spawn log (one per role per second max).
    const lastSpawnLogAt = { red: 0, green: 0, blue: 0 };
    function spawnSoundParticles(role, volume, src) {
        // Below the visual threshold, no particles at all. The pre-existing
        // mic gating is for ANALYSIS (sending to server); this one is for
        // VISUALS (what we paint on the projection). Higher to avoid noise.
        if (volume < CONFIG.volumeThresholdVisual) return;
        const color = COLORS[role];
        if (!color || !src) return;
        if (debugVisible) {
            const now = performance.now();
            if (now - (lastSpawnLogAt[role] || 0) > 1000) {
                lastSpawnLogAt[role] = now;
                console.log(`[spawn] role=${role} vol=${volume.toFixed(2)} at (${Math.round(src.x)}, ${Math.round(src.y)}) active=${activeParticles.length}`);
            }
        }
        // Spawn count scales with volume + scatter gain. Quiet sound emits
        // a thin trickle; loud sound emits a small cloud. The gain knob
        // lets us tune "feels empty vs feels chaotic" without rewriting.
        const count = Math.max(1, Math.round(
            volume * CONFIG.particlesPerFramePerVolume * CONFIG.particleScatterGain
        ));

        // Angular spread widens with volume: at threshold (~0.04) only a
        // narrow cone emits; at full volume the spread fills the circle.
        const spread = CONFIG.particleSpreadMin
            + (CONFIG.particleSpreadMax - CONFIG.particleSpreadMin) * Math.min(1, volume * 2);

        // Doppler-inspired motion bias: if the source has been moving
        // while speaking, weight particle angles toward the motion vector
        // and add a fraction of velocity to each particle's initial v.
        // roleVelocityScreen is updated by computeRoleVelocities() each
        // frame. Quiet motion has no effect (speed below threshold).
        const v = roleVelocityScreen[role] || { x: 0, y: 0 };
        const speedPx = Math.sqrt(v.x * v.x + v.y * v.y);
        const moving = speedPx > 0.6;
        const motionAngle = moving ? Math.atan2(v.y, v.x) : null;

        for (let i = 0; i < count; i++) {
            // Base radial angle, biased toward motion if applicable.
            let angle;
            if (motionAngle !== null && Math.random() < 0.72) {
                // 72% of particles fall within ±60° of the motion vector
                // → directional / "pushed" feel without becoming a beam.
                angle = motionAngle + (Math.random() - 0.5) * (Math.PI / 1.5);
            } else {
                // Otherwise spread within the volume-derived cone, with
                // a random pivot so we don't get banding.
                const pivot = Math.random() * Math.PI * 2;
                angle = pivot + (Math.random() - 0.5) * spread;
            }
            const baseSpeed = 0.6 + Math.random() * CONFIG.particleMaxSpeed * (0.4 + volume);
            // Carry-along: add a fraction of source velocity. Subtle —
            // particles still expand radially, but the cloud as a whole
            // shifts forward when the source is moving.
            const carry = moving ? 0.35 : 0;
            const sizeRange = CONFIG.particleMaxSize - CONFIG.particleMinSize;
            activeParticles.push({
                role,
                color,
                x: src.x + (Math.random() - 0.5) * 8,
                y: src.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * baseSpeed + v.x * carry,
                vy: Math.sin(angle) * baseSpeed + v.y * carry,
                size: CONFIG.particleMinSize + Math.random() * sizeRange * (0.4 + volume * 0.6),
                // Mode-driven lifetime: Live Mix particles die quickly; Fill
                // Mode particles linger so movement traces stay visible.
                life:    CONFIG.particleBaseLifetime * (0.8 + volume * 0.5) * getModeConfig().particleLifeMul,
                maxLife: CONFIG.particleBaseLifetime * (0.8 + volume * 0.5) * getModeConfig().particleLifeMul,
                // Lower alpha range so particles read as texture, not dots.
                alpha: CONFIG.particleAlphaMin + Math.random() * (CONFIG.particleAlphaMax - CONFIG.particleAlphaMin),
            });
        }
    }

    function updateParticles() {
        const bounds = getMapBounds();
        const cx = mixCenter.x, cy = mixCenter.y;
        // Centre pull ONLY in Mix Echo — where blending at the centre is
        // the point of the round. In Solo / Move / Silent, sound should
        // spread outward through the room instead of being "sucked in".
        const centerPullActive = shouldUseCenterPull(currentRound && currentRound.kind);
        const next = [];
        for (let i = 0; i < activeParticles.length; i++) {
            const p = activeParticles[i];
            if (centerPullActive) {
                // Subtle drift toward the mix point.
                const dx = cx - p.x, dy = cy - p.y;
                const d2 = dx * dx + dy * dy;
                if (d2 > 1) {
                    const inv = 1 / Math.sqrt(d2);
                    p.vx += dx * inv * CONFIG.particleCenterPull;
                    p.vy += dy * inv * CONFIG.particleCenterPull;
                }
            }
            // Tiny stochastic jitter for an organic feel.
            p.vx += (Math.random() - 0.5) * 0.08;
            p.vy += (Math.random() - 0.5) * 0.08;
            // Damping so they don't accelerate forever.
            p.vx *= CONFIG.particleDamping;
            p.vy *= CONFIG.particleDamping;
            // Integrate.
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 1;
            // Boundary death — they MUST disappear at the map edge so the
            // Dead Room rectangle stays meaningful.
            if (p.x < bounds.left || p.x > bounds.right
             || p.y < bounds.top  || p.y > bounds.bottom) continue;
            // (Centre-mix death removed: when sources sat near the centre
            // — which they did by default before the per-role zone fix —
            // particles vanished the instant they spawned. Life + boundary
            // already handle cleanup; nothing accumulates because life
            // decays each frame.)
            if (p.life <= 0) continue;
            next.push(p);
        }
        // Global cap: if we exceeded maxParticlesCap (e.g. three loud
        // players + collision bursts firing at once), trim the OLDEST
        // particles first. They have the least life left anyway, so
        // visually this is the least-disruptive eviction policy.
        if (next.length > CONFIG.maxParticlesCap) {
            next.splice(0, next.length - CONFIG.maxParticlesCap);
        }
        activeParticles = next;
    }

    function drawParticles() {
        for (let i = 0; i < activeParticles.length; i++) {
            const p = activeParticles[i];
            const lifeFrac = p.life / p.maxLife;
            const alpha = p.alpha * Math.max(0, lifeFrac);
            if (alpha < 0.01) continue;
            const sz = p.size * (0.7 + lifeFrac * 0.5);
            ctx.beginPath();
            ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${alpha.toFixed(3)})`;
            ctx.fill();
        }
    }

    // ---- Source pulse rings (Task B) ----
    // Each connected, audible role periodically emits an expanding circle
    // from its source position. Makes the "this player's phone is being
    // heard" connection visible at a glance.
    let activeRings = [];
    let lastRingAt = { red: 0, green: 0, blue: 0 };

    function maybeSpawnRing(role, src, volume) {
        if (volume < CONFIG.volumeThresholdVisual) return;
        // Doppler bias: when the source is moving, shorten the cooldown
        // (more rings in flight at once) and offset the spawn position
        // slightly forward in the motion direction. The combined effect
        // reads as compressed waves in front, sparser behind — visual
        // metaphor for Doppler without simulating actual physics.
        const v = roleVelocityScreen[role] || { x: 0, y: 0 };
        const speedPx = Math.sqrt(v.x * v.x + v.y * v.y);
        const moving = speedPx > 0.6;
        const motionGain = moving ? Math.min(1, speedPx / 8) : 0;

        // Loud volume = shorter cooldown = more frequent rings; motion
        // shortens it further.
        const tt = (1 - Math.min(1, volume));
        const baseCd = CONFIG.ringMinCooldownMs + tt * (CONFIG.ringMaxCooldownMs - CONFIG.ringMinCooldownMs);
        const cooldown = baseCd * (1 - motionGain * 0.45);
        const now = performance.now();
        if (now - lastRingAt[role] < cooldown) return;
        lastRingAt[role] = now;

        // Spawn offset forward in motion direction (subtle — capped at
        // ringBaseRadius so the centre stays near the source).
        const offMag = motionGain * CONFIG.ringBaseRadius * 0.6;
        const offX = moving ? (v.x / Math.max(0.001, speedPx)) * offMag : 0;
        const offY = moving ? (v.y / Math.max(0.001, speedPx)) * offMag : 0;

        const startAlpha = CONFIG.ringStartAlphaMin + (CONFIG.ringStartAlphaMax - CONFIG.ringStartAlphaMin) * Math.min(1, volume);
        const ringLifeMul = getModeConfig().ringLifeMul;
        activeRings.push({
            role,
            color: COLORS[role],
            x: src.x + offX,
            y: src.y + offY,
            born: now,
            // Duration scaled by mode + slightly by volume — loud rings linger
            // a little longer, so the wavefront feels like it has presence.
            duration: CONFIG.ringTravelSec * 1000 * ringLifeMul * (0.80 + 0.35 * Math.min(1, volume)),
            // Sound-responsive radius: small ripples for whispers, big ones
            // for shouts (see ringRadiusVolMin/Gain CONFIG comments).
            maxRadius: CONFIG.ringBaseRadius
                + CONFIG.ringTravel * (CONFIG.ringRadiusVolMin + CONFIG.ringRadiusVolGain * Math.min(1, volume)),
            startAlpha,
        });
        if (debugVisible) {
            console.log(`[ring] role=${role} vol=${volume.toFixed(2)} from (${Math.round(src.x)}, ${Math.round(src.y)}) startAlpha=${startAlpha.toFixed(2)} maxR=${Math.round(CONFIG.ringBaseRadius + CONFIG.ringTravel * (0.7 + 0.5 * volume))}`);
        }
    }

    function updateRings() {
        const now = performance.now();
        activeRings = activeRings.filter(r => (now - r.born) < r.duration);
    }

    function drawRings() {
        const now = performance.now();
        for (const r of activeRings) {
            const t = (now - r.born) / r.duration;   // 0..1
            if (t < 0 || t > 1) continue;
            const radius = CONFIG.ringBaseRadius + (r.maxRadius - CONFIG.ringBaseRadius) * t;
            // Ease-out alpha for a "fade rather than vanish" feel.
            const alpha = r.startAlpha * (1 - t) * (1 - t);
            if (alpha < 0.02) continue;
            // Thick rings at birth, thinner as they expand — so the source is
            // clearly the brightest point.
            const lineW = CONFIG.ringLineMin + (CONFIG.ringLineMax - CONFIG.ringLineMin) * (1 - t);
            ctx.beginPath();
            ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r.color.r},${r.color.g},${r.color.b},${alpha.toFixed(3)})`;
            ctx.lineWidth = lineW;
            ctx.stroke();
        }
    }

    // ---- Cross-role collision bursts ----
    // When two different-role particles overlap, we want a quick flash in
    // the blended colour at their midpoint. The naïve approach (O(n²)
    // pairwise distance every frame) burns CPU; instead we bucket
    // particles into a coarse grid keyed by floor(x/cell), floor(y/cell)
    // and only check pairs that share a cell. With caps on bursts-per-
    // frame and per-cell cooldown, the worst case stays bounded.
    const COLLISION = {
        cellSize: 32,             // grid cell ≈ collision radius
        radius: 22,               // particles within this many px collide
        maxBurstsPerFrame: 6,
        burstDurationMs: 620,     // slightly longer so the flash registers
        maxRadius: 38,            // was 26 — bigger so collisions read clearly
        cooldownMs: 220,          // per-cell cooldown, no repeat in same area
        burstAlphaPeak: 0.85,     // was implicit 0.75 — slightly brighter
        // Each burst also sprays a few tiny "blended" micro-particles
        // around its centre — so the reaction reads as physical
        // interference (dust) rather than a single flash. These ride on
        // the existing activeParticles array with role='blend' so they
        // share the lifetime, boundary cull and trimming caps. The
        // collision-detection grid skips role='blend' so they can't
        // chain-cascade collisions.
        microParticlesPerBurst: 4,
    };
    let activeCollisionBursts = [];
    const cellCooldowns = new Map();  // cellKey → performance.now() of last burst

    function spawnCollisionBurst(x, y, colorA, colorB) {
        // Blend the two role colours. Average works well visually for the
        // {red,green,blue} palette: red+blue ≈ purple-magenta, red+green ≈
        // amber, green+blue ≈ teal — matching the user's stated intent.
        const r = Math.round((colorA.r + colorB.r) / 2);
        const g = Math.round((colorA.g + colorB.g) / 2);
        const b = Math.round((colorA.b + colorB.b) / 2);
        activeCollisionBursts.push({
            x, y, r, g, b,
            born: performance.now(),
            duration: COLLISION.burstDurationMs,
            maxR: COLLISION.maxRadius,
        });
        // Micro-particles around the burst — a tiny dust of the blended
        // colour. They ride in activeParticles with role='blend' so they
        // share the lifetime / boundary cull / cap behaviour of regular
        // particles. detectCollisions skips role==='blend' so they cannot
        // chain new bursts.
        const blendColor = { r, g, b };
        for (let i = 0; i < COLLISION.microParticlesPerBurst; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 0.9 + Math.random() * 1.6;
            activeParticles.push({
                role: 'blend',
                color: blendColor,
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 6,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                size: 0.6 + Math.random() * 1.4,
                life:    36 + Math.random() * 24,
                maxLife: 60,
                alpha: 0.45 + Math.random() * 0.25,
            });
        }
    }

    function detectCollisions() {
        if (activeParticles.length < 2) return;
        const cell = COLLISION.cellSize;
        const radSq = COLLISION.radius * COLLISION.radius;
        const grid = new Map();
        for (const p of activeParticles) {
            const key = (Math.floor(p.x / cell)) + ',' + (Math.floor(p.y / cell));
            let bucket = grid.get(key);
            if (!bucket) { bucket = []; grid.set(key, bucket); }
            bucket.push(p);
        }
        const now = performance.now();
        let burstsThisFrame = 0;
        for (const [key, bucket] of grid) {
            if (bucket.length < 2) continue;
            // Per-cell cooldown: avoid a hot region spawning a burst on
            // every frame — that creates the "white spot of doom".
            const lastAt = cellCooldowns.get(key);
            if (lastAt && now - lastAt < COLLISION.cooldownMs) continue;
            // Pairwise check inside the cell only — at most a handful of
            // particles per cell, so this is cheap.
            outer:
            for (let i = 0; i < bucket.length; i++) {
                const a = bucket[i];
                for (let j = i + 1; j < bucket.length; j++) {
                    const b = bucket[j];
                    if (a.role === b.role) continue;
                    // Micro-particles from a previous burst can't trigger
                    // a chain — only "real" role particles do.
                    if (a.role === 'blend' || b.role === 'blend') continue;
                    const dx = a.x - b.x, dy = a.y - b.y;
                    if (dx * dx + dy * dy <= radSq) {
                        spawnCollisionBurst((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, a.color, b.color);
                        cellCooldowns.set(key, now);
                        burstsThisFrame++;
                        if (burstsThisFrame >= COLLISION.maxBurstsPerFrame) return;
                        break outer;
                    }
                }
            }
        }
        // Periodically prune stale cooldown entries so the Map doesn't grow.
        if (cellCooldowns.size > 200) {
            for (const [k, t] of cellCooldowns) {
                if (now - t > COLLISION.cooldownMs * 4) cellCooldowns.delete(k);
            }
        }
    }

    function updateCollisionBursts() {
        const now = performance.now();
        activeCollisionBursts = activeCollisionBursts.filter(b => now - b.born < b.duration);
    }

    function drawCollisionBursts() {
        const now = performance.now();
        for (const b of activeCollisionBursts) {
            const t = (now - b.born) / b.duration;     // 0..1
            // Larger growth fraction so the burst expands more — reads as
            // a small interference wave rather than a dot pop.
            const radius = b.maxR * (0.35 + t * 0.85);
            // Bright at birth, fade fast (ease-out quadratic) so they
            // read as sparks rather than slow blooms.
            const a = (1 - t) * (1 - t) * COLLISION.burstAlphaPeak;
            if (a < 0.02) continue;
            const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
            grad.addColorStop(0,   `rgba(${b.r},${b.g},${b.b},${a.toFixed(3)})`);
            grad.addColorStop(0.5, `rgba(${b.r},${b.g},${b.b},${(a * 0.4).toFixed(3)})`);
            grad.addColorStop(1,   `rgba(${b.r},${b.g},${b.b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Per-role phase offsets for the breathing animation. Thirds of 2π so
    // the three colours never pulse in lockstep — that lockstep would read
    // as scripted UI rather than three independent living sound sources.
    const BREATH_PHASE = { red: 0.0, green: 2.094, blue: 4.188 };
    // Smoothed volume per role for the "speaking burst" envelope on the dot.
    // Reads directly from smoothVolumes / simulatedVolumes; no extra state.

    // ---- Source dot (breathing, volume-reactive) ----
    // Idle (volume below visual threshold):
    //   • subtle sinusoidal breathing on size + alpha (per-role phase
    //     offset so each colour breathes independently)
    //   • two layered sines (slow + faster) for an irregular, organic feel
    //     instead of a perfect mechanical cosine
    // Speaking (volume above threshold):
    //   • breathing is "won over" by a stronger volume-driven response
    //   • size, alpha and outer-halo radius all jump with volume
    //   • crossfade so the transition between idle and speaking doesn't snap
    function drawSourceDot(cx, cy, volume, color, isConnected) {
        const { r, g, b } = COLORS[color];

        // Two-frequency sinusoidal idle breathing, ±10% on size, ±15% on alpha.
        const phase = BREATH_PHASE[color] || 0;
        const slow  = Math.sin(time * 1.4 + phase);            // ~0.22 Hz, dominant
        const fast  = Math.sin(time * 3.1 + phase * 1.7) * 0.3; // wobble overlay
        const breath = (slow + fast) * 0.5;                    // -1..+1 ish
        const breathSize  = 1 + 0.18 * breath;                 // size mult
        const breathAlpha = 1 + 0.22 * breath;                 // alpha mult

        // Idle vs speaking blend factor. At threshold (0.04) we're 0% speaking,
        // at 3× threshold we're 100% — so loud sound fully overrides breathing.
        const speaking = Math.max(0, Math.min(1, (volume - CONFIG.volumeThresholdVisual) / (CONFIG.volumeThresholdVisual * 2)));

        // Source dot ~1.5× larger than before (was 9 / 5) so it reads as
        // an active sound emitter from projection distance. Volume-driven
        // bonus radius scaled proportionally so the speaking burst still
        // feels punchy without becoming a giant background disc.
        const baseR = isConnected ? 14 : 7;
        // Idle radius breathes; speaking adds volume-driven extra.
        const dotR = baseR * (1 - speaking * 0.0)             // baseR doesn't shrink
                    * (1 + (breathSize - 1) * (1 - speaking)) // idle breath fades out as speaking ramps in
                    + volume * 18 * speaking + volume * 6 * (1 - speaking);
        const idleAlpha = isConnected ? 0.60 : 0.30;
        const loudAlpha = isConnected ? 0.95 : 0.58;
        const alphaBase = idleAlpha + (loudAlpha - idleAlpha) * speaking;
        const alpha = Math.max(0.05, Math.min(1, alphaBase * (1 + (breathAlpha - 1) * (1 - speaking))));

        // Outer halo — bigger when speaking, breathing when idle. Tighter
        // halo-to-dot ratio than before so the larger dot doesn't bleed
        // into a giant fuzzy background disc.
        const haloR = dotR * (2.3 + 1.0 * speaking);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.45).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();

        // Solid dot.
        ctx.beginPath(); ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fill();
    }

    // ---- Cloud ----
    function drawSourceCloud(cx, cy, volume, color) {
        const { r, g, b } = COLORS[color];
        const vn = Math.min(1, volume * 3);
        const radius = lerp(CONFIG.cloudBaseRadius, CONFIG.cloudMaxRadius, vn);
        // Min opacity is generous so visitors can SEE where their colour will
        // emerge from before they make any sound. Max opacity grows with volume.
        const opacity = lerp(CONFIG.cloudMinOpacity, CONFIG.cloudMaxOpacity, vn);
        if (opacity < 0.01) return;
        const breathe = Math.sin(time * 1.5 + (color === 'red' ? 0 : color === 'green' ? 2 : 4)) * 5;
        const r2 = radius + breathe;
        for (let layer = CONFIG.cloudLayers - 1; layer >= 0; layer--) {
            const t = layer / CONFIG.cloudLayers, layerR = r2 * (0.3 + t * 0.7), layerO = opacity * (1 - t * 0.6);
            const wx = noise(layer * 10 + 1, time * 0.8) * 6, wy = noise(layer * 10 + 2, time * 0.6) * 6;
            const lx = cx + wx, ly = cy + wy;
            const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, layerR);
            grad.addColorStop(0, `rgba(${r},${g},${b},${layerO.toFixed(3)})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${(layerO * 0.5).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath(); ctx.arc(lx, ly, layerR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        }
    }

    // Draw a small colour name label near each source position. Gives the
    // visitor a clear "RED IS HERE" anchor even when nobody is speaking,
    // which otherwise leaves the screen looking blank.
    function drawSourceLabel(cx, cy, color, isConnected) {
        const { r, g, b } = COLORS[color];
        const alpha = isConnected ? 0.9 : 0.45;
        ctx.save();
        ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(color.toUpperCase(), cx, cy);
        // Tiny status under the label
        ctx.font = '300 10px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
        ctx.fillText(isConnected ? 'speak now' : 'waiting…', cx, cy + 18);
        ctx.restore();
    }

    // Centre rendering is now mode-aware. The previous single function drew
    // a hard ~150 px radial gradient in BOTH modes — which created the
    // "hard centre target" the user wanted to remove. Now:
    //   • Live Mix: nothing on the canvas at the centre. The room listens to
    //     the present; the colour balance is shown in the HUD mix bar.
    //   • Fill Mode: a broad, very soft accumulation field — no hard edge,
    //     no rigid circle. Big radius, low alpha, picks up the current mix
    //     colour. Combined with the slow Fill-Mode trail fade, this builds
    //     a "the room remembers where sound has been" haze.
    function drawAccumulationField(mix) {
        if (mix.total < 0.05) return;
        const r = Math.round((mix.r / 100) * 255);
        const g = Math.round((mix.g / 100) * 255);
        const b = Math.round((mix.b / 100) * 255);
        // Large, soft radial — alpha low so it accumulates rather than
        // dominating. Goes well beyond the old 150 px so the "middle" reads
        // as a region, not a target. Radius scales with screen so it stays
        // proportional on a large projection.
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.45;
        const alpha = Math.min(0.085, mix.total * 0.012 + 0.025);
        const grad = ctx.createRadialGradient(mixCenter.x, mixCenter.y, 0, mixCenter.x, mixCenter.y, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${(alpha * 0.5).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(mixCenter.x, mixCenter.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // ---- Utilities ----
    function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
    function noise(seed, t) { return Math.sin(seed * 127.1 + t * 1.3) * 0.5 + Math.sin(seed * 269.5 + t * 0.7) * 0.3 + Math.sin(seed * 419.2 + t * 2.1) * 0.2; }

    // ---- Audio ----
    async function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Chrome ships AudioContexts in 'suspended' state unless created
            // synchronously inside a user gesture. resume() makes sure analyser
            // reads actually return non-zero data even on slow paths or when
            // the click handler awaited getUserMedia before context use.
            if (audioCtx.state === 'suspended') {
                try { await audioCtx.resume(); } catch (_) { /* ignore */ }
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85;
            source.connect(analyser); timeDomainData = new Float32Array(analyser.fftSize);
            startMicMeter(); // diagnostic preview on the wait screen
            return true;
        } catch (e) {
            // Surface the actual error so on-phone debugging isn't guesswork.
            // The two most common failure modes:
            //   • NotAllowedError — user denied the permission prompt.
            //   • NotSupportedError / SecurityError — page is HTTP and the
            //     phone's browser refuses getUserMedia outside a secure
            //     context (HTTPS or localhost). The HTTPS-tunnel hint
            //     below tells visitors what to do about it.
            const errName = (e && e.name) || 'UnknownError';
            const errMsg  = (e && e.message) || String(e);
            console.error('Mic init failed:', errName, errMsg, e);
            const isHttp = location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
            const message = [
                `Microphone error — ${errName}`,
                '',
                errMsg,
                '',
                isHttp
                    ? 'This page is loaded over HTTP from a LAN address. Most mobile browsers block microphone access unless the page is served over HTTPS or from localhost. Run an HTTPS tunnel (e.g. `cloudflared tunnel --url http://localhost:8080` or `ngrok http 8080`) and share that URL with phones.'
                    : 'Check the browser permission dialog. If you accidentally denied it, click the address-bar permission icon to re-allow Microphone, then refresh.',
            ].join('\n');
            alert(message);
            return false;
        }
    }
    // Raw RMS, no threshold subtraction. Used by the diagnostic meter so
    // visitors see ANY sound (including breathing) as movement — confirming
    // the mic and analyser are alive.
    function getVolumeRaw() {
        if (!analyser) return 0;
        analyser.getFloatTimeDomainData(timeDomainData);
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) sum += timeDomainData[i] * timeDomainData[i];
        return Math.sqrt(sum / timeDomainData.length);
    }
    function getVolume() {
        const rms = getVolumeRaw();
        return Math.max(0, Math.min(1, (rms - CONFIG.volumeThreshold) / (CONFIG.volumeMax - CONFIG.volumeThreshold)));
    }

    // ---- Live mic-level meter on the player wait screen ----
    // Runs independently of the game-state render loop so the player can
    // verify "yes, the room hears me" *before* the host starts the round.
    //
    // Important side-effect: this is also the AudioContext keep-alive. When
    // multiple browser tabs/windows share one physical mic, Chrome happily
    // suspends the AudioContext of any tab it considers backgrounded — and
    // a suspended context returns ALL-ZERO buffers from getFloatTimeDomainData
    // even though the mic permission says "Using now". That's the root
    // cause of the "host shows 0% even when players are speaking" bug. So
    // every interval tick, if state isn't 'running', we try resume(). This
    // is cheap (no-op when already running) and silently no-ops on failure.
    let micMeterInterval = null;
    function startMicMeter() {
        if (micMeterInterval) return;
        micMeterInterval = setInterval(() => {
            // Keep-alive: nudge the context back to running if Chrome
            // suspended it (typically because the tab/window was in the
            // background). resume() is async but we don't await — fire
            // and forget; the next tick will see the updated state.
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            const bar = document.getElementById('micMeterFill');
            const status = document.getElementById('micMeterStatus');
            if (!bar) return;
            if (!analyser || (audioCtx && audioCtx.state !== 'running')) {
                bar.style.width = '0%';
                if (status) status.textContent = audioCtx ? `mic ${audioCtx.state}` : 'no mic';
                return;
            }
            const raw = getVolumeRaw();
            const pct = Math.min(100, Math.round(raw * 600));
            bar.style.width = pct + '%';
            if (status) status.textContent = pct < 2 ? 'silent' : pct < 12 ? 'listening…' : pct < 40 ? 'good signal' : 'loud';

            // Mirror status onto the in-HUD transmitting pill (visible
            // during play, so the player can SEE their volume is being
            // sent to the server even while their wait screen is hidden).
            const tx = document.getElementById('hudTransmit');
            const txFill = document.getElementById('hudTransmitFill');
            const txStat = document.getElementById('hudTransmitStat');
            if (tx) {
                tx.classList.toggle('hidden', !(myRole && myRole !== 'host'));
                if (txFill) txFill.style.width = pct + '%';
                if (txStat) txStat.textContent =
                    audioCtx && audioCtx.state !== 'running' ? `mic ${audioCtx.state}`
                  : pct < 2 ? 'silent'
                  : pct < 12 ? 'listening…'
                  : pct < 40 ? 'transmitting'
                  : 'transmitting · loud';
            }
        }, 90);
    }
    function stopMicMeter() {
        if (micMeterInterval) { clearInterval(micMeterInterval); micMeterInterval = null; }
    }

    // ---- WebSocket ----
    // Connection-status indicator + outgoing message queue.
    // The previous send() silently dropped messages when ws.readyState !== 1
    // (OPEN). That's the bug that made the "Start as Host" button look dead
    // whenever the user clicked before the WS handshake finished or after
    // the server had died. Now: track the state, surface it on screen, and
    // queue messages while CONNECTING so they fire the moment we're open.
    const connStatus = document.getElementById('connStatus');
    const connStatusText = document.getElementById('connStatusText');
    let pendingSends = [];          // [{msg, queuedAt}] — replayed on open
    let lastWsState = 'connecting'; // 'connecting' | 'open' | 'closed'

    function setConnStatus(state) {
        if (state === lastWsState) return;
        lastWsState = state;
        if (!connStatus) return;
        connStatus.classList.toggle('conn-status--connecting', state === 'connecting');
        connStatus.classList.toggle('conn-status--open',       state === 'open');
        connStatus.classList.toggle('conn-status--closed',     state === 'closed');
        if (connStatusText) {
            connStatusText.textContent =
                state === 'open'       ? 'Connected'
              : state === 'connecting' ? 'Connecting…'
              :                          'Server unreachable';
        }
    }

    function connectWS() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        setConnStatus('connecting');
        ws = new WebSocket(`${protocol}//${location.host}`);
        ws.onopen = () => {
            console.log('WS open');
            setConnStatus('open');
            // Drain queued sends. Each entry decides on its own whether it's
            // still relevant via shouldReplayPendingSend() (defined below).
            const now = Date.now();
            const drained = pendingSends;
            pendingSends = [];
            for (const item of drained) {
                if (shouldReplayPendingSend(item.msg, now - item.queuedAt)) {
                    try { ws.send(JSON.stringify(item.msg)); } catch (e) { console.warn(e); }
                } else {
                    console.log('Dropped stale queued message:', item.msg);
                }
            }
        };
        ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
        ws.onclose = () => {
            console.log('WS closed');
            setConnStatus('closed');
            setTimeout(connectWS, 2000);
        };
        ws.onerror = (e) => console.error('WS error:', e);
    }

    // Sends a message to the server.
    //   - If WS is OPEN → send immediately.
    //   - If WS is CONNECTING → queue, will be drained in onopen.
    //   - If WS is CLOSED/CLOSING → queue and trigger an early reconnect.
    function send(msg) {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify(msg));
            return;
        }
        // Not open yet — queue and let onopen replay (or drop, depending on
        // shouldReplayPendingSend()).
        pendingSends.push({ msg, queuedAt: Date.now() });
    }

    // ─────────────────────────────────────────────────────────────────────
    // DECISION POINT (this is the bit I'd like you to write — see chat).
    // Should a click that was queued `ageMs` milliseconds ago still fire
    // when the WebSocket finally connects?
    //
    // @param {object} msg     the queued message, e.g. {type:'join', role:'host'}
    // @param {number} ageMs   how long ago it was queued, in milliseconds
    // @returns {boolean}      true → replay; false → drop
    //
    // TODO: replace the body with your policy. The default below replays
    // everything regardless of age (simplest, most surprising on stale clicks).
    // ─────────────────────────────────────────────────────────────────────
    function shouldReplayPendingSend(msg, ageMs) {
        return true;
    }

    // ---- Message Handling ----
    function handleMessage(msg) {
        switch (msg.type) {
            case 'assigned':
                myRole = msg.role;
                // Per-player UI setup; screen routing is decided by the next 'state' broadcast
                // (which is always sent right after 'assigned' on the server side).
                if (myRole !== 'host') {
                    playerColorLabel.textContent = myRole.toUpperCase();
                    playerColorLabel.className = 'color-label ' + myRole;
                    waitPulse.className = 'pulse-ring ' + myRole;
                }
                break;
            case 'state': updateFromState(msg); break;
            case 'frame': updateFrame(msg); break;
            case 'success': handleSuccess(msg); break;
            case 'clear_fill': clearPaintCanvas(); break;
            case 'error': alert(msg.message); break;
        }
    }

    // Track the previous broadcast values so we can auto-clear the Fill
    // paint canvas on the right transitions: mode changes (live ↔ accumulate)
    // and round-index changes (a new round should start with a clean room).
    let prevGameMode  = null;
    let prevRoundIdx  = null;
    let prevPhase     = null;

    function updateFromState(s) {
        gameMode = s.mode || 'live';
        experienceStage = s.experienceStage || 'dead-room';
        currentPhase = s.phase || currentPhase;

        // Auto-clear the paint canvas on mode change OR new round start.
        // Without this, paint from a previous Fill round would linger when
        // the host re-picks a mode or starts a fresh round.
        if (prevGameMode !== null && prevGameMode !== gameMode) clearPaintCanvas();
        if (prevRoundIdx !== null && prevRoundIdx !== s.roundIndex) clearPaintCanvas();
        if (prevPhase === 'lobby' && s.phase === 'playing') clearPaintCanvas();
        prevGameMode = gameMode;
        prevRoundIdx = s.roundIndex;
        prevPhase    = s.phase;

        // Host lobby: show the server-picked Recommended URL in big text,
        // and list the other detected addresses underneath with markers
        // (virtual / secondary). Recommended URL also drives the /health
        // and /connect-test diagnostic links so a host can copy any of
        // them straight onto a phone.
        if (myRole === 'host') {
            const port = s.serverPort || 8080;
            const recURL = s.recommendedURL || null;
            if (lobbyRecommendedUrl) {
                lobbyRecommendedUrl.textContent = recURL
                    || 'no LAN address — use an HTTPS tunnel (see below)';
                lobbyRecommendedUrl.classList.toggle('lobby-recommended-url--missing', !recURL);
            }
            if (lobbyHealthLink && recURL)      lobbyHealthLink.href      = recURL + '/health';
            if (lobbyConnectTestLink && recURL) lobbyConnectTestLink.href = recURL + '/connect-test';

            if (lobbyNetworkList && Array.isArray(s.serverIPs)) {
                const others = s.serverIPs.filter(ip => !ip.recommended);
                if (others.length === 0) {
                    lobbyNetworkList.innerHTML =
                        '<li class="lobby-network-empty">no other addresses detected</li>';
                } else {
                    lobbyNetworkList.innerHTML = others.map(ip => {
                        const tag = ip.isVirtual
                            ? '<span class="lobby-network-tag lobby-network-tag--virtual">virtual / host-only</span>'
                            : '<span class="lobby-network-tag lobby-network-tag--secondary">secondary</span>';
                        return `<li><code>http://${ip.address}:${port}</code>` +
                               ` <span class="lobby-network-iface">(${ip.name})</span> ${tag}</li>`;
                    }).join('');
                }
            }
        }
        connectedPlayers = Array.isArray(s.connectedPlayers) ? s.connectedPlayers : [];
        playersInfo      = Array.isArray(s.players)          ? s.players          : [];
        // Mirror this client's assigned zone back into the local myZone +
        // zone-picker highlight, so the player sees their default zone
        // (e.g. A for Red) immediately after joining without tapping.
        if (myRole && myRole !== 'host') {
            const me = playersInfo.find(p => p.role === myRole);
            if (me && ZONES.includes(me.zone) && me.zone !== myZone) {
                myZone = me.zone;
                zoneButtons.forEach(b => b.classList.toggle('active', b.dataset.zone === myZone));
            }
        }
        // Read each role's target normalised position from the broadcast.
        // The render loop lerps smoothedPositions toward these each frame
        // so the projection glides rather than snapping (Task B).
        for (const p of playersInfo) {
            if (p.position && Number.isFinite(p.position.x) && Number.isFinite(p.position.y)) {
                targetPositions[p.role] = { x: p.position.x, y: p.position.y };
            }
        }
        computeMixCenter();

        // Update mode buttons in lobby
        modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === gameMode));

        // Update mixing box class
        mixingBox.classList.toggle('accumulate-mode', gameMode === 'accumulate');

        // Mode badge
        modeBadgeIcon.textContent = gameMode === 'accumulate' ? '🫧' : '⚡';
        modeBadgeName.textContent = gameMode === 'accumulate' ? 'Fill Mode' : 'Live Mix';

        // Player mode hint
        if (playerModeHint) {
            playerModeHint.textContent = gameMode === 'accumulate'
                ? 'Fill Mode — move and make sound. Your colour stays in the room as a trace.'
                : 'Live Mix — make sound now. The room shows the live balance of your voices.';
        }

        // Lobby slots — iterate ROLES. Guard against missing DOM in case
        // the HTML hasn't been updated yet.
        ROLES.forEach(c => {
            const slot = lobbySlots[c];
            if (!slot) return;
            const connected = s.connectedPlayers.includes(c);
            slot.classList.toggle('connected', connected);
            const stateEl = slot.querySelector('.lobby-state');
            if (stateEl) stateEl.textContent = connected ? 'Connected!' : 'Waiting...';
        });

        // Role cards
        roleCards.forEach(card => {
            const role = card.dataset.role, avail = s.availableRoles.includes(role);
            card.disabled = !avail; card.classList.toggle('taken', !avail);
            card.querySelector('.role-status').textContent = avail ? 'Available' : 'Taken';
        });

        // Start button
        if (btnStartRound) {
            const has = s.connectedPlayers.length > 0; btnStartRound.disabled = !has;
            const hint = document.getElementById('lobbyHint');
            if (hint) hint.textContent = has ? `${s.connectedPlayers.length}/3 players connected` : 'At least one player must join';
        }

        // Stage-aware routing. The outer museum walkthrough decides which screen we're on.
        // Only inside the 'dead-room' stage does the inner phase machine choose the screen.
        // Important: until the user has chosen a role (host or player) on the Landing
        // screen, we do NOT auto-route. The server's default stage is 'waiting-room',
        // so without this guard the Landing screen would be replaced before the visitor
        // ever sees the host/join choice.
        const stageToolbarShouldShow = myRole === 'host' && experienceStage === 'dead-room';
        stageToolbar.classList.toggle('hidden', !stageToolbarShouldShow);
        stageToolbarBtns.forEach(b => b.classList.toggle('active', b.dataset.stage === experienceStage));
        toggleHostStageControls();

        if (!myRole) {
            // No role yet — keep them on the Landing screen so they can choose.
        } else if (experienceStage === 'waiting-room') {
            showGameHud(false); stopRenderLoop();
            showScreen('waitingRoom');
        } else if (experienceStage === 'threshold') {
            showGameHud(false); stopRenderLoop();
            showScreen('threshold');
        } else if (experienceStage === 'archive') {
            showGameHud(false); stopRenderLoop();
            showScreen('archive');
        } else {
            // experienceStage === 'dead-room' — original phase routing
            if (s.phase === 'playing') {
                showScreen('none'); showGameHud(true, s); startRenderLoop();
            } else if (s.phase === 'lobby') {
                showGameHud(false);
                if (myRole === 'host') showScreen('lobby');
                else if (myRole) showScreen('playerWait');
                // Host: keep the render loop alive across lobby ↔ playing
                // transitions so R/G/B keyboard tests are immediately
                // visible even before the round starts. Cheap when silent
                // (no particles, no rings). Players still stop their loop
                // in the lobby to avoid bandwidth/CPU on phones.
                if (myRole === 'host') startRenderLoop();
                else stopRenderLoop();
            }
        }

        // Round library: keep the HUD's data-kind in sync, fill the instruction strip,
        // and decide whether the host's "End round" button is relevant.
        if (s.round) {
            currentRound = s.round;
            gameHud.dataset.kind = currentRound.kind;
            if (roundKindTag) roundKindTag.textContent = KIND_LABELS[currentRound.kind] || currentRound.kind;
            if (roundInstructionText) roundInstructionText.textContent = currentRound.instruction || '';
        }
        if (btnEndRound) {
            const showEnd = myRole === 'host'
                && experienceStage === 'dead-room'
                && s.phase === 'playing'
                && currentRound && currentRound.kind !== 'mix';
            btnEndRound.classList.toggle('hidden', !showEnd);
        }
        // Host-only HUD exit button — always visible to the host inside the
        // dead-room stage, so they're never trapped in a round.
        if (btnHudExit) {
            const showExit = myRole === 'host' && experienceStage === 'dead-room';
            btnHudExit.classList.toggle('hidden', !showExit);
        }
        // Host-only "Back to lobby" — only meaningful when something is
        // actually in flight (playing or success). In the lobby it would be
        // a no-op.
        if (btnBackToLobby) {
            const showBack = myRole === 'host'
                && experienceStage === 'dead-room'
                && (s.phase === 'playing' || s.phase === 'success');
            btnBackToLobby.classList.toggle('hidden', !showBack);
        }
        // Host-only "Clear Fill" — only meaningful in Fill Mode, while a
        // round is actually painting. Hidden in Live Mix where there's no
        // accumulation to clear.
        if (btnClearFill) {
            const showClear = myRole === 'host'
                && experienceStage === 'dead-room'
                && gameMode === 'accumulate'
                && (s.phase === 'playing' || s.phase === 'success');
            btnClearFill.classList.toggle('hidden', !showClear);
        }
        // "No players connected" hint — only the host needs to see it, and
        // only when a round is actually trying to play with zero phones.
        if (hudEmptyHint) {
            const showHint = myRole === 'host'
                && experienceStage === 'dead-room'
                && s.phase === 'playing'
                && connectedPlayers.length === 0;
            hudEmptyHint.classList.toggle('hidden', !showHint);
        }
        // Zone picker — visitor-side ONLY, and ONLY during Move Echo. Hidden
        // every other moment so onboarding doesn't feel like a sign-up form
        // and Solo/Mix/Silent rounds aren't cluttered with position controls.
        if (hudZonePicker) {
            const showPicker = !!myRole && myRole !== 'host'
                && experienceStage === 'dead-room'
                && s.phase === 'playing'
                && currentRound && currentRound.kind === 'move';
            hudZonePicker.classList.toggle('hidden', !showPicker);
        }
        // Phone touchpad — visitor-side ONLY, visible whenever the visitor
        // is inside the Dead Room (lobby or playing) so they can preview
        // their position before the round AND adjust it mid-round.
        if (phoneTouchpad) {
            const showTouchpad = !!myRole && myRole !== 'host'
                && experienceStage === 'dead-room';
            phoneTouchpad.classList.toggle('hidden', !showTouchpad);
            if (showTouchpad) updateTouchpadDot();
        }

        if (s.target) updateTargetDisplay(s.target, s.roundIndex, s.totalRounds);
    }

    function toggleHostStageControls() {
        const isHost = myRole === 'host';
        hostWaitingControls.classList.toggle('hidden', !isHost);
        hostThresholdControls.classList.toggle('hidden', !isHost);
        hostArchiveControls.classList.toggle('hidden', !isHost);
        // Hints — role-aware so the host knows they hold the advance button.
        const wHint = document.getElementById('waitingHint');
        const tHint = document.getElementById('thresholdHint');
        const aHint = document.getElementById('archiveHint');
        if (wHint) wHint.textContent = isHost
            ? 'You are the host — open the doors when the group is ready.'
            : 'Waiting for the host to begin…';
        if (tHint) tHint.textContent = isHost
            ? 'Lead the group inside when everyone is ready.'
            : 'Waiting for the host…';
        if (aHint) aHint.textContent = isHost
            ? 'Thank visitors and start a new session when ready.'
            : 'Thank you for visiting the Dead Room.';
    }

    // Throttle for debug-gated frame log so we don't spam 30 lines per second.
    let lastFrameLogAt = 0;
    function updateFrame(f) {
        gameMode = f.mode || gameMode;
        const kind = f.kind || (currentRound && currentRound.kind) || 'mix';
        lastFrameAt = performance.now();  // for the debug panel's "last frame: Xms ago"
        // Ingest per-role positions from the frame stream — this is the
        // high-frequency channel for touchpad drags. The render loop lerps
        // smoothedPositions toward these so movement looks continuous.
        if (f.positions) {
            for (const role of ROLES) {
                const p = f.positions[role];
                if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
                    targetPositions[role] = { x: p.x, y: p.y };
                }
            }
        }
        if (debugVisible && lastFrameAt - lastFrameLogAt > 1000) {
            lastFrameLogAt = lastFrameAt;
            console.log('[frame] kind=' + kind + ' volumes=', f.volumes,
                ' currentMix=', f.currentMix,
                ' simulated=', { ...simulatedVolumes },
                ' particles=' + activeParticles.length,
                ' rings=' + activeRings.length);
        }

        for (const c of ROLES) {
            const t = (f.volumes && f.volumes[c]) || 0;
            smoothVolumes[c] += (t - smoothVolumes[c]) * 0.2;
        }

        // Raw-volume bars (visual liveness: "yes, you're heard").
        const rv = Math.round(smoothVolumes.red * 100);
        const gv = Math.round(smoothVolumes.green * 100);
        const bv = Math.round(smoothVolumes.blue * 100);
        barRed.style.width   = rv + '%';
        barGreen.style.width = gv + '%';
        barBlue.style.width  = bv + '%';
        barRedVal.textContent   = rv + '%';
        barGreenVal.textContent = gv + '%';
        barBlueVal.textContent  = bv + '%';

        // Live contribution % — each role's share of the total raw volume
        // across all three colours. "— of mix" while everyone is silent.
        const totalRaw = rv + gv + bv;
        for (const role of ROLES) {
            const el = shareEls[role];
            if (!el) continue;
            if (totalRaw < 1) { el.textContent = '— of mix'; continue; }
            const myRaw = role === 'red' ? rv : role === 'green' ? gv : bv;
            const pct = Math.round((myRaw / totalRaw) * 100);
            el.textContent = pct + '% of mix';
        }

        // Mix-only: target box, mixing fill, match-progress border. CSS hides these
        // elements for other kinds, but skipping the DOM writes avoids flicker too.
        if (kind !== 'mix') return;

        const mix = f.currentMix;
        mixR.textContent = mix.r; mixG.textContent = mix.g; mixB.textContent = mix.b;

        const mr = Math.round((mix.r / 100) * 255), mg = Math.round((mix.g / 100) * 255), mb = Math.round((mix.b / 100) * 255);

        if (gameMode === 'accumulate') {
            // In accumulate mode, the fill is always visible once there's any accumulated color
            const fillOp = mix.total > 0.01 ? Math.min(0.85, 0.3 + mix.total * 0.1) : 0;
            mixingFill.style.backgroundColor = `rgba(${mr},${mg},${mb},${fillOp.toFixed(2)})`;
        } else {
            const fillOp = Math.min(0.7, mix.total * 0.3 + 0.1);
            mixingFill.style.backgroundColor = `rgba(${mr},${mg},${mb},${fillOp.toFixed(2)})`;
        }

        const matchPct = Math.round((f.matchTimer / f.matchRequired) * 100);
        matchProgressBar.style.width = matchPct + '%';

        if (matchPct > 30) {
            mixingBox.style.borderColor = `rgba(51,255,136,${(matchPct / 200).toFixed(2)})`;
            mixingBox.style.boxShadow = `0 0 ${matchPct / 2}px rgba(51,255,136,${(matchPct / 400).toFixed(2)})`;
        } else {
            mixingBox.style.borderColor = gameMode === 'accumulate' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)';
            mixingBox.style.boxShadow = gameMode === 'accumulate' ? 'inset 0 0 30px rgba(0,0,0,0.5)' : 'none';
        }
        // HUD mix bar (replaces the central mixing-box readout). Three
        // segments side-by-side, widths proportional to each colour's share
        // of the live mix; segments stay coloured so the visitor can read
        // balance at a glance from anywhere in the room. Match progress
        // shows as a slim green bar below.
        if (hudMixSegR && hudMixSegG && hudMixSegB) {
            hudMixSegR.style.width = mix.r + '%';
            hudMixSegG.style.width = mix.g + '%';
            hudMixSegB.style.width = mix.b + '%';
        }
        if (hudMatchProgressBar) {
            hudMatchProgressBar.style.width = matchPct + '%';
        }
    }

    function handleSuccess(msg) {
        showScreen('success'); showGameHud(false); stopRenderLoop();
        successColorName.textContent = msg.color.name;
        const r = Math.round((msg.color.r / 100) * 255), g = Math.round((msg.color.g / 100) * 255), b = Math.round((msg.color.b / 100) * 255);
        successSwatch.style.background = `rgb(${r},${g},${b})`;
        successSwatch.style.boxShadow = `0 0 60px rgba(${r},${g},${b},0.4)`;
        if (myRole === 'host') {
            btnNextRound.style.display = 'inline-flex';
            btnNextRound.querySelector('.btn-text').textContent = msg.hasNext ? 'Next Color →' : 'Play Again →';
            successHint.textContent = '';
        } else { btnNextRound.style.display = 'none'; successHint.textContent = 'Waiting for host to continue...'; }
    }

    // Update the centre target swatch. SAFE for null target — non-mix rounds
    // (solo / move / silent) have no target colour to paint, so we dim the
    // swatch and label it as a listening round instead of dereferencing null.
    // (Previously this threw on solo/move/silent, which is why startRenderLoop
    // was never reached for non-mix rounds and the projection looked frozen.)
    function updateTargetDisplay(target, idx, total) {
        roundNum.textContent = (idx || 0) + 1;
        roundTotal.textContent = total || 0;
        if (!target) {
            targetSwatch.style.background = 'transparent';
            targetSwatch.style.boxShadow = 'none';
            targetSwatch.style.opacity = '0.25';
            targetName.textContent = 'No target — listening round';
            targetR.textContent = '—';
            targetG.textContent = '—';
            targetB.textContent = '—';
            return;
        }
        const r = Math.round((target.r / 100) * 255);
        const g = Math.round((target.g / 100) * 255);
        const b = Math.round((target.b / 100) * 255);
        targetSwatch.style.background = `rgb(${r},${g},${b})`;
        targetSwatch.style.opacity = '1';
        targetName.textContent = target.name;
        targetR.textContent = target.r;
        targetG.textContent = target.g;
        targetB.textContent = target.b;
    }

    // ---- Screen Management ----
    const screens = [screenLanding, screenRoles, screenLobby, screenPlayerWait, screenSuccess,
                     screenWaitingRoom, screenThreshold, screenArchive];
    function showScreen(name) {
        screens.forEach(s => s.classList.remove('active'));
        const map = {
            landing: screenLanding, roles: screenRoles, lobby: screenLobby,
            playerWait: screenPlayerWait, success: screenSuccess,
            waitingRoom: screenWaitingRoom, threshold: screenThreshold, archive: screenArchive,
        };
        if (map[name]) map[name].classList.add('active');
    }
    function showGameHud(visible, state) {
        gameHud.classList.toggle('hidden', !visible);
        if (visible && state) {
            // Wrapped: a future bug in updateTargetDisplay (or any helper it
            // calls) must NOT block the render loop start that follows this
            // call. Catching here is cheap and the user will see the
            // exception in the console; the canvas stays alive.
            try { updateTargetDisplay(state.target, state.roundIndex, state.totalRounds); }
            catch (e) { console.error('updateTargetDisplay failed:', e); }
        }
    }

    // ---- Render Loop ----
    function startRenderLoop() { if (!animationId) render(); }
    function stopRenderLoop() { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }

    function render() {
        animationId = requestAnimationFrame(render);
        const w = window.innerWidth, h = window.innerHeight;
        time += 0.016;
        // Trail fade. Mode-driven — Live Mix fades fast (room becomes
        // quiet quickly), Fill Mode fades slowly (sound leaves traces).
        const mc = getModeConfig();
        ctx.fillStyle = `rgba(5,5,8,${mc.trailAlpha})`;
        ctx.fillRect(0, 0, w, h);

        if (myRole && myRole !== 'host') {
            // Defensive resume in case the keep-alive interval was lost.
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            const vol = getVolume();
            send({ type: 'volume', level: vol });
        }

        // ---- Position lerp + velocity (Doppler-inspired motion state) ----
        // Glide smoothedPositions toward targetPositions and, while we have
        // the previous smoothed values in hand, derive each role's velocity
        // in SCREEN px/frame. The velocity is itself lerp-smoothed so it
        // stays useful through small touchpad corrections rather than
        // twitching back to zero between drags.
        const lerpRate = CONFIG.positionLerpRate;
        for (const role of ROLES) {
            const t = targetPositions[role];
            const s = smoothedPositions[role];
            // Cache the smoothed value BEFORE the lerp so we can diff it.
            const prev = prevSmoothedPositions[role];
            prev.x = s.x; prev.y = s.y;
            s.x += (t.x - s.x) * lerpRate;
            s.y += (t.y - s.y) * lerpRate;
            sourcePositions[role] = getScreenPositionFromNormalised(s);
            // Velocity in SCREEN units (px/frame), via the previous → current
            // smoothed delta projected through getScreenPositionFromNormalised.
            const prevScreen = getScreenPositionFromNormalised(prev);
            let dvx = sourcePositions[role].x - prevScreen.x;
            let dvy = sourcePositions[role].y - prevScreen.y;
            // Safety clamp on huge jumps (target snapping, window resize).
            const mag = Math.sqrt(dvx * dvx + dvy * dvy);
            if (mag > VELOCITY_MAX_PX_PER_FRAME) {
                const k = VELOCITY_MAX_PX_PER_FRAME / mag;
                dvx *= k; dvy *= k;
            }
            // Smooth the velocity itself so a single-frame jitter doesn't
            // flip the motion direction.
            const v = roleVelocityScreen[role];
            v.x += (dvx - v.x) * VELOCITY_SMOOTH;
            v.y += (dvy - v.y) * VELOCITY_SMOOTH;
        }

        // ---- Paint canvas (Fill Mode memory layer) ----
        // In Fill Mode: stamp each speaking source's colour onto the
        // dedicated paint canvas. It persists across frames so movement
        // leaves visible coloured paths.
        // In Live Mix: don't stamp; instead, slowly erase any leftover
        // paint from a previous Fill round so Live looks clean.
        if (mc.paintField) {
            for (const role of ROLES) {
                const src = sourcePositions[role];
                if (!src) continue;
                const vol = Math.max(smoothVolumes[role] || 0, simulatedVolumes[role] || 0);
                if (vol < CONFIG.volumeThresholdVisual) continue;
                stampPaint(src.x, src.y, COLORS[role], vol);
            }
        } else {
            // Soft destination-out to clear lingering paint over a few seconds.
            fadePaintCanvas(0.04);
        }

        // ────────────────────────────────────────────────────────────────
        // EVERYTHING THAT BELONGS INSIDE THE ROOM goes inside this clip.
        // The paint canvas, rings, particles, source clouds, collision
        // bursts — all clipped to the room rectangle. Effects can no
        // longer leak across the whole projection.
        // ────────────────────────────────────────────────────────────────
        ctx.save();
        drawRoomPath(ctx);
        ctx.clip();

        // Paint canvas (Fill Mode memory) — clipped means stamps near the
        // room edge are masked at the boundary even if their gradients
        // would otherwise reach further.
        ctx.drawImage(paintCanvas, 0, 0, window.innerWidth, window.innerHeight);

        // Per-role anchors + emitters.
        for (const color of ROLES) {
            const src = sourcePositions[color];
            if (!src) continue;
            const realVol = smoothVolumes[color] || 0;
            const simVol  = simulatedVolumes[color] || 0;
            const vol = Math.max(realVol, simVol);
            const isConnected = connectedPlayers.includes(color) || simVol > 0;

            if (isConnected) drawSourceDot(src.x, src.y, vol, color, true);

            if (vol >= CONFIG.volumeThresholdVisual) {
                drawSourceCloud(src.x, src.y, vol, color);
                maybeSpawnRing(color, src, vol);
                spawnSoundParticles(color, vol, src);
            }

            if (isConnected && debugVisible) drawSourceLabel(src.x, src.y, color, true);
        }

        // Rings, particles, collision bursts — all inside the clip.
        updateRings();
        drawRings();
        updateParticles();
        // Collision detection runs AFTER particle update so positions are
        // current. Bursts are spawned outside the clip would still draw
        // here because we run drawCollisionBursts() inside this region.
        detectCollisions();
        updateCollisionBursts();
        drawCollisionBursts();
        drawParticles();

        ctx.restore();
        // The boundary itself draws AFTER the clip restore so the stroke
        // sits crisply on top of any colour bleeding to the edge.
        drawRoomBoundary();

        // Centre region. Mode-specific:
        //   • Fill Mode: broad, soft accumulation field — "the room remembers"
        //   • Live Mix:  nothing on canvas; the HUD mix bar shows balance
        const mix = {
            r: parseInt(mixR.textContent) || 0, g: parseInt(mixG.textContent) || 0,
            b: parseInt(mixB.textContent) || 0, total: smoothVolumes.red + smoothVolumes.green + smoothVolumes.blue
        };
        if (gameMode === 'accumulate') drawAccumulationField(mix);

        // Debug panel refresh (cheap — only DOM writes if visible).
        if (debugVisible) renderDebugPanel();
    }

    // ---- Events ----
    btnHost.addEventListener('click', () => { send({ type: 'join', role: 'host' }); lobbyUrl.textContent = location.href; });
    btnJoin.addEventListener('click', () => showScreen('roles'));   // direct to colour pick
    btnBackToLanding.addEventListener('click', () => showScreen('landing'));

    // ---- Zone picker wiring ----
    // The picker now lives inside #gameHud and is only displayed during the
    // Move Echo round (visitor side). Same .zone-btn class, same handlers.
    function applyZone(zone) {
        if (!ZONES.includes(zone)) return;
        myZone = zone;
        zoneButtons.forEach(b => b.classList.toggle('active', b.dataset.zone === zone));
        if (myRole && myRole !== 'host') send({ type: 'set_zone', zone });
    }
    zoneButtons.forEach(b => b.addEventListener('click', () => applyZone(b.dataset.zone)));

    // ---- Phone touchpad (manual tracking prototype) ----
    // Visitor drags the dot inside the rectangle. We update the local
    // dot immediately (so it feels responsive), update targetPositions
    // locally (so the host's projection on this tab moves immediately
    // even before the server frame echoes back), and throttle the
    // outgoing set_position messages to ~10 Hz so the WS doesn't get
    // hammered by per-pointer-event sends.
    let touchpadDragging = false;
    let lastSetPositionAt = 0;
    function emitTouchpadPosition(clientX, clientY) {
        if (!touchpadArea || !myRole || myRole === 'host') return;
        const rect = touchpadArea.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top)  / rect.height));
        // Update local target so the projection here glides immediately.
        targetPositions[myRole] = { x, y };
        updateTouchpadDot();
        // Throttled WS send. Final position on pointerup is sent
        // separately so a quick tap-and-release isn't lost.
        const now = performance.now();
        if (now - lastSetPositionAt > 90) {
            lastSetPositionAt = now;
            send({ type: 'set_position', x, y });
        }
    }
    function updateTouchpadDot() {
        if (!touchpadDot || !myRole || myRole === 'host') return;
        const p = targetPositions[myRole] || { x: 0.5, y: 0.5 };
        touchpadDot.style.left = (p.x * 100) + '%';
        touchpadDot.style.top  = (p.y * 100) + '%';
        const c = COLORS[myRole];
        if (c) {
            touchpadDot.style.background = `rgb(${c.r},${c.g},${c.b})`;
            touchpadDot.style.boxShadow  = `0 0 14px rgb(${c.r},${c.g},${c.b})`;
        }
    }
    if (touchpadArea) {
        touchpadArea.addEventListener('pointerdown', e => {
            if (!myRole || myRole === 'host') return;
            try { touchpadArea.setPointerCapture(e.pointerId); } catch (_) {}
            touchpadDragging = true;
            emitTouchpadPosition(e.clientX, e.clientY);
        });
        touchpadArea.addEventListener('pointermove', e => {
            if (!touchpadDragging) return;
            emitTouchpadPosition(e.clientX, e.clientY);
        });
        const endDrag = e => {
            if (!touchpadDragging) return;
            touchpadDragging = false;
            // Send final position unthrottled so a quick tap commits.
            const rect = touchpadArea.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height));
            targetPositions[myRole] = { x, y };
            updateTouchpadDot();
            send({ type: 'set_position', x, y });
        };
        touchpadArea.addEventListener('pointerup', endDrag);
        touchpadArea.addEventListener('pointercancel', endDrag);
    }

    roleCards.forEach(card => {
        card.addEventListener('click', async () => {
            if (card.disabled) return;
            const ok = await initAudio(); if (!ok) return;
            // No name / sound-role any more — the museum-flow simplification
            // removed those upfront questions. Zone is omitted too so the
            // server falls back to the role-default (Red→A, Green→B, Blue→C).
            send({ type: 'join', role: card.dataset.role });
        });
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            send({ type: 'set_mode', mode: btn.dataset.mode });
        });
    });

    btnStartRound.addEventListener('click', () => send({ type: 'start_round' }));
    btnNextRound.addEventListener('click', () => send({ type: 'next_round' }));
    btnEndRound.addEventListener('click', () => send({ type: 'end_round' }));

    // Waiting Room "← Back to start" — drop role + reconnect to land on Landing.
    function exitToLanding() {
        myRole = null;
        stopMicMeter();
        if (ws) ws.close();  // server cleans up via its on('close') handler
        showGameHud(false);
        stopRenderLoop();
        showScreen('landing');
    }
    btnWaitingBack.addEventListener('click', exitToLanding);
    btnHudExit.addEventListener('click', exitToLanding);
    btnPlayerBack.addEventListener('click', exitToLanding);
    btnBackToLobby.addEventListener('click', () => send({ type: 'back_to_lobby' }));
    // Clear Fill — clear locally for snappy feedback, then ask the server
    // to broadcast a clear_fill event so every other projection clears too.
    if (btnClearFill) {
        btnClearFill.addEventListener('click', () => {
            clearPaintCanvas();
            send({ type: 'clear_fill' });
        });
    }

    // Museum walkthrough — stage transitions (host only; server enforces the role check too)
    btnAdvanceToThreshold.addEventListener('click', () => send({ type: 'set_stage', stage: 'threshold' }));
    btnAdvanceToDeadRoom.addEventListener('click', () => send({ type: 'set_stage', stage: 'dead-room' }));
    btnBackToWaiting.addEventListener('click', () => send({ type: 'set_stage', stage: 'waiting-room' }));
    btnArchiveNewSession.addEventListener('click', () => send({ type: 'set_stage', stage: 'waiting-room' }));
    stageToolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => send({ type: 'set_stage', stage: btn.dataset.stage }));
    });

    // ---- Debug overlay (Task D) ----
    // Visible only when the user presses D on the host/projection page.
    // Plain HTML+CSS panel — no canvas drawing — so it overlays naturally.
    const dbgElems = {
        role:      document.getElementById('dbgRole'),
        phase:     document.getElementById('dbgPhase'),
        round:     document.getElementById('dbgRound'),
        connected: document.getElementById('dbgConnected'),
        volumes:   document.getElementById('dbgVolumes'),
        sims:      document.getElementById('dbgSims'),
        particles: document.getElementById('dbgParticles'),
        rings:     document.getElementById('dbgRings'),
        lastFrame: document.getElementById('dbgLastFrame'),
        panel:     document.getElementById('debugPanel'),
    };
    function renderDebugPanel() {
        if (!dbgElems.panel) return;
        const fmt = v => (Math.max(0, Math.min(1, v)) * 100).toFixed(0).padStart(3, ' ') + '%';
        const cnt = { red: 0, green: 0, blue: 0 };
        for (const p of activeParticles) cnt[p.role] = (cnt[p.role] || 0) + 1;
        dbgElems.role.textContent      = myRole || '—';
        dbgElems.phase.textContent     = currentPhase + ' / ' + experienceStage;
        dbgElems.round.textContent     = currentRound ? `${currentRound.kind} · ${currentRound.title}` : '—';
        dbgElems.connected.textContent = connectedPlayers.length ? connectedPlayers.join(', ') : 'none';
        dbgElems.volumes.textContent   = `${fmt(smoothVolumes.red)} / ${fmt(smoothVolumes.green)} / ${fmt(smoothVolumes.blue)}`;
        dbgElems.sims.textContent      = `${fmt(simulatedVolumes.red)} / ${fmt(simulatedVolumes.green)} / ${fmt(simulatedVolumes.blue)}`;
        dbgElems.particles.textContent = `R=${cnt.red}  G=${cnt.green}  B=${cnt.blue}  total=${activeParticles.length}`;
        dbgElems.rings.textContent     = String(activeRings.length);
        dbgElems.lastFrame.textContent = lastFrameAt
            ? `${Math.round(performance.now() - lastFrameAt)}ms ago`
            : 'never';
    }
    function toggleDebug() {
        debugVisible = !debugVisible;
        dbgElems.panel.classList.toggle('hidden', !debugVisible);
        if (debugVisible) renderDebugPanel();
    }

    // Keyboard shortcuts. Active on every page (so you can pop the debug
    // panel up on the player tab too if you ever need to) but R/G/B
    // simulate ONLY work on host/projection — they're for testing visuals
    // without three phones connected. They mutate simulatedVolumes locally;
    // they do NOT send anything to the server.
    window.addEventListener('keydown', (e) => {
        // Ignore the shortcuts when an input field is focused (so typing
        // your name on the Setup screen doesn't simulate bursts).
        const target = e.target;
        const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (inField) return;

        const k = e.key.toLowerCase();
        if (k === 'd') { toggleDebug(); return; }
        // Host-only sim bursts. We check myRole rather than tab role so a
        // visitor's phone can't accidentally trigger them.
        if (myRole !== 'host') return;
        if (k === 'r') { simulateBurst('red');   return; }
        if (k === 'g') { simulateBurst('green'); return; }
        if (k === 'b') { simulateBurst('blue');  return; }

        // Wizard-of-Oz position presets — drop a role onto a preset spot
        // without a real phone in that slot. Sent over WS via the
        // host_set_position handler so EVERY projection sees the move.
        //   Red:    1 / 2 / 3 / 4  →  A / B / C / Center
        //   Green:  Q / W / E / T  →  A / B / C / Center
        //          (R would collide with the volume burst above — using T
        //           keeps the QWERTY-row idea while preserving R-for-burst)
        //   Blue:   A / S / D / F  →  A / B / C / Center
        const POSITION_PRESETS = {
            A:      { x: 0.18, y: 0.22 },
            B:      { x: 0.82, y: 0.22 },
            C:      { x: 0.50, y: 0.80 },
            Center: { x: 0.50, y: 0.50 },
        };
        const POS_KEYMAP = {
            // Red row — number row
            '1': ['red',   'A'], '2': ['red',   'B'], '3': ['red',   'C'], '4': ['red',   'Center'],
            // Green row — Q/W/E/T (T not R, because R is already the
            // volume-burst key above and we can't double-bind)
            'q': ['green', 'A'], 'w': ['green', 'B'], 'e': ['green', 'C'], 't': ['green', 'Center'],
            // Blue row — A/S/Z/F (Z not D, because D is the debug toggle)
            'a': ['blue',  'A'], 's': ['blue',  'B'], 'z': ['blue',  'C'], 'f': ['blue',  'Center'],
        };
        const bound = POS_KEYMAP[k];
        if (bound) {
            const [role, preset] = bound;
            const p = POSITION_PRESETS[preset];
            send({ type: 'host_set_position', role, x: p.x, y: p.y });
            if (debugVisible) console.log(`[host-pos] ${role} → ${preset} (${p.x}, ${p.y})`);
        }
    });

    // ---- Init ----
    connectWS();
    showScreen('landing');
})();
