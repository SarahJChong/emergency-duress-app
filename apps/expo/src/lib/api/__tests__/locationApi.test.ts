import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";
import {
  createLocation,
  deleteLocation,
  fetchLocations,
  isLocationApiError,
  isLocationIncidentError,
  LocationApiError,
  LocationIncidentError,
  updateLocation,
} from "../locationApi";

// Mock the dependencies
jest.mock("@/utils/baseUrl");
jest.mock("@/hooks/useAuth");

describe("locationApi", () => {
  // Mock implementations
  const mockGetBaseUrl = getBaseUrl as jest.Mock;
  const mockGetAccessToken = getAccessToken as jest.Mock;
  const baseUrl = "http://test-api";
  const accessToken = "test-token";

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockGetBaseUrl.mockReturnValue(baseUrl);
    mockGetAccessToken.mockResolvedValue(accessToken);
    global.fetch = jest.fn();
  });

  describe("fetchLocations", () => {
    it("should fetch locations successfully", async () => {
      const mockLocations = [{ id: "1", name: "Test Location" }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      });

      const result = await fetchLocations();

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/locations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      expect(result).toEqual(mockLocations);
    });

    it("should throw error when no access token", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(fetchLocations()).rejects.toThrow(
        "No access token available",
      );
    });

    it("should throw error when fetch fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchLocations()).rejects.toThrow(
        "Failed to fetch locations.",
      );
    });
  });

  describe("createLocation", () => {
    const newLocation = {
      name: "New Location",
      defaultPhoneNumber: "123456789",
      defaultEmail: "test@example.com",
    };

    it("should create location successfully", async () => {
      const mockCreatedLocation = { ...newLocation, id: "1" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreatedLocation),
      });

      const result = await createLocation(newLocation);

      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/api/locations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLocation),
      });
      expect(result).toEqual(mockCreatedLocation);
    });

    it("should throw error when no access token", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(createLocation(newLocation)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should throw LocationApiError when creation fails", async () => {
      const errorMessage = "Failed to create location";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      });

      await expect(createLocation(newLocation)).rejects.toThrow(
        new LocationApiError(errorMessage),
      );
    });

    it("should use fallback error message when API response has no message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(createLocation(newLocation)).rejects.toThrow(
        new LocationApiError("Failed to create location"),
      );
    });
  });

  describe("updateLocation", () => {
    const locationId = "1";
    const updatedLocation = {
      name: "Updated Location",
      defaultPhoneNumber: "987654321",
      defaultEmail: "updated@example.com",
    };

    it("should update location successfully", async () => {
      const mockUpdatedLocation = { ...updatedLocation, id: locationId };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpdatedLocation),
      });

      const result = await updateLocation(locationId, updatedLocation);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/locations/${locationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedLocation),
        },
      );
      expect(result).toEqual(mockUpdatedLocation);
    });

    it("should throw error when no access token", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(updateLocation(locationId, updatedLocation)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should throw LocationIncidentError when location has incidents", async () => {
      const errorMessage = "Location has associated incidents";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      });

      await expect(updateLocation(locationId, updatedLocation)).rejects.toThrow(
        new LocationIncidentError(errorMessage),
      );
    });

    it("should throw LocationApiError for other errors", async () => {
      const errorMessage = "Failed to update location";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      });

      await expect(updateLocation(locationId, updatedLocation)).rejects.toThrow(
        new LocationApiError(errorMessage),
      );
    });

    it("should use fallback error message when API response has no message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(updateLocation(locationId, updatedLocation)).rejects.toThrow(
        new LocationApiError("Failed to update location"),
      );
    });
  });

  describe("deleteLocation", () => {
    const locationId = "1";

    it("should delete location successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await deleteLocation(locationId);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/locations/${locationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    });

    it("should throw error when no access token", async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(deleteLocation(locationId)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should throw LocationIncidentError when location has incidents", async () => {
      const errorMessage = "Location has associated incidents";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      });

      await expect(deleteLocation(locationId)).rejects.toThrow(
        new LocationIncidentError(errorMessage),
      );
    });

    it("should throw LocationApiError for other errors", async () => {
      const errorMessage = "Failed to delete location";
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      });

      await expect(deleteLocation(locationId)).rejects.toThrow(
        new LocationApiError(errorMessage),
      );
    });

    it("should use fallback error message when API response has no message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(deleteLocation(locationId)).rejects.toThrow(
        new LocationApiError("Failed to delete location"),
      );
    });
  });

  describe("error type guards", () => {
    describe("isLocationIncidentError", () => {
      it("should return true for LocationIncidentError", () => {
        const error = new LocationIncidentError("test error");
        expect(isLocationIncidentError(error)).toBe(true);
      });

      it("should return false for other errors", () => {
        const error = new Error("test error");
        expect(isLocationIncidentError(error)).toBe(false);
      });
    });

    describe("isLocationApiError", () => {
      it("should return true for LocationApiError", () => {
        const error = new LocationApiError("test error");
        expect(isLocationApiError(error)).toBe(true);
      });

      it("should return false for other errors", () => {
        const error = new Error("test error");
        expect(isLocationApiError(error)).toBe(false);
      });

      it("should return true for LocationIncidentError as it extends LocationApiError", () => {
        const error = new LocationIncidentError("test error");
        expect(isLocationApiError(error)).toBe(true);
      });
    });
  });
});
