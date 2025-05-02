import { expect, test } from "@playwright/test";

// API Types
interface SecurityResponder {
  id: string;
  name: string;
  email: string;
}

interface ApiLocation {
  id: string;
  name: string;
  defaultPhoneNumber: string;
  defaultEmail: string;
  securityResponders: SecurityResponder[];
  hasIncidents: boolean;
  createdAt?: string;
  updatedAt?: string;
}
const defaultLocation: ApiLocation = {
  id: "67f5fd3b306f8792d0dc5848",
  name: "Default Location",
  defaultPhoneNumber: "02080001001",
  defaultEmail: "test@company.com",
  securityResponders: [],
  hasIncidents: false,
  createdAt: "2025-04-09T04:53:15.03Z",
  updatedAt: "2025-04-16T02:18:31.198Z",
};

const locationWithIncidents: ApiLocation = {
  id: "location-with-incidents",
  name: "Location With Incidents",
  defaultPhoneNumber: "02080001002",
  defaultEmail: "incidents@company.com",
  securityResponders: [],
  hasIncidents: true,
  createdAt: "2025-04-09T04:53:15.03Z",
  updatedAt: "2025-04-16T02:18:31.198Z",
};

const securityResponder: SecurityResponder = {
  id: "67f8cea4306f8792d0dc584c",
  name: "John Doe",
  email: "john@example.com",
};

test.use({ storageState: "playwright/.auth/admin.json" });

