/* ============================================
   Chromatic Echoes — Multiplayer Game Server
   HTTP static files + WebSocket game state
   Two modes: Live Mix & Accumulate
   ============================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 8080;
const HOST = '0.0.0.0';

// ---- MIME Types ----
const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

// ---- Round Library (typed; one entry per round) ----
// `kind` decides what UI the client renders and how the server ends the round:
//   'solo'   — hear yourself; ends via host `end_round`.
//   'move'   — directionality; ends via host `end_round`.
//   'mix'    — co-create the target colour; ends automatically when the mix is held.
//   'silent' — listen for micro-sounds; ends via host `end_round`.
const ROUNDS = [
    { id: 'solo-1',   kind: 'solo',   title: 'Solo Echo',
      instruction: 'Make a sound. Hear how it returns — or doesn’t.' },
    { id: 'move-1',   kind: 'move',   title: 'Move Echo',
      instruction: 'Step to a new position. Notice how your colour moves with you.' },
    { id: 'mix-1',    kind: 'mix',    title: 'Mix Echo: Warm Purple',
      instruction: 'Together, paint Warm Purple. Hold the mix.',
      target: { name: 'Warm Purple', r: 40, g: 15, b: 45 } },
    { id: 'silent-1', kind: 'silent', title: 'Silent Echo',
      instruction: 'Listen. What is the room saying when no one speaks?' },
    { id: 'mix-2',    kind: 'mix',    title: 'Mix Echo: Teal',
      instruction: 'Now paint Teal together.',
      target: { name: 'Teal', r: 15, g: 45, b: 40 } },
];

// ---- Game State ----
let game = createFreshGame();

// Outer museum walkthrough — independent of the per-round `phase` machine.
// Visitors flow: waiting-room -> threshold -> dead-room -> archive.
// All existing gameplay lives inside `experienceStage === 'dead-room'`.
const STAGES = ['waiting-room', 'threshold', 'dead-room', 'archive'];

function createFreshGame() {
    return {
        experienceStage: 'waiting-room', // outer museum stage (see STAGES)
        phase: 'lobby',                  // lobby | playing | success (inner, dead-room only)
        mode: 'live',                    // 'live' | 'accumulate'
        host: null,                      // ws connection
        players: { red: null, green: null, blue: null },
        volumes: { red: 0, green: 0, blue: 0 },
        accumulated: { red: 0, green: 0, blue: 0 },  // for accumulate mode
        matchTimer: 0,
        roundIndex: 0,
        rounds: ROUNDS,
    };
}

function getAvailableRoles() {
    const roles = [];
    if (!game.players.red) roles.push('red');
    if (!game.players.green) roles.push('green');
    if (!game.players.blue) roles.push('blue');
    return roles;
}

function getConnectedPlayers() {
    const list = [];
    if (game.players.red) list.push('red');
    if (game.players.green) list.push('green');
    if (game.players.blue) list.push('blue');
    return list;
}

function getCurrentRound() {
    return game.rounds[game.roundIndex % game.rounds.length];
}

// Public round descriptor sent to clients; never includes the target for non-mix kinds.
function getCurrentRoundPublic() {
    const r = getCurrentRound();
    return { id: r.id, kind: r.kind, title: r.title, instruction: r.instruction };
}

// Backwards-compatible target getter. Legacy clients still read state.target.
function getCurrentTarget() {
    return getCurrentRound().target || null;
}

// Compute current mix from LIVE volumes (Mode 1)
function computeLiveMix() {
    const rv = game.volumes.red;
    const gv = game.volumes.green;
    const bv = game.volumes.blue;
    const total = rv + gv + bv;
    if (total < 0.001) return { r: 0, g: 0, b: 0, total: 0 };
    return {
        r: Math.round((rv / total) * 100),
        g: Math.round((gv / total) * 100),
        b: Math.round((bv / total) * 100),
        total,
    };
}

// Compute current mix from ACCUMULATED values (Mode 2)
function computeAccumulatedMix() {
    const rv = game.accumulated.red;
    const gv = game.accumulated.green;
    const bv = game.accumulated.blue;
    const total = rv + gv + bv;
    if (total < 0.001) return { r: 0, g: 0, b: 0, total: 0 };
    return {
        r: Math.round((rv / total) * 100),
        g: Math.round((gv / total) * 100),
        b: Math.round((bv / total) * 100),
        total,
    };
}

function computeCurrentMix() {
    return game.mode === 'accumulate' ? computeAccumulatedMix() : computeLiveMix();
}

// Check if current mix matches target within tolerance
function checkMatch(mix, target, tolerance) {
    if (mix.total < 0.05) return false;
    return Math.abs(mix.r - target.r) <= tolerance &&
           Math.abs(mix.g - target.g) <= tolerance &&
           Math.abs(mix.b - target.b) <= tolerance;
}

// ---- Broadcast to all connected clients ----
// Defensive: a single failing client must not throw out of forEach and stop
// the broadcast for everyone else. We saw the server wedge after a rapid
// refresh — almost certainly a half-closed socket throwing on send().
function broadcast(msg) {
    const data = JSON.stringify(msg);
    wss.clients.forEach(client => {
        if (client.readyState !== 1) return;
        try {
            client.send(data);
        } catch (e) {
            console.error('broadcast send failed:', e.message);
            try { client.terminate(); } catch (_) { /* ignore */ }
        }
    });
}

