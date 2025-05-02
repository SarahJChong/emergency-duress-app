using System.Net;
using Api.Services.Notifications;
using Api.Services.Notifications.Configuration;
using Api.Services.Notifications.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;

namespace Api.Tests.Services;

public class ExpoPushNotificationServiceTests
{
    private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
    private readonly Mock<ILogger<ExpoPushNotificationService>> _mockLogger;
    private readonly ExpoPushSettings _settings;
    private readonly HttpClient _httpClient;

    public ExpoPushNotificationServiceTests()
    {
        _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        _mockLogger = new Mock<ILogger<ExpoPushNotificationService>>();
        _settings = new ExpoPushSettings
        {
            ApiUrl = "https://exp.host/--/api/v2/push/send",
            TimeoutSeconds = 30
        };

        _httpClient = new HttpClient(_mockHttpMessageHandler.Object)
        {
            BaseAddress = new Uri(_settings.ApiUrl)
        };
    }

    [Fact]
    public async Task SendNotificationAsync_SingleDevice_Success()
    {
        // Arrange
        var deviceToken = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";
        var payload = new PushNotificationPayload
        {
            Title = "Test Alert",
            Body = "Test Message",
            LocationName = "Test Location"
        };

        SetupMockHttpResponse(HttpStatusCode.OK, """{"data": {"status": "ok"}}""");

        var service = CreateService();

        // Act
        await service.SendNotificationAsync(deviceToken, payload);

        // Assert
        VerifyHttpRequest(Times.Once());
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Successfully sent")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendNotificationAsync_MultipleDevices_Success()
    {
        // Arrange
        var deviceTokens = new[]
        {
            "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
            "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]"
        };
        var payload = new PushNotificationPayload
        {
            Title = "Test Alert",
            Body = "Test Message",
            LocationName = "Test Location"
        };

        SetupMockHttpResponse(HttpStatusCode.OK, """{"data": {"status": "ok"}}""");

        var service = CreateService();

        // Act
        await service.SendNotificationAsync(deviceTokens, payload);

        // Assert
        VerifyHttpRequest(Times.Once());
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Successfully sent")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task SendNotificationAsync_ApiError_ThrowsException()
    {
        // Arrange
        var deviceToken = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";
        var payload = new PushNotificationPayload
        {
            Title = "Test Alert",
            Body = "Test Message"
        };

        SetupMockHttpResponse(HttpStatusCode.BadRequest, """{"errors": ["Invalid token"]}""");

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(() =>
            service.SendNotificationAsync(deviceToken, payload));

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Expo push notification failed")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    private ExpoPushNotificationService CreateService()
    {
        var mockOptions = new Mock<IOptions<ExpoPushSettings>>();
        mockOptions.Setup(x => x.Value).Returns(_settings);

        return new ExpoPushNotificationService(
            _httpClient,
            mockOptions.Object,
            _mockLogger.Object);
    }

    private void SetupMockHttpResponse(HttpStatusCode statusCode, string content)
    {
        _mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(content)
            });
    }

    private void VerifyHttpRequest(Times times)
    {
        _mockHttpMessageHandler
            .Protected()
            .Verify(
                "SendAsync",
                times,
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post &&
                    req.RequestUri.ToString().Contains("push/send")),
                ItExpr.IsAny<CancellationToken>());
    }
}