import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error('REDIS_URL is required');

// Parse Redis URL into ioredis-compatible options so we avoid a dual-version conflict
// (BullMQ bundles its own ioredis; adding a second version causes TypeScript type errors)
const _url = new URL(REDIS_URL);
export const connection = {
  host: _url.hostname,
  port: parseInt(_url.port || '6379', 10),
  ...(_url.password ? { password: decodeURIComponent(_url.password) } : {}),
  ...(_url.pathname && _url.pathname !== '/' ? { db: parseInt(_url.pathname.slice(1), 10) } : {}),
  maxRetriesPerRequest: null as null,
  enableReadyCheck: false,
};

export const runQueue = new Queue('runs', { connection, prefix: 'gotryl' });
