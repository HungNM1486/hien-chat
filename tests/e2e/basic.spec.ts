import { test, expect } from "@playwright/test";

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Hiên nhà" })).toBeVisible();
});

test("register page renders", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByText("Tạo tài khoản")).toBeVisible();
});
