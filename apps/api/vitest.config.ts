import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['dist/**', 'node_modules/**'],
    // No REDIS_URL here: with it set, rate limiting connects to a real Redis and
    // every request hangs in CI (no Redis there). Unset = in-memory rate limiting.
    env: {
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      SUPABASE_JWT_SECRET: 'super-secret-jwt-token-with-at-least-32-characters-long',
      NODE_ENV: 'test',
    },
  },
});
