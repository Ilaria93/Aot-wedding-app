import { expect, test } from '@playwright/test';

const protectedPaths = ['/profile', '/rsvp', '/travel', '/admin'] as const;

test.describe('auth guard', () => {
  for (const path of protectedPaths) {
    test(`route protetta ${path} reindirizza al login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login$/);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  }

  test('route sconosciuta mostra 404', async ({ page }) => {
    await page.goto('/pagina-che-non-esiste');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/non esiste|does not exist/i);
    await expect(page.getByRole('link', { name: /torna alla home|back to home/i })).toBeVisible();
  });
});
