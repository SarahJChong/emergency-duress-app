import { useCallback, useEffect, useState } from "react";

import { errorLoggingService } from "../lib/telemetry/errorLogging";
import type { ErrorLogData } from "../lib/telemetry/errorLogging";
import { useAuth } from "./useAuth";
import { useIsOffline } from "./useIsOffline";

/**
 * Hook for managing error logging functionality and consent
 */
export const useErrorLogging = () => {
  const { user } = useAuth();
  const { isOffline } = useIsOffline();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingLogs, setPendingLogs] = useState<ErrorLogData[]>([]);

  /**
   * Initialize the error logging service and load consent status
   * Only initializes when user is logged in
   */
  useEffect(() => {
    let isActive = true;

    const init = async () => {
      // Don't initialize if not logged in
      if (!user) {
        if (isInitialized) {
          errorLoggingService.restoreConsole();
          setIsInitialized(false);
          setHasConsent(null);
        }
        return;
      }

      try {
        await errorLoggingService.initialize();
        const consent = await errorLoggingService.checkConsent();
        const pending = await errorLoggingService.getPendingLogs();

        if (isActive) {
          setHasConsent(consent);
          setIsInitialized(true);
          setPendingLogs(pending);
        }
      } catch (error) {
        console.error("Failed to initialize error logging:", error);
        if (isActive) {
          setIsInitialized(true);
        }
      }
    };

    init();

    return () => {
      isActive = false;
    };
  }, [user]);

  /**
   * Update offline status in service and sync pending logs when coming online
   */
  useEffect(() => {
    errorLoggingService.setOfflineStatus(isOffline);

    // If we come back online and have consent, try to sync pending logs
    if (!isOffline && hasConsent && isInitialized) {
      errorLoggingService
        .syncPendingLogs()
        .then(() => errorLoggingService.getPendingLogs())
        .then(setPendingLogs)
        .catch(console.error);
    }
  }, [isOffline, hasConsent, isInitialized]);

  /**
   * Update user consent for error logging
   */
  const updateConsent = useCallback(
    async (consent: boolean) => {
      try {
        await errorLoggingService.setConsent(consent);
        setHasConsent(consent);

        // If consent is given and we're online, try to sync any pending logs
        if (consent && !isOffline) {
          await errorLoggingService.syncPendingLogs();
          const pending = await errorLoggingService.getPendingLogs();
          setPendingLogs(pending);
        }
      } catch (error) {
        console.error("Failed to update consent:", error);
      }
    },
    [isOffline],
  );

  /**
   * Log an error with optional context
   * Includes user and connectivity information in context
   */
  const logError = useCallback(
    async (error: Error, context?: Record<string, unknown>) => {
      try {
        // Add user and connectivity info to context
        const enhancedContext = {
          ...context,
          userId: user?.id,
          isOffline,
        };

        await errorLoggingService.logError(error, enhancedContext);

        // Update pending logs count if offline
        if (isOffline) {
          const pending = await errorLoggingService.getPendingLogs();
          setPendingLogs(pending);
        }
      } catch (e) {
        console.error("Failed to log error:", e);
      }
    },
    [user, isOffline],
  );

  /**
   * Get all locally stored error logs
   */
  const getLocalLogs = useCallback(async (): Promise<ErrorLogData[]> => {
    try {
      return await errorLoggingService.getLocalLogs();
    } catch (error) {
      console.error("Failed to get local logs:", error);
      return [];
    }
  }, []);

  /**
   * Get all pending logs that haven't been sent to the server
   */
  const getPendingLogs = useCallback(async (): Promise<ErrorLogData[]> => {
    try {
      return await errorLoggingService.getPendingLogs();
    } catch (error) {
      console.error("Failed to get pending logs:", error);
      return [];
    }
  }, []);

  /**
   * Clear all locally stored error logs
   */
  const clearLocalLogs = useCallback(async () => {
    try {
      await errorLoggingService.clearLocalLogs();
      setPendingLogs([]);
    } catch (error) {
      console.error("Failed to clear local logs:", error);
    }
  }, []);

  return {
    hasConsent,
    isInitialized,
    isOffline,
    pendingLogs,
    updateConsent,
    logError,
    getLocalLogs,
    getPendingLogs,
    clearLocalLogs,
  };
};
