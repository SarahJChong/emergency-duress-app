// Now import modules after mocks are set up
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { getStorageItemAsync, setStorageItemAsync } from "../storage";

// Mock Platform before importing modules
jest.mock("react-native", () => ({
  Platform: {
    OS: "web", // Default to web, will be changed in tests
  },
}));

// Mock SecureStore before importing modules
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

// Setup localStorage mock
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Setup console.error mock
const mockConsoleError = jest.fn();
const originalConsoleError = global.console.error;

describe("storage", () => {
  const mockKey = "testKey";
  const mockValue = { test: "value" };
  const mockStringValue = JSON.stringify(mockValue);

  beforeAll(() => {
    // Setup global.localStorage
    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock console.error
    global.console.error = mockConsoleError;
  });

  afterAll(() => {
    // Restore console.error
    global.console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setStorageItemAsync", () => {
    describe("web platform", () => {
      beforeAll(() => {
        Platform.OS = "web";
      });

      it("should store value in localStorage", async () => {
        await setStorageItemAsync(mockKey, mockValue);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          mockKey,
          mockStringValue,
        );
      });

      it("should remove item when value is null", async () => {
        await setStorageItemAsync(mockKey, null);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(mockKey);
      });

      it("should handle localStorage errors", async () => {
        const error = new Error("Storage quota exceeded");
        mockLocalStorage.setItem.mockImplementationOnce(() => {
          throw error;
        });

        await setStorageItemAsync(mockKey, mockValue);

        expect(mockConsoleError).toHaveBeenCalledWith(
          "Local storage is unavailable:",
          error,
        );
      });
    });

    describe("native platform", () => {
      beforeAll(() => {
        Platform.OS = "ios";
      });

      afterAll(() => {
        // Reset to web for other tests
        Platform.OS = "web";
      });

      it("should store value using SecureStore", async () => {
        await setStorageItemAsync(mockKey, mockValue);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          mockKey,
          mockStringValue,
        );
      });

      it("should delete item when value is null", async () => {
        await setStorageItemAsync(mockKey, null);
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(mockKey);
      });
    });
  });

  describe("getStorageItemAsync", () => {
    describe("web platform", () => {
      beforeAll(() => {
        Platform.OS = "web";
      });

      it("should retrieve value from localStorage", async () => {
        mockLocalStorage.getItem.mockReturnValueOnce(mockStringValue);
        const result = await getStorageItemAsync(mockKey);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(mockKey);
        expect(result).toEqual(mockValue);
      });

      it("should return null when item doesn't exist", async () => {
        mockLocalStorage.getItem.mockReturnValueOnce(null);
        const result = await getStorageItemAsync(mockKey);
        expect(result).toBeNull();
      });

      it("should handle localStorage errors", async () => {
        const error = new Error("localStorage unavailable");
        mockLocalStorage.getItem.mockImplementationOnce(() => {
          throw error;
        });

        const result = await getStorageItemAsync(mockKey);

        expect(result).toBeNull();
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Local storage is unavailable:",
          error,
        );
      });

      it("should handle invalid JSON", async () => {
        mockLocalStorage.getItem.mockReturnValueOnce("invalid json");

        // Mock JSON.parse error
        const jsonError = new SyntaxError(
          "Unexpected token i in JSON at position 0",
        );
        const originalJSONParse = JSON.parse;
        JSON.parse = jest.fn().mockImplementationOnce(() => {
          throw jsonError;
        });

        const result = await getStorageItemAsync(mockKey);

        expect(result).toBeNull();
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Local storage is unavailable:",
          jsonError,
        );

        // Restore JSON.parse
        JSON.parse = originalJSONParse;
      });

      it("should handle undefined localStorage", async () => {
        // Temporarily remove localStorage
        const originalLocalStorage = global.localStorage;
        Object.defineProperty(global, "localStorage", {
          value: undefined,
          writable: true,
        });

        const result = await getStorageItemAsync(mockKey);

        // The function should return null when localStorage is undefined
        expect(result).toBeNull();

        // Restore localStorage for other tests
        Object.defineProperty(global, "localStorage", {
          value: originalLocalStorage,
          writable: true,
        });
      });
    });

    describe("native platform", () => {
      beforeAll(() => {
        Platform.OS = "ios";
      });

      afterAll(() => {
        // Reset to web for other tests
        Platform.OS = "web";
      });

      it("should retrieve value using SecureStore", async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
          mockStringValue,
        );
        const result = await getStorageItemAsync(mockKey);
        expect(result).toEqual(mockValue);
      });

      it("should return null when item doesn't exist", async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
        const result = await getStorageItemAsync(mockKey);
        expect(result).toBeNull();
      });

      it("should handle invalid JSON", async () => {
        // Return invalid JSON string that will cause a parse error
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
          "invalid json",
        );

        const result = await getStorageItemAsync(mockKey);

        // The function should handle the error and return null
        expect(result).toBeNull();
      });
    });
  });
});
