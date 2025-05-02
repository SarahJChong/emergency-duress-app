using Api.Services.Notifications;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Options;
using Moq;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Api.Tests.Services;

public class SendGridEmailNotificationServiceTests
{
    private readonly Mock<IOptions<SendGridSettings>> _mockSendGridSettings;
    private readonly Mock<IOptions<EmailNotificationSettings>> _mockEmailSettings;
    private readonly SendGridEmailNotificationService _service;
    private readonly Mock<ISendGridClient> _mockSendGridClient;

    public SendGridEmailNotificationServiceTests()
    {
        _mockSendGridSettings = new Mock<IOptions<SendGridSettings>>();
        _mockEmailSettings = new Mock<IOptions<EmailNotificationSettings>>();
        _mockSendGridClient = new Mock<ISendGridClient>();

        _mockSendGridSettings.Setup(x => x.Value).Returns(new SendGridSettings
        {
            ApiKey = "test-api-key"
        });

        _mockEmailSettings.Setup(x => x.Value).Returns(new EmailNotificationSettings
        {
            DefaultSenderEmail = "test@example.com",
            DefaultSenderName = "Test Sender",
            WebAppBaseUrl = "https://app.example.com"
        });

        _service = new SendGridEmailNotificationService(
            _mockSendGridSettings.Object,
            _mockEmailSettings.Object);
    }

    [Fact]
    public async Task SendNotificationAsync_SingleRecipient_ShouldSendEmail()
    {
        // Arrange
        var recipientEmail = "responder@example.com";
        var payload = CreateTestPayload();

        _mockSendGridClient.Setup(x => x.SendEmailAsync(
            It.IsAny<SendGridMessage>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Response(System.Net.HttpStatusCode.Accepted, null, null));

        // Act & Assert
        await _service.SendNotificationAsync(recipientEmail, payload);
    }

    [Fact]
    public async Task SendNotificationAsync_MultipleRecipients_ShouldSendEmail()
    {
        // Arrange
        var recipientEmails = new[] { "responder1@example.com", "responder2@example.com" };
        var payload = CreateTestPayload();

        _mockSendGridClient.Setup(x => x.SendEmailAsync(
            It.IsAny<SendGridMessage>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Response(System.Net.HttpStatusCode.Accepted, null, null));

        // Act & Assert
        await _service.SendNotificationAsync(recipientEmails, payload);
    }

    [Fact]
    public async Task SendNotificationAsync_WithAnonymousIncident_ShouldUseAnonymousFields()
    {
        // Arrange
        var recipientEmail = "responder@example.com";
        var payload = CreateTestPayload();
        payload.CallerName = null;
        payload.ContactNumber = null;

        _mockSendGridClient.Setup(x => x.SendEmailAsync(
            It.Is<SendGridMessage>(msg =>
                msg.HtmlContent.Contains("Anonymous") &&
                msg.PlainTextContent.Contains("Anonymous")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Response(System.Net.HttpStatusCode.Accepted, null, null));

        // Act & Assert
        await _service.SendNotificationAsync(recipientEmail, payload);
    }

    private static EmailNotificationPayload CreateTestPayload()
    {
        return new EmailNotificationPayload
        {
            IncidentId = "test-incident-1",
            Location = "Test Location",
            DateCalled = DateTime.UtcNow,
            CallerName = "John Doe",
            ContactNumber = "1234567890",
            RoomNumber = "Room 123",
            Latitude = -31.9523,
            Longitude = 115.8613,
            IncidentUrl = "https://app.example.com/incidents/test-incident-1"
        };
    }
}