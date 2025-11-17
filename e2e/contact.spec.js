import { test, expect } from "@playwright/test";

test("Contact form works", async ({ page }) => {
  await page.goto("https://jorgecamposdocs.vercel.app/contact");

  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('textarea[name="message"]', "Mensaje de prueba automática");

  await page.click('button[type="submit"]');

  // Ajusta este selector según tu sitio
    await expect(
    page.getByText("Message sent! I'll get back to you soon.")
  ).toBeVisible();
});