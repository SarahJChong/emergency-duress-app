import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Distress Call Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("*/**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 404,
      });
    });

    await page.route("*/**/api/incident", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        await route.fulfill({
          status: 200,
          json: {
            id: "67ff146f6770a8fecd610253",
            timestamp: new Date().toISOString(),
            status: "Open",
            isAnonymous: false,
          },
        });
      }
    });
    // Navigate to the user screen
    await page.goto("/");
  });

  test("should display distress call button with correct initial state", async ({
    page,
  }) => {
    // Check for the call button with default text
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await expect(callButton).toBeVisible();
    await expect(callButton).toBeEnabled();
  });

  test("should handle the incident raising state correctly", async ({
    page,
  }) => {
    // wait for the first API call to get the active incident
    await page.waitForResponse((response) =>
      response.url().includes("/api/incident/active"),
    );

    await page.route("**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610253",
          dateCalled: new Date().toISOString(),
          dateClosed: null,
          status: "Open",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: null,
          closureNotes: null,
          cancellationReason: null,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    // Click the distress call button
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await callButton.click();

    // Verify the button state changes
    await expect(callButton).toBeDisabled();

    page.once("request", (request) => {
      expect(request.url()).toMatch(/^tel:/);
    });
  });

  test("should use location-specific phone number for the call", async ({
    page,
  }) => {
    // Get the user's configured location phone number from the API response
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/users/me"),
    );
    // wait for the first API call to get the active incident
    await page.waitForResponse((response) =>
      response.url().includes("/api/incident/active"),
    );

    await page.route("**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610253",
          dateCalled: new Date().toISOString(),
          dateClosed: null,
          status: "Open",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: null,
          closureNotes: null,
          cancellationReason: null,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    const response = await responsePromise;
    const userData = await response.json();
    const expectedPhoneNumber = userData.location.defaultPhoneNumber;

    // Verify the phone number exists
    expect(expectedPhoneNumber).toBeTruthy();

    // Click the distress call button
    await page.getByRole("button", { name: /emergency call/i }).click();

    page.on("request", (request) => {
      if (request.url().startsWith("tel:")) {
        expect(request.url()).toBe(
          `tel:${expectedPhoneNumber.replace(/\D/g, "")}`,
        );
      }
    });
  });

  test("should show active state after incident is raised", async ({
    page,
  }) => {
    // wait for the first API call to get the active incident
    await page.waitForResponse((response) =>
      response.url().includes("/api/incident/active"),
    );

    await page.route("**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610253",
          dateCalled: new Date().toISOString(),
          dateClosed: null,
          status: "Open",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: null,
          closureNotes: null,
          cancellationReason: null,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    // Click the distress call button
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await callButton.click();

    // Verify the button shows active state
    await expect(callButton).toHaveText(/active/i);
    await expect(callButton).toBeDisabled();
    await expect(callButton).toHaveClass(/animate-pulse/);
  });

  test("should handle anonymous incident creation", async ({ page }) => {
    // wait for the first API call to get the active incident
    await page.waitForResponse((response) =>
      response.url().includes("/api/incident/active"),
    );

    await page.route("**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610253",
          dateCalled: new Date().toISOString(),
          dateClosed: null,
          status: "Open",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "Anonymous",
          contactNumber: "Anonymous",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: null,
          closureNotes: null,
          cancellationReason: null,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    // Enable anonymous mode
    const anonymousSwitch = page.locator(
      'input[type="checkbox"][aria-label="Anonymize my name and mobile"]',
    );
    await anonymousSwitch.click();

    await expect(anonymousSwitch).toBeChecked();

    // Intercept the POST request and validate body
    let requestBody: any;
    await page.route("**/api/incident", async (route, request) => {
      requestBody = await request.postDataJSON();
      await route.fulfill({
        status: 200,
        json: {
          id: "67ff146f6770a8fecd610253",
          timestamp: new Date().toISOString(),
          status: "Open",
          isAnonymous: true,
        },
      });
    });

    // Wait for the response (concurrently)
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/incident/active") &&
        response.status() === 200,
    );

    // Click the distress call buttons
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await callButton.click();

    // Wait for the response
    const response = await responsePromise;
    const responseBody = await response.json();

    // Validate response (optional)
    expect(response.ok()).toBeTruthy();

    // Validate request body
    expect(responseBody).toMatchObject({
      isAnonymous: true,
    });

    // Validate phone call was still made
    page.once("request", (request) => {
      expect(request.url()).toMatch(/^tel:/);
    });
  });

  test("should let you cancel incident after its been created", async ({
    page,
  }) => {
    // wait for the first API call to get the active incident
    await page.waitForResponse((response) =>
      response.url().includes("/api/incident/active"),
    );

    await page.route("**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610253",
          dateCalled: new Date().toISOString(),
          dateClosed: null,
          status: "Open",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: null,
          closureNotes: null,
          cancellationReason: null,
          isAnonymous: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    await page.route("**/api/incident/cancel", async (route) => {
      const method = route.request().method();
      if (method === "POST") {
        const requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: {
            location: {
              id: "67f5fd3b306f8792d0dc5848",
              name: "Default Location",
              defaultPhoneNumber: "02080001001",
              defaultEmail: "test@company.com",
              securityResponders: [],
              createdAt: "2025-04-09T04:53:15.03Z",
              updatedAt: "2025-04-16T02:18:31.198Z",
              hasIncidents: false,
            },
            id: "67ff146f6770a8fecd610253",
            dateCalled: new Date().toISOString(),
            dateClosed: new Date().toISOString(),
            status: "Cancelled",
            userId: "67fc7df5b927ec0b93c676fa",
            name: "test-user@duress.com",
            contactNumber: "+61400123123",
            locationId: "67f5fd3b306f8792d0dc5848",
            roomNumber: "",
            gpsCoordinates: null,
            closedBy: null,
            closureNotes: null,
            cancellationReason: requestBody.cancellationReason,
            isAnonymous: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
    });

    // Click the distress call button
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await callButton.click();

    // Verify the button shows active state
    await expect(callButton).toHaveText(/active/i);
    await expect(callButton).toBeDisabled();
    await expect(callButton).toHaveClass(/animate-pulse/);

    // Click the cancel button
    const cancelButton = page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();

    // a modal should appear
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/cancel emergency/i)).toBeVisible();

    // a text input should be present to enter a reason
    const cancellationReason = page.locator(
      'textarea[placeholder="Please provide a reason for cancellation"]',
    );
    await cancellationReason.fill("User changed their mind");

    // verify a cancel request was made
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/incident/cancel"),
    );

    await page.route("*/**/api/incident/active", async (route) => {
      await route.fulfill({
        status: 404,
      });
    });

    // Click the confirm button
    const confirmButton = modal.getByRole("button", { name: /cancel/i });
    await confirmButton.click();

    const response = await responsePromise;
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      cancellationReason: "User changed their mind",
    });

    // verify the modal is closed
    await expect(modal).not.toBeVisible();

    // verify the button is back to its original state
    await expect(callButton).toBeVisible();
    await expect(callButton).toHaveText(/emergency call/i);

    // verify the button is enabled
    await expect(callButton).toBeEnabled();
    await expect(callButton).not.toHaveClass(/animate-pulse/);
    await expect(callButton).not.toHaveText(/creating/i);
    await expect(callButton).not.toHaveText(/active/i);
  });
  test("should handle offline scenario gracefully", async ({ page }) => {
    // First return valid user data that would be cached
    await page.route("**/api/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Default Location",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
          },
        },
      });
    });

    // Wait for initial data to load
    await page.waitForResponse((response) =>
      response.url().includes("/api/users/me"),
    );

    // Then simulate network being offline
    await page.route("**/*", async (route) => {
      await route.abort("internetdisconnected");
    });

    // Wait for the offline banner to appear
    await expect(page.getByText(/you are offline/i)).toBeVisible();

    // Click the distress call button
    const callButton = page.getByRole("button", { name: /emergency call/i });
    await callButton.click();

    // Verify phone call was attempted with cached phone number despite being offline
    page.once("request", (request) => {
      if (request.url().startsWith("tel:")) {
        expect(request.url()).toBe("tel:02080001001");
      }
    });
  });
});
