import { spawnSync } from 'node:child_process';

const CONTROL = 'http://127.0.0.1:8081';

async function control(path, options) {
  const response = await fetch(CONTROL + path, {
    ...options,
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`router ${path} returned HTTP ${response.status}`);
  return response.json();
}

export const readState = () => control('/state');
export const otherSlot = (slot) => slot === 'blue' ? 'green' : 'blue';

export function activeSlot({ slots }) {
  if (slots.blue.weight === 100 && slots.green.weight === 0) return 'blue';
  if (slots.green.weight === 100 && slots.blue.weight === 0) return 'green';
  throw new Error('expected one active slot and one idle slot');
}

export function confirmWeights({ slots }, slot, weight) {
  const { blue, green } = slots;
  if (slots[slot].weight !== weight || slots[otherSlot(slot)].weight !== 100 - weight) {
    throw new Error(`unexpected weights from GET /state: blue=${blue.weight} green=${green.weight}`);
  }
  return `blue=${blue.weight} green=${green.weight}`;
}

export async function setTraffic(slot, weight) {
  await control('/weights', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ [slot]: weight, [otherSlot(slot)]: 100 - weight }),
  });
  return confirmWeights(await readState(), slot, weight);
}

export function requireHealthy(slot) {
  const result = spawnSync('docker', [
    'inspect', '-f', '{{if .State.Health}}{{.State.Health.Status}}{{end}}', `linkbox-${slot}-1`,
  ], { encoding: 'utf8', timeout: 5000 });
  const status = result.stdout?.trim();
  if (result.status !== 0 || status !== 'healthy') {
    throw new Error(`Docker did not report ${slot} healthy (${status || 'unavailable'})`);
  }
}
