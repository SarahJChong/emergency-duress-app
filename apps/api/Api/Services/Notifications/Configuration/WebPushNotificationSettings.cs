namespace Api.Services.Notifications.Configuration;

/// <summary>
/// Configuration settings for Web Push notifications.
/// </summary>
public class WebPushNotificationSettings
{
    /// <summary>
    /// Gets or sets the VAPID public key used for web push subscriptions.
    /// </summary>
    public string VapidPublicKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the VAPID private key used for signing web push messages.
    /// </summary>
    public string VapidPrivateKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the subject URL for VAPID (mailto: or https:// URI).
    /// </summary>
    public string VapidSubject { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the time in seconds before a notification attempt times out.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets the maximum number of retry attempts for failed notifications.
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;
}