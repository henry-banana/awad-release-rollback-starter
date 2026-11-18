import { activeSlot, otherSlot, readState, requireHealthy, setTraffic } from './traffic.js';

try {
  const target = otherSlot(activeSlot(await readState()));
  requireHealthy(target);
  const weights = await setTraffic(target, 100);
  console.log(`Rollback to ${target} confirmed by GET /state: ${weights}`);
} catch (error) {
  console.error(`Rollback failed: ${error.message}`);
  process.exitCode = 1;
}
