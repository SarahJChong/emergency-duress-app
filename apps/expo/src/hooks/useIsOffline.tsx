import { useNetworkState } from "expo-network";

import { useAuth } from "@/hooks/useAuth";
import { useMeQuery } from "@/hooks/useQueries";

export function useIsOffline() {
  const { isSignedIn } = useAuth();
  const networkState = useNetworkState();
  const userQuery = useMeQuery(isSignedIn);

  const networkOffline =
    !networkState.isConnected || !networkState.isInternetReachable;

  const isOffline = networkOffline || (isSignedIn && userQuery.isError);

  const isOfflineWithUser = !!(isOffline && isSignedIn && userQuery.data);

  return { isOffline, isOfflineWithUser };
}
