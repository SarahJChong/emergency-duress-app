import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";
import type { ApiLocation, SecurityResponder } from "./types";

/**
 * Base API error class for location operations
 */
export class LocationApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationApiError";
  }
}

/**
 * Error thrown when a location operation fails due to existing incidents
 */
export class LocationIncidentError extends LocationApiError {}

/**
 * Type for creating or updating a location
 */
export type LocationInput = {
  name: string;
  defaultPhoneNumber: string;
  defaultEmail: string;
};

/**
 * Fetches all available locations
 * @returns Array of locations with their details
 * @throws Error if the fetch fails or no access token is available
 */
export const fetchLocations = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }
  const response = await fetch(`${getBaseUrl()}/api/locations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch locations.");
  }
  return (await response.json()) as ApiLocation[];
};

/**
 * Creates a new location
 * @param location Location details to create
 * @returns Created location
 * @throws LocationApiError if creation fails
 */
export const createLocation = async (location: LocationInput) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(`${getBaseUrl()}/api/locations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(location),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new LocationApiError(error.message || "Failed to create location");
  }

  return (await response.json()) as ApiLocation;
};

/**
 * Updates an existing location
 * @param id Location ID to update
 * @param location Updated location details
 * @returns Updated location
 * @throws LocationApiError if update fails
 * @throws LocationIncidentError if location has associated incidents and name change attempted
 */
export const updateLocation = async (id: string, location: LocationInput) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(`${getBaseUrl()}/api/locations/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(location),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.message?.includes("associated incidents")) {
      throw new LocationIncidentError(error.message);
    }
    throw new LocationApiError(error.message || "Failed to update location");
  }

  return (await response.json()) as ApiLocation;
};

/**
 * Deletes a location
 * @param id Location ID to delete
 * @throws LocationApiError if deletion fails
 * @throws LocationIncidentError if location has associated incidents
 */
export const deleteLocation = async (id: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(`${getBaseUrl()}/api/locations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.message?.includes("associated incidents")) {
      throw new LocationIncidentError(error.message);
    }
    throw new LocationApiError(error.message || "Failed to delete location");
  }
};

/**
 * Fetches all users with security role that can be assigned as responders
 * @returns Array of security responders with their details
 * @throws LocationApiError if fetch fails
 */
export const fetchSecurityResponders = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(
    `${getBaseUrl()}/api/locations/security-responders`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new LocationApiError(
      error.message || "Failed to fetch security responders",
    );
  }

  return (await response.json()) as SecurityResponder[];
};

/**
 * Adds a security responder to a location
 * @param locationId Location ID to add the security responder to
 * @param email Email address of the security responder
 * @returns Updated location with the new security responder
 * @throws LocationApiError if addition fails
 */
export const addSecurityResponder = async (
  locationId: string,
  email: string,
) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(
    `${getBaseUrl()}/api/locations/${locationId}/security-responders`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new LocationApiError(
      error.message || "Failed to add security responder",
    );
  }

  return (await response.json()) as ApiLocation;
};

/**
 * Removes a security responder from a location
 * @param locationId Location ID to remove the security responder from
 * @param email Email address of the security responder to remove
 * @throws LocationApiError if removal fails
 */
export const removeSecurityResponder = async (
  locationId: string,
  email: string,
) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error("No access token available");
  }

  const encodedEmail = encodeURIComponent(email);
  const response = await fetch(
    `${getBaseUrl()}/api/locations/${locationId}/security-responders/${encodedEmail}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new LocationApiError(
      error.message || "Failed to remove security responder",
    );
  }
};

/**
 * Type guard to check if an error is a LocationIncidentError
 */
export const isLocationIncidentError = (
  error: unknown,
): error is LocationIncidentError => {
  return error instanceof LocationIncidentError;
};

/**
 * Type guard to check if an error is a LocationApiError
 */
export const isLocationApiError = (
  error: unknown,
): error is LocationApiError => {
  return error instanceof LocationApiError;
};
