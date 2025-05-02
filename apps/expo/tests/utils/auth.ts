import { Page } from "@playwright/test";

/**
 * Generic authentication function for test users
 * @param page The Playwright page instance
 * @param email The user's email address
 * @param password The user's password
 */
export const authenticate = async (
  page: Page,
  email: string,
  password: string,
) => {
  await page.goto("/sign-in");

  await page.waitForResponse(
    (response) =>
      response.url().includes(".well-known/openid-configuration") &&
      response.status() === 200,
  );

  const popupPromise = page.waitForEvent("popup");
  await page.getByText("Sign In with Identity Provider").click();
  const popup = await popupPromise;

  await popup.fill("#username", email);
  await popup.fill("#password", password);

  // Click the continue button
  await popup
    .locator('form[data-form-primary="true"] >> button[type="submit"]')
    .click();

  await popup.waitForEvent("close");

  await page.waitForFunction(() => {
    return localStorage.getItem("idToken") !== null;
  });
};
