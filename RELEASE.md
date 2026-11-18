# IA04 release and rollback plan

Build both images from their Git tags. At `v1`, run
`docker build --build-arg APP_VERSION=1.0.0 -t linkbox:v1 .`. At `v2`, run
`docker build --build-arg APP_VERSION=2.0.0 -t linkbox:v2 .`. Run the release and
rollback commands from the final checkout.

Start with a fresh local Compose project for the drill. For a repeat, run
`docker compose down -v` only on the disposable drill project because it removes
the drill database. In PowerShell set `$env:APP_ENV = 'staging'` and
`$env:BLUE_TAG = 'v1'`. Set `$expiryHeaders` to a PowerShell hashtable with
`x-admin-token` set to the value of `ADMIN_TOKEN` in `env/staging.env`.

| Schema after step | Serving after step | Command and observation | How to undo it | Compatible versions |
| --- | --- | --- | --- | --- |
| Empty | Router only | `docker compose up -d --build router` | Run `docker compose stop router` before starting load. | None on an empty schema. |
| 001 | Router only | `npm run migrate:image -- v1` | On the empty drill database only, before serving, run `npm run migrate:image -- v1 down`. Reverting 001 drops link data. | v1. |
| 001 | v1 in blue at 100% | `docker compose up -d --no-deps --wait blue` | Before load, run `docker compose stop blue`. | v1. |
| 001 | v1 in blue at 100% | Start `npm run load` in a separate terminal. Wait for the first samples and leave it running across the remaining steps. | End load with Ctrl+C when the run is complete. | v1. |
| 001 and 002 | v1 in blue at 100% | `npm run migrate:image -- v2`, then wait about 10 s. The migration mark must precede all v2 traffic and v1 must serve on the new schema for at least 5 s in the log. | With only v1 running, run `npm run migrate:image -- v2 down`. This discards expiry metadata and resets the flag on a later up. | v1, v2, and v3-bad with the same v2 schema. |
| 001 and 002 | v1 and v2 during canary, then v2 in green at 100% | `npm run release -- v2` | If already promoted, `npm run rollback` sends 100% back to blue. Leave 002 applied. | v1, v2, and v3-bad. |
| 001 and 002 | v2 in green at 100% | `Invoke-RestMethod -Method Put -Uri http://127.0.0.1:8080/admin/flags/expiry -Headers $expiryHeaders -ContentType 'application/json' -Body '{"enabled":true}'`, then wait 10 s. | Send the same PUT with `{"enabled":false}` while v2 serves. | v1 ignores expiry, v2 and v3-bad read the flag. |
| 001 and 002 | v1 in blue at 100% | `npm run rollback`, then hold v1 alone for at least 10 s. | `npm run release -- v2` returns traffic to green through the canary. | v1, v2, and v3-bad. |
| 001 and 002 | v1 and v2 during canary, then v2 in green at 100% | `npm run release -- v2` | `npm run rollback` can return traffic to blue while it still holds v1. | v1, v2, and v3-bad. |
| 001 and 002 | v2 in green at 100% | `npm run drill:build -- v2` | Optionally remove the unused image with `docker image rm linkbox:v3-bad` before attempting the drill. | v1, v2, and v3-bad. |
| 001 and 002 | v3-bad briefly takes 20% in blue. v2 in green returns to 100% after the gate trips. | `npm run release -- v3-bad`. Observe automatic rollback and hold v2 for at least 10 s after the last bad response. | The command restores green itself. To restore standby capacity, redeploy v1 into idle blue with `docker compose up -d --no-deps --wait blue` and `BLUE_TAG=v1`. | v1, v2, and v3-bad for the schema. Only v1 and v2 are known good. |
| 001 and 002 | v2 in green at 100% | End `npm run load` with Ctrl+C. Run `npm run check 2>&1 \| Tee-Object -FilePath check-log.txt` in PowerShell. | Keep this run's logs together. For a new run, save the earlier logs first and start with a fresh drill database. | v1, v2, and v3-bad. |

Capture every migrate, release and rollback command in `release-log.txt`. The
bad release exits nonzero after it confirms that green has recovered all traffic.

## Health and canary gate

The release starts the candidate in the slot with zero traffic. It checks
Docker health before changing the weights. A healthy release takes 20% for
12 seconds, 40% for 12 seconds, and then 100%. The old slot keeps running.
Every weight change is confirmed with a fresh `GET :8081/state`.

The gate samples the candidate's router counters every 500 ms. It compares the
cumulative error count with the value just before canary traffic. Two new
errors across the stages trigger automatic rollback. One transient error can
occur without immediately stopping a release. Two are enough to stop this
drill early, since v3-bad returns 500 for about 30% of link reads and redirects
while its health endpoint stays green. The first stage keeps exposure small.

Router errors cover HTTP 5xx and upstream connection failures. A wrong redirect,
a missing field, a lost hit, or a successful response that is too slow to be
useful can evade this gate. A small or unrepresentative sample can miss bugs,
and the script stops observing once it promotes the candidate. Read the
separate load report for contract and data errors.

## What rollback leaves behind

Traffic rollback changes weights. The link rows and hits recorded by either
version, migration 002, expiry timestamps, and the flag stay in the shared
database. A link that expires while v1 is serving still redirects and records
hits on v1. After returning to v2 with the flag enabled, that same link returns
410 and no longer records redirect hits. Hits already recorded by v1 remain.
A link created by v1 has no expiry timestamp.

Traffic can return to v1 throughout the exercise by keeping or redeploying v1
on schema 002. The optional SQL down migration has a separate point of no
return for expiry metadata. First direct traffic to v1, then stop any running
v2 or v3-bad slot before running `npm run migrate:image -- v2 down`. The down
step drops expiry timestamps and the flag. Running up again restores the schema
with a fresh disabled flag, while the previous expiry values require a backup
to recover. The demonstrated traffic rollback keeps schema 002 in place.
