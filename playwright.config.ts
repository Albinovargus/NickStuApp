import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true },
    },
  ],
  // Web only: the public modules don't need the API. Add the API server back
  // here when an e2e test exercises it.
  webServer: {
    command: 'pnpm --filter @myapp/web dev',
    port: 5173,
    reuseExistingServer: !process.env['CI'],
  },
});
