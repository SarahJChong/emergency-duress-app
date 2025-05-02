import { act, renderHook } from "@testing-library/react-native";

import { useAuth } from "../useAuth";
import * as IncidentQueries from "../useIncidentQueries";
import { useIncidentStatus } from "../useIncidentStatus";
import { useIsOffline } from "../useIsOffline";

jest.mock("../useIncidentQueries", () => ({
  useActiveIncidentQuery: jest.fn().mockReturnValue({ data: null }),
  useOpenPendingIncidentQuery: jest.fn().mockReturnValue({ data: null }),
}));

jest.mock("../useAuth", () => ({
  useAuth: jest.fn().mockReturnValue({ isSignedIn: true }),
}));

jest.mock("../useIsOffline", () => ({
  useIsOffline: jest.fn().mockReturnValue({ isOffline: false }),
}));

const useActiveIncidentQuery =
  IncidentQueries.useActiveIncidentQuery as jest.Mock;
const useOpenPendingIncidentQuery =
  IncidentQueries.useOpenPendingIncidentQuery as jest.Mock;

describe("useIncidentStatus Hook", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ isSignedIn: true });
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: false });
    useActiveIncidentQuery.mockReturnValue({ data: null });
    useOpenPendingIncidentQuery.mockReturnValue({ data: null });
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useIncidentStatus());

    expect(result.current).toEqual({
      inDuress: false,
      isAnonymous: false,
      setIsAnonymous: expect.any(Function),
    });
  });

  it("should handle online active incident", () => {
    useActiveIncidentQuery.mockReturnValue({
      data: { status: "Open", isAnonymous: true },
    });

    const { result } = renderHook(() => useIncidentStatus());

    expect(result.current.inDuress).toBe(true);
    // Wait for effect to update isAnonymous
    expect(result.current.isAnonymous).toBe(true);
  });

  it("should handle offline pending incident", () => {
    (useIsOffline as jest.Mock).mockReturnValue({ isOffline: true });
    useOpenPendingIncidentQuery.mockReturnValue({
      data: { isAnonymous: true },
    });

    const { result } = renderHook(() => useIncidentStatus());

    expect(result.current.inDuress).toBe(true);
    // Wait for effect to update isAnonymous
    expect(result.current.isAnonymous).toBe(true);
  });

  it("should allow manual toggle of anonymous state", () => {
    const { result } = renderHook(() => useIncidentStatus());

    act(() => {
      result.current.setIsAnonymous(true);
    });

    expect(result.current.isAnonymous).toBe(true);
  });
});
