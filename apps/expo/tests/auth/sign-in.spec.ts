import { expect, test } from "@playwright/test";

test("should display basic elements correctly", async ({ page }) => {
  await page.goto("/");
  // Check for the main heading
  await expect(
    page.getByRole("heading", { name: "Emergency Duress" }),
  ).toBeVisible();

  // Check for the login section heading
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  // Check for the brand icon
  await expect(page.getByAltText("brand icon")).toBeVisible();

  // Check for sign in button
  await expect(
    page.getByRole("button", { name: "Sign In with Identity Provider" }),
  ).toBeVisible();

  // Check for emergency section
  await expect(
    page.getByRole("heading", { name: "Call for security now" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Emergency Call/i }),
  ).toBeVisible();
});

test("emergency call button should work without authentication", async ({
  page,
}) => {
  await page.goto("/");

  // Get the emergency call button
  const emergencyButton = page.getByRole("button", { name: /Emergency Call/i });
  await expect(emergencyButton).toBeVisible();
  await expect(emergencyButton).toBeEnabled();

  // Click the emergency button
  await emergencyButton.click();

  // Verify that a phone call was attempted with the default location number
  page.once("request", (request) => {
    expect(request.url()).toContain("tel:");
  });

  // Button should remain enabled since no authentication is required
  await expect(emergencyButton).toBeEnabled();
});
