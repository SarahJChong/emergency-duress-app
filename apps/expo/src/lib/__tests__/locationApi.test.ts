import { getAccessToken } from "@/hooks/useAuth";
import { fetchLocations } from "../api/locationApi";

jest.mock("@/hooks/useAuth", () => ({
  getAccessToken: jest.fn(),
}));

jest.mock("@/utils/baseUrl", () => ({
  getBaseUrl: jest.fn().mockReturnValue("http://localhost:3000"),
}));

describe("locationApi", () => {
  const mockAccessToken = "test-token";
  const mockHeaders = {
    Authorization: `Bearer ${mockAccessToken}`,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockResolvedValue(mockAccessToken);
    global.fetch = jest.fn();
  });

  describe("fetchLocations", () => {
    it("should fetch locations successfully", async () => {
      const mockLocations = [{ id: "loc123", name: "Test Location" }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLocations),
      });

      const result = await fetchLocations();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/locations",
        { headers: mockHeaders },
      );
      expect(result).toEqual(mockLocations);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchLocations()).rejects.toThrow(
        "Failed to fetch locations.",
      );
    });

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(fetchLocations()).rejects.toThrow(
        "No access token available",
      );
    });
  });
});
