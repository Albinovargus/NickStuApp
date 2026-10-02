import { test, expect } from '@playwright/test';

const html = (page: import('@playwright/test').Page) => page.locator('html');

test('follows the system theme on first visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(html(page)).toHaveClass(/\bdark\b/);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html(page)).not.toHaveClass(/\bdark\b/);
});

test('toggle switches theme and the choice survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(html(page)).toHaveClass(/\bdark\b/);

  await page.reload();
  await expect(html(page)).toHaveClass(/\bdark\b/);
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();

  // A saved choice is no longer overridden by the system setting.
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html(page)).toHaveClass(/\bdark\b/);
});

test('dark theme is applied before the app renders (no light flash)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.route('**/src/main.tsx', (route) => route.abort()); // block the app entirely
  await page.goto('/');
  await expect(html(page)).toHaveClass(/\bdark\b/);
});
