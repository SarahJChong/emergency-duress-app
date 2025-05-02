import React from "react";
import * as AuthSession from "expo-auth-session";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { jwtDecode } from "jwt-decode";

import { getStorageItemAsync, setStorageItemAsync } from "@/lib/storage";
import {
  AuthProvider,
  getAccessToken,
  useAuth,
  useAuthError,
  useAuthIsLoading,
  useIsSignedIn,
  useOurAutoDiscovery,
  useSession,
  useUser,
} from "../useAuth";

// Mock dependencies
jest.mock("expo-auth-session");
jest.mock("jwt-decode");
jest.mock("@/lib/storage");
jest.mock("../useAuth", () => {
  const actualModule = jest.requireActual("../useAuth");
  return {
    ...actualModule,
    useOurAutoDiscovery: jest.fn(),
  };
});

// Mock data
const mockUser = {
  id: "user123",
  email: "test@example.com",
  emailVerified: true,
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
  roles: ["user"],
  updatedAt: new Date("2024-01-01"),
};

const mockJwtPayload = {
  sub: mockUser.id,
  email: mockUser.email,
  email_verified: mockUser.emailVerified,
  name: mockUser.name,
  picture: mockUser.picture,
  "emergency_app/roles": mockUser.roles,
  updated_at: mockUser.updatedAt.toISOString(),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  iat: Math.floor(Date.now() / 1000),
  sid: "session123",
};

const mockTokenResponse = {
  accessToken: "mock-access-token",
  idToken: "mock-id-token",
  refreshToken: "mock-refresh-token",
  issuedAt: Math.floor(Date.now() / 1000),
  expiresIn: 3600,
  scope: "openid profile email",
};

const mockDiscovery = {
  authorizationEndpoint: "https://example.com/auth",
  tokenEndpoint: "https://example.com/token",
};

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider clientId="test-client-id" endpoint="https://example.com">
    {children}
  </AuthProvider>
);

