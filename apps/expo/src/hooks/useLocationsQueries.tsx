import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSecurityResponder,
  createLocation,
  deleteLocation,
  fetchLocations,
  fetchSecurityResponders,
  isLocationIncidentError,
  removeSecurityResponder,
  updateLocation,
  type LocationInput,
} from "@/lib/api/locationApi";
import { useAuth } from "./useAuth";

/**
 * Hook for querying all locations
 *
 * @returns Query object containing list of locations, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: locations, isLoading } = useLocationsQuery();
 *
 * if (locations) {
 *   locations.map(location => (
 *     // Render location data
 *   ));
 * }
 * ```
 */
export function useLocationsQuery() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
  });
}

/**
 * Hook for querying available security responders
 * Returns list of users with security role who can be assigned to locations
 *
 * @returns Query object containing list of security responders, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: responders } = useSecurityRespondersQuery();
 *
 * if (responders) {
 *   responders.map(responder => (
 *     // Render responder selection
 *   ));
 * }
 * ```
 */
export function useSecurityRespondersQuery() {
  return useQuery({
    queryKey: ["securityResponders"],
    queryFn: fetchSecurityResponders,
  });
}

/**
 * Hook for creating a new location
 *
 * @returns Mutation object for creating locations with loading and error states
 *
 * @example
 * ```tsx
 * const { mutateAsync: createLocation } = useCreateLocation();
 *
 * await createLocation({
 *   name: "Location Name",
 *   defaultPhoneNumber: "1234567890",
 *   defaultEmail: "contact@example.com"
 * });
 * ```
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LocationInput) => createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

/**
 * Hook for updating an existing location
 *
 * @returns Mutation object for updating locations with loading and error states
 *
 * @example
 * ```tsx
 * const { mutateAsync: updateLocation } = useUpdateLocation();
 *
 * await updateLocation({
 *   id: "location-id",
 *   data: {
 *     name: "Updated Name"
 *   }
 * });
 * ```
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LocationInput }) =>
      updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

/**
 * Hook for deleting a location
 *
 * @returns Mutation object for deleting locations with loading and error states
 *
 * @example
 * ```tsx
 * const { mutateAsync: deleteLocation } = useDeleteLocation();
 *
 * await deleteLocation("location-id");
 * ```
 * @throws Will throw an error if the location has associated incidents
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

/**
 * Hook for adding a security responder to a location
 *
 * @returns Mutation object for adding security responders with loading and error states
 *
 * @example
 * ```tsx
 * const { mutateAsync: addResponder } = useAddSecurityResponder();
 *
 * await addResponder({
 *   locationId: "location-id",
 *   email: "security@example.com"
 * });
 * ```
 */
export function useAddSecurityResponder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      locationId,
      email,
    }: {
      locationId: string;
      email: string;
    }) => addSecurityResponder(locationId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["securityResponders"] });
    },
  });
}

/**
 * Hook for removing a security responder from a location
 *
 * @returns Mutation object for removing security responders with loading and error states
 *
 * @example
 * ```tsx
 * const { mutateAsync: removeResponder } = useRemoveSecurityResponder();
 *
 * await removeResponder({
 *   locationId: "location-id",
 *   email: "security@example.com"
 * });
 * ```
 */
export function useRemoveSecurityResponder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      locationId,
      email,
    }: {
      locationId: string;
      email: string;
    }) => removeSecurityResponder(locationId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["securityResponders"] });
    },
  });
}

// Export the helper function
export { isLocationIncidentError };
