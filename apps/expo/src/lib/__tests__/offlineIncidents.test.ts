import {
  cancelPendingIncident,
  getOpenPendingIncident,
  getPendingIncidents,
  removePendingIncident,
  storePendingIncident,
  syncPendingIncidents,
} from "../offlineIncidents";
import { getStorageItemAsync, setStorageItemAsync } from "../storage";

jest.mock("../storage", () => ({
  setStorageItemAsync: jest.fn(),
  getStorageItemAsync: jest.fn(),
}));

describe("offlineIncidents", () => {
  const mockIncident = {
    locationId: "123",
    roomNumber: "A101",
    latitude: 31.9523,
    longitude: 115.8613,
    isAnonymous: false,
    createdAt: "2025-02-26T06:41:00.000Z",
    status: "Open" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("storePendingIncident", () => {
    it("should store a new pending incident", async () => {
      (getStorageItemAsync as jest.Mock).mockResolvedValue([]);

      await storePendingIncident(mockIncident);

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        mockIncident,
      ]);
    });

    it("should append to existing pending incidents", async () => {
      const existingIncident = {
        ...mockIncident,
        createdAt: "2025-02-26T06:40:00.000Z",
      };
      (getStorageItemAsync as jest.Mock).mockResolvedValue([existingIncident]);

      await storePendingIncident(mockIncident);

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        existingIncident,
        mockIncident,
      ]);
    });

    it("should update existing incident with same createdAt", async () => {
      const existingIncident = {
        ...mockIncident,
        roomNumber: "B202",
      };
      const updatedIncident = {
        ...mockIncident,
        roomNumber: "C303",
      };
      (getStorageItemAsync as jest.Mock).mockResolvedValue([existingIncident]);

      await storePendingIncident(updatedIncident);

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        updatedIncident,
      ]);
    });

    it("should update only the matching incident when multiple incidents exist", async () => {
      const incident1 = { ...mockIncident, roomNumber: "A101" };
      const incident2 = {
        ...mockIncident,
        createdAt: "2025-02-26T06:42:00.000Z",
        roomNumber: "B202",
      };
      const incident3 = {
        ...mockIncident,
        createdAt: "2025-02-26T06:43:00.000Z",
        roomNumber: "C303",
      };

      const updatedIncident = { ...incident2, roomNumber: "D404" };

      (getStorageItemAsync as jest.Mock).mockResolvedValue([
        incident1,
        incident2,
        incident3,
      ]);

      await storePendingIncident(updatedIncident);

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        incident1,
        updatedIncident, // Only incident2 should be updated
        incident3,
      ]);
    });
  });

  describe("getPendingIncidents", () => {
    it("should return empty array when no incidents exist", async () => {
      (getStorageItemAsync as jest.Mock).mockResolvedValue(null);

      const result = await getPendingIncidents();

      expect(result).toEqual([]);
    });

    it("should return stored incidents", async () => {
      (getStorageItemAsync as jest.Mock).mockResolvedValue([mockIncident]);

      const result = await getPendingIncidents();

      expect(result).toEqual([mockIncident]);
    });
  });

  describe("getOpenPendingIncident", () => {
    it("should return null when no incidents exist", async () => {
      (getStorageItemAsync as jest.Mock).mockResolvedValue([]);

      const result = await getOpenPendingIncident();

      expect(result).toBeNull();
    });

    it("should return the open incident when one exists", async () => {
      const cancelledIncident = {
        ...mockIncident,
        status: "Cancelled" as const,
        createdAt: "2025-02-26T06:40:00.000Z",
      };
      (getStorageItemAsync as jest.Mock).mockResolvedValue([
        cancelledIncident,
        mockIncident,
      ]);

      const result = await getOpenPendingIncident();

      expect(result).toEqual(mockIncident);
    });

    it("should return null when no open incidents exist", async () => {
      const cancelledIncident = {
        ...mockIncident,
        status: "Cancelled" as const,
      };
      (getStorageItemAsync as jest.Mock).mockResolvedValue([cancelledIncident]);

      const result = await getOpenPendingIncident();

      expect(result).toBeNull();
    });
  });

  describe("removePendingIncident", () => {
    it("should remove specified incident", async () => {
      const incident2 = {
        ...mockIncident,
        createdAt: "2025-02-26T06:42:00.000Z",
      };
      (getStorageItemAsync as jest.Mock).mockResolvedValue([
        mockIncident,
        incident2,
      ]);

      await removePendingIncident(mockIncident.createdAt);

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        incident2,
      ]);
    });
  });

  describe("syncPendingIncidents", () => {
    it("should sync open incidents", async () => {
      const syncFn = jest.fn().mockResolvedValue({ status: "Open" });
      (getStorageItemAsync as jest.Mock).mockResolvedValue([mockIncident]);

      await syncPendingIncidents(syncFn);

      expect(syncFn).toHaveBeenCalledWith({
        locationId: mockIncident.locationId,
        roomNumber: mockIncident.roomNumber,
        latitude: mockIncident.latitude,
        longitude: mockIncident.longitude,
        isAnonymous: mockIncident.isAnonymous,
        createdAt: mockIncident.createdAt,
        cancellationReason: undefined,
      });
      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", []);
    });

    it("should keep failed incidents for retry", async () => {
      const syncFn = jest.fn().mockRejectedValue(new Error("API Error"));
      (getStorageItemAsync as jest.Mock).mockResolvedValue([mockIncident]);

      await syncPendingIncidents(syncFn);

      expect(syncFn).toHaveBeenCalledWith({
        locationId: mockIncident.locationId,
        roomNumber: mockIncident.roomNumber,
        latitude: mockIncident.latitude,
        longitude: mockIncident.longitude,
        isAnonymous: mockIncident.isAnonymous,
        createdAt: mockIncident.createdAt,
        cancellationReason: undefined,
      });
      expect(setStorageItemAsync).not.toHaveBeenCalled();
    });

    it("should sync cancelled incidents", async () => {
      const cancelledIncident = {
        ...mockIncident,
        status: "Cancelled" as const,
        cancellationReason: "Test reason",
        cancelledAt: "2025-02-26T06:42:00.000Z",
      };
      const syncFn = jest.fn().mockResolvedValue({ status: "Cancelled" });
      (getStorageItemAsync as jest.Mock).mockResolvedValue([cancelledIncident]);

      await syncPendingIncidents(syncFn);

      expect(syncFn).toHaveBeenCalledWith({
        locationId: cancelledIncident.locationId,
        roomNumber: cancelledIncident.roomNumber,
        latitude: cancelledIncident.latitude,
        longitude: cancelledIncident.longitude,
        isAnonymous: cancelledIncident.isAnonymous,
        createdAt: cancelledIncident.createdAt,
        cancellationReason: "Test reason",
      });
      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", []);
    });
  });

  describe("cancelPendingIncident", () => {
    it("should update incident status to Cancelled", async () => {
      (getStorageItemAsync as jest.Mock).mockResolvedValue([mockIncident]);

      await cancelPendingIncident(mockIncident.createdAt, "Test cancellation");

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        {
          ...mockIncident,
          status: "Cancelled",
          cancellationReason: "Test cancellation",
          cancelledAt: expect.any(String),
        },
      ]);
    });

    it("should not create duplicate when incident is already cancelled", async () => {
      const cancelledIncident = {
        ...mockIncident,
        status: "Cancelled" as const,
        cancellationReason: "Already cancelled",
        cancelledAt: "2025-02-26T06:42:00.000Z",
      };

      (getStorageItemAsync as jest.Mock).mockResolvedValue([cancelledIncident]);

      await cancelPendingIncident(cancelledIncident.createdAt, "New reason");

      expect(setStorageItemAsync).not.toHaveBeenCalled();
    });

    it("should only update the matching incident", async () => {
      const incident2 = {
        ...mockIncident,
        createdAt: "2025-02-26T06:42:00.000Z",
      };

      (getStorageItemAsync as jest.Mock).mockResolvedValue([
        mockIncident,
        incident2,
      ]);

      await cancelPendingIncident(mockIncident.createdAt, "Test cancellation");

      expect(setStorageItemAsync).toHaveBeenCalledWith("pendingIncidents", [
        {
          ...mockIncident,
          status: "Cancelled",
          cancellationReason: "Test cancellation",
          cancelledAt: expect.any(String),
        },
        incident2,
      ]);
    });
  });
});
