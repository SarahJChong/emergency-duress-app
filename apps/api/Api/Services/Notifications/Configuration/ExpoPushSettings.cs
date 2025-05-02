namespace Api.Services.Notifications.Configuration;

/// <summary>
/// Configuration settings for the Expo Push Notification Service.
/// </summary>
public class ExpoPushSettings
{
    /// <summary>
    /// Gets or sets the base URL for the Expo Push Service API.
    /// </summary>
    public string ApiUrl { get; set; } = "https://exp.host/--/api/v2/push/send";

    /// <summary>
    /// Gets or sets the access token used for authorization with Expo's Push Service (if required).
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// Gets or sets the timeout in seconds for push notification requests.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets whether to use production or development push notifications.
    /// </summary>
    public bool UseProduction { get; set; } = false;
}