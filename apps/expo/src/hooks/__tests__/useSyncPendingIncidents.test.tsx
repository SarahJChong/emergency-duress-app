import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";
import { useSyncPendingIncidents } from "@/hooks/useSyncPendingIncidents";
import { syncIncident } from "@/lib/api";
import { syncPendingIncidents } from "@/lib/offlineIncidents";

jest.mock("@/lib/api");
jest.mock("@/lib/offlineIncidents");
jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useIsOffline");

describe("useSyncPendingIncidents Hook", () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockConsoleLog = jest
      .spyOn(globalThis.console, "log")
      .mockImplementation(() => undefined);
    mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation(() => undefined);

    // Default mock values
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: false });
    (syncPendingIncidents as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    queryClient.clear();
    jest.useRealTimers();
  });

  it("should sync pending incidents when online and signed in", async () => {
    const syncPromise = Promise.resolve();
    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    renderHook(() => useSyncPendingIncidents(), { wrapper });

    await act(async () => {
      jest.runAllTimers();
      await syncPromise;
    });

    expect(syncPendingIncidents).toHaveBeenCalledWith(syncIncident);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "Pending incidents synced successfully.",
    );
  }, 10000);

  it("should not sync when offline", () => {
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });

    renderHook(() => useSyncPendingIncidents(), { wrapper });

    expect(syncPendingIncidents).not.toHaveBeenCalled();
  });

  it("should not sync when not signed in", () => {
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: false });

    renderHook(() => useSyncPendingIncidents(), { wrapper });

    expect(syncPendingIncidents).not.toHaveBeenCalled();
  });

  it("should handle sync errors", async () => {
    const error = new Error("Sync error");
    const syncPromise = Promise.reject(error);
    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    renderHook(() => useSyncPendingIncidents(), { wrapper });

    await act(async () => {
      jest.runAllTimers();
      try {
        await syncPromise;
      } catch {
        // Expected rejection
      }
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error syncing pending incidents:",
      error,
    );
  }, 10000);

  it("should sync when coming back online", async () => {
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
    const syncPromise = Promise.resolve();
    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    const { rerender } = renderHook(() => useSyncPendingIncidents(), {
      wrapper,
    });

    act(() => {
      jest.runAllTimers();
    });
    expect(syncPendingIncidents).not.toHaveBeenCalled();

    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: false });
    rerender({ wrapper });

    await act(async () => {
      jest.runAllTimers();
      await syncPromise;
    });

    expect(syncPendingIncidents).toHaveBeenCalledWith(syncIncident);
  }, 10000);

  it("should sync when signing in", async () => {
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: false });
    const syncPromise = Promise.resolve();
    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    const { rerender } = renderHook(() => useSyncPendingIncidents(), {
      wrapper,
    });

    act(() => {
      jest.runAllTimers();
    });
    expect(syncPendingIncidents).not.toHaveBeenCalled();

    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    rerender({ wrapper });

    await act(async () => {
      jest.runAllTimers();
      await syncPromise;
    });

    expect(syncPendingIncidents).toHaveBeenCalledWith(syncIncident);
  }, 10000);

  it("should cleanup sync operation on unmount", async () => {
    const syncPromise = Promise.resolve();
    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    const { unmount } = renderHook(() => useSyncPendingIncidents(), {
      wrapper,
    });

    // Run initial effect
    act(() => {
      jest.runAllTimers();
    });

    // Clear any console calls from initial mount
    mockConsoleLog.mockClear();

    // Unmount before sync completes
    unmount();

    // Resolve pending sync
    await act(async () => {
      await syncPromise;
    });

    // Console log should not be called after unmount
    expect(mockConsoleLog).not.toHaveBeenCalled();
  }, 10000);

  it("should not log error when unmounted before error occurs", async () => {
    // Create a promise that will reject after a delay
    let rejectFn: () => void;
    const syncPromise = new Promise<void>((_, reject) => {
      rejectFn = reject;
    });

    (syncPendingIncidents as jest.Mock).mockReturnValue(syncPromise);

    const { unmount } = renderHook(() => useSyncPendingIncidents(), {
      wrapper,
    });

    // Run initial effect
    act(() => {
      jest.runAllTimers();
    });

    // Clear any console calls from initial mount
    mockConsoleError.mockClear();

    // Unmount before error occurs
    unmount();

    // Now reject the promise
    await act(async () => {
      rejectFn();
      try {
        await syncPromise;
      } catch {
        // Expected rejection
      }
    });

    // Console error should not be called after unmount
    expect(mockConsoleError).not.toHaveBeenCalled();
  }, 10000);
});
