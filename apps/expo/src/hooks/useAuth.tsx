import React, { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import { JwtPayload as DefaultPayload, jwtDecode } from "jwt-decode";
import { createStore, useStore } from "zustand";

import { getBaseUrl } from "@/utils/baseUrl";
import { getStorageItemAsync, setStorageItemAsync } from "@/lib/storage";

const AuthStorage = {
  // ACCESS TOKEN
  storeAccessToken: async (token: string) =>
    setStorageItemAsync("accessToken", token),
  getAccessToken: async () =>
    getStorageItemAsync("accessToken") as Promise<string>,
  deleteAccessToken: async () => setStorageItemAsync("accessToken", null),

  // ID TOKEN
  storeIdToken: async (token: string) => setStorageItemAsync("idToken", token),
  getIdToken: async () => getStorageItemAsync("idToken") as Promise<string>,
  deleteIdToken: async () => setStorageItemAsync("idToken", null),

  // REFRESH TOKEN
  storeRefreshToken: async (token: string) =>
    setStorageItemAsync("refreshToken", token),
  getRefreshToken: async () =>
    getStorageItemAsync("refreshToken") as Promise<string>,
  deleteRefreshToken: async () => setStorageItemAsync("refreshToken", null),
};

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  roles: string[];
  updatedAt: Date;
}

export interface Session {
  id?: string;
  user: User;
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  issuedAt: Date;
  expiresAt: Date;
  scopes: string[];
}
export interface AuthProps {
  clientId: string;
  endpoint: string;
  additionalScopes?: string[];
}

interface AuthState extends AuthProps {
  session: Session | null;
  scopes: string[];
  isLoading: boolean;
  discovery: AuthSession.DiscoveryDocument | null;
  authError: string | null;
  authRequest: AuthSession.AuthRequest | null;
  redirectUrl: string | null;
  actions: {
    signIn: (redirectUri?: string) => void;
    signOut: () => void;
  };
  __internalActions: {
    loadSessionFromStorage: () => void;
    refreshSession: () => void;
  };
}

interface CustomRolePayload {
  "emergency_app/roles": string[];
}

interface JWTPayload extends DefaultPayload, CustomRolePayload {
  email: string;
  email_verified: boolean;
  name: string | null;
  nickname: string | null;
  picture: string | null;
  updated_at: string;
  sub: string; // user id
  sid: string; // session id
}

const DEFAULT_SCOPES = ["profile", "openid", "email", "offline_access"];

