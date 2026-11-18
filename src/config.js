const env = process.env.APP_ENV ?? 'development';
const adminToken = process.env.ADMIN_TOKEN ?? (env === 'development' ? 'dev-secret' : '');

if (env === 'production' && (!adminToken.trim() || adminToken.trim() === 'dev-secret')) {
  throw new Error('ADMIN_TOKEN must be set to a production value');
}

export const config = {
  env,
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? './data/app.db',
  baseUrl: (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  adminToken,
  version: process.env.APP_VERSION ?? 'dev',
};
