import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { Redis } from 'ioredis';
import * as Sentry from '@sentry/node';
import { initSentry } from './lib/sentry.js';
import { configureZodProvider } from './lib/zod-provider.js';
import authPlugin from './plugins/auth.js';
import healthPlugin from './plugins/health.js';
import usersPlugin from './plugins/users.js';
import uploadsPlugin from './plugins/uploads.js';
import authCallbackPlugin from './plugins/auth-callback.js';
import { startEmailWorkers } from './workers/email.worker.js';
import { closeAllQueues } from './jobs/queues.js';

export async function build(opts: { logger?: boolean } = {}) {
  // 1. Sentry init (before everything)
  initSentry();

  const app = Fastify({ logger: opts.logger ?? true });

  // 2. Zod type provider
  configureZodProvider(app);

  // 3. CORS — register before routes
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      process.env['FRONTEND_URL'],
    ].filter(Boolean) as string[],
  });

  // 4. Rate limiting — 100 req/min per IP, Redis-backed in production
  const redisUrl = process.env['REDIS_URL'];
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    ...(redisUrl && { redis: new Redis(redisUrl) }),
  });

  // 5. Multipart — 10MB file size limit
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // 6. Auth plugin — decorates request.user, registers fastify.authenticate
  await app.register(authPlugin);

  // 7. Health check (no auth)
  await app.register(healthPlugin);

  // 8. Feature plugins
  await app.register(usersPlugin);
  await app.register(uploadsPlugin);
  await app.register(authCallbackPlugin);

  // 9. Global error handler — matches ApiErrorSchema contract
  app.setErrorHandler((error: { statusCode?: number; code?: string; message: string }, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      Sentry.captureException(error);
    }
    reply.code(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  });

  // 10. Start background job workers
  const workers = startEmailWorkers();
  app.addHook('onClose', async () => {
    await Promise.all(workers.map((w) => w.close()));
    await closeAllQueues();
  });

  return app;
}
