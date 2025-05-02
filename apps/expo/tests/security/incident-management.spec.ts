import { expect, test } from "@playwright/test";

test.use({ storageState: "playwright/.auth/security.json" });

test.describe("Security Incident Management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints
    await page.route("*/**/api/incident/list?*", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            location: {
              id: "67f5fd3b306f8792d0dc5848",
              name: "Default Location",
              defaultPhoneNumber: "02080001001",
              defaultEmail: "test@company.com",
              securityResponders: [
                {
                  id: "67f8cea4306f8792d0dc584c",
                  name: "security@duress.com",
                  email: "security@duress.com",
                },
              ],
              createdAt: "2025-04-09T04:53:15.03Z",
              updatedAt: "2025-04-16T02:18:31.198Z",
              hasIncidents: false,
            },
            id: "67ff146f6770a8fecd610253",
            dateCalled: "2025-04-16T02:22:39.174Z",
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
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        ],
      });
    });
    await page.route(
      "*/**/api/incident/67ff146f6770a8fecd610253",
      async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            location: {
              id: "67f5fd3b306f8792d0dc5848",
              name: "Default Location",
              defaultPhoneNumber: "02080001001",
              defaultEmail: "test@company.com",
              securityResponders: [
                {
                  id: "67f8cea4306f8792d0dc584c",
                  name: "security@duress.com",
                  email: "security@duress.com",
                },
              ],
              createdAt: "2025-04-09T04:53:15.03Z",
              updatedAt: "2025-04-16T02:18:31.198Z",
              hasIncidents: false,
            },
            id: "67ff146f6770a8fecd610253",
            dateCalled: "2025-04-16T02:22:39.174Z",
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
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        });
      },
    );

    // Navigate to the security dashboard
    await page.goto("/");
  });

  test("should display incoming incidents with correct status", async ({
    page,
  }) => {
    // Verify incident list is displayed
    const incidentsList = page.getByRole("list");
    await expect(incidentsList).toBeVisible();

    // Verify incident details are displayed correctly
    const incident = incidentsList.getByRole("listitem").first();
    await expect(incident).toBeVisible();
    await expect(incident).toContainText("Default Location");
    await expect(incident).toContainText("Open");

    await incident.getByRole("link", { name: "View Details" }).click();

    // Verify incident details page
    const incidentDetails = page.getByRole("heading", {
      name: /incident details/i,
    });
    await expect(incidentDetails).toBeVisible();

    const status = page.getByText("StatusOpen");
    const location = page.getByText("LocationDefault Location");
    const name = page.getByText("Nametest-user@duress.com");

    await expect(status).toBeVisible();
    await expect(location).toBeVisible();
    await expect(name).toBeVisible();
  });

  test("should handle anonymous incidents correctly", async ({ page }) => {
    // Override mock for anonymous incident
    await page.route("**/api/incident/list?*", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
            location: {
              id: "67f5fd3b306f8792d0dc5848",
              name: "Default Location",
              defaultPhoneNumber: "02080001001",
              defaultEmail: "test@company.com",
              securityResponders: [
                {
                  id: "67f8cea4306f8792d0dc584c",
                  name: "security@duress.com",
                  email: "security@duress.com",
                },
              ],
              createdAt: "2025-04-09T04:53:15.03Z",
              updatedAt: "2025-04-16T02:18:31.198Z",
              hasIncidents: false,
            },
            id: "67ff146f6770a8fecd610254",
            dateCalled: "2025-04-16T02:22:39.174Z",
            dateClosed: null,
            status: "Open",
            userId: null,
            name: "Anonymous",
            contactNumber: null,
            locationId: "67f5fd3b306f8792d0dc5848",
            roomNumber: "",
            gpsCoordinates: null,
            closedBy: null,
            closureNotes: null,
            cancellationReason: null,
            isAnonymous: true,
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        ],
      });
    });

    await page.route(
      "**/api/incident/67ff146f6770a8fecd610254",
      async (route) => {
        await route.fulfill({
          status: 200,
          json: {
            location: {
              id: "67f5fd3b306f8792d0dc5848",
              name: "Parking Lot",
              defaultPhoneNumber: "02080001001",
              defaultEmail: "test@company.com",
              securityResponders: [],
              createdAt: "2025-04-09T04:53:15.03Z",
              updatedAt: "2025-04-16T02:18:31.198Z",
              hasIncidents: false,
            },
            id: "67ff146f6770a8fecd610254",
            dateCalled: "2025-04-16T02:22:39.174Z",
            dateClosed: null,
            status: "Open",
            userId: null,
            name: "Anonymous",
            contactNumber: null,
            locationId: "67f5fd3b306f8792d0dc5848",
            roomNumber: "",
            gpsCoordinates: null,
            closedBy: null,
            closureNotes: null,
            cancellationReason: null,
            isAnonymous: true,
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        });
      },
    );

    const incident = page.getByRole("list").getByRole("listitem").first();
    await expect(incident).toBeVisible();
    await incident.getByRole("link", { name: "View Details" }).click();

    // Verify incident details page
    const incidentDetails = page.getByRole("heading", {
      name: /incident details/i,
    });
    await expect(incidentDetails).toBeVisible();

    const status = page.getByText("StatusOpen");
    const name = page.getByText("NameAnonymous");
    const contact = page.getByText("ContactAnonymous");

    await expect(status).toBeVisible();
    await expect(name).toBeVisible();
    await expect(contact).toBeVisible();
  });

  test("should display map when incident has GPS coordinates", async ({
    page,
  }) => {
    // Override mock for incident with GPS coordinates
    await page.route("**/api/incident/list?*", async (route) => {
      await route.fulfill({
        status: 200,
        json: [
          {
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
            id: "67ff146f6770a8fecd610255",
            dateCalled: "2025-04-16T02:22:39.174Z",
            dateClosed: null,
            status: "Open",
            userId: "67fc7df5b927ec0b93c676fa",
            name: "test-user@duress.com",
            contactNumber: "+61400123123",
            locationId: "67f5fd3b306f8792d0dc5848",
            roomNumber: "",
            gpsCoordinates: {
              type: 7,
              coordinates: {
                values: [115.8613, -31.9523], // [longitude, latitude]
                x: 115.8613, // longitude
                y: -31.9523, // latitude
              },
              boundingBox: null,
              coordinateReferenceSystem: null,
              extraMembers: null,
            },
            closedBy: null,
            closureNotes: null,
            cancellationReason: null,
            isAnonymous: false,
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        ],
      });
    });

    await page.route(
      "**/api/incident/67ff146f6770a8fecd610255",
      async (route) => {
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
            id: "67ff146f6770a8fecd610255",
            dateCalled: "2025-04-16T02:22:39.174Z",
            dateClosed: null,
            status: "Open",
            userId: "67fc7df5b927ec0b93c676fa",
            name: "test-user@duress.com",
            contactNumber: "+61400123123",
            locationId: "67f5fd3b306f8792d0dc5848",
            roomNumber: "",
            gpsCoordinates: {
              type: 7,
              coordinates: {
                values: [115.8613, -31.9523], // [longitude, latitude]
                x: 115.8613, // longitude
                y: -31.9523, // latitude
              },
              boundingBox: null,
              coordinateReferenceSystem: null,
              extraMembers: null,
            },
            closedBy: null,
            closureNotes: null,
            cancellationReason: null,
            isAnonymous: false,
            createdAt: "2025-04-16T02:22:39.174Z",
            updatedAt: "2025-04-16T02:22:39.174Z",
          },
        });
      },
    );

    const incident = page.getByRole("list").getByRole("listitem").first();
    await expect(incident).toBeVisible();
    await incident.getByRole("link", { name: "View Details" }).click();

    // Verify incident details page
    const incidentDetails = page.getByRole("heading", {
      name: /incident details/i,
    });
    await expect(incidentDetails).toBeVisible();

    // Verify map is visible
    const map = page.locator('iframe[title="Map"]');
    await expect(map).toBeVisible();

    // Verify coordinates are displayed
    const coordinates = page.getByText("-31.9523, 115.8613");
    await expect(coordinates).toBeVisible();
  });

  test("should allow marking incident as resolved", async ({ page }) => {
    // Mock resolve endpoint
    await page.route("**/api/incident/*/close", async (route) => {
      const requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        json: {
          location: {
            id: "67f5fd3b306f8792d0dc5848",
            name: "Lobby",
            defaultPhoneNumber: "02080001001",
            defaultEmail: "test@company.com",
            securityResponders: [],
            createdAt: "2025-04-09T04:53:15.03Z",
            updatedAt: "2025-04-16T02:18:31.198Z",
            hasIncidents: false,
          },
          id: "67ff146f6770a8fecd610254",
          dateCalled: "2025-04-16T02:22:39.174Z",
          dateClosed: new Date().toISOString(),
          status: "Resolved",
          userId: "67fc7df5b927ec0b93c676fa",
          name: "test-user@duress.com",
          contactNumber: "+61400123123",
          locationId: "67f5fd3b306f8792d0dc5848",
          roomNumber: "",
          gpsCoordinates: null,
          closedBy: "67f8cea4306f8792d0dc584c",
          closureNotes: requestBody.closureNotes,
          cancellationReason: null,
          isAnonymous: false,
          createdAt: "2025-04-16T02:22:39.174Z",
          updatedAt: new Date().toISOString(),
          responseTime: 5,
          responder: {
            id: "67f8cea4306f8792d0dc584c",
            name: "security@duress.com",
            email: "security@duress.com",
          },
        },
      });
    });

    const incident = page.getByRole("list").getByRole("listitem").first();
    await expect(incident).toBeVisible();
    await incident.getByRole("link", { name: "View Details" }).click();

    // Verify incident details page
    const incidentDetails = page.getByRole("heading", {
      name: /incident details/i,
    });
    await expect(incidentDetails).toBeVisible();

    // Open resolution modal
    await page.getByRole("button", { name: "Resolve Incident" }).click();

    // Verify resolution modal
    const resolutionModal = page.getByRole("dialog");
    await expect(resolutionModal).toBeVisible();

    // Fill resolution details
    await resolutionModal
      .getByRole("textbox", { name: "Closure Notes*" })
      .fill("Situation resolved. No further action needed.");

    // Submit resolution
    await resolutionModal
      .getByRole("button", { name: "Resolve Incident" })
      .click();

    // Verify modal closes
    await expect(resolutionModal).not.toBeVisible();
  });
});
