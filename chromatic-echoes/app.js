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
    // Quiet supporting side panels (host-only, dead-room-only). Updated
    // each broadcast inside updateFromState.
    const hudSideLeft   = document.getElementById('hudSideLeft');
    const hudSideRight  = document.getElementById('hudSideRight');
    const sideModeName  = document.getElementById('sideModeName');
    const sideModeText  = document.getElementById('sideModeText');
    const sideRoundLbl  = document.getElementById('sideRoundLabel');
    const sideRoundKind = document.getElementById('sideRoundKind');
    const sidePlayerEls = {
        red:   document.querySelector('.hud-side-player[data-role="red"]'),
        green: document.querySelector('.hud-side-player[data-role="green"]'),
        blue:  document.querySelector('.hud-side-player[data-role="blue"]'),
    };
    // Player-side panel (visitor view — different from host's overview).
    const hudSidePlayer     = document.getElementById('hudSidePlayer');
    const playerSwatchEl    = document.getElementById('playerIdentitySwatch');
    const playerNameEl      = document.getElementById('playerIdentityName');
    const playerSideMode    = document.getElementById('playerSideModeName');
    const playerSideModeTxt = document.getElementById('playerSideModeText');
    const playerSideKind    = document.getElementById('playerSideRoundKind');
    const playerSideInstr   = document.getElementById('playerSideInstruction');
    const playerSideMic     = document.getElementById('playerSideMicState');
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
            // ARCHITECTURAL CHANGE: Fill Mode now has TWO clearly-separated
            // layers, not one persistent surface. (a) The TEMPORARY layer
            // (rings, particles, source clouds) clears at almost the same
            // rate as Live Mix — these are momentary, not memory. (b) The
            // MEMORY layer (activePaintTraces with explicit lifetimes) is
            // the only thing that lingers. Without the separation, Fill
            // Mode degenerated into "everything visible at once stays
            // visible" — exactly the problem the user reported.
            trailAlpha: 0.075,          // was 0.055 — non-memory layer fades a touch
                                          // faster so only activePaintTraces linger
            particleLifeMul: 1.0,        // was 1.80 — particles live like Live Mix
            ringLifeMul: 1.05,           // was 1.35 — rings only slightly longer
            cloudOpacityMul: 0.45,       // NEW — source cloud at 45% in Fill Mode
                                          // so the live-volume cloud doesn't read
                                          // as part of the memory
            paintField: true,
            // paintFieldAlpha/Radius are still consulted by spawnPaintTrace
            // for the per-trace base values, but paintCanvas is no longer
            // an accumulating surface — see PAINT_TRACE config + the
            // activePaintTraces system. paintCanvasDecay is now 0 because
            // paintCanvas is cleared + redrawn from the trace list each
            // frame, not faded.
            paintFieldAlpha: 0.32,       // peak per-trace alpha (gradient centre)
            paintFieldRadius: 38,        // base trace radius (px)
            paintCanvasDecay: 0,         // unused — kept so the field exists
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
    // Painted foam boundary — now a CONFIG object instead of a boolean.
    // Refinement pass: re-enabled at low alpha to add the "warm brown
    // dynamic boundary" the brief asked for. The photo already shows
    // physical wedges (static), so we keep the breathing STROKES (which
    // make the photo's wedges feel alive) but skip the bezier BUMPS
    // (which would double-up with the photo's bumps).
    //
    //   enabled        — master switch
    //   drawStrokes    — outer dark + inner beige + offset shadow strokes
    //   drawBumps      — the rounded bezier foam bumps; keep OFF with photo
    //   alphaMul       — multiplier on all stroke alphas vs original
    //   breathBase     — sin offset (idle alpha)
    //   breathAmp      — sin amplitude
    //   breathFreq     — sin frequency (rad/sec) — lower is slower
    const PAINTED_FOAM_BOUNDARY_OPTS = {
        enabled:     true,
        drawStrokes: true,
        drawBumps:   false,
        // Refinement pass v3: boundary was reading as a static thick line
        // because strokes drawn OUTSIDE the canvas clip never got faded by
        // the in-room trail-fade, so they accumulated to saturation within
        // ~15 frames. drawAcousticFoamBoundary now does a per-frame
        // ring-clear (destination-out + evenodd fill) before drawing, so
        // strokes ARE fresh each frame and breathing becomes visible.
        // With the clear in place, alphas can be much higher than before.
        alphaMul:    0.70,                // was 1.0 — strokes were too prominent
        breathBase:  0.26,                // gently perceivable
        breathAmp:   0.12,
        breathFreq:  0.5,
        // Outer atmospheric halo — series of progressively wider, fainter
        // strokes that ring the room. Each layer breathes with a slightly
        // different phase so the halo "shimmers" subtly rather than
        // pulsing in lockstep with the main strokes.
        haloEnabled: true,
        haloLayers:  4,
        haloBaseWidth:    8,             // was 10 — narrower so it doesn't read as bold
        haloWidthStep:    7,             // was 8
        haloMaxAlpha:     0.24,          // was 0.42 — muted so it doesn't compete with sound visuals
        haloPhaseStep:    0.7,
        // Warm halo colour. Was '140, 92, 50' (read as orange in screenshot);
        // now a more muted warm brown that blends with the ambient atmosphere.
        haloRGB:         '110, 76, 46',
        ringClearBuffer:  60,
    };

    // Room aspect matches the top-view Dead Room photo (1073x995 = 1.0784).
    // If you swap the photo, update both this constant AND the matching value
    // in style.css (#playgroundFloor width calc). Mismatch produces 1-2px
    // letterbox bars where the canvas room and the photo room edges meet.
    const ROOM_ASPECT = 1.0784;
    function getMapBounds() {
        const w = window.innerWidth, h = window.innerHeight;
        const size  = Math.min(w, h) * 0.78;
        const roomW = size * ROOM_ASPECT;
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

    // Append the rounded-room path commands to whatever the current path
    // is, WITHOUT calling beginPath. Use this when you need the room
    // shape as part of a larger composite path — e.g. even-odd fill for
    // a ring-clear: ctx.beginPath(); ctx.rect(outer); appendRoomPath(ctx);
    // ctx.fill('evenodd'). If you call drawRoomPath here instead, its
    // internal beginPath() will wipe the rect you just added.
    function appendRoomPath(c) {
        const b = getMapBounds();
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

    // Trace the room rectangle as a NEW path on whichever ctx is passed in.
    // Used both for stroking the boundary AND as the clip path that keeps
    // every visual layer (rings, particles, paint canvas) inside the room.
    // For composite paths (e.g. ring-clear), use appendRoomPath instead.
    function drawRoomPath(c) {
        c.beginPath();
        appendRoomPath(c);
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
        const opts = PAINTED_FOAM_BOUNDARY_OPTS;
        const breath = opts.breathBase + opts.breathAmp * Math.sin(time * opts.breathFreq);
        const tickPhase = time * 1.2;

        ctx.save();

        // ----- Ring-clear (CRITICAL: must use appendRoomPath not drawRoomPath) -----
        // Erase previous-frame boundary pixels in the RING area (outside
        // the room path, inside the room bounding box + buffer). Without
        // this, strokes drawn outside the canvas clip accumulate frame
        // after frame and saturate within ~15 frames — making the
        // boundary look like a static thick line and hiding the breath.
        //
        // Technique: even-odd fill with TWO sub-paths in ONE beginPath:
        //   1. outer rect (bigger than the room + buffer)
        //   2. inner rounded-room path
        // even-odd composing fills the RING between them and skips both
        // the outside-rect area and the inside-room area. destination-out
        // composing then ERASES only that ring.
        //
        // CRITICAL: call appendRoomPath, NOT drawRoomPath. The latter
        // calls c.beginPath() internally, which would wipe the outer
        // rect and turn the even-odd fill into "erase the entire room
        // interior" — exactly the bug that hid the sound visualization
        // in the previous refinement pass.
        const buf = opts.ringClearBuffer;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.rect(b.left - buf, b.top - buf, b.width + buf * 2, b.height + buf * 2);
        appendRoomPath(ctx);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fill('evenodd');
        ctx.restore();

        // ----- Atmospheric halo (the "living frame" feel) -----
        // Series of progressively wider, fainter strokes ringing the room.
        // Each layer breathes with its own phase so the halo shimmers
        // subtly rather than pulsing in lockstep. This is what makes the
        // boundary read as "atmosphere" instead of "stroke".
        if (opts.haloEnabled) {
            for (let i = 0; i < opts.haloLayers; i++) {
                const phase = i * opts.haloPhaseStep;
                const layerBreath = opts.breathBase + opts.breathAmp *
                    Math.sin(time * opts.breathFreq + phase);
                const falloff = 1 - (i / opts.haloLayers);   // 1.0 → 0.25
                const alpha = layerBreath * opts.haloMaxAlpha * falloff * opts.alphaMul;
                if (alpha < 0.01) continue;
                drawRoomPath(ctx);
                ctx.strokeStyle = `rgba(${opts.haloRGB}, ${alpha.toFixed(3)})`;
                ctx.lineWidth = opts.haloBaseWidth + i * opts.haloWidthStep;
                ctx.lineJoin = 'round';
                ctx.stroke();
            }
        }

        if (opts.drawStrokes) {
            // 1. Outer dark warm stroke — the "wall behind the foam".
            //    Sits on top of the halo for crisp definition.
            drawRoomPath(ctx);
            ctx.strokeStyle = `rgba(75, 65, 48, ${(breath * 0.85 * opts.alphaMul).toFixed(3)})`;
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';
            ctx.stroke();

            // 2. Thin beige inner stroke — the foam's lit facing edge.
            drawRoomPath(ctx);
            ctx.strokeStyle = `rgba(190, 170, 130, ${(breath * 0.55 * opts.alphaMul).toFixed(3)})`;
            ctx.lineWidth = 1.6;
            ctx.stroke();
        }

        // 3. Repeated ROUNDED foam bumps along each edge. Gated behind
        // opts.drawBumps — kept OFF when the top-view photo is active
        // because the photo already shows physical wedges. Re-enabling
        // would double-up with the photo's own bumps.
        if (opts.drawBumps) {
        // Why cubic Bezier (bezierCurveTo) and not quadratic:
        //   quadratic with one control point always parabolic → pointy apex.
        //   cubic with two control points pushed inward at equal depth →
        //   flat apex + smoothly rolling shoulders. Same draw cost; vastly
        //   softer read.
        const wedgeBase = 14;         // half-width along the edge (was 9 — wider/softer)
        const wedgeDepth = 7;         // depth into the room (was 10 — shallower)
        const wedgeSpacing = 30;      // gap between bump centres (was 24)
        ctx.fillStyle = `rgba(120, 105, 80, ${(breath * 1.0 * opts.alphaMul).toFixed(3)})`;
        ctx.strokeStyle = `rgba(155, 138, 105, ${(breath * 0.45 * opts.alphaMul).toFixed(3)})`;
        ctx.lineWidth = 0.8;          // very subtle outline = highlight at top of foam

        // Drawing one rounded bump is the same recipe four ways — only the
        // axis flips. Wrap it so the four edge-loops stay readable.
        // edge: 'top' | 'bottom' | 'left' | 'right'
        // c: position along the edge; d: shimmer-adjusted depth.
        function drawFoamBump(edge, c, d) {
            // Control points pulled inward at FULL depth (not half) so the
            // apex is flat for a chunk in the middle — that's what reads
            // as "padded" rather than "pointed".
            const cpFrac = 0.55;
            ctx.beginPath();
            if (edge === 'top') {
                ctx.moveTo(c - wedgeBase, b.top);
                ctx.bezierCurveTo(
                    c - wedgeBase * cpFrac, b.top + d,
                    c + wedgeBase * cpFrac, b.top + d,
                    c + wedgeBase,          b.top
                );
            } else if (edge === 'bottom') {
                ctx.moveTo(c - wedgeBase, b.bottom);
                ctx.bezierCurveTo(
                    c - wedgeBase * cpFrac, b.bottom - d,
                    c + wedgeBase * cpFrac, b.bottom - d,
                    c + wedgeBase,          b.bottom
                );
            } else if (edge === 'left') {
                ctx.moveTo(b.left, c - wedgeBase);
                ctx.bezierCurveTo(
                    b.left + d, c - wedgeBase * cpFrac,
                    b.left + d, c + wedgeBase * cpFrac,
                    b.left,     c + wedgeBase
                );
            } else { // right
                ctx.moveTo(b.right, c - wedgeBase);
                ctx.bezierCurveTo(
                    b.right - d, c - wedgeBase * cpFrac,
                    b.right - d, c + wedgeBase * cpFrac,
                    b.right,     c + wedgeBase
                );
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Top edge — bumps protrude DOWN
        for (let x = b.left + wedgeSpacing * 0.7; x < b.right - wedgeSpacing * 0.4; x += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + x * 0.045);
            drawFoamBump('top', x, wedgeDepth * shimmer);
        }
        // Bottom edge — bumps protrude UP
        for (let x = b.left + wedgeSpacing * 0.7; x < b.right - wedgeSpacing * 0.4; x += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + x * 0.045 + 1.7);
            drawFoamBump('bottom', x, wedgeDepth * shimmer);
        }
        // Left edge — bumps protrude RIGHT
        for (let y = b.top + wedgeSpacing * 0.7; y < b.bottom - wedgeSpacing * 0.4; y += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + y * 0.045 + 2.9);
            drawFoamBump('left', y, wedgeDepth * shimmer);
        }
        // Right edge — bumps protrude LEFT
        for (let y = b.top + wedgeSpacing * 0.7; y < b.bottom - wedgeSpacing * 0.4; y += wedgeSpacing) {
            const shimmer = 1 + 0.18 * Math.sin(tickPhase + y * 0.045 + 4.3);
            drawFoamBump('right', y, wedgeDepth * shimmer);
        }
        }  // end if opts.drawBumps

        // 4. A faint outer "shadow" behind the foam, 3px out from the
        // path — adds depth so the foam reads as physical thickness
        // rather than a sticker pasted on the canvas. Gated by drawStrokes
        // so the shadow disappears together with its parent strokes.
        if (opts.drawStrokes) {
            ctx.save();
            ctx.translate(-2, -2);
            drawRoomPath(ctx);
            ctx.strokeStyle = `rgba(20, 17, 13, ${(breath * 0.65 * opts.alphaMul).toFixed(3)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

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
        // ALSO flush the trace list — otherwise mode-change / round-start
        // / host-Clear-Fill would wipe the canvas only for the active
        // traces to immediately redraw themselves next frame.
        if (typeof activePaintTraces !== 'undefined') activePaintTraces = [];
    }
    // ---- Trace-event system (replaces accumulating paintCanvas stamps) ----
    // The previous design treated paintCanvas as the source of truth and
    // applied a per-frame decay. That meant individual marks had no
    // intrinsic lifetime — they all faded at the same rate, and any
    // long-running session degenerated into a saturated wash.
    //
    // New design: state lives in activePaintTraces[]. Each trace has its
    // own born/duration, knows how old it is, and is removed once
    // expired. The paint canvas is now a cheap render cache: cleared and
    // redrawn from the trace list every frame, never accumulating.
    //
    // Lifetime is intent-aware: loud sound → longer-lasting traces;
    // moving sound → shorter (because new stamps will replace them
    // along the path anyway). Per-role spawn cooldown keeps the trace
    // count bounded even with continuous speaking. Hard cap of
    // MAX_PAINT_TRACES so a worst-case (three loud players moving) can
    // never overrun the render budget.
    const PAINT_TRACE = {
        cooldownMs:        150,     // per-role gap between stamps (~6.7/sec)
        baseDurationMs:    3800,    // was 5800 — "the room forgets faster"
        loudBonusMs:       1500,    // was 2500 — loud moments still linger, just less
        movingPenaltyMs:  -1500,    // up to -1.5 s when moving fast
        minDurationMs:     2200,    // floor — never shorter than this
        baseRadius:        38,      // base px (volume + motion modulate)
        radiusVolumeBoost: 18,      // px added at full volume
        radiusGrowth:      0.25,    // trace expands 25% over its life
        motionShrink:      0.55,    // moving stamps 55% smaller
        baseAlpha:         0.32,    // peak alpha at gradient centre
        fadeStart:         0.15,    // smoothstep edge0 — hold for first 15% of life
        fadeEnd:           1.0,     // smoothstep edge1 — fully transparent at 100%
        maxAlive:          48,      // was 80 — caps "too much remembered at once"
    };
    let activePaintTraces = [];
    const lastPaintTraceAt = { red: 0, green: 0, blue: 0 };

    // Smooth fade curve. smoothstep(0.15, 1.0, age) is 0 for age≤0.15,
    // ramps via 3t²-2t³ between 0.15 and 1.0, and 1 at age>=1.0. Then we
    // use (1 - smoothstep) for the alpha multiplier — full alpha for the
    // first 15% of life, gentle fade for the rest, zero at expiry.
    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    function spawnPaintTrace(role, x, y, color, volume, motionSpeedPx) {
        const speed = motionSpeedPx || 0;
        const motionNorm = Math.min(1, speed / 5);

        // Lifetime — intent-aware. Loud sounds linger longer (we remember
        // the punchy moments); moving sounds shorter (they're constantly
        // being replaced by new stamps along the path).
        let duration = PAINT_TRACE.baseDurationMs;
        if (volume > 0.15) {
            duration += PAINT_TRACE.loudBonusMs * Math.min(1, (volume - 0.15) / 0.20);
        }
        if (motionNorm > 0.3) {
            duration += PAINT_TRACE.movingPenaltyMs * motionNorm;
        }
        duration = Math.max(PAINT_TRACE.minDurationMs, duration);

        const radius = (PAINT_TRACE.baseRadius + volume * PAINT_TRACE.radiusVolumeBoost)
                     * (1 - motionNorm * PAINT_TRACE.motionShrink);
        const alpha = PAINT_TRACE.baseAlpha * (0.6 + Math.min(1, volume * 2) * 0.4);

        // Hard cap: drop oldest if at capacity (the one most likely to
        // already be near-invisible from fade-out anyway).
        if (activePaintTraces.length >= PAINT_TRACE.maxAlive) {
            activePaintTraces.shift();
        }
        activePaintTraces.push({
            x, y, role, color,
            born: performance.now(),
            duration,
            radius,
            alpha,
            motionSpeed: speed,
            volume,
        });
    }

    function updatePaintTraces() {
        const now = performance.now();
        activePaintTraces = activePaintTraces.filter(t => now - t.born < t.duration);
    }

    // Clear + redraw the paint canvas from the live trace list. Cost:
    // ~1 gradient + 1 arc fill per trace per frame. With cooldownMs 150
    // and average 6s lifetime, peak alive ≈ 40 per role × 3 roles = 120
    // (capped at 80 by maxAlive). Each gradient is small (~50 px), so
    // total per-frame cost is well within budget on modern hardware.
    function drawPaintTraces() {
        // Clear paintCanvas — it's now a render cache, not state.
        paintCtx.save();
        paintCtx.setTransform(1, 0, 0, 1, 0, 0);
        paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
        paintCtx.restore();

        if (activePaintTraces.length === 0) return;
        const now = performance.now();
        for (const tr of activePaintTraces) {
            const age = (now - tr.born) / tr.duration;
            if (age < 0 || age > 1) continue;
            // (1 - smoothstep) gives a hold-then-fade alpha curve: stable
            // at full strength for the first 15% of life, then a smooth
            // 3t²-2t³ ease-out to zero by expiry.
            const fadeMul = 1 - smoothstep(PAINT_TRACE.fadeStart, PAINT_TRACE.fadeEnd, age);
            const alpha = tr.alpha * fadeMul;
            if (alpha < 0.005) continue;
            // Slight radius growth as the trace ages — the memory "spreads
            // a little" as it dissolves, like a ripple in still water.
            const r = tr.radius * (1 + age * PAINT_TRACE.radiusGrowth);
            const col = `${tr.color.r},${tr.color.g},${tr.color.b}`;
            const grad = paintCtx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, r);
            grad.addColorStop(0,    `rgba(${col},${alpha.toFixed(3)})`);
            grad.addColorStop(0.35, `rgba(${col},${(alpha * 0.50).toFixed(3)})`);
            grad.addColorStop(0.70, `rgba(${col},${(alpha * 0.15).toFixed(3)})`);
            grad.addColorStop(1,    `rgba(${col},0)`);
            paintCtx.fillStyle = grad;
            paintCtx.beginPath();
            paintCtx.arc(tr.x, tr.y, r, 0, Math.PI * 2);
            paintCtx.fill();
        }
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
            // Pseudo-3D wavefront state baked at spawn so each ring evolves
            // independently. wobbleSeed gives each its own sine phase;
            // intensity (0..1) modulates wobble amplitude + layer spacing.
            wobbleSeed: Math.random() * Math.PI * 2,
            intensity:  Math.min(1, volume),
        });
        if (debugVisible) {
            console.log(`[ring] role=${role} vol=${volume.toFixed(2)} from (${Math.round(src.x)}, ${Math.round(src.y)}) startAlpha=${startAlpha.toFixed(2)} maxR=${Math.round(CONFIG.ringBaseRadius + CONFIG.ringTravel * (0.7 + 0.5 * volume))}`);
        }
    }

    function updateRings() {
        const now = performance.now();
        activeRings = activeRings.filter(r => (now - r.born) < r.duration);
    }

    // Pseudo-3D wavefronts. Replaces the previous flat ctx.arc() rings.
    // Each ring is now drawn as THREE concentric layered polygons (inner
    // bright / mid / outer faint) with:
    //   • Organic sine-combo deformation (radius wobbles around the
    //     circle, unique seed per ring).
    //   • Y-axis foreshortening (perspective compression, y *= 0.82).
    //   • Doppler asymmetric deformation in the source's motion
    //     direction (compress in front, stretch behind) — the moving
    //     velocity is read from roleVelocityScreen.
    // All three effects use the same polygon-of-segments scaffolding, so
    // adding them is just extra terms on the per-segment radius. Cost:
    // for SEGMENTS=64 and 3 layers, ~ 200 lineTo calls per ring per
    // frame. With the ring-cooldown cap, total work stays bounded.
    const SEGMENTS = 64;
    const PERSPECTIVE_Y = 0.82;   // <1 = horizontal-ellipse, top-down room feel
    function drawRings() {
        const now = performance.now();
        // Per-frame time for sine wobble — keeps phase continuous across
        // frames so the ring breathes smoothly rather than ticking.
        const tg = time * 2.0;

        for (const r of activeRings) {
            const t = (now - r.born) / r.duration;
            if (t < 0 || t > 1) continue;

            const radius = CONFIG.ringBaseRadius + (r.maxRadius - CONFIG.ringBaseRadius) * t;
            const baseAlpha = r.startAlpha * (1 - t) * (1 - t);
            if (baseAlpha < 0.02) continue;
            const lineW = CONFIG.ringLineMin + (CONFIG.ringLineMax - CONFIG.ringLineMin) * (1 - t);

            // Wobble amplitudes scale with the ring's spawn intensity (volume).
            // Two frequencies summed = organic curve, no obvious sinusoid.
            const wobbleA = 4 + r.intensity * 9;     // low-frequency, larger
            const wobbleB = 1.5 + r.intensity * 4.5; // higher-frequency, smaller
            const phase = tg + r.wobbleSeed;

            // Doppler bias from current source velocity (not the velocity
            // at spawn time — keeps the visual responsive if the source
            // stops mid-ring-life).
            const v = roleVelocityScreen[r.role] || { x: 0, y: 0 };
            const speedPx = Math.sqrt(v.x * v.x + v.y * v.y);
            const moving = speedPx > 0.6;
            const motionAngle = moving ? Math.atan2(v.y, v.x) : 0;
            const dopplerK = moving ? Math.min(speedPx * 1.8, 18) : 0;

            // Three layered polygons → fake depth. Each layer's scale,
            // alpha, and lineWidth differ so the eye reads them as
            // overlapping volumetric wavefronts instead of a single line.
            // Inner = brightest + thinnest; outer = faintest + thinnest.
            // Mid carries the bulk of the ring's visual weight.
            const layers = [
                { scale: 0.82, alphaMul: 1.00, lineMul: 0.90 },  // inner
                { scale: 1.00, alphaMul: 0.68, lineMul: 1.00 },  // mid
                { scale: 1.22, alphaMul: 0.38, lineMul: 0.55 },  // outer
            ];
            for (const lay of layers) {
                const lAlpha = baseAlpha * lay.alphaMul;
                if (lAlpha < 0.02) continue;
                ctx.strokeStyle = `rgba(${r.color.r},${r.color.g},${r.color.b},${lAlpha.toFixed(3)})`;
                ctx.lineWidth = Math.max(0.4, lineW * lay.lineMul);
                ctx.beginPath();
                for (let i = 0; i <= SEGMENTS; i++) {
                    const a = (i / SEGMENTS) * Math.PI * 2;
                    // Organic wobble — two sines at different multiples.
                    const wob = Math.sin(a * 3 + phase) * wobbleA
                              + Math.sin(a * 7 + phase * 0.7) * wobbleB;
                    // Doppler asymmetric bias — cos(a - motionAngle) is +1
                    // exactly in motion direction, -1 directly behind. We
                    // SUBTRACT from radius in motion direction (compress)
                    // and ADD behind (stretch) — wave gets pushed forward
                    // visually.
                    const dopp = moving ? -Math.cos(a - motionAngle) * dopplerK : 0;
                    let rad = (radius + wob + dopp) * lay.scale;
                    if (rad < 1) rad = 1;
                    const x = r.x + Math.cos(a) * rad;
                    const y = r.y + Math.sin(a) * rad * PERSPECTIVE_Y;
                    if (i === 0) ctx.moveTo(x, y);
                    else         ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }
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
        // Subtler micro-particles around each burst — a couple of fine
        // sparks rather than fluffy dust. Previously 4 medium dust
        // particles read as "smoky"; now 2 fine sparks just suggest
        // micro-scatter at the interference site without crowding.
        microParticlesPerBurst: 2,
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
            // Random rotation for the cross-wave shimmer arcs so successive
            // bursts in the same area don't all align — keeps the
            // interference cue from feeling stamped.
            phase: Math.random() * Math.PI,
        });
        // Micro-particles around the burst — a tiny dust of the blended
        // colour. They ride in activeParticles with role='blend' so they
        // share the lifetime / boundary cull / cap behaviour of regular
        // particles. detectCollisions skips role==='blend' so they cannot
        // chain new bursts.
        const blendColor = { r, g, b };
        for (let i = 0; i < COLLISION.microParticlesPerBurst; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 0.8 + Math.random() * 1.4;
            activeParticles.push({
                role: 'blend',
                color: blendColor,
                x: x + (Math.random() - 0.5) * 4,
                y: y + (Math.random() - 0.5) * 4,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                // Smaller + finer + dimmer than before — the rings carry
                // the burst's energy; sparks are just a touch of grain.
                size: 0.35 + Math.random() * 0.7,
                life:    22 + Math.random() * 14,
                maxLife: 36,
                alpha: 0.28 + Math.random() * 0.20,
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
        // Redesigned visual language: a collision is now drawn as 2–3
        // THIN CONCENTRIC RINGS (stroke only, no central fill), in the
        // blended colour. The previous radial-gradient blob read as a
        // smoke explosion; rings read as wave interference. Same data
        // structure on activeCollisionBursts — only this draw function
        // changed.
        const now = performance.now();
        for (const b of activeCollisionBursts) {
            const t = (now - b.born) / b.duration;     // 0..1
            if (t < 0 || t > 1) continue;
            // Expansion eases out — fast at birth, slowing toward end of life.
            const baseR = b.maxR * (0.18 + t * (1.05 - t * 0.2));
            const peak = (1 - t) * (1 - t) * COLLISION.burstAlphaPeak;
            if (peak < 0.02) continue;
            const col = `${b.r},${b.g},${b.b}`;

            // Inner ring — brightest, thinnest at end of life (lineWidth
            // tapers from 1.4 → 0.6). Sits at ~55% of baseR so its growth
            // is contained behind the mid/outer rings.
            ctx.strokeStyle = `rgba(${col},${peak.toFixed(3)})`;
            ctx.lineWidth = 1.4 - t * 0.8;
            ctx.beginPath();
            ctx.arc(b.x, b.y, baseR * 0.55, 0, Math.PI * 2);
            ctx.stroke();

            // Mid ring — softer, slightly larger.
            const midA = peak * 0.70;
            if (midA > 0.02) {
                ctx.strokeStyle = `rgba(${col},${midA.toFixed(3)})`;
                ctx.lineWidth = 1.0 - t * 0.55;
                ctx.beginPath();
                ctx.arc(b.x, b.y, baseR * 0.85, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Outer ring — fainter, longer reach. Appears after t > 0.12
            // so it staggers behind the inner two — gives the burst a
            // sense of *propagation* rather than instantaneous expansion.
            const outA = peak * 0.42;
            if (t > 0.12 && outA > 0.02) {
                ctx.strokeStyle = `rgba(${col},${outA.toFixed(3)})`;
                ctx.lineWidth = 0.65;
                ctx.beginPath();
                ctx.arc(b.x, b.y, baseR * 1.2, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Cross-wave shimmer — 2 short arcs perpendicular to each
            // other near the burst centre. Peaks mid-life (sin(t·π)) and
            // fades. Suggests interference geometry rather than just
            // concentric ripples. Rotation is per-burst (b.phase) so
            // successive bursts in the same area don't all align.
            const shimmer = Math.sin(t * Math.PI) * peak * 0.7;
            if (shimmer > 0.04) {
                const shR = baseR * 0.42;
                const arcSpan = Math.PI * 0.55;     // ~99° arc per stroke
                ctx.strokeStyle = `rgba(${col},${shimmer.toFixed(3)})`;
                ctx.lineWidth = 1.1;
                for (let s = 0; s < 2; s++) {
                    const a0 = (b.phase || 0) + s * (Math.PI / 2);
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, shR, a0, a0 + arcSpan);
                    ctx.stroke();
                }
            }
        }
    }

    // ---- Wave-field interaction (no standalone object) ----
    // History of this slot:
    //   v1 — concentric arcs + centre dot → read as Wi-Fi icon
    //   v2 — wavy contact seam between sources → still read as a
    //        "thing placed in the middle"
    //   v3 (now) — NO midpoint marker at all. Instead, when two sources
    //              are close + both speaking, we deform the existing
    //              wavefields: partial arcs ATTACHED TO each source
    //              (centred on it, facing the other), plus a soft
    //              elongated overlap field oriented along the centres
    //              axis. The interaction reads as "these two fields are
    //              pressing into each other" rather than "an icon is
    //              drawn between these dots".
    //
    // No event list, no per-frame spawning, no cooldown — the deformation
    // is a function of CURRENT state, drawn every frame the condition
    // holds. Effects are continuous rather than discrete, which is what
    // physical interference would actually look like.
    //
    // Total cost is bounded: ≤3 role pairs × ≤(arcs + ellipse). For three
    // roles this is at most 9 arc-strokes + 3 ellipses per frame.
    //
    // Detection trigger: source-source proximity + both above the visual
    // threshold (not ring-ring intersection, which fires only at the
    // wave-meeting moment — the new design wants the seam present whenever
    // the two fields are actually overlapping, which happens whenever both
    // sources are speaking near each other).
    //
    // Geometry: at the midpoint between sources A and B, compute the
    // perpendicular direction (across the gap). The seam is a wavy
    // poly-line drawn along that perpendicular axis, tapered at the
    // endpoints, with a sine wobble. Three parallel lines slightly offset
    // along the centres-axis suggest compressed contour bands.
    // Tunables for the field-deformation visual.
    const INTERFERENCE = {
        proximityFactor: 0.55,     // active when distance < ringTravel * this
        proximityMin: 8,           // ignore sources nearly on top of each other
        arcsPerSource: 3,          // 3 partial arcs per source on the facing side
        arcBaseRadius: 38,         // radius of innermost arc (px); next layers add radialGap
        arcRadialGap: 24,          // gap between concentric arcs (volume-modulated)
        arcSpanMax: Math.PI * 0.65, // angular spread of innermost (widest) arc
        arcSegments: 22,           // polyline resolution per arc
        arcWobbleAmp: 1.6,         // sine wobble on arc radius (px)
        baseAlpha: 0.70,           // was 0.55 — facing arcs read at projection distance
        // Interference-fringe stack across the gap (drawCrossingContours).
        // Five perpendicular bands instead of two — the spacing+falloff
        // is what makes it read as an interference pattern rather than
        // "a couple of strokes between dots".
        contourBands: 5,
        contourBandSpacingPx: 5,   // axial gap between adjacent bands
        contourAlphaCap: 0.45,     // was 0.32 — bands more legible
        // Tiny brightening at the midpoint — a single STROKE circle, no
        // fill, so it never re-introduces the rejected bubble/blob look.
        midpointStrokeR: 6,
        midpointStrokeAlpha: 0.50,
        overlapFieldAlpha: 0.16,   // (retained — referenced by debug only)
        overlapLengthFactor: 0.42,
        overlapWidthFactor:  0.20,
    };

    function effectiveVolumeFor(role) {
        return Math.max(smoothVolumes[role] || 0, simulatedVolumes[role] || 0);
    }

    // Thin contour strokes crossing the gap between two active sources.
    // Replaces the previous filled ellipse overlap field, which read as
    // a bubble / blob between the dots. These are PURE STROKES — no
    // fill anywhere — drawn perpendicular to the centres axis with a
    // sine wobble + endpoint taper so they fade to nothing at both ends.
    // The visual reads as "interference contours crossing here" rather
    // than "there is an object placed between these two dots".
    function drawCrossingContours(srcA, srcB, blend, intensity) {
        if (intensity < 0.04) return;
        const midX = (srcA.x + srcB.x) * 0.5;
        const midY = (srcA.y + srcB.y) * 0.5;
        const dx = srcB.x - srcA.x, dy = srcB.y - srcA.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) return;
        const axisX = dx / d,           axisY = dy / d;
        const perpX = -axisY,           perpY = axisX;
        const halfLen = d * 0.20;       // contour spans 40% of gap width
        const col = `${blend.r},${blend.g},${blend.b}`;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Stack of N parallel contours across the gap. Spacing + alpha
        // falloff away from the centre band is what makes the stack read
        // as an interference pattern rather than as random strokes.
        // Centre band is brightest; outer bands fade symmetrically.
        const bands = INTERFERENCE.contourBands;
        const spacing = INTERFERENCE.contourBandSpacingPx;
        const mid = (bands - 1) / 2;
        for (let i = 0; i < bands; i++) {
            const distFromMid = Math.abs(i - mid);
            const fringeFalloff = 1 - distFromMid / (mid + 0.5); // 1 at centre → small at edges
            const alpha = intensity * INTERFERENCE.contourAlphaCap * fringeFalloff;
            if (alpha < 0.03) continue;
            const axialOffset = (i - mid) * spacing;
            const baseX = midX + axisX * axialOffset;
            const baseY = midY + axisY * axialOffset;
            // Centre band slightly thicker so the fringe stack has visible
            // hierarchy without any band being a heavy line.
            ctx.lineWidth = 0.7 + fringeFalloff * 0.6;
            ctx.strokeStyle = `rgba(${col},${alpha.toFixed(3)})`;
            ctx.beginPath();
            const segments = 18;
            for (let s = 0; s <= segments; s++) {
                const u = (s / segments - 0.5) * 2;     // -1..1 across the contour
                const taper = 1 - Math.abs(u);          // fade to 0 at tips
                // Sine wobble + small time evolution + per-band phase.
                const wob =
                    Math.sin(u * Math.PI * 2 + time * 1.4 + i * 1.1) * 2.4
                    + Math.sin(u * Math.PI * 5 + time * 0.9) * 0.9;
                const x = baseX + perpX * u * halfLen + axisX * wob * taper;
                const y = baseY + perpY * u * halfLen + axisY * wob * taper;
                if (s === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // Midpoint brightening — a single small STROKE circle (no fill)
        // at the geometric midpoint of the two sources. Sits inside the
        // central fringe and reads as "the sound fields locally interact
        // here". Stroke-only by design so it cannot become a bubble.
        const midAlpha = intensity * INTERFERENCE.midpointStrokeAlpha;
        if (midAlpha >= 0.04) {
            ctx.strokeStyle = `rgba(${col},${midAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(midX, midY, INTERFERENCE.midpointStrokeR, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Partial arcs ATTACHED to a source, opening toward `facingAngle`.
    // These ARE NOT a separate object — they're a "compressed wavefront"
    // appended to the source's existing aura. Three concentric arcs at
    // increasing radii, narrowing in span (front-most arc is widest,
    // outermost is narrowest), each with a small sine wobble on the
    // radius so they read as deformations of the field, not as a UI ring.
    function drawFacingArcs(src, facingAngle, blend, intensity) {
        if (intensity < 0.04) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const col = `${blend.r},${blend.g},${blend.b}`;
        const arcRadialGap = INTERFERENCE.arcRadialGap * (0.6 + 0.7 * intensity);
        for (let i = 0; i < INTERFERENCE.arcsPerSource; i++) {
            const radius = INTERFERENCE.arcBaseRadius + i * arcRadialGap;
            // Wider arc closer to the source, narrower far out — gives
            // the feel of a wavefront concentrated at the contact face.
            const span = INTERFERENCE.arcSpanMax * (1 - i * 0.18);
            const startA = facingAngle - span / 2;
            const endA   = facingAngle + span / 2;
            // Inner arcs brighter, outer arcs fainter.
            const alpha = INTERFERENCE.baseAlpha * intensity * (1 - i * 0.28);
            if (alpha < 0.03) continue;
            ctx.strokeStyle = `rgba(${col},${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.4 - i * 0.30;
            ctx.beginPath();
            for (let s = 0; s <= INTERFERENCE.arcSegments; s++) {
                const u = s / INTERFERENCE.arcSegments;
                const a = startA + u * (endA - startA);
                // Sine wobble on radius — flows slowly via `time` so the
                // arcs breathe rather than freeze. Unique per arc index.
                const wob = Math.sin(u * Math.PI * 3 + time * 1.5 + i * 0.7) * INTERFERENCE.arcWobbleAmp;
                const r = radius + wob;
                const x = src.x + Math.cos(a) * r;
                // Same perspective y-scale as the main rings so the arcs
                // sit on the same pseudo-3D plane.
                const y = src.y + Math.sin(a) * r * PERSPECTIVE_Y;
                if (s === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // Single pair: deform A's field on its B-facing side, deform B's
    // field on its A-facing side, and tint the overlap zone in between.
    function drawWaveFieldInteraction(roleA, roleB, srcA, srcB, volA, volB, dist) {
        const colA = COLORS[roleA], colB = COLORS[roleB];
        if (!colA || !colB) return;
        const blend = {
            r: Math.round((colA.r + colB.r) / 2),
            g: Math.round((colA.g + colB.g) / 2),
            b: Math.round((colA.b + colB.b) / 2),
        };
        const axisAngle = Math.atan2(srcB.y - srcA.y, srcB.x - srcA.x);
        // Proximity scaling: 1 when sources nearly touching, 0 at the
        // edge of the proximity range. Combined with the quieter speaker
        // so a one-quiet pair contributes proportionally less.
        const proxRadius = CONFIG.ringTravel * INTERFERENCE.proximityFactor + CONFIG.ringBaseRadius;
        const proxNorm = 1 - Math.min(1, dist / proxRadius);
        const quieter  = Math.min(volA, volB);
        const intensity = Math.min(1, quieter * (0.5 + 0.8 * proxNorm));

        // STROKES ONLY — no filled shapes anywhere in this pipeline.
        // (The old filled-ellipse overlap field has been removed because
        // any filled gradient between the two sources read as a bubble /
        // blob "thing placed there" rather than as field interaction.)
        //
        // 1) Compressed wavefront arcs attached to each source, opening
        //    toward the OTHER. This is the primary deformation: each
        //    source's own ripple is brightened/compressed on its
        //    facing side.
        drawFacingArcs(srcA, axisAngle,            blend, intensity);
        drawFacingArcs(srcB, axisAngle + Math.PI,  blend, intensity);
        // 2) Thin contour strokes crossing the gap — pure line work,
        //    sine-wobble, taper-fades at the ends. They read as
        //    interference contours between the two facing waves.
        drawCrossingContours(srcA, srcB, blend, intensity);
    }

    // Per-frame: walk role pairs, draw deformation where appropriate.
    // No event list, no cooldown — the deformation is a function of the
    // current state, so it appears whenever conditions hold and stops
    // the instant they don't. ≤3 pairs for ROLES = R/G/B.
    function drawWaveInteractions() {
        const T = CONFIG.volumeThresholdVisual;
        const proxRadius = CONFIG.ringTravel * INTERFERENCE.proximityFactor + CONFIG.ringBaseRadius;
        for (let i = 0; i < ROLES.length; i++) {
            const a = ROLES[i];
            const volA = effectiveVolumeFor(a);
            if (volA < T) continue;
            for (let j = i + 1; j < ROLES.length; j++) {
                const b = ROLES[j];
                const volB = effectiveVolumeFor(b);
                if (volB < T) continue;
                const srcA = sourcePositions[a], srcB = sourcePositions[b];
                if (!srcA || !srcB) continue;
                const dx = srcB.x - srcA.x, dy = srcB.y - srcA.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < INTERFERENCE.proximityMin || d > proxRadius) continue;
                drawWaveFieldInteraction(a, b, srcA, srcB, volA, volB, d);
            }
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
        // Mode-aware multiplier: Fill Mode tones down the cloud to ~45% so
        // it doesn't read as part of the memory layer (only the explicit
        // activePaintTraces should linger after silence).
        const cloudMul = getModeConfig().cloudOpacityMul || 1;
        const opacity = lerp(CONFIG.cloudMinOpacity, CONFIG.cloudMaxOpacity, vn) * cloudMul;
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

            // Live mic state on the PLAYER-SIDE PANEL. Previously updated
            // only in updateFromState (server-state cadence ≈ once per
            // join/state-transition) which made it stuck on "silent".
            // Now driven by this 90ms interval, same source as the
            // wait-screen meter, so the panel reads live as the player
            // actually speaks.
            const playerStateEl = document.getElementById('playerSideMicState');
            const playerMeterEl = document.getElementById('playerSideMicMeter');
            if (playerStateEl) {
                let state, cls;
                if (!analyser) {
                    state = 'Mic unavailable';
                    cls   = 'is-unavailable';
                } else if (audioCtx && audioCtx.state !== 'running') {
                    state = `Mic ${audioCtx.state}`;
                    cls   = 'is-unavailable';
                } else if (raw < 0.005) {
                    state = 'Quiet';
                    cls   = 'is-quiet';
                } else if (raw < 0.020) {
                    state = 'Listening';
                    cls   = 'is-listening';
                } else if (raw < 0.080) {
                    state = 'Speaking';
                    cls   = 'is-speaking';
                } else {
                    state = 'Loud';
                    cls   = 'is-loud';
                }
                playerStateEl.textContent = state;
                playerStateEl.classList.remove('is-quiet', 'is-listening',
                    'is-speaking', 'is-loud', 'is-unavailable');
                playerStateEl.classList.add(cls);
            }
            if (playerMeterEl) {
                // Same scale as the wait-screen meter for consistency.
                playerMeterEl.style.width = Math.min(100, Math.round(raw * 600)) + '%';
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

        // Gate the top-view playground photo's visibility. The photo fades
        // in only when we're in the live Dead Room playing phase; in every
        // other stage (including transitions between menus) the body class
        // is removed so #playgroundFloor stays at opacity 0. This is what
        // prevents the photo from flashing through during landing → lobby
        // → playing handoffs. See style.css `.in-playground` for the
        // transition curve.
        const inPlayground = (experienceStage === 'dead-room' && s.phase === 'playing' && myRole);
        document.body.classList.toggle('in-playground', !!inPlayground);

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

        // Side panels are dead-room only. Three mutually-exclusive visibilities:
        //   • host  → hudSideLeft (mode overview)   + hudSideRight (players)
        //   • player→ hudSidePlayer (own identity)
        //   • none of the above → all hidden
        // CSS @media hides everything below 1100px viewport regardless.
        const inDeadRoom = experienceStage === 'dead-room';
        const showHostSide   = myRole === 'host' && inDeadRoom;
        const showPlayerSide = !!myRole && myRole !== 'host' && inDeadRoom;
        if (hudSideLeft)   hudSideLeft.classList.toggle('hidden',   !showHostSide);
        if (hudSideRight)  hudSideRight.classList.toggle('hidden',  !showHostSide);
        if (hudSidePlayer) hudSidePlayer.classList.toggle('hidden', !showPlayerSide);

        if (showHostSide) {
            // Host LEFT: mode meaning.
            if (sideModeName) sideModeName.textContent = gameMode === 'accumulate' ? 'Fill Mode' : 'Live Mix';
            if (sideModeText) sideModeText.textContent = gameMode === 'accumulate'
                ? 'The room remembers where sound has been'
                : 'The room listens to the present';
            // Host RIGHT: per-role connection state.
            for (const role of ROLES) {
                const el = sidePlayerEls[role];
                if (!el) continue;
                el.classList.toggle('is-offline', !connectedPlayers.includes(role));
            }
            if (sideRoundLbl) {
                const idx = Number.isFinite(s.roundIndex) ? s.roundIndex + 1 : '—';
                const tot = Number.isFinite(s.totalRounds) ? s.totalRounds : '—';
                sideRoundLbl.textContent = `${idx} / ${tot}`;
            }
            if (sideRoundKind) {
                sideRoundKind.textContent = (currentRound && KIND_LABELS[currentRound.kind]) || '—';
            }
        }
        if (showPlayerSide) {
            // Player panel: their colour, mode meaning, round + instruction,
            // and live mic state. Colour driven by myRole.
            if (playerSwatchEl) {
                playerSwatchEl.classList.remove('player-identity-swatch--red',
                    'player-identity-swatch--green', 'player-identity-swatch--blue');
                playerSwatchEl.classList.add(`player-identity-swatch--${myRole}`);
            }
            if (playerNameEl) playerNameEl.textContent = myRole.toUpperCase();
            if (playerSideMode)    playerSideMode.textContent = gameMode === 'accumulate' ? 'Fill Mode' : 'Live Mix';
            if (playerSideModeTxt) playerSideModeTxt.textContent = gameMode === 'accumulate'
                ? 'The room remembers where sound has been'
                : 'The room listens to the present';
            if (playerSideKind) {
                playerSideKind.textContent = (currentRound && KIND_LABELS[currentRound.kind]) || '—';
            }
            if (playerSideInstr) {
                playerSideInstr.textContent = (currentRound && currentRound.instruction) || '—';
            }
            // (playerSideMic text + class is now driven by the 90ms
            // mic-meter interval inside startMicMeter — see there. This
            // updateFromState handler only fires on server state pushes,
            // which is too rare to keep the mic status live.)
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

        // Host's right-side panel per-role status pills. Updated on EVERY
        // frame (~30 Hz) using the just-smoothed broadcast volumes, so a
        // host watching all three players sees their state change as it
        // happens. Thresholds use CONFIG.volumeThresholdVisual multiples
        // so they share the SAME tuning space as the particle/ring
        // visibility gates — easier to reason about.
        if (myRole === 'host') {
            const T = CONFIG.volumeThresholdVisual;     // 0.04 default
            for (const role of ROLES) {
                const el = document.querySelector(`[data-role-status="${role}"]`);
                if (!el) continue;
                const v = smoothVolumes[role];
                const connected = connectedPlayers.includes(role);
                let label, cls;
                if (!connected)              { label = 'offline';   cls = 'is-offline';   }
                else if (v < T * 0.5)        { label = 'quiet';     cls = 'is-quiet';     }
                else if (v < T)              { label = 'listening'; cls = 'is-listening'; }
                else if (v < T * 2.5)        { label = 'speaking';  cls = 'is-speaking';  }
                else                         { label = 'loud';      cls = 'is-loud';      }
                el.textContent = label;
                el.classList.remove('is-quiet', 'is-listening', 'is-speaking', 'is-loud', 'is-offline');
                el.classList.add(cls);
            }
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
        // =========================================================================
        // LAYER-INTENT CONTRACT — read before editing any of the visual integration
        // =========================================================================
        // Below is the strict draw order. NEVER place a "context" layer (ambient,
        // photo, tint, vignette, boundary) above an "interaction" layer (Fill
        // traces, particles, rings, source dots). Doing so suppressed the sound
        // visualization in a previous refinement pass and the project's most
        // critical visual element disappeared.
        //
        //   CONTEXT (background, contextual):
        //     1. #ambientBackground (CSS, z=-1)             — warm brown drift
        //     2. #playgroundFloor (CSS, z=0)                 — top-view photo
        //          ├─ ::before    photo + filter darkening
        //          └─ ::after     warm tint + inset vignette
        //     3. trail-fade (canvas, destination-out)        — in-room
        //
        //   INTERACTION (foreground, never suppressed):
        //     4. paintCanvas blit (Fill Mode memory traces)
        //     5. drawSourceCloud, maybeSpawnRing, drawRings
        //     6. drawWaveInteractions (interference contours)
        //     7. drawParticles
        //     8. drawSourceDot — most prominent, always on top inside the room
        //
        //   FRAME (drawn AFTER clip restore, in the border area):
        //     9. drawAcousticFoamBoundary — ring-clear + atmospheric halo
        //        MUST use appendRoomPath (not drawRoomPath) in its ring-clear
        //        even-odd fill, or it will erase the entire room interior.
        //
        //   UI (CSS, on top of everything):
        //    10. .screen menus (z=100), HUD (z=1000)
        // =========================================================================

        // Trail fade — now ERASES rather than paints over.
        // The Dead Room top-view photo sits as a CSS background BEHIND the
        // canvas (see #playgroundFloor in style.css). If we used the old
        // "fill with semi-transparent dark" approach, the canvas drawing
        // surface would asymptote to opaque within ~1 second and bury the
        // photo. globalCompositeOperation = 'destination-out' uses the
        // fill's ALPHA to subtract from existing pixels instead: each
        // particle fades exponentially toward zero alpha, eventually
        // gone, and the photo behind shows cleanly through the empty
        // pixels. Same visual rate as before (particles decay over ~1s);
        // wildly different compositing semantics.
        //
        // The vignette was removed in this pass — it darkened the room's
        // corners with a radial overlay, which would have muddied the
        // photo. If you want a vignette back, do it as a CSS overlay on
        // #playgroundFloor instead, not as a per-frame canvas fill.
        const mc = getModeConfig();
        ctx.save();
        drawRoomPath(ctx);
        ctx.clip();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${mc.trailAlpha})`;  // colour irrelevant in destination-out
        ctx.fillRect(0, 0, w, h);
        ctx.restore();

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

        // ---- Trace-event memory layer (Fill Mode) ----
        // In Fill Mode: spawn paint traces at PAINT_TRACE.cooldownMs per
        // role (~6.7 stamps/sec each). Each trace has its own lifetime
        // and fades on its own curve via drawPaintTraces. The paint
        // canvas is cleared + redrawn from the trace list every frame —
        // it's a render cache, not state, so it can never accumulate.
        // In Live Mix: immediately empty the trace list AND clear the
        // paint canvas — no fade-out — so Live always looks clean.
        if (mc.paintField) {
            const nowMs = performance.now();
            for (const role of ROLES) {
                const src = sourcePositions[role];
                if (!src) continue;
                const vol = Math.max(smoothVolumes[role] || 0, simulatedVolumes[role] || 0);
                if (vol < CONFIG.volumeThresholdVisual) continue;
                // Per-role cooldown: keeps the alive-traces count bounded
                // even with continuous speaking.
                if (nowMs - (lastPaintTraceAt[role] || 0) < PAINT_TRACE.cooldownMs) continue;
                lastPaintTraceAt[role] = nowMs;
                const v = roleVelocityScreen[role] || { x: 0, y: 0 };
                const speedPx = Math.sqrt(v.x * v.x + v.y * v.y);
                spawnPaintTrace(role, src.x, src.y, COLORS[role], vol, speedPx);
            }
            updatePaintTraces();
            drawPaintTraces();
        } else {
            // Live Mix: nothing lingers from a previous Fill round.
            if (activePaintTraces.length > 0) activePaintTraces = [];
            clearPaintCanvas();
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
        // Wave-field interaction (NOT a separate event). drawWaveInteractions
        // checks current state every frame and deforms the existing
        // wavefields where two roles are both active + close. Draws on
        // TOP of rings so the deformation reads as a modification of the
        // visible ripples, not as something sitting beneath them.
        drawWaveInteractions();
        updateParticles();
        // (Particle-particle collision bursts disabled — those drew filled
        //  radial-gradient circles that read as bubbles between sources.
        //  Wave-field interaction via drawWaveInteractions above is the
        //  sole collision visual now, and it's stroke-only by design.
        //  Functions kept defined for future re-enabling without code
        //  changes — just uncomment these three calls.)
        // detectCollisions(); updateCollisionBursts(); drawCollisionBursts();
        drawParticles();

        ctx.restore();
        // The painted foam-wedge boundary is now OPTIONAL. The top-view
        // Dead Room photo (#playgroundFloor in style.css) already shows
        // the real wedges, so painting another set on top creates a
        // "two foams" visual collision. Flip this flag to true if you
        // ever swap back to a photo-less playground.
        if (PAINTED_FOAM_BOUNDARY_OPTS.enabled) drawRoomBoundary();

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
        role:        document.getElementById('dbgRole'),
        phase:       document.getElementById('dbgPhase'),
        round:       document.getElementById('dbgRound'),
        connected:   document.getElementById('dbgConnected'),
        volumes:     document.getElementById('dbgVolumes'),
        sims:        document.getElementById('dbgSims'),
        particles:   document.getElementById('dbgParticles'),
        rings:       document.getElementById('dbgRings'),
        paintTraces: document.getElementById('dbgPaintTraces'),
        oldestTrace: document.getElementById('dbgOldestTrace'),
        fillTuning:  document.getElementById('dbgFillTuning'),
        simVol:      document.getElementById('dbgSimVol'),
        lastFrame:   document.getElementById('dbgLastFrame'),
        panel:       document.getElementById('debugPanel'),
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

        // --- Fill Mode fade diagnostics ---
        // Trace count + oldest-age% so we can tell whether "still visible"
        // is from a healthy trace pool or from a stuck render.
        if (dbgElems.paintTraces) {
            dbgElems.paintTraces.textContent = `${activePaintTraces.length} active`;
        }
        if (dbgElems.oldestTrace) {
            if (activePaintTraces.length === 0) {
                dbgElems.oldestTrace.textContent = 'none';
            } else {
                const nowMs = performance.now();
                let oldestAge = 0;
                for (const tr of activePaintTraces) {
                    const a = (nowMs - tr.born) / tr.duration;
                    if (a > oldestAge) oldestAge = a;
                }
                dbgElems.oldestTrace.textContent = `${(oldestAge * 100).toFixed(0)}% of life`;
            }
        }
        if (dbgElems.fillTuning) {
            const mc = getModeConfig();
            dbgElems.fillTuning.textContent =
                `trail=${(mc.trailAlpha || 0).toFixed(3)}  ` +
                `pLife=${(mc.particleLifeMul || 1).toFixed(2)}  ` +
                `rLife=${(mc.ringLifeMul || 1).toFixed(2)}`;
        }
        if (dbgElems.simVol) {
            // Same as dbgElems.sims, but explicit role labels — quick read
            // for "is simulated volume still active and stamping traces?"
            dbgElems.simVol.textContent =
                `R=${fmt(simulatedVolumes.red)} G=${fmt(simulatedVolumes.green)} B=${fmt(simulatedVolumes.blue)}`;
        }

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
