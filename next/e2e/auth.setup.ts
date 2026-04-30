import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  await page.locator('input[type="email"]').fill('admin@colegioatlantico.pt');
  await page.locator('input[type="password"]').fill('Password1');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
    console.warn('Timeout waiting for redirect to /dashboard. Capturing current state.');
  });
  
  await page.context().storageState({ path: '.auth/user.json' });
});
