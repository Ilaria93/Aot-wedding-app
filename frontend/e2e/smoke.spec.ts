import { expect, test } from '@playwright/test';

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8000';

test.describe('smoke', () => {
  test('backend health risponde', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/health`);
    expect(response.ok()).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  test('home carica senza errori console critici', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/Ilaria & Davide/i);
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    const blockingErrors = consoleErrors.filter(
      (line) => !line.includes('favicon') && !line.includes('404'),
    );
    expect(blockingErrors).toEqual([]);
  });

  test('album pubblico è raggiungibile senza login', async ({ page }) => {
    await page.goto('/album');
    await expect(page).toHaveURL(/\/album$/);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('login espone il form email/password', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1.title')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /accedi|log in/i })).toBeVisible();
  });
});
