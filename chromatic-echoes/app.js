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
    const screenPlayerSetup = document.getElementById('screenPlayerSetup');
    const screenRoles = document.getElementById('screenRoles');
    const screenLobby = document.getElementById('screenLobby');
    const screenPlayerWait = document.getElementById('screenPlayerWait');
    const screenSuccess = document.getElementById('screenSuccess');
    const screenWaitingRoom = document.getElementById('screenWaitingRoom');
    const screenThreshold = document.getElementById('screenThreshold');
    const screenArchive = document.getElementById('screenArchive');
    const playerNameInput = document.getElementById('playerNameInput');
    const soundRoleCards = document.querySelectorAll('.sound-role-card');
    const btnSetupContinue = document.getElementById('btnSetupContinue');
    const btnSetupBack = document.getElementById('btnSetupBack');
    const zoneButtons = document.querySelectorAll('.zone-btn');
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
    const btnPlayerBack = document.getElementById('btnPlayerBack');
    const hudEmptyHint = document.getElementById('hudEmptyHint');
    const btnHost = document.getElementById('btnHost');
    const btnJoin = document.getElementById('btnJoin');
    const roleCards = document.querySelectorAll('.role-card');
    const btnBackToLanding = document.getElementById('btnBackToLanding');
    const lobbyUrl = document.getElementById('lobbyUrl');
    const btnStartRound = document.getElementById('btnStartRound');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const lobbySlots = {
        red:    document.getElementById('lobbyRed'),
        green:  document.getElementById('lobbyGreen'),
        blue:   document.getElementById('lobbyBlue'),
        purple: document.getElementById('lobbyPurple'),
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
    const mixingBox = document.getElementById('mixingBox');
    const matchProgressBar = document.getElementById('matchProgressBar');
    const barRed = document.getElementById('barRed');
    const barGreen = document.getElementById('barGreen');
    const barBlue = document.getElementById('barBlue');
    const barPurple = document.getElementById('barPurple');
    const barRedVal = document.getElementById('barRedVal');
    const barGreenVal = document.getElementById('barGreenVal');
    const barBlueVal = document.getElementById('barBlueVal');
    const barPurpleVal = document.getElementById('barPurpleVal');
    // Live-share-of-mix readouts. Per-role normalised contribution.
    const shareEls = {
        red:    document.getElementById('shareRed'),
        green:  document.getElementById('shareGreen'),
        blue:   document.getElementById('shareBlue'),
        purple: document.getElementById('sharePurple'),
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

    // Player identities. Purple was added in the MVP Phase 2 pass — it has
    // a particle pool + source cloud like the other three, but its mix
    // contribution is projected to R+B server-side so target maths stays RGB.
    const COLORS = {
        red:    { r: 255, g: 51,  b: 85  },
        green:  { r: 51,  g: 255, b: 136 },
        blue:   { r: 51,  g: 136, b: 255 },
        purple: { r: 178, g: 102, b: 255 },
    };
    const ROLES = ['red', 'green', 'blue', 'purple'];
    const ZONES = ['A', 'B', 'C', 'Center'];
    const SOUND_ROLES = ['voice', 'hum', 'clap', 'whisper', 'micro-sound'];
    const CONFIG = { volumeThreshold: 0.008, volumeMax: 0.30, trailAlpha: 0.06, particlesPerSource: 80, particleMaxSpeed: 4, particleMinSize: 1, particleMaxSize: 5, cloudBaseRadius: 110, cloudMaxRadius: 220, cloudLayers: 5, cloudMinOpacity: 0.32, cloudMaxOpacity: 0.6 };

    // ---- State ----
    let ws = null, myRole = null, gameMode = 'live', experienceStage = 'waiting-room';
    let currentRound = null;
    let connectedPlayers = [];  // role subset — for source labels
    // Each entry: {role, name, soundRole, zone, connected, volume}.
    // Pulled from the state broadcast; drives label text, zone-based source
    // positions, and the contribution panel.
    let playersInfo = [];
    // Visitor's own choices, filled in across the Setup → Roles → Wait flow.
    let myName = '';
    let mySoundRole = '';
    let myZone = 'Center';
    let audioCtx, analyser, timeDomainData;

    // Human-readable labels used on the HUD instruction strip.
    const KIND_LABELS = { solo: 'Solo Echo', move: 'Move Echo', mix: 'Mix Echo', silent: 'Silent Echo' };
    let animationId = null, time = 0;
    let smoothVolumes = { red: 0, green: 0, blue: 0, purple: 0 };
    let sourcePositions = {}, mixCenter = { x: 0, y: 0 };

    // Pure function: visitor-declared zone → on-screen anchor coordinates.
    // No GPS / IMU / camera. Each colour's source position is its player's
    // current zone (broadcast from the server). See docs/UI_ARCHITECTURE.md.
    function getZonePosition(zone, w, h) {
        const m = Math.min(w, h) * 0.20;
        switch (zone) {
            case 'A':      return { x: m,         y: m         };  // top-left
            case 'B':      return { x: w - m,     y: m         };  // top-right
            case 'C':      return { x: w / 2,     y: h - m     };  // bottom-centre
            case 'Center':
            default:       return { x: w / 2,     y: h / 2     };
        }
    }

    // ---- Canvas ----
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        computePositions();
    }
    // Recompute every role's source position from the latest broadcast zones.
    // Called on resize and on each state broadcast (because the visitor's
    // zone change for any role moves that role's anchor).
    function computePositions() {
        const w = window.innerWidth, h = window.innerHeight;
        mixCenter = { x: w / 2, y: h / 2 };
        const zoneByRole = {};
        for (const p of playersInfo) zoneByRole[p.role] = p.zone || 'Center';
        for (const role of ROLES) {
            sourcePositions[role] = getZonePosition(zoneByRole[role] || 'Center', w, h);
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ---- Particles ----
    class Particle {
        constructor(color) { this.color = color; this.reset(true); }
        reset(initial) {
            const src = sourcePositions[this.color] || mixCenter;
            this.x = src.x + (Math.random() - 0.5) * 40;
            this.y = src.y + (Math.random() - 0.5) * 40;
            this.size = CONFIG.particleMinSize + Math.random() * (CONFIG.particleMaxSize - CONFIG.particleMinSize);
            this.life = 1; this.decay = 0.003 + Math.random() * 0.005;
            this.angle = Math.atan2(mixCenter.y - src.y, mixCenter.x - src.x) + (Math.random() - 0.5) * 1.2;
            this.speed = 0.5 + Math.random() * CONFIG.particleMaxSpeed;
            this.opacity = 0.3 + Math.random() * 0.5;
            if (initial) this.life = Math.random();
        }
        update(volume) {
            const sp = 0.2 + volume * 2.5;
            this.x += Math.cos(this.angle) * this.speed * sp;
            this.y += Math.sin(this.angle) * this.speed * sp;
            this.angle += (Math.random() - 0.5) * 0.08;
            this.life -= this.decay * (0.5 + volume);

            // In accumulate mode, particles slow down and "stick" near the center
            if (gameMode === 'accumulate') {
                const dx = this.x - mixCenter.x, dy = this.y - mixCenter.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 90) {
                    this.speed *= 0.92; // slow down near center
                    this.life -= 0.002; // die a bit faster when inside box
                }
            }
            if (this.life <= 0) this.reset(false);
        }
        draw(ctx, volume) {
            if (volume < 0.01 && this.opacity < 0.05) return;
            const { r, g, b } = COLORS[this.color];
            const alpha = this.opacity * this.life * Math.max(0.05, volume);
            if (alpha < 0.005) return;
            const sz = this.size * (0.5 + volume * 1.5);
            ctx.beginPath(); ctx.arc(this.x, this.y, sz, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`; ctx.fill();
        }
    }

    const particlePools = { red: [], green: [], blue: [], purple: [] };
    function initParticles() {
        for (const c of ROLES) {
            particlePools[c] = [];
            for (let i = 0; i < CONFIG.particlesPerSource; i++) particlePools[c].push(new Particle(c));
        }
    }
    initParticles();

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

    function drawMixingBoxGlow(mix) {
        if (mix.total < 0.05) return;
        const r = Math.round((mix.r / 100) * 255), g = Math.round((mix.g / 100) * 255), b = Math.round((mix.b / 100) * 255);
        const intensity = gameMode === 'accumulate' ? Math.min(0.5, mix.total * 0.05 + 0.1) : Math.min(0.3, mix.total * 0.15);
        const grad = ctx.createRadialGradient(mixCenter.x, mixCenter.y, 20, mixCenter.x, mixCenter.y, 150);
        grad.addColorStop(0, `rgba(${r},${g},${b},${intensity.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(mixCenter.x, mixCenter.y, 150, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
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
        } catch (e) { console.error('Mic denied:', e); alert('Microphone access is required to play.'); return false; }
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
    let micMeterInterval = null;
    function startMicMeter() {
        if (micMeterInterval) return;
        micMeterInterval = setInterval(() => {
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
            case 'error': alert(msg.message); break;
        }
    }

    function updateFromState(s) {
        gameMode = s.mode || 'live';
        experienceStage = s.experienceStage || 'dead-room';
        connectedPlayers = Array.isArray(s.connectedPlayers) ? s.connectedPlayers : [];
        playersInfo      = Array.isArray(s.players)          ? s.players          : [];
        // Player zones live on each playersInfo entry. Recompute the
        // anchors so the next frame renders dots at the right zones.
        computePositions();

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
                ? 'Mode: Fill — your sound will collect color in the mixing box'
                : 'Mode: Live Mix — match the target ratio with your volume';
        }

        // Lobby slots — iterate ROLES so a Purple slot (added in the MVP
        // Phase 2 HTML pass) lights up the same way. Guard against missing
        // DOM in case the HTML hasn't been updated yet.
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
                showGameHud(false); stopRenderLoop();
                if (myRole === 'host') showScreen('lobby');
                else if (myRole) showScreen('playerWait');
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
        // "No players connected" hint — only the host needs to see it, and
        // only when a round is actually trying to play with zero phones.
        if (hudEmptyHint) {
            const showHint = myRole === 'host'
                && experienceStage === 'dead-room'
                && s.phase === 'playing'
                && connectedPlayers.length === 0;
            hudEmptyHint.classList.toggle('hidden', !showHint);
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

    function updateFrame(f) {
        gameMode = f.mode || gameMode;
        const kind = f.kind || (currentRound && currentRound.kind) || 'mix';

        for (const c of ROLES) {
            const t = (f.volumes && f.volumes[c]) || 0;
            smoothVolumes[c] += (t - smoothVolumes[c]) * 0.2;
        }

        // Raw-volume bars (visual liveness: "yes, you're heard").
        const rv = Math.round(smoothVolumes.red * 100);
        const gv = Math.round(smoothVolumes.green * 100);
        const bv = Math.round(smoothVolumes.blue * 100);
        const pv = Math.round(smoothVolumes.purple * 100);
        barRed.style.width    = rv + '%';
        barGreen.style.width  = gv + '%';
        barBlue.style.width   = bv + '%';
        barPurple.style.width = pv + '%';
        barRedVal.textContent    = rv + '%';
        barGreenVal.textContent  = gv + '%';
        barBlueVal.textContent   = bv + '%';
        barPurpleVal.textContent = pv + '%';

        // Live contribution % — each role's share of the total raw volume
        // across all four colours. "— of mix" while everyone is silent.
        const totalRaw = rv + gv + bv + pv;
        for (const role of ROLES) {
            const el = shareEls[role];
            if (!el) continue;
            if (totalRaw < 1) { el.textContent = '— of mix'; continue; }
            const myRaw = role === 'red' ? rv : role === 'green' ? gv : role === 'blue' ? bv : pv;
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

    function updateTargetDisplay(target, idx, total) {
        const r = Math.round((target.r / 100) * 255), g = Math.round((target.g / 100) * 255), b = Math.round((target.b / 100) * 255);
        targetSwatch.style.background = `rgb(${r},${g},${b})`;
        targetName.textContent = target.name;
        targetR.textContent = target.r; targetG.textContent = target.g; targetB.textContent = target.b;
        roundNum.textContent = idx + 1; roundTotal.textContent = total;
    }

    // ---- Screen Management ----
    const screens = [screenLanding, screenPlayerSetup, screenRoles, screenLobby, screenPlayerWait, screenSuccess,
                     screenWaitingRoom, screenThreshold, screenArchive];
    function showScreen(name) {
        screens.forEach(s => s.classList.remove('active'));
        const map = {
            landing: screenLanding, setup: screenPlayerSetup, roles: screenRoles, lobby: screenLobby,
            playerWait: screenPlayerWait, success: screenSuccess,
            waitingRoom: screenWaitingRoom, threshold: screenThreshold, archive: screenArchive,
        };
        if (map[name]) map[name].classList.add('active');
    }
    function showGameHud(visible, state) {
        gameHud.classList.toggle('hidden', !visible);
        if (visible && state) updateTargetDisplay(state.target, state.roundIndex, state.totalRounds);
    }

    // ---- Render Loop ----
    function startRenderLoop() { if (!animationId) render(); }
    function stopRenderLoop() { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }

    function render() {
        animationId = requestAnimationFrame(render);
        const w = window.innerWidth, h = window.innerHeight;
        time += 0.016;
        ctx.fillStyle = `rgba(5,5,8,${CONFIG.trailAlpha})`; ctx.fillRect(0, 0, w, h);

        if (myRole && myRole !== 'host') { const vol = getVolume(); send({ type: 'volume', level: vol }); }

        for (const color of ROLES) {
            const vol = smoothVolumes[color], src = sourcePositions[color];
            if (!src) continue;
            // Only draw a colour if a phone is actually connected on it,
            // OR the colour has measurable volume (during the brief decay
            // after disconnect). Avoids four faint glows on an empty room.
            const isConnected = connectedPlayers.includes(color);
            if (!isConnected && vol < 0.005) continue;
            drawSourceCloud(src.x, src.y, vol, color);
            for (const p of particlePools[color]) { p.update(vol); p.draw(ctx, vol); }
            drawSourceLabel(src.x, src.y, color, isConnected);
        }

        const mix = {
            r: parseInt(mixR.textContent) || 0, g: parseInt(mixG.textContent) || 0,
            b: parseInt(mixB.textContent) || 0, total: smoothVolumes.red + smoothVolumes.green + smoothVolumes.blue
        };
        drawMixingBoxGlow(mix);
    }

    // ---- Events ----
    btnHost.addEventListener('click', () => { send({ type: 'join', role: 'host' }); lobbyUrl.textContent = location.href; });
    btnJoin.addEventListener('click', () => showScreen('setup'));   // setup BEFORE colour pick
    btnBackToLanding.addEventListener('click', () => showScreen('landing'));
    btnSetupBack.addEventListener('click', () => showScreen('landing'));

    // ---- Player Setup wiring ----
    // Continue is enabled only once a sound role is picked. Name is optional.
    function updateSetupContinueState() {
        btnSetupContinue.disabled = !mySoundRole;
    }
    soundRoleCards.forEach(card => {
        card.addEventListener('click', () => {
            mySoundRole = card.dataset.soundRole;
            soundRoleCards.forEach(c => c.classList.toggle('active', c === card));
            updateSetupContinueState();
        });
    });
    playerNameInput.addEventListener('input', () => { myName = playerNameInput.value.trim().slice(0, 40); });
    btnSetupContinue.addEventListener('click', () => showScreen('roles'));

    // ---- Zone picker wiring ----
    // Updates local UI immediately and tells the server. Server broadcasts
    // zones to everyone so the projection moves the player's dot.
    function applyZone(zone) {
        if (!ZONES.includes(zone)) return;
        myZone = zone;
        zoneButtons.forEach(b => b.classList.toggle('active', b.dataset.zone === zone));
        if (myRole && myRole !== 'host') send({ type: 'set_zone', zone });
    }
    zoneButtons.forEach(b => b.addEventListener('click', () => applyZone(b.dataset.zone)));
    applyZone('Center');   // default highlight

    roleCards.forEach(card => {
        card.addEventListener('click', async () => {
            if (card.disabled) return;
            const ok = await initAudio(); if (!ok) return;
            // Send everything we know about the visitor in the join — name +
            // sound role (gathered on Setup) + zone (defaulting to Center
            // until they tap a zone button on the wait screen).
            send({
                type: 'join',
                role: card.dataset.role,
                name: myName,
                soundRole: mySoundRole,
                zone: myZone,
            });
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

    // Museum walkthrough — stage transitions (host only; server enforces the role check too)
    btnAdvanceToThreshold.addEventListener('click', () => send({ type: 'set_stage', stage: 'threshold' }));
    btnAdvanceToDeadRoom.addEventListener('click', () => send({ type: 'set_stage', stage: 'dead-room' }));
    btnBackToWaiting.addEventListener('click', () => send({ type: 'set_stage', stage: 'waiting-room' }));
    btnArchiveNewSession.addEventListener('click', () => send({ type: 'set_stage', stage: 'waiting-room' }));
    stageToolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => send({ type: 'set_stage', stage: btn.dataset.stage }));
    });

    // ---- Init ----
    connectWS();
    showScreen('landing');
})();
