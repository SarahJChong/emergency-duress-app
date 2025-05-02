import { expect, test } from "@playwright/test";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  location?: {
    id: string;
    name: string;
  };
}

interface ApiLocation {
  id: string;
  name: string;
}

const mockUser: User = {
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
  isAdmin: false,
};

const mockLocations: ApiLocation[] = [
  {
    id: "location-1",
    name: "Test Location 1",
  },
  {
    id: "location-2",
    name: "Test Location 2",
  },
];

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("User Registration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock /me endpoint to return 404 initially (unregistered user)
    await page.route("*/**/api/users/me", async (route) => {
      await route.fulfill({
        status: 404,
        json: { message: "User not found" },
      });
    });

    // Mock locations endpoint
    await page.route("*/**/api/locations", async (route) => {
      await route.fulfill({
        status: 200,
        json: mockLocations,
      });
    });

    // Navigate to register page
    await page.goto("/register");

    // Wait for the page to load
    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  });

  test("displays registration form", async ({ page }) => {
    // Verify form elements are present
    await expect(page.getByLabel("Mobile")).toBeVisible();
    await expect(page.getByLabel("Location")).toBeVisible();
    await expect(page.getByLabel("Room No.")).toBeVisible();
    await expect(
      page.getByText("Accept Terms and Conditions and Privacy Policy"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
  });

  test("validates mobile number format", async ({ page }) => {
    // Test invalid mobile number
    await page.getByLabel("Mobile").fill("123");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(
      page.getByText(
        "Invalid mobile number. Please use the following format +61400000123",
      ),
    ).toBeVisible();

    // Test valid mobile number
    await page.getByLabel("Mobile").fill("+61400000123");
    await expect(
      page.getByText(
        "Invalid mobile number. Please use the following format +61400000123",
      ),
    ).not.toBeVisible();
  });

  test("requires location selection", async ({ page }) => {
    // Fill valid data without selecting location
    await page.getByLabel("Mobile").fill("+61400000123");
    await page.getByLabel("Room No.").fill("123");
    await page.locator('input[type="checkbox"]').setChecked(true);
    await page.getByRole("button", { name: "Register" }).click();
    // expect error message
    await expect(page.getByText("Site/Camp is required.")).toBeVisible();
    // Verify button remains disabled
    await expect(page.getByRole("button", { name: "Register" })).toBeDisabled();
    // Select location
    const locationSelect = page.getByLabel("Location");
    await locationSelect.selectOption("Test Location 1");
    // Verify error message is gone
    await expect(page.getByText("Site/Camp is required.")).not.toBeVisible();
    // Verify button is enabled
    await expect(page.getByRole("button", { name: "Register" })).toBeEnabled();
  });

  test("requires terms acceptance", async ({ page }) => {
    // Fill valid data without accepting terms
    await page.getByLabel("Mobile").fill("+61400000123");

    const locationSelect = page.getByLabel("Location");
    locationSelect.selectOption("Test Location 1");

    await page.getByRole("button", { name: "Register" }).click();

    // expect error message
    await expect(page.getByText("Terms and privacy must be")).toBeVisible();

    // Verify button remains disabled
    await expect(page.getByRole("button", { name: "Register" })).toBeDisabled();

    // Accept terms
    await page.locator('input[type="checkbox"]').setChecked(true);

    // Verify error message is gone
    await expect(page.getByText("Terms and privacy must be")).not.toBeVisible();

    // Verify button is enabled
    await expect(page.getByRole("button", { name: "Register" })).toBeEnabled();
  });

  test("successfully registers user", async ({ page }) => {
    // Mock registration endpoint
    await page.route("*/**/api/users/register", async (route) => {
      const data = JSON.parse(route.request().postData() || "{}");
      expect(data).toEqual({
        contactNumber: "+61400000123",
        locationId: "location-1",
        roomNumber: "123",
      });

      await route.fulfill({
        status: 200,
        json: {
          ...mockUser,
          location: mockLocations[0],
        },
      });
    });

    // Mock subsequent /me calls after registration
    let meCallCount = 0;
    await page.route("*/**/api/me", async (route) => {
      if (meCallCount === 0) {
        await route.fulfill({
          status: 404,
          json: { message: "User not found" },
        });
      } else {
        await route.fulfill({
          status: 200,
          json: {
            ...mockUser,
            location: mockLocations[0],
          },
        });
      }
      meCallCount++;
    });

    // Fill registration form
    await page.getByLabel("Mobile").fill("+61400000123");

    const locationSelect = page.getByLabel("Location");
    await locationSelect.selectOption("Test Location 1");

    await page.getByLabel("Room No.").fill("123");
    await page.locator('input[type="checkbox"]').setChecked(true);

    // Submit form
    await page.getByRole("button", { name: "Register" }).click();

    // Verify redirection to home page
    await expect(page).toHaveURL("/user");
  });
});
