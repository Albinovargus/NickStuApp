import { vi, describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

vi.mock('../workers/email.worker.js', () => ({
  startEmailWorkers: vi.fn().mockReturnValue([]),
}));

vi.mock('../services/upload.service.js', () => ({
  upload: vi.fn().mockResolvedValue({
    path: 'test-uuid.pdf',
    url: 'https://example.com/signed',
  }),
  getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed'),
}));

import { ApiErrorSchema } from '@myapp/types';
import { build } from '../app.js';
import { createTestToken } from './helpers.js';

describe('POST /uploads', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/uploads',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 200 with valid multipart body when authenticated', async () => {
    const token = await createTestToken();
    const payload = [
      `------FormBoundary`,
      `Content-Disposition: form-data; name="file"; filename="test.pdf"`,
      `Content-Type: application/pdf`,
      ``,
      `test file content`,
      `------FormBoundary--`,
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/uploads',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=----FormBoundary`,
      },
      payload,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.path).toBe('test-uuid.pdf');
  });

  it('returns 400 without file when authenticated', async () => {
    const token = await createTestToken();
    const payload = [
      `------FormBoundary`,
      `Content-Disposition: form-data; name="notfile"`,
      ``,
      `just a text field`,
      `------FormBoundary--`,
    ].join('\r\n');

    const response = await app.inject({
      method: 'POST',
      url: '/uploads',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'multipart/form-data; boundary=----FormBoundary',
      },
      payload,
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('No file provided');
  });

  it('returns a 400 in the ApiError shape when the query fails schema validation', async () => {
    const token = await createTestToken();
    const response = await app.inject({
      method: 'POST',
      url: '/uploads?bucket=not-a-bucket',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(400);
    const body = ApiErrorSchema.parse(response.json());
    expect(body.error.message).toMatch(/bucket/i);
  });
});

describe('GET /uploads/:path', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/uploads/test.pdf',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 302 redirect with signed URL when authenticated', async () => {
    const token = await createTestToken();
    const response = await app.inject({
      method: 'GET',
      url: '/uploads/test.pdf',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('https://example.com/signed');
  });
});
