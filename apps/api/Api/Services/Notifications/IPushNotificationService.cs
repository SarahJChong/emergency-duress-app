using Api.Models;
using Api.Services.Notifications.Models;

namespace Api.Services.Notifications;

/// <summary>
/// Defines a contract for sending push notifications about incidents.
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// Sends a push notification about an incident to a specific device.
    /// </summary>
    /// <param name="deviceToken">The device token to send the notification to.</param>
    /// <param name="payload">The notification payload containing incident details.</param>
    /// <returns>A task representing the asynchronous send operation.</returns>
    Task SendNotificationAsync(string deviceToken, PushNotificationPayload payload);

    /// <summary>
    /// Sends a push notification about an incident to multiple devices.
    /// </summary>
    /// <param name="deviceTokens">The list of device tokens to send the notification to.</param>
    /// <param name="payload">The notification payload containing incident details.</param>
    /// <returns>A task representing the asynchronous send operation.</returns>
    Task SendNotificationAsync(IEnumerable<string> deviceTokens, PushNotificationPayload payload);
}