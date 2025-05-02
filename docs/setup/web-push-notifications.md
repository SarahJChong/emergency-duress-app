# Web Push Notifications Setup

This guide explains how to set up and test web push notifications for the Emergency Duress Application.

## Prerequisites

1. Install the `web-push` CLI tool:

```bash
npm install -g web-push
```

2. Generate VAPID keys:

```bash
web-push generate-vapid-keys
```

3. Configure the environments:

   a. Configure the Expo app with the VAPID public key:

   ```env
   # In your Expo app's .env file
   EXPO_PUBLIC_VAPID_KEY=<your_public_key>
   ```

   b. Configure the API with the VAPID keys:

   ```json
   // In appsettings.json
   {
     "Notifications": {
       "WebPush": {
         "VapidPublicKey": "configured-via-environment",
         "VapidPrivateKey": "configured-via-environment",
         "VapidSubject": "configured-via-environment",
         "TimeoutSeconds": 30,
         "MaxRetryAttempts": 3
       }
     }
   }
   ```

   **Note:** The `VapidPublicKey` in the API must match the `EXPO_PUBLIC_VAPID_KEY` in the Expo app.

## Implementation Details

The web push notification system consists of several components:

1. **Service Worker (`public/service-worker.js`)**

   - Handles incoming push events
   - Displays notifications using the Web Notifications API
   - Handles notification clicks to open the relevant incident

2. **Web Push Module (`src/utils/webPushNotifications.ts`)**

   - Manages service worker registration
   - Handles push subscription
   - Formats subscription data for the backend

3. **Push Notifications Hook (`src/hooks/usePushNotifications.ts`)**
   - Automatically subscribes authenticated users
   - Works with both web and mobile platforms
   - Sends subscription tokens to the backend

## Running a Demo

To test web push notifications:

1. Start your application with HTTPS enabled (required for service workers):

   ```bash
   # If using a development certificate
   HTTPS=true npm start
   ```

2. Log in to the web application. You should see:

   - Service worker registration in the browser console
   - A notification permission request
   - Successful push subscription registration

3. To send a test notification using the web-push CLI:

   a. Extract the subscription details from your browser:

   ```javascript
   // In browser console
   navigator.serviceWorker.ready
     .then((reg) => reg.pushManager.getSubscription())
     .then((sub) => {
       console.log("Endpoint:", sub.endpoint);
       const p256dh = btoa(
         String.fromCharCode.apply(null, new Uint8Array(sub.getKey("p256dh")))
       );
       const auth = btoa(
         String.fromCharCode.apply(null, new Uint8Array(sub.getKey("auth")))
       );
       console.log("P256DH Key:", p256dh);
       console.log("Auth Key:", auth);
     });
   ```

   b. Use the web-push CLI to send a test notification:

   ```bash
   web-push send \
     --endpoint="<subscription_endpoint>" \
     --key="<p256dh_key>" \
     --auth="<auth_secret>" \
     --vapid-subject="mailto:your-email@example.com" \
     --vapid-pubkey="<your_vapid_public_key>" \
     --vapid-pvtkey="<your_vapid_private_key>" \
     --payload '{"title":"Test Alert","body":"This is a test notification","data":{"url":"/incidents/123"}}'
   ```

4. You should see the notification appear, and clicking it should navigate to the specified URL.

## Debugging

Common issues and solutions:

1. **Notification Permission Denied**

   - Reset notification permissions in browser settings
   - Check browser console for any permission-related errors

2. **Service Worker Not Registering**

   - Ensure the service worker file is in the correct location
   - Check browser console for registration errors
   - Verify that the site is served over HTTPS (required for service workers)

3. **Subscription Failed**
   - Verify VAPID configuration in both Expo app and API
   - Check browser console for subscription errors
   - Ensure the API is properly configured

## Browser Support

Web Push is supported in:

- Chrome (Desktop & Android)
- Firefox (Desktop & Android)
- Edge (Desktop)
- Safari 16+ (macOS & iOS)

Note: Some browsers may require HTTPS even in development. Use a local HTTPS certificate or enable insecure service workers in browser settings for testing.

## Security Considerations

1. VAPID keys should never be committed to source control
2. Always validate subscription tokens on the backend
3. Use proper configuration management for sensitive values
4. Implement proper token cleanup on user logout

## Additional Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Guide](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Web Push Book](https://web-push-book.gauntface.com/)
