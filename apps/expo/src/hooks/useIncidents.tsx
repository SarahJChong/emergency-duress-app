import { useQuery } from "@tanstack/react-query";

import type { ApiIncident } from "@/lib/api/types";
import {
  getPendingIncidents,
  type PendingIncident,
} from "@/lib/offlineIncidents";
import { useAuth } from "./useAuth";
import { useUserIncidentsQuery } from "./useIncidentQueries";

export type IncidentWithPending = Omit<ApiIncident, "id"> & {
  id: string;
  isPending?: boolean;
  name?: string;
};

export function useIncidents(id?: string) {
  const { isSignedIn } = useAuth();

  const {
    data: onlineIncidents,
    isLoading: isLoadingOnline,
    error: onlineError,
  } = useUserIncidentsQuery(isSignedIn);

  const {
    data: pendingIncidents = [],
    isLoading: isLoadingOffline,
    error: offlineError,
  } = useQuery({
    queryKey: ["pendingIncidents"],
    queryFn: getPendingIncidents,
  });

  // Only show loading state if we're loading online data first time
  // or loading offline data when online failed
  const isLoading = isLoadingOnline || (onlineError && isLoadingOffline);

  // Show error only if both online and offline fetches failed
  const error = onlineError && offlineError ? onlineError : null;

  // Convert pending incidents to match API format and add isPending flag
  const convertedPendingIncidents: IncidentWithPending[] = pendingIncidents.map(
    (pending: PendingIncident): IncidentWithPending => ({
      id: pending.createdAt, // Use createdAt as the ID for offline incidents
      dateCalled: new Date(pending.createdAt),
      status: pending.status,
      locationId: pending.locationId,
      location: pending.location,
      isAnonymous: pending.isAnonymous ?? false,
      createdAt: new Date(pending.createdAt),
      updatedAt: new Date(),
      dateClosed: pending.cancelledAt
        ? new Date(pending.cancelledAt)
        : undefined,
      cancellationReason: pending.cancellationReason,
      gpsCoordinates: pending.gpsCoordinates,
      roomNumber: pending.roomNumber,
      name: pending.name,
      isPending: true,
    }),
  );

  // Mark online incidents as not pending
  const onlineIncidentsWithPending: IncidentWithPending[] = (
    onlineIncidents || []
  ).map(
    (incident: ApiIncident): IncidentWithPending => ({
      ...incident,
      isPending: false,
      createdAt: new Date(incident.createdAt),
      updatedAt: new Date(incident.updatedAt),
      dateCalled: new Date(incident.dateCalled),
      dateClosed: incident.dateClosed
        ? new Date(incident.dateClosed)
        : undefined,
    }),
  );

  // Combine and sort all incidents
  const allIncidents = [
    ...onlineIncidentsWithPending,
    ...convertedPendingIncidents,
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // If an ID is provided, find that specific incident
  const incident = id ? allIncidents.find((inc) => inc.id === id) : undefined;

  return {
    incidents: allIncidents,
    incident,
    isLoading,
    error,
  };
}
