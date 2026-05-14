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
    const gameHud = document.getElementById('gameHud');
    const btnHost = document.getElementById('btnHost');
    const btnJoin = document.getElementById('btnJoin');
    const roleCards = document.querySelectorAll('.role-card');
    const btnBackToLanding = document.getElementById('btnBackToLanding');
    const lobbyUrl = document.getElementById('lobbyUrl');
    const btnStartRound = document.getElementById('btnStartRound');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const lobbySlots = { red: document.getElementById('lobbyRed'), green: document.getElementById('lobbyGreen'), blue: document.getElementById('lobbyBlue') };
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
    const barRedVal = document.getElementById('barRedVal');
    const barGreenVal = document.getElementById('barGreenVal');
    const barBlueVal = document.getElementById('barBlueVal');
    const roundNum = document.getElementById('roundNum');
    const roundTotal = document.getElementById('roundTotal');
    const successColorName = document.getElementById('successColorName');
    const successSwatch = document.getElementById('successSwatch');
    const btnNextRound = document.getElementById('btnNextRound');
    const successHint = document.getElementById('successHint');

    const COLORS = { red: { r: 255, g: 51, b: 85 }, green: { r: 51, g: 255, b: 136 }, blue: { r: 51, g: 136, b: 255 } };
    const CONFIG = { volumeThreshold: 0.008, volumeMax: 0.30, trailAlpha: 0.06, particlesPerSource: 80, particleMaxSpeed: 4, particleMinSize: 1, particleMaxSize: 5, cloudBaseRadius: 50, cloudMaxRadius: 180, cloudLayers: 5 };

    // ---- State ----
    let ws = null, myRole = null, gameMode = 'live', audioCtx, analyser, timeDomainData;
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
        computePositions();
    }
    function computePositions() {
        const w = window.innerWidth, h = window.innerHeight;
        mixCenter = { x: w / 2, y: h / 2 };
        const m = Math.min(w, h) * 0.18;
        sourcePositions = { red: { x: m, y: m }, green: { x: w - m, y: m }, blue: { x: w / 2, y: h - m } };
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

    const particlePools = { red: [], green: [], blue: [] };
    function initParticles() {
        for (const c of ['red', 'green', 'blue']) {
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
        const opacity = lerp(0.08, 0.45, vn);
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85;
            source.connect(analyser); timeDomainData = new Float32Array(analyser.fftSize);
            return true;
        } catch (e) { console.error('Mic denied:', e); alert('Microphone access is required to play.'); return false; }
    }
    function getVolume() {
        if (!analyser) return 0;
        analyser.getFloatTimeDomainData(timeDomainData);
        let sum = 0; for (let i = 0; i < timeDomainData.length; i++) sum += timeDomainData[i] * timeDomainData[i];
        const rms = Math.sqrt(sum / timeDomainData.length);
        return Math.max(0, Math.min(1, (rms - CONFIG.volumeThreshold) / (CONFIG.volumeMax - CONFIG.volumeThreshold)));
    }

    // ---- WebSocket ----
    function connectWS() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${location.host}`);
        ws.onopen = () => console.log('Connected');
        ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
        ws.onclose = () => { console.log('Disconnected'); setTimeout(connectWS, 2000); };
        ws.onerror = (e) => console.error('WS error:', e);
    }
    function send(msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }

    // ---- Message Handling ----
    function handleMessage(msg) {
        switch (msg.type) {
            case 'assigned':
                myRole = msg.role;
                if (myRole === 'host') { showScreen('lobby'); }
                else { showScreen('playerWait'); playerColorLabel.textContent = myRole.toUpperCase(); playerColorLabel.className = 'color-label ' + myRole; waitPulse.className = 'pulse-ring ' + myRole; }
                break;
            case 'state': updateFromState(msg); break;
            case 'frame': updateFrame(msg); break;
            case 'success': handleSuccess(msg); break;
            case 'error': alert(msg.message); break;
        }
    }

    function updateFromState(s) {
        gameMode = s.mode || 'live';

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

        // Lobby slots
        ['red', 'green', 'blue'].forEach(c => {
            const slot = lobbySlots[c], connected = s.connectedPlayers.includes(c);
            slot.classList.toggle('connected', connected);
            slot.querySelector('.lobby-state').textContent = connected ? 'Connected!' : 'Waiting...';
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

        // Phase transitions
        if (s.phase === 'playing') {
            showScreen('none'); showGameHud(true, s); startRenderLoop();
        } else if (s.phase === 'lobby') {
            showGameHud(false); stopRenderLoop();
            if (myRole === 'host') showScreen('lobby');
            else if (myRole) showScreen('playerWait');
        }

        if (s.target) updateTargetDisplay(s.target, s.roundIndex, s.totalRounds);
    }

    function updateFrame(f) {
        gameMode = f.mode || gameMode;

        for (const c of ['red', 'green', 'blue']) {
            const t = f.volumes[c] || 0;
            smoothVolumes[c] += (t - smoothVolumes[c]) * 0.2;
        }

        const rv = Math.round(smoothVolumes.red * 100), gv = Math.round(smoothVolumes.green * 100), bv = Math.round(smoothVolumes.blue * 100);
        barRed.style.width = rv + '%'; barGreen.style.width = gv + '%'; barBlue.style.width = bv + '%';
        barRedVal.textContent = rv + '%'; barGreenVal.textContent = gv + '%'; barBlueVal.textContent = bv + '%';

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
    const screens = [screenLanding, screenRoles, screenLobby, screenPlayerWait, screenSuccess];
    function showScreen(name) {
        screens.forEach(s => s.classList.remove('active'));
        const map = { landing: screenLanding, roles: screenRoles, lobby: screenLobby, playerWait: screenPlayerWait, success: screenSuccess };
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

        for (const color of ['red', 'green', 'blue']) {
            const vol = smoothVolumes[color], src = sourcePositions[color];
            if (!src) continue;
            drawSourceCloud(src.x, src.y, vol, color);
            for (const p of particlePools[color]) { p.update(vol); p.draw(ctx, vol); }
        }

        const mix = {
            r: parseInt(mixR.textContent) || 0, g: parseInt(mixG.textContent) || 0,
            b: parseInt(mixB.textContent) || 0, total: smoothVolumes.red + smoothVolumes.green + smoothVolumes.blue
        };
        drawMixingBoxGlow(mix);
    }

    // ---- Events ----
    btnHost.addEventListener('click', () => { send({ type: 'join', role: 'host' }); lobbyUrl.textContent = location.href; });
    btnJoin.addEventListener('click', () => showScreen('roles'));
    btnBackToLanding.addEventListener('click', () => showScreen('landing'));

    roleCards.forEach(card => {
        card.addEventListener('click', async () => {
            if (card.disabled) return;
            const ok = await initAudio(); if (!ok) return;
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

    // ---- Init ----
    connectWS();
    showScreen('landing');
})();
