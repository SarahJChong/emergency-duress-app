import {
  isLocationIncidentError,
  useAddSecurityResponder,
  useCreateLocation,
  useDeleteLocation,
  useLocationsQuery,
  useRemoveSecurityResponder,
  useSecurityRespondersQuery,
  useUpdateLocation,
} from "./useLocationsQueries";

/**
 * Hook that provides comprehensive location management functionality
 *
 * Combines multiple location-related hooks into a single interface for:
 * - Fetching and managing locations
 * - Managing security responders
 * - Handling admin operations
 * - Error handling
 *
 * @example
 * ```tsx
 * const {
 *   locations,
 *   create,
 *   update,
 *   delete: deleteLocation,
 *   isAdmin,
 *   // ... other properties
 * } = useLocations();
 *
 * // Create a new location
 * await create({
 *   name: "Location Name",
 *   defaultPhoneNumber: "1234567890",
 *   defaultEmail: "contact@example.com"
 * });
 *
 * // Update existing location
 * await update({
 *   id: "location-id",
 *   data: { name: "New Name" }
 * });
 * ```
 *
 * @returns Object containing all location management functions and state
 */
export function useLocations() {
  // Queries
  const locationsQuery = useLocationsQuery();
  const securityRespondersQuery = useSecurityRespondersQuery();

  // Create mutation
  const {
    mutateAsync: create,
    isPending: isCreating,
    error: createError,
  } = useCreateLocation();

  // Update mutation
  const {
    mutateAsync: update,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateLocation();

  // Delete mutation
  const {
    mutateAsync: deleteLocation,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteLocation();

  // Security responder mutations
  const {
    mutateAsync: addSecurityResponder,
    isPending: isAddingResponder,
    error: addResponderError,
  } = useAddSecurityResponder();

  const {
    mutateAsync: removeSecurityResponder,
    isPending: isRemovingResponder,
    error: removeResponderError,
  } = useRemoveSecurityResponder();

  return {
    // Queries
    locations: locationsQuery.data ?? [],
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    securityResponders: securityRespondersQuery.data ?? [],
    isLoadingResponders: securityRespondersQuery.isLoading,

    // Mutations
    create,
    update,
    delete: deleteLocation,
    addSecurityResponder,
    removeSecurityResponder,

    // Mutation states
    isCreating,
    isUpdating,
    isDeleting,
    isAddingResponder,
    isRemovingResponder,

    // Errors
    createError,
    updateError,
    deleteError,
    addResponderError,
    removeResponderError,

    // Helper for checking if error is related to incidents
    isLocationIncidentError,
  };
}
