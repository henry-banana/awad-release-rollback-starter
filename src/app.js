import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const newCode = () => [...randomBytes(8)].map((b) => ALPHABET[b % ALPHABET.length]).join('');

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return null; }
}

const isUrl = (u) => typeof u === 'string' && /^https?:\/\/\S+$/.test(u);

export function createApp(db, config) {
  const q = {
    insert: db.prepare('INSERT INTO links (code, url, expires_at) VALUES (?, ?, ?)'),
    get: db.prepare('SELECT code, url, hits, expires_at FROM links WHERE code = ?'),
    list: db.prepare('SELECT code, url, hits, expires_at FROM links ORDER BY id DESC LIMIT ? OFFSET ?'),
    hit: db.prepare('UPDATE links SET hits = hits + 1 WHERE code = ?'),
    expiry: db.prepare("SELECT enabled FROM feature_flags WHERE name = 'expiry'"),
    setExpiry: db.prepare("UPDATE feature_flags SET enabled = ? WHERE name = 'expiry'"),
    ping: db.prepare('SELECT 1'),
  };

  const expiryEnabled = () => q.expiry.get().enabled === 1;
  const view = (row, expiry) => ({
    code: row.code,
    url: row.url,
    shortUrl: `${config.baseUrl}/r/${row.code}`,
    hits: row.hits,
    expiresAt: expiry && row.expires_at !== null ? new Date(row.expires_at).toISOString() : null,
  });

  const json = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const error = (res, status, code, message) => json(res, status, { error: code, message });

  async function handle(req, res) {
    res.setHeader('x-app-version', config.version);
    const url = new URL(req.url, 'http://x');
    const parts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET' && url.pathname === '/health') {
      q.ping.get();
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && url.pathname === '/version') {
      return json(res, 200, {
        version: config.version,
        env: config.env,
        flags: { expiry: expiryEnabled() },
      });
    }
    if (req.method === 'PUT' && url.pathname === '/admin/flags/expiry') {
      if (!config.adminToken || req.headers['x-admin-token'] !== config.adminToken) {
        return error(res, 401, 'unauthorized', 'a valid admin token is required');
      }
      const body = await readBody(req);
      if (typeof body?.enabled !== 'boolean') {
        return error(res, 400, 'invalid_body', 'enabled must be a boolean');
      }
      q.setExpiry.run(Number(body.enabled));
      return json(res, 200, { enabled: body.enabled });
    }
    // tools/check.js uses this to hold a request open during `docker stop`. Leave it in.
    if (req.method === 'GET' && url.pathname === '/__probe/slow') {
      const ms = Math.min(Number(url.searchParams.get('ms') ?? 1000), 5000);
      await new Promise((r) => setTimeout(r, ms));
      return json(res, 200, { waited: ms });
    }

    if (parts[0] === 'links' && parts.length === 1) {
      if (req.method === 'GET') {
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100);
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const expiry = expiryEnabled();
        return json(res, 200, q.list.all(limit, offset).map((row) => view(row, expiry)));
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        if (!body || !isUrl(body.url)) return error(res, 400, 'invalid_body', 'url (http or https) is required');
        const expiry = expiryEnabled();
        let expiresAt = null;
        if (expiry && Object.hasOwn(body, 'expiresInSeconds')) {
          const seconds = body.expiresInSeconds;
          if (!Number.isInteger(seconds) || seconds <= 0) {
            return error(res, 400, 'invalid_body', 'expiresInSeconds must be a positive whole number');
          }
          expiresAt = new Date(Date.now() + seconds * 1000).getTime();
          if (!Number.isFinite(expiresAt)) {
            return error(res, 400, 'invalid_body', 'expiresInSeconds puts expiry outside the supported date range');
          }
        }
        const code = newCode();
        q.insert.run(code, body.url, expiresAt);
        return json(res, 201, view(q.get.get(code), expiry));
      }
    }

    if (req.method === 'GET' && parts[0] === 'links' && parts.length === 2) {
      const row = q.get.get(parts[1]);
      if (!row) return error(res, 404, 'not_found', `no link ${parts[1]}`);
      return json(res, 200, view(row, expiryEnabled()));
    }

    if (req.method === 'GET' && parts[0] === 'r' && parts.length === 2) {
      const row = q.get.get(parts[1]);
      if (!row) return error(res, 404, 'not_found', `no link ${parts[1]}`);
      if (expiryEnabled() && row.expires_at !== null && row.expires_at <= Date.now()) {
        return json(res, 410, { error: 'expired' });
      }
      q.hit.run(row.code);
      res.writeHead(302, { location: row.url });
      return res.end();
    }

    return error(res, 404, 'not_found', 'no such route');
  }

  return createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error(e);
      if (!res.headersSent) error(res, 500, 'internal', e.message);
      else res.end();
    });
  });
}
