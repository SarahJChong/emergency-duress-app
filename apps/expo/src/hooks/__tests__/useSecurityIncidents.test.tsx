import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { listIncidents } from "@/lib/api";
import { useSecurityIncidents } from "../useSecurityIncidents";

// Mock the API functions
jest.mock("@/lib/api", () => ({
  listIncidents: jest.fn(),
}));

const mockIncidents = [
  {
    id: "1",
    status: "Open",
    dateCalled: new Date().toISOString(),
    location: { name: "Building A" },
    name: "John Doe",
    isAnonymous: false,
  },
  {
    id: "2",
    status: "Closed",
    dateCalled: new Date().toISOString(),
    location: { name: "Building B" },
    name: "Jane Smith",
    isAnonymous: false,
  },
  {
    id: "3",
    status: "Open",
    dateCalled: new Date().toISOString(),
    location: { name: "Building C" },
    isAnonymous: true,
  },
];

describe("useSecurityIncidents", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch and filter incidents correctly", async () => {
    (listIncidents as jest.Mock).mockResolvedValueOnce(mockIncidents);

    const { result } = renderHook(() => useSecurityIncidents(), {
      wrapper,
    });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have filtered incidents correctly
    expect(result.current.data).toHaveLength(3);
  });

  it("should handle API errors", async () => {
    const error = new Error("Failed to fetch incidents");
    (listIncidents as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSecurityIncidents(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it("should refetch data when requested", async () => {
    (listIncidents as jest.Mock).mockResolvedValueOnce(mockIncidents);

    const { result } = renderHook(() => useSecurityIncidents(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Setup mock for refetch
    (listIncidents as jest.Mock).mockResolvedValueOnce([
      ...mockIncidents,
      {
        id: "4",
        status: "Open",
        dateCalled: new Date().toISOString(),
        location: { name: "Building D" },
        isAnonymous: false,
      },
    ]);

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Should have updated data
    expect(result.current.data).toHaveLength(3);
  });

  it("should accept and apply filter parameters", async () => {
    const params = {
      locationId: "loc123",
      status: "Open",
    };

    (listIncidents as jest.Mock).mockResolvedValueOnce(
      mockIncidents.filter((i) => i.status === "Open"),
    );

    renderHook(() => useSecurityIncidents(params), {
      wrapper,
    });

    expect(listIncidents).toHaveBeenCalledWith(params);
  });
});