describe("AuthProvider", () => {
  // Additional test cases for token expiration
  describe("token expiration and session handling", () => {
    beforeEach(() => {
      (AuthSession.resolveDiscoveryAsync as jest.Mock).mockResolvedValue(
        mockDiscovery,
      );
      (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
      const mockAuthRequest = {
        promptAsync: jest.fn().mockResolvedValue({
          type: "success",
          params: { code: "mock-auth-code" },
        }),
        codeVerifier: "mock-code-verifier",
      };
      (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);
    });

    it("should handle missing expiration time in token", async () => {
      const tokenWithoutExp = {
        ...mockJwtPayload,
        exp: undefined,
      };
      (jwtDecode as jest.Mock).mockReturnValueOnce(tokenWithoutExp);
      (getStorageItemAsync as jest.Mock)
        .mockResolvedValueOnce("stored-id-token")
        .mockResolvedValueOnce("stored-access-token")
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).toBeTruthy();
      });
      expect(result.current.session?.expiresAt).toBeInstanceOf(Date);
    });

    it("should handle token without issuedAt time", async () => {
      const tokenWithoutIat = {
        ...mockJwtPayload,
        iat: undefined,
      };
      (jwtDecode as jest.Mock).mockReturnValueOnce(tokenWithoutIat);
      (getStorageItemAsync as jest.Mock)
        .mockResolvedValueOnce("stored-id-token")
        .mockResolvedValueOnce("stored-access-token")
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).toBeTruthy();
      });
      expect(result.current.session?.issuedAt).toBeInstanceOf(Date);
    });
  });

  // Additional test cases for error handling scenarios
  describe("error handling in session management", () => {
    it("should handle decoding error in loadSessionFromStorage", async () => {
      (jwtDecode as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid token format");
      });
      (getStorageItemAsync as jest.Mock)
        .mockResolvedValueOnce("invalid-id-token")
        .mockResolvedValueOnce("stored-access-token")
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe(
          "[ERROR] Loading Session: Invalid token format",
        );
      });
      expect(result.current.session).toBeNull();
    });

    it("should handle missing user data in token", async () => {
      const invalidUserToken = {
        sub: undefined,
        email: undefined,
        email_verified: undefined,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      (jwtDecode as jest.Mock).mockReturnValueOnce(invalidUserToken);
      (getStorageItemAsync as jest.Mock)
        .mockResolvedValueOnce("stored-id-token")
        .mockResolvedValueOnce("stored-access-token")
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session?.user).toBeDefined();
      });
      expect(result.current.session?.user.email).toBeUndefined();
      expect(result.current.session?.user.emailVerified).toBeFalsy();
    });

    it("should handle error in refreshSession discovery check", async () => {
      // Setup expired token
      const expiredJwtPayload = {
        ...mockJwtPayload,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };
      (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

      // Mock storage with expired tokens and refresh token
      (getStorageItemAsync as jest.Mock)
        .mockResolvedValueOnce("expired-id-token")
        .mockResolvedValueOnce("expired-access-token")
        .mockResolvedValueOnce("valid-refresh-token");

      // Ensure discovery is null
      (useOurAutoDiscovery as jest.Mock).mockReturnValue(null);

      // Mock refreshAsync to make sure it's not called
      const mockRefreshAsync = jest.fn();
      (AuthSession.refreshAsync as jest.Mock).mockImplementation(
        mockRefreshAsync,
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe(
          "[ERROR] Refresh Session: Refresh token or discovery document not available",
        );
      });
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (jwtDecode as jest.Mock).mockReturnValue(mockJwtPayload);

    // Mock discovery
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.resolveDiscoveryAsync as jest.Mock).mockResolvedValue(
      mockDiscovery,
    );

    // Mock redirect URI
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );

    // Mock auth request creation
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "success",
        params: { code: "mock-auth-code" },
      }),
      codeVerifier: "mock-code-verifier",
    };
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    // Mock token responses
    (AuthSession.exchangeCodeAsync as jest.Mock).mockResolvedValue(
      mockTokenResponse,
    );
    (AuthSession.refreshAsync as jest.Mock).mockResolvedValue(
      mockTokenResponse,
    );
  });

  it("should initialize with null session and not loading", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isSignedIn).toBe(false);
  });

  it("should load session from storage on mount", async () => {
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("stored-id-token")
      .mockResolvedValueOnce("stored-access-token")
      .mockResolvedValueOnce("stored-refresh-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
    });
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it("should handle sign out", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.isSignedIn).toBe(false);
    expect(setStorageItemAsync).toHaveBeenCalledWith("accessToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("idToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("refreshToken", null);
  });

  it("should handle sign in successfully", async () => {
    // Mock AuthSession methods
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "success",
        params: { code: "mock-auth-code" },
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Ensure discovery is properly mocked
    const mockDiscovery = {
      authorizationEndpoint: "https://example.com/auth",
      tokenEndpoint: "https://example.com/token",
    };
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);

    // Ensure redirectUrl is properly mocked
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );

    // Mock loadAsync to return the auth request
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    // Mock exchangeCodeAsync with complete token response
    (AuthSession.exchangeCodeAsync as jest.Mock).mockResolvedValue(
      mockTokenResponse,
    );

    // Mock JWT decode to return the expected payload
    (jwtDecode as jest.Mock).mockReturnValue(mockJwtPayload);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform sign in within act
    await act(async () => {
      await result.current.signIn();
    });

    // Wait for the session to be set
    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
    });

    expect(result.current.isSignedIn).toBe(true);
    expect(setStorageItemAsync).toHaveBeenCalledWith(
      "accessToken",
      mockTokenResponse.accessToken,
    );
    expect(setStorageItemAsync).toHaveBeenCalledWith(
      "idToken",
      mockTokenResponse.idToken,
    );
    expect(setStorageItemAsync).toHaveBeenCalledWith(
      "refreshToken",
      mockTokenResponse.refreshToken,
    );
  });

  it("should handle sign in error when auth request not ready", async () => {
    // Ensure discovery is available
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.resolveDiscoveryAsync as jest.Mock).mockResolvedValue(
      mockDiscovery,
    );

    // Mock auth request as null
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(null);

    // Mock redirect URI
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.error).toBe("[ERROR] SignIn: Auth request not ready");
  });

  it("should handle auth prompt error", async () => {
    const mockError = new Error("Authentication failed");

    // Create a complete mock auth request with failing promptAsync
    const mockAuthRequest = {
      promptAsync: jest.fn().mockRejectedValue(mockError),
      codeVerifier: "mock-code-verifier", // Add this to make it a complete request
    };

    // Ensure discovery is properly mocked
    const mockDiscovery = {
      authorizationEndpoint: "https://example.com/auth",
      tokenEndpoint: "https://example.com/token",
    };
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);

    // Ensure redirectUrl is properly mocked
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );

    // Override the default auth request mock
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform sign in within act
    await act(async () => {
      await result.current.signIn();
    });

    // Verify error handling
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBe("[ERROR] SignIn: Authentication failed");

    // Verify promptAsync was actually called
    expect(mockAuthRequest.promptAsync).toHaveBeenCalled();
  });

  describe("Individual hooks", () => {
    it("useIsSignedIn should return correct authentication status", () => {
      const { result } = renderHook(() => useIsSignedIn(), { wrapper });
      expect(result.current).toBe(false);
    });

    it("useAuthIsLoading should handle loading states", async () => {
      const { result } = renderHook(() => useAuthIsLoading(), { wrapper });

      // Initially true when loadSessionFromStorage is called
      expect(result.current).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it("useSession should return null initially", () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current).toBeNull();
    });

    it("useUser should return null when not authenticated", () => {
      const { result } = renderHook(() => useUser(), { wrapper });
      expect(result.current).toBeUndefined();
    });

    it("useAuthError should return null initially", () => {
      const { result } = renderHook(() => useAuthError(), { wrapper });
      expect(result.current).toBeNull();
    });
  });

  it("should handle refresh token flow", async () => {
    // Clear any previous mock data
    jest.clearAllMocks();

    // Setup a proper discovery mock that will be available immediately
    const mockDiscoveryDocument = {
      authorizationEndpoint: "https://example.com/auth",
      tokenEndpoint: "https://example.com/token",
    };
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscoveryDocument);
    (AuthSession.resolveDiscoveryAsync as jest.Mock).mockResolvedValue(
      mockDiscoveryDocument,
    );

    // Setup expired token with proper claims
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    };
    (jwtDecode as jest.Mock).mockReturnValue(expiredJwtPayload);

    // Mock storage to consistently return the same values
    (getStorageItemAsync as jest.Mock).mockImplementation((key) => {
      switch (key) {
        case "idToken":
          return Promise.resolve("expired-id-token");
        case "accessToken":
          return Promise.resolve("expired-access-token");
        case "refreshToken":
          return Promise.resolve("valid-refresh-token");
        default:
          return Promise.resolve(null);
      }
    });

    // Mock the refresh token response
    const mockRefreshResponse = {
      ...mockTokenResponse,
      accessToken: "new-access-token",
      idToken: "new-id-token",
      refreshToken: "new-refresh-token",
    };
    (AuthSession.refreshAsync as jest.Mock).mockResolvedValue(
      mockRefreshResponse,
    );

    // Render the hook
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for the initial expired session to be loaded
    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
    });

    expect(result.current.session?.refreshToken).toBe("new-refresh-token");

    // Wait for the refresh to be triggered and completed
    await waitFor(() => {
      expect(AuthSession.refreshAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: "valid-refresh-token",
          clientId: "test-client-id",
        }),
        mockDiscoveryDocument,
      );
    });

    // Verify the session was updated with the new tokens
    await waitFor(() => {
      expect(result.current.session?.accessToken).toBe("new-access-token");
    });

    expect(result.current.session?.idToken).toBe("new-id-token");
    expect(result.current.session?.refreshToken).toBe("new-refresh-token");
  });

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuthStore must be used within an AuthProvider");
  });

  it("should handle missing discovery document during sign in", async () => {
    // Override discovery document to be null
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "[ERROR] SignIn: Discovery document not available",
    );
  });

  it("should handle missing ID token in response", async () => {
    // Mock discovery and auth request setup
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "success",
        params: { code: "mock-auth-code" },
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Set up the required mocks
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    // Mock token response without ID token
    const mockTokenResponseWithoutIdToken = {
      ...mockTokenResponse,
      idToken: undefined,
    };
    (AuthSession.exchangeCodeAsync as jest.Mock).mockResolvedValue(
      mockTokenResponseWithoutIdToken,
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for auth setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Attempt sign in
    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe(
      "[ERROR] SignIn: No ID token found in the response",
    );
  });

  it("should sign out when token expires without refresh token", async () => {
    // Setup expired token
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };
    (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

    // Mock storage with expired tokens but without refresh token
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("expired-id-token")
      .mockResolvedValueOnce("expired-access-token")
      .mockResolvedValueOnce(null); // No refresh token

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.isSignedIn).toBe(false);
    });

    // Verify tokens were cleared from storage
    expect(setStorageItemAsync).toHaveBeenCalledWith("accessToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("idToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("refreshToken", null);
  });

  it("should handle missing ID token in refresh response", async () => {
    // Setup expired token
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

    // Mock storage with expired tokens and refresh token
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("expired-id-token")
      .mockResolvedValueOnce("expired-access-token")
      .mockResolvedValueOnce("valid-refresh-token");

    // Mock refresh response without ID token
    (AuthSession.refreshAsync as jest.Mock).mockResolvedValue({
      ...mockTokenResponse,
      idToken: undefined,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it("should handle refresh session failure", async () => {
    // Setup expired token
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

    // Mock storage with expired tokens and refresh token
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("expired-id-token")
      .mockResolvedValueOnce("expired-access-token")
      .mockResolvedValueOnce("valid-refresh-token");

    // Mock refresh token failure
    const refreshError = new Error("Failed to refresh token");
    (AuthSession.refreshAsync as jest.Mock).mockRejectedValue(refreshError);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    mockConsoleError.mockRestore();
  });

  it("should handle missing discovery during refresh session", async () => {
    // Setup expired token
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

    // Mock storage with expired tokens and refresh token
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("expired-id-token")
      .mockResolvedValueOnce("expired-access-token")
      .mockResolvedValueOnce("valid-refresh-token");

    // Override discovery to be null for this test
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(null);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(
        "[ERROR] Refresh Session: Refresh token or discovery document not available",
      );
    });

    mockConsoleError.mockRestore();
  });

  it("should handle custom auth response type", async () => {
    // Mock auth request with unknown response type
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "unknown",
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Ensure discovery is properly mocked
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);

    // Ensure redirectUrl is properly mocked
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );

    // Mock loadAsync to return the auth request
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear any previous errors
    await act(async () => {
      result.current.signOut();
    });

    // Perform sign in within act
    await act(async () => {
      await result.current.signIn();
    });

    // Unknown type should not set session
    expect(result.current.session).toBeNull();
  });

  it("should handle error in loadSessionFromStorage", async () => {
    // Mock getStorageItemAsync to throw an error
    const storageError = new Error("Storage error in loadSessionFromStorage");
    (getStorageItemAsync as jest.Mock).mockRejectedValueOnce(storageError);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(
        `[ERROR] Loading Session: ${storageError.message}`,
      );
    });

    mockConsoleError.mockRestore();
  });

  it("should handle error in signOut", async () => {
    // Mock setStorageItemAsync to throw an error
    const storageError = new Error("Storage error in signOut");
    (setStorageItemAsync as jest.Mock).mockRejectedValueOnce(storageError);

    const mockConsoleError = jest
      .spyOn(globalThis.console, "error")
      .mockImplementation();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.error).toBe(
      `[ERROR] SignOut: ${storageError.message}`,
    );

    mockConsoleError.mockRestore();
  });

  it("should handle custom redirectUri warning", async () => {
    // Mock console.warn
    const mockConsoleWarn = jest
      .spyOn(globalThis.console, "warn")
      .mockImplementation();

    // Mock auth request
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "success",
        params: { code: "mock-auth-code" },
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Set up the required mocks
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call signIn with custom redirectUri
    await act(async () => {
      await result.current.signIn("https://custom-redirect.com");
    });

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "Custom redirectUri is ignored when using pre-created auth request",
    );

    mockConsoleWarn.mockRestore();
  });

  it("should handle auth result error case", async () => {
    // Mock auth request with error result
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "error",
        error: new Error("Auth result error"),
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Set up the required mocks
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform sign in
    await act(async () => {
      await result.current.signIn();
    });

    expect(result.current.error).toBe("[ERROR] SignIn: Auth result error");
    expect(result.current.isLoading).toBe(false);
  });

  // Add new test for getAccessToken function
  it("should retrieve access token from storage", async () => {
    const mockStoredToken = "test-access-token";
    (getStorageItemAsync as jest.Mock).mockResolvedValueOnce(mockStoredToken);

    const token = await getAccessToken();
    expect(token).toBe(mockStoredToken);
    expect(getStorageItemAsync).toHaveBeenCalledWith("accessToken");
  });

  it("should handle null access token from storage", async () => {
    (getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);

    const token = await getAccessToken();
    expect(token).toBeNull();
    expect(getStorageItemAsync).toHaveBeenCalledWith("accessToken");
  });

  // Add test for refresh token not available during session load
  it("should handle missing refresh token during session load", async () => {
    // Setup expired token
    const expiredJwtPayload = {
      ...mockJwtPayload,
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    };
    (jwtDecode as jest.Mock).mockReturnValueOnce(expiredJwtPayload);

    // Mock storage with expired tokens but no refresh token
    (getStorageItemAsync as jest.Mock)
      .mockResolvedValueOnce("expired-id-token") // id token
      .mockResolvedValueOnce("expired-access-token") // access token
      .mockResolvedValueOnce(null); // no refresh token

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });

    expect(setStorageItemAsync).toHaveBeenCalledWith("accessToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("idToken", null);
    expect(setStorageItemAsync).toHaveBeenCalledWith("refreshToken", null);
  });

  it("should handle edge cases in session creation", async () => {
    // Mock a token response with minimal scopes and undefined values
    const minimalTokenResponse = {
      ...mockTokenResponse,
      scope: undefined,
      expiresIn: undefined,
    };

    // Mock auth request setup
    const mockAuthRequest = {
      promptAsync: jest.fn().mockResolvedValue({
        type: "success",
        params: { code: "mock-auth-code" },
      }),
      codeVerifier: "mock-code-verifier",
    };

    // Set up required mocks
    (useOurAutoDiscovery as jest.Mock).mockReturnValue(mockDiscovery);
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue(
      "https://example.com/sign-in",
    );
    (AuthSession.loadAsync as jest.Mock).mockResolvedValue(mockAuthRequest);
    (AuthSession.exchangeCodeAsync as jest.Mock).mockResolvedValue(
      minimalTokenResponse,
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial setup to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform sign in
    await act(async () => {
      await result.current.signIn();
    });

    // Verify session was created with default values
    await waitFor(() => {
      expect(result.current.session).toBeTruthy();
    });
    expect(result.current.session?.scopes).toEqual([]);
  });
});