function broadcastState() {
    const target = getCurrentTarget();
    const mix = computeCurrentMix();
    broadcast({
        type: 'state',
        experienceStage: game.experienceStage,
        phase: game.phase,
        mode: game.mode,
        availableRoles: getAvailableRoles(),
        connectedPlayers: getConnectedPlayers(),
        hasHost: !!game.host,
        round: getCurrentRoundPublic(),
        target,
        roundIndex: game.roundIndex,
        totalRounds: game.rounds.length,
        volumes: game.volumes,
        accumulated: game.accumulated,
        currentMix: mix,
        matchTimer: game.matchTimer,
    });
}

// ---- HTTP Server ----
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// ---- WebSocket Server ----
const wss = new WebSocketServer({ server });
wss.on('error', (err) => console.error('WSS error:', err.message));

// Process-level safety net. Without this, a single thrown error inside any
// async handler can leave the HTTP server listening but unresponsive (the
// exact "can't reach the link" symptom we hit).
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT:', err && err.stack || err);
});
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});

// Game loop — broadcast frames at ~30fps during play
const MATCH_TOLERANCE = 5;        // ±5%
const MATCH_HOLD_FRAMES = 90;     // 3 seconds at 30fps
const FRAME_INTERVAL = 33;        // ~30fps
const ACCUMULATE_RATE = 0.02;     // how fast volumes accumulate per frame

let gameLoopInterval = null;

function startGameLoop() {
    if (gameLoopInterval) return;
    gameLoopInterval = setInterval(() => {
        if (game.phase !== 'playing') return;

        // In accumulate mode, add current volumes to accumulated pool
        if (game.mode === 'accumulate') {
            for (const color of ['red', 'green', 'blue']) {
                if (game.volumes[color] > 0.02) {
                    game.accumulated[color] += game.volumes[color] * ACCUMULATE_RATE;
                }
            }
        }

        const current = getCurrentRound();
        const target = current.target || null;
        const mix = computeCurrentMix();

        // Auto-success only applies to mix rounds. Solo / move / silent are ended
        // by the host via 'end_round'.
        if (current.kind === 'mix' && target && checkMatch(mix, target, MATCH_TOLERANCE)) {
            game.matchTimer++;
            if (game.matchTimer >= MATCH_HOLD_FRAMES) {
                game.phase = 'success';
                broadcast({
                    type: 'success',
                    round: getCurrentRoundPublic(),
                    color: target,
                    roundIndex: game.roundIndex,
                    hasNext: game.roundIndex < game.rounds.length - 1,
                    mode: game.mode,
                });
                broadcastState();
                return;
            }
        } else if (current.kind === 'mix') {
            if (game.mode === 'live') {
                game.matchTimer = Math.max(0, game.matchTimer - 2);
            } else {
                game.matchTimer = Math.max(0, game.matchTimer - 1);
            }
        }

        // Broadcast live frame (every kind gets one; the client decides what to render)
        broadcast({
            type: 'frame',
            kind: current.kind,
            mode: game.mode,
            volumes: { ...game.volumes },
            accumulated: { ...game.accumulated },
            currentMix: mix,
            matchTimer: game.matchTimer,
            matchRequired: MATCH_HOLD_FRAMES,
        });
    }, FRAME_INTERVAL);
}

function stopGameLoop() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
    }
}

