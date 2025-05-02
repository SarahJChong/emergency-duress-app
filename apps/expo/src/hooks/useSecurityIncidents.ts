import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";
import {
  fetchIncidentDetails,
  listIncidents,
  type ListIncidentsParams,
} from "@/lib/api";
import type { ApiIncident } from "@/lib/api/types";

/**
 * Hook for fetching incidents as a security responder
 *
 * Provides functionality to list incidents with filtering and sorting options.
 * Security responders can only view incidents for their assigned location,
 * while managers can view all incidents.
 *
 * @param params - Optional parameters for filtering and sorting incidents
 * @returns Query object containing list of incidents, loading state, and error state
 *
 * @example
 * ```tsx
 * // Fetch all incidents for the security responder's location
 * const { data: incidents } = useSecurityIncidents();
 *
 * // Fetch with filters
 * const { data: openIncidents } = useSecurityIncidents({
 *   status: "Open",
 *   sortBy: "date",
 *   sortOrder: "desc"
 * });
 * ```
 */
export const useSecurityIncidents = (params?: ListIncidentsParams) => {
  return useQuery({
    queryKey: ["securityIncidents", params],
    queryFn: () => listIncidents(params),
    staleTime: 0,
  });
};

/**
 * Hook for fetching a specific incident's details as a security responder
 *
 * @param id - The ID of the incident to fetch
 * @returns Query object containing incident details, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: incident, isLoading } = useSecurityIncidentDetails(incidentId);
 *
 * if (incident) {
 *   // Display incident details for security response
 * }
 * ```
 */
export const useSecurityIncidentDetails = (id: string) => {
  return useQuery({
    queryKey: ["securityIncident", id],
    queryFn: () => fetchIncidentDetails(id),
    staleTime: 0,
  });
};

/**
 * Interface for incident closure data
 */
interface CloseIncidentData {
  /** ID of the incident to close */
  id: string;
  /** Notes about how the incident was resolved */
  closureNotes: string;
  /** Name or ID of the security responder who closed the incident */
  closedBy: string;
}

/**
 * Hook for managing security incident actions, particularly incident closure
 *
 * Provides functionality for security responders to close incidents with notes.
 *
 * @returns Object containing incident closure function and loading/error states
 *
 * @example
 * ```tsx
 * const { closeIncident, isClosing } = useSecurityIncidentActions();
 *
 * // Close an incident
 * closeIncident({
 *   id: "incident-id",
 *   closureNotes: "Resolved the situation by...",
 *   closedBy: "Security Officer Name"
 * });
 * ```
 */
export const useSecurityIncidentActions = () => {
  const queryClient = useQueryClient();

  const closeIncidentMutation = useMutation({
    mutationFn: async (data: CloseIncidentData) => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("No access token available");
      }

      const response = await fetch(
        `${getBaseUrl()}/api/incident/${data.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            closureNotes: data.closureNotes,
            closedBy: data.closedBy,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to close incident");
      }

      return response.json() as Promise<ApiIncident>;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["securityIncidents"] });
      queryClient.invalidateQueries({
        queryKey: ["securityIncident", data.id],
      });
    },
  });

  return {
    closeIncident: closeIncidentMutation.mutate,
    isClosing: closeIncidentMutation.isPending,
    closeError: closeIncidentMutation.error,
  };
};

// Export all hooks
export { useSecurityIncidents as default };
