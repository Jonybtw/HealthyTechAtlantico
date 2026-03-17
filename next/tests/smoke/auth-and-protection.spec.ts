import { expect, test } from "@playwright/test";

test("login and register pages render in both locales", async ({ page, context }) => {
  await page.goto("/login");
  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();

  await context.addCookies([
    {
      name: "NEXT_LOCALE",
      value: "en",
      url: "http://127.0.0.1:3000",
    },
  ]);

  await page.goto("/register");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']").first()).toBeVisible();
});

test("login page remains usable on mobile widths", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(page.locator("input[type='email']")).toBeVisible();
  await expect(page.locator("input[type='password']").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /iniciar sess|sign in|entrar/i })).toBeVisible();
});

test("protected routes redirect anonymous users to login", async ({ page }) => {
  for (const path of ["/dashboard", "/sos", "/relatorio", "/perfil", "/biometria", "/turma"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("health endpoint responds with a deployment status payload", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();

  expect([200, 503]).toContain(response.status());
  expect(typeof body.data?.status).toBe("string");
  expect(typeof body.data?.services?.database).toBe("string");
});
