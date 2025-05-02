import {
  useCancelIncident,
  useCreateIncident,
} from "./useIncidentActionsQueries";

/**
 * Interface defining available incident actions and their loading states
 */
export interface IncidentActions {
  /** Function to raise a new incident */
  raiseIncident: (options?: { isAnonymous: boolean }) => Promise<void>;
  /** Function to cancel an active incident with a reason */
  cancelIncident: (reason: string) => Promise<void>;
  /** Whether an incident is currently being raised */
  isRaising: boolean;
  /** Whether an incident is currently being cancelled */
  isCancelling: boolean;
}

/**
 * Hook that provides actions for managing incidents
 * Combines creation and cancellation functionality into a single interface
 *
 * @example
 * ```tsx
 * const { raiseIncident, cancelIncident, isRaising, isCancelling } = useIncidentActions();
 *
 * // Raise a new incident
 * await raiseIncident({ isAnonymous: true });
 *
 * // Cancel an active incident
 * await cancelIncident("False alarm");
 * ```
 *
 * @returns Object containing incident management actions and loading states
 */
export function useIncidentActions(): IncidentActions {
  const { raiseIncident, isRaising } = useCreateIncident();
  const { cancelIncident, isCancelling } = useCancelIncident();

  return {
    raiseIncident: async (options?: { isAnonymous: boolean }) => {
      await raiseIncident(options);
    },
    cancelIncident: async (reason: string) => {
      await cancelIncident(reason);
    },
    isRaising,
    isCancelling,
  };
}
