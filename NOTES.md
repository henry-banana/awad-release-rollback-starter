# IA04 verification notes

## Environment

The drill ran on Windows in PowerShell 7 with host Node 24.16.0, npm 12.0.2,
Docker Engine 29.9.3, and Compose 5.7.0. The application images run Node
22.22.0. Docker Desktop was initially stopped and started successfully with
`docker desktop start --detach`.

## PowerShell command forwarding

Codex first tried the README's
`npm run check -- image --new=linkbox:v1` in PowerShell. npm printed
`EUNKNOWNCONFIG` and flagged `--new` before it launched the checker.
`node tools/check.js image --new=linkbox:v1` passed all 15 image checks.
The final `npm run check` uses both default image tags and needs no extra
arguments.

The Node 22 SQLite experimental warning appears in the migration output. The
migrations returned exit code 0. The original `tools/` and `test/app.test.js`
remain the inputs to the checks.

## Test coverage

The course checker verifies expiry propagation, redirect status, schema
compatibility, and the drill metrics. The additional `test/expiry.test.js`
verifies that an expired link keeps its list and detail representations, a
410 leaves the hit count alone, and disabling the flag restores redirect and
hit behavior. The test also checks the missing-token response.

`expiresInSeconds` must yield an ISO timestamp representable by JavaScript.
An out-of-range positive duration receives 400.

The local drill assumes one operator using the router control port. The gate
checks router error counters during rollout. The separate load log checks the
HTTP contract and recorded link state as well.

## Local state after evidence collection

After saving and checking the drill logs, Codex restored v1 to idle blue.
At that point, green served v2 at 100% on schema 002 with expiry enabled.
