import { Queue } from 'bullmq';
import type { ConnectionOptions, DefaultJobOptions } from 'bullmq';

const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    ...(parsed.pathname && parsed.pathname !== '/'
      ? { db: Number(parsed.pathname.slice(1)) }
      : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

const baseConnectionOptions = parseRedisUrl(redisUrl);

// Queues: default maxRetriesPerRequest so HTTP handlers fail fast
export const queueConnectionOptions = {
  ...baseConnectionOptions,
} satisfies ConnectionOptions;

// Workers: null required for blocking BRPOPLPUSH
export const workerConnectionOptions = {
  ...baseConnectionOptions,
  maxRetriesPerRequest: null,
} satisfies ConnectionOptions;

export const WELCOME_EMAIL_QUEUE = 'send-welcome-email';

const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
};

let _welcomeEmailQueue: Queue | undefined;

export function getWelcomeEmailQueue() {
  _welcomeEmailQueue ??= new Queue(WELCOME_EMAIL_QUEUE, {
    connection: queueConnectionOptions,
    defaultJobOptions,
  });
  return _welcomeEmailQueue;
}

export async function closeAllQueues() {
  await Promise.all([
    _welcomeEmailQueue?.close(),
  ]);
}
