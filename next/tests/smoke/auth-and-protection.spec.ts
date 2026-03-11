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

test("protected routes redirect anonymous users to login", async ({ page }) => {
  for (const path of ["/dashboard", "/sos", "/relatorio", "/perfil"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("health endpoint responds with a deployment status payload", async ({ request }) => {
  const response = await request.get("/api/health");

  expect([200, 503]).toContain(response.status());
  await expect
    .poll(async () => {
      const body = await response.json();
      return typeof body.status;
    })
    .toBe("string");
});
