import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import type { LocationInput } from "@/lib/api/locationApi";
import type { ApiLocation } from "@/lib/api/types";
import { useAuth } from "../useAuth";
import { useLocations } from "../useLocations";
import * as LocationsQueries from "../useLocationsQueries";

// Mock the hooks
jest.mock("../useAuth");
jest.mock("../useLocationsQueries", () => {
  const originalModule = jest.requireActual("../useLocationsQueries");
  return {
    __esModule: true,
    ...originalModule,
    useLocationsQuery: jest.fn(),
    useCreateLocation: jest.fn(),
    useUpdateLocation: jest.fn(),
    useDeleteLocation: jest.fn(),
    // Keep the original isLocationIncidentError function
    isLocationIncidentError: originalModule.isLocationIncidentError,
  };
});

const mockLocations: ApiLocation[] = [
  {
    id: "1",
    name: "Test Location 1",
    defaultPhoneNumber: "123",
    defaultEmail: "test1@test.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    hasIncidents: false,
    securityResponders: [],
  },
  {
    id: "2",
    name: "Test Location 2",
    defaultPhoneNumber: "456",
    defaultEmail: "test2@test.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    hasIncidents: true,
    securityResponders: [],
  },
];

describe("useLocations", () => {
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

  // Mock implementations
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();

    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: { roles: ["admin"] },
      isSignedIn: true,
    });

    // Mock useLocationsQuery
    (LocationsQueries.useLocationsQuery as jest.Mock).mockReturnValue({
      data: mockLocations,
      isLoading: false,
      error: null,
    });

    // Mock useCreateLocation
    (LocationsQueries.useCreateLocation as jest.Mock).mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false,
      createError: null,
    });

    // Mock useUpdateLocation
    (LocationsQueries.useUpdateLocation as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
      updateError: null,
    });

    // Mock useDeleteLocation
    (LocationsQueries.useDeleteLocation as jest.Mock).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
      deleteError: null,
    });
  });

  it("returns locations and isAdmin status for admin user", async () => {
    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => {
      expect(result.current.locations).toEqual(mockLocations);
    });
  });

  it("returns locations without admin access for non-admin user", async () => {
    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => {
      expect(result.current.locations).toEqual(mockLocations);
    });
  });

  it("successfully creates a new location", async () => {
    const newLocation: LocationInput = {
      name: "New Location",
      defaultPhoneNumber: "789",
      defaultEmail: "test3@test.com",
    };

    const createdLocation: ApiLocation = {
      id: "3",
      ...newLocation,
      createdAt: new Date(),
      updatedAt: new Date(),
      hasIncidents: false,
    };

    mockCreate.mockResolvedValueOnce(createdLocation);

    const { result } = renderHook(() => useLocations(), { wrapper });

    await result.current.create(newLocation);

    expect(mockCreate).toHaveBeenCalledWith(newLocation);
  });

  it("successfully updates a location", async () => {
    const updatedData: LocationInput = {
      name: "Updated Location",
      defaultPhoneNumber: "123",
      defaultEmail: "test1@test.com",
    };

    const updatedLocation: ApiLocation = {
      ...mockLocations[0],
      ...updatedData,
    };

    mockUpdate.mockResolvedValueOnce(updatedLocation);

    const { result } = renderHook(() => useLocations(), { wrapper });

    await result.current.update({
      id: "1",
      data: updatedData,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      id: "1",
      data: updatedData,
    });
  });

  it("successfully deletes a location", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLocations(), { wrapper });

    await result.current.delete("1");

    expect(mockDelete).toHaveBeenCalledWith("1");
  });

  it("handles location with incidents appropriately", async () => {
    (LocationsQueries.useLocationsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          ...mockLocations[0],
          hasIncidents: true,
        },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useLocations(), { wrapper });

    await waitFor(() => {
      const location = result.current.locations[0];
      expect(location?.hasIncidents).toBe(true);
    });
  });
});
