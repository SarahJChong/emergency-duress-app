import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";
import type { ApiIncident } from "./types";

/**
 * Fetches the current user's active incident if one exists
 * @returns The active incident details or null if none exists
 * @throws Error if the fetch fails or no access token is available
 */
export const getActiveIncident = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident/active`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to get active incident.");
  }
  return (await response.json()) as ApiIncident;
};

/**
 * Interface for incident list request parameters
 */
export interface ListIncidentsParams {
  locationId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Fetches a list of incidents based on user role and optional filters
 * - For security responders: Returns incidents for their assigned location
 * - For company managers: Returns all incidents with optional location filter
 * @param params Optional parameters for filtering and pagination
 * @returns List of incidents with pagination details
 * @throws Error if fetch fails or no access token is available
 */
export const listIncidents = async (params?: ListIncidentsParams) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const queryParams = new URLSearchParams();
  if (params?.locationId) queryParams.append("locationId", params.locationId);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const response = await fetch(
    `${getBaseUrl()}/api/incident/list?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch incidents list.");
  }
  return (await response.json()) as ApiIncident[];
};

/**
 * Creates a new incident
 * @param request The incident creation request details
 * @returns The created incident details
 * @throws Error if creation fails or no access token is available
 */
export const createIncident = async (request: {
  locationId: string;
  roomNumber?: string;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
}) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error("Failed to create incident.");
  }
  return (await response.json()) as {
    id: string;
    timestamp: string;
    status: "Open" | "Closed" | "Cancelled";
    isAnonymous: boolean;
  };
};

/**
 * Cancels an active incident with a reason
 * @param reason The reason for cancellation
 * @returns The updated incident details
 * @throws Error if cancellation fails or no access token is available
 */
export const cancelIncident = async (reason: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      cancellationReason: reason,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to cancel incident.");
  }
  return (await response.json()) as ApiIncident;
};

/**
 * Fetches all incidents associated with the current user
 * @returns Array of user's incidents
 * @throws Error if fetch fails or no access token is available
 */
export const fetchUserIncidents = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch incidents.");
  }
  return (await response.json()) as ApiIncident[];
};

/**
 * Fetches details of a specific incident
 * @param id The incident ID
 * @returns The incident details or null if not found
 * @throws Error if fetch fails or no access token is available
 */
export const fetchIncidentDetails = async (id: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch incident details.");
  }
  return (await response.json()) as ApiIncident;
};

/**
 * Syncs an incident with the server
 * @param request The incident sync request details
 * @returns The synced incident details
 * @throws Error if sync fails or no access token is available
 */
export const syncIncident = async (request: {
  locationId: string;
  roomNumber?: string;
  latitude?: number;
  longitude?: number;
  isAnonymous?: boolean;
  createdAt: string;
  cancellationReason?: string;
}) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/incident/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error("Failed to sync incident.");
  }
  return (await response.json()) as ApiIncident;
};
