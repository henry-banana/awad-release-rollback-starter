import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { open } from '../src/db.js';

test('an expired link keeps its data and counts hits only when it redirects', async (t) => {
  const db = open(':memory:');
  for (const file of ['001_init.up.sql', '002_link_expiry.up.sql']) {
    db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
  }
  const expiredAt = Date.parse('2000-01-01T00:00:00.000Z');
  db.prepare('INSERT INTO links (code, url, expires_at) VALUES (?, ?, ?)')
    .run('expired', 'https://example.com/expired', expiredAt);
  const app = createApp(db, {
    version: 'test', env: 'test', baseUrl: 'http://short.test', adminToken: 'test-token',
  });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => app.close(resolve));
    db.close();
  });

  const base = `http://127.0.0.1:${app.address().port}`;
  const toggle = (enabled, token) => fetch(`${base}/admin/flags/expiry`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...(token && { 'x-admin-token': token }) },
    body: JSON.stringify({ enabled }),
  });
  const follow = () => fetch(`${base}/r/expired`, { redirect: 'manual' });
  const getLink = async () => (await fetch(`${base}/links/expired`)).json();

  const denied = await toggle(true);
  assert.equal(denied.status, 401);
  await denied.json();
  const enabled = await toggle(true, 'test-token');
  assert.equal(enabled.status, 200);
  assert.deepEqual(await enabled.json(), { enabled: true });
  const expired = await follow();
  assert.equal(expired.status, 410);
  assert.deepEqual(await expired.json(), { error: 'expired' });

  const listed = await (await fetch(`${base}/links`)).json();
  const link = await getLink();
  assert.deepEqual(listed, [link]);
  assert.equal(link.expiresAt, new Date(expiredAt).toISOString());
  assert.equal(link.hits, 0);

  const disabled = await toggle(false, 'test-token');
  assert.equal(disabled.status, 200);
  assert.deepEqual(await disabled.json(), { enabled: false });
  const redirect = await follow();
  assert.equal(redirect.status, 302);
  await redirect.text();
  const unexpiredView = await getLink();
  assert.equal(unexpiredView.expiresAt, null);
  assert.equal(unexpiredView.hits, 1);
});
