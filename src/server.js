import { config } from './config.js';
import { open } from './db.js';
import { createApp } from './app.js';

const db = open(config.dbPath);
const server = createApp(db, config);
server.listen(config.port, () =>
  console.log(`linkbox ${config.version} (${config.env}) on :${config.port}, db ${config.dbPath}`));

function shutdown() {
  server.close(() => db.close());
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
