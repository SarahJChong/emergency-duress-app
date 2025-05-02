import * as ExpoNetwork from "expo-network";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import { useIsOffline } from "@/hooks/useIsOffline";
import { useMeQuery } from "@/hooks/useQueries";

// Mock dependencies
jest.mock("expo-network");
jest.mock("@/hooks/useAuth");
jest.mock("@/hooks/useQueries");

describe("useIsOffline Hook", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (ExpoNetwork.useNetworkState as jest.Mock).mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
    });
    (useMeQuery as jest.Mock).mockReturnValue({
      data: { id: "user-1" },
      isError: false,
      isPending: false,
    });
  });

  it("should report online when network is connected and user query succeeds", () => {
    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOfflineWithUser).toBe(false);
  });

  it("should report offline when network is not connected", () => {
    (ExpoNetwork.useNetworkState as jest.Mock).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOfflineWithUser).toBe(true);
  });

  it("should report offline when internet is not reachable", () => {
    (ExpoNetwork.useNetworkState as jest.Mock).mockReturnValue({
      isConnected: true,
      isInternetReachable: false,
    });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOfflineWithUser).toBe(true);
  });

  it("should report offline with user when signed in and has user data", () => {
    (ExpoNetwork.useNetworkState as jest.Mock).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    });
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useMeQuery as jest.Mock).mockReturnValue({
      data: { id: "user-1" },
      isError: false,
      isPending: false,
    });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOfflineWithUser).toBe(true);
  });

  it("should not report offline with user when not signed in", () => {
    (ExpoNetwork.useNetworkState as jest.Mock).mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    });
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: false });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOfflineWithUser).toBe(false);
  });

  it("should report offline when user query fails", () => {
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useMeQuery as jest.Mock).mockReturnValue({
      data: null,
      isError: true,
      isPending: false,
    });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOfflineWithUser).toBe(false);
  });

  it("should not report offline with user when user query returns null", () => {
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useMeQuery as jest.Mock).mockReturnValue({
      data: null,
      isError: false,
      isPending: false,
    });

    const { result } = renderHook(() => useIsOffline(), {
      wrapper,
    });

    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOfflineWithUser).toBe(false);
  });
});
