import { test as setup } from "@playwright/test";

import { authenticate } from "../utils/auth";

const managerFile = "playwright/.auth/manager.json";

setup("authenticate as manager", async ({ page }) => {
  await authenticate(page, "test-manager@duress.com", "test-manager");
  await page.context().storageState({ path: managerFile });
});
