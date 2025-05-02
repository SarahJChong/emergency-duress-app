using Api.Models;
using Api.Services.Notifications;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WebPush;

namespace Api.Tests.Services;

public class WebPushNotificationServiceTests
{
    private readonly Mock<ILogger<WebPushNotificationService>> _loggerMock;
    private readonly WebPushNotificationSettings _settings;
    private const string TestP256dh = "BM3D4m3AZupAhBbvBMVYW-2OsCnv_GN-GcJVoZvRflwOu_NDcbdlc_XAvY8k8Gw3FSfzZMxIzxl3FQiADhobzOY";
    private const string TestAuth = "xL4GDhJYX0LaSqfohHr1hQ";
    private readonly WebPushNotificationService _service;

    public WebPushNotificationServiceTests()
    {
        _loggerMock = new Mock<ILogger<WebPushNotificationService>>();
        _settings = new WebPushNotificationSettings
        {
            VapidPublicKey = "BIN2Jc5Yg3a4vodebDfXSbTqpXJuBYyzwU6wXCxSBuCrPVWXvhbsk4Kz8-mnK1xQVdE7qGZLcQwXtMjbnhrcwMY",
            VapidPrivateKey = "pvt_key_test_only",
            VapidSubject = "mailto:test@example.com",
            TimeoutSeconds = 30,
            MaxRetryAttempts = 3
        };

        var options = Options.Create(_settings);
        _service = new WebPushNotificationService(_loggerMock.Object, options);
    }



    [Fact]
    public async Task SendNotificationAsync_InvalidToken_ThrowsArgumentException()
    {
        // Arrange
        var invalidToken = "invalid_token_format";
        var payload = new PushNotificationPayload
        {
            Title = "Test Alert",
            Body = "Test notification"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.SendNotificationAsync(invalidToken, payload));
    }

    [Fact]
    public async Task SendNotificationAsync_EmptyToken_ThrowsArgumentException()
    {
        // Arrange
        var payload = new PushNotificationPayload
        {
            Title = "Test Alert",
            Body = "Test notification"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.SendNotificationAsync(string.Empty, payload));
    }


}