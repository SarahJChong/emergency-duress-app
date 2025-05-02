import React from "react";
import { act, renderHook } from "@testing-library/react-native";

import { useStorageState } from "@/hooks/useStorageState";
import { getStorageItemAsync, setStorageItemAsync } from "@/lib/storage";

jest.mock("@/lib/storage");

describe("useStorageState Hook", () => {
  const mockStorageKey = "test-key";
  const mockStorageValue = { id: "test-value" };

  beforeEach(() => {
    jest.clearAllMocks();
    (getStorageItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it("should start with loading state", () => {
    const { result } = renderHook(() => useStorageState(mockStorageKey));
    const [[isLoading, value]] = result.current;

    expect(isLoading).toBe(true);
    expect(value).toBe(null);
  });

  it("should load value from storage", async () => {
    (getStorageItemAsync as jest.Mock).mockResolvedValue(mockStorageValue);

    const { result } = renderHook(() =>
      useStorageState<typeof mockStorageValue>(mockStorageKey),
    );

    // Initial loading state
    expect(result.current[0][0]).toBe(true);
    expect(result.current[0][1]).toBe(null);

    // Wait for storage value to load
    await act(async () => {
      await Promise.resolve();
    });

    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toEqual(mockStorageValue);
    expect(getStorageItemAsync).toHaveBeenCalledWith(mockStorageKey);
  });

  it("should update value in state and storage", async () => {
    (setStorageItemAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useStorageState<typeof mockStorageValue>(mockStorageKey),
    );

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    // Update value
    await act(async () => {
      const setValue = result.current[1];
      await setValue(mockStorageValue);
    });

    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toEqual(mockStorageValue);
    expect(setStorageItemAsync).toHaveBeenCalledWith(
      mockStorageKey,
      mockStorageValue,
    );
  });

  it("should handle setting null value", async () => {
    (setStorageItemAsync as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useStorageState<typeof mockStorageValue>(mockStorageKey),
    );

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    // Set null value
    await act(async () => {
      const setValue = result.current[1];
      await setValue(null);
    });

    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toBe(null);
    expect(setStorageItemAsync).toHaveBeenCalledWith(mockStorageKey, null);
  });

  it("should reload when key changes", async () => {
    const newKey = "new-key";
    const newValue = { id: "new-value" };

    // Setup mock for different keys
    (getStorageItemAsync as jest.Mock).mockImplementation((key) => {
      if (key === mockStorageKey) return Promise.resolve(mockStorageValue);
      if (key === newKey) return Promise.resolve(newValue);
      return Promise.resolve(null);
    });

    const { result, rerender } = renderHook(
      ({ storageKey }) => useStorageState<typeof mockStorageValue>(storageKey),
      {
        initialProps: { storageKey: mockStorageKey },
      },
    );

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    // Verify initial value
    expect(result.current[0][1]).toEqual(mockStorageValue);

    // Change key
    rerender({ storageKey: newKey });

    // Wait for reload
    await act(async () => {
      await Promise.resolve();
    });

    // Verify new value
    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toEqual(newValue);
    expect(getStorageItemAsync).toHaveBeenCalledWith(newKey);
  });

  it("should handle storage load error", async () => {
    const error = new Error("Storage error");
    (getStorageItemAsync as jest.Mock).mockRejectedValue(error);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useStorageState(mockStorageKey));

    // Wait for error to be caught
    await act(async () => {
      await Promise.resolve();
    });

    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toBe(null);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error loading from storage:",
      error,
    );

    mockConsoleError.mockRestore();
  });

  it("should handle storage save error", async () => {
    const error = new Error("Storage save error");
    (setStorageItemAsync as jest.Mock).mockRejectedValue(error);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useStorageState(mockStorageKey));

    await act(async () => {
      const setValue = result.current[1];
      await setValue(mockStorageValue);
    });

    const [[isLoading, value]] = result.current;
    expect(isLoading).toBe(false);
    expect(value).toBe(null);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error saving to storage:",
      error,
    );

    mockConsoleError.mockRestore();
  });

  it("should handle reducer with default action parameter", async () => {
    // Create a mock implementation of useReducer that captures the reducer function
    let capturedReducer: any;
    const mockDispatch = jest.fn();

    // Mock React's useReducer to capture the reducer function
    jest
      .spyOn(React, "useReducer")
      .mockImplementation((reducer, initialState) => {
        capturedReducer = reducer;
        return [initialState, mockDispatch];
      });

    // Render the hook to capture the reducer
    renderHook(() => useStorageState(mockStorageKey));

    // Verify the reducer was captured
    expect(capturedReducer).toBeDefined();

    // Test the reducer with undefined action (should use default null)
    const initialState: [boolean, any] = [true, "test-value"];
    const newState = capturedReducer(initialState, undefined);

    // Verify the reducer used the default parameter (null)
    expect(newState).toEqual([false, null]);

    // Restore the original implementation
    jest.restoreAllMocks();
  });
});
