# IA04 AI assistance log

Student ID: 23120262

TDTH-FLAG

## 2026-11-18: Requirements and handover

Tool: Codex (OpenAI), with the mattpocock-skills research and code review
guidance applied locally.

Asked for: Read the IA04 rubric and starter, list the tasks, then complete the
work up to the student's review. The student requested the marker above and
provided IA01 through IA03 as format references.

Kept: The rubric, starter README, and `docs/CHANGE.md` as the sources of
requirements. The initial clean starter commit is `7a19624`.

Changed: The assistant turned the checklist into phase briefs before
implementation. The briefs record the assigned scope and completion checks.

Rejected: None in the requirements review. The student's handover reserves
archive creation until after review.

By hand: The student gave the scope and attribution instruction. Codex
prepared the briefs and performed the implementation and automated checks.

## 2026-11-18: Package v1

Tool: Codex (OpenAI).

Asked for: Implement and verify the isolated packaging phase in `BRIEF.md`.

Kept: The original routes, the public app factory and migration CLI, and both
protected test inputs. The `v1` tag identifies the packaging commit.

Changed: Codex replaced the starter image with a 229 MB non-root build and
separated migration from startup. The starter image inspection had reported
1,783,461,900 bytes, no configured user, and no healthcheck.

Rejected: Codex used the README's npm command with a trailing `--new` option
in PowerShell. npm reported `EUNKNOWNCONFIG` and never ran the checks. Codex
then invoked the same checker directly with
`node tools/check.js image --new=linkbox:v1`, which passed `I1` through
`I15`. `T1` through `T3` and all six old-client tests also passed.

By hand: No student implementation steps recorded for this phase. Codex
edited the files, built the images and ran the checks.

## 2026-11-18: Add expiry in v2

Tool: Codex (OpenAI).

Asked for: Implement the expiry feature and reversible migration from the v2
brief and prove compatibility with v1.

Kept: The existing link fields, redirects and hit behavior for links without
expiry. The app reads the flag from the shared database on each relevant
request. No tool or old-client test was edited.

Changed: Codex added a test for behavior the supplied checker does not cover
directly: an expired link remains in detail and list results, a 410 does
not increment hits, and a redirect after disabling the flag does increment
them. The test also checks that a missing admin token gets 401.

Rejected: No failing implementation variant was observed in this phase.

By hand: No student implementation steps recorded for this phase. Codex
wrote the migration, feature and test, and ran the checks.
`npm test` passed 7 tests, and `F1` through `F7` and `C1` through `C4`
passed on the Docker images. Tag `v2` identifies the feature commit.

## 2026-11-18: Deploy scripts and release plan

Tool: Codex (OpenAI).

Asked for: Implement the two release commands and prepare the deployment
table before sending traffic.

Kept: The supplied router, migration runner, and bad-image drill. The
release script deploys only the idle slot and verifies Docker health before
sending it traffic. The previous slot remains up.

Changed: Codex chose 20% and 40% stages, each held for 12 seconds for a
healthy canary. The gate checks for two new candidate errors across the
stages. Both commands verify router weights after changing them. See
commits `13a54bf` and `575d064`.

Rejected: Health-only promotion. On the real drill, the bad candidate
reported Docker healthy at `release-log.txt:72` and still returned four 500s
in `load-log.txt:126-130`. The router counters caught them.

By hand: No student implementation steps recorded for this phase. Codex
wrote and reviewed the scripts and release plan.

## 2026-11-18: Live drill and review files

Tool: Codex (OpenAI).

Asked for: Run one continuous deployment under load, capture the evidence,
and prepare the six-row self-assessment for student review.

Kept: The original npm load and check commands and the logs they produced.
The continuous run ended using Ctrl+C. The manual rollback at
`release-log.txt:40-44` was part of the v1 rollback exercise. The bad
canary was separately reverted by the gate at `release-log.txt:62-76`.

Changed: Codex recorded the npm flag issue in `NOTES.md` and tied the draft
self-assessment to check IDs, commit IDs and the actual log lines.
`check-log.txt` reports 39 of 39 checks passing and `npm test` passed all
seven tests.

Rejected: None during the evidence capture.

By hand: The student reserved review and the final submission decision.
Codex ran the commands and wrote the review files.
