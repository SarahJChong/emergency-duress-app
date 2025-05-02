using System.Text;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Api.Services.Notifications;

/// <summary>
/// Implements email notification service using SendGrid.
/// </summary>
public class SendGridEmailNotificationService : IEmailNotificationService
{
    private readonly SendGridClient _client;
    private readonly EmailNotificationSettings _emailSettings;

    /// <summary>
    /// Initializes a new instance of the <see cref="SendGridEmailNotificationService" /> class.
    /// </summary>
    /// <param name="sendGridSettings">The SendGrid configuration settings.</param>
    /// <param name="emailSettings">The email notification settings.</param>
    public SendGridEmailNotificationService(
        IOptions<SendGridSettings> sendGridSettings,
        IOptions<EmailNotificationSettings> emailSettings)
    {
        _client = new SendGridClient(sendGridSettings.Value.ApiKey);
        _emailSettings = emailSettings.Value;
    }

    /// <inheritdoc />
    public async Task SendNotificationAsync(string recipientEmail, EmailNotificationPayload payload)
    {
        var msg = CreateEmailMessage(recipientEmail, payload);
        await _client.SendEmailAsync(msg);
    }

    /// <inheritdoc />
    public async Task SendNotificationAsync(IEnumerable<string> recipientEmails, EmailNotificationPayload payload)
    {
        var msg = CreateEmailMessage(recipientEmails, payload);
        await _client.SendEmailAsync(msg);
    }

    /// <summary>
    /// Creates an email message for a single recipient
    /// </summary>
    /// <param name="recipientEmail">The email address of the recipient</param>
    /// <param name="payload">The notification payload containing the email content</param>
    /// <returns>A SendGridMessage configured for a single recipient</returns>
    private SendGridMessage CreateEmailMessage(string recipientEmail, EmailNotificationPayload payload)
    {
        return CreateEmailMessage([recipientEmail], payload);
    }

    /// <summary>
    /// Creates an email message for multiple recipients
    /// </summary>
    /// <param name="recipientEmails">List of recipient email addresses</param>
    /// <param name="payload">The notification payload containing the email content</param>
    /// <returns>A SendGridMessage configured for multiple recipients</returns>
    /// <remarks>
    /// Creates both HTML and plain text versions of the email content, with the HTML version
    /// including formatted text and clickable links, while the plain text version maintains readability
    /// without formatting.
    /// </remarks>
    private SendGridMessage CreateEmailMessage(IEnumerable<string> recipientEmails, EmailNotificationPayload payload)
    {
        var msg = new SendGridMessage();

        msg.SetFrom(new EmailAddress(_emailSettings.DefaultSenderEmail, _emailSettings.DefaultSenderName));
        msg.AddTos(recipientEmails.Select(email => new EmailAddress(email)).ToList());
        msg.SetSubject($"Duress call: {payload.Location}");

        var content = new StringBuilder();
        content.AppendLine($"<p><a href='{payload.IncidentUrl}'>Open In App</a></p>");
        content.AppendLine($"<p><strong>Date called:</strong> {payload.DateCalled:g}</p>");
        content.AppendLine($"<p><strong>Name:</strong> {payload.CallerName ?? "Anonymous"}</p>");
        content.AppendLine($"<p><strong>Contact number:</strong> {payload.ContactNumber ?? "Anonymous"}</p>");
        content.AppendLine($"<p><strong>Location:</strong> {payload.Location}</p>");

        if (!string.IsNullOrEmpty(payload.RoomNumber))
            content.AppendLine($"<p><strong>Room number:</strong> {payload.RoomNumber}</p>");

        if (payload.Latitude.HasValue && payload.Longitude.HasValue)
        {
            var googleMapsUrl = $"https://www.google.com/maps?q={payload.Latitude},{payload.Longitude}";
            content.AppendLine(
                $"<p><strong>GPS location:</strong> <a href='{googleMapsUrl}'>View on Google Maps</a></p>");
        }

        msg.HtmlContent = content.ToString();
        msg.PlainTextContent = content.ToString().Replace("<p>", "").Replace("</p>", "\n")
            .Replace("<strong>", "").Replace("</strong>", "")
            .Replace("<a href='", "").Replace("'>", ": ").Replace("</a>", "");

        return msg;
    }
}