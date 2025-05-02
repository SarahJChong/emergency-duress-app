import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { useMeQuery } from "@/hooks/useQueries";
import {
  fetchIncidentDetails,
  fetchMe,
  fetchUserIncidents,
  getActiveIncident,
} from "@/lib/api";
import {
  getOpenPendingIncident,
  getPendingIncidents,
} from "@/lib/offlineIncidents";
import {
  useActiveIncidentQuery,
  useIncidentDetailsQuery,
  useOfflineIncidentQuery,
  useOpenPendingIncidentQuery,
  useUserIncidentsQuery,
} from "../useIncidentQueries";

// Mock the API module
jest.mock("@/lib/api", () => ({
  getActiveIncident: jest.fn(),
  fetchUserIncidents: jest.fn(),
  fetchIncidentDetails: jest.fn(),
  fetchMe: jest.fn(),
  fetchLocations: jest.fn(),
}));

jest.mock("@/lib/offlineIncidents", () => ({
  getOpenPendingIncident: jest.fn(),
  getPendingIncidents: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMeQuery Hook", () => {
  const mockUser = {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch when disabled", () => {
    const wrapper = createWrapper();
    renderHook(() => useMeQuery(false), { wrapper });
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("should fetch and return user data", async () => {
    (fetchMe as jest.Mock).mockResolvedValueOnce(mockUser);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMeQuery(true), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockUser);
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (fetchMe as jest.Mock).mockRejectedValueOnce(error);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useMeQuery(true), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});

describe("useOpenPendingIncidentQuery Hook", () => {
  const mockPendingIncident = {
    locationId: "loc-1",
    status: "Open",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and return open pending incident", async () => {
    (getOpenPendingIncident as jest.Mock).mockResolvedValueOnce(
      mockPendingIncident,
    );
    const wrapper = createWrapper();
    const { result } = renderHook(() => useOpenPendingIncidentQuery(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockPendingIncident);
  });

  it("should handle null response", async () => {
    (getOpenPendingIncident as jest.Mock).mockResolvedValueOnce(null);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useOpenPendingIncidentQuery(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
  });
});

describe("useOfflineIncidentQuery Hook", () => {
  const mockIncidentId = "2024-02-28T03:10:23.000Z";
  const mockPendingIncidents = [
    {
      locationId: "loc-1",
      status: "Open",
      createdAt: mockIncidentId,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch when id is empty", () => {
    const wrapper = createWrapper();
    renderHook(() => useOfflineIncidentQuery(""), { wrapper });
    expect(getPendingIncidents).not.toHaveBeenCalled();
  });

  it("should fetch and return offline incident", async () => {
    (getPendingIncidents as jest.Mock).mockResolvedValueOnce(
      mockPendingIncidents,
    );
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useOfflineIncidentQuery(mockIncidentId),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockPendingIncidents[0]);
  });

  it("should throw error when incident not found", async () => {
    (getPendingIncidents as jest.Mock).mockResolvedValueOnce([]);
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useOfflineIncidentQuery(mockIncidentId),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(
      new Error("Offline incident not found"),
    );
  });

  it("should not retry on error", async () => {
    const error = new Error("Storage error");
    (getPendingIncidents as jest.Mock).mockRejectedValueOnce(error);
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useOfflineIncidentQuery(mockIncidentId),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getPendingIncidents).toHaveBeenCalledTimes(1);
  });
});

describe("useActiveIncidentQuery Hook", () => {
  const mockActiveIncident = {
    id: "incident-1",
    status: "Open",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch when disabled", () => {
    const wrapper = createWrapper();
    renderHook(() => useActiveIncidentQuery(false), { wrapper });
    expect(getActiveIncident).not.toHaveBeenCalled();
  });

  it("should fetch and return active incident", async () => {
    (getActiveIncident as jest.Mock).mockResolvedValueOnce(mockActiveIncident);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useActiveIncidentQuery(true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockActiveIncident);
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (getActiveIncident as jest.Mock).mockRejectedValueOnce(error);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useActiveIncidentQuery(true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("should respect enabled flag", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useActiveIncidentQuery(false), {
      wrapper,
    });
    expect(result.current.enabled).toBe(false);
  });
});

describe("useUserIncidentsQuery Hook", () => {
  const mockIncidents = [
    { id: "incident-1", status: "Open", createdAt: new Date().toISOString() },
    { id: "incident-2", status: "Closed", createdAt: new Date().toISOString() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch when disabled", () => {
    const wrapper = createWrapper();
    renderHook(() => useUserIncidentsQuery(false), { wrapper });
    expect(fetchUserIncidents).not.toHaveBeenCalled();
  });

  it("should fetch and return user incidents", async () => {
    (fetchUserIncidents as jest.Mock).mockResolvedValueOnce(mockIncidents);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserIncidentsQuery(true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(
      mockIncidents.map((incident) => ({
        ...incident,
      })),
    );
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (fetchUserIncidents as jest.Mock).mockRejectedValueOnce(error);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserIncidentsQuery(true), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("should respect enabled flag", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserIncidentsQuery(false), {
      wrapper,
    });
    expect(result.current.enabled).toBe(false);
  });
});

describe("useIncidentDetailsQuery Hook", () => {
  const mockIncidentId = "incident-1";
  const mockIncidentDetails = {
    id: mockIncidentId,
    status: "Open",
    createdAt: new Date().toISOString(),
    details: "Test incident details",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not fetch when disabled", () => {
    const wrapper = createWrapper();
    renderHook(() => useIncidentDetailsQuery(mockIncidentId, false), {
      wrapper,
    });
    expect(fetchIncidentDetails).not.toHaveBeenCalled();
  });

  it("should not fetch when id is empty", () => {
    const wrapper = createWrapper();
    renderHook(() => useIncidentDetailsQuery("", true), { wrapper });
    expect(fetchIncidentDetails).not.toHaveBeenCalled();
  });

  it("should fetch and return incident details", async () => {
    (fetchIncidentDetails as jest.Mock).mockResolvedValueOnce(
      mockIncidentDetails,
    );
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useIncidentDetailsQuery(mockIncidentId, true),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockIncidentDetails);
    expect(fetchIncidentDetails).toHaveBeenCalledWith(mockIncidentId);
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (fetchIncidentDetails as jest.Mock).mockRejectedValueOnce(error);
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useIncidentDetailsQuery(mockIncidentId, true),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("should respect enabled flag", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useIncidentDetailsQuery(mockIncidentId, false),
      { wrapper },
    );
    expect(result.current.enabled).toBe(false);
  });
});
