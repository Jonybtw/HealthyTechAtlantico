import { test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/change-password',
  '/verify-email',
];

const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/alunos',
  '/acompanhamento',
  '/analise',
  '/auditoria',
  '/biometria',
  '/dispensas',
  '/guardioes',
  '/perfil',
  '/protocolos',
  '/questionarios',
  '/relatorio',
  '/sos',
  '/testes',
  '/turma',
];

test.describe('App Screenshots', () => {

  test.describe('Public Pages', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const route of publicRoutes) {
      test(`Screenshot: ${route || '/'}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const safeName = route === '/' ? 'home' : route.replace(/\//g, '_').substring(1);
        await page.screenshot({ path: `screenshots/public/public_${safeName}.png`, fullPage: true });
      });
    }
  });

  test.describe('Protected Pages', () => {
    for (const route of protectedRoutes) {
      test(`Screenshot: ${route}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500); // Allow charts/animations to settle
        
        const safeName = route.replace(/\//g, '_').substring(1);
        await page.screenshot({ path: `screenshots/protected/protected_${safeName}.png`, fullPage: true });
      });
    }
  });

});
