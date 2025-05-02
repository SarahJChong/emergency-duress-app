namespace Api.Services.Notifications;

using Api.Services.Notifications.Models;

/// <summary>
/// Defines a contract for sending email notifications about incidents.
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Sends an email notification about an incident.
    /// </summary>
    /// <param name="recipientEmail">The email address of the security responder.</param>
    /// <param name="payload">The notification payload containing incident details.</param>
    /// <returns>A task representing the asynchronous send operation.</returns>
    Task SendNotificationAsync(string recipientEmail, EmailNotificationPayload payload);

    /// <summary>
    /// Sends an email notification about an incident to multiple recipients.
    /// </summary>
    /// <param name="recipientEmails">The list of email addresses of the security responders.</param>
    /// <param name="payload">The notification payload containing incident details.</param>
    /// <returns>A task representing the asynchronous send operation.</returns>
    Task SendNotificationAsync(IEnumerable<string> recipientEmails, EmailNotificationPayload payload);
}