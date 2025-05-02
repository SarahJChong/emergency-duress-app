import { getAccessToken } from "@/hooks/useAuth";
import { fetchMe, registerUser, updateUser } from "../api/userApi";

jest.mock("@/hooks/useAuth", () => ({
  getAccessToken: jest.fn(),
}));

jest.mock("@/utils/baseUrl", () => ({
  getBaseUrl: jest.fn().mockReturnValue("http://localhost:3000"),
}));

describe("userApi", () => {
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

  describe("fetchMe", () => {
    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(fetchMe()).rejects.toThrow("No access token available");
    });

    it("should fetch user profile successfully", async () => {
      const mockUser = { id: "user123", name: "Test User" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await fetchMe();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/users/me",
        { headers: mockHeaders },
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null for 404 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchMe();

      expect(result).toBeNull();
    });

    it("should throw error for non-404 failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(fetchMe()).rejects.toThrow("Failed to fetch user.");
    });
  });

  describe("registerUser", () => {
    const mockDetails = {
      name: "Test User",
      contactNumber: "1234567890",
      locationId: "loc123",
    };

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(registerUser(mockDetails)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should register user successfully", async () => {
      const mockResponse = { ...mockDetails, id: "user123" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await registerUser(mockDetails);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/users/register",
        {
          method: "POST",
          headers: mockPostHeaders,
          body: JSON.stringify(mockDetails),
        },
      );
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(registerUser(mockDetails)).rejects.toThrow(
        "Failed to register.",
      );
    });
  });

  describe("updateUser", () => {
    const mockDetails = {
      name: "Updated User",
      contactNumber: "0987654321",
      locationId: "loc456",
    };

    it("should throw error when no access token", async () => {
      (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

      await expect(updateUser(mockDetails)).rejects.toThrow(
        "No access token available",
      );
    });

    it("should update user profile successfully", async () => {
      const mockResponse = { ...mockDetails, id: "user123" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await updateUser(mockDetails);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/users/me",
        {
          method: "PUT",
          headers: mockPostHeaders,
          body: JSON.stringify(mockDetails),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(updateUser(mockDetails)).rejects.toThrow(
        "Failed to update profile.",
      );
    });
  });
});
