import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

import { getBaseUrl } from "../utils/baseUrl";
import {
  isWebPushSupported,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from "../utils/webPushNotifications";
import { getAccessToken, useAuth } from "./useAuth";

/**
 * Hook for managing push notifications across web and native platforms
 *
 * Provides functionality to:
 * - Register for push notifications
 * - Handle notification permissions
 * - Manage platform-specific implementations (Expo Push for native, Web Push for browsers)
 * - Send device tokens to backend
 * - Handle notification reception and responses
 *
 * @returns Object containing notification registration functions and management utilities
 *
 * @example
 * ```tsx
 * const { registerForPushNotificationsAsync } = usePushNotifications();
 *
 * // Register for notifications
 * const token = await registerForPushNotificationsAsync();
 * ```
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Requests notification permissions and retrieves the appropriate push token
   *
   * For web platforms, uses Web Push API
   * For native platforms, uses Expo Push Notifications
   *
   * @returns Promise resolving to the push notification token
   * @throws Error if permissions are denied or registration fails
   */
  const registerForPushNotificationsAsync = useCallback(async () => {
    try {
      // Handle web push notifications
      if (Platform.OS === "web") {
        if (!isWebPushSupported()) {
          throw new Error(
            "Web Push notifications are not supported in this browser",
          );
        }
        const token = await subscribeToWebPush();
        return token;
      }

      // Request permission for notifications
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        throw new Error("Permission not granted for notifications");
      }

      // Get push token
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PROJECT_ID,
        })
      ).data;

      // Configure notification handler for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      return token;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      throw error;
    }
  }, []);

  /**
   * Sends the push notification token to the backend for storage
   *
   * @param pushToken The token to be sent to the backend
   * @throws Error if the user is not authenticated or the API call fails
   */
  const sendTokenToBackend = useCallback(
    async (pushToken: string) => {
      if (!user) return;

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error("No access token available");
        }

        const response = await fetch(
          `${getBaseUrl()}/api/users/me/push-token`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ token: pushToken }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to update push token");
        }
      } catch (error) {
        console.error("Error sending push token to backend:", error);
        throw error;
      }
    },
    [user],
  );

  /**
   * Unregisters from push notifications
   *
   * On web platforms, unsubscribes from Web Push
   * On native platforms, placeholder for future implementation
   *
   * @returns Promise resolving to boolean indicating success
   */
  const unregisterPushNotifications = useCallback(async () => {
    if (Platform.OS === "web") {
      return unsubscribeFromWebPush();
    }
    // Add mobile unregistration logic here if needed
    return false;
  }, []);

  // Set up notification handlers when user is authenticated
  useEffect(() => {
    if (!user) return;

    let cleanup: (() => void) | undefined;
    let channel: BroadcastChannel | undefined;

    // Set up BroadcastChannel for web platform
    if (Platform.OS === "web" && typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("notification");
      channel.onmessage = (event) => {
        console.log("BroadcastChannel message received:", event.data);
        if (event.data?.type === "INCIDENTS_RELOAD") {
          // Invalidate all incident-related queries to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ["securityIncidents"] });
        }
      };
    }

    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        await sendTokenToBackend(token);

        // Set up notification handlers
        const receivedSubscription =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
            // Handle foreground notification here if needed
          });

        const responseSubscription =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("Notification response:", response);
            // Handle notification response here (e.g., navigate to incident)
          });

        // Cleanup subscriptions on unmount
        cleanup = () => {
          receivedSubscription.remove();
          responseSubscription.remove();
        };
      } catch (error) {
        console.error("Error in notification setup:", error);
      }
    };

    setupNotifications();

    return () => {
      if (cleanup) {
        cleanup();
      }
      if (channel) {
        channel.close();
      }
    };
  }, [user, registerForPushNotificationsAsync, sendTokenToBackend]);

  return {
    registerForPushNotificationsAsync,
    sendTokenToBackend,
    unregisterPushNotifications,
  };
};
