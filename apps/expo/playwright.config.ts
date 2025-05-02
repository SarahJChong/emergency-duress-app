import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:8081",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup projects
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: "user-setup",
      testMatch: /user\.setup\.ts/,
    },
    {
      name: "security-setup",
      testMatch: /security\.setup\.ts/,
    },
    {
      name: "manager-setup",
      testMatch: /manager\.setup\.ts/,
    },

    // Test projects with their specific auth dependencies
    {
      name: "auth-tests",
      use: {
        ...devices["Desktop Chrome"],
      },
      dependencies: ["user-setup"],
      testMatch: ["**/auth/**/*.spec.ts"],
    },
    {
      name: "admin-tests",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["admin-setup"],
      testMatch: ["**/admin/**/*.spec.ts"],
    },
    {
      name: "user-tests",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["user-setup"],
      testMatch: ["**/user/**/*.spec.ts"],
    },
    {
      name: "security-tests",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/security.json",
      },
      dependencies: ["security-setup"],
      testMatch: ["**/security/**/*.spec.ts"],
    },
    {
      name: "manager-tests",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/manager.json",
      },
      dependencies: ["manager-setup"],
      testMatch: ["**/manager/**/*.spec.ts"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run start",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
  },
});
