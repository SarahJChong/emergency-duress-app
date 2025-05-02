import { LogBox, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getBaseUrl } from "@/utils/baseUrl";
import { getAccessToken } from "@/hooks/useAuth";

const CONSENT_KEY = "@error-logging-consent";
const ERROR_LOGS_KEY = "@error-logs";
const PENDING_LOGS_KEY = "@pending-error-logs";

type LogLevel = "log" | "info" | "warn" | "error";

/**
 * Interface defining the structure of error data to be logged
 */
export interface ErrorLogData {
  message: string;
  stack?: string;
  timestamp: number;
  level: LogLevel;
  context?: Record<string, unknown>;
  deviceInfo: {
    platform: string;
    version: string;
    manufacturer?: string;
    model?: string;
  };
}

/**
 * Get platform version in a safe way
 */
const getPlatformVersion = (): string => {
  if (Platform.OS === "web") {
    return typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  }
  return Platform.Version?.toString() ?? "unknown";
};

/**
 * Service for handling error logging and telemetry in React Native
 */
export class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private isInitialized = false;
  private isOffline = false;
  private originalConsole: Record<LogLevel, typeof console.log>;

  private constructor() {
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
  }

  /**
   * Get the singleton instance of ErrorLoggingService
   */
  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  /**
   * Set the offline status
   */
  public setOfflineStatus(offline: boolean): void {
    this.isOffline = offline;
  }

  /**
   * Initialize the error logging service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.setupConsoleOverrides();
      this.setupErrorHandler();
      this.setupPromiseRejectionHandler();
      this.isInitialized = true;
    } catch (error) {
      this.originalConsole.error("Failed to initialize error logging:", error);
    }
  }

  /**
   * Override console methods to capture logs
   */
  private setupConsoleOverrides(): void {
    const methods: LogLevel[] = ["log", "info", "warn", "error"];

    methods.forEach((method) => {
      console[method] = (...args: any[]) => {
        this.originalConsole[method].apply(console, args);
        try {
          this.logConsoleOutput(method, args).catch((err) => {
            this.originalConsole.error("Failed to log console output:", err);
          });
        } catch (err) {
          this.originalConsole.error("Failed to process console output:", err);
        }
      };
    });
  }

  /**
   * Set up global error handler
   */
  private setupErrorHandler(): void {
    ErrorUtils.setGlobalHandler(async (error: Error, isFatal?: boolean) => {
      try {
        await this.logError(error, { isFatal });
      } catch (err) {
        this.originalConsole.error("Failed to log error:", err);
      }
    });
  }

  /**
   * Set up promise rejection handler
   */
  private setupPromiseRejectionHandler(): void {
    if (Platform.OS !== "web") return;

    window.addEventListener("unhandledrejection", async (event) => {
      const error = event.reason;
      try {
        await this.logError(
          error instanceof Error ? error : new Error(String(error)),
          { type: "unhandledRejection" },
        );
      } catch (err) {
        this.originalConsole.error("Failed to log rejection:", err);
      }
    });
  }

  /**
   * Log console output
   */
  private async logConsoleOutput(level: LogLevel, args: any[]): Promise<void> {
    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    const deviceInfo = {
      platform: Platform.OS,
      version: getPlatformVersion(),
    };

    await this.createLog({
      message,
      level,
      timestamp: Date.now(),
      deviceInfo,
    });
  }

  /**
   * Log an error with optional context
   */
  public async logError(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const deviceInfo = {
      platform: Platform.OS,
      version: getPlatformVersion(),
    };

    await this.createLog({
      message: error.message,
      stack: error.stack,
      level: "error",
      timestamp: Date.now(),
      context,
      deviceInfo,
    });
  }

  /**
   * Create and store a log entry
   */
  private async createLog(logData: ErrorLogData): Promise<void> {
    const hasConsent = await this.checkConsent();

    // Always log locally
    await this.logLocally(logData);

    // If we have consent and are online, send to server
    if (hasConsent && !this.isOffline) {
      await this.sendToServer(logData);
    } else if (hasConsent && this.isOffline) {
      // If we have consent but are offline, store for later
      await this.storePendingLog(logData);
    }
  }

  /**
   * Store error logging consent status
   */
  public async setConsent(consent: boolean): Promise<void> {
    await AsyncStorage.setItem(CONSENT_KEY, consent.toString());
  }

  /**
   * Check if user has given consent for error logging
   */
  public async checkConsent(): Promise<boolean> {
    const consent = await AsyncStorage.getItem(CONSENT_KEY);
    return consent === "true";
  }

  /**
   * Log error data locally
   */
  private async logLocally(logData: ErrorLogData): Promise<void> {
    try {
      const existingLogsStr = await AsyncStorage.getItem(ERROR_LOGS_KEY);
      const existingLogs: ErrorLogData[] = existingLogsStr
        ? JSON.parse(existingLogsStr)
        : [];

      existingLogs.push(logData);
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }

      await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(existingLogs));
    } catch (error) {
      this.originalConsole.error("Failed to log locally:", error);
    }
  }

  /**
   * Store a log for sending later when online
   */
  private async storePendingLog(logData: ErrorLogData): Promise<void> {
    try {
      const pendingLogsStr = await AsyncStorage.getItem(PENDING_LOGS_KEY);
      const pendingLogs: ErrorLogData[] = pendingLogsStr
        ? JSON.parse(pendingLogsStr)
        : [];

      pendingLogs.push(logData);
      if (pendingLogs.length > 100) {
        pendingLogs.shift();
      }

      await AsyncStorage.setItem(PENDING_LOGS_KEY, JSON.stringify(pendingLogs));
    } catch (error) {
      this.originalConsole.error("Failed to store pending log:", error);
    }
  }

  /**
   * Send error data to the server
   */
  private async sendToServer(logData: ErrorLogData): Promise<void> {
    if (this.isOffline) {
      await this.storePendingLog(logData);
      return;
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("No access token available");
      }
      const response = await fetch(`${getBaseUrl()}/api/errorlogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        throw new Error("Failed to send error log to server");
      }
    } catch (error) {
      this.originalConsole.error("Failed to send error log to server:", error);
      await this.storePendingLog(logData);
    }
  }

  /**
   * Send any pending logs that were saved while offline
   */
  public async syncPendingLogs(): Promise<void> {
    if (this.isOffline) return;

    try {
      const pendingLogsStr = await AsyncStorage.getItem(PENDING_LOGS_KEY);
      const pendingLogs: ErrorLogData[] = pendingLogsStr
        ? JSON.parse(pendingLogsStr)
        : [];

      if (pendingLogs.length === 0) return;

      const successfulSends: number[] = [];

      // Try to send each pending log
      await Promise.all(
        pendingLogs.map(async (log, index) => {
          try {
            await this.sendToServer(log);
            successfulSends.push(index);
          } catch (error) {
            this.originalConsole.error("Failed to sync pending log:", error);
          }
        }),
      );

      // Remove successfully sent logs
      const remainingLogs = pendingLogs.filter(
        (_, index) => !successfulSends.includes(index),
      );
      await AsyncStorage.setItem(
        PENDING_LOGS_KEY,
        JSON.stringify(remainingLogs),
      );
    } catch (error) {
      this.originalConsole.error("Failed to sync pending logs:", error);
    }
  }

  /**
   * Get all locally stored error logs
   */
  public async getLocalLogs(): Promise<ErrorLogData[]> {
    try {
      const logsStr = await AsyncStorage.getItem(ERROR_LOGS_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      this.originalConsole.error("Failed to get local logs:", error);
      return [];
    }
  }

  /**
   * Get all pending logs that haven't been sent to the server
   */
  public async getPendingLogs(): Promise<ErrorLogData[]> {
    try {
      const logsStr = await AsyncStorage.getItem(PENDING_LOGS_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (error) {
      this.originalConsole.error("Failed to get pending logs:", error);
      return [];
    }
  }

  /**
   * Clear all locally stored error logs
   */
  public async clearLocalLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify([]));
      await AsyncStorage.setItem(PENDING_LOGS_KEY, JSON.stringify([]));
    } catch (error) {
      this.originalConsole.error("Failed to clear logs:", error);
    }
  }

  /**
   * Restore original console methods
   */
  public restoreConsole(): void {
    Object.entries(this.originalConsole).forEach(([method, fn]) => {
      console[method as LogLevel] = fn;
    });
  }
}

export const errorLoggingService = ErrorLoggingService.getInstance();
