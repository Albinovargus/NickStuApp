import { vi, describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../workers/email.worker.js', () => ({
  startEmailWorkers: vi.fn().mockReturnValue([]),
}));

import { build } from '../app.js';

describe('Authentication', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without auth header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 401 with malformed auth header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: 'NotBearer some-token',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
