// PM2 configuration for the Chromatic Echoes museum installation.
//
// Purpose: keep `node server.js` alive across (a) terminal close,
// (b) accidental crashes mid-walkthrough, and (c) optionally laptop reboot
// (requires `pm2 startup` / `pm2-windows-startup` separately).
//
// Run with:
//   npm run start:pm2     (start in background, supervised)
//   npm run stop:pm2      (stop the supervised process)
//   npm run restart:pm2   (graceful restart — keep PM2 daemon alive)
//   npm run logs:pm2      (tail combined stdout/stderr)
//   npm run status:pm2    (one-shot status table)
//
// This file deliberately leaves three values for the museum operator to
// set (search for TODO). Each is a real operational choice — defaults
// shown in comments are conservative starting points.

module.exports = {
    apps: [
        {
            name: 'chromatic-echoes',
            script: 'server.js',
            cwd: __dirname,

            // ---- Restart behaviour ----
            // PM2 will restart the process automatically when it exits with
            // a non-zero code. The fields below shape HOW aggressively.

            // Max restarts within `min_uptime` before PM2 gives up and
            // marks the app "errored". 10 = tolerant of flaky boot,
            // strict enough that a truly broken build won't churn forever.
            max_restarts: 10,

            // Minimum uptime that counts as "successful start". If the
            // process dies sooner than this, the restart counts toward
            // max_restarts. 10s is comfortably more than the WS server's
            // bind-and-serve time on this codebase.
            min_uptime: 10000,

            // Wait this long between restarts so we don't busy-loop on a
            // crash that happens immediately on boot.
            restart_delay: 2000,

            // File-watching is OFF — a stray save mid-walkthrough would
            // drop every WS connection. Use a separate dev config if you
            // want auto-restart during development.
            watch: false,

            // ---- Logging ----
            // PM2 captures stdout + stderr to ~/.pm2/logs by default.
            // Tailing via `npm run logs:pm2` is usually enough; uncomment
            // these to redirect to repo-local files if you want them
            // alongside the code instead.
            // out_file: './logs/out.log',
            // error_file: './logs/error.log',
            time: true,            // prefix each log line with an ISO timestamp

            // ---- Process model ----
            // Single instance — the WS server holds shared in-memory state
            // (rooms, player roles, round phase). Clustering would split
            // that state across workers and break the experience.
            instances: 1,
            exec_mode: 'fork',
        },
    ],
};
