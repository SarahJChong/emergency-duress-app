namespace Api.Services.Notifications.Configuration;

/// <summary>
/// Configuration settings specific to SendGrid email service.
/// </summary>
public class SendGridSettings
{
    /// <summary>
    /// Gets or sets the SendGrid API key.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
}