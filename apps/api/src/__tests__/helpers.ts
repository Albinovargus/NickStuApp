import { SignJWT } from 'jose';

const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

export async function createTestToken(overrides: Record<string, unknown> = {}) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'authenticated',
    ...overrides,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}
