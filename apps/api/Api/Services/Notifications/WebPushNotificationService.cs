using System.Net;
using System.Net.Http.Headers;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WebPush;

namespace Api.Services.Notifications;

/// <summary>
/// Implementation of IPushNotificationService for Web Push notifications.
/// </summary>
public class WebPushNotificationService : IPushNotificationService
{
    private readonly ILogger<WebPushNotificationService> _logger;
    private readonly WebPushClient _webPushClient;
    private readonly WebPushNotificationSettings _settings;
    private readonly VapidDetails _vapidDetails;

    /// <summary>
    /// Initializes a new instance of the WebPushNotificationService.
    /// </summary>
    /// <param name="logger">The logger instance.</param>
    /// <param name="settings">The web push notification settings.</param>
    public WebPushNotificationService(
        ILogger<WebPushNotificationService> logger,
        IOptions<WebPushNotificationSettings> settings)
    {
        _logger = logger;
        _settings = settings.Value;
        _webPushClient = new WebPushClient();
        _vapidDetails = new VapidDetails(
            _settings.VapidSubject,
            _settings.VapidPublicKey,
            _settings.VapidPrivateKey
        );
    }

    /// <inheritdoc/>
    public async Task SendNotificationAsync(string deviceToken, PushNotificationPayload payload)
    {
        try
        {
            var subscription = DeserializeSubscription(deviceToken);
            var pushMessage = CreatePushMessage(payload);

            await SendWithRetryAsync(subscription, pushMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send web push notification to device {DeviceToken}", deviceToken);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task SendNotificationAsync(IEnumerable<string> deviceTokens, PushNotificationPayload payload)
    {
        var tasks = deviceTokens.Select(token => SendNotificationAsync(token, payload));
        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Sends a push notification with retry logic for transient errors
    /// </summary>
    /// <param name="subscription">The web push subscription details</param>
    /// <param name="message">The message payload to send</param>
    /// <returns>A task representing the asynchronous operation</returns>
    /// <remarks>
    /// Uses exponential backoff for retries, doubling the delay between attempts
    /// </remarks>
    private async Task SendWithRetryAsync(PushSubscription subscription, string message)
    {
        var attemptCount = 0;
        var delay = TimeSpan.FromSeconds(1);

        while (attemptCount < _settings.MaxRetryAttempts)
        {
            try
            {
                await _webPushClient.SendNotificationAsync(
                    subscription,
                    message,
                    _vapidDetails
                );
                return;
            }
            catch (WebPushException ex) when (IsTransientError(ex) && attemptCount < _settings.MaxRetryAttempts - 1)
            {
                attemptCount++;
                _logger.LogWarning(ex, "Retry attempt {AttemptCount} for web push notification", attemptCount);
                await Task.Delay(delay);
                delay *= 2; // Exponential backoff
            }
        }
    }

    /// <summary>
    /// Determines if a WebPushException represents a transient error that can be retried
    /// </summary>
    /// <param name="ex">The WebPushException to check</param>
    /// <returns>True if the error is transient (5xx or 429), false otherwise</returns>
    private static bool IsTransientError(WebPushException ex)
    {
        return (int)ex.StatusCode is >= 500 and <= 599 || ex.StatusCode == HttpStatusCode.TooManyRequests;
    }

    /// <summary>
    /// Deserializes a device token string into a PushSubscription object
    /// </summary>
    /// <param name="deviceToken">The device token string in format "endpoint|p256dh|auth"</param>
    /// <returns>A PushSubscription object containing the endpoint and keys</returns>
    /// <exception cref="ArgumentException">Thrown when the device token format is invalid</exception>
    private static PushSubscription DeserializeSubscription(string deviceToken)
    {
        try
        {
            var parts = deviceToken.Split('|');
            if (parts.Length != 3)
            {
                throw new ArgumentException("Invalid device token format", nameof(deviceToken));
            }

            return new PushSubscription(
                endpoint: parts[0],
                p256dh: parts[1],
                auth: parts[2]
            );
        }
        catch (Exception ex)
        {
            throw new ArgumentException("Failed to deserialize push subscription", nameof(deviceToken), ex);
        }
    }

    /// <summary>
    /// Creates a JSON push message from the notification payload
    /// </summary>
    /// <param name="payload">The notification payload containing title, body, and additional data</param>
    /// <returns>A JSON string containing the formatted push message</returns>
    private static string CreatePushMessage(PushNotificationPayload payload)
    {
        var notification = new
        {
            title = payload.Title,
            body = payload.Body,
            data = new
            {
                url = payload.WebAppUrl,
                incidentId = payload.IncidentId,
                locationName = payload.LocationName,
                additionalData = payload.Data
            }
        };

        return System.Text.Json.JsonSerializer.Serialize(notification);
    }
}