# IA04 assistant briefs

## 1. Package v1

Baseline: tag `starter`, commit `7a19624`.

- Deliver a versioned, non-root image with runtime staging and production
  configuration, persisted data, explicit migrations, and graceful shutdown.
- Preserve the v1 HTTP contract, `createApp(db, config)`, and
  `node src/migrate.js`. Keep `tools/` and `test/app.test.js` unchanged.
- Done when `I1` through `I15` and `T1` through `T3` pass. Commit the
  packaging as its own change and tag it `v1`.

## 2. Add link expiry in v2

Baseline: tag `v1`.

- Implement `docs/CHANGE.md` with a reversible additive migration. Keep the
  flag in SQLite, preserve the old client contract, and support both versions
  on the migrated volume. Keep `tools/` and `test/app.test.js` unchanged.
- Done when `T3`, `F1` through `F7`, and `C1` through `C4` pass. Check
  the redirect hit count and link representations with the flag off and on.
  Commit this part separately and tag it `v2`.

## 3. Write the release and rollback commands

Baseline: tag `v2`.

- Implement `npm run release -- <tag>` and `npm run rollback` using the
  Docker slot health and the router weights and counters. Keep `tools/`
  and `test/app.test.js` unchanged.
- Write `RELEASE.md` before sending traffic. Include the five required
  columns, the gate and its blind spots, and the difference between moving
  traffic back and undoing the migration.
- Done when a healthy release has at least two partial stages, starting at
  25 percent or less for at least 10 seconds. The manual rollback must
  confirm the new weights from `GET :8081/state`. A bad canary must trigger
  the gate and lose all traffic without a manual rollback command. Verify
  the behavior with `L3`, `L4`, and `L6` through `L9` during the drill.

## 4. Run the drill and document the results

Baseline: the committed `RELEASE.md` and deploy scripts.

- Run the documented sequence on staging with one continuous `npm run load`.
  Keep `tools/` and `test/app.test.js` unchanged. Capture raw command output
  and record any platform or tool issues in `NOTES.md`.
- Done when `T1` through `T3`, `I1` through `I15`, `F1` through `F7`,
  `C1` through `C4`, and `L0` through `L9` have been checked, and the
  release log independently shows the automatic rollback and its weights.
- Prepare the six-row self-assessment with check IDs and log line ranges.
