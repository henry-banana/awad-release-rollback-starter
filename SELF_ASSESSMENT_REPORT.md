# Self-assessment for IA04 Release and rollback

Student ID: 23120262

Student: Tong Duong Thai Hoa

Date: 2026-11-18

Total I claim: 100 / 100

| Criterion | Max | I claim | Evidence |
| --- | ---: | ---: | --- |
| 1. The image and its configuration | 20 | 20 | `check-log.txt`, `I1-I15`, all pass. Image size is 229 MB. The in-flight stop probe received 200 and shutdown took 1.4 s. Packaging commit `af770b5` is tagged `v1`. |
| 2. The change behind a flag | 10 | 10 | `check-log.txt`, `T3` and `F1-F7`, all pass. The second instance observed the flag in 4 ms. The expiry check recorded 302 before expiry, 410 after expiry, and 302 after switching off the flag without a restart. The feature commit `02f6a5a` is tagged `v2`. |
| 3. Migration and deploy order | 15 | 15 | `check-log.txt`, `C1-C4` and `L5`, all pass. `load-log.txt:27-42` shows migration 002 and 13 s of v1 serving before v2 first answered. The five-column sequence and the data lost by SQL down are documented in `RELEASE.md`. |
| 4. The canary release | 15 | 15 | `check-log.txt`, `L0-L4`, all pass. `load-log.txt:41-67` shows 20% and 40% stages for 12 s each. `release-log.txt:23-37` shows Docker health preceding the first traffic change. The measured average was 39.1 requests/s and zero failed outside the bad canary. `RELEASE.md` explains the two-error gate and its blind spots. |
| 5. The way back | 20 | 20 | `check-log.txt`, `L6-L9`, all pass. `release-log.txt:40-44` confirms manual rollback across the migration. `release-log.txt:62-76` shows the gate stopping the bad release at 20% and confirming v2 at 100%. `load-log.txt:124-150` shows 4 bad-version failures, a 2 s rollback by `L8` and 16 clean seconds afterward. `RELEASE.md` explains how expired links and recorded hits behave across rollback. |
| 6. Brief, commits and checking | 20 | 20 | `starter` points to `7a19624`. `BRIEF.md` records the scope, protected files and completion checks for each phase. The briefs were committed in `a664c96`, `9355f16`, `9b047f3` and `49af172` before the respective phases. Packaging, expiry and deploy scripts are separate commits (`af770b5`, `02f6a5a` and `13a54bf`). `AI-LOG.md` and `NOTES.md` record the `EUNKNOWNCONFIG` error and the direct checker command that passed `I1-I15`. The health-only gate was ruled out by the healthy container in `release-log.txt:72` and the four errors in `load-log.txt:126-130`. |
| Total | 100 | 100 | 20 + 10 + 15 + 15 + 20 + 20 |

## What I did not manage

The gate measures router errors during the canary. Checking redirect
correctness, missing fields, lost hits and the latency of successful responses
requires separate checks. The supplied load log covers the response contract
and link data.

## What I would do differently

I would add checks for redirect correctness and latency to the canary gate
before promoting the new version.
