import { test as setup } from "@playwright/test";

import { authenticate } from "../utils/auth";

const adminFile = "playwright/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  await authenticate(page, "test-admin@duress.com", "test-admin");
  await page.context().storageState({ path: adminFile });
});