const createAuthStore = (props: AuthProps) =>
  createStore<AuthState>()((set, get) => ({
    ...props,
    scopes: Array.from(
      new Set([...DEFAULT_SCOPES, ...(props.additionalScopes || [])]),
    ),
    session: null,
    isLoading: true,
    clientId: props.clientId,
    endpoint: props.endpoint,
    discovery: null,
    authError: null,
    authRequest: null,
    redirectUrl: null,
    __internalActions: {
      loadSessionFromStorage: async () => {
        try {
          set({ isLoading: true });
          // Load tokens from storage
          const [storedIdToken, storedAccessToken, storedRefreshToken] =
            await Promise.all([
              AuthStorage.getIdToken(),
              AuthStorage.getAccessToken(),
              AuthStorage.getRefreshToken(),
            ]);

          // If no tokens are found, do nothing
          if (!storedIdToken || !storedAccessToken) return;

          // Decode the ID token to get user info
          const payload = jwtDecode<JWTPayload>(storedIdToken);

          const expirationTime = payload.exp ? payload.exp * 1000 : null;

          // costruct the user object
          const user: User = {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            name: payload.name || payload.nickname,
            picture: payload.picture,
            roles: payload["emergency_app/roles"],
            updatedAt: new Date(payload.updated_at),
          };

          // build the session object
          set({
            session: {
              id: payload.sid,
              user,
              accessToken: storedAccessToken,
              idToken: storedIdToken,
              refreshToken: storedRefreshToken || undefined,
              issuedAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
              expiresAt: expirationTime ? new Date(expirationTime) : new Date(),
              scopes: get().scopes,
            },
          });

          // check expiration from the token's `exp` claim
          if (expirationTime && expirationTime < Date.now()) {
            if (storedRefreshToken) {
              // if expired and we have a refresh token, try refreshing
              await get().__internalActions.refreshSession();
            } else {
              // if expired and no refresh token, sign out
              await get().actions.signOut();
            }
            return;
          }
        } catch (error: any) {
          set({
            authError: `[ERROR] Loading Session: ${error.message || "an error occurred"}`,
          });
        } finally {
          set({ isLoading: false });
        }
      },
      refreshSession: async () => {
        try {
          // get values from state
          const { session, clientId, discovery, scopes } = get();

          if (!session?.refreshToken || !discovery) {
            throw new Error(
              "Refresh token or discovery document not available",
            );
          }

          // refresh the session
          const tokenResponse = await AuthSession.refreshAsync(
            {
              refreshToken: session.refreshToken,
              clientId,
              scopes,
              extraParams: {
                audience: `${getBaseUrl()}/`,
              },
            },
            discovery,
          );

          // if not id token found, throw an error
          if (!tokenResponse.idToken) {
            throw new Error("No ID token found in the refresh response");
          }

          // decode the ID token to get user info
          let payload = jwtDecode<JWTPayload>(tokenResponse.idToken);

          // construct the user object
          const user: User = {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            name: payload.name || payload.nickname,
            picture: payload.picture,
            roles: payload["emergency_app/roles"],
            updatedAt: new Date(payload.updated_at),
          };

          // update session state
          set({
            session: {
              id: payload.sid,
              user,
              accessToken: tokenResponse.accessToken,
              idToken: tokenResponse.idToken,
              refreshToken: tokenResponse.refreshToken || session.refreshToken,
              issuedAt: new Date(tokenResponse.issuedAt * 1000),
              expiresAt: new Date(
                (tokenResponse.issuedAt + (tokenResponse.expiresIn ?? 0)) *
                  1000,
              ),
              scopes: tokenResponse.scope?.split(" ") ?? [],
            },
          });

          // update storage
          await AuthStorage.storeAccessToken(tokenResponse.accessToken);
          await AuthStorage.storeIdToken(tokenResponse.idToken);
          if (tokenResponse.refreshToken) {
            await AuthStorage.storeRefreshToken(tokenResponse.refreshToken);
          }
        } catch (error: any) {
          const errorMsg = error.message || "an error occurred";
          const errorString = `[ERROR] Refresh Session: ${errorMsg}`;
          set({
            authError: errorString,
          });
          console.error(errorString);
        }
      },
    },
    actions: {
      signOut: async () => {
        try {
          set({ session: null, isLoading: false });
          await AuthStorage.deleteAccessToken();
          await AuthStorage.deleteIdToken();
          await AuthStorage.deleteRefreshToken();
        } catch (error: any) {
          const errorMsg = error.message || "an error occurred";
          const errorString = `[ERROR] SignOut: ${errorMsg}`;
          set({
            authError: errorString,
          });
          console.error(errorString);
        }
      },
      signIn: async (redirectUri) => {
        try {
          set({ isLoading: true });

          const { discovery, authRequest, redirectUrl } = get();

          if (discovery === null) {
            throw new Error("Discovery document not available");
          }

          if (!authRequest || !redirectUrl) {
            throw new Error("Auth request not ready");
          }

          if (redirectUri) {
            console.warn(
              "Custom redirectUri is ignored when using pre-created auth request",
            );
          }

          // Prompt the user to sign in immediately without any setup delay
          const result = await authRequest.promptAsync(discovery);

          // handle the result
          switch (result.type) {
            case "error":
              set({
                authError: `[ERROR] SignIn: ${result.error?.message || "an error occured"}`,
                isLoading: false,
              });
              console.error(
                `[ERROR] SignIn: ${result.error?.message || "an error occured"}`,
              );
              break;
            case "success":
              // extract the code from the result
              const code = result.params.code;

              // create an access token request
              const accessToken = new AuthSession.AccessTokenRequest({
                code,
                clientId: get().clientId,
                redirectUri: redirectUrl,
                scopes: get().scopes,
                extraParams: {
                  code_verifier: authRequest.codeVerifier ?? "",
                },
              });

              // exchange the code for an access token
              const tokenResponse = await AuthSession.exchangeCodeAsync(
                accessToken,
                discovery,
              );
              if (!tokenResponse.idToken) {
                throw new Error("No ID token found in the response");
              }

              // decode the ID token to get user info
              let payload = jwtDecode<JWTPayload>(tokenResponse.idToken);

              // construct the user object
              const user: User = {
                id: payload.sub,
                email: payload.email,
                emailVerified: payload.email_verified,
                name: payload.name || payload.nickname,
                picture: payload.picture,
                roles: payload["emergency_app/roles"],
                updatedAt: new Date(payload.updated_at),
              };

              // build the session object
              set({
                session: {
                  id: payload.sid,
                  user,
                  accessToken: tokenResponse.accessToken,
                  idToken: tokenResponse.idToken,
                  refreshToken: tokenResponse.refreshToken,
                  issuedAt: new Date(tokenResponse.issuedAt * 1000),
                  expiresAt: new Date(
                    (tokenResponse.issuedAt + (tokenResponse.expiresIn ?? 0)) *
                      1000,
                  ),
                  scopes: tokenResponse.scope?.split(" ") ?? [],
                },
              });

              // store the tokens in storage
              await AuthStorage.storeAccessToken(tokenResponse.accessToken);
              await AuthStorage.storeIdToken(tokenResponse.idToken);
              if (tokenResponse.refreshToken)
                await AuthStorage.storeRefreshToken(tokenResponse.refreshToken);

              break;
            default:
              break;
          }
        } catch (error: any) {
          const errorMsg = error.message || "an error occurred";
          const errorString = `[ERROR] SignIn: ${errorMsg}`;
          set({
            authError: errorString,
          });
          console.error(errorString);
        } finally {
          set({ isLoading: false });
        }
      },
    },
  }));

