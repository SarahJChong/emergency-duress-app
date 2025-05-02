import { useQuery } from "@tanstack/react-query";

import {
  fetchIncidentDetails,
  fetchUserIncidents,
  getActiveIncident,
} from "@/lib/api";
import {
  getOpenPendingIncident,
  getPendingIncidents,
} from "@/lib/offlineIncidents";

/**
 * Hook for querying the user's active (open) incident
 *
 * @param isSignedIn - Whether the user is currently authenticated
 * @returns Query object containing active incident data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: activeIncident, isLoading } = useActiveIncidentQuery(isSignedIn);
 *
 * if (activeIncident?.status === "Open") {
 *   // Handle active incident
 * }
 * ```
 */
export const useActiveIncidentQuery = (isSignedIn: boolean) => {
  return {
    ...useQuery({
      queryKey: ["activeIncident"],
      queryFn: () => getActiveIncident(),
      enabled: isSignedIn,
      staleTime: 0,
    }),
    enabled: isSignedIn,
  };
};

/**
 * Hook for querying the user's incident history
 *
 * @param isSignedIn - Whether the user is currently authenticated
 * @returns Query object containing list of user's incidents, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: incidents } = useUserIncidentsQuery(isSignedIn);
 *
 * incidents?.map(incident => (
 *   // Render incident details
 * ));
 * ```
 */
export const useUserIncidentsQuery = (isSignedIn: boolean) => {
  return {
    ...useQuery({
      queryKey: ["userIncidents"],
      queryFn: () => fetchUserIncidents(),
      enabled: isSignedIn,
      select: (incidents) =>
        incidents.map((incident) => ({
          ...incident,
        })),
    }),
    enabled: isSignedIn,
  };
};

/**
 * Hook for querying details of a specific incident
 *
 * @param id - The ID of the incident to fetch
 * @param isSignedIn - Whether the user is currently authenticated
 * @returns Query object containing incident details, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: incident } = useIncidentDetailsQuery(id, isSignedIn);
 *
 * if (incident) {
 *   // Display incident details
 * }
 * ```
 */
export const useIncidentDetailsQuery = (id: string, isSignedIn: boolean) => {
  return {
    ...useQuery({
      queryKey: ["incidentDetails", id],
      queryFn: () => fetchIncidentDetails(id),
      enabled: isSignedIn && !!id,
    }),
    enabled: isSignedIn && !!id,
  };
};

/**
 * Hook for querying the user's current open pending incident (offline mode)
 *
 * Used when the app is offline to retrieve locally stored pending incidents
 * that haven't been synced to the server yet.
 *
 * @returns Query object containing open pending incident data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: pendingIncident } = useOpenPendingIncidentQuery();
 *
 * if (pendingIncident) {
 *   // Handle pending incident
 * }
 * ```
 */
export const useOpenPendingIncidentQuery = () => {
  return useQuery({
    queryKey: ["openPendingIncident"],
    queryFn: () => getOpenPendingIncident(),
  });
};

/**
 * Hook for querying a specific offline incident
 *
 * Used to retrieve details of a locally stored incident that hasn't been
 * synced to the server yet.
 *
 * @param id - The created date string used as ID for the offline incident
 * @returns Query object containing offline incident data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: offlineIncident } = useOfflineIncidentQuery(createdAt);
 *
 * if (offlineIncident) {
 *   // Display offline incident details
 * }
 * ```
 */
export const useOfflineIncidentQuery = (id: string) => {
  return useQuery({
    queryKey: ["offlineIncident", id],
    queryFn: async () => {
      const incidents = await getPendingIncidents();
      const incident = incidents.find((inc) => inc.createdAt === id);
      if (!incident) {
        throw new Error("Offline incident not found");
      }
      return incident;
    },
    enabled: !!id,
    retry: false,
  });
};
