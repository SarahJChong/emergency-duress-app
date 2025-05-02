namespace Api.Services.Notifications.Models;

/// <summary>
/// Represents the payload for a push notification about an incident.
/// </summary>
public class PushNotificationPayload
{
    /// <summary>
    /// Gets or sets the title of the notification.
    /// </summary>
    public string Title { get; set; } = "Duress app alert";

    /// <summary>
    /// Gets or sets the body of the notification.
    /// </summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the URL to the incident record in the web app.
    /// </summary>
    public string WebAppUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the incident ID associated with this notification.
    /// </summary>
    public string IncidentId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the location name where the incident occurred.
    /// </summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets any additional data to be sent with the notification.
    /// </summary>
    public Dictionary<string, string> Data { get; set; } = new Dictionary<string, string>();
}