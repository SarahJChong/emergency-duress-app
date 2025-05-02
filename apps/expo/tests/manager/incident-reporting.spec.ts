import { expect, test } from "@playwright/test";

// Mock data with multiple incidents across different times and locations
const mockIncidents = [
  {
    id: "67ff146f6770a8fecd610253",
    dateCalled: "2025-04-16T10:00:00Z",
    dateClosed: "2025-04-16T10:30:00Z", // 30 min response
    status: "Closed",
    userId: "67fc7df5b927ec0b93c676fa",
    name: "John Doe",
    locationId: "67f5fd3b306f8792d0dc5848",
    location: {
      id: "67f5fd3b306f8792d0dc5848",
      name: "Default Location",
      defaultPhoneNumber: "0987654321",
      defaultEmail: "test@company.com",
      securityResponders: [
        {
          id: "67f8cea4306f8792d0dc584c",
          name: "security@duress.com",
          email: "security@duress.com",
        },
      ],
      createdAt: "2025-04-09T04:53:15.03Z",
      updatedAt: "2025-04-17T01:40:32.654Z",
      hasIncidents: true,
    },
    roomNumber: "123",
    closedBy: "Security Officer Smith",
    closureNotes: "Quick resolution",
    isAnonymous: false,
    createdAt: "2025-04-16T10:00:00Z",
    updatedAt: "2025-04-16T10:30:00Z",
  },
  {
    id: "67ff146f6770a8fecd610254",
    dateCalled: "2025-04-16T11:00:00Z",
    status: "Open",
    locationId: "67f5fd3b306f8792d0dc5848",
    location: {
      id: "67f5fd3b306f8792d0dc5848",
      name: "Default Location",
      defaultPhoneNumber: "0987654321",
      defaultEmail: "test@company.com",
      securityResponders: [
        {
          id: "67f8cea4306f8792d0dc584c",
          name: "security@duress.com",
          email: "security@duress.com",
        },
      ],
      createdAt: "2025-04-09T04:53:15.03Z",
      updatedAt: "2025-04-17T01:40:32.654Z",
      hasIncidents: true,
    },
    roomNumber: "124",
    isAnonymous: true,
    createdAt: "2025-04-16T11:00:00Z",
    updatedAt: "2025-04-16T11:00:00Z",
  },
];

const mockUser = {
  id: "67fc7e1db927ec0b93c676fb",
  externalId: "auth0|67fc7d0a5c9d225cd11f285b",
  name: "test-manager@duress.com",
  email: "test-manager@duress.com",
  contactNumber: "+61400123123",
  roomNumber: "",
  locationId: "67f5fd3b306f8792d0dc5848",
  createdAt: "2025-04-14T03:16:45.851Z",
  updatedAt: "2025-04-14T03:16:45.851Z",
  location: {
    id: "67f5fd3b306f8792d0dc5848",
    name: "Default Location",
    defaultPhoneNumber: "0987654321",
    defaultEmail: "test@company.com",
    securityResponders: [
      {
        id: "67f8cea4306f8792d0dc584c",
        name: "security@duress.com",
        email: "security@duress.com",
      },
      {
        id: "67fc7d9cb927ec0b93c676f9",
        name: "test-security@duress.com",
        email: "test-security@duress.com",
      },
    ],
    createdAt: "2025-04-09T04:53:15.03Z",
    updatedAt: "2025-04-17T01:40:32.654Z",
    hasIncidents: false,
  },
  roles: ["manager"],
};

