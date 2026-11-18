import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';
import { activeSlot, confirmWeights, otherSlot, readState, requireHealthy, setTraffic } from './traffic.js';

const STAGES = [20, 40];
const HOLD_MS = 12_000;
const POLL_MS = 500;
const ERROR_LIMIT = 2;

function deploy(slot, tag) {
  const result = spawnSync('docker', [
    'compose', 'up', '-d', '--no-deps', '--pull', 'never', '--wait', '--wait-timeout', '45', slot,
  ], {
    env: { ...process.env, [`${slot.toUpperCase()}_TAG`]: tag },
    stdio: 'inherit',
    timeout: 60_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`could not start linkbox:${tag} in ${slot}`);
  requireHealthy(slot);
}

async function watch(slot, weight, baseline, signal) {
  const end = performance.now() + HOLD_MS;
  while (true) {
    signal.throwIfAborted();
    const state = await readState();
    confirmWeights(state, slot, weight);
    const requests = state.slots[slot].requests - baseline.requests;
    const errors = state.slots[slot].errors - baseline.errors;
    if (requests < 0 || errors < 0) throw new Error('router counters were reset during the canary');
    if (errors >= ERROR_LIMIT) {
      throw new Error(`gate stopped ${slot} at ${weight}%: ${errors} new errors in ${requests} requests (limit ${ERROR_LIMIT})`);
    }
    if (performance.now() >= end) return;
    await sleep(POLL_MS, undefined, { signal });
  }
}

async function restore(slot) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await setTraffic(slot, 100);
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(POLL_MS);
    }
  }
}

async function release(tag) {
  if (!tag || !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$/.test(tag)) {
    throw new Error('usage: npm run release -- <tag>');
  }
  const previous = activeSlot(await readState());
  const candidate = otherSlot(previous);
  console.log(`Starting linkbox:${tag} in idle slot ${candidate}; keeping ${previous} up`);
  deploy(candidate, tag);
  console.log(`Docker reports ${candidate} healthy`);

  const initial = await readState();
  confirmWeights(initial, previous, 100);
  const baseline = initial.slots[candidate];
  const cancellation = new AbortController();
  const interrupt = () => cancellation.abort();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  try {
    for (const weight of STAGES) {
      cancellation.signal.throwIfAborted();
      console.log(`Canary ${weight}%: ${await setTraffic(candidate, weight)}`);
      await watch(candidate, weight, baseline, cancellation.signal);
    }
    cancellation.signal.throwIfAborted();
    console.log(`Promoted linkbox:${tag}: ${await setTraffic(candidate, 100)}`);
  } catch (error) {
    console.error(`Release stopped: ${error.message}`);
    const weights = await restore(previous);
    console.error(`Automatic rollback to ${previous} confirmed by GET /state: ${weights}`);
    process.exitCode = 1;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
}

try {
  await release(process.argv[2]);
} catch (error) {
  console.error(`Release failed: ${error.message}`);
  process.exitCode = 1;
}