const AuthContext = React.createContext<AuthStore | null>(null);

type AuthStore = ReturnType<typeof createAuthStore>;

type AuthProviderProps = React.PropsWithChildren<AuthProps>;

/**
 * Modified from [`expo-auth-session`](https://github.com/expo/expo/blob/main/packages/expo-auth-session/src/AuthRequestHooks.ts)
 * MODIFIED TO CATCH ERRORS, waiting for PR to be merged
 *
 *
 * Given an OpenID Connect issuer URL, this will fetch and return the [`DiscoveryDocument`](#discoverydocument)
 * (a collection of URLs) from the resource provider.
 *
 * @param issuerOrDiscovery URL using the `https` scheme with no query or fragment component that the OP asserts as its Issuer Identifier.
 * @return Returns `null` until the [`DiscoveryDocument`](#discoverydocument) has been fetched from the provided issuer URL.
 *
 * @example
 * ```ts
 * const discovery = useAutoDiscovery('https://example.com/auth');
 * ```
 */
export function useOurAutoDiscovery(
  issuerOrDiscovery: AuthSession.IssuerOrDiscovery,
): AuthSession.DiscoveryDocument | null {
  const [discovery, setDiscovery] =
    useState<AuthSession.DiscoveryDocument | null>(null);

  useEffect(() => {
    let isAllowed = true;
    AuthSession.resolveDiscoveryAsync(issuerOrDiscovery)
      .then((discovery) => {
        if (isAllowed) {
          setDiscovery(discovery);
        }
      })
      .catch();

    return () => {
      isAllowed = false;
    };
  }, [issuerOrDiscovery]);

  return discovery;
}

export const AuthProvider = ({ children, ...props }: AuthProviderProps) => {
  const storeRef = React.useRef<AuthStore>();
  if (!storeRef.current) {
    storeRef.current = createAuthStore(props);
  }

  const discovery = useOurAutoDiscovery(props.endpoint);

  useEffect(() => {
    if (storeRef.current) {
      if (discovery) {
        const store = storeRef.current;
        store.setState({ discovery });

        // Create redirect URL
        const redirectUrl = AuthSession.makeRedirectUri({
          path: "/sign-in",
        });
        store.setState({ redirectUrl });

        // Pre-create auth request
        AuthSession.loadAsync(
          {
            clientId: store.getState().clientId,
            scopes: store.getState().scopes,
            redirectUri: redirectUrl,
            usePKCE: true,
            extraParams: {
              audience: `${getBaseUrl()}/`,
            },
          },
          discovery,
        )
          .then((authRequest) => {
            store.setState({ authRequest });
          })
          .catch((err) => console.error("auth request error", err));
      }
      // Always load the session from storage even if discovery is null
      storeRef.current.getState().__internalActions.loadSessionFromStorage();
    }
  }, [discovery]);

  return (
    <AuthContext.Provider value={storeRef.current}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = React.useContext(AuthContext);
  if (!store) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }
  return useStore(store, selector);
}

export const useIsSignedIn = () =>
  useAuthStore(
    (state) => state.session !== null && state.session.expiresAt > new Date(),
  );

export const useAuthIsLoading = () => useAuthStore((state) => state.isLoading);
export const useSession = () => useAuthStore((state) => state.session);
export const useUser = () => useAuthStore((state) => state.session?.user);
export const useAuthError = () => useAuthStore((state) => state.authError);
export const useAuthActions = () => useAuthStore((state) => state.actions);

export const useAuth = () => {
  const isSignedIn = useIsSignedIn();
  const isLoading = useAuthIsLoading();
  const session = useSession();
  const user = useUser();
  const error = useAuthError();
  const { signIn, signOut } = useAuthActions();

  return { isSignedIn, isLoading, session, user, error, signIn, signOut };
};

export const getAccessToken = async (): Promise<string | null> => {
  return (await getStorageItemAsync("accessToken")) as string | null;
};
