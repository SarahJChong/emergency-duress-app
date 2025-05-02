import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";
import {
  useActiveIncidentQuery,
  useOpenPendingIncidentQuery,
} from "./useIncidentQueries";
import { useIsOffline } from "./useIsOffline";

/**
 * Interface representing the current incident status state
 */
export interface IncidentStatus {
  /** Whether the user currently has an active incident (duress call) */
  inDuress: boolean;
  /** Whether the current/next incident should be anonymous */
  isAnonymous: boolean;
  /** Function to toggle anonymous status for current/next incident */
  setIsAnonymous: (value: boolean) => void;
}

/**
 * Hook that manages the user's current incident status, handling both online and offline states
 *
 * Provides functionality to:
 * - Check if user is currently in duress (has an active incident)
 * - Manage anonymous reporting preference
 * - Handle offline/online state transitions
 *
 * The hook automatically syncs the anonymous status with the current incident
 * and persists it between online/offline states.
 *
 * @returns Object containing current incident status and anonymous reporting controls
 *
 * @example
 * ```tsx
 * const { inDuress, isAnonymous, setIsAnonymous } = useIncidentStatus();
 *
 * // Check if user has active incident
 * if (inDuress) {
 *   // Handle active incident state
 * }
 *
 * // Toggle anonymous reporting
 * setIsAnonymous(true);
 * ```
 */
export function useIncidentStatus(): IncidentStatus {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { isSignedIn } = useAuth();
  const { isOffline } = useIsOffline();

  const activeIncidentQuery = useActiveIncidentQuery(isSignedIn);
  const openPendingIncidentQuery = useOpenPendingIncidentQuery();

  // Determine inDuress state based on offline/online status
  const inDuress = isOffline
    ? !!openPendingIncidentQuery.data
    : !!(activeIncidentQuery.data?.status === "Open");

  useEffect(() => {
    if (!isOffline && activeIncidentQuery.data?.status !== "Open") {
      setIsAnonymous(false);
    }
  }, [isOffline, activeIncidentQuery.data?.status]);

  // Update isAnonymous based on active incident data
  useEffect(() => {
    if (isOffline && openPendingIncidentQuery.data?.isAnonymous !== undefined) {
      setIsAnonymous(openPendingIncidentQuery.data.isAnonymous);
    } else if (
      !isOffline &&
      activeIncidentQuery.data?.isAnonymous !== undefined
    ) {
      setIsAnonymous(activeIncidentQuery.data.isAnonymous);
    }
  }, [
    isOffline,
    openPendingIncidentQuery.data?.isAnonymous,
    activeIncidentQuery.data?.isAnonymous,
  ]);

  return {
    inDuress,
    isAnonymous,
    setIsAnonymous,
  };
}
