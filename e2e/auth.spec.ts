import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('displays email and password fields', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('has sign in and sign up buttons', async ({ page }) => {
    await page.goto('/');
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
  });
});
