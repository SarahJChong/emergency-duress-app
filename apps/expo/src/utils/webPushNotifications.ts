import { env } from "../env";

/**
 * Type representing a Web Push subscription token in the format expected by the backend
 */
export type WebPushSubscriptionToken = `${string}|${string}|${string}`;

/**
 * Converts a base64 string to Uint8Array for use with Web Push API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Formats a PushSubscription into the token format expected by the backend
 */
function formatSubscriptionToken(
  subscription: PushSubscription,
): WebPushSubscriptionToken {
  const { endpoint } = subscription;
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (!p256dh || !auth) {
    throw new Error("Invalid push subscription: missing required keys");
  }

  // Convert ArrayBuffer to base64 string using spread operator
  const p256dhArray = [...new Uint8Array(p256dh)];
  const authArray = [...new Uint8Array(auth)];

  const p256dhBase64 = btoa(String.fromCharCode(...p256dhArray));
  const authBase64 = btoa(String.fromCharCode(...authArray));

  return `${endpoint}|${p256dhBase64}|${authBase64}`;
}

/**
 * Checks if Web Push is supported in the current environment
 */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Registers the service worker for web push notifications
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  try {
    const registration =
      await navigator.serviceWorker.register("/service-worker.js");
    return registration;
  } catch (error) {
    throw new Error(
      `Failed to register service worker: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Subscribes to web push notifications
 * @returns The formatted subscription token for the backend
 * @throws {Error} If subscription fails or browser doesn't support web push
 */
export async function subscribeToWebPush(): Promise<WebPushSubscriptionToken> {
  if (!isWebPushSupported()) {
    throw new Error("Web Push is not supported in this browser");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  const registration = await registerServiceWorker();

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    // Request push subscription
    const convertedVapidKey = urlBase64ToUint8Array(env.EXPO_PUBLIC_VAPID_KEY);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  return formatSubscriptionToken(subscription);
}

/**
 * Unsubscribes from web push notifications
 * @returns true if unsubscription was successful
 */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  if (!isWebPushSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    return true;
  }

  return false;
}