test.describe("Manager Incident Reporting", () => {
  test.beforeEach(async ({ page }) => {
    // Mock user endpoint
    await page.route("*/**/api/users/me", async (route) => {
      await route.fulfill({ status: 200, json: mockUser });
    });

    // Mock incident list endpoint with proper URL pattern matching
    await page.route("*/**/api/incident/list*", async (route) => {
      const url = new URL(route.request().url());
      const status = url.searchParams.get("status");
      const locationId = url.searchParams.get("locationId");
      const dateFrom = url.searchParams.get("dateFrom");
      const dateTo = url.searchParams.get("dateTo");
      const sortBy = url.searchParams.get("sortBy");
      const sortOrder = url.searchParams.get("sortOrder");

      let filteredIncidents = [...mockIncidents];

      // Apply filters
      if (status) {
        filteredIncidents = filteredIncidents.filter(
          (i) => i.status === status,
        );
      }
      if (locationId) {
        filteredIncidents = filteredIncidents.filter(
          (i) => i.locationId === locationId,
        );
      }
      if (dateFrom) {
        filteredIncidents = filteredIncidents.filter(
          (i) => new Date(i.dateCalled) >= new Date(dateFrom),
        );
      }
      if (dateTo) {
        filteredIncidents = filteredIncidents.filter(
          (i) => new Date(i.dateCalled) <= new Date(dateTo),
        );
      }

      // Apply sorting
      if (sortBy && sortOrder) {
        filteredIncidents.sort((a, b) => {
          if (sortBy === "date") {
            return sortOrder === "desc"
              ? new Date(b.dateCalled).getTime() -
                  new Date(a.dateCalled).getTime()
              : new Date(a.dateCalled).getTime() -
                  new Date(b.dateCalled).getTime();
          }
          if (sortBy === "status") {
            return sortOrder === "desc"
              ? b.status.localeCompare(a.status)
              : a.status.localeCompare(b.status);
          }
          return 0;
        });
      }

      await route.fulfill({ status: 200, json: filteredIncidents });
    });

    // Navigate to security dashboard
    await page.goto("/security");

    // Wait for initial page load
    await page.waitForLoadState("networkidle");
  });

  test("displays incident list with metrics", async ({ page }) => {
    // First select "All Statuses" to show all incidents
    await page.getByLabel("Status").selectOption("All Statuses");

    // Wait for the filtered results
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/incident/list") &&
        response.status() === 200,
    );

    // Check presence of filter controls
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByLabel("Date Range")).toBeVisible();
    await expect(page.getByLabel("Sort By")).toBeVisible();
    await expect(page.getByLabel("Location")).toBeVisible();

    // Verify all incidents are shown
    await expect(page.getByRole("listitem")).toHaveCount(2);

    // Check metrics for first incident
    const firstIncident = page.getByRole("listitem").first();
    await expect(firstIncident).toContainText("Default Location"); // Location
    await expect(firstIncident).toContainText("Open"); // Status
    await expect(firstIncident).toContainText("Date Called: Apr 16, 2025, 07");

    // check metrics for second incident
    const secondIncident = page.getByRole("listitem").nth(1);
    await expect(secondIncident).toContainText("Closed"); // Status
    await expect(secondIncident).toContainText("Default Location"); // Location
    await expect(secondIncident).toContainText("Date Called: Apr 16, 2025, 06");
  });

  test("filters incidents correctly", async ({ page }) => {
    // First select "All Statuses"
    await page.getByLabel("Status").selectOption("");
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/incident/list") &&
        response.status() === 200,
    );

    // Test status filter
    await page.getByLabel("Status").selectOption("Closed");
    let listitem = page.getByRole("listitem");
    await expect(listitem).toHaveCount(1);
    await expect(listitem.getByText("Default Location")).toBeVisible();
    await expect(listitem.getByText("Closed")).toBeVisible();
    await expect(
      listitem.getByText("Date Called: Apr 16, 2025, 06"),
    ).toBeVisible();

    await page.getByLabel("Status").selectOption("Open");
    listitem = page.getByRole("listitem");
    await expect(listitem).toHaveCount(1);
    await expect(listitem.getByText("Default Location")).toBeVisible();
    await expect(listitem.getByText("Open")).toBeVisible();
    await expect(
      listitem.getByText("Date Called: Apr 16, 2025, 07"),
    ).toBeVisible();
  });

  test("sorts incidents correctly", async ({ page }) => {
    // First select "All Statuses"
    await page.getByLabel("Status").selectOption("");
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/incident/list") &&
        response.status() === 200,
    );

    // Test date sorting
    await page.getByLabel("Sort By").selectOption("date_asc");
    const incidents = page.getByRole("listitem");
    await expect(incidents.first()).toContainText(
      "Date Called: Apr 16, 2025, 06",
    );

    await page.getByLabel("Sort By").selectOption("date_desc");
    await expect(incidents.first()).toContainText(
      "Date Called: Apr 16, 2025, 07",
    );
  });
});
