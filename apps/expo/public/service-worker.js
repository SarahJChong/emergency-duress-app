/* eslint-disable no-restricted-globals */

/**
 * Handle incoming push events and display notifications
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      data: {
        url: data.data?.url,
        incidentId: data.data?.incidentId,
        locationName: data.data?.locationName,
        ...data.data?.additionalData,
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Error showing notification:", err);
  }
});

/**
 * Handle notification click events
 * Opens the incident details page when a user clicks the notification
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the URL from notification data
  const url = event.notification.data?.url;
  if (!url) return;

  // Focus on existing window if available, otherwise open a new one
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

/**
 * Handle service worker activation
 * Useful for cleanup of old caches if needed
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
