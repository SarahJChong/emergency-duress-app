import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";
import type { ApiIncident } from "@/lib/api";
import { fetchUserIncidents } from "@/lib/api";
import type { PendingIncident } from "@/lib/offlineIncidents";
import { getPendingIncidents } from "@/lib/offlineIncidents";
import { useIncidents } from "../useIncidents";

const baseIncidentDate = new Date();
const yesterdayDate = new Date(baseIncidentDate);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);

export const mockIncidents: ApiIncident[] = [
  {
    id: "incident-1",
    dateCalled: baseIncidentDate,
    status: "Open",
    userId: "user-1",
    locationId: "location-1",
    location: {
      id: "location-1",
      name: "Test Location 1",
      defaultPhoneNumber: "1234567890",
      defaultEmail: "location1@example.com",
      createdAt: baseIncidentDate,
      updatedAt: baseIncidentDate,
      securityResponders: [],
      hasIncidents: false,
    },
    isAnonymous: false,
    createdAt: baseIncidentDate,
    updatedAt: baseIncidentDate,
  },
  {
    id: "incident-2",
    dateCalled: yesterdayDate,
    dateClosed: baseIncidentDate,
    status: "Closed",
    userId: "user-1",
    locationId: "location-2",
    location: {
      id: "location-2",
      name: "Test Location 2",
      defaultPhoneNumber: "0987654321",
      defaultEmail: "location2@example.com",
      createdAt: yesterdayDate,
      updatedAt: baseIncidentDate,
      securityResponders: [],
      hasIncidents: false,
    },
    isAnonymous: false,
    createdAt: yesterdayDate,
    updatedAt: baseIncidentDate,
    closedBy: "Test User",
    closureNotes: "Test closure notes",
  },
];

const basePendingDate = new Date();
const earlierDate = new Date(basePendingDate);
earlierDate.setHours(earlierDate.getHours() - 2);

export const mockPendingIncidents: PendingIncident[] = [
  {
    locationId: "location-3",
    location: {
      id: "location-3",
      name: "Test Location 3",
      defaultPhoneNumber: "5555555555",
      defaultEmail: "location3@example.com",
      createdAt: basePendingDate,
      updatedAt: basePendingDate,
      securityResponders: [],
      hasIncidents: false,
    },
    roomNumber: "123",
    name: "John Doe",
    isAnonymous: false,
    status: "Open",
    createdAt: basePendingDate.toISOString(),
  },
  {
    locationId: "location-4",
    location: {
      id: "location-4",
      name: "Test Location 4",
      defaultPhoneNumber: "6666666666",
      defaultEmail: "location4@example.com",
      createdAt: earlierDate,
      updatedAt: earlierDate,
      securityResponders: [],
      hasIncidents: false,
    },
    roomNumber: "456",
    isAnonymous: true,
    status: "Cancelled",
    createdAt: earlierDate.toISOString(),
    cancellationReason: "Test cancellation",
    cancelledAt: basePendingDate.toISOString(),
  },
];

jest.mock("@/lib/api");
jest.mock("@/lib/offlineIncidents");
jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useIsOffline");

const mockFetchUserIncidents = fetchUserIncidents as jest.MockedFunction<
  typeof fetchUserIncidents
>;

const mockGetPendingIncidents = getPendingIncidents as jest.MockedFunction<
  typeof getPendingIncidents
>;

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUseIsOffline = useIsOffline as jest.MockedFunction<
  typeof useIsOffline
>;

describe("useIncidents Hook", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();

    // Set up default mock implementations
    mockFetchUserIncidents.mockResolvedValue(mockIncidents);
    mockGetPendingIncidents.mockResolvedValue(mockPendingIncidents);
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isLoading: false,
      session: null,
      user: undefined,
      error: null,
      signIn: () => {},
      signOut: () => {},
    });
    mockUseIsOffline.mockReturnValue({
      isOffline: false,
      isOfflineWithUser: false,
    });
  });

  it("should combine and sort online and offline incidents", async () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(result.current.incidents).toHaveLength(
      mockIncidents.length + mockPendingIncidents.length,
    );

    // Verify sorting (most recent first)
    const dates = result.current.incidents.map((i) => i.createdAt.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));

    // Verify online incidents are marked as not pending
    const onlineIncident = result.current.incidents.find(
      (i) => i.id === mockIncidents[0].id,
    );
    expect(onlineIncident?.isPending).toBe(false);
    expect(onlineIncident?.location?.name).toBe("Test Location 1");

    // Verify offline incidents are marked as pending and have location/name info
    const offlineIncident = result.current.incidents.find(
      (i) => i.id === mockPendingIncidents[0].createdAt,
    );
    expect(offlineIncident?.isPending).toBe(true);
    expect(offlineIncident?.location?.name).toBe("Test Location 3");
    expect(offlineIncident?.name).toBe("John Doe");
  });

  it("should find incident by ID", async () => {
    const onlineId = mockIncidents[0].id;
    const { result } = renderHook(() => useIncidents(onlineId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(result.current.incident?.id).toBe(onlineId);
    expect(result.current.incident?.isPending).toBe(false);
    expect(result.current.incident?.location?.name).toBe("Test Location 1");

    // Test finding offline incident
    const offlineId = mockPendingIncidents[0].createdAt;
    const { result: offlineResult } = renderHook(
      () => useIncidents(offlineId),
      { wrapper },
    );

    await waitFor(() => {
      expect(offlineResult.current.isLoading).toBeFalsy();
    });

    expect(offlineResult.current.incident?.id).toBe(offlineId);
    expect(offlineResult.current.incident?.isPending).toBe(true);
    expect(offlineResult.current.incident?.location?.name).toBe(
      "Test Location 3",
    );
    expect(offlineResult.current.incident?.name).toBe("John Doe");
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Network error");
    mockFetchUserIncidents.mockRejectedValueOnce(error);
    mockGetPendingIncidents.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useIncidents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    expect(result.current.error).toEqual(error);
  });

  it("should handle offline state", async () => {
    mockUseIsOffline.mockReturnValue({
      isOffline: true,
      isOfflineWithUser: true,
    });

    const { result } = renderHook(() => useIncidents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    // Should still have incidents with proper offline data
    const offlineIncident = result.current.incidents.find(
      (i) => i.id === mockPendingIncidents[0].createdAt,
    );
    expect(offlineIncident?.location?.name).toBe("Test Location 3");
    expect(offlineIncident?.name).toBe("John Doe");
  });

  it("should handle anonymous offline incidents", async () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    const anonymousIncident = result.current.incidents.find(
      (i) => i.id === mockPendingIncidents[1].createdAt,
    );
    expect(anonymousIncident?.isAnonymous).toBe(true);
    expect(anonymousIncident?.isPending).toBe(true);
    expect(anonymousIncident?.name).toBeUndefined();
  });

  it("should handle undefined isAnonymous in pending incidents", async () => {
    // Create a pending incident without isAnonymous field
    const pendingWithoutAnonymous: PendingIncident = {
      ...mockPendingIncidents[0],
      isAnonymous: undefined,
    };
    mockGetPendingIncidents.mockResolvedValueOnce([pendingWithoutAnonymous]);

    const { result } = renderHook(() => useIncidents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBeFalsy();
    });

    const incident = result.current.incidents.find(
      (i) => i.id === pendingWithoutAnonymous.createdAt,
    );
    expect(incident?.isAnonymous).toBe(false); // Should default to false
    expect(incident?.isPending).toBe(true);
  });
});
