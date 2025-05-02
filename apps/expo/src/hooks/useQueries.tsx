import { useQuery } from "@tanstack/react-query";

import { fetchMe } from "@/lib/api";
import { fetchLocations } from "@/lib/api/locationApi";

/**
 * Hook for querying the current authenticated user's profile information
 *
 * Makes an authenticated request to fetch user profile details including:
 * - Basic profile information
 * - User's location assignment
 * - Roles and permissions
 *
 * The query is only enabled when the user is signed in and will automatically
 * be disabled when signed out.
 *
 * @param isSignedIn - Whether the user is currently authenticated
 * @returns Query object containing user profile data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useMeQuery(isSignedIn);
 *
 * if (user) {
 *   // Access user profile information
 *   console.log(user.name, user.location);
 * }
 * ```
 */
export const useMeQuery = (isSignedIn: boolean) => {
  return {
    ...useQuery({
      queryKey: ["me"],
      queryFn: () => fetchMe(),
      enabled: isSignedIn,
      staleTime: 0,
    }),
    enabled: isSignedIn,
  };
};

/**
 * Hook for querying available locations
 *
 * Fetches the list of all locations configured in the system.
 * The results are cached for 30 minutes to reduce API calls.
 *
 * @returns Query object containing list of locations, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data: locations } = useLocationsQuery();
 *
 * if (locations) {
 *   locations.map(location => (
 *     <LocationItem key={location.id} location={location} />
 *   ));
 * }
 * ```
 */
export const useLocationsQuery = () =>
  useQuery({
    queryKey: ["locations"],
    queryFn: () => fetchLocations(),
    staleTime: 0,
  });