wss.on('connection', (ws) => {
    console.log('Client connected. Total:', wss.clients.size);

    ws._role = null;

    // A socket-level error from one client must not propagate up the ws lib
    // and kill the whole server. Log and let the matching 'close' fire.
    ws.on('error', (err) => {
        console.error('WS client error (', ws._role || 'unjoined', '):', err.message);
    });

    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }

        switch (msg.type) {

            case 'join': {
                const role = msg.role;

                if (role === 'host') {
                    if (game.host) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Host already exists' }));
                        return;
                    }
                    game.host = ws;
                    ws._role = 'host';
                    ws.send(JSON.stringify({ type: 'assigned', role: 'host' }));
                    console.log('Host joined');

                } else if (['red', 'green', 'blue'].includes(role)) {
                    if (game.players[role]) {
                        ws.send(JSON.stringify({ type: 'error', message: `${role} is already taken` }));
                        return;
                    }
                    game.players[role] = ws;
                    ws._role = role;
                    ws.send(JSON.stringify({ type: 'assigned', role }));
                    console.log(`Player ${role} joined`);
                }

                broadcastState();
                break;
            }

            case 'volume': {
                const role = ws._role;
                if (role && game.players[role] === ws && game.phase === 'playing') {
                    game.volumes[role] = Math.max(0, Math.min(1, msg.level || 0));
                }
                break;
            }

            case 'set_stage': {
                if (ws._role !== 'host') return;
                if (!STAGES.includes(msg.stage)) return;
                game.experienceStage = msg.stage;
                // Leaving dead-room mid-round? Park the round back at lobby so it
                // doesn't keep broadcasting frames behind the new screen.
                if (msg.stage !== 'dead-room' && game.phase === 'playing') {
                    stopGameLoop();
                    game.phase = 'lobby';
                    game.volumes = { red: 0, green: 0, blue: 0 };
                    game.accumulated = { red: 0, green: 0, blue: 0 };
                    game.matchTimer = 0;
                }
                broadcastState();
                console.log(`Stage -> ${game.experienceStage}`);
                break;
            }

            case 'set_mode': {
                if (ws._role !== 'host') return;
                if (game.phase === 'lobby' && (msg.mode === 'live' || msg.mode === 'accumulate')) {
                    game.mode = msg.mode;
                    broadcastState();
                    console.log(`Mode set to: ${game.mode}`);
                }
                break;
            }

            case 'start_round': {
                if (ws._role !== 'host') return;
                if (game.phase === 'lobby' || game.phase === 'success') {
                    game.phase = 'playing';
                    game.matchTimer = 0;
                    game.volumes = { red: 0, green: 0, blue: 0 };
                    game.accumulated = { red: 0, green: 0, blue: 0 };
                    startGameLoop();
                    broadcastState();
                    console.log(`Round ${game.roundIndex + 1} started (${game.mode}): ${getCurrentTarget().name}`);
                }
                break;
            }

            case 'end_round': {
                if (ws._role !== 'host') return;
                if (game.phase !== 'playing') return;
                const current = getCurrentRound();
                // Host-ended success is the right exit for non-mix kinds; mix rounds
                // normally auto-end, but we allow host to force-end them too if needed.
                game.phase = 'success';
                broadcast({
                    type: 'success',
                    round: getCurrentRoundPublic(),
                    color: current.target || null,
                    roundIndex: game.roundIndex,
                    hasNext: game.roundIndex < game.rounds.length - 1,
                    mode: game.mode,
                    endedBy: 'host',
                });
                broadcastState();
                console.log(`Round ${game.roundIndex + 1} (${current.kind}) ended by host`);
                break;
            }

            case 'next_round': {
                if (ws._role !== 'host') return;
                if (game.phase === 'success') {
                    game.roundIndex++;
                    if (game.roundIndex >= game.rounds.length) {
                        game.roundIndex = 0;
                    }
                    game.phase = 'playing';
                    game.matchTimer = 0;
                    game.volumes = { red: 0, green: 0, blue: 0 };
                    game.accumulated = { red: 0, green: 0, blue: 0 };
                    broadcastState();
                    console.log(`Next round (${game.mode}): ${getCurrentTarget().name}`);
                }
                break;
            }

            case 'restart': {
                if (ws._role !== 'host') return;
                stopGameLoop();
                const hostWs = game.host;
                const players = { ...game.players };
                const mode = game.mode;
                game = createFreshGame();
                game.host = hostWs;
                game.players = players;
                game.mode = mode;
                startGameLoop();
                broadcastState();
                console.log('Game restarted by host');
                break;
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected. Role:', ws._role);

        if (ws._role === 'host') {
            game.host = null;
            stopGameLoop();
            game = createFreshGame();
            broadcastState();
            console.log('Host left — game reset');
        } else if (ws._role && game.players[ws._role] === ws) {
            game.players[ws._role] = null;
            game.volumes[ws._role] = 0;
            broadcastState();
            console.log(`Player ${ws._role} left`);
        }
    });

    // Send current state to newly connected client
    ws.send(JSON.stringify({
        type: 'state',
        experienceStage: game.experienceStage,
        phase: game.phase,
        mode: game.mode,
        availableRoles: getAvailableRoles(),
        connectedPlayers: getConnectedPlayers(),
        hasHost: !!game.host,
        round: getCurrentRoundPublic(),
        target: getCurrentTarget(),
        roundIndex: game.roundIndex,
        totalRounds: game.rounds.length,
        volumes: game.volumes,
        accumulated: game.accumulated,
        currentMix: computeCurrentMix(),
        matchTimer: game.matchTimer,
    }));
});

// ---- Start ----
server.listen(PORT, HOST, () => {
    console.log(`\n🎨 Chromatic Echoes Server`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${getLocalIP()}:${PORT}\n`);
});

function getLocalIP() {
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}
