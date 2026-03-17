import { vi, describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../workers/email.worker.js', () => ({
  startEmailWorkers: vi.fn().mockReturnValue([]),
}));

vi.mock('../services/users.service.js', () => ({
  getById: vi.fn().mockResolvedValue({
    id: '550e8400-e29b-41d4-a716-446655440000',
    display_name: 'Test User',
    avatar_url: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }),
}));

import { build } from '../app.js';
import { createTestToken } from './helpers.js';

describe('GET /users/me', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns user profile with valid token', async () => {
    const token = await createTestToken();
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(body.data.display_name).toBe('Test User');
  });
});
