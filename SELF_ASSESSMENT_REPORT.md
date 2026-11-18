# Self-assessment for IA04 Release and rollback

Student ID: 23120262

Student: Tong Duong Thai Hoa

Date: 2026-11-18

Draft score for student review: 98 / 100

| Criterion | Max | Draft claim | Evidence |
| --- | ---: | ---: | --- |
| 1. The image and its configuration | 20 | 20 | `check-log.txt`, `I1-I15`, all pass. Image size is 229 MB. The in-flight stop probe received 200 and shutdown took 1.4 s. Packaging commit `af770b5` is tagged `v1`. |
| 2. The change behind a flag | 10 | 10 | `check-log.txt`, `T3` and `F1-F7`, all pass. The second instance observed the flag in 4 ms. The expiry check recorded 302 before expiry, 410 after expiry, and 302 after switching off the flag without a restart. The feature commit `02f6a5a` is tagged `v2`. |
| 3. Migration and deploy order | 15 | 15 | `check-log.txt`, `C1-C4` and `L5`, all pass. `load-log.txt:27-42` shows migration 002 and 13 s of v1 serving before v2 first answered. The five-column sequence and the data lost by SQL down are documented in `RELEASE.md`. |
| 4. The canary release | 15 | 15 | `check-log.txt`, `L0-L4), all pass. `load-log.txt:41-67` shows 20% and 40% stages for 12 s each. `release-log.txt:23-37` shows Docker health preceding the first traffic change. The measured average was 39.1 requests/s and zero failed outside the bad canary. `RELEASE.md` explains the two-error gate and its blind spots. |
| 5. The way back | 20 | 20 | `check-log.txt`, `L6-L9`, all pass. `release-log.txt:40-44` confirms manual rollback across the migration. `release-log.txt:62-76` shows the gate stopping the bad release at 20% and confirming v2 at 100%. `load-log.txt:124-150` shows 4 bad-version failures, a 2 s rollback by `L8` and 16 clean seconds afterward. `RELEASE.md` explains how expired links and recorded hits behave across rollback. |
| 6. Brief, commits and checking | 20 | 18 | `starter` points to `7a19624`. The briefs were committed before each phase in `a664c96`, `9355f16`, `9b047f3`, and `49af172`. Packaging, expiry and deploy scripts are separate commits. `AI-LOG.md` and `NOTES.md` record the npm `EUNKNOWNCONFIG` error and the successful correction. `T1-T3` pass. The draft credits the committed briefs and verification but reserves two marks because Codex derived the phase briefs from one implementation handover and student review is pending. |
| Total | 100 | 98 | 20 + 10 + 15 + 15 + 20 + 18 |

## What I did not manage

Student review is pending. Codex implemented the changes, ran the drill and
prepared this evidence. The gate covers router errors during the canary.
Contract failures, lost data and slow successful responses need separate
checks.

## What I would do differently

Add an independent response check to the canary gate for redirect
correctness and latency before broadening traffic.
