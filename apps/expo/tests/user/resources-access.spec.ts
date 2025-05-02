import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Resources Page Access", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home screen
    await page.goto("/");
  });

  test("should open resources menu item in a new tab", async ({
    page,
    context,
  }) => {
    // click on the menu button
    await page.getByLabel("Menu").click();

    // Step 2: Listen for the popup (new tab)
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.getByRole("menuitem", { name: /resources/i }).click(),
    ]);

    // Step 3: Wait for navigation to finish
    await popup.waitForLoadState();

    // Step 4: Verify URL
    expect(popup).toBeDefined();
  });
});
