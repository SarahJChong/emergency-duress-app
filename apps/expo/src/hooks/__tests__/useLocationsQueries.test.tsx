import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import {
  createLocation,
  deleteLocation,
  fetchLocations,
  updateLocation,
} from "@/lib/api/locationApi";
import {
  useCreateLocation,
  useDeleteLocation,
  useLocationsQuery,
  useUpdateLocation,
} from "../useLocationsQueries";

// Mock dependencies
jest.mock("@/lib/api/locationApi");
jest.mock("../useAuth");

describe("useLocationsQueries", () => {
  const mockQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={mockQueryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockLocations = [
    { id: "1", name: "Location 1" },
    { id: "2", name: "Location 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockQueryClient.clear();
  });

  describe("useLocationsQuery", () => {
    it("should fetch locations successfully", async () => {
      (fetchLocations as jest.Mock).mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useLocationsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLocations);
    });

    it("should handle fetch error", async () => {
      const error = new Error("Failed to fetch");
      (fetchLocations as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useLocationsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe("useCreateLocation", () => {
    const newLocation = {
      name: "New Location",
      defaultPhoneNumber: "123456789",
      defaultEmail: "test@example.com",
    };

    it("should create location successfully", async () => {
      const createdLocation = { ...newLocation, id: "3" };
      (createLocation as jest.Mock).mockResolvedValue(createdLocation);

      const { result } = renderHook(() => useCreateLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      const response = await result.current.mutateAsync(newLocation);

      expect(response).toEqual(createdLocation);
      expect(createLocation).toHaveBeenCalledWith(newLocation);
      expect(result.current.error).toBeNull();
      expect(result.current.isPending).toBe(false);
    });

    it("should handle creation error", async () => {
      const error = new Error("Creation failed");
      (createLocation as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      await expect(result.current.mutateAsync(newLocation)).rejects.toThrow(
        error,
      );
    });
  });

  describe("useUpdateLocation", () => {
    const locationId = "1";
    const updatedData = {
      name: "Updated Location",
      defaultPhoneNumber: "987654321",
      defaultEmail: "updated@example.com",
    };

    it("should update location successfully", async () => {
      const updatedLocation = { ...updatedData, id: locationId };
      (updateLocation as jest.Mock).mockResolvedValue(updatedLocation);

      const { result } = renderHook(() => useUpdateLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      await result.current.mutateAsync({
        id: locationId,
        data: updatedData,
      });

      expect(updateLocation).toHaveBeenCalledWith(locationId, updatedData);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle update error", async () => {
      const error = new Error("Update failed");
      (updateLocation as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      await expect(
        result.current.mutateAsync({ id: locationId, data: updatedData }),
      ).rejects.toThrow(error);
    });
  });

  describe("useDeleteLocation", () => {
    const locationId = "1";

    it("should delete location successfully", async () => {
      (deleteLocation as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      await result.current.mutateAsync(locationId);

      expect(deleteLocation).toHaveBeenCalledWith(locationId);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle deletion error", async () => {
      const error = new Error("Deletion failed");
      (deleteLocation as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteLocation(), { wrapper });

      expect(result.current.isPending).toBe(false);

      await expect(result.current.mutateAsync(locationId)).rejects.toThrow(
        error,
      );
    });
  });
});
