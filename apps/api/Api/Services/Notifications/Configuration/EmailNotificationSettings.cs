namespace Api.Services.Notifications.Configuration;

/// <summary>
/// Common configuration settings for email notifications.
/// </summary>
public class EmailNotificationSettings
{
    /// <summary>
    /// Gets or sets the default sender email address.
    /// </summary>
    public string DefaultSenderEmail { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the default sender name.
    /// </summary>
    public string DefaultSenderName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the base URL for the web application.
    /// This is used to construct the "Open In App" link.
    /// </summary>
    public string WebAppBaseUrl { get; set; } = string.Empty;
}