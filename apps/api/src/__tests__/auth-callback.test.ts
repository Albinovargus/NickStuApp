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

vi.mock('../jobs/send-welcome-email.job.js', () => ({
  enqueue: vi.fn(),
}));

import { build } from '../app.js';
import { createTestToken } from './helpers.js';
import * as usersService from '../services/users.service.js';
import * as welcomeEmailJob from '../jobs/send-welcome-email.job.js';

describe('POST /auth/callback', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with profile when authenticated', async () => {
    const token = await createTestToken();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/callback',
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

  it('enqueues welcome email for new user', async () => {
    vi.mocked(usersService.getById).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      display_name: 'Test User',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const token = await createTestToken();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/callback',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(welcomeEmailJob.enqueue)).toHaveBeenCalled();
  });

  it('does not enqueue welcome email for existing user', async () => {
    vi.mocked(welcomeEmailJob.enqueue).mockClear();
    vi.mocked(usersService.getById).mockResolvedValueOnce({
      id: '550e8400-e29b-41d4-a716-446655440000',
      display_name: 'Test User',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });

    const token = await createTestToken();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/callback',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(vi.mocked(welcomeEmailJob.enqueue)).not.toHaveBeenCalled();
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/callback',
    });

    expect(response.statusCode).toBe(401);
  });
});
