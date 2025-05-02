import * as Location from "expo-location";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cancelIncident, createIncident, syncIncident } from "@/lib/api";
import {
  cancelPendingIncident,
  storePendingIncident,
  syncPendingIncidents,
  type PendingIncident,
} from "@/lib/offlineIncidents";
import { useAuth } from "./useAuth";
import { useIsOffline } from "./useIsOffline";
import { useMeQuery } from "./useQueries";

const requestLocationPermissions = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
};

const useRequestLocationPermissionsQuery = () => {
  return useQuery({
    queryKey: ["locationPermissions"],
    queryFn: requestLocationPermissions,
  });
};

/**
 * Hook for creating an incident with support for offline functionality
 *
 * When online:
 * - Creates incident through API
 * - Updates active incident and user incidents queries
 *
 * When offline:
 * - Stores incident locally
 * - Updates pending incident queries
 * - Syncs when back online
 *
 * @example
 * ```tsx
 * const { raiseIncident, isRaising } = useCreateIncident();
 * await raiseIncident({ isAnonymous: true }); // Creates incident with user's current location
 * ```
 */
export function useCreateIncident() {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { isOffline } = useIsOffline();
  const userQuery = useMeQuery(isSignedIn);
  const requestLocationPermissionsQuery = useRequestLocationPermissionsQuery();

  const mutation = useMutation({
    mutationFn: async (options?: { isAnonymous: boolean }) => {
      // Get location coordinates if available
      let coordinates: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }

      if (isOffline) {
        const userLocation = userQuery.data?.location;
        if (!userLocation) {
          throw new Error("User location not available");
        }

        const pendingIncident: PendingIncident = {
          locationId: userLocation.id,
          location: userLocation,
          roomNumber: userQuery.data?.roomNumber || undefined,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          name: userQuery.data?.name || undefined,
          isAnonymous: options?.isAnonymous || false,
          status: "Open",
          createdAt: new Date().toISOString(),
        };
        await storePendingIncident(pendingIncident);
        return { status: "Open" };
      }

      return createIncident({
        locationId: userQuery.data?.location?.id || "",
        roomNumber: userQuery.data?.roomNumber || undefined,
        latitude: coordinates?.latitude || undefined,
        longitude: coordinates?.longitude || undefined,
        isAnonymous: options?.isAnonymous || false,
      });
    },
    onSuccess: () => {
      if (!isOffline) {
        queryClient.invalidateQueries({ queryKey: ["activeIncident"] });
        queryClient.invalidateQueries({ queryKey: ["userIncidents"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["openPendingIncident"] });
        queryClient.invalidateQueries({ queryKey: ["pendingIncidents"] });
      }
      // Sync pending incidents when coming back online
      if (!isOffline && isSignedIn) {
        syncPendingIncidents(syncIncident).catch(console.error);
      }
    },
  });

  return {
    raiseIncident: mutation.mutateAsync,
    isRaising: mutation.isPending,
  };
}

/**
 * Hook for cancelling an incident with offline support
 *
 * When online:
 * - Cancels incident through API
 * - Updates active incident and user incidents queries
 *
 * When offline:
 * - Updates pending incident status locally
 * - Updates pending incident queries
 *
 * @example
 * ```tsx
 * const { cancelIncident, isCancelling } = useCancelIncident();
 * await cancelIncident("False alarm"); // Cancels active incident
 * ```
 */
export function useCancelIncident() {
  const queryClient = useQueryClient();
  const { isOffline } = useIsOffline();

  const mutation = useMutation({
    mutationFn: async (reason: string) => {
      if (isOffline) {
        const openPendingIncident =
          await queryClient.getQueryData<PendingIncident>([
            "openPendingIncident",
          ]);
        if (openPendingIncident) {
          await cancelPendingIncident(openPendingIncident.createdAt, reason);
          queryClient.invalidateQueries({ queryKey: ["openPendingIncident"] });
          queryClient.invalidateQueries({ queryKey: ["pendingIncidents"] });
          return { status: "Cancelled" };
        }
        throw new Error("No open incident found");
      }

      return cancelIncident(reason);
    },
    onSuccess: () => {
      if (!isOffline) {
        queryClient.invalidateQueries({ queryKey: ["activeIncident"] });
        queryClient.invalidateQueries({ queryKey: ["userIncidents"] });
      }
    },
  });

  return {
    cancelIncident: mutation.mutateAsync,
    isCancelling: mutation.isPending,
  };
}
