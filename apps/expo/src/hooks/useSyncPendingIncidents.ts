import { useEffect } from "react";

import { syncIncident } from "@/lib/api";
import { syncPendingIncidents } from "@/lib/offlineIncidents";
import { useAuth } from "./useAuth";
import { useIsOffline } from "./useIsOffline";

export function useSyncPendingIncidents() {
  const { isOffline } = useIsOffline();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    let isMounted = true;

    if (!isOffline && isSignedIn) {
      syncPendingIncidents(syncIncident)
        .then(() => {
          if (isMounted) {
            console.log("Pending incidents synced successfully.");
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.error("Error syncing pending incidents:", error);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOffline, isSignedIn]);
}