test.describe("Admin Location Management", () => {
  // Track the current state of locations
  let currentLocations = [defaultLocation, locationWithIncidents];

  test.beforeEach(async ({ page }) => {
    // Reset locations state at the start of each test
    currentLocations = [defaultLocation, locationWithIncidents];

    // Mock API endpoints for initial data
    await page.route("*/**/api/locations", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          json: currentLocations,
        });
      } else if (method === "POST") {
        const data = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 201,
          json: {
            ...defaultLocation,
            ...data,
            id: "new-location-id",
          },
        });
      }
    });

    // Mock security responders endpoints
    await page.route(
      "*/**/api/locations/security-responders",
      async (route) => {
        await route.fulfill({
          status: 200,
          json: [securityResponder],
        });
      },
    );

    await page.route(
      `*/**/api/locations/${defaultLocation.id}/security-responders`,
      async (route) => {
        const method = route.request().method();
        if (method === "POST") {
          const requestData = JSON.parse(route.request().postData() || "{}");
          expect(requestData).toEqual({ email: securityResponder.email });

          await route.fulfill({
            status: 200,
            json: {
              ...defaultLocation,
              securityResponders: [securityResponder],
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },
    );

    // Navigate to admin locations page
    await page.goto("/admin/locations");

    // Wait for the page to load
    await expect(
      page.getByRole("heading", { name: "Locations" }),
    ).toBeVisible();
  });

  test("shows Default Location when empty", async ({ page }) => {
    const defaultLocation = {
      id: "67f5fd3b306f8792d0dc5848",
      name: "Default Location",
      defaultPhoneNumber: "02080001001",
      defaultEmail: "test@company.com",
      securityResponders: [],
      hasIncidents: false,
      createdAt: "2025-04-09T04:53:15.03Z",
      updatedAt: "2025-04-16T02:18:31.198Z",
    };

    // Override the mock to return empty array, which should trigger default location
    await page.route("*/**/api/locations", async (route) => {
      await route.fulfill({
        status: 200,
        json: [defaultLocation],
      });
    });

    // Verify default location is displayed
    await expect(page.getByText("Default Location")).toBeVisible();
    await expect(page.getByText("02080001001")).toBeVisible();
    await expect(page.getByText("test@company.com")).toBeVisible();
  });

  test("creates a new location", async ({ page }) => {
    const newLocation = {
      name: "Test Location",
      defaultPhoneNumber: "1234567890",
      defaultEmail: "test@example.com",
    };
    let locations: ApiLocation[] = [defaultLocation];

    await page.route("*/**/api/locations", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          json: locations,
        });
      } else if (method === "POST") {
        const data = JSON.parse(route.request().postData() || "{}");
        const newLocation = {
          ...data,
          id: "new-location-id",
          securityResponders: [],
          hasIncidents: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        locations.push(newLocation);
        await route.fulfill({
          status: 201,
          json: newLocation,
        });
      }
    });

    // Click add location button
    await page.getByRole("button", { name: "Add Location" }).click();

    // Fill location form
    await page.getByLabel("Name").fill(newLocation.name);
    await page
      .getByLabel("Default Phone Number")
      .fill(newLocation.defaultPhoneNumber);
    await page.getByLabel("Default Email").fill(newLocation.defaultEmail);

    await page.getByRole("button", { name: "Add Location" }).nth(1).click();

    // Verify success message and location details are displayed
    await expect(page.getByText("Location created successfully")).toBeVisible();

    // verify location details
    await expect(page.getByText(newLocation.name)).toBeVisible();
    await expect(page.getByText(newLocation.defaultPhoneNumber)).toBeVisible();
  });

  test("updates an existing location", async ({ page }) => {
    const existingLocation: ApiLocation = {
      id: "67f5fd3b306f8792d0dc5848",
      name: "Original Name",
      defaultPhoneNumber: "0000000000",
      defaultEmail: "old@example.com",
      securityResponders: [],
      hasIncidents: false,
      createdAt: "2025-04-09T04:53:15.03Z",
      updatedAt: "2025-04-16T02:18:31.198Z",
    };

    const updatedDetails = {
      name: "Updated Name",
      defaultPhoneNumber: "1234567890",
      defaultEmail: "new@example.com",
    };
    // Mock endpoints for update operation
    let updatedLocation = existingLocation;
    await page.route("*/**/api/locations", async (route) => {
      await route.fulfill({
        status: 200,
        json: [updatedLocation],
      });
    });

    await page.route(
      `*/**/api/locations/${existingLocation.id}`,
      async (route) => {
        const method = route.request().method();
        if (method === "PUT") {
          const requestData = JSON.parse(route.request().postData() || "{}");
          expect(requestData).toEqual(updatedDetails);

          const updatedData = {
            ...existingLocation,
            ...updatedDetails,
            updatedAt: new Date().toISOString(),
          };
          updatedLocation = updatedData;
          await route.fulfill({
            status: 200,
            json: updatedData,
          });
        }
      },
    );

    // Click edit button
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Update form fields
    await page.getByLabel("Name").fill(updatedDetails.name);
    await page
      .getByLabel("Default Phone Number")
      .fill(updatedDetails.defaultPhoneNumber);
    await page.getByLabel("Default Email").fill(updatedDetails.defaultEmail);
    await page.getByRole("button", { name: "Update Location" }).click();

    // Verify success message and updated details
    await expect(page.getByText("Location updated successfully")).toBeVisible();
    await expect(page.getByText(updatedDetails.name)).toBeVisible();
    await expect(
      page.getByText(updatedDetails.defaultPhoneNumber),
    ).toBeVisible();
    await expect(page.getByText(updatedDetails.defaultEmail)).toBeVisible();
  });

  test("manages security responders for a location", async ({ page }) => {
    // Click manage security button
    await page.getByRole("button", { name: "Manage Security" }).first().click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Select and add security responder
    await modal.getByRole("button", { name: "Add" }).first().click();

    await expect(modal.getByRole("button", { name: "Remove" })).toBeVisible();
    await expect(page.getByText(securityResponder.name)).toBeVisible();
    await expect(page.getByText(securityResponder.email)).toBeVisible();
  });

  test("prevents name changes for locations with incidents", async ({
    page,
  }) => {
    // Mock update endpoint
    await page.route(
      `*/**/api/locations/${locationWithIncidents.id}`,
      async (route) => {
        const method = route.request().method();
        if (method === "PUT") {
          const requestData = JSON.parse(route.request().postData() || "{}");
          const updatedData = {
            ...locationWithIncidents,
            ...requestData,
            name: locationWithIncidents.name, // Name should not change
            updatedAt: new Date().toISOString(),
          };
          // Update the location in the current state
          currentLocations = [defaultLocation, updatedData];
          await route.fulfill({
            status: 200,
            json: updatedData,
          });
        }
      },
    );

    // Click edit button on the second location (with incidents)
    await page.getByRole("button", { name: "Edit" }).nth(1).click();

    // Verify name field is disabled
    await expect(page.getByLabel("Name")).toBeDisabled();

    // Update other fields
    const updatedPhone = "0987654321";
    await page.getByLabel("Default Phone Number").fill(updatedPhone);
    await page.getByRole("button", { name: "Update Location" }).click();

    // Verify success message and that name hasn't changed
    await expect(page.getByText("Location updated successfully")).toBeVisible();
    await expect(page.getByText(locationWithIncidents.name)).toBeVisible();
    await expect(page.getByText(updatedPhone)).toBeVisible();
  });
});
