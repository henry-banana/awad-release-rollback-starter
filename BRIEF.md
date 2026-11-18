# IA04 assistant briefs

These are the work briefs distilled from the student's request to complete IA04
up to review. Codex prepared them before starting each phase.

## 1. Package v1

Baseline: tag `starter`, commit `7a19624`.

- Deliver a versioned, non-root image with runtime staging and production
  configuration, persisted data, explicit migrations, and graceful shutdown.
- Preserve the v1 HTTP contract, `createApp(db, config)`, and
  `node src/migrate.js`. Keep `tools/` and `test/app.test.js` unchanged.
- Done when `I1` through `I15` and `T1` through `T3` pass. Commit the
  packaging as its own change and tag it `v1`.
