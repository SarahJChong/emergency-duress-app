import { test as setup } from "@playwright/test";

import { authenticate } from "../utils/auth";

const securityFile = "playwright/.auth/security.json";

setup("authenticate as security", async ({ page }) => {
  await authenticate(page, "test-security@duress.com", "test-security");
  await page.context().storageState({ path: securityFile });
});
