import { test as setup } from "@playwright/test";

import { authenticate } from "../utils/auth";

const userFile = "playwright/.auth/user.json";

setup("authenticate as user", async ({ page }) => {
  await authenticate(page, "test-user@duress.com", "test-user");
  await page.context().storageState({ path: userFile });
});
