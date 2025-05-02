import { getAccessToken } from "@/hooks/useAuth";
import {
  cancelIncident,
  createIncident,
  fetchIncidentDetails,
  fetchUserIncidents,
  getActiveIncident,
  syncIncident,
} from "../api/incidentApi";

jest.mock("@/hooks/useAuth", () => ({
  getAccessToken: jest.fn(),
}));

jest.mock("@/utils/baseUrl", () => ({
  getBaseUrl: jest.fn().mockReturnValue("http://localhost:3000"),
}));

describe("incidentApi", () => {
  const mockAccessToken = "test-token";
  const mockHeaders = {
    Authorization: `Bearer ${mockAccessToken}`,
  };
  const mockPostHeaders = {
    ...mockHeaders,
    "Content-Type": "application/json",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
    global.fetch = jest.fn();
  });

  describe("getActiveIncident", () => {
    it("should fetch active incident successfully", async () => {
      const mockIncident = { id: "123", status: "Open" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIncident),
      });

      const result = await getActiveIncident();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/incident/active",
        { headers: mockHeaders },
      );
      expect(result).toEqual(mockIncident);
    });

    it("should return null for 404 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getActiveIncident();

      expect(result).toBeNull();
    });

    it("should throw error for non-404 failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getActiveIncident()).rejects.toThrow(
        "Failed to get active incident.",
      );
    });

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(getActiveIncident()).rejects.toThrow(
        "No access token available",
      );
    });
  });

  describe("createIncident", () => {
    const mockRequest = {
      locationId: "loc123",
      roomNumber: "A101",
      isAnonymous: false,
    };

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(createIncident(mockRequest)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should create incident successfully", async () => {
      const mockResponse = {
        id: "inc123",
        timestamp: "2025-02-28T05:55:00.000Z",
        status: "Open",
        isAnonymous: false,
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createIncident(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/incident",
        {
          method: "POST",
          headers: mockPostHeaders,
          body: JSON.stringify(mockRequest),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(createIncident(mockRequest)).rejects.toThrow(
        "Failed to create incident.",
      );
    });
  });

  describe("cancelIncident", () => {
    const mockReason = "Test cancellation";

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(cancelIncident(mockReason)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should cancel incident successfully", async () => {
      const mockResponse = {
        id: "inc123",
        status: "Cancelled",
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await cancelIncident(mockReason);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/incident/cancel",
        {
          method: "POST",
          headers: mockPostHeaders,
          body: JSON.stringify({ cancellationReason: mockReason }),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(cancelIncident(mockReason)).rejects.toThrow(
        "Failed to cancel incident.",
      );
    });
  });

  describe("fetchUserIncidents", () => {
    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(fetchUserIncidents()).rejects.toThrow(
        "No access token available",
      );
    });

    it("should fetch user incidents successfully", async () => {
      const mockIncidents = [{ id: "inc123", status: "Open" }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIncidents),
      });

      const result = await fetchUserIncidents();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/incident/user",
        { headers: mockHeaders },
      );
      expect(result).toEqual(mockIncidents);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchUserIncidents()).rejects.toThrow(
        "Failed to fetch incidents.",
      );
    });
  });

  describe("fetchIncidentDetails", () => {
    const mockId = "inc123";

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(fetchIncidentDetails(mockId)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should fetch incident details successfully", async () => {
      const mockIncident = { id: mockId, status: "Open" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIncident),
      });

      const result = await fetchIncidentDetails(mockId);

      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/incident/${mockId}`,
        { headers: mockHeaders },
      );
      expect(result).toEqual(mockIncident);
    });

    it("should return null for 404 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchIncidentDetails(mockId);

      expect(result).toBeNull();
    });

    it("should throw error for non-404 failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchIncidentDetails(mockId)).rejects.toThrow(
        "Failed to fetch incident details.",
      );
    });
  });

  describe("syncIncident", () => {
    const mockRequest = {
      locationId: "loc123",
      roomNumber: "A101",
      createdAt: "2025-02-28T05:55:00.000Z",
      isAnonymous: false,
    };

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(syncIncident(mockRequest)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should sync incident successfully", async () => {
      const mockResponse = {
        id: "inc123",
        status: "Open",
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await syncIncident(mockRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/incident/sync",
        {
          method: "POST",
          headers: mockPostHeaders,
          body: JSON.stringify(mockRequest),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(syncIncident(mockRequest)).rejects.toThrow(
        "Failed to sync incident.",
      );
    });
  });
});
