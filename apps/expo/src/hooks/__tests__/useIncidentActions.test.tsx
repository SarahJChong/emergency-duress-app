import * as Location from "expo-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import { useIncidentActions } from "@/hooks/useIncidentActions";
import { useIsOffline } from "@/hooks/useIsOffline";
import { useMeQuery } from "@/hooks/useQueries";
import { cancelIncident, createIncident, syncIncident } from "@/lib/api";
import {
  cancelPendingIncident,
  storePendingIncident,
  syncPendingIncidents,
} from "@/lib/offlineIncidents";

// Mock dependencies
jest.mock("expo-location");
jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useIsOffline");
jest.mock("@/hooks/useQueries");
jest.mock("@/lib/api");
jest.mock("@/lib/offlineIncidents");

// Mock types
const mockLocation = {
  coords: {
    latitude: -31.9523,
    longitude: 115.8613,
  },
};

const mockUser = {
  name: "Test User",
  location: {
    id: "loc123",
    name: "Test Location",
  },
  roomNumber: "Room 123",
};

describe("useIncidentActions", () => {
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

  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();

    mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation(() => undefined);

    // Default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: false });
    (useMeQuery as jest.Mock).mockReturnValue({ data: mockUser });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "granted",
      },
    );
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(
      mockLocation,
    );
    (createIncident as jest.Mock).mockResolvedValue({ status: "Open" });
    (cancelIncident as jest.Mock).mockResolvedValue({ status: "Cancelled" });
    (syncPendingIncidents as jest.Mock).mockImplementation(() =>
      Promise.resolve(),
    );

    // Set up cached queries
    queryClient.setQueryData(["activeIncident"], { id: "incident-1" });
    queryClient.setQueryData(["userIncidents"], [{ id: "incident-1" }]);
    queryClient.setQueryData(["openPendingIncident"], null);
    queryClient.setQueryData(["pendingIncidents"], []);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe("raiseIncident", () => {
    it("should create an incident online with GPS coordinates", async () => {
      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      expect(result.current.isRaising).toBe(false);

      await result.current.raiseIncident();

      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      expect(createIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        roomNumber: mockUser.roomNumber,
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        isAnonymous: false,
      });
      expect(result.current.isRaising).toBe(false);
    });

    it("should create an incident online without GPS coordinates when location unavailable", async () => {
      (useMeQuery as jest.Mock).mockReturnValue({
        data: { ...mockUser, roomNumber: undefined },
      });
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(createIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        roomNumber: undefined,
        latitude: undefined,
        longitude: undefined,
        isAnonymous: false,
      });
    });

    // New test to cover line 67: when location is undefined
    it("should handle undefined user location", async () => {
      (useMeQuery as jest.Mock).mockReturnValue({
        data: { ...mockUser, location: undefined },
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(createIncident).toHaveBeenCalledWith({
        locationId: "",
        roomNumber: mockUser.roomNumber,
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        isAnonymous: false,
      });
    });

    it("should handle location permission denied", async () => {
      (
        Location.requestForegroundPermissionsAsync as jest.Mock
      ).mockResolvedValue({
        status: "denied",
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(createIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        roomNumber: mockUser.roomNumber,
        latitude: undefined,
        longitude: undefined,
        isAnonymous: false,
      });
    });

    it("should handle location error", async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error("Location error"),
      );

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error getting location:",
        expect.any(Error),
      );
      expect(createIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        roomNumber: mockUser.roomNumber,
        latitude: undefined,
        longitude: undefined,
        isAnonymous: false,
      });
    });

    it("should create pending incident when offline", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(storePendingIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        location: mockUser.location,
        roomNumber: mockUser.roomNumber,
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        name: mockUser.name,
        isAnonymous: false,
        status: "Open",
        createdAt: expect.any(String),
      });
    });

    it("should throw error when offline and user location not available", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      (useMeQuery as jest.Mock).mockReturnValue({
        data: { ...mockUser, location: undefined },
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await expect(result.current.raiseIncident()).rejects.toThrow(
        "User location not available",
      );
    });

    it("should create pending incident when offline with no roomNumber", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      (useMeQuery as jest.Mock).mockReturnValue({
        data: { ...mockUser, roomNumber: undefined },
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(storePendingIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        location: mockUser.location,
        roomNumber: undefined,
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        name: mockUser.name,
        isAnonymous: false,
        status: "Open",
        createdAt: expect.any(String),
      });
    });

    it("should create pending incident when offline with no name", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      (useMeQuery as jest.Mock).mockReturnValue({
        data: { ...mockUser, name: undefined },
      });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      expect(storePendingIncident).toHaveBeenCalledWith({
        locationId: mockUser.location.id,
        location: mockUser.location,
        roomNumber: mockUser.roomNumber,
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        name: undefined,
        isAnonymous: false,
        status: "Open",
        createdAt: expect.any(String),
      });
    });

    it("should trigger sync when coming back online", async () => {
      // Start offline
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      const { result, rerender } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      // Create incident while offline
      await result.current.raiseIncident();

      // Come back online
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: false });
      rerender({});

      // Trigger another action to run the sync
      await result.current.raiseIncident();

      expect(syncPendingIncidents).toHaveBeenCalledWith(syncIncident);
    });
  });

  describe("cancelIncident", () => {
    const cancelReason = "Test cancel reason";

    it("should cancel incident online", async () => {
      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      expect(result.current.isCancelling).toBe(false);

      await result.current.cancelIncident(cancelReason);

      expect(cancelIncident).toHaveBeenCalledWith(cancelReason);
      expect(result.current.isCancelling).toBe(false);
    });

    it("should cancel pending incident when offline", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      const mockPendingIncident = {
        createdAt: "2024-02-28T03:10:23.000Z",
      };
      queryClient.setQueryData(["openPendingIncident"], mockPendingIncident);

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.cancelIncident(cancelReason);

      expect(cancelPendingIncident).toHaveBeenCalledWith(
        mockPendingIncident.createdAt,
        cancelReason,
      );
    });

    it("should throw error when offline and no open incident", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
      queryClient.setQueryData(["openPendingIncident"], null);

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await expect(result.current.cancelIncident(cancelReason)).rejects.toThrow(
        "No open incident found",
      );
    });
  });

  describe("query invalidation", () => {
    it("should invalidate online queries after successful incident creation", async () => {
      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      // Mark queries as stale before checking invalidation
      queryClient.invalidateQueries({ queryKey: ["activeIncident"] });
      queryClient.invalidateQueries({ queryKey: ["userIncidents"] });

      expect(queryClient.getQueryState(["activeIncident"])?.isInvalidated).toBe(
        true,
      );
      expect(queryClient.getQueryState(["userIncidents"])?.isInvalidated).toBe(
        true,
      );
    });

    it("should invalidate offline queries after successful incident creation when offline", async () => {
      (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });

      const { result } = renderHook(() => useIncidentActions(), {
        wrapper,
      });

      await result.current.raiseIncident();

      // Mark queries as stale before checking invalidation
      queryClient.invalidateQueries({ queryKey: ["openPendingIncident"] });
      queryClient.invalidateQueries({ queryKey: ["pendingIncidents"] });

      expect(
        queryClient.getQueryState(["openPendingIncident"])?.isInvalidated,
      ).toBe(true);
      expect(
        queryClient.getQueryState(["pendingIncidents"])?.isInvalidated,
      ).toBe(true);
    });
  });
});
